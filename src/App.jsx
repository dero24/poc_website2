import React, { useState, useEffect } from 'react';
import { Sparkles, Code, Play, History, Settings, Download, Upload, Zap } from 'lucide-react';
import AppGenerator from './components/AppGenerator';
import CodeViewer from './components/CodeViewer';
import LivePreview from './components/LivePreview';
import VersionHistory from './components/VersionHistory';
import ApiKeyModal from './components/ApiKeyModal';
import groqService from './services/groqService';
import versionService from './services/versionService';

function App() {
  const [currentView, setCurrentView] = useState('generator');
  const [generatedApp, setGeneratedApp] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Check for stored API key
    const storedKey = localStorage.getItem('groq-api-key');
    if (storedKey) {
      setApiKey(storedKey);
      groqService.setApiKey(storedKey);
      if (typeof window !== 'undefined') {
        window.__MORPHIC_GROQ_KEY__ = storedKey;
        window.GROQ_API_KEY = storedKey;
      }
    } else {
      setShowApiModal(true);
      if (typeof window !== 'undefined') {
        delete window.__MORPHIC_GROQ_KEY__;
        delete window.GROQ_API_KEY;
      }
    }

    // Load current app if exists
    const currentApp = versionService.getCurrentApp();
    if (currentApp) {
      setGeneratedApp(currentApp);
      setCurrentView('preview');
    }
  }, []);

  const handleApiKeySubmit = (key) => {
    setApiKey(key);
    groqService.setApiKey(key);
    localStorage.setItem('groq-api-key', key);
    setShowApiModal(false);
    if (typeof window !== 'undefined') {
      window.__MORPHIC_GROQ_KEY__ = key;
      window.GROQ_API_KEY = key;
    }
  };

  const handleAppGenerated = (appData) => {
    const saved = versionService.saveVersion(appData);
    setGeneratedApp(saved);
    setCurrentView('preview');
  };

  const handleVersionSelect = (version) => {
    setGeneratedApp(version);
    versionService.setCurrentApp(version);
    setCurrentView('preview');
  };

  const navigation = [
    { id: 'generator', label: 'Generate', icon: Sparkles },
    { id: 'preview', label: 'Preview', icon: Play, disabled: !generatedApp },
    { id: 'code', label: 'Code', icon: Code, disabled: !generatedApp },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Morphic Web</h1>
                <p className="text-xs text-gray-300">Instant App Creation</p>
              </div>
            </div>
            
            <nav className="flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setCurrentView(item.id)}
                    disabled={item.disabled}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                      currentView === item.id
                        ? 'bg-white/20 text-white'
                        : item.disabled
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => setShowApiModal(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="API Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'generator' && (
          <AppGenerator
            onAppGenerated={handleAppGenerated}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            onRequireApiKey={() => setShowApiModal(true)}
          />
        )}
        
        {currentView === 'preview' && generatedApp && (
          <LivePreview app={generatedApp} />
        )}
        
        {currentView === 'code' && generatedApp && (
          <CodeViewer app={generatedApp} />
        )}
        
        {currentView === 'history' && (
          <VersionHistory onVersionSelect={handleVersionSelect} />
        )}
      </main>

      {/* API Key Modal */}
      {showApiModal && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onClose={() => setShowApiModal(false)}
          currentKey={apiKey}
        />
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Generating Your App</h3>
            <p className="text-gray-300">Groq is crafting your perfect application...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
