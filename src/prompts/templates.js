// Dynamic prompt builder: produce a single masterful prompt that instructs Groq to return
// a preview-ready HTML fragment following the ESM+CDN importmap+module contract.
export function buildDynamicPrompt(appIdea, options = {}) {
  const {
    apiKey = '',
    modelId = 'groq-model',
    includeAI = true,
    preferredLib = 'preact',
    uiStyle = 'clean'
  } = options || {};

  const GROQ_KEY_PLACEHOLDER = apiKey ? apiKey : '[[GROQ_API_KEY]]';

  // Stronger contract: require styling, open-source ESM packages, and functional UX
  const contract = `CONTRACT:\n- Return ONLY a single HTML FRAGMENT (no prose, no markdown).\n- Fragment MUST include a top-level <div id=\"app\"></div>, an optional <script type=\"importmap\"> block, and exactly one <script type=\"module\"> entry that mounts into #app.\n- If UMD/global libs are needed, include <script src=\"...\"></script> before the module entry and comment the global name inside the module entry.\n- Pin all CDN versions and avoid floating tags.\n- Use only open-source ESM-compatible packages and prefer importmap mappings to ESM CDN entries.\n- The fragment MUST include self-contained styling (Tailwind via CDN or inline styles) and explicitly set readable text color (e.g., class=\"text-slate-900\" or style=\"color:#0f172a\") so text is dark and accessible.\n- Ensure accessible contrast (WCAG AA) and responsive layout.\n- Do not include secrets; use ${GROQ_KEY_PLACEHOLDER} as a placeholder for any API keys.\n`;

  const uiHints = `UI HINTS:\n- Produce a compact, responsive UI using ${preferredLib} and Tailwind (via CDN) if styling is needed.\n- Deliver accessible controls, loading/error states, and small sample data so the app runs instantly.\n- Keep code under 200 lines when possible. Style preference: ${uiStyle}.\n`;

  const aiHints = includeAI
    ? `AI HINTS:\n- If AI calls are required, call https://api.groq.com/openai/v1/chat/completions and reference the key as ${GROQ_KEY_PLACEHOLDER}.\n- Provide robust loading and error handling for external API calls.\n`
    : '';

  // Encourage AI-driven apps to use Groq responses as backend logic
  const aiBackendHints = includeAI
    ? `AI BACKEND HINTS:\n- When building AI-driven features, treat Groq responses as the app's backend logic: parse model outputs into structured data, use optimistic UI for speed, cache responses where helpful, and surface human-friendly errors.\n- Include a small helper function (comments ok) showing how the runtime will inject ${GROQ_KEY_PLACEHOLDER} into a fetch to Groq.\n- Example helper (use placeholder key):\n  async function callGroq(payload){\n    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {\n      method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': ` + "`Bearer ${GROQ_KEY_PLACEHOLDER}`" + ` }, body: JSON.stringify(payload) });\n    return res.json();\n  }\n`
    : '';

  const idea = `APP IDEA:\n${appIdea}\n`;

  const example = `EXAMPLE SHAPE:\n<div id=\"app\" class=\"min-h-screen w-full bg-white text-slate-900\"></div>\n<script type=\"importmap\">{ "imports": { "preact": "https://cdn.jsdelivr.net/npm/preact@10.16.1/+esm" } }</script>\n<script type=\"module\">/* module entry imports from importmap and mounts into #app */</script>\n`;

  return [contract, uiHints, aiHints, aiBackendHints, idea, example].filter(Boolean).join('\n\n');
}

export const FALLBACK_CODE = `
import React, { useState } from 'react';

export default function FallbackApp() {
  const [message] = useState('App generation failed - using fallback');
  
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
