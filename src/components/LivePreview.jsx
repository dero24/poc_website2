import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, ExternalLink, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import groqService from '../services/groqService.js';
import versionService from '../services/versionService.js';
import { buildPreviewHTML, detectPackages } from '../lib/previewRuntime.js';

const escapeHtmlAttribute = (value) => String(value ?? '').replace(/"/g, '&quot;');
const escapeInlineScript = (value) => String(value ?? '').replace(/<\/(script)/gi, '<\\/$1');
const escapeInlineStyle = (value) => String(value ?? '').replace(/<\/(style)/gi, '<\\/$1');

const createLinkTag = ({ href, rel = 'stylesheet', media }) => {
  if (!href) return '';
  const attrs = [`rel="${escapeHtmlAttribute(rel)}"`, `href="${escapeHtmlAttribute(href)}"`];
  if (media) {
    attrs.push(`media="${escapeHtmlAttribute(media)}"`);
  }
  return `<link ${attrs.join(' ')} />`;
};

const createStyleTag = ({ content, media }) => {
  if (!content) return '';
  const mediaAttr = media ? ` media="${escapeHtmlAttribute(media)}"` : '';
  return `<style${mediaAttr}>${escapeInlineStyle(content)}</style>`;
};

const createScriptTag = ({ src, content, type, async, defer, crossorigin, integrity }) => {
  const attrs = [];
  if (type) attrs.push(`type="${escapeHtmlAttribute(type)}"`);
  if (src) attrs.push(`src="${escapeHtmlAttribute(src)}"`);
  if (async) attrs.push('async');
  if (defer) attrs.push('defer');
  if (crossorigin) attrs.push(`crossorigin="${escapeHtmlAttribute(crossorigin)}"`);
  if (integrity) attrs.push(`integrity="${escapeHtmlAttribute(integrity)}"`);
  const attrString = attrs.length ? ` ${attrs.join(' ')}` : '';
  if (content) {
    return `<script${attrString}>${escapeInlineScript(content)}</script>`;
  }
  return `<script${attrString}></script>`;
};

const LEGACY_BODY_STYLE = `body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
.error-boundary { padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; margin: 20px; }
.error-title { color: #c53030; font-weight: bold; margin-bottom: 10px; }
.error-message { color: #744210; }`;

const buildLegacyRuntimeScript = (code) => {
  const runtimeContent = `
// Ensure baseline globals before any optional libraries execute
function ensurePreviewShims() {
  window.React = window.React || {};
  if (!window.React.createElement) {
    window.React.createElement = (type, props, ...children) => {
      if (typeof type === 'function') {
        return type(props || {}, ...children);
      }
      return { type, props: props || {}, children };
    };
  }
  if (!window.React.useState) {
    window.React.useState = (initial) => { let s = initial; const set = (v) => { s = v; }; return [s, set]; };
  }
  if (!window.React.useEffect) window.React.useEffect = () => {};
  if (!window.React.useRef) window.React.useRef = () => ({ current: null });
  if (!window.React.useMemo) window.React.useMemo = (fn) => fn();
  if (!window.React.useCallback) window.React.useCallback = (fn) => fn;
  if (!window.React.forwardRef) window.React.forwardRef = (fn) => fn;
  if (!window.React.Fragment) window.React.Fragment = 'fragment';
  if (!window.React.Component) {
    window.React.Component = class {
      constructor(props) {
        this.props = props || {};
        this.state = {};
      }
      setState(update) {
        this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state, this.props) : update) };
      }
    };
  }

  window.ReactDOM = window.ReactDOM || {};
  if (!window.ReactDOM.createRoot) {
    window.ReactDOM.createRoot = (container) => ({
      render: () => { if (container) container.innerHTML = ''; }
    });
  }

  if (!window.motion) {
    window.motion = new Proxy({}, {
      get(_, tag) {
        return (props = {}) => {
          const { children, ...rest } = props;
          const clean = { ...rest };
          delete clean.initial;
          delete clean.animate;
          delete clean.exit;
          delete clean.transition;
          delete clean.variants;
          delete clean.whileHover;
          delete clean.whileTap;
          delete clean.drag;
          delete clean.dragConstraints;
          return window.React.createElement(tag, clean, children);
        };
      }
    });
  }

  window.AnimatePresence = window.AnimatePresence || (({ children }) => children || null);
  window.Lucide = window.Lucide || (({ name, className, ...props }) => window.React.createElement('span', { className, ...props }, (name === 'loader' || name === 'loader-2') ? '⏳' : '❓'));
  window.LineChart = window.LineChart || (() => null);
  window.Line = window.Line || (() => null);
  window.XAxis = window.XAxis || (() => null);
  window.YAxis = window.YAxis || (() => null);
}
ensurePreviewShims();

// Wait for critical CDN scripts to load
function initializeApp() {
  console.log('🎯 Initializing React app...');

  ensurePreviewShims();

  const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Enhanced CDN package resolution with robust fallbacks
window.require = function(packageName) {
  const packageMap = {
    'react': window.React || {
      createElement: (type, props, ...children) => {
        if (typeof type === 'function') {
          return type(props || {}, ...children);
        }
        const element = { type, props: props || {}, children };
        return element;
      },
      useState: (initial) => {
        let state = initial;
        const setState = (newState) => { state = newState; };
        return [state, setState];
      },
      useEffect: () => {},
      useRef: () => ({ current: null }),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      forwardRef: (renderFn) => {
        // Return the render function directly for simple cases
        return renderFn;
      },
      Component: class {
        constructor(props) {
          this.props = props;
          this.state = {};
        }
        setState(newState) {
          this.state = { ...this.state, ...newState };
        }
        render() {
          return null;
        }
      }
    },
    'react-dom': window.ReactDOM || {
      createRoot: (container) => ({
        render: (element) => {
          container.innerHTML = '<div>React DOM not loaded - basic fallback</div>';
        }
      })
    },
    'framer-motion': window.FramerMotion || {
      motion: new Proxy({}, {
        get(target, prop) {
          // Return a function that creates React elements with motion-like props
          return (props) => {
            const { children, ...otherProps } = props || {};
            // Remove framer-motion specific props that might cause issues
            const cleanProps = { ...otherProps };
            delete cleanProps.initial;
            delete cleanProps.animate;
            delete cleanProps.exit;
            delete cleanProps.transition;
            delete cleanProps.variants;
            delete cleanProps.whileHover;
            delete cleanProps.whileTap;
            delete cleanProps.drag;
            delete cleanProps.dragConstraints;
            return React.createElement(prop, cleanProps, children);
          };
        }
      }),
      AnimatePresence: ({ children }) => children || null
    },
    'lucide-react': window.LucideReact || {
      // Complete icon mapping with fallbacks
      CheckCircle: () => '✅',
      AlertTriangle: () => '⚠️',
      RefreshCw: () => '🔄',
      ExternalLink: () => '🔗',
      Sparkles: () => '✨',
      Code: () => '💻',
      Play: () => '▶️',
      History: () => '📜',
      Settings: () => '⚙️',
      Zap: () => '⚡',
      Home: () => '🏠',
      User: () => '👤',
      Search: () => '🔍',
      Menu: () => '☰',
      X: () => '✕',
      Plus: () => '➕',
      Minus: () => '➖',
      Star: () => '⭐',
      Heart: () => '❤️',
      Eye: () => '👁️',
      Download: () => '📥',
      Upload: () => '📤',
      Trash: () => '🗑️',
      Edit: () => '✏️',
      Save: () => '💾',
      Copy: () => '📋',
      Share: () => '📤',
      // Add more common icons as needed
      ChevronDown: () => '▼',
      ChevronUp: () => '▲',
      ChevronLeft: () => '◀️',
      ChevronRight: () => '▶️'
    },
    // Add Lucide component for dynamic icon usage
    Lucide: ({ name, className, ...props }) => {
      const icons = {
        loader: '⏳',
        'loader-2': '⏳',
        check: '✓',
        x: '✕',
        plus: '➕',
        minus: '➖',
        search: '🔍',
        heart: '❤️',
        star: '⭐',
        home: '🏠',
        user: '👤',
        settings: '⚙️',
        menu: '☰',
        close: '✕',
        edit: '✏️',
        trash: '🗑️',
        download: '📥',
        upload: '📤',
        share: '📤',
        copy: '📋',
        save: '💾'
      };
      const icon = icons[name] || '❓';
      return React.createElement('span', { className, ...props }, icon);
    },
    'recharts': window.Recharts || {
      LineChart: () => '📊 Line Chart Placeholder',
      BarChart: () => '📊 Bar Chart Placeholder',
      PieChart: () => '📊 Pie Chart Placeholder',
      AreaChart: () => '📊 Area Chart Placeholder',
      Line: () => null,
      Bar: () => null,
      Pie: () => null,
      Area: () => null,
      XAxis: () => null,
      YAxis: () => null,
      CartesianGrid: () => null,
      Tooltip: () => null,
      Legend: () => null,
      ResponsiveContainer: ({ children }) => children || '📊 Chart Container'
    },
    'axios': window.axios || {
      get: (url) => Promise.resolve({ data: { message: 'Mock data for ' + url } }),
      post: (url, data) => Promise.resolve({ data: { success: true, received: data } }),
      put: (url, data) => Promise.resolve({ data: { success: true, updated: data } }),
      delete: (url) => Promise.resolve({ data: { success: true, deleted: url } }),
      // Add more HTTP methods as needed
      patch: (url, data) => Promise.resolve({ data: { success: true, patched: data } }),
      head: (url) => Promise.resolve({ status: 200 })
    },
    'marked': window.marked || {
      parse: (text) => text ? text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>') : '',
      parseInline: (text) => text || ''
    }
  };

  const pkg = packageMap[packageName];
  if (pkg) {
    console.log('✅ Loaded package: ' + packageName);
    return pkg;
  }

  console.warn('⚠️ Package \'' + packageName + '\' not available, using empty fallback');
  return {};
};

// Groq API key helper
function getMorphicGroqKey() {
  const readKey = (context) => {
    if (!context) return '';
    if (context.__MORPHIC_GROQ_KEY__) return context.__MORPHIC_GROQ_KEY__;
    try {
      if (context.localStorage) {
        const stored = context.localStorage.getItem('groq-api-key');
        if (stored) return stored;
      }
    } catch (err) {}
    return '';
  };
  if (typeof window !== 'undefined') {
    const direct = readKey(window);
    if (direct) return direct;
    if (window.parent && window.parent !== window) {
      const parentKey = readKey(window.parent);
      if (parentKey) return parentKey;
    }
  }
  return '';
}
window.getMorphicGroqKey = getMorphicGroqKey;

// Bind common globals into local scope so JSX like <motion.div> works reliably
const motion = window.motion;
const AnimatePresence = window.AnimatePresence;
const Lucide = window.Lucide;
const Recharts = window.Recharts || {};
const LineChart = window.LineChart || Recharts.LineChart || (() => null);
const Line = window.Line || Recharts.Line || (() => null);
const XAxis = window.XAxis || Recharts.XAxis || (() => null);
const YAxis = window.YAxis || Recharts.YAxis || (() => null);

${escapeInlineScript(code)}

// Error boundary for React app
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Preview Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-boundary' },
        React.createElement('div', { className: 'error-title' }, '⚠️ Preview Error'),
        React.createElement('div', { className: 'error-message' }, this.state.error?.message || 'Something went wrong in the preview')
      );
    }
    return this.props.children;
  }
}

try {
  const AppComponent = typeof App !== 'undefined'
    ? App
    : typeof GeneratedApp !== 'undefined'
      ? GeneratedApp
      : () => React.createElement('div', { className: 'p-8 text-center' }, 'App component not found');

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    React.createElement(ErrorBoundary, null, React.createElement(AppComponent))
  );

  window.parent?.postMessage({ type: 'preview-loaded', success: true }, '*');
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('💥 Render error:', error);
  window.parent?.postMessage({ type: 'preview-error', error: error?.message || 'Render error' }, '*');
}
}

// Make initializeApp available globally
window.initializeApp = initializeApp;

// If CDN is already ready, initialize immediately
if (window.CDN_READY) {
  initializeApp();
}`;

  return createScriptTag({ type: 'text/babel', content: runtimeContent });
};

const PREVIEW_BRIDGE_SCRIPT = createScriptTag({
  content: `(function() {
  const notifySuccess = () => window.parent?.postMessage({ type: 'preview-loaded', success: true }, '*');
  if (document.readyState === 'complete') {
    notifySuccess();
  } else {
    window.addEventListener('load', notifySuccess, { once: true });
  }
  window.addEventListener('error', (event) => {
    const message = (event.error && event.error.message) || event.message || 'Preview error';
    window.parent?.postMessage({ type: 'preview-error', error: message }, '*');
  });
})();`
});

const CDN_PACKAGES = {
  'react': 'https://unpkg.com/react@18/umd/react.development.js',
  'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'framer-motion': 'https://unpkg.com/framer-motion@11/dist/framer-motion.js',
  'lucide-react': 'https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js',
  'recharts': 'https://unpkg.com/recharts@2.8.0/umd/Recharts.js',
  'axios': 'https://unpkg.com/axios@1.5.0/dist/axios.min.js',
  'marked': 'https://unpkg.com/marked@9.1.2/marked.min.js'
};

const DEFAULT_LIB_SCRIPTS = [
  createScriptTag({ src: CDN_PACKAGES.react, crossorigin: 'anonymous' }),
  createScriptTag({ src: CDN_PACKAGES['react-dom'], crossorigin: 'anonymous' }),
  createScriptTag({ src: 'https://unpkg.com/@babel/standalone/babel.min.js', crossorigin: 'anonymous' }),
  createScriptTag({ src: CDN_PACKAGES['framer-motion'], crossorigin: 'anonymous' }),
  createScriptTag({ src: CDN_PACKAGES['lucide-react'], crossorigin: 'anonymous' }),
  createScriptTag({ src: CDN_PACKAGES.recharts, crossorigin: 'anonymous' }),
  createScriptTag({ src: CDN_PACKAGES.axios, crossorigin: 'anonymous' }),
  createScriptTag({ src: CDN_PACKAGES.marked, crossorigin: 'anonymous' })
];

const DEFAULT_STYLE_SCRIPT = createScriptTag({ src: 'https://cdn.tailwindcss.com' });

const buildLegacyDocument = (code) => {
  // Enhanced CDN loading with error handling and fallbacks
  const cdnScripts = `
    <script>
      window.CDN_LOADING_PROMISES = [];
      window.CDN_LOADED_PACKAGES = {};

      function loadCDNScript(src, packageName, globalVar) {
        return new Promise((resolve, reject) => {
          if (window.CDN_LOADED_PACKAGES[packageName]) {
            resolve();
            return;
          }

          const script = document.createElement('script');
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.onload = () => {
            console.log('✅ CDN loaded:', packageName);
            window.CDN_LOADED_PACKAGES[packageName] = true;
            resolve();
          };
          script.onerror = () => {
            console.warn('⚠️ CDN failed for:', packageName, '- using fallback');
            window.CDN_LOADED_PACKAGES[packageName] = false;
            resolve(); // Don't reject, just continue with fallback
          };
          document.head.appendChild(script);
        });
      }

      // Load React first (critical)
      window.CDN_LOADING_PROMISES.push(
        loadCDNScript('https://unpkg.com/react@18/umd/react.development.js', 'react', 'React')
      );

      // Load ReactDOM second (critical)
      window.CDN_LOADING_PROMISES.push(
        loadCDNScript('https://unpkg.com/react-dom@18/umd/react-dom.development.js', 'react-dom', 'ReactDOM')
      );

      // Load Babel (critical for JSX)
      window.CDN_LOADING_PROMISES.push(
        loadCDNScript('https://unpkg.com/@babel/standalone/babel.min.js', 'babel', 'Babel')
      );

      // Optional packages will load after critical scripts

      // Load TailwindCSS
      window.CDN_LOADING_PROMISES.push(
        loadCDNScript('https://cdn.tailwindcss.com', 'tailwindcss', 'tailwindcss')
      );

      // Wait for critical scripts, then initialize and load optional packages safely
      Promise.all(window.CDN_LOADING_PROMISES.slice(0, 3)).then(() => {
        console.log('🚀 Critical CDN scripts loaded, initializing app...');

        // Load optional scripts only after React is present
        if (window.React) {
          loadCDNScript('https://unpkg.com/framer-motion@11/dist/framer-motion.js', 'framer-motion', 'FramerMotion');
          loadCDNScript('https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js', 'lucide-react', 'LucideReact');
          loadCDNScript('https://unpkg.com/recharts@2.8.0/umd/Recharts.js', 'recharts', 'Recharts');
          loadCDNScript('https://unpkg.com/axios@1.5.0/dist/axios.min.js', 'axios', 'axios');
          loadCDNScript('https://unpkg.com/marked@9.1.2/marked.min.js', 'marked', 'marked');
        }

        window.CDN_READY = true;
        if (window.initializeApp) {
          window.initializeApp();
        }
      });
    </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated App Preview</title>
  ${cdnScripts}
  <style>body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
.error-boundary { padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; margin: 20px; }
.error-title { color: #c53030; font-weight: bold; margin-bottom: 10px; }
.error-message { color: #744210; }</style>
</head>
<body>
  <div id="root"></div>
  ${buildLegacyRuntimeScript(code)}
  ${PREVIEW_BRIDGE_SCRIPT}
</body>
</html>`;
};

const buildDynamicDocument = (code) => {
  try {
    const detection = detectPackages(code || '');
    return buildPreviewHTML(code || '', detection);
  } catch (err) {
    console.warn('Dynamic preview build failed, falling back to legacy:', err);
    return buildLegacyDocument(code || '');
  }
};

const buildManifestDocument = (manifest, code) => {
  const headParts = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<title>Generated App Preview</title>',
    createStyleTag({ content: LEGACY_BODY_STYLE })
  ];

  if (manifest?.html?.head) {
    headParts.push(manifest.html.head);
  }

  const styleTags = [];
  (manifest?.styles || []).forEach((style) => {
    if (style?.href) {
      styleTags.push(createLinkTag(style));
    } else if (style?.content) {
      styleTags.push(createStyleTag(style));
    }
  });
  if (styleTags.length) {
    headParts.push(...styleTags);
  }

  const bodyContent = manifest?.html?.body || '<div id="root"></div>';

  const scriptTags = [];
  (manifest?.scripts || []).forEach((script) => {
    const tag = createScriptTag(script);
    if (tag) {
      scriptTags.push(tag);
    }
  });

  const hasEntry = Boolean(manifest?.entry && (manifest.entry.src || manifest.entry.content));
  if (hasEntry) {
    scriptTags.push(createScriptTag(manifest.entry));
  }

  if (!hasEntry) {
    headParts.push(DEFAULT_STYLE_SCRIPT);
    headParts.push(...DEFAULT_LIB_SCRIPTS);
    scriptTags.push(buildLegacyRuntimeScript(code));
  }

  scriptTags.push(PREVIEW_BRIDGE_SCRIPT);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${headParts.join('\n  ')}
</head>
<body>
  ${bodyContent}
  ${scriptTags.join('\n  ')}
</body>
</html>`;
};

const createPreviewDocument = (app, localManifestOverride) => {
  const { previewManifest, code } = app || {};
  const manifest = localManifestOverride || previewManifest;
  if (manifest) {
    return buildManifestDocument(manifest, code || '');
  }
  return buildDynamicDocument(code || '');
};

const LivePreview = ({ app }) => {
  const [previewError, setPreviewError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);
  const [localManifest, setLocalManifest] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!app?.code) return;

    setIsLoading(true);
    setPreviewError(null);

    const handleMessage = (event) => {
      if (event.data.type === 'preview-loaded') {
        console.log('✅ Preview loaded successfully');
        setIsLoading(false);
        setPreviewError(null);
      } else if (event.data.type === 'preview-error') {
        console.error('❌ Preview error:', event.data.error);
        setIsLoading(false);
        setPreviewError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    // Load the preview immediately
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        const htmlContent = createPreviewDocument(app, localManifest);
        console.log('🚀 Loading preview, content length:', htmlContent.length);

        // Clear any existing content first
        iframe.srcdoc = '';

        // Small delay to ensure iframe is ready, then set content
        setTimeout(() => {
          if (iframe && iframe.parentNode) { // Make sure iframe is still mounted
            iframe.srcdoc = htmlContent;
            console.log('📄 Iframe content set successfully');
          }
        }, 50);

      } catch (error) {
        console.error('💥 Preview setup error:', error);
        setIsLoading(false);
        setPreviewError(error.message || 'Preview setup failed');
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [app, localManifest]);

  const refreshPreview = () => {
    if (!iframeRef.current || !app?.code) return;
    setIsLoading(true);
    setPreviewError(null);
    try {
      const htmlContent = createPreviewDocument(app, localManifest);
      console.log('Refreshing iframe content, length:', htmlContent.length);
      iframeRef.current.srcdoc = htmlContent;
    } catch (error) {
      console.error('Preview refresh error:', error);
      setIsLoading(false);
      setPreviewError(error.message || 'Preview manifest missing or invalid.');
    }
  };

  const fixPreviewWithAI = async () => {
    if (!app?.code) return;
    try {
      setIsFixing(true);
      setPreviewError(null);
      const { manifest } = await groqService.generatePreviewManifestStrict({
        code: app.code,
        context: {},
        modelId: app.model || 'llama-3.1-70b-versatile'
      });
      setLocalManifest(manifest);
      if (app.id) {
        const updated = versionService.updateVersion(app.id, { previewManifest: manifest });
        if (!updated) {
          // Fallback: persist to current app snapshot if version id is not in history yet
          versionService.setCurrentApp({ ...app, previewManifest: manifest });
        }
      }
      // Force refresh with the new manifest
      if (iframeRef.current) {
        const htmlContent = createPreviewDocument(app, manifest);
        iframeRef.current.srcdoc = htmlContent;
      }
      setIsLoading(false);
    } catch (err) {
      console.error('AI manifest generation failed:', err);
      setPreviewError(err?.message || 'Failed to generate preview manifest');
    } finally {
      setIsFixing(false);
    }
  };

  const openInNewTab = () => {
    if (!app?.code) return;

    try {
      const htmlContent = createPreviewDocument(app, localManifest);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setPreviewError(error.message || 'Preview manifest missing or invalid.');
    }
  };

  if (!app) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">No app to preview</div>
        <p className="text-gray-500">Generate an app first to see the live preview</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Live Preview</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span>App: {app.appIdea}</span>
            <span>•</span>
            <span>Model: {app.model}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              {app.isWorking ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Working</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400">Fallback</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshPreview}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={fixPreviewWithAI}
            disabled={isFixing}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isFixing ? 'Fixing…' : 'Fix Preview (AI)'}</span>
          </button>
          
          <button
            onClick={openInNewTab}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        <div className="bg-white/10 px-6 py-3 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-sm text-gray-300">Generated App Preview</div>
            {isLoading && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative" style={{ height: '70vh' }}>
          {previewError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center p-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Preview Error</h3>
                <p className="text-red-600 mb-4">{previewError}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={refreshPreview}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={fixPreviewWithAI}
                    disabled={isFixing}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isFixing ? 'Fixing…' : 'Fix with AI'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="App Preview"
            />
          )}
          
          {isLoading && !previewError && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
          <h4 className="font-semibold text-white mb-2">Generation Time</h4>
          <p className="text-gray-300 text-sm">
            {new Date(app.timestamp).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
          <h4 className="font-semibold text-white mb-2">Template Used</h4>
          <p className="text-gray-300 text-sm capitalize">
            {app.template.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
          <h4 className="font-semibold text-white mb-2">Code Lines</h4>
          <p className="text-gray-300 text-sm">
            {app.code.split('\n').length} lines
          </p>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
