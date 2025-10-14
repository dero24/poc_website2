import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

const LivePreview = ({ app }) => {
  const [previewError, setPreviewError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  const createPreviewHTML = (code) => {
    const base64 = btoa(unescape(encodeURIComponent(code)));
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Morphic Web Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
            gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' }
          },
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          boxShadow: { 'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)' }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://unpkg.com/lucide-react@0.468.0/dist/lucide-react.umd.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js"></script>
  <script src="https://unpkg.com/reactflow@11/dist/umd/index.js"></script>
  <script src="https://unpkg.com/react-knowledge-graph@1/dist/index.umd.js"></script>
  <script src="https://unpkg.com/recharts@2/umd/Recharts.js"></script>
  <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.umd.js"></script>
  <script src="https://unpkg.com/react-spring@9/dist/react-spring.umd.js"></script>
  <script src="https://unpkg.com/react-dnd@16/dist/umd/ReactDnD.min.js"></script>
  <script src="https://unpkg.com/react-dnd-html5-backend@16/dist/umd/ReactDnDHTML5Backend.min.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0f172a; color:#e2e8f0; }
    .fallback-shell { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:3rem; text-align:center; gap:1rem; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    const raw = decodeURIComponent(escape(window.atob('${base64}')));
    const transformed = Babel.transform(raw, {
      presets: [
        ['env', { modules: 'commonjs' }],
        'react'
      ],
      sourceType: 'module'
    }).code;

    const moduleMap = {
      react: React,
      'react-dom': ReactDOM,
      'react-dom/client': ReactDOM,
      'react/jsx-runtime': React,
      axios: window.axios,
      'axios/index': window.axios,
      'axios/default': window.axios,
      'react-router-dom': window.ReactRouterDOM,
      'react-router-dom/client': window.ReactRouterDOM,
      'react-router-dom/server': window.ReactRouterDOM,
      'react-router': window.ReactRouterDOM,
      reactflow: window.ReactFlow,
      'reactflow/dist/style.css': {},
      'react-knowledge-graph': window.ReactKnowledgeGraph,
      recharts: window.Recharts,
      'framer-motion': window.framerMotion || window.FramerMotion || {},
      'framer-motion/dist/framer-motion': window.framerMotion || window.FramerMotion || {},
      '@framer-motion/react': window.framerMotion || window.FramerMotion || {},
      'react-spring': window.ReactSpring,
      'react-dnd': window.ReactDnD,
      'react-dnd-html5-backend': window.ReactDnDHTML5Backend,
      '@react-spring/web': window.ReactSpring,
      marked: window.marked,
      'marked/marked.min': window.marked
    };

    const require = (name) => {
      if (name.endsWith('.css')) {
        return {};
      }

      if (name.startsWith('tailwindcss')) {
        return {};
      }

      if (name === 'lucide-react' || name.startsWith('lucide-react/')) {
        const lucide = window.lucideReact || window.LucideReact || window.lucide;
        if (!lucide) {
          console.warn('Lucide icons failed to load in preview');
          return {};
        }

        const icons = lucide.icons ?? {};
        return {
          ...lucide,
          ...icons,
          default: lucide,
          icons
        };
      }

      if (name === 'recharts' || name.startsWith('recharts/')) {
        if (!window.Recharts) {
          console.warn('Recharts failed to load in preview');
          return {};
        }
        return window.Recharts;
      }

      if (name === 'marked' || name.startsWith('marked/')) {
        if (!window.marked) {
          console.warn('Marked library failed to load in preview');
          return {};
        }
        const marked = window.marked;
        return {
          ...marked,
          default: marked,
          marked
        };
      }

      if (name === 'framer-motion' || name.startsWith('framer-motion/')) {
        const framerMotion = window.framerMotion || window.FramerMotion;
        if (!framerMotion) {
          // Return mock framer-motion objects to prevent crashes
          return {
            motion: {
              div: 'div',
              span: 'span', 
              button: 'button',
              section: 'section',
              h1: 'h1',
              h2: 'h2',
              h3: 'h3',
              p: 'p',
              img: 'img',
              a: 'a'
            },
            AnimatePresence: ({ children }) => children,
            useAnimation: () => ({}),
            useMotionValue: (initial) => ({ get: () => initial, set: () => {} }),
            useTransform: () => ({}),
            default: {
              div: 'div',
              span: 'span',
              button: 'button'
            }
          };
        }
        return framerMotion;
      }

      if (moduleMap[name]) {
        return moduleMap[name];
      }

      const trimmed = name.replace(/\.js$/i, '');
      if (moduleMap[trimmed]) {
        return moduleMap[trimmed];
      }

      // Log unsupported imports but don't crash the app
      console.warn('Unsupported import in preview:', name);
      return {};
    };

    const exports = {};
    const module = { exports };

    try {
      const fn = new Function('exports', 'module', 'require', 'React', 'ReactDOM', transformed);
      fn(exports, module, require, React, ReactDOM);
    } catch (error) {
      console.error('Preview execution error', error);
      window.__morphic_error = error;
      window.parent.postMessage({ type: 'preview-error', error: error.message }, '*');
      return;
    }

    const candidate = module.exports?.default || exports.default || window.App || window.GeneratedApp;
    const RootComponent = candidate || (() => {
      const errorMsg = window.__morphic_error ? window.__morphic_error.message : 'No component exported from generated code.';
      console.error('Preview render failed:', errorMsg);
      return React.createElement('div', { className: 'fallback-shell' }, [
        React.createElement('div', { key: 'emoji', style: { fontSize: '3rem' } }, '⚠️'),
        React.createElement('div', { key: 'message', style: { marginBottom: '1rem' } }, 'Preview Error'),
        React.createElement('div', { key: 'details', style: { fontSize: '0.9rem', opacity: 0.7 } }, errorMsg),
        React.createElement('div', { key: 'help', style: { fontSize: '0.8rem', marginTop: '1rem', opacity: 0.6 } }, 'Try regenerating or check the code for syntax errors.')
      ]);
    });

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(RootComponent));
    window.parent.postMessage({ type: 'preview-loaded', success: true }, '*');
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    if (!app?.code) return;

    setIsLoading(true);
    setPreviewError(null);

    const handleMessage = (event) => {
      if (event.data.type === 'preview-loaded') {
        setIsLoading(false);
        setPreviewError(null);
      } else if (event.data.type === 'preview-error') {
        setIsLoading(false);
        setPreviewError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    // Load the preview with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const iframe = iframeRef.current;
      if (iframe) {
        const htmlContent = createPreviewHTML(app.code);
        iframe.srcdoc = htmlContent;
      }
    }, 100);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [app?.code, app?.timestamp]); // Added timestamp to force refresh on code changes

  const refreshPreview = () => {
    if (iframeRef.current && app?.code) {
      setIsLoading(true);
      setPreviewError(null);
      const htmlContent = createPreviewHTML(app.code);
      iframeRef.current.srcdoc = htmlContent;
    }
  };

  const openInNewTab = () => {
    if (!app?.code) return;
    
    const htmlContent = createPreviewHTML(app.code);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
                <button
                  onClick={refreshPreview}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
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
