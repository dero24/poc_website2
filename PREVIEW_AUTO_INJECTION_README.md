# Preview Runtime Overhaul — Dynamic CDN Auto‑Injection

This proposal replaces the current static/whitelist preview with a dynamic, zero‑failure system that always renders generated apps. It focuses on the main codebase (excludes `poc_website2/`).

Given that your audience is a prompt-to-app generator—where users expect instant, fully functional, beautiful React apps from simple prompts—the best user experience comes from a display window that:

Always supports JSX and modern syntax (because almost all generative AI outputs use JSX).

Handles CDN imports smartly and robustly.

Is fast, visually polished, and error-tolerant.

Provides immediate feedback and live interactive previews that look “production-grade.”

Here’s how to deliver a “wow” experience, and avoid disappointments:

The Best Technical Solution for Your Audience
1. Use Babel Standalone in the Browser (for JSX/TS support)

This lets you accept any generated code: JSX, TypeScript, ES6+, styled-components, etc.

Users can copy-paste or generate modern React components—no restrictions.

2. Pre-populate the display window with the required CDN scripts

Inject <script src="..."> for all common dependencies: React, ReactDOM, Tailwind, utility libraries, plus Babel Standalone.

3. Dynamically create a "sandbox" iframe for every preview

Set srcdoc for the iframe so each preview is safely isolated.

Inject the user’s component code inside a <script type="text/babel">.

4. On error, show clear, friendly feedback and troubleshooting tips

If Babel fails or there are CDN issues (wrong import, missing library), show a custom “debug overlay” with clear next steps.

Always provide an example app/template so the preview window never feels “broken” (even if user code fails).

5. Add auto-detect or auto-include for CSS/asset imports

If the output references Leaflet, Tailwind, etc., inject <link> tags for CSS automatically.

6. Optimize for Mobile and Desktop

Responsive layout, big preview area, easy input, no scrollbars or tiny fonts.

Best experience:

Display window uses browser Babel Standalone (with CDN/UMD script injection) to transpile and render any code the AI returns—including JSX, hooks, and styling.

For pre-baked, static apps, server-side transpilation is perfect (just static JS/HTML).

Bottom line:

For the AI prompt-to-app experience, Babel Standalone is still the easiest way to guarantee “instant preview” for any code, directly in the browser.


## ) Best Solution — High Level
- **Detect** exactly which packages the generated code uses (including direct CDN URLs).
- **Normalize**: strip ESM `import`/`export`, bind everything to `window.*` globals in a non‑module Babel script.
- **Plan Scripts**: React/Babel/Tailwind first; then required optional CDNs; use es‑module‑shims + import map only when unavoidable.
- **Install Shims**: comprehensive fallbacks for motion, PropTypes, Lucide, Recharts, Axios, Marked so preview never crashes if a CDN fails.
- **Initialize Safely**: wait for React/ReactDOM before rendering; surface friendly errors via boundary and postMessage.
- **Optional LLM Assist**: if detection is uncertain (unknown CDN modules), request a strict, machine‑readable Preview Manifest from Groq and inject exactly as returned.

This yields a robust, flexible preview that conforms to the generated app every time—without npm installs.



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


## 7) Why this will not break again
- The preview becomes data‑driven by the actual code, not a static list.
- Race conditions are mitigated by deterministic script ordering and readiness checks.
- Fallbacks guarantee graceful rendering if a CDN is flaky.
- The LLM manifest step covers the long tail of unexpected imports without manual updates.
