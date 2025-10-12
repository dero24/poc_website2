// Groq API service for code generation

const FALLBACK_MODELS = [
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B · General Purpose' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B · Fast Drafts' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B · Creative' },
  { id: 'mixtral-8x22b-32768', label: 'Mixtral 8x22B · High Fidelity' },
  { id: 'gemma-7b-it', label: 'Gemma 7B · Instruction Tuned' }
];

function formatModelLabel(id = '') {
  if (!id) return 'Unknown Model';
  return id
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

class GroqService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.modelCache = FALLBACK_MODELS;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  getAvailableModels() {
    return this.modelCache;
  }

  async refreshModels() {
    if (!this.apiKey) {
      return this.modelCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Groq model list error (${response.status}): ${response.statusText}`);
      }

      const payload = await response.json();
      const models = Array.isArray(payload?.data)
        ? payload.data
            .filter((model) => {
              if (!model?.id) return false;
              if (model?.type && model.type !== 'chat.completions') return false;
              if (model?.capabilities && !model.capabilities.includes('chat.completions')) {
                return false;
              }
              return true;
            })
            .map((model) => ({
              id: model.id,
              label: model.display_name || formatModelLabel(model.id)
            }))
        : [];

      if (models.length) {
        this.modelCache = models;
      } else {
        console.warn('Groq returned no chat-capable models; using fallback list.');
        this.modelCache = FALLBACK_MODELS;
      }
    } catch (error) {
      console.error('Failed to refresh Groq models:', error);
      this.modelCache = FALLBACK_MODELS;
    }

    return this.modelCache;
  }

  async generateCode(prompt, model = 'llama-3.1-70b-versatile') {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an elite React developer. Output ONLY working React JSX code. No explanations, no markdown, no comments outside the code. The code must be immediately executable in a browser.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
          stream: false
        })
      });

      if (!response.ok) {
        let details = '';
        try {
          const error = await response.json();
          details = error?.error?.message || error?.message || '';
        } catch (jsonError) {
          details = response.statusText;
        }
        throw new Error(`Groq API error (${response.status}): ${details || 'Unexpected response'}`);
      }

      const data = await response.json();
      const generatedCode = data.choices[0]?.message?.content;

      if (!generatedCode) {
        throw new Error('No code generated from Groq API');
      }

      return this.sanitizeCode(generatedCode);
    } catch (error) {
      console.error('Groq generation error:', error);
      throw error;
    }
  }

  sanitizeCode(code) {
    // Remove markdown code blocks
    let cleaned = code.replace(/```jsx?\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any explanatory text before/after code
    const lines = cleaned.split('\n');
    let startIndex = 0;
    let endIndex = lines.length - 1;

    // Find first import or function/const declaration
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().match(/^(import|export|function|const|class)/)) {
        startIndex = i;
        break;
      }
    }

    // Find last meaningful code line
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() && !lines[i].trim().startsWith('//')) {
        endIndex = i;
        break;
      }
    }

    cleaned = lines.slice(startIndex, endIndex + 1).join('\n');

    // Ensure it has a default export
    if (!cleaned.includes('export default')) {
      // Try to find the main component and add export
      const componentMatch = cleaned.match(/function\s+(\w+)/);
      if (componentMatch) {
        cleaned += `\n\nexport default ${componentMatch[1]};`;
      }
    }

    return cleaned.trim();
  }

  validateCode(code) {
    if (!code) return false;

    const hasExport = /export\s+default/.test(code);
    if (!hasExport) return false;

    const componentPattern = /(function\s+\w+\s*\(|const\s+\w+\s*=\s*\(?\s*\w*\s*=>)/;
    const jsxPattern = /<\w+[\s>]/;

    return componentPattern.test(code) || jsxPattern.test(code);
  }
}

export default new GroqService();
