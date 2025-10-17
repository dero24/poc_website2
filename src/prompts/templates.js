
const BLUEPRINT_SYSTEM_PROMPT = `You are Morphic Web's product strategist. Transform app ideas into detailed execution plans. Design layered experiences with AI behaviors, premium visuals, and thoughtful interactions using CDN-available packages only.`;

const IMPLEMENTATION_SYSTEM_PROMPT = `You are Morphic Web's React engineer. Build production-ready React 18 single-file apps from blueprints. Use ONLY CDN packages: React, Tailwind CSS, Framer Motion, Lucide, Recharts, Axios, Marked. Never reference npm packages. Render AI responses with Markdown. Keep code secure, accessible, complete.`;


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
- Single React 18 component file with CDN imports only.
- Use: React (https://unpkg.com/react@18), Tailwind (https://cdn.tailwindcss.com), Framer Motion (https://unpkg.com/framer-motion), Lucide (https://unpkg.com/lucide-react), Recharts (https://unpkg.com/recharts), Axios (https://unpkg.com/axios), Marked (https://unpkg.com/marked).
- AI calls: fetch with Bearer GROQ_API_KEY (global). Render responses with Markdown in styled containers.
- Premium UI: motion, glassmorphism, gradients, responsive. Include loading states, error handling.
- Complete, balanced code with proper exports. No TODOs or comments.`;

export const BLUEPRINT_PROMPTS = {
  system: BLUEPRINT_SYSTEM_PROMPT,
  template: BLUEPRINT_TEMPLATE
};

export const IMPLEMENTATION_PROMPTS = {
  system: IMPLEMENTATION_SYSTEM_PROMPT,
  template: IMPLEMENTATION_TEMPLATE
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

