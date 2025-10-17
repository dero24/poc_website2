
const BLUEPRINT_SYSTEM_PROMPT = `You are Morphic Web's product design strategist. Your mission is to translate a short app idea into a rich execution plan that will delight end users. Think like a creative director, UX lead, and AI systems architect collaborating together. Build layered experiences with purposeful AI behaviors, sophisticated visuals, and thoughtful interactions, all grounded in open-source browser-friendly tooling.`;

const IMPLEMENTATION_SYSTEM_PROMPT = `You are Morphic Web's principal front-end engineer. You receive a structured blueprint and guardrails from strategy. Your job is to construct a flawless, production-ready React 18 single-file experience that matches the blueprint and Morphic guardrails precisely. Favor Tailwind, Framer Motion, Lucide, Recharts, and other CDN-available packages; render AI responses elegantly using Markdown; keep everything secure, accessible, and polished.`;

const ENHANCEMENT_SYSTEM_PROMPT = `You are Morphic Web's senior experience director. You are given the current React implementation, the original blueprint, and refinement goals. Evolve the code to feel even more premium, add thoughtful AI-powered touches, upgrade motion and theming, and ensure every interaction feels intentional. Produce a fully updated React file—no commentary.`;

const BLUEPRINT_TEMPLATE = `APP IDEA: {APP_IDEA}

MORPHIC CONTEXT:
{CONTEXT_JSON}

TASK:
- Produce JSON only.
- Follow this schema exactly:
{
  "summary": string,
  "audience": string,
  "valueProp": string,
  "visualStyle": {
    "themeWords": string[],
    "animationNotes": string,
    "colorGuidance": string
  },
  "sections": [
    {
      "id": string,
      "title": string,
      "purpose": string,
      "components": [
        {
          "type": string,
          "description": string,
          "aiSupport": string,
          "interactions": string[]
        }
      ]
    }
  ],
  "state": [
    {
      "name": string,
      "type": string,
      "initial": string,
      "description": string
    }
  ],
  "aiBehaviors": [
    {
      "name": string,
      "intent": string,
      "trigger": string,
      "input": string,
      "output": string,
      "markdown": boolean
    }
  ],
  "assets": [
    {
      "package": string,
      "cdn": string,
      "reason": string
    }
  ],
  "premiumPatterns": string[],
  "requiresMarkdown": boolean,
  "needsEnhancement": boolean,
  "successCriteria": string[]
}

- Ensure every string value is populated.
- Use concise yet expressive language.
- Set requiresMarkdown true when any AI response is multi-line or formatted.
- Set needsEnhancement true when additional polish pass would materially upgrade the experience.`;

const IMPLEMENTATION_TEMPLATE = `APP BLUEPRINT JSON:
{BLUEPRINT_JSON}

PROTECTED RULES:
[[PROTECTED_RULES]]
{GUARDRAILS_JSON}
[[/PROTECTED_RULES]]

DELIVERABLE:
- Return a single React 18 component file.
- Place all imports at top; use only CDN-available libraries listed in guardrails or blueprint assets.
- Ensure AI behaviors call Groq via fetch with Bearer GROQ_API_KEY (provided globally).
- Render any AI text using Markdown (marked or react-markdown) wrapped in elegant styled containers.
- Implement sections and components exactly as described, with premium motion, glassmorphism, gradients, and responsive layouts.
- Include fallback UI, loading states, and error handling for each AI action.
- No TODOs, comments, or placeholders. Ship production-ready JSX only.`;

const ENHANCEMENT_TEMPLATE = `CURRENT BLUEPRINT JSON:
{BLUEPRINT_JSON}

CURRENT IMPLEMENTATION:
{CURRENT_CODE}

PROTECTED RULES:
[[PROTECTED_RULES]]
{GUARDRAILS_JSON}
[[/PROTECTED_RULES]]

MISSION:
- Upgrade the app to feel even more premium and intelligent without regressing functionality.
- Tighten animations, reinforce theme words, add delightful micro-interactions, and expand AI behaviors where beneficial.
- Address any success criteria not yet satisfied.
- Return the full updated React file—no commentary.`;

export const BLUEPRINT_PROMPTS = {
  system: BLUEPRINT_SYSTEM_PROMPT,
  template: BLUEPRINT_TEMPLATE
};

export const IMPLEMENTATION_PROMPTS = {
  system: IMPLEMENTATION_SYSTEM_PROMPT,
  template: IMPLEMENTATION_TEMPLATE
};

export const ENHANCEMENT_PROMPTS = {
  system: ENHANCEMENT_SYSTEM_PROMPT,
  template: ENHANCEMENT_TEMPLATE
};

export function buildGuardrailRules(options = {}) {
  const {
    appIdea = '',
    tone = ['futuristic', 'glassmorphic', 'elevated'],
    accessibility = ['WCAG AA contrast', 'motion-safe fallbacks'],
    cdnPackages = ['tailwindcss', 'framer-motion', 'lucide-react', 'recharts', 'axios', 'marked'],
    aiPrinciples = ['AI must deliver purposeful automation', 'Do not prompt users for API keys', 'Render AI responses in Markdown']
  } = options;

  return {
    appIdea,
    tone,
    accessibility,
    cdnPackages,
    aiPrinciples,
    markdownRenderer: 'marked via CDN or react-markdown',
    stylingExpectations: 'Layered gradients, glassmorphism, multi-level depth, micro-interactions, responsive grid design',
    security: ['Sanitize user input', 'Never leak GROQ_API_KEY', 'Validate external content before rendering']
  };
}

function stringify(value) {
  return JSON.stringify(value, null, 2);
}

export function buildBlueprintPrompt(appIdea, context = {}) {
  const guardrails = buildGuardrailRules(context.guardrails || {});
  const payload = {
    appIdea,
    theme: context.theme || 'futuristic-premium',
    persona: context.persona || 'General creative professional',
    enabledTools: context.enabledTools || [],
    desiredMood: context.desiredMood || ['luxury', 'confident', 'intelligent'],
    aiExpectations: context.aiExpectations || ['Automation over simple chat', 'Context-aware recommendations', 'Markdown formatted responses'],
    guardrails
  };

  return BLUEPRINT_TEMPLATE
    .replace('{APP_IDEA}', appIdea)
    .replace('{CONTEXT_JSON}', stringify(payload));
}

export function buildImplementationPrompt(blueprint, context = {}) {
  const guardrails = buildGuardrailRules(context.guardrails || {});
  return IMPLEMENTATION_TEMPLATE
    .replace('{BLUEPRINT_JSON}', stringify(blueprint))
    .replace('{GUARDRAILS_JSON}', stringify(guardrails));
}

export function buildEnhancementPrompt(blueprint, currentCode, context = {}) {
  const guardrails = buildGuardrailRules(context.guardrails || {});
  return ENHANCEMENT_TEMPLATE
    .replace('{BLUEPRINT_JSON}', stringify(blueprint))
    .replace('{CURRENT_CODE}', currentCode)
    .replace('{GUARDRAILS_JSON}', stringify(guardrails));
}
