# Preview Runtime Overhaul — Dynamic CDN Auto‑Injection

This proposal replaces the current static/whitelist preview with a dynamic, zero‑failure system that always renders generated apps. It focuses on the main codebase (excludes `poc_website2/`).


## 1) Current Problems (excluding `poc_website2/`)
- **Hard‑coded package set** in `src/components/LivePreview.jsx` (e.g., `CDN_PACKAGES`, default scripts) doesn’t match what the generated code actually uses.
- **Race conditions**: optional CDNs (e.g., framer‑motion) may load after app code runs → `React.forwardRef` errors.
- **Missing shims**: no `PropTypes` fallback → `PropTypes.oneOfType` error; motion shim historically incomplete.
- **No import rewriting**: generated code often contains ESM `import`/`export`. Our preview uses `<script type="text/babel">` so ESM imports are not resolved, causing crashes.
- **Mixed module strategies** with no normalization (global UMD vs ESM). No import‑map or module transpilation path.
- **Prompt constraints alone aren’t sufficient**: even with strong prompts (`src/prompts/templates.js`), models occasionally output imports beyond our fixed set.


## 2) Best Solution — High Level
- **Detect** exactly which packages the generated code uses (including direct CDN URLs).
- **Normalize**: strip ESM `import`/`export`, bind everything to `window.*` globals in a non‑module Babel script.
- **Plan Scripts**: React/Babel/Tailwind first; then required optional CDNs; use es‑module‑shims + import map only when unavoidable.
- **Install Shims**: comprehensive fallbacks for motion, PropTypes, Lucide, Recharts, Axios, Marked so preview never crashes if a CDN fails.
- **Initialize Safely**: wait for React/ReactDOM before rendering; surface friendly errors via boundary and postMessage.
- **Optional LLM Assist**: if detection is uncertain (unknown CDN modules), request a strict, machine‑readable Preview Manifest from Groq and inject exactly as returned.

This yields a robust, flexible preview that conforms to the generated app every time—without npm installs.


## 3) Detailed Design — Low Level

### 3.1 Static Package Detection
Detect both bare imports and usage patterns, plus direct CDN URLs.
```js
function detectPackages(code) {
  const registry = {
    'react': [/\bReact\b/, /from\s+['"]react['"]/],
    'react-dom': [/\bReactDOM\b/, /from\s+['"]react-dom['"]/],
    'framer-motion': [/from\s+['"]framer-motion['"]/ , /\bmotion\./, /\bAnimatePresence\b/],
    'lucide-react': [/from\s+['"]lucide-react['"]/ , /<\s*Lucide[\s>]/],
    'recharts': [/from\s+['"]recharts['"]/ , /\b(LineChart|BarChart|PieChart|AreaChart|XAxis|YAxis)\b/],
    'axios': [/from\s+['"]axios['"]/ , /\baxios\./],
    'marked': [/from\s+['"]marked['"]/ , /\bmarked\./],
    'prop-types': [/from\s+['"]prop-types['"]/ , /\bPropTypes\./]
  };
  const packages = new Set(['react', 'react-dom']);
  for (const [pkg, tests] of Object.entries(registry)) {
    if (tests.some(r => r.test(code))) packages.add(pkg);
  }
  const cdnImports = Array.from(code.matchAll(/from\s+['"](https?:\/\/[^'"\s]+)['"]/g)).map(m => m[1]);
  return { packages: Array.from(packages), cdnImports };
}
```

### 3.2 Code Normalization (imports → globals)
Convert ESM into globals so it runs inside `<script type="text/babel">` without a bundler.
- Remove `import`/`export` lines.
- Emit bindings before app code:
  - `const React = window.React; const { useState, useEffect, useRef } = React;`
  - `const { motion, AnimatePresence } = window;`
  - `const PropTypes = window.PropTypes;`
  - `const Recharts = window.Recharts || {}; const { LineChart, Line, XAxis, YAxis } = Recharts;`
- Ensure one of `App` / `GeneratedApp` / `window.__APP_DEFAULT__` exists for rendering.

Example rewrite:
```js
// input
import React, { useState } from 'react';
import { motion } from 'framer-motion';
export default function App(){ return <motion.div /> }

// output
const React = window.React; const { useState } = React;
const { motion } = window;
function App(){ return React.createElement(motion.div ? motion.div : 'div'); }
window.__APP_DEFAULT__ = App;
```

### 3.3 CDN Registry and Ordering
Map common packages to UMD builds and globals. Unknown direct CDN URLs are injected as‑is.
```js
const CDN_REGISTRY = {
  'react':         { url: 'https://unpkg.com/react@18/umd/react.development.js',      global: 'React',     critical: true },
  'react-dom':     { url: 'https://unpkg.com/react-dom@18/umd/react-dom.development.js', global: 'ReactDOM',  critical: true },
  'framer-motion': { url: 'https://unpkg.com/framer-motion@11/dist/framer-motion.js',    global: 'FramerMotion' },
  'lucide-react':  { url: 'https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js', global: 'LucideReact' },
  'recharts':      { url: 'https://unpkg.com/recharts@2.8.0/umd/Recharts.js',            global: 'Recharts' },
  'axios':         { url: 'https://unpkg.com/axios@1.5.0/dist/axios.min.js',             global: 'axios' },
  'marked':        { url: 'https://unpkg.com/marked@9.1.2/marked.min.js',                global: 'marked' },
  'prop-types':    { url: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',       global: 'PropTypes' }
};
```
Load order in the iframe:
1. Babel, Tailwind
2. React → ReactDOM (critical)
3. Optional libs from detection (UMD)
4. Fallback shim script
5. Transformed app (type="text/babel")
6. If detection found unknown ESM CDNs, include `es-module-shims` + import‑map and skip step 2–5 for those modules (last resort).

