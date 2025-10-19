// Optimized prompt templates for token efficiency
export const UNIFIED_SYSTEM_PROMPT = `You are Morphic Web's product strategist and principal React engineer. Translate any idea into a premium, production-ready React 18 single-file application that runs entirely in the browser. Strategize first, then code. Honor Morphic guardrails for accessibility, security, and aesthetics. Output ONLY clean React code—no markdown, no commentary, no placeholders.`;

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

export function buildUnifiedPrompt(appIdea, context = {}) {
  const guardrails = buildGuardrailRules(context.guardrails || {});
  const payload = {
    appIdea,
    persona: context.persona || 'Polished creative professional',
    desiredMood: context.desiredMood || guardrails.tone,
    aiExpectations: context.aiExpectations || ['Automation beyond chat', 'Context-aware recommendations', 'Markdown-capable responses when useful'],
    requestedModel: context.modelId || null,
    includeAI: context.includeAI !== false,
    guardrails
  };

  const contextJson = stringify(payload);

  return `APP IDEA:
${appIdea}

MORPHIC CONTEXT:
${contextJson}

DELIVERABLE REQUIREMENTS:
- Output a single, production-ready React 18 component file that runs entirely in the browser.
- Import only browser-safe globals (React, ReactDOM) from UMD/CDN bundles. Avoid bare module specifiers and ESM-only CDNs like esm.sh or skypack.
- Do not include commented planning, markdown sections, or blueprint prose—only executable code.
- Use Tailwind utility classes (assuming stylesheet already included) to craft gradients, glassmorphism, and responsive layouts with WCAG AA contrast. Prefer readable neutrals—for example \`text-gray-700\` on light surfaces and \`text-gray-200\` on dark surfaces—over washed-out grays.
- Use approved browser-friendly libraries (framer-motion, lucide-react, react-icons, recharts, axios, marked) only when they improve the experience and ensure they reference global objects when executed in the browser. Access them via globals such as \`const { motion } = (window.Motion || window.FramerMotion || {});\`, \`const { Send } = (window.lucideReact || window.LucideReact || window.lucide || {});\`, and \`const { LineChart } = (window.Recharts || {});\`. Never rely on import statements or ESM-only CDNs.
- Provide optimistic loading, error, and empty states for data/AI flows. Sanitize user inputs and never expose raw API keys.
- For Groq usage, set \`const groqKey = typeof window.getMorphicGroqKey === 'function' ? window.getMorphicGroqKey() : '';\`, show a user-friendly notice if \`!groqKey\`, and call \`fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer ${groqKey}\` }, body: JSON.stringify({ model: 'llama-3.1-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 600 }) })\`. Parse with \`const content = data?.choices?.[0]?.message?.content || ''\` and display graceful fallbacks if empty or on error.
- Export a default React component at the end of the file. No TODOs, no explanatory text, no markdown fences.`;
}

export const FALLBACK_CODE = `
import React, { useState } from 'react';

export default function FallbackApp() {
  const [message, setMessage] = useState('App generation failed - using fallback');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generation Error</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
`;
