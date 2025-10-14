// Optimized prompt templates for token efficiency
const ALLOWED_IMPORTS = 'react, react-dom (already provided via CDN) and Tailwind CSS classes';

export const PROMPT_TEMPLATES = {
  base: {
    name: "Basic App",
    template: `Build a single-file React 18 app for {APP_IDEA}.

REQUIREMENTS:
- Output JSX only; declare function App() and end with export default App.
- Use React hooks and Tailwind CSS utilities for layout and styling.
- Keep all data client-side with sample objects; avoid API calls unless using Groq.
- Do not import packages beyond ${ALLOWED_IMPORTS}. Implement icons/visuals with Tailwind, emoji, or inline SVG.
- Provide responsive sections, accessible labels, loading and empty states.
{AI_FEATURES}

Return the full source code:`
  },

  aiChat: {
    name: "AI Chat App",
    template: `Build a React 18 chat assistant for {APP_IDEA}.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, no extra imports).
- Include chat history, user message input, submit handler, and scrolling transcript.
- Show typing/loading indicators and friendly error messages when Groq fails.
- Design the AI persona to act as a focused expert for this domain (planner, tutor, analyst, etc.).
- Keep prompts grounded in the app's mission so replies stay on-topic and actionable.
{AI_FEATURES}

Return JSX only:`
  },

  dashboard: {
    name: "Dashboard App",
    template: `Build a responsive dashboard for {APP_IDEA}.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, no extra imports).
- Use Tailwind grids/cards to present metrics, lists, and quick filters.
- Provide sample data arrays and derived stats (totals, trends, badges) without external APIs.
- Offer interactive affordances (tab/filter state) and empty-state messaging.
- When AI is included, have it generate insights, summaries, or action plans instead of generic chat.
{AI_FEATURES}

Return JSX only:`
  },

  game: {
    name: "Interactive Game",
    template: `Build a miniature React game for {APP_IDEA}.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, no extra imports).
- Track score/progress in state and reset/restart flows.
- Handle keyboard or button input and provide win/lose feedback plus animations using Tailwind transitions.
- Inline any assets (emoji, gradients); no external fetches.
- Optional AI features should enhance gameplay (e.g., adaptive hints, story narration), not default chat.
{AI_FEATURES}

Return JSX only:`
  },

  utility: {
    name: "Utility Tool",
    template: `Build a React utility for {APP_IDEA}.

REQUIREMENTS:
- Follow the base rules (hooks + Tailwind, App component, no extra imports).
- Accept user inputs, validate them, and display computed results instantly.
- Explain how calculations work via helper text/tooltips and include reset/clear actions.
- Cover edge cases with helpful messages (e.g., invalid numbers, missing selections).
- If AI is involved, let it augment the workflow (e.g., generate recommendations, craft summaries) rather than default chat.
{AI_FEATURES}

Return JSX only:`
  }
};

export const AI_FEATURES_INJECTION = `
GROQ USAGE:
- Only add AI calls when the experience clearly needs them.
- Declare const GROQ_API_KEY = '{API_KEY}' near the imports (never log or expose it).
- Implement async function callGroq(messages) that POSTs to https://api.groq.com/openai/v1/chat/completions with fetch.
- Send model: '{MODEL_ID}' and an array of { role, content } messages; use temperature 0.6.
- Manage loading/error state in React, and render responses as plain text (no unsanitized HTML).
- Keep prompts concise and domain-specific so replies stay focused on the app's task.
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
