import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

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
  const runtimeContent = `const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Enhanced CDN package resolution
window.require = function(packageName) {
  const packageMap = {
    'react': React,
    'react-dom': ReactDOM,
    'framer-motion': window.FramerMotion || { motion: (tag) => tag },
    'lucide-react': window.LucideReact || {},
    'recharts': window.Recharts || {},
    'axios': window.axios || { get: () => Promise.resolve({ data: {} }), post: () => Promise.resolve({ data: {} }) },
    'marked': window.marked || { parse: (text) => text }
  };
  
  if (packageMap[packageName]) {
    return packageMap[packageName];
  }
  
  console.warn(\`Package '\${packageName}' not available in CDN preview. Using fallback.\`);
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

${escapeInlineScript(code)}

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
} catch (error) {
  console.error('Render error:', error);
  window.parent?.postMessage({ type: 'preview-error', error: error?.message || 'Render error' }, '*');
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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated App Preview</title>
  ${DEFAULT_LIB_SCRIPTS.join('\n  ')}
  ${DEFAULT_STYLE_SCRIPT}
  ${createStyleTag({ content: LEGACY_BODY_STYLE })}
</head>
<body>
  <div id="root"></div>
  ${buildLegacyRuntimeScript(code)}
  ${PREVIEW_BRIDGE_SCRIPT}
</body>
</html>`;
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

const createPreviewDocument = (app) => {
  const { previewManifest, code } = app || {};
  if (previewManifest) {
    return buildManifestDocument(previewManifest, code || '');
  }
  return buildLegacyDocument(code || '');
};

const LivePreview = ({ app }) => {
  const [previewError, setPreviewError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

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

    // Load the preview
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        const htmlContent = createPreviewDocument(app);
        iframe.srcdoc = htmlContent;
      } catch (error) {
        setIsLoading(false);
        setPreviewError(error.message || 'Preview manifest missing or invalid.');
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [app]);

  const refreshPreview = () => {
    if (!iframeRef.current || !app?.code) return;
    setIsLoading(true);
    setPreviewError(null);
    try {
      const htmlContent = createPreviewDocument(app);
      iframeRef.current.srcdoc = htmlContent;
    } catch (error) {
      setIsLoading(false);
      setPreviewError(error.message || 'Preview manifest missing or invalid.');
    }
  };

  const openInNewTab = () => {
    if (!app?.code) return;

    try {
      const htmlContent = createPreviewDocument(app);
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
