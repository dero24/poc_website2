import React from 'react';
import { Sparkles, Wand2, Zap, CheckCircle, ArrowRight, Settings } from 'lucide-react';

const EXAMPLE_IDEAS = [
  'AI-powered todo list with smart categorization',
  'Real-time weather dashboard with beautiful animations',
  'Interactive memory card game with scoring',
  'Expense tracker with visual charts and budgeting',
  'AI chatbot for customer support',
  'Pomodoro timer with productivity insights',
  'Recipe finder with ingredient substitutions',
  'Habit tracker with streak visualization'
];

const AppGenerator = ({
  appIdea,
  onAppIdeaChange,
  modelKey,
  onModelChange,
  modelOptions = [],
  isGenerating,
  onGenerate,
  errorMessage,
  onUseExample,
  // Multi-pass props
  blueprint = null,
  generationStage = 'idle',
  hasBlueprint = false,
  hasImplementation = false
}) => {
  const displayedModels = Array.isArray(modelOptions) && modelOptions.length
    ? modelOptions
    : [{ id: modelKey, label: modelKey }];

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
            onChange={(e) => onAppIdeaChange?.(e.target.value)}
            placeholder="E.g., A todo app with AI-powered task prioritization and deadline suggestions..."
            className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Groq Model
            </label>
            <select
              value={modelKey}
              onChange={(e) => onModelChange?.(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            >
              {displayedModels.map((model) => (
                <option key={model.id} value={model.id} className="bg-gray-800">
                  {model.label || model.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300">{errorMessage}</p>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-lg font-semibold text-blue-200">
                {generationStage === 'blueprint' && 'Creating Blueprint...'}
                {generationStage === 'implementation' && 'Building Implementation...'}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${generationStage === 'blueprint' ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'}`}></div>
              <span className="text-sm text-blue-200">Blueprint</span>
              <ArrowRight className="w-4 h-4 text-blue-300" />
              <div className={`w-3 h-3 rounded-full ${generationStage === 'implementation' ? 'bg-green-500 animate-pulse' : generationStage === 'blueprint' ? 'bg-gray-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-blue-200">Implementation</span>
            </div>
          </div>
        )}

        {/* Blueprint Preview Panel */}
        {hasBlueprint && blueprint && !isGenerating && (
          <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Blueprint Complete</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Summary</h4>
                <p className="text-sm text-white/60">{blueprint.summary}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Visual Style</h4>
                <p className="text-sm text-white/60">
                  {blueprint.visualStyle?.themeWords?.join(', ') || 'Modern, clean design'}
                </p>
              </div>
            </div>

            {blueprint.aiBehaviors?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white/80 mb-2">AI Features</h4>
                <div className="flex flex-wrap gap-2">
                  {blueprint.aiBehaviors.slice(0, 3).map((behavior, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-md"
                    >
                      {behavior.name}
                    </span>
                  ))}
                  {blueprint.aiBehaviors.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded-md">
                      +{blueprint.aiBehaviors.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Generate Button */}
        <button
          onClick={() => onGenerate?.()}
          disabled={isGenerating || !appIdea.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-3">
            <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="text-lg">
              {isGenerating
                ? 'Generating Your App...'
                : 'Generate Application'}
            </span>
            <Sparkles className="w-5 h-5" />
          </div>
        </button>

        {/* Example Ideas */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-white mb-4">Need inspiration? Try these ideas:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLE_IDEAS.map((idea, index) => (
              <button
                key={index}
                onClick={() => onUseExample?.(idea)}
                className="text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-gray-300 hover:text-white transition-all text-sm"
                disabled={isGenerating}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppGenerator;
