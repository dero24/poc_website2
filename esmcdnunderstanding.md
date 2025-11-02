# 🚀 Modern ESM + CDN Framework — Guide & Prompt Templates

This document teaches the recommended modern approach for generating and instantly displaying small HTML apps using ESM + CDN (import maps + selective script fallbacks). It also provides concrete prompt-engineering templates you can feed to your app generator (AI or programmatic) so generated apps are display-ready with minimal or no parsing.

## Why this approach
- Fast: no build step required — just HTML delivered to the browser.
- Tree-shakeable for ESM packages served by modern CDNs.
- Hybrid-compatible: supports both native ESM and legacy global script libraries.
- Predictable: version-locked CDN URLs for reproducible results.

---

## Quick Recommendations (summary)
- Prefer Import Maps for modern packages (jsDelivr, esm.sh, jspm.org).
- For legacy UMD/global libs use a traditional `<script>` fallback or load into a sandboxed iframe.
- Always pin versions in import maps (no floating `latest`).
- Use `+esm`, `?module`, or `/dist/esm` provider suffixes depending on provider (jsDelivr uses `+esm`, esm.sh uses `?dev`/`/vX` style).
- Wrap untrusted/generated apps in a sandboxed iframe with a strict Content Security Policy (CSP) for safety.

---

## Prompt engineering: contract & templates
When asking an AI (or any generator) to produce an instant app, give a small, strict contract describing the exact structure to return. This lets the preview runtime avoid parsing and simply render what the generator returns.

Contract (2–3 bullets):
- Output valid HTML that can be embedded directly into the preview frame.
- Include an optional top-level import map (type="importmap") and one `type="module"` script for app entry.
- If you require legacy scripts, include them as `<script src=...></script>` and provide a note about required global names.

System prompt (example):
"You are a code generator. Produce a single HTML fragment that is safe to render in an isolated preview. The fragment must include: 1) optional <script type=\"importmap\"> JSON, 2) a single <script type=\"module\"> entry that mounts into a container with id=\"app\". Do not include external styles except via link tags. Pin all CDN versions. Return only the HTML — nothing else."

User prompt (example):
"Generate a small TODO app using `preact` and `date-fns`. Use jsDelivr importmap entries pinned to versions. Provide a lightweight UI and mount to `<div id=\"app\"></div>`. Keep external network requests to a minimum. Return only the HTML fragment."

Validation rules (minimal):
- The output must contain `<div id="app"></div>`.
- If an importmap is present, ensure all import specifiers are absolute URLs or valid mapped names.
- The module entry must be `type="module"` and not inline `type="text/javascript"`.

These rules allow the preview runtime to safely inject the fragment directly into a sandboxed iframe or container.

---

## Recommended HTML template (generator should follow this)
The generator's output should match this pattern exactly. This lets the preview runtime simply insert it and run:

```html
<!-- Minimal preview-ready HTML fragment -->
<div id="app" style="min-height:160px"></div>

<script type="importmap">
{
  "imports": {
    "preact": "https://cdn.jsdelivr.net/npm/preact@10.16.1/+esm",
    "preact/hooks": "https://cdn.jsdelivr.net/npm/preact@10.16.1/hooks/dist/hooks.module.js",
    "date-fns": "https://cdn.jsdelivr.net/npm/date-fns@2.29.3/+esm"
  }
}
</script>

<script type="module">
import { h, render } from 'preact';
import { useState } from 'preact/hooks';
import { format } from 'date-fns';

function App(){
  const [items, setItems] = useState([]);
  const add = ()=> setItems([...items, {t: new Date()}]);
  return h('div', null,
    h('button',{onClick:add}, 'Add'),
    h('ul', null, items.map((it,i)=> h('li', {key:i}, format(it.t, 'HH:mm:ss'))))
  );
}

render(h(App), document.getElementById('app'));
</script>
```

Notes:
- Use CDN URLs with `+esm` when supported (jsDelivr), or provider-specific module variants.
- The fragment intentionally leaves out the full HTML document (the preview runtime will place this into a safe container/iframe).

---

## Hybrid pattern (modern + legacy)
When you need a legacy global library (Chart.js, Three.js older builds), follow this pattern:
- Provide an importmap for modern packages.
- Provide an explicit `<script src="...">` tag for legacy UMD/global builds.
- Ensure the script tag adds a known global (documented), and the module entry references that global via comment/instruction.

Example snippet:

```html
<script type="importmap">{ "imports": { "lodash-es": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/+esm" } }</script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.umd.min.js"></script>
<script type="module">
  // Chart.js is available as global Chart
  import { chunk } from 'lodash-es';
  // create chart using global Chart
  const el = document.createElement('canvas'); document.getElementById('app').appendChild(el);
  new Chart(el, { type: 'bar', data: { labels: ['a'], datasets:[{data:[1]}] } });
</script>
```

---

## Security & sandboxing recommendations
- Always render generated fragments inside a sandboxed iframe with `allow-scripts` only when necessary.
- Apply a strict CSP on the iframe / preview endpoint: disallow `eval`, allow only `https:` and the CDN hosts you trust.
- For untrusted generators, also disable `allow-top-navigation` and `allow-same-origin` where possible.

CSP example header for preview frame (server-side):
Content-Security-Policy: default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'

---

## CDN provider notes and suffixes
- jsDelivr: use `https://cdn.jsdelivr.net/npm/pack@version/+esm` when `+esm` build exists.
- esm.sh: `https://esm.sh/pack@version` (auto ESM conversion).
- jspm.io: high-compat import map support.
- skypack.dev: good for quick prototyping (`?min`/`?module` variants).

Prefer the provider that provides an explicit ESM entry for the package version you pin.

---

## Integration notes for the generator (AppGenerator / preview runtime)
- Treat generator output as a fragment (per the template above). If it follows the contract, you do NOT need to parse or transform it — just inject it into the sandboxed preview.
- Minimal validation: check presence of `<div id="app">` and that module script exists (or importmap exists if imports are used).
- If you detect a legacy `<script src=..>` tag, consider loading that script in the iframe's document HEAD before the module entry runs.

Suggested algorithm for preview runtime:
1. Create a sandboxed iframe.
2. Build the iframe's HTML: minimal <head> with CSP meta, then inject the generator fragment into body.
3. Write the complete document into the iframe (document.open/write/close).

This avoids complex parsing and keeps the runtime simple and robust.

---

## Example generator prompt (final, copy-paste)
System: "You are a precise HTML app generator. Produce a compact HTML fragment only — nothing else — that contains a `<div id=\"app\"></div>`, an optional `type=\"importmap\"` block, and a single `type=\"module\"` entry script that mounts the app into `#app`. Pin CDN versions and use ESM-compatible CDN entries. Don't include explanations."

User: "Create a small counter app using Preact and date-fns pinned to stable versions. Keep code under 80 lines. Return only the HTML fragment."

---

## Next steps (optional)
- If you want, I can update `src/components/AppGenerator.jsx` and `src/lib/previewRuntime.js` to implement the validation and iframe write algorithm described above. This would make the preview fully plug-and-play with the generator contract.

---

If you want I can now: 1) implement the runtime wiring (iframe + CSP + write) in the codebase, or 2) produce 3 concrete generator prompt variants (beginner/professional/legacy) to drop into your generator UI. Tell me which and I'll continue.