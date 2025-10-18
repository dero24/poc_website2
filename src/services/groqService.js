// Groq API service for code generation
import {
  buildBlueprintPrompt,
  buildImplementationPrompt,
  BLUEPRINT_PROMPTS,
  IMPLEMENTATION_PROMPTS
} from '../prompts/templates.js';
import { PREVIEW_MANIFEST_PROMPTS, buildPreviewManifestPrompt } from '../prompts/previewManifestPrompts.js';

const SUPPORTED_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B · Versatile', capabilities: ['agentic', 'analysis'], supportsTools: false },
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B · Versatile', capabilities: ['agentic', 'analysis'], supportsTools: false },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B · Instant', capabilities: ['fast-draft'], supportsTools: false },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B · Advanced', capabilities: ['agentic'], supportsTools: false },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B · Balanced', capabilities: ['agentic'], supportsTools: false },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B', capabilities: ['agentic'], supportsTools: false },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B', capabilities: ['agentic'], supportsTools: false },
  { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 · Creative', capabilities: ['agentic'], supportsTools: false },
  { id: 'qwen/qwen3-32b', label: 'Qwen3 32B · Multilingual', capabilities: ['agentic'], supportsTools: false },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B · Efficient', capabilities: ['agentic'], supportsTools: false },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B · Instruct', capabilities: ['agentic'], supportsTools: false }
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
    this.lastRun = null;
  }

  formatModelDisplayName(id = '') {
    if (!id) return 'Unknown Model';

    // Handle special cases
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
    if (id.includes('llama-3.1-70b')) {
      return 'Llama 3.1 70B · Versatile';
    }
    if (id.includes('llama-3.1-8b')) {
      return 'Llama 3.1 8B · Instant';
    }
    if (id.includes('kimi')) {
      return 'Kimi K2 · Creative';
    }
    if (id.includes('qwen3')) {
      return 'Qwen3 32B · Multilingual';
    }
    if (id.includes('mixtral-8x7b')) {
      return 'Mixtral 8x7B · Efficient';
    }
    if (id.includes('gemma2-9b')) {
      return 'Gemma 2 9B · Instruct';
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

  normalizeAgentResponse(result) {
    // Normalize responses API format to match expected structure
    if (!result) return null;

    return {
      finalText: result.output || result.content || '',
      reasoning: result.reasoning || [],
      toolCalls: result.tool_calls || [],
      metadata: result.metadata || {},
      artifacts: result.artifacts || [],
      messages: result.messages || []
    };
  }

  extractCodeFromRun(runResult) {
    if (!runResult) {
      return '';
    }

    const targetModel = runResult?.metadata?.model || runResult?.metadata?.requestedModel || runResult?.metadata?.modelId || null;

    // Filter out thinking blocks from the final text
    let finalText = runResult.finalText || '';
    if (typeof finalText === 'string') {
      // Remove thinking blocks that start with <think> and end with </think>
      finalText = finalText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      // Also remove any remaining thinking content that might not be properly tagged
      finalText = finalText.replace(/^[\s\S]*?(?=function\s+\w+|const\s+\w+\s*=|export\s+default|^\s*$)/m, '').trim();
    }
    runResult.finalText = finalText;

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
              return this.enforceModelInCode(this.sanitizeCode(maybeParsed.code), targetModel);
            }
            if (maybeParsed.app?.code) {
              return this.enforceModelInCode(this.sanitizeCode(maybeParsed.app.code), targetModel);
            }
          }
        }
      } catch (error) {
        // ignore JSON parse errors and fall through
      }
      if (typeof fromArtifacts.data === 'string') {
        return this.enforceModelInCode(this.sanitizeCode(fromArtifacts.data), targetModel);
      }
    }

    if (runResult.finalText) {
      const trimmed = runResult.finalText.trim();
      if (trimmed) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            if (parsed.code) {
              return this.enforceModelInCode(this.sanitizeCode(parsed.code), targetModel);
            }
            if (parsed.app?.code) {
              return this.enforceModelInCode(this.sanitizeCode(parsed.app.code), targetModel);
            }
          }
        } catch (error) {
          // not JSON
        }
        return this.enforceModelInCode(this.sanitizeCode(trimmed), targetModel);
      }
    }

    const joinedMessages = ensureArray(runResult.messages)
      .map((msg) => msg?.text || '')
      .filter(Boolean)
      .join('\n');
    if (joinedMessages) {
      return this.enforceModelInCode(this.sanitizeCode(joinedMessages), targetModel);
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
    metadata = {},
    stream = false,
    responseFormat,
    requestParameters = {}
  }) {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const input = this.buildInputMessages({ systemPrompt, userPrompt, messages });
    const endpoint = `${this.baseUrl}/chat/completions`;

    // Convert to standard OpenAI format
    const openaiPayload = {
      model: modelId || SUPPORTED_MODELS[0]?.id,
      messages: input.map((msg) => ({
        role: msg.role,
        content: msg.content.map((c) => c.text).join('')
      })),
      stream: Boolean(stream),
      ...requestParameters
    };

    if (responseFormat) {
      openaiPayload.response_format = responseFormat;
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
      throw new Error(`Groq API error (${response.status}): ${details || 'Unexpected response'}`);
    }

    const data = await response.json();
    const normalized = this.normalizeOpenAIResponse(data, openaiPayload.model);
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

  extractJsonFromRun(run) {
    if (!run) {
      return null;
    }

    const tryParse = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        let trimmed = value.trim();
        if (!trimmed) return null;

        // Remove common code fences like ```json ... ```
        if (/^```/m.test(trimmed)) {
          trimmed = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
        }

        // Attempt to locate first JSON object within the string if direct parse fails
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        const candidate = jsonMatch ? jsonMatch[0] : trimmed;

        try {
          return JSON.parse(candidate);
        } catch (error) {
          return null;
        }
      }
      if (typeof value === 'object') {
        return value;
      }
      return null;
    };

    const candidates = [];
    if (typeof run.finalText === 'string') {
      candidates.push(run.finalText);
    }
    ensureArray(run.messages).forEach((message) => {
      if (message && typeof message.text === 'string') {
        candidates.push(message.text);
      }
    });
    if (run.raw) {
      ensureArray(run.raw.output_text).forEach((entry) => candidates.push(entry));
      ensureArray(run.raw.output).forEach((entry) => {
        if (entry?.content) {
          candidates.push(collectTextFromContent(entry.content));
        }
        if (typeof entry?.result === 'string') {
          candidates.push(entry.result);
        }
      });
    }
    ensureArray(run.artifacts).forEach((artifact) => {
      if (artifact?.data) {
        candidates.push(artifact.data);
      }
    });

    for (const candidate of candidates) {
      const parsed = tryParse(candidate);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }

    return null;
  }

  sanitizeBlueprint(rawBlueprint) {
    if (!rawBlueprint || typeof rawBlueprint !== 'object') {
      return null;
    }

    // Some responses wrap the blueprint inside another object (e.g., { blueprint: {...} })
    const blueprint = (() => {
      if (rawBlueprint.blueprint && typeof rawBlueprint.blueprint === 'object') {
        return rawBlueprint.blueprint;
      }
      if (rawBlueprint.data && typeof rawBlueprint.data === 'object' && rawBlueprint.data.blueprint) {
        return rawBlueprint.data.blueprint;
      }
      if (rawBlueprint.plan && typeof rawBlueprint.plan === 'object') {
        return rawBlueprint.plan;
      }
      return rawBlueprint;
    })();

    if (!blueprint || typeof blueprint !== 'object') {
      return null;
    }

    const toArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value].filter(Boolean);
    };

    const coerceString = (value, fallback = '') => {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      return fallback;
    };

    const cleanComponents = (components) =>
      toArray(components).map((component, index) => ({
        type: coerceString(component?.type, `Component${index + 1}`),
        description: coerceString(component?.description, ''),
        aiSupport: coerceString(component?.aiSupport, ''),
        interactions: toArray(component?.interactions).map((item) => coerceString(item, '').toString()).filter(Boolean)
      }));

    const cleanSections = toArray(blueprint.sections).map((section, index) => ({
      id: coerceString(section?.id, `section-${index + 1}`),
      title: coerceString(section?.title, `Section ${index + 1}`),
      purpose: coerceString(section?.purpose, ''),
      components: cleanComponents(section?.components)
    }));

    const cleanState = toArray(blueprint.state).map((stateItem, index) => ({
      name: coerceString(stateItem?.name, `state${index}`),
      type: coerceString(stateItem?.type, 'string'),
      initial: coerceString(stateItem?.initial, ''),
      description: coerceString(stateItem?.description, '')
    }));

    const cleanAiBehaviors = toArray(blueprint.aiBehaviors).map((behavior, index) => ({
      name: coerceString(behavior?.name, `AI Behavior ${index + 1}`),
      intent: coerceString(behavior?.intent, ''),
      trigger: coerceString(behavior?.trigger, ''),
      input: coerceString(behavior?.input, ''),
      output: coerceString(behavior?.output, ''),
      markdown: Boolean(behavior?.markdown)
    }));

    const cleanAssets = toArray(blueprint.assets).map((asset, index) => ({
      package: coerceString(asset?.package, `asset-${index + 1}`),
      cdn: coerceString(asset?.cdn, ''),
      reason: coerceString(asset?.reason, '')
    }));

    return {
      summary: coerceString(blueprint.summary, ''),
      audience: coerceString(blueprint.audience, ''),
      valueProp: coerceString(blueprint.valueProp, ''),
      visualStyle: {
        themeWords: toArray(blueprint.visualStyle?.themeWords).map((item) => coerceString(item, '')).filter(Boolean),
        animationNotes: coerceString(blueprint.visualStyle?.animationNotes, ''),
        colorGuidance: coerceString(blueprint.visualStyle?.colorGuidance, '')
      },
      sections: cleanSections,
      state: cleanState,
      aiBehaviors: cleanAiBehaviors,
      assets: cleanAssets,
      premiumPatterns: toArray(blueprint.premiumPatterns).map((item) => coerceString(item, '')).filter(Boolean),
      requiresMarkdown: Boolean(blueprint.requiresMarkdown),
      needsEnhancement: Boolean(blueprint.needsEnhancement),
      successCriteria: toArray(blueprint.successCriteria).map((item) => coerceString(item, '')).filter(Boolean)
    };
  }

  extractBlueprintFromRun(run) {
    const parsed = this.extractJsonFromRun(run);
    return this.sanitizeBlueprint(parsed);
  }

  async generateBlueprint({ appIdea, context = {}, modelId = 'llama-3.1-70b-versatile', requestParameters = {} }) {
    if (!appIdea?.trim()) {
      throw new Error('App idea is required to generate a blueprint');
    }

    const prompt = buildBlueprintPrompt(appIdea, context);
    const run = await this.runAgenticWorkflow({
      systemPrompt: BLUEPRINT_PROMPTS.system,
      userPrompt: prompt,
      modelId,
      metadata: {
        stage: 'blueprint',
        appIdea,
        guardrails: context.guardrails || null
      },
      requestParameters: {
        temperature: 0.2,
        ...requestParameters
      }
    });

    const blueprint = this.extractBlueprintFromRun(run);
    if (!blueprint) {
      throw new Error('Failed to parse blueprint from Groq response');
    }

    return { run, blueprint };
  }

  async generateImplementation({ blueprint, context = {}, modelId = 'llama-3.1-70b-versatile', requestParameters = {} }) {
    if (!blueprint) {
      throw new Error('Blueprint data is required before implementation');
    }

    const prompt = buildImplementationPrompt(blueprint, context);
    const run = await this.runAgenticWorkflow({
      systemPrompt: IMPLEMENTATION_PROMPTS.system,
      userPrompt: prompt,
      modelId,
      metadata: {
        stage: 'implementation',
        summary: blueprint.summary || '',
        themeWords: blueprint.visualStyle?.themeWords || []
      },
      requestParameters: {
        temperature: 0.3,
        ...requestParameters
      }
    });

    return { run };
  }

  async generatePreviewManifestStrict({ code, context = {}, modelId = 'llama-3.1-70b-versatile', requestParameters = {} }) {
    if (!code || !code.trim()) {
      throw new Error('Code is required to generate a preview manifest');
    }

    const userPrompt = buildPreviewManifestPrompt(code, context);
    const run = await this.runAgenticWorkflow({
      systemPrompt: PREVIEW_MANIFEST_PROMPTS.system,
      userPrompt,
      modelId,
      metadata: { stage: 'preview-manifest' },
      responseFormat: { type: 'json_object' },
      requestParameters: {
        temperature: 0.1,
        ...requestParameters
      }
    });

    const manifest = this.extractPreviewManifest(run);
    if (!manifest) {
      throw new Error('Failed to produce a valid preview manifest');
    }
    return { run, manifest };
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
      requestParameters: {
        temperature: 0.3
      }
    });

    const code = this.extractCodeFromRun(runResult);
    if (!code) {
      throw new Error('No code generated from Groq response');
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

    // Replace API key literals with runtime injection helper
    cleaned = cleaned.replace(/(['"])gsk_[A-Za-z0-9]+\1/g, 'getMorphicGroqKey()');
    cleaned = cleaned.replace(/const\s+GROQ_API_KEY\s*=\s*(['"])[^'"\n]+\1/g, 'const GROQ_API_KEY = getMorphicGroqKey();');
    cleaned = cleaned.replace(/process\.env\.GROQ_API_KEY/g, 'getMorphicGroqKey()');

    if (!/function\s+getMorphicGroqKey\s*\(/.test(cleaned)) {
      cleaned = `function getMorphicGroqKey() {\n  const readKey = (context) => {\n    if (!context) return '';\n    if (context.__MORPHIC_GROQ_KEY__) {\n      return context.__MORPHIC_GROQ_KEY__;
    }\n    try {\n      if (context.localStorage) {\n        const stored = context.localStorage.getItem('groq-api-key');\n        if (stored) return stored;\n      }\n    } catch (err) {\n      // ignore storage access errors\n    }\n    return '';\n  };\n  if (typeof window !== 'undefined') {\n    const direct = readKey(window);\n    if (direct) return direct;\n    if (window.parent && window.parent !== window) {\n      const parentKey = readKey(window.parent);\n      if (parentKey) return parentKey;\n    }\n  }\n  return '';\n}\n\n${cleaned}`;
    }

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

  enforceModelInCode(code, modelId) {
    if (!code || !modelId) {
      return code;
    }

    const safeModel = modelId.replace(/`/g, '');

    const replaceModelLiteral = (match, quote) => `${quote}${safeModel}${quote}`;

    let updated = code
      .replace(/model\s*:\s*['"]([^'"\n]+)['"]/g, (full, existing) => {
        return full.replace(existing, safeModel);
      })
      .replace(/const\s+GROQ_MODEL\s*=\s*(['"])([^'"\n]+)\1/g, (full, quote) => `const GROQ_MODEL = ${quote}${safeModel}${quote}`)
      .replace(/const\s+SELECTED_MODEL\s*=\s*(['"])([^'"\n]+)\1/g, (full, quote) => `const SELECTED_MODEL = ${quote}${safeModel}${quote}`)
      .replace(/['"]groq\/compound['"]/g, (full) => replaceModelLiteral(full[0], full[0]))
      .replace(/['"]meta-llama\/llama-3\.1-70b-versatile['"]/g, (full) => replaceModelLiteral(full[0], full[0]));

    // If code references MODEL_ID placeholder, ensure it is set to selected model
    updated = updated.replace(/const\s+MODEL_ID\s*=\s*(['"])[^'"\n]+\1/g, (full, quote) => `const MODEL_ID = ${quote}${safeModel}${quote}`);

    return updated;
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
