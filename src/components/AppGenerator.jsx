import React, { useState } from 'react';
import { Sparkles, Wand2, Zap } from 'lucide-react';
import { PROMPT_TEMPLATES, buildPrompt, FALLBACK_CODE } from '../prompts/templates';
import groqService from '../services/groqService';

const AppGenerator = ({ onAppGenerated, isGenerating, setIsGenerating, onRequireApiKey, aiIdeas, onRefreshIdeas, loadingIdeas }) => {
  const [appIdea, setAppIdea] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    const models = groqService.getAvailableModels();
    if (Array.isArray(models) && models.length > 0) {
      return models[0]?.id || 'llama-3.1-70b-versatile';
    }
    if (models && typeof models === 'object') {
      const [firstKey, firstValue] = Object.entries(models)[0] || [];
      if (typeof firstValue === 'string') return firstKey;
      if (firstValue?.id) return firstValue.id;
    }
    return 'llama-3.1-70b-versatile';
  });
  const [error, setError] = useState('');

  const rawModels = groqService.getAvailableModels();
  const modelOptions = Array.isArray(rawModels)
    ? rawModels
    : Object.entries(rawModels || {}).map(([id, value]) => ({
        id,
        label: typeof value === 'string' ? value : value?.label || id
      }));

  const handleGenerate = async () => {
    if (!appIdea.trim()) {
      setError('Please describe your app idea');
      return;
    }

    const apiKey = groqService.getApiKey();
    if (!apiKey) {
      setError('Add your Groq API key in the settings to generate apps.');
      if (typeof onRequireApiKey === 'function') {
        onRequireApiKey();
      }
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const template = PROMPT_TEMPLATES.base;
      const prompt = buildPrompt(template.template, appIdea, {
        apiKey,
        modelId: selectedModel
      });

      const generatedCode = await groqService.generateCode(prompt, selectedModel);
      
      if (!groqService.validateCode(generatedCode)) {
        throw new Error('Generated code failed validation');
      }

      const appData = {
        id: Date.now().toString(),
        appIdea,
        model: selectedModel,
        template: 'base',
        code: generatedCode,
        prompt,
        timestamp: Date.now(),
        isWorking: true
      };

      onAppGenerated(appData);
    } catch (error) {
      console.error('Generation error:', error);
      setError(error.message);
      
      // Provide fallback
      const fallbackApp = {
        id: Date.now().toString(),
        appIdea: `Fallback for: ${appIdea}`,
        model: selectedModel,
        template: 'fallback',
        code: FALLBACK_CODE,
        prompt: 'Fallback due to generation error',
        timestamp: Date.now(),
        isWorking: false
      };
      
      onAppGenerated(fallbackApp);
    } finally {
      setIsGenerating(false);
    }
  };

  // Use AI-generated ideas passed from parent component

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Create Anything, Instantly
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Describe your app idea in natural language and watch Groq's AI transform it into a fully working web application in seconds.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        {/* App Idea Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-white mb-3">
            Describe Your App Idea
          </label>
          <textarea
            value={appIdea}
            onChange={(e) => setAppIdea(e.target.value)}
            placeholder="E.g., A todo app with AI-powered task prioritization and deadline suggestions..."
            className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Groq Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            >
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id} className="bg-gray-800">
                  {model.label || model.id}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-300">
            <p className="font-semibold text-white mb-2">AI usage policy</p>
            <p>
              Groq decides when AI calls are needed. The API key is injected automatically into generated apps, so you never have to expose it to users.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !appIdea.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-3">
            <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="text-lg">
              {isGenerating ? 'Generating...' : 'Generate App'}
            </span>
            <Zap className="w-5 h-5" />
          </div>
        </button>

        {/* AI-Generated Ideas */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Need a spark? AI-generated ideas:</h3>
            <button
              onClick={onRefreshIdeas}
              disabled={loadingIdeas || isGenerating}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loadingIdeas ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiIdeas.map((idea, index) => (
              <button
                key={index}
                onClick={() => setAppIdea(idea)}
                className="text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-gray-300 hover:text-white transition-all text-sm"
                disabled={isGenerating || loadingIdeas}
              >
                → {idea}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppGenerator;
