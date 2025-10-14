// Optimized prompt templates for token efficiency
export const PROMPT_TEMPLATES = {
  base: {
    name: "Basic App",
    template: `Build a single-file React app: {APP_IDEA}

REQUIREMENTS:
- Output only executable JSX (no markdown or commentary).
- Declare a single function component named App and end with 'export default App;'.
- Use React hooks instead of class components.
- Style with Tailwind CSS utility classes (the Tailwind CDN is already included).
- Use sample data so the UI renders instantly without external services.
- Only import from these globally available packages: react, react-dom, lucide-react, axios, framer-motion, marked, recharts, react-router-dom, react-spring.
- If you use framer-motion, import it with named imports like: import { motion } from 'framer-motion'.
- Do not reference packages that require installation or bundlers.
- Add basic loading and empty states for asynchronous sections.
{AI_FEATURES}

Return the full React source file:`
  },

  aiChat: {
    name: "AI Chat App",
    template: `Build a React chat app: {APP_IDEA}

REQUIREMENTS:
- Output only JSX with a default exported App component.
- Use useState and useEffect hooks for state and side effects.
- Layout with Tailwind CSS utilities for desktop and mobile.
- Provide a chat transcript, input box, submit handler, and loading/error UI.
- Use lucide-react icons for affordances when it improves clarity.
{AI_FEATURES}

Return the complete React component file:`
  },

  dashboard: {
    name: "Dashboard App", 
    template: `Build a React dashboard: {APP_IDEA}

REQUIREMENTS:
- Output JSX only with a default exported App component.
- Organize content with responsive Tailwind grids or flex layouts.
- Include at least one interactive panel (tabs, filters, or cards with state).
- Use lucide-react icons and Recharts sparingly when visualization is required.
- Provide static sample data arrays so the UI renders immediately.
{AI_FEATURES}

Return the complete source file:`
  },

  game: {
    name: "Interactive Game",
    template: `Build a small React game: {APP_IDEA}

REQUIREMENTS:
- Use a functional App component with hooks for state and effects.
- Track score or progress in state so the user can complete objectives.
- Handle user interaction via buttons, keyboard, or mouse events.
- Style with Tailwind CSS and add lightweight feedback animations (CSS or framer-motion).
- Keep all assets and data inline so the game works instantly.
{AI_FEATURES}

Return the full React component file:`
  },

  utility: {
    name: "Utility Tool",
    template: `Build a React utility: {APP_IDEA}

REQUIREMENTS:
- Provide a functional App component that exports by default.
- Accept user input, perform calculations or transformations, and show results instantly.
- Include validation or helper text when the user enters invalid data.
- Present content with Tailwind utility classes for a clean layout.
- Keep everything client-side with inline sample data.
{AI_FEATURES}

Return the full React source file:`
  }
};

export const AI_FEATURES_INJECTION = `
AI INTEGRATION:
- Define const GROQ_API_KEY = '{API_KEY}' once near the top (never log it).
- Create a helper such as async function sendGroqMessage(message) that calls fetch('https://api.groq.com/openai/v1/chat/completions', {...}).
- Pass model: '{MODEL_ID}' and a messages array that includes the user's request.
- Return the assistant text from response.choices[0].message.content.
- Track loading and error state so the UI stays responsive.
- When rendering AI markdown, import { marked } from 'marked' and use dangerouslySetInnerHTML with sanitized output.
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
