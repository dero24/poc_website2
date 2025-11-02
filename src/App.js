import React, { useState, useEffect, useMemo, useCallback } from './lib/react.js';
import groqService from './services/groqService.js';
import versionService from './services/versionService.js';
import {
  buildDynamicPrompt,
  FALLBACK_CODE
} from './prompts/templates.js';
import { buildPreviewHTML } from './lib/previewRuntime.js';

const h = React.createElement;

const EXAMPLE_IDEAS = [
  'AI productivity hub with task insights and focus music',
  'Mood-based recipe recommender with pantry inventory',
  'Interactive workout planner with adaptive difficulty',
  'Financial wellness dashboard with smart savings goals',
  'AI storytelling studio with character memory',
  'Habit tracker with celebratory streak animations'
];

function App() {
  const [activeView, setActiveView] = useState('generate');
  const [apiKey, setApiKey] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [appIdea, setAppIdea] = useState('');
  const templateKey = 'base';
  const [modelKey, setModelKey] = useState('llama-3.1-70b-versatile');
  const [modelOptions, setModelOptions] = useState(groqService.getAvailableModels());
  const includeAI = true;
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedApp, setGeneratedApp] = useState(null);
  const [versions, setVersions] = useState([]);

  const refreshHistory = useCallback(() => {
    setVersions(versionService.getAllVersions());
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem('groq-api-key');
    if (storedKey) {
      setApiKey(storedKey);
      groqService.setApiKey(storedKey);
    } else {
      setShowApiModal(true);
    }

    const currentApp = versionService.getCurrentApp();
    if (currentApp) {
      setGeneratedApp(currentApp);
      setActiveView('preview');
    }

    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let cancelled = false;
    const loadModels = async () => {
      const list = await groqService.refreshModels();
      if (cancelled) return;
      setModelOptions(list);
      const preferred = list.find((entry) => entry.id === modelKey);
      if (!preferred && list.length) {
        setModelKey(list[0].id);
      }
    };
    loadModels();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const handleApiKeySubmit = useCallback((key) => {
    const trimmed = key.trim();
    localStorage.setItem('groq-api-key', trimmed);
    groqService.setApiKey(trimmed);
    setApiKey(trimmed);
    setShowApiModal(false);
    groqService.refreshModels().then((list) => {
      setModelOptions(list);
      const existing = list.find((entry) => entry.id === modelKey);
      if (!existing && list.length) {
        setModelKey(list[0].id);
      }
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!appIdea.trim()) {
      setErrorMessage('Describe what you want Morphic Web to build.');
      return;
    }

    if (!apiKey) {
      setShowApiModal(true);
      return;
    }

    // Build a dynamic fragment-first prompt for Groq
    const prompt = buildDynamicPrompt(appIdea, {
      apiKey,
      modelId: modelKey,
      includeAI: includeAI,
      preferredLib: 'preact',
      uiStyle: 'clean'
    });

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const generatedCode = await groqService.generateCode(prompt, modelKey);
      const appData = {
        id: Date.now().toString(),
        appIdea,
        model: modelKey,
        template: 'base',
        code: generatedCode,
        prompt,
        timestamp: Date.now(),
        isWorking: true
      };

      setGeneratedApp(appData);
      setActiveView('preview');
      versionService.saveVersion(appData);
      setTimeout(() => refreshHistory(), 0);
    } catch (error) {
      console.error(error);
      const message = error?.message || 'Generation failed.';
      setErrorMessage(message);

      const unauthorized = /401|api key|unauthorized/i.test(message);
      if (unauthorized) {
        localStorage.removeItem('groq-api-key');
        groqService.setApiKey(null);
        setApiKey('');
        setShowApiModal(true);
        setGeneratedApp(null);
        setActiveView('generate');
        return;
      }

      const fallbackApp = {
        id: Date.now().toString(),
        appIdea: `Fallback for: ${appIdea}`,
        model: modelKey,
        template: 'fallback',
        code: FALLBACK_CODE,
        prompt: 'Fallback shell because generation failed.',
        timestamp: Date.now(),
        isWorking: false
      };
      setGeneratedApp(fallbackApp);
      setActiveView('preview');
      versionService.saveVersion(fallbackApp);
      setTimeout(() => refreshHistory(), 0);
    } finally {
      setIsGenerating(false);
    }
  }, [appIdea, apiKey, modelKey, refreshHistory]);

  const handleVersionSelect = useCallback((version) => {
    setGeneratedApp(version);
    versionService.setCurrentApp(version);
    setActiveView('preview');
  }, []);

  const handleDeleteVersion = useCallback((id) => {
    versionService.deleteVersion(id);
    refreshHistory();
    const current = versionService.getCurrentApp();
    if (current && current.id === id) {
      versionService.clearCurrentApp();
      setGeneratedApp(null);
      setActiveView('generate');
    }
  }, [refreshHistory]);

  const handleExportVersion = useCallback((id) => {
    versionService.exportVersion(id);
  }, []);

  return h('div', { className: 'min-h-screen flex flex-col' }, [
    h(Header, {
      activeView,
      setActiveView,
      generatedApp,
      onOpenSettings: () => setShowApiModal(true)
    }),
    h('main', { className: 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10' }, [
      activeView === 'generate'
        ? h(AppGenerator, {
            appIdea,
            onAppIdeaChange: setAppIdea,
            modelKey,
            onModelChange: setModelKey,
            isGenerating,
            onGenerate: handleGenerate,
            modelOptions,
            errorMessage,
            onUseExample: setAppIdea
          })
        : null,
      activeView === 'preview' && generatedApp
        ? h(LivePreview, {
            app: generatedApp
          })
        : null,
      activeView === 'code' && generatedApp
        ? h(CodeViewer, { app: generatedApp })
        : null,
      activeView === 'history'
        ? h(VersionHistory, {
            versions,
            onSelect: handleVersionSelect,
            onDelete: handleDeleteVersion,
            onExport: handleExportVersion
          })
        : null
    ]),
    showApiModal
      ? h(ApiKeyModal, {
          apiKey,
          onSubmit: handleApiKeySubmit,
          onClose: () => setShowApiModal(false)
        })
      : null,
    isGenerating ? h(LoadingOverlay, null) : null
  ]);
}

function Header({ activeView, setActiveView, generatedApp, onOpenSettings }) {
  const tabs = [
    { key: 'generate', label: 'Generate', icon: '✨' },
    { key: 'preview', label: 'Preview', icon: '▶', disabled: !generatedApp },
    { key: 'code', label: 'View Code', icon: '🧠', disabled: !generatedApp },
    { key: 'history', label: 'Versions', icon: '🗂' }
  ];

  return h('header', { className: 'border-b border-white/10 backdrop-blur bg-black/20' }, [
    h('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between' }, [
      h('div', { className: 'flex items-center gap-3' }, [
        h('div', { className: 'w-11 h-11 rounded-xl bg-gradient-to-r from-iris to-magenta flex items-center justify-center text-xl font-semibold shadow-lg' }, '⚡'),
        h('div', null, [
          h('div', { className: 'text-lg font-semibold leading-tight' }, 'Morphic Web'),
          h('p', { className: 'text-sm text-white/70' }, 'Instant Groq-powered interface creation')
        ])
      ]),
      h('nav', { className: 'flex flex-wrap gap-2' }, tabs.map((tab) =>
        h('button', {
          key: tab.key,
          disabled: tab.disabled,
          onClick: () => !tab.disabled && setActiveView(tab.key),
          className: `px-4 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-medium ${
            activeView === tab.key
              ? 'bg-white/20 text-white shadow-lg shadow-iris/30'
              : tab.disabled
              ? 'text-white/40 cursor-not-allowed border border-white/10'
              : 'text-white/80 hover:text-white hover:bg-white/15 border border-white/10'
          }`
        }, [`${tab.icon}`, tab.label])
      )),
      h('button', {
        onClick: onOpenSettings,
        className: 'ml-auto px-4 py-2 rounded-lg border border-white/15 text-sm bg-white/10 hover:bg-white/20 transition-colors shadow-sm flex items-center gap-2'
      }, ['⚙', 'Groq API'])
    ])
  ]);
}

