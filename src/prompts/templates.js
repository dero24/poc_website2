// Optimized prompt templates for token efficiency
export const PROMPT_TEMPLATES = {
  base: {
    name: "Basic App",
    template: `Create a React app: {APP_IDEA}

STRICT RULES:
- Output ONLY working React JSX code
- Use React hooks, no class components
- Include all imports at top
- Use Tailwind CSS for styling
- Make it responsive and beautiful
- No markdown, no explanations
- Single functional component export
- Browser-compatible only
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
AI CAPABILITIES AVAILABLE:
- Groq API key pre-configured
- Chat completion endpoint: /api/groq/chat
- Image generation: /api/groq/image
- Text analysis: /api/groq/analyze
- Use fetch() to call endpoints
- Handle responses with async/await
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

export function buildPrompt(template, appIdea, includeAI = false) {
  let prompt = template.replace('{APP_IDEA}', appIdea);
  prompt = prompt.replace('{AI_FEATURES}', includeAI ? AI_FEATURES_INJECTION : '');
  return prompt;
}
