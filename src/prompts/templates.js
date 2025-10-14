// Optimized prompt templates for token efficiency
const ALLOWED_IMPORTS = 'react, react-dom (via CDN), tailwindcss (global), lucide-react, axios, framer-motion, marked, recharts, react-router-dom, react-spring';

export const PROMPT_TEMPLATES = {
  base: {
    name: "Basic App",
    template: `Create a production-ready React 18 single-file app for {APP_IDEA}.

REQUIREMENTS:
- Output JSX only; declare function App() and finish with export default App.
- Use React hooks for all state/effects and Tailwind CSS utilities for layout, spacing, and color.
- Place every import at the top and restrict to ${ALLOWED_IMPORTS}. If you need icons or charts, use lucide-react and recharts from that list.
- Keep the experience self-contained with inline sample data. Never reference packages that require bundlers or npm install.
- Provide responsive sections, semantic HTML, accessible labels, and polished empty/loading states.
- When AI is appropriate, weave it naturally into the workflow (planners, generators, smart insights) instead of bolting on chat.
{AI_FEATURES}

Return the full source code:`
  },

  aiChat: {
    name: "AI Chat App",
    template: `Create a React 18 assistant for {APP_IDEA} that feels intentional and helpful.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, approved imports only).
- Present chat history, scrollable transcript, user input, send button, and keyboard submit handling.
- Display typing indicators, optimistic UI for user messages, and clear error banners when Groq fails.
- Define a concise system prompt/persona aligned to the app theme so responses remain on-task and safe.
- Include quick action buttons or prompt templates that showcase the assistant's specialty (e.g., planning, tutoring, analysis).
{AI_FEATURES}

Return JSX only:`
  },

  dashboard: {
    name: "Dashboard App",
    template: `Create a responsive insight dashboard for {APP_IDEA}.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, approved imports only).
- Use Tailwind grids/cards to present KPIs, tables, lists, and quick filters with hover/tap affordances.
- Supply realistic sample data arrays plus derived stats (totals, deltas, badges) so visuals feel alive offline.
- Include interactivity such as tabs, filters, or timeframe toggles with persisted state.
- If AI is included, have it generate summaries, action items, forecasts, or anomaly explanations—not free-form chat.
{AI_FEATURES}

Return JSX only:`
  },

  game: {
    name: "Interactive Game",
    template: `Create a delightful React mini-game for {APP_IDEA}.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, approved imports only).
- Track score, progress, and streaks in state. Provide restart/reset controls and celebratory feedback.
- Handle keyboard/mouse/touch input as appropriate. Use Tailwind transitions/utilities for moment-to-moment animation.
- Inline all assets (emoji, gradients, SVG snippets) so the game works instantly without fetches.
- If AI appears, let it drive adaptive hints, story narration, or content generation that matches the theme—never generic chat.
{AI_FEATURES}

Return JSX only:`
  },

  utility: {
    name: "Utility Tool",
    template: `Create a polished React utility for {APP_IDEA} that feels like a focused productivity aid.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, approved imports only).
- Accept structured user input, validate interactively, and surface computed results with clear labels.
- Provide helper text/tooltips explaining how calculations work, plus reset/clear actions.
- Handle edge cases gracefully with inline feedback (invalid numbers, missing selections, overflows).
- If AI is involved, let it augment the workflow (recommendations, synthesized briefs, generated assets) instead of generic chat.
{AI_FEATURES}

Return JSX only:`
  }
};

export const AI_FEATURES_INJECTION = `
GROQ USAGE:
- Only add AI logic when it meaningfully improves the experience. Do not ask the end user for keys—the environment injects them.
- Declare const GROQ_API_KEY = '{API_KEY}' once near the imports (never console.log it) and reuse the same helper for every call.
- Implement async function callGroq(messages) that POSTs to https://api.groq.com/openai/v1/chat/completions with fetch.
- Send model: '{MODEL_ID}', the provided messages array, and explicit parameters (temperature 0.6, max_tokens sized to the task).
- Wrap each call with loading/error state in React. Render AI output as safe text (or sanitized markdown with marked) and provide retries.
- Craft concise, domain-specific system/user prompts so the assistant behaves like the brain of the app (planners, analysts, storytellers, etc.).
- Store AI responses in state so the UI stays deterministic and supports undo/reset interactions.
`;

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

export function buildPrompt(template, appIdea, options = {}) {
  const normalized = typeof options === 'boolean'
    ? { includeAI: options }
    : (options ?? {});

  const {
    apiKey = '',
    modelId = '',
    includeAI = true
  } = normalized;

  let prompt = template.replace('{APP_IDEA}', appIdea);
  prompt = prompt.replace('{API_KEY}', apiKey || '[[GROQ_API_KEY]]');
  prompt = prompt.replace('{MODEL_ID}', modelId || 'groq-model');
  prompt = prompt.replace('{AI_FEATURES}', includeAI ? AI_FEATURES_INJECTION : '');
  return prompt;
}
