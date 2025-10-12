// Optimized prompt templates for token efficiency
export const PROMPT_TEMPLATES = {
  base: {
    name: "Basic App",
    template: `Create a React app: {APP_IDEA}

STRICT RULES:
- Use React hooks, no class components
- Include all imports at top
- Make it responsive and beautiful
- Single functional component export
- Browser-compatible
- Output ONLY working React JSX code (no markdown or commentary).
- Provide complete state, handlers, and sample data so the app runs instantly in the browser.
- Never prompt the user for API keys. The environment already supplies one.
- Declare const GROQ_API_KEY = '{API_KEY}' once and reuse it.
- When the experience requires AI, call Groq's REST API with model '{MODEL_ID}' using the authorization header Bearer \${GROQ_API_KEY}.
- Do not expose or log the API key.
{AI_FEATURES}

Return complete working code:`
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
- Use fetch with headers { 'Content-Type': 'application/json', 'Authorization': \`Bearer ${GROQ_API_KEY}\` }.
- Send the selected model '{MODEL_ID}' alongside any messages payload.
- Guard calls with loading and error states and only invoke them when the user workflow requires AI.
- Never request or display the API key to the user.
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
  const { apiKey = '', modelId = '' } = options;
  let prompt = template.replace('{APP_IDEA}', appIdea);
  prompt = prompt.replace('{API_KEY}', apiKey || '[[GROQ_API_KEY]]');
  prompt = prompt.replace('{MODEL_ID}', modelId || 'groq-model');
  prompt = prompt.replace('{AI_FEATURES}', AI_FEATURES_INJECTION);
  return prompt;
}
