import React, { useState } from 'react';
import { Sparkles, Wand2, Cpu, Zap } from 'lucide-react';
import { PROMPT_TEMPLATES, buildPrompt, FALLBACK_CODE } from '../prompts/templates';
import groqService from '../services/groqService';

const AppGenerator = ({ onAppGenerated, isGenerating, setIsGenerating }) => {
  const [appIdea, setAppIdea] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('base');
  const [selectedModel, setSelectedModel] = useState('llama-3.1-70b-versatile');
  const [includeAI, setIncludeAI] = useState(false);
  const [error, setError] = useState('');

  const models = groqService.getAvailableModels();

  const handleGenerate = async () => {
    if (!appIdea.trim()) {
      setError('Please describe your app idea');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const template = PROMPT_TEMPLATES[selectedTemplate];
      const prompt = buildPrompt(template.template, appIdea, includeAI);
      
      console.log('Generating with prompt:', prompt);
      
      const generatedCode = await groqService.generateCode(prompt, selectedModel);
      
      if (!groqService.validateCode(generatedCode)) {
        throw new Error('Generated code failed validation');
      }

      const appData = {
        id: Date.now().toString(),
        appIdea,
        model: selectedModel,
        template: selectedTemplate,
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

  const exampleIdeas = [
    "AI-powered todo list with smart categorization",
    "Real-time weather dashboard with beautiful animations", 
    "Interactive memory card game with scoring",
    "Expense tracker with visual charts and budgeting",
    "AI chatbot for customer support",
    "Pomodoro timer with productivity insights",
    "Recipe finder with ingredient substitutions",
    "Habit tracker with streak visualization"
  ];

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

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              App Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            >
              {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key} className="bg-gray-800">
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
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
              {Object.entries(models).map(([key, name]) => (
                <option key={key} value={key} className="bg-gray-800">
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* AI Features Toggle */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              AI Features
            </label>
            <button
              onClick={() => setIncludeAI(!includeAI)}
              className={`w-full px-4 py-3 rounded-lg border transition-all ${
                includeAI
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              }`}
              disabled={isGenerating}
            >
              <div className="flex items-center justify-center space-x-2">
                <Cpu className="w-4 h-4" />
                <span>{includeAI ? 'Enabled' : 'Disabled'}</span>
              </div>
            </button>
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

        {/* Example Ideas */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-white mb-4">Need inspiration? Try these ideas:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleIdeas.map((idea, index) => (
              <button
                key={index}
                onClick={() => setAppIdea(idea)}
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
