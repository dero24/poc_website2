// Optimized prompt templates for token efficiency
export const PROMPT_TEMPLATES = {
  base: {
    name: "Basic App",
    template: `Create a React app: {APP_IDEA}

STRICT RULES:
- Use React hooks, never class components.
- Include all imports at top. Output ONLY working React JSX (no markdown or commentary).
- Make it breathtaking: modern, responsive, animated interactions, thoughtful UX microcopy.
- Ship a single functional component export with complete state, handlers, and sample data so it runs instantly in-browser.
- Never prompt the user for API keys. Environment already supplies one.
- If AI logic is needed, declare const GROQ_API_KEY = '{API_KEY}' once and reuse it securely. Never expose or log the key.
- When AI should drive experiences, call Groq's REST API with model '{MODEL_ID}' using the authorization header Bearer \${GROQ_API_KEY}. Harness Groq reasoning for decision-making (not just chat UIs) to deliver intelligent outcomes that delight users.
- Follow Morphic guardrails: sanitize inputs, prevent prompt injection, clearly label AI actions, and fail gracefully.
- Inject smart automation when appropriate (e.g., scheduling, recommendations, predictive insights) so users are impressed and the experience feels magical.
- Showcase polished visual design using Tailwind or inline styles with gradients, depth, micro-animations, accessible color contrast, and mobile-first layouts.
- Respect user intent: the app must fulfill the idea precisely while over-delivering via creative features and AI augmentation.
- Write modular helper functions as needed but keep everything within a single file.
- For AI-powered controls (buttons, sliders, forms), wire interactions through Groq so outputs feel purposeful and contextual.
- Ensure no TODOs, placeholders, or comments remain. All data and logic must be production-ready.
- Assume the preview iframe runs sandboxed. Do not use unsupported imports; rely on browser-safe CDNs.
{AI_FEATURES}

Return complete working code with nothing else:`
  },

  aiChat: {
    name: "AI Chat App",
    template: `Create React chat app: {APP_IDEA}

REQUIREMENTS:
- Working React JSX only
- Use useState, useEffect hooks
- Groq API integration with key: {API_KEY}
- Chat interface with messages
- Send/receive functionality
- Tailwind CSS styling
- Mobile responsive
{AI_FEATURES}

API endpoint available: /api/groq/chat
Return complete code:`
  },

  dashboard: {
    name: "Dashboard App", 
    template: `Create React dashboard: {APP_IDEA}

SPECS:
- Modern dashboard layout
- Charts/graphs if needed
- Sidebar navigation
- Responsive grid system
- Tailwind CSS + Lucide icons
- Working React hooks
- No external data calls
{AI_FEATURES}

Output working JSX:`
  },

  game: {
    name: "Interactive Game",
    template: `Create React game: {APP_IDEA}

GAME RULES:
- Interactive gameplay
- Score tracking
- Game state management
- Keyboard/mouse controls
- Animated elements
- Tailwind CSS styling
- React hooks only
{AI_FEATURES}

Return playable code:`
  },

  utility: {
    name: "Utility Tool",
    template: `Create React utility: {APP_IDEA}

UTILITY SPECS:
- Functional tool interface
- Input/output handling
- Real-time calculations
- Clean, minimal design
- Form validation
- Tailwind CSS
- React hooks
{AI_FEATURES}

Output working tool:`
  }
};

export const AI_FEATURES_INJECTION = `
GROQ USAGE NOTES:
- Wire helper functions that call https://api.groq.com/openai/v1/chat/completions.
- Use fetch with headers { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${GROQ_API_KEY}\` }.
- Send the selected model '{MODEL_ID}' alongside any messages payload.
- Guard calls with loading and error states and only invoke them when the user workflow requires AI.
- Never request or display the API key to the user.
- Example fetch call:
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GROQ_API_KEY}\`
    },
    body: JSON.stringify({
      model: '{MODEL_ID}',
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7
    })
  });
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
