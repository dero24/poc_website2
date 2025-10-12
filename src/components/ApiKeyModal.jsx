import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Shield, Zap } from 'lucide-react';

const ApiKeyModal = ({ onSubmit, onClose, currentKey }) => {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your Groq API key');
      return;
    }

    if (!apiKey.startsWith('gsk_')) {
      setError('Invalid Groq API key format. Keys should start with "gsk_"');
      return;
    }

    onSubmit(apiKey.trim());
  };

  const handleGetApiKey = () => {
    window.open('https://console.groq.com/keys', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Groq API Key Required</h2>
          <p className="text-gray-300">
            Enter your Groq API key to start generating amazing apps instantly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="gsk_..."
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Your API key is secure</p>
                <p>Keys are stored locally in your browser and never sent to our servers. Only used to communicate directly with Groq's API.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleGetApiKey}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Get API Key</span>
            </button>
            
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Start Creating</span>
            </button>
          </div>

          {currentKey && (
            <button
              type="button"
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Instructions */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <h3 className="text-sm font-medium text-white mb-3">How to get your Groq API key:</h3>
          <ol className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Visit <span className="text-blue-400">console.groq.com</span> and sign up for free</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Navigate to the API Keys section</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Create a new API key and copy it here</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
