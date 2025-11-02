// Dynamic preview runtime: detects packages, rewrites code to globals, composes HTML with robust fallbacks

// Minimal CDN registry for UMD builds (extend as needed)
const CDN_REGISTRY = {
  'react':       { url: 'https://unpkg.com/react@18/umd/react.development.js',   global: 'React',     critical: true },
  'react-dom':   { url: 'https://unpkg.com/react-dom@18/umd/react-dom.development.js', global: 'ReactDOM',  critical: true },
  'framer-motion': { url: 'https://unpkg.com/framer-motion@11/dist/framer-motion.js', global: 'FramerMotion' },
  'lucide-react':  { url: 'https://unpkg.com/lucide-react@0.294.0/dist/umd/lucide-react.js', global: 'LucideReact' },
  'recharts':      { url: 'https://unpkg.com/recharts@2.8.0/umd/Recharts.js', global: 'Recharts' },
  'axios':         { url: 'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js', global: 'axios' },
  'marked':        { url: 'https://unpkg.com/marked@9.1.2/marked.min.js', global: 'marked' },
  'prop-types':    { url: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js', global: 'PropTypes' }
};

function uniqueByUrl(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item || !item.url) continue;
    const key = item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function detectPackages(code = '') {
  const registry = {
    'react': [/\bReact\b/, /from\s+['"]react['"]/],
    'react-dom': [/\bReactDOM\b/, /from\s+['"]react-dom['"]/],
    'framer-motion': [/from\s+['"]framer-motion['"\)]/, /\bmotion\./, /\bAnimatePresence\b/],
    'lucide-react': [/from\s+['"]lucide-react['"\)]/, /<\s*Lucide[\s>]/],
    'recharts': [/from\s+['"]recharts['"\)]/, /\b(LineChart|BarChart|PieChart|XAxis|YAxis|AreaChart|CartesianGrid|Tooltip|Legend|ResponsiveContainer)\b/],
    'axios': [/from\s+['"]axios['"\)]/, /\baxios\./],
    'marked': [/from\s+['"]marked['"\)]/, /\bmarked\./],
    'prop-types': [/from\s+['"]prop-types['"\)]/, /\bPropTypes\./]
  };

  const detected = new Set(['react', 'react-dom']);
  for (const [pkg, tests] of Object.entries(registry)) {
    if (tests.some((r) => r.test(code))) detected.add(pkg);
  }

  const cdnImports = Array.from(code.matchAll(/from\s+['"](https?:\/\/[^'"\s]+)['"]/g)).map((m) => m[1]);
  return { packages: Array.from(detected), cdnImports };
}

function defaultBindings() {
  return (
    "const React = window.React;\n" +
    "const ReactDOM = window.ReactDOM;\n" +
    "const { useState, useEffect, useMemo, useCallback, useRef, Fragment, forwardRef, Component } = React || {};\n" +
    "const axios = window.axios || window.Axios || (window.axios && window.axios.default) || null;\n" +
    "const marked = window.marked;\n" +
    "const motionBundle = window.FramerMotion || {};\n" +
    "const motion = motionBundle.motion || window.motion;\n" +
    "const AnimatePresence = motionBundle.AnimatePresence || window.AnimatePresence;\n" +
    "const LayoutGroup = motionBundle.LayoutGroup || window.LayoutGroup;\n" +
    "const Recharts = window.Recharts || {};\n" +
    "const PropTypes = window.PropTypes;\n" +
    "const LucideReact = window.LucideReact || window.Lucide || window;\n"
  );
}

export function transformAppCode(input = '', extraBindings = '') {
  let code = String(input || '');

  // Remove import lines
  code = code.replace(/^\s*import\s+[^;]+;?\s*$/gm, '');

  // Capture export default identifier or expression
  let defaultName = '';
  // export default function App(
  code = code.replace(/export\s+default\s+function\s+(\w+)\s*\(/, (m, name) => {
    defaultName = name;
    return `function ${name}(`;
  });

  // export default const App = ...
  code = code.replace(/export\s+default\s+const\s+(\w+)\s*=\s*/g, (m, name) => {
    defaultName = name;
    return `const ${name} = `;
  });

  // export default class App
  code = code.replace(/export\s+default\s+class\s+(\w+)/, (m, name) => {
    defaultName = name;
    return `class ${name}`;
  });

  // export default Identifier;
  code = code.replace(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/, (m, name) => {
    defaultName = defaultName || name;
    return '';
  });

  // Remove any remaining export declarations
  code = code.replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '');

  const bindings = (extraBindings && String(extraBindings).trim()) || defaultBindings();

  const footer = `\n\n(function(){\n  var __candidate = ${defaultName ? defaultName : 'typeof App !== "undefined" ? App : (typeof GeneratedApp !== "undefined" ? GeneratedApp : null)'};\n  if (__candidate) { window.__APP_DEFAULT__ = __candidate; }\n})();`;

  return `${bindings}\n\n${code}\n${footer}`;
}

function installFallbacks() {
  // React minimal fallbacks (very defensive, only used if React UMD failed)
  window.React ||= {
    createElement: (t, p, ...c) => ({ t, p, c }),
    forwardRef: (fn) => fn,
    useState: (v) => [v, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
    useMemo: (f) => f(),
    useCallback: (f) => f,
    Fragment: 'fragment',
    Component: class { setState() {} }
  };
  window.ReactDOM ||= { createRoot: () => ({ render: () => {} }) };

  // Framer-motion safe proxy
  if (!window.FramerMotion) {
    const proxyMotion = new Proxy(
      {},
      {
        get: (_, tag) => (props = {}) => {
          const el = (window.React && window.React.createElement) || ((t, p, ...c) => ({ t, p, c }));
          const clean = { ...props };
          delete clean.initial; delete clean.animate; delete clean.exit; delete clean.transition; delete clean.variants; delete clean.whileHover; delete clean.whileTap; delete clean.drag; delete clean.dragConstraints;
          return el(tag, clean, props && props.children);
        }
      }
    );
    window.motion ||= proxyMotion;
    window.AnimatePresence ||= ({ children }) => children || null;
    window.LayoutGroup ||= ({ children }) => children || null;
    window.FramerMotion = {
      motion: window.motion,
      AnimatePresence: window.AnimatePresence,
      LayoutGroup: window.LayoutGroup
    };
  }

  // Lucide fallback (renders name text)
  window.Lucide ||= ({ name, className, ...rest }) => {
    const el = (window.React && window.React.createElement) || ((t, p, ...c) => ({ t, p, c }));
    return el('span', { className, ...rest }, name || 'icon');
  };
  window.LucideReact ||= window.Lucide;

  // Recharts no-ops
  window.Recharts ||= {};
  ['LineChart','BarChart','PieChart','AreaChart','Line','Bar','Pie','Area','XAxis','YAxis','CartesianGrid','Tooltip','Legend','ResponsiveContainer'].forEach((k) => {
    window.Recharts[k] ||= (() => null);
  });

  // PropTypes minimal
  window.PropTypes ||= { oneOfType: () => null, shape: () => null, arrayOf: () => null, string: null, number: null, bool: null, func: null, object: null, node: null };
}

export function buildPreviewHTML(code, options = {}) {
  const { manifest } = options;
  const raw = String(code || '');

  // If the code already looks like a preview-ready HTML fragment (contract), inject it directly
  const looksLikeFragment = /<div\s+id=\"app\"/i.test(raw) && /<script\s+type=\"module\"/i.test(raw);
  if (looksLikeFragment) {
    // Minimal validation: ensure importmap/module shape
    const hasImportmap = /<script\s+type=\"importmap\"/i.test(raw);
    // Build minimal HTML shell and insert the fragment into the body. Keep any <script src=> lines the fragment provides.
  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Generated App Preview</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' https:; style-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';">
<style>html, body { height:100%; } body{ margin:0; font-family: -apple-system,BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; }</style>
</head><body>
${raw}
<script>
  (function(){
    function notifyLoaded(){ window.parent.postMessage({ type:'preview-loaded', success:true }, '*'); }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Defer slightly to allow module entry mount
      setTimeout(notifyLoaded, 250);
    } else {
      window.addEventListener('DOMContentLoaded', function(){ setTimeout(notifyLoaded, 250); });
    }
    // Safety: timeout to report error if nothing mounts in reasonable time
    setTimeout(function(){
      try {
        const appEl = document.getElementById('app');
        if (appEl && appEl.children.length === 0) {
          // no children after mount window
          // Don't treat as fatal; allow module entry to manage it. If the app posts errors it should post a message.
        }
      } catch(e){}
    }, 3000);
  })();
</script>
</body></html>`;
  }

  // Fallback: older transform-based rendering (keeps backwards compatibility)
  const detection = detectPackages(code || '');

  // Base scripts: Babel, Tailwind, React, ReactDOM
  const critical = ['react', 'react-dom'];
  const baseScripts = [
    { url: 'https://unpkg.com/@babel/standalone/babel.min.js' },
    { url: 'https://cdn.tailwindcss.com' },
    ...critical.map((k) => ({ url: CDN_REGISTRY[k].url }))
  ];

  const detectedOptional = (detection.packages || [])
    .filter((k) => !critical.includes(k))
    .map((k) => CDN_REGISTRY[k] && { url: CDN_REGISTRY[k].url });

  const directCdnImports = (detection.cdnImports || []).map((url) => ({ url }));

  // Include manifest scripts first (if provided), then detected ones
  const manifestScripts = Array.isArray(manifest?.scripts) ? manifest.scripts : [];
  const scripts = uniqueByUrl([
    ...manifestScripts,
    ...baseScripts,
    ...detectedOptional,
    ...directCdnImports
  ].filter(Boolean));

  const bindings = manifest?.bindings || '';
  const transformed = transformAppCode(code, bindings);

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Generated App Preview</title>
${scripts.map((s) => `<script src="${s.url}" crossorigin="anonymous"></script>`).join('\n')}
<script>(${installFallbacks.toString()})()</script>
<style>
  html, body { height:100%; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #ffffff; color: #0f172a; }
  .error-boundary { padding: 20px; background: #fff5f5; border: 1px solid #fca5a5; border-radius: 8px; margin: 20px; color:#7c2d12; }
</style>
</head><body>
<div id="root"></div>
<script type="text/babel" data-presets="env,react">
  function mountApp(attempt = 0) {
    if (!window.React || !window.ReactDOM || !window.ReactDOM.createRoot) {
      if (attempt < 200) {
        setTimeout(() => mountApp(attempt + 1), 25);
        return;
      }
      console.error('Preview dependencies failed to load');
      window.parent.postMessage({ type: 'preview-error', error: 'React dependencies failed to load.' }, '*');
      return;
    }

    window.__APP_DEFAULT__ = null;

    ${transformed}

    class ErrorBoundary extends (window.React && window.React.Component ? window.React.Component : function(){}) {
      constructor(props){ super(props); this.state = { hasError:false, error:null }; }
      static getDerivedStateFromError(error){ return { hasError:true, error }; }
      componentDidCatch(error, info){ console.error('Preview Error:', error, info); }
      render(){
        if (this.state?.hasError) {
          return (window.React && window.React.createElement)
            ? window.React.createElement('div', { className:'error-boundary' }, 'Preview Error: ' + (this.state.error?.message || ''))
            : null;
        }
        return this.props?.children || null;
      }
    }

    try {
      const Candidate = window.__APP_DEFAULT__ || window.App || window.GeneratedApp || (function DefaultApp(){ return (window.React && window.React.createElement)
        ? window.React.createElement('div', { className:'p-8 text-center' }, 'App component not found')
        : null; });
      const rootNode = document.getElementById('root');
      const root = window.ReactDOM.createRoot(rootNode);
      root.render(
        (window.React && window.React.createElement)
          ? window.React.createElement(ErrorBoundary, null, window.React.createElement(Candidate))
          : null
      );
      window.parent.postMessage({ type: 'preview-loaded', success: true }, '*');
    } catch (error) {
      console.error('Render error:', error);
      window.parent.postMessage({ type: 'preview-error', error: error?.message || String(error) }, '*');
    }
  }

  mountApp();
</script>
</body></html>`;
}

export default {
  detectPackages,
  transformAppCode,
  buildPreviewHTML
};