### 3.4 Fallback Shims (safety net)
Install minimal but complete shims so the app never crashes if a CDN fails.
```js
(function installFallbacks(){
  // React core
  window.React ||= { createElement:(t,p,...c)=>({t,p,c}), forwardRef:(fn)=>fn, useState:(v)=>[v,()=>{}], useEffect:()=>{}, useRef:()=>({current:null}), useMemo:(f)=>f(), useCallback:(f)=>f, Fragment:'fragment', Component:class{ setState(){} } };
  window.ReactDOM ||= { createRoot: () => ({ render: ()=>{} }) };
  // Framer Motion
  if (!window.motion) {
    window.motion = new Proxy({}, { get:(_,tag)=> (props={}) => React.createElement(tag, clean(props), props.children) });
    window.AnimatePresence ||= ({children}) => children || null;
  }
  function clean(p){ const c={...p}; delete c.initial; delete c.animate; delete c.exit; delete c.transition; delete c.variants; delete c.whileHover; delete c.whileTap; delete c.drag; delete c.dragConstraints; return c; }
  // Lucide
  window.Lucide ||= ({ name, className, ...rest }) => React.createElement('span', { className, ...rest }, name || 'icon');
  // Recharts no‑ops
  window.Recharts ||= {}; ['LineChart','BarChart','PieChart','AreaChart','Line','Bar','Pie','Area','XAxis','YAxis','CartesianGrid','Tooltip','Legend','ResponsiveContainer'].forEach(k=>{window.Recharts[k] ||= (()=>null)});
  // PropTypes
  window.PropTypes ||= { oneOfType: ()=>null, shape: ()=>null, arrayOf: ()=>null, string:null, number:null, bool:null, func:null, object:null, node:null };
})();
```

### 3.5 HTML Composer
```js
function buildPreviewHTML(code, detection){
  const { packages, cdnImports } = detection;
  const critical = ['react','react-dom'];
  const scripts = [
    { url:'https://unpkg.com/@babel/standalone/babel.min.js' },
    { url:'https://cdn.tailwindcss.com' },
    ...critical.map(k=>({ url: CDN_REGISTRY[k].url })),
    ...packages.filter(k=>!critical.includes(k)).map(k=>({ url: CDN_REGISTRY[k]?.url })),
    ...cdnImports.map(url=>({ url }))
  ].filter(Boolean);

  return `<!DOCTYPE html><html><head>
    ${scripts.map(s=>`<script src="${s.url}" crossorigin="anonymous"></script>`).join('\n')}
    <script>(${installFallbacks.toString()})()</script>
  </head><body>
    <div id="root"></div>
    <script type="text/babel">${transformAppCode(code)}</script>
  </body></html>`;
}
```

### 3.6 Optional LLM Preview Manifest
If detection sees unfamiliar imports/CDNs, call Groq with a short, strict prompt to return:
```json
{
  "scripts": [ { "url": "https://...", "global": "...", "critical": false } ],
  "bindings": "const Foo = window.Foo; ..."
}
```
We then inject these `scripts` and prepend `bindings` to the transformed code. Follow `code-guide.md`: never prompt users for keys; use `getMorphicGroqKey()` only.


## 4) Integration Points
- `src/components/LivePreview.jsx`
  - Replace `createPreviewDocument()` with: `detectPackages()` → `transformAppCode()` → `buildPreviewHTML()`.
  - Add error boundary and `postMessage` (already present); keep improved error strings.
- `src/prompts/templates.js`
  - Add an auxiliary prompt for the Preview Manifest pass; keep current generation prompts intact.
- `src/App.jsx` and `src/App.js`
  - If any shared diagnostics UI is added, keep both aligned (see `code-guide.md`).


## 5) Security & Team Guardrails
- **No API key prompts**: generated apps must use `getMorphicGroqKey()`.
- **CDN‑only**: no npm installs; prefer well‑known UMD builds.
- **Onboarding**: keep existing splash/UI flows intact.
- **Docs**: summarize major changes in `README.md`; link to this spec.
- **Testing**: generate at least two apps (e.g., video player, analytics dashboard) and confirm preview without unsupported imports.


## 6) Migration Plan
1. Implement `detectPackages`, `transformAppCode`, `buildPreviewHTML` in a new util (e.g., `src/lib/previewRuntime.js`).
2. Wire `LivePreview.jsx` to use the new pipeline.
3. Add the fallback shims and ensure `PropTypes`/motion are resilient.
4. Add an optional code path for es‑module‑shims when unknown ESM CDNs are detected.
5. Validate with representative apps; run `npm run build` before merging.


## 7) Why this will not break again
- The preview becomes data‑driven by the actual code, not a static list.
- Race conditions are mitigated by deterministic script ordering and readiness checks.
- Fallbacks guarantee graceful rendering if a CDN is flaky.
- The LLM manifest step covers the long tail of unexpected imports without manual updates.