function AppGenerator({
  appIdea,
  onAppIdeaChange,
  modelKey,
  onModelChange,
  isGenerating,
  onGenerate,
  modelOptions,
  errorMessage,
  onUseExample
}) {
  return h('section', { className: 'bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-iris/20 backdrop-blur-lg p-8 space-y-8' }, [
    h('div', { className: 'text-center space-y-3' }, [
      h('span', { className: 'inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 text-2xl' }, '🪄'),
      h('h1', { className: 'text-3xl md:text-4xl font-bold tracking-tight' }, 'Describe your vision. Groq builds it instantly.'),
      h('p', { className: 'text-white/70 max-w-2xl mx-auto text-sm md:text-base' }, 'Combine Groq model excellence with Morphic Web prompt intelligence. Every submission becomes a polished, working React experience in seconds.')
    ]),
    errorMessage
      ? h('div', { className: 'p-4 rounded-2xl border border-red-500/40 bg-red-500/15 text-sm text-red-100 flex items-center gap-3' }, ['⚠', errorMessage])
      : null,
    h('div', { className: 'space-y-6' }, [
      h('div', { className: 'space-y-3' }, [
        h('label', { className: 'text-sm font-medium uppercase tracking-wide text-white/70' }, 'App concept'),
        h('textarea', {
          value: appIdea,
          onChange: (event) => onAppIdeaChange(event.target.value),
          placeholder: 'Example: Build a travel companion that recommends destinations with AI summaries, packing lists, and budgeting tips based on user mood and time frame.',
          className: 'w-full min-h-[150px] rounded-2xl bg-black/40 border border-white/10 px-5 py-4 text-sm md:text-base leading-relaxed text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-iris/60 focus:border-white/10 shadow-inner'
        })
      ]),
      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
        h(FormSelect, {
          label: 'Groq model',
          value: modelKey,
          onChange: onModelChange,
          options: (Array.isArray(modelOptions) && modelOptions.length
            ? modelOptions
            : [{ id: modelKey, label: modelKey }]
          ).map((entry) => ({ value: entry.id, label: entry.label }))
        }),
        h('div', { className: 'space-y-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70' }, [
          h('h3', { className: 'text-sm font-semibold text-white' }, 'Automatic AI usage'),
          h('p', null, 'Groq decides when to call its APIs. Generated apps automatically receive the secure GROQ_API_KEY without prompting end users.'),
          h('p', null, 'Feel free to request any AI behaviors in your prompt—Groq has the context it needs.')
        ])
      ]),
      h('div', { className: 'space-y-2' }, [
        h('h3', { className: 'text-sm font-medium uppercase tracking-wide text-white/60' }, 'Need a spark?'),
        h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-3' }, EXAMPLE_IDEAS.map((idea, index) =>
          h('button', {
            key: `idea-${index}`,
            onClick: () => onUseExample(idea),
            className: 'text-left rounded-2xl border border-white/10 bg-black/25 hover:bg-white/10 px-4 py-3 text-sm text-white/70 hover:text-white transition-all'
          }, ['→ ', idea])
        ))
      ])
    ]),
    h('div', null, [
      h('button', {
        onClick: onGenerate,
        disabled: isGenerating,
        className: 'w-full md:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-iris to-magenta text-white font-semibold text-base shadow-lg shadow-magenta/30 hover:shadow-xl hover:shadow-magenta/40 transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
      }, [isGenerating ? 'Generating with Groq…' : 'Generate Application'])
    ])
  ]);
}

