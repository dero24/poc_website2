import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

const LivePreview = ({ app }) => {
  const [previewError, setPreviewError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  const createPreviewHTML = (code) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
        .error-boundary { padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; margin: 20px; }
        .error-title { color: #c53030; font-weight: bold; margin-bottom: 10px; }
        .error-message { color: #744210; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        
        // Error Boundary Component
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
                    return (
                        <div className="error-boundary">
                            <div className="error-title">⚠️ Preview Error</div>
                            <div className="error-message">
                                {this.state.error?.message || 'Something went wrong in the preview'}
                            </div>
                        </div>
                    );
                }
                
                return this.props.children;
            }
        }
        
        // Generated App Code
        ${code}
        
        // Render the app
        try {
            const AppComponent = typeof App !== 'undefined' ? App : 
                               typeof GeneratedApp !== 'undefined' ? GeneratedApp :
                               function DefaultApp() {
                                   return React.createElement('div', {
                                       className: 'p-8 text-center'
                                   }, 'App component not found');
                               };
            
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(
                React.createElement(ErrorBoundary, null,
                    React.createElement(AppComponent)
                )
            );
            
            // Signal successful load
            window.parent.postMessage({ type: 'preview-loaded', success: true }, '*');
        } catch (error) {
            console.error('Render error:', error);
            window.parent.postMessage({ 
                type: 'preview-error', 
                error: error.message 
            }, '*');
        }
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

    // Load the preview
    const iframe = iframeRef.current;
    if (iframe) {
      const htmlContent = createPreviewHTML(app.code);
      iframe.srcdoc = htmlContent;
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [app?.code]);

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
