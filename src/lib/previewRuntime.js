// Dynamic preview runtime: detects packages, rewrites code to globals, composes HTML with robust fallbacks

// Minimal CDN registry for UMD builds (extend as needed)
const CDN_REGISTRY = {
  'react':       { url: 'https://unpkg.com/react@18/umd/react.development.js',   global: 'React',     critical: true },
  'react-dom':   { url: 'https://unpkg.com/react-dom@18/umd/react-dom.development.js', global: 'ReactDOM',  critical: true },
  'framer-motion': { url: 'https://unpkg.com/framer-motion@11/dist/framer-motion.js', global: 'FramerMotion' },
  'lucide-react':  { url: 'https://unpkg.com/lucide-react@0.294.0/dist/umd/lucide-react.js', global: 'LucideReact' },
  'lucide':        { url: 'https://unpkg.com/lucide@0.463.0/dist/umd/lucide.js', global: 'lucide' },
  'recharts':      { url: 'https://unpkg.com/recharts@2.8.0/umd/Recharts.js', global: 'Recharts' },
  'axios':         { url: 'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js', global: 'axios' },
  'marked':        { url: 'https://unpkg.com/marked@9.1.2/marked.min.js', global: 'marked' },
  'prop-types':    { url: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js', global: 'PropTypes' },
  'react-icons':   { url: 'https://unpkg.com/react-icons@4.11.0/dist/react-icons.umd.js', global: 'ReactIcons' }
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
    'react': [/\bReact\b/, /from\s+['"][^'"]*react[^'"]*['"]/i],
    'react-dom': [/\bReactDOM\b/, /from\s+['"][^'"]*react-dom[^'"]*['"]/i],
    'framer-motion': [/from\s+['"][^'"]*framer-motion[^'"]*['"]/i, /\bmotion\./, /\bAnimatePresence\b/],
    'lucide-react': [/from\s+['"][^'"]*lucide-react[^'"]*['"]/i, /<\s*Lucide[\s>]/, /\bLucide[A-Z][A-Za-z0-9]+\b/],
    'lucide': [/\blucide\b/, /class(Name)?=\"[^\"]*\blucide\b[^\"]*\"/],
    'recharts': [/from\s+['"][^'"]*recharts[^'"]*['"]/i, /\b(LineChart|BarChart|PieChart|XAxis|YAxis|AreaChart|CartesianGrid|Tooltip|Legend|ResponsiveContainer|RadialBarChart|ComposedChart|ResponsiveContainer)\b/],
    'axios': [/from\s+['"][^'"]*axios[^'"]*['"]/i, /\baxios\./],
    'marked': [/from\s+['"][^'"]*marked[^'"]*['"]/i, /\bmarked\./],
    'prop-types': [/from\s+['"][^'"]*prop-types[^'"]*['"]/i, /\bPropTypes\./],
    'react-icons': [/from\s+['"][^'"]*react-icons[^'"]*['"]/i, /\b(Ai|Fi|Gi|Hi|Ri|Si|Ti|Wi|Bi|Di)[A-Z][A-Za-z0-9]+\b/]
  };

  const detected = new Set(['react', 'react-dom']);
  for (const [pkg, tests] of Object.entries(registry)) {
    if (tests.some((pattern) => {
      if (typeof pattern === 'function') return pattern(code);
      return pattern.test(code);
    })) {
      if (pkg === 'react-icons') {
        detected.add('react-icons');
      } else {
        detected.add(pkg);
      }
    }
  }

  const cdnImports = Array.from(code.matchAll(/from\s+['"](https?:\/\/[^'"\s]+)['"]/g)).map((m) => m[1]);
  return { packages: Array.from(detected), cdnImports };
}

function defaultBindings() {
  return (
    "const React = window.React;\n" +
    "const ReactDOM = window.ReactDOM;\n" +
    "const ReactDOMClient = window.ReactDOM;\n" +
    "const createRoot = (ReactDOMClient && ReactDOMClient.createRoot) || (ReactDOM && ReactDOM.createRoot) || null;\n" +
    "const { useState, useEffect, useMemo, useCallback, useRef, Fragment, forwardRef, Component } = React || {};\n" +
    "const axios = window.axios || window.Axios || (window.axios && window.axios.default) || null;\n" +
    "const marked = window.marked;\n" +
    "const motionBundle = window.FramerMotion || {};\n" +
    "const motion = motionBundle.motion || window.motion;\n" +
    "const AnimatePresence = motionBundle.AnimatePresence || window.AnimatePresence;\n" +
    "const LayoutGroup = motionBundle.LayoutGroup || window.LayoutGroup;\n" +
    "const Recharts = window.Recharts || {};\n" +
    "const PropTypes = window.PropTypes;\n" +
    "const LucideReact = window.LucideReact || window.Lucide || window;\n" +
    "const lucideReact = window.LucideReact || window.Lucide || window;\n" +
    "const ensureIcon = (name, source) => {\n" +
    "  if (window[name]) { return window[name]; }\n" +
    "  const candidate = source && source[name];\n" +
    "  if (typeof candidate === 'function') { window[name] = candidate; return candidate; }\n" +
    "  if (candidate && typeof candidate === 'object' && typeof candidate.default === 'function') { window[name] = candidate.default; return candidate.default; }\n" +
    "  const elFactory = (window.React && window.React.createElement) || ((t,p,...c) => ({ t, p, c }));\n" +
    "  const fallback = (props = {}) => elFactory('span', { ...props, 'data-icon': name, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...(props && props.style ? props.style : {}) } }, props && props.children ? props.children : name);\n" +
    "  window[name] = fallback;\n" +
    "  return fallback;\n" +
    "};\n" +
    "if (LucideReact && typeof LucideReact === 'object') { Object.keys(LucideReact).forEach((key) => { ensureIcon(key, LucideReact); }); }\n" +
    "if (window.ReactIcons && typeof window.ReactIcons === 'object') { Object.keys(window.ReactIcons).forEach((key) => { ensureIcon(key, window.ReactIcons); }); }\n" +
    "['FiSearch','FiTasklist','FiCalendar','FiSun','FiMoon','FiCheckCircle','FiClock','FiChevronDown','FiArrowRight','FiPlay','FiPause','FiLoader','FiList','FiRefreshCw','FiMusic','AiOutlineSearch','AiOutlineHeart','AiFillStar','AiOutlineCheckCircle','AiOutlineCalendar','AiOutlineCompass','AiOutlineDashboard','AiOutlineTeam','AiOutlineSmile','AiOutlineThunderbolt','AiOutlineAppstore','AiOutlinePlayCircle','AiOutlinePauseCircle','AiOutlineMessage','AiOutlineMail','AiOutlineHome','AiOutlineUser'].forEach((iconName) => { ensureIcon(iconName, window.ReactIcons || null); });\n" +
    "window.getMorphicGroqKey = window.getMorphicGroqKey || (() => window.__MORPHIC_GROQ_KEY__ || window.GROQ_API_KEY || '');\n" +
    "window.lucide = window.lucide || new Proxy({}, { get: (_, n) => ensureIcon(String(n), window.LucideReact || null) });\n"
  );
}

export function transformAppCode(input = '', extraBindings = '') {
  let code = String(input || '');

  // Remove import lines
  code = code.replace(/^\s*import\s+[^;]+;?\s*$/gm, '');

  // Remove duplicate React hook destructuring to avoid "Identifier 'useState' has already been declared"
  code = code.replace(/^\s*const\s*\{\s*useState[^}]*\}\s*=\s*React\s*;?\s*$/gm, '');

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

  // Dynamically stub any capitalized JSX tags (likely icons/components) to avoid ReferenceError
  const tagMatches = Array.from(code.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)).map((m) => m[1]);
  const exclude = new Set(['React', 'Fragment', 'ErrorBoundary', 'AnimatePresence', 'LayoutGroup', 'motion']);
  const uniqueNames = Array.from(new Set(tagMatches.filter((n) => !exclude.has(n))));
  const dynamicIconInit = uniqueNames.length
    ? (
        "\n;try {\n" +
        `  (['${uniqueNames.join("','")}']).forEach(function(n){\n` +
        "    try { ensureIcon(n, window.ReactIcons || null); } catch(e) {}\n" +
        "    try { ensureIcon(n, window.LucideReact || null); } catch(e) {}\n" +
        "  });\n" +
        "} catch(e) {}\n"
      )
    : '';

  const footer = `\n\n(function(){\n  var __candidate = ${defaultName ? defaultName : 'typeof App !== "undefined" ? App : (typeof GeneratedApp !== "undefined" ? GeneratedApp : null)'};\n  if (__candidate) { window.__APP_DEFAULT__ = __candidate; }\n})();`;

  return `${bindings}\n${dynamicIconInit}\n${code}\n${footer}`;
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
  // Alias for generated code expecting window.Motion
  window.Motion ||= window.FramerMotion;

  // Lucide fallback (renders name text)
  window.Lucide ||= ({ name, className, ...rest }) => {
    const el = (window.React && window.React.createElement) || ((t, p, ...c) => ({ t, p, c }));
    return el('span', { className, ...rest }, name || 'icon');
  };
  window.LucideReact ||= window.Lucide;
  // lucide core fallback for non-React usage patterns
  window.lucide ||= {
    icons: new Proxy({}, { get: () => ({}) }),
    createIcons: () => {},
    replace: () => {},
    set: () => {}
  };

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
  const detection = detectPackages(code || '');

  // Base scripts: Babel, Tailwind, React, ReactDOM
  const critical = ['react', 'react-dom'];
  const baseScripts = [
    { url: 'https://unpkg.com/@babel/standalone/babel.min.js' },
    ...critical.map((k) => ({ url: CDN_REGISTRY[k].url }))
  ];
  const baseStyles = [
    { url: 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css' }
  ];

  // Determine optional packages and ensure PropTypes loads before Recharts
  const optionalKeys = (detection.packages || []).filter((k) => !critical.includes(k));
  // Ensure lucide core loads before lucide-react
  if (optionalKeys.includes('lucide-react') && !optionalKeys.includes('lucide')) {
    optionalKeys.unshift('lucide');
  }
  if (optionalKeys.includes('recharts') && !optionalKeys.includes('prop-types')) {
    optionalKeys.unshift('prop-types');
  }
  const detectedOptional = optionalKeys.map((k) => CDN_REGISTRY[k] && { url: CDN_REGISTRY[k].url, id: k });

  // Include manifest scripts first (if provided), then detected ones
  const manifestScripts = Array.isArray(manifest?.scripts) ? manifest.scripts : [];
  const scripts = uniqueByUrl([
    ...manifestScripts,
    ...baseScripts,
    ...detectedOptional,
  ].filter(Boolean));

  const styles = uniqueByUrl([...(Array.isArray(manifest?.styles) ? manifest.styles : []), ...baseStyles]);

  const bindings = manifest?.bindings || '';
  const transformed = transformAppCode(code, bindings);

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Generated App Preview</title>
${styles.map((s) => `<link rel="stylesheet" href="${s.url}" crossorigin="anonymous" />`).join('\n')}
<script>(${installFallbacks.toString()})()</script>
${scripts.map((s) => `<script src="${s.url}" crossorigin="anonymous"></script>`).join('\n')}
<style>
  html, body { height:100%; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #0b1020; color: #e2e8f0; }
  .error-boundary { padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; margin: 20px; color:#7c2d12; }
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