function FormSelect({ label, value, onChange, options }) {
  return h('div', { className: 'space-y-3' }, [
    h('span', { className: 'text-sm font-medium uppercase tracking-wide text-white/70 block' }, label),
    h('select', {
      value,
      onChange: (event) => onChange(event.target.value),
      className: 'w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-iris/60'
    }, options.map((opt) => h('option', { key: opt.value, value: opt.value }, opt.label)))
  ]);
}

function LivePreview({ app }) {
  const previewDocument = useMemo(() => createPreviewDocument(app.code), [app.code]);

  return h('section', { className: 'bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20' }, [
    h('div', { className: 'flex items-center justify-between px-6 py-4 border-b border-white/10' }, [
      h('div', null, [
        h('h2', { className: 'text-xl font-semibold' }, 'Live Preview'),
        h('p', { className: 'text-white/60 text-sm' }, `${app.appIdea}`)
      ]),
      h('div', { className: 'flex items-center gap-3 text-xs text-white/60' }, [
        h('span', null, app.model),
        h('span', null, '•'),
        h('span', null, app.template)
      ])
    ]),
    h('div', { className: 'relative h-[70vh]' }, [
      h('iframe', {
        srcDoc: previewDocument,
        className: 'absolute inset-0 w-full h-full rounded-b-3xl border-0 bg-white',
        sandbox: 'allow-scripts allow-forms allow-same-origin',
        title: 'Generated application preview'
      })
    ])
  ]);
}

function CodeViewer({ app }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(app.code);
  };

  return h('section', { className: 'bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20 overflow-hidden' }, [
    h('div', { className: 'flex items-center justify-between px-6 py-4 border-b border-white/10' }, [
      h('div', null, [
        h('h2', { className: 'text-xl font-semibold' }, 'Generated Code'),
        h('p', { className: 'text-xs text-white/60' }, 'Fully sanitized Groq output ready to run in browser')
      ]),
      h('button', {
        onClick: handleCopy,
        className: 'px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs tracking-wide'
      }, 'Copy code')
    ]),
    h('div', { className: 'bg-black/70 max-h-[60vh] overflow-auto p-6 font-mono text-xs leading-relaxed text-emerald-200' }, app.code)
  ]);
}

