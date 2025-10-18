# Dynamic Package Auto‑Injection for App Preview

## Summary
This document defines a robust, dynamic preview system that:
- Parses each generated React app to detect the exact packages and CDN URLs it uses.
- Rewrites imports/exports into globals so the code runs inside a sandboxed iframe without bundling.
- Injects the minimal set of CDN scripts in the correct order (React first), then optional libs.
- Provides comprehensive shims (fallbacks) to keep rendering stable even if a CDN fails.
- Optionally runs a final LLM pass to emit a Preview Manifest when static detection is uncertain.

This replaces the fixed allowlist approach and eliminates race conditions and missing API errors like `forwardRef` and `oneOfType`.


## Current Problems (excluding `poc_website2/`)
- **Hard‑coded package lists** in `src/components/LivePreview.jsx` cause mismatch with the actual generated code.
- **Race conditions**: optional CDNs (e.g., framer‑motion) may load after code runs, producing `React.forwardRef` errors.
- **Missing APIs**: no PropTypes shim → `PropTypes.oneOfType` error; partial framer‑motion shim.
- **No code rewriting**: generated apps with ESM imports cannot run in a non‑module, Babel-only sandbox without import resolution.
- **Mixed strategies**: sometimes globals, sometimes ESM; no unified normalization step.


## High‑Level Approach
1. **Detect dependencies from code**
   - Parse import statements (bare specifiers and full CDN URLs).
   - Heuristically detect global usage (e.g., `motion.div`, `AnimatePresence`, `<Lucide />`, `LineChart`).

2. **Normalize the app code**
   - Strip `import`/`export` lines.
   - Create local bindings from window globals, e.g. `const { motion, AnimatePresence } = window;` and `const { useState } = React;`.
   - Ensure a default render target exists: `var App = App || GeneratedApp || DefaultApp;`.

3. **Build a precise preview HTML**
   - Always load React, ReactDOM, Babel, Tailwind (in that order).
   - Inject detected optional CDNs (framer‑motion, lucide‑react, recharts, axios, marked, prop‑types, etc.).
   - Add a small fallback script that defines safe shims when a CDN fails.

4. **Initialize safely**
   - Wait for React and ReactDOM before executing the transformed app code.
   - Bridge errors back to parent with clear messages.

5. **Optional last‑mile LLM pass**
   - When static detection is ambiguous (unknown packages or ESM‑only CDNs), ask Groq to emit a Preview Manifest (CDN list + globals) for this code. Enforce output rules so we can inject it directly.


## Low‑Level Design

### 1) Static package detection
Use simple parsing first (fast and dependency‑free). Fall back to the LLM manifest for edge cases.

```js
function detectPackages(code) {
  const registry = {
    'react': [/\bReact\b/, /from\s+['"]react['"]/],
    'react-dom': [/\bReactDOM\b/, /from\s+['"]react-dom['"]/],
    'framer-motion': [/from\s+['"]framer-motion['"\)]/, /\bmotion\./, /\bAnimatePresence\b/],
    'lucide-react': [/from\s+['"]lucide-react['"\)]/, /<\s*Lucide[\s>]/],
    'recharts': [/from\s+['"]recharts['"\)]/, /\b(LineChart|BarChart|PieChart|XAxis|YAxis|AreaChart)\b/],
    'axios': [/from\s+['"]axios['"\)]/, /\baxios\./],
    'marked': [/from\s+['"]marked['"\)]/, /\bmarked\./],
    'prop-types': [/from\s+['"]prop-types['"\)]/, /\bPropTypes\./]
  };

  // Always include React and ReactDOM
  const detected = new Set(['react', 'react-dom']);

  for (const [pkg, tests] of Object.entries(registry)) {
    if (tests.some(r => r.test(code))) detected.add(pkg);
  }

  // Collect any direct CDN URLs: import ... from 'https://...'
  const cdnImports = Array.from(code.matchAll(/from\s+['"](https?:\/\/[^'"\s]+)['"]/g))
    .map(m => m[1]);

  return { packages: Array.from(detected), cdnImports };
}
```

### 2) Code normalization (imports → globals)
Transform the app so it runs in a non‑module Babel block with globals.

Rules:
- Remove `import ... from 'react'` and emit `const React = window.React; const { useState, useEffect } = React;`.
- Remove `import { motion } from 'framer-motion'` and emit `const { motion, AnimatePresence } = window;`.
- Map `import { ... } from 'recharts'` to `const { ... } = window.Recharts || window;`.
- Map `import PropTypes from 'prop-types'` to `const PropTypes = window.PropTypes;`.
- Rewrite `export default function App()` → `function App() { ... }` and `window.__APP_DEFAULT__ = App;`.
- Rewrite `export default (...)` → `const __Default = (...); window.__APP_DEFAULT__ = __Default;`.

Example:
```js
// input
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export default function App() { return <motion.div /> }

// output
const React = window.React; const { useState } = React;
const { motion, AnimatePresence } = window;
function App() { return React.createElement(motion.div ? motion.div : 'div'); }
window.__APP_DEFAULT__ = App;
```

