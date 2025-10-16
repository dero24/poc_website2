// Groq API service for code generation

const SUPPORTED_MODELS = [
  { id: 'groq/compound', label: 'Groq Compound · MCP Agent', capabilities: ['agentic', 'tool-use', 'mcp'], supportsTools: true },
  { id: 'groq/compound-mini', label: 'Groq Compound Mini · Fast MCP', capabilities: ['agentic', 'tool-use', 'mcp'], supportsTools: true },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B · Versatile', capabilities: ['agentic', 'analysis'], supportsTools: true },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B · Advanced', capabilities: ['agentic', 'tool-use'], supportsTools: true },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B · Balanced', capabilities: ['agentic', 'tool-use'], supportsTools: true },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B', capabilities: ['agentic'], supportsTools: true },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B', capabilities: ['agentic'], supportsTools: true },
  { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 · Creative', capabilities: ['agentic'], supportsTools: true },
  { id: 'qwen/qwen3-32b', label: 'Qwen3 32B · Multilingual', capabilities: ['agentic'], supportsTools: true },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B · Instant', capabilities: ['fast-draft'], supportsTools: false }
];

const DEFAULT_TOOL_REGISTRY = [
  { name: 'web-search', type: 'groq-builtin', enabled: true },
  { name: 'code-execution', type: 'groq-builtin', enabled: false },
  { name: 'browser', type: 'groq-builtin', enabled: false },
  { name: 'vision', type: 'groq-builtin', enabled: false }
];

const UNSAFE_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

function isSafeAssetUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (UNSAFE_PROTOCOLS.some((scheme) => lower.startsWith(scheme))) {
    return false;
  }
  if (lower.startsWith('http://')) {
    return false;
  }
  if (lower.startsWith('https://')) {
    return true;
  }
  if (lower.startsWith('/') || lower.startsWith('./') || lower.startsWith('../')) {
    return true;
  }
  return false;
}

