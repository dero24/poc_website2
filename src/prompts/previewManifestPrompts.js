// Build a strict prompt asking Groq to emit a Preview Manifest in JSON only.
// The model MUST respond with valid JSON: { "scripts": [{"url":"...","global":"...","critical":false}], "bindings": "..." }

export function buildPreviewManifestPrompt(code = '') {
  const snippet = String(code || '').slice(0, 14000); // keep under token limits
  return `You are a build system that outputs ONLY strict JSON. No prose. No markdown. The JSON must parse directly with JSON.parse().

Analyze the following React application code (single-file JSX). Identify any CDN scripts needed to run it inside a non-module Babel sandbox with global variables. Also provide any JS bindings needed to map imports to window globals.

Return a JSON object with exactly these keys:
{
  "scripts": [
    { "url": "https://...", "global": "GlobalNameIfAnyOrNull", "critical": false }
  ],
  "bindings": "const { motion, AnimatePresence } = window; ..."
}

Rules:
- Include React and ReactDOM only if missing (the host usually injects them) but it's safe to duplicate.
- Prefer UMD builds from unpkg/jsdelivr for React, ReactDOM, Axios, Recharts, Framer Motion, Marked, PropTypes, Lucide React.
- Never include npm or node-only packages; use browser CDNs only.
- "bindings" must be plain JavaScript statements (no backticks), safe to prepend before the user's code to create globals.
- Do NOT include comments in the JSON or the JS string.

Here is the code to analyze:
<CODE>
${snippet}
</CODE>`;
}

export default { buildPreviewManifestPrompt };