### 3) CDN registry and ordering
Keep a small mapping to UMD builds and globals. This is not a whitelist; it’s a resolution map for common libs. Unknown packages detected as CDN URLs are injected as‑is.

```js
const CDN_REGISTRY = {
  'react':       { url: 'https://unpkg.com/react@18/umd/react.development.js', global: 'React', critical: true },
  'react-dom':   { url: 'https://unpkg.com/react-dom@18/umd/react-dom.development.js', global: 'ReactDOM', critical: true },
  'framer-motion': { url: 'https://unpkg.com/framer-motion@11/dist/framer-motion.js', global: 'FramerMotion' },
  'lucide-react':  { url: 'https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js', global: 'LucideReact' },
  'recharts':      { url: 'https://unpkg.com/recharts@2.8.0/umd/Recharts.js', global: 'Recharts' },
  'axios':         { url: 'https://unpkg.com/axios@1.5.0/dist/axios.min.js', global: 'axios' },
  'marked':        { url: 'https://unpkg.com/marked@9.1.2/marked.min.js', global: 'marked' },
  'prop-types':    { url: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js', global: 'PropTypes' }
};
```

Load order:
1) Babel, Tailwind
2) React → ReactDOM
3) Optional libraries (from detection)
4) Fallback shim script
5) Transformed app (type="text/babel")

### 4) Fallback shims
Safety net in case optional CDNs fail.

```js
(function installFallbacks(){
  // React minimal
  window.React ||= { createElement: (t,p,...c)=>({t,p,c}), forwardRef: (fn)=>fn, useState:(v)=>[v,()=>{}], useEffect:()=>{}, useRef:()=>({current:null}), useMemo:(f)=>f(), useCallback:(f)=>f, Fragment: 'fragment', Component: class { setState(){} } };
  window.ReactDOM ||= { createRoot: () => ({ render: ()=>{} }) };

  // Framer Motion
  if (!window.motion) {
    window.motion = new Proxy({}, { get:(_,tag)=> (props={}) => React.createElement(tag, sanitizeMotionProps(props), props.children) });
    window.AnimatePresence ||= ({children}) => children || null;
  }
  function sanitizeMotionProps(p){ const c={...p}; delete c.initial; delete c.animate; delete c.exit; delete c.transition; delete c.variants; delete c.whileHover; delete c.whileTap; delete c.drag; delete c.dragConstraints; return c; }

  // Lucide
  window.Lucide ||= ({ name, className, ...rest }) => React.createElement('span', { className, ...rest }, name || 'icon');

  // Recharts (no‑ops)
  window.Recharts ||= {}; ['LineChart','BarChart','PieChart','AreaChart','Line','Bar','Pie','Area','XAxis','YAxis','CartesianGrid','Tooltip','Legend','ResponsiveContainer'].forEach(k=>{window.Recharts[k] ||= (()=>null)});

  // PropTypes
  window.PropTypes ||= { oneOfType: ()=>null, shape: ()=>null, arrayOf: ()=>null, string: null, number: null, bool: null, func: null, object: null, node: null };
})();
```

### 5) Optional LLM Preview Manifest
When detection is uncertain (unknown packages or ESM‑only CDNs), send a short, strict prompt with the generated code to Groq requesting:
```json
{
  "scripts": [ {"url": "...", "global": "...", "critical": false } ],
  "bindings": "const { motion, AnimatePresence } = window; ..."
}
```
Inject the returned `scripts` and prepend `bindings` to the transformed code. Never ask users for API keys (use `getMorphicGroqKey()`), and keep output strictly machine‑readable.


## Integration Points
- `src/components/LivePreview.jsx`
  - Replace current `createPreviewDocument()` with:
    1) `detectPackages()` → `{ packages, cdnImports }`
    2) `transformAppCode()` (imports→globals)
    3) `buildPreviewHTML()` (ordered scripts + fallbacks + transformed code)
    4) If detection uncertain, call `groqService.generatePreviewManifest()` and merge results.

- `src/prompts/templates.js`
  - Add an auxiliary prompt template for the Preview Manifest pass. Keep existing generation prompts unchanged. Never alter user API key plumbing.

- `src/App.jsx` and `src/App.js`
  - If any shared logic is added (e.g., a helper to view package diagnostics), keep both entry points in sync per `code-guide.md`.


## Testing Plan
- Generate at least 2 representative apps (video player, analytics dashboard) and validate preview renders on first try.
- Simulate CDN failures (e.g., block framer‑motion): verify fallbacks render without crashing.
- Verify `PropTypes.oneOfType` usage no longer errors.
- Confirm no npm install is needed and all packages load via CDN only.


## Rollout Plan
1) Implement detection and transform functions with unit tests.
2) Integrate into `LivePreview.jsx` behind a flag.
3) Validate across multiple generated apps.
4) Make it default once stable.


## Why this works
- It eliminates guesswork by aligning the runtime with what the code actually uses.
- It avoids bundling complexity by rewriting imports to globals.
- It prevents race conditions through ordered scripts and ready checks.
- It guarantees resilience with comprehensive fallbacks and an optional LLM manifest for unknowns.
