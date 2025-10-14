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

  getApiKey() {
    return this.apiKey;
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

    const raw = await this.#sendChatCompletion(prompt, model);
    if (!raw) {
      throw new Error('No code generated from Groq API');
    }
    return this.sanitizeCode(raw);
  }

  async generateIdeas(prompt, model = 'llama-3.1-70b-versatile') {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const raw = await this.#sendChatCompletion(prompt, model, {
      systemPrompt: 'You generate concise JSON arrays of app ideas. Output JSON only, no commentary.'
    });

    if (!raw) {
      throw new Error('Groq idea generation returned empty response');
    }

    return raw.trim();
  }

  sanitizeCode(code) {
    // Remove markdown code blocks
    let cleaned = code.replace(/```jsx?\s*/gi, '').replace(/```\s*/g, '');

    // Trim leading instructions that are not code
    const lines = cleaned.split('\n');
    while (lines.length && !lines[0].trim().match(/^(import|export|const|function|class|await|<)/)) {
      lines.shift();
    }

    cleaned = lines.join('\n').trim();

    // Replace invalid model references and common import mistakes
    cleaned = cleaned.replace(/moonshotai\/kimi-k2-instruct/gi, 'llama-3.1-70b-versatile');
    cleaned = cleaned.replace(/import\s+motion\s+from\s+'framer-motion'/g, "import { motion } from 'framer-motion'");

    if (!cleaned.includes('export default')) {
      const componentMatch = cleaned.match(/(?:function|const)\s+(\w+)/);
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
    
    // Check for balanced braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.warn('Code validation failed: unbalanced braces');
      return false;
    }

    return componentPattern.test(code) || jsxPattern.test(code);
  }

  async #sendChatCompletion(prompt, model, options = {}) {
    const systemPrompt = options.systemPrompt || 'You are an elite React developer. Output ONLY working React JSX code. No explanations, no markdown, no comments outside the code. The code must be immediately executable in a browser.';

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
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
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq generation error:', error);
      throw error;
    }
  }
}

export default new GroqService();