function VersionHistory({ versions, onSelect, onDelete, onExport }) {
  if (!versions.length) {
    return h('section', { className: 'bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20 p-12 text-center space-y-4' }, [
      h('div', { className: 'text-3xl' }, '🗂'),
      h('h2', { className: 'text-xl font-semibold' }, 'No versions yet'),
      h('p', { className: 'text-white/60 text-sm max-w-lg mx-auto' }, 'Generate your first application to start building your Morphic Web timeline.')
    ]);
  }

  return h('section', { className: 'bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20 p-6 space-y-4' }, [
    h('h2', { className: 'text-xl font-semibold' }, 'Version history'),
    h('div', { className: 'grid gap-4' }, versions.map((version) =>
      h('div', {
        key: version.id,
        className: 'rounded-2xl border border-white/10 bg-black/30 hover:border-iris/50 transition-all p-5 space-y-3'
      }, [
        h('div', { className: 'flex flex-wrap items-start justify-between gap-3' }, [
          h('div', { className: 'space-y-1' }, [
            h('button', {
              className: 'text-left text-base font-semibold text-white hover:text-iris transition-colors',
              onClick: () => onSelect(version)
            }, version.appIdea),
            h('div', { className: 'text-xs text-white/60 flex flex-wrap gap-3' }, [
              h('span', null, new Date(version.timestamp).toLocaleString()),
              h('span', null, version.model),
              h('span', null, version.template),
              h('span', null, `${version.code.split('\n').length} lines`)
            ])
          ]),
          h('div', { className: 'flex items-center gap-2' }, [
            h('button', {
              onClick: () => onExport(version.id),
              className: 'px-3 py-2 rounded-lg border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/30'
            }, 'Export'),
            h('button', {
              onClick: () => onDelete(version.id),
              className: 'px-3 py-2 rounded-lg border border-red-500/40 text-xs text-red-200 hover:bg-red-500/10'
            }, 'Delete')
          ])
        ])
      ])
    ))
  ]);
}

function ApiKeyModal({ apiKey, onSubmit, onClose }) {
  const [draft, setDraft] = useState(apiKey ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!draft.trim()) {
      setError('Enter your Groq API key starting with gsk_');
      return;
    }
    if (!draft.trim().startsWith('gsk_')) {
      setError('Groq keys begin with gsk_. Double-check and try again.');
      return;
    }
    onSubmit(draft);
  };

  return h('div', { className: 'fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50 px-4' }, [
    h('div', { className: 'w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/70 p-8 space-y-6 shadow-2xl shadow-iris/30' }, [
      h('div', { className: 'space-y-2 text-center' }, [
        h('div', { className: 'text-3xl' }, '🔑'),
        h('h2', { className: 'text-2xl font-semibold' }, 'Connect Groq'),
        h('p', { className: 'text-white/70 text-sm' }, 'Morphic Web talks directly to Groq infrastructure. Your key stays in the browser and is never shared.')
      ]),
      h('div', { className: 'space-y-3' }, [
        h('label', { className: 'text-sm font-medium uppercase tracking-wide text-white/70 block' }, 'Groq API key'),
        h('input', {
          value: draft,
          onChange: (event) => {
            setDraft(event.target.value);
            setError('');
          },
          placeholder: 'gsk_********************************',
          className: 'w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-iris/60'
        }),
        error ? h('p', { className: 'text-xs text-red-200' }, error) : null
      ]),
      h('div', { className: 'flex flex-col sm:flex-row gap-3' }, [
        h('button', {
          onClick: handleSave,
          className: 'flex-1 rounded-2xl bg-gradient-to-r from-iris to-magenta px-6 py-3 font-medium shadow-lg shadow-magenta/30 hover:shadow-xl'
        }, 'Save & Activate'),
        h('button', {
          onClick: onClose,
          className: 'flex-1 rounded-2xl border border-white/15 px-6 py-3 text-white/70 hover:text-white hover:border-white/30'
        }, 'Cancel')
      ]),
      h('p', { className: 'text-xs text-white/50 text-center' }, 'Get your key at https://console.groq.com/keys')
    ])
  ]);
}

function LoadingOverlay() {
  return h('div', { className: 'fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur' }, [
    h('div', { className: 'bg-slate-900/80 border border-white/10 rounded-3xl px-10 py-8 text-center space-y-4 shadow-2xl shadow-iris/30' }, [
      h('div', { className: 'w-14 h-14 mx-auto rounded-full border-4 border-white/10 border-t-white animate-spin' }),
      h('h3', { className: 'text-lg font-semibold' }, 'Groq is crafting your app…'),
      h('p', { className: 'text-sm text-white/60' }, 'Prompt instructions, sanitization, and live preview are being assembled.')
    ])
  ]);
}

function createPreviewDocument(code) {
  // Delegate to shared dynamic preview runtime
  return buildPreviewHTML(code);
}

export default App;