function formatModelLabel(id = '') {
  if (!id) return 'Unknown Model';
  return id
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function ensureArray(payload) {
  if (!Array.isArray(payload)) {
    if (payload === undefined || payload === null) {
      return [];
    }
    return [payload];
  }
  return payload;
}

function makeTextSegment(text) {
  return { type: 'text', text: String(text ?? '') };
}

function normalizeMessage(message) {
  if (!message) {
    return null;
  }
  if (typeof message === 'string') {
    return {
      role: 'user',
      content: [makeTextSegment(message)]
    };
  }
  const role = message.role || 'user';
  if (Array.isArray(message.content)) {
    const normalizedSegments = message.content.map((segment) => {
      if (!segment) {
        return makeTextSegment('');
      }
      if (typeof segment === 'string') {
        return makeTextSegment(segment);
      }
      if (segment.type && segment.text) {
        return { type: segment.type, text: segment.text };
      }
      if (segment.type && segment.value !== undefined) {
        return { type: segment.type, value: segment.value };
      }
      if (segment.type && segment.content) {
        return { type: segment.type, content: segment.content };
      }
      if (segment.text !== undefined) {
        return makeTextSegment(segment.text);
      }
      return makeTextSegment(JSON.stringify(segment));
    });
    return { role, content: normalizedSegments };
  }
  if (typeof message.content === 'string') {
    return { role, content: [makeTextSegment(message.content)] };
  }
  return {
    role,
    content: [makeTextSegment('')]
  };
}

function collectTextFromContent(content) {
  return ensureArray(content)
    .map((segment) => {
      if (!segment) {
        return '';
      }
      if (typeof segment === 'string') {
        return segment;
      }
      if (segment.text !== undefined) {
        return segment.text;
      }
      if (segment.output_text !== undefined) {
        return segment.output_text;
      }
      if (segment.value !== undefined) {
        return typeof segment.value === 'string' ? segment.value : JSON.stringify(segment.value);
      }
      if (segment.content !== undefined) {
        return typeof segment.content === 'string' ? segment.content : JSON.stringify(segment.content);
      }
      return '';
    })
    .join('');
}

class GroqService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.modelCache = SUPPORTED_MODELS;
    this.toolRegistry = [...DEFAULT_TOOL_REGISTRY];
    this.lastRun = null;
  }

  formatModelDisplayName(id = '') {
    if (!id) return 'Unknown Model';
    
    // Handle special cases
    if (id.includes('compound')) {
      return id.includes('mini') ? 'Groq Compound Mini · Fast MCP' : 'Groq Compound · MCP Agent';
    }
    if (id.includes('gpt-oss')) {
      const size = id.includes('120b') ? '120B · Advanced' : '20B · Balanced';
      return `GPT-OSS ${size}`;
    }
    if (id.includes('llama-4')) {
      const variant = id.includes('maverick') ? 'Maverick' : 'Scout';
      return `Llama 4 ${variant} 17B`;
    }
    if (id.includes('llama-3.3')) {
      return 'Llama 3.3 70B · Versatile';
    }
    if (id.includes('llama-3.1')) {
      return 'Llama 3.1 8B · Instant';
    }
    if (id.includes('kimi')) {
      return 'Kimi K2 · Creative';
    }
    if (id.includes('qwen3')) {
      return 'Qwen3 32B · Multilingual';
    }
    
    // Default formatting
    return formatModelLabel(id);
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

  getToolRegistry() {
    return this.toolRegistry;
  }

  configureTools(registry) {
    if (Array.isArray(registry) && registry.length) {
      this.toolRegistry = registry.map((entry) => ({ ...entry }));
    }
  }

  async refreshModels() {
    if (!this.apiKey) {
      return this.modelCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Groq model list error (${response.status}): ${response.statusText}`);
      }

      const payload = await response.json();
      const models = Array.isArray(payload?.data)
        ? payload.data
            .filter((model) => {
              // Filter out non-text generation models
              const isTextModel = !model.id.includes('whisper') && 
                                 !model.id.includes('tts') && 
                                 !model.id.includes('guard') &&
                                 !model.id.includes('prompt-guard');
              return isTextModel;
            })
            .map((model) => {
              // Determine capabilities based on model characteristics
              const isMCP = model.id.includes('compound') || model.id.includes('gpt-oss');
              const isLarge = model.id.includes('120b') || model.id.includes('70b') || model.id.includes('32b');
              const isInstant = model.id.includes('instant') || model.id.includes('8b');
              
              let capabilities = [];
              if (isMCP) capabilities.push('agentic', 'tool-use', 'mcp');
              else if (isLarge) capabilities.push('agentic', 'analysis');
              else if (isInstant) capabilities.push('fast-draft');
              else capabilities.push('agentic');
              
              return {
                id: model.id,
                label: model.display_name || this.formatModelDisplayName(model.id),
                capabilities,
                supportsTools: isMCP || isLarge,
                owner: model.owned_by
              };
            })
        : [];

      if (models.length) {
        this.modelCache = models;
      } else {
        this.modelCache = SUPPORTED_MODELS;
      }
    } catch (error) {
      console.error('Failed to refresh Groq models:', error);
      this.modelCache = SUPPORTED_MODELS;
    }

    return this.modelCache;
  }

  resolveTools(preferredTools) {
    const source = Array.isArray(preferredTools) && preferredTools.length ? preferredTools : this.toolRegistry;
    return source
      .filter(Boolean)
      .map((entry) => ({
        ...entry,
        enabled: entry.enabled !== false
      }));
  }

  buildInputMessages({ systemPrompt, userPrompt, messages }) {
    const input = [];
    if (systemPrompt) {
      input.push({ role: 'system', content: [makeTextSegment(systemPrompt)] });
    }
    ensureArray(messages)
      .map(normalizeMessage)
      .filter(Boolean)
      .forEach((message) => input.push(message));
    if (userPrompt) {
      input.push({ role: 'user', content: [makeTextSegment(userPrompt)] });
    }
    return input;
  }

  extractCodeFromRun(runResult) {
    if (!runResult) {
      return '';
    }

    const fromArtifacts = ensureArray(runResult.artifacts).find((artifact) => {
      if (!artifact) return false;
      if (!artifact.mimeType) return false;
      return (
        artifact.mimeType.includes('javascript') ||
        artifact.mimeType.includes('jsx') ||
        artifact.mimeType.includes('text/plain') ||
        artifact.mimeType.includes('application/json')
      );
    });

    if (fromArtifacts) {
      try {
        if (typeof fromArtifacts.data === 'string') {
          const maybeParsed = JSON.parse(fromArtifacts.data);
          if (maybeParsed && typeof maybeParsed === 'object') {
            if (maybeParsed.code) {
              return this.sanitizeCode(maybeParsed.code);
            }
            if (maybeParsed.app?.code) {
              return this.sanitizeCode(maybeParsed.app.code);
            }
          }
        }
      } catch (error) {
        // ignore JSON parse errors and fall through
      }
      if (typeof fromArtifacts.data === 'string') {
        return this.sanitizeCode(fromArtifacts.data);
      }
    }

    if (runResult.finalText) {
      const trimmed = runResult.finalText.trim();
      if (trimmed) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            if (parsed.code) {
              return this.sanitizeCode(parsed.code);
            }
            if (parsed.app?.code) {
              return this.sanitizeCode(parsed.app.code);
            }
          }
        } catch (error) {
          // not JSON
        }
        return this.sanitizeCode(trimmed);
      }
    }

    const joinedMessages = ensureArray(runResult.messages)
      .map((msg) => msg?.text || '')
      .filter(Boolean)
      .join('\n');
    if (joinedMessages) {
      return this.sanitizeCode(joinedMessages);
    }

    return '';
  }

  extractPreviewManifest(runResult) {
    if (!runResult) {
      return null;
    }

    const warnings = [];

    const attemptSanitize = (candidate) => {
      if (!candidate || typeof candidate !== 'object') {
        return null;
      }

      const sanitizeHtmlSection = (section) => {
        if (!section || typeof section !== 'object') return undefined;
        const { head, body } = section;
        return {
          head: typeof head === 'string' ? head : undefined,
          body: typeof body === 'string' ? body : undefined
        };
      };

      const sanitizeAssetList = (items, allowedKeys) => {
        if (!Array.isArray(items)) return [];
        return items
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const entry = {};
            allowedKeys.forEach((key) => {
              if (item[key] !== undefined) {
                const value = item[key];
                if (typeof value === 'string' || typeof value === 'boolean') {
                  if ((key === 'src' || key === 'href') && typeof value === 'string') {
                    if (isSafeAssetUrl(value)) {
                      entry[key] = value;
                    } else {
                      warnings.push(`Removed unsafe URL: ${value}`);
                    }
                  } else {
                    entry[key] = value;
                  }
                }
              }
            });
            return Object.keys(entry).length ? entry : null;
          })
          .filter(Boolean);
      };

      const manifest = {
        html: sanitizeHtmlSection(candidate.html),
        styles: sanitizeAssetList(candidate.styles, ['href', 'rel', 'media', 'content']),
        scripts: sanitizeAssetList(candidate.scripts, ['src', 'type', 'content', 'async', 'defer', 'crossorigin', 'integrity']),
        entry: undefined
      };

      if (candidate.entry && typeof candidate.entry === 'object') {
        const { src, content, type, async, defer } = candidate.entry;
        const entry = {};
        if (typeof src === 'string') {
          if (isSafeAssetUrl(src)) {
            entry.src = src;
          } else {
            warnings.push(`Removed unsafe entry src: ${src}`);
          }
        }
        if (typeof content === 'string') entry.content = content;
        if (typeof type === 'string') entry.type = type;
        if (typeof async === 'boolean') entry.async = async;
        if (typeof defer === 'boolean') entry.defer = defer;
        if (Object.keys(entry).length) {
          manifest.entry = entry;
        }
      }

      if (!manifest.html && !manifest.styles.length && !manifest.scripts.length && !manifest.entry) {
        return null;
      }

      if (warnings.length) {
        manifest.warnings = warnings;
      }

      return manifest;
    };

    const artifacts = ensureArray(runResult.artifacts);
    for (const artifact of artifacts) {
      if (!artifact) continue;
      const possibleMime = artifact.mimeType || artifact.type || '';
      const looksJson = /json|manifest/i.test(possibleMime) || (artifact.name && /manifest/i.test(artifact.name));
      if (!looksJson) continue;
      const data = artifact.data;
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const sanitized = attemptSanitize(parsed?.previewManifest || parsed);
        if (sanitized) {
          return sanitized;
        }
      } catch (error) {
        // Ignore parse errors; try other sources
      }
    }

    const fromFinalText = runResult.finalText;
    if (typeof fromFinalText === 'string' && fromFinalText.trim()) {
      try {
        const parsed = JSON.parse(fromFinalText.trim());
        const sanitized = attemptSanitize(parsed?.previewManifest || parsed);
        if (sanitized) {
          return sanitized;
        }
      } catch (error) {
        // not JSON
      }
    }

    const joinedMessages = ensureArray(runResult.messages)
      .map((msg) => msg?.text || '')
      .filter(Boolean)
      .join('\n');
    if (joinedMessages) {
      try {
        const parsed = JSON.parse(joinedMessages);
        const sanitized = attemptSanitize(parsed?.previewManifest || parsed);
        if (sanitized) {
          return sanitized;
        }
      } catch (error) {
        // still not JSON
      }
    }

    return null;
  }

  async runAgenticWorkflow({
    systemPrompt,
    userPrompt,
    messages = [],
    modelId,
    tools,
    metadata = {},
    stream = false,
    responseFormat,
    requestParameters = {}
  }) {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const input = this.buildInputMessages({ systemPrompt, userPrompt, messages });
    const payload = {
      model: modelId || SUPPORTED_MODELS[0]?.id,
      input,
      tools: this.resolveTools(tools),
      stream: Boolean(stream),
      metadata,
      ...requestParameters
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    const endpoint = `${this.baseUrl}/chat/completions`;
    
    // Convert to standard OpenAI format
    const openaiPayload = {
      model: payload.model,
      messages: payload.input.map(msg => ({
        role: msg.role,
        content: msg.content.map(c => c.text).join('')
      })),
      stream: payload.stream,
      ...payload
    };
    
    // Remove non-OpenAI fields
    delete openaiPayload.input;
    delete openaiPayload.tools;
    delete openaiPayload.metadata;
    
    if (payload.stream) {
      return this.runAgenticWorkflowStream(endpoint, openaiPayload);
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openaiPayload)
    });

    if (!response.ok) {
      let details = '';
      try {
        const errorPayload = await response.json();
        details = errorPayload?.error?.message || errorPayload?.message || '';
      } catch (parseError) {
        details = response.statusText;
      }
      throw new Error(`Groq MCP error (${response.status}): ${details || 'Unexpected response'}`);
    }

    const data = await response.json();
    const normalized = this.normalizeOpenAIResponse(data, openaiPayload.model);
    this.lastRun = normalized;
    return normalized;
  }

  async runAgenticWorkflowStream(endpoint, payload) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...payload, stream: true })
    });

    if (!response.ok) {
      let details = '';
      try {
        const errorPayload = await response.json();
        details = errorPayload?.error?.message || errorPayload?.message || '';
      } catch (parseError) {
        details = response.statusText;
      }
      throw new Error(`Groq MCP stream error (${response.status}): ${details || 'Unexpected response'}`);
    }

    if (!response.body) {
      return { id: null, status: 'failed', messages: [], reasoning: [], toolCalls: [], artifacts: [], metadata: {}, raw: null };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const events = [];
    let done = false;

    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) {
        buffer += decoder.decode(chunk.value, { stream: true });
        let separatorIndex = buffer.indexOf('\n\n');
        while (separatorIndex !== -1) {
          const eventChunk = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          eventChunk
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('data:'))
            .forEach((line) => {
              const dataLine = line.slice(5).trim();
              if (!dataLine || dataLine === '[DONE]') {
                return;
              }
              try {
                const parsed = JSON.parse(dataLine);
                events.push(parsed);
              } catch (error) {
                events.push({ type: 'unknown', raw: dataLine });
              }
            });
          separatorIndex = buffer.indexOf('\n\n');
        }
      }
    }

    let finalPayload = null;
    for (const event of events) {
      if (event?.type === 'response.completed' && event?.response) {
        finalPayload = event.response;
      }
    }

    if (!finalPayload) {
      const fallback = events[events.length - 1]?.response;
      finalPayload = fallback || null;
    }

    const normalized = this.normalizeResponse(finalPayload || {}, payload.model, events);
    this.lastRun = normalized;
    return normalized;
  }

  normalizeOpenAIResponse(data, requestedModel) {
    if (!data || !data.choices || !data.choices[0]) {
      return {
        id: data?.id || null,
        status: 'failed',
        messages: [],
        finalText: '',
        reasoning: [],
        toolCalls: [],
        artifacts: [],
        metadata: { model: requestedModel || null, usage: data?.usage || null },
        raw: data
      };
    }

    const choice = data.choices[0];
    const content = choice.message?.content || '';
    
    return {
      id: data.id || null,
      status: 'completed',
      messages: [{ role: 'assistant', text: content }],
      finalText: content,
      reasoning: [],
      toolCalls: [],
      artifacts: [],
      metadata: {
        model: data.model || requestedModel || null,
        usage: data.usage || null
      },
      raw: data
    };
  }

  normalizeResponse(payload, requestedModel, streamEvents = []) {
    if (!payload) {
      return {
        id: null,
        status: 'failed',
        messages: [],
        finalText: '',
        reasoning: [],
        toolCalls: [],
        artifacts: [],
        metadata: { model: requestedModel || null, usage: null },
        raw: payload,
        streamEvents
      };
    }

    const output = ensureArray(payload.output || payload.outputs || payload.responses || []);
    const messages = [];
    const reasoning = [];
    const toolCalls = [];
    const artifacts = [];

    output.forEach((item) => {
      if (!item) {
        return;
      }
      if (item.type === 'message') {
        const text = collectTextFromContent(item.content);
        if (text) {
          messages.push({ role: item.role || 'assistant', text });
        }
        ensureArray(item.content).forEach((segment) => {
          if (segment?.type === 'tool_call') {
            toolCalls.push({
              id: segment.id || segment.call_id || null,
              name: segment.name || segment.tool_name || null,
              arguments: segment.arguments || segment.args || null,
              status: segment.status || 'pending'
            });
          }
        });
      } else if (item.type === 'tool_call' || item.type === 'tool-result' || item.type === 'tool_result') {
        reasoning.push({
          type: item.type,
          tool: item.tool_name || item.name || null,
          callId: item.call_id || item.id || null,
          status: item.status || null,
          result: item.result || item.output || item.content || null
        });
      } else if (item.type === 'artifact') {
        artifacts.push({
          id: item.id || null,
          mimeType: item.mime_type || item.mimetype || null,
          data: item.data || item.bytes || null,
          description: item.description || null
        });
      } else if (item.type === 'reasoning') {
        reasoning.push({
          type: item.type,
          content: item.content || item.text || null
        });
      } else if (item.type === 'message.delta' && item.delta) {
        const text = collectTextFromContent(item.delta.content);
        if (text) {
          messages.push({ role: item.delta.role || 'assistant', text });
        }
      } else {
        messages.push({ role: 'assistant', text: collectTextFromContent(item.content || item.text || '') });
      }
    });

    const finalText = (payload.output_text && payload.output_text.length)
      ? payload.output_text.join('\n')
      : messages.map((entry) => entry.text).join('\n');

    return {
      id: payload.id || null,
      status: payload.status || 'completed',
      messages,
      finalText: finalText.trim(),
      reasoning,
      toolCalls,
      artifacts,
      metadata: {
        model: payload.model || requestedModel || null,
        usage: payload.usage || null
      },
      raw: payload,
      streamEvents
    };
  }

  getLastRun() {
    return this.lastRun;
  }

  async generateCode(prompt, model = SUPPORTED_MODELS[0]?.id) {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const systemPrompt = 'You are an elite React architect building production-ready single-file React apps. Respond with working JSX code only—no markdown fences, no explanations.';

    const runResult = await this.runAgenticWorkflow({
      systemPrompt,
      userPrompt: prompt,
      modelId: model,
      tools: [],
      requestParameters: {
        temperature: 0.3
      }
    });

    const code = this.extractCodeFromRun(runResult);
    if (!code) {
      throw new Error('No code generated from Groq MCP response');
    }

    return code;
  }

  sanitizeCode(code) {
    if (!code) {
      return '';
    }

    let cleaned = code.replace(/```jsx?\n?/gi, '').replace(/```/g, '');

    let lines = cleaned
      .split('\n')
      .map((line) => line.replace(/\r$/, ''))
      .filter((line) => !line.trim().startsWith('import '));

    while (lines.length && !lines[0].trim()) {
      lines.shift();
    }
    while (lines.length && !lines[lines.length - 1].trim()) {
      lines.pop();
    }

    cleaned = lines.join('\n');

    let defaultExportName = null;

    cleaned = cleaned.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/g, (_, name) => {
      defaultExportName = name;
      return `function ${name}(`;
    });

    cleaned = cleaned.replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)\s*/g, (_, name) => {
      defaultExportName = name;
      return `class ${name} `;
    });

    cleaned = cleaned.replace(/export\s+default\s+const\s+([A-Za-z0-9_]+)\s*=\s*/g, (_, name) => {
      defaultExportName = name;
      return `const ${name} = `;
    });

    cleaned = cleaned.replace(/export\s+default\s+let\s+([A-Za-z0-9_]+)\s*=\s*/g, (_, name) => {
      defaultExportName = name;
      return `let ${name} = `;
    });

    cleaned = cleaned.replace(/export\s+default\s+\(/g, 'const GeneratedApp = (');

    cleaned = cleaned.replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;/g, (_, name) => {
      defaultExportName = name;
      return '';
    });

    cleaned = cleaned.replace(/export\s+default\s*;/g, '');

    const componentMatch =
      cleaned.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/) ||
      cleaned.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\(/) ||
      cleaned.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*function/);

    if (!defaultExportName && componentMatch) {
      defaultExportName = componentMatch[1];
    }

    if (!/const\s+GeneratedApp\s*=/.test(cleaned)) {
      if (defaultExportName) {
        cleaned = `${cleaned.trim()}\n\nconst GeneratedApp = ${defaultExportName};`;
      } else {
        cleaned = `${cleaned.trim()}\n\nconst GeneratedApp = () => <div />;`;
      }
    }

    return cleaned.trim();
  }

  validateCode(code) {
    if (!code) return false;
    const hasExport = /export\s+default/.test(code);
    const hasGeneratedApp = /const\s+GeneratedApp\s*=/.test(code);
    if (!hasExport && !hasGeneratedApp) return false;
    const componentPattern = /(function\s+\w+\s*\(|const\s+\w+\s*=\s*\(?\s*\w*\s*=>)/;
    const jsxPattern = /<\w+[\s>]/;
    return componentPattern.test(code) || jsxPattern.test(code);
  }
}

export default new GroqService();
