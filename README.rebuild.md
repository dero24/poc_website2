# POC Website 2 Rebuild Playbook

> Detailed brief for AI agents or collaborators rebuilding the Morphic Web experience from the ground up.

## App Rebuild Specification

### Project Overview
- **Name**: POC Website 2 Rebuild
- **Current URL**: https://dero24.github.io/poc_website2/
- **Purpose**: AI-assisted React web studio that converts natural-language ideas into polished, production-ready single-page, fully functional React experiences with live previews, Groq-powered enhancements, dynamic model selection, AI-generated inspiration, local storage persistence, exportable code, shareable preview links, and an interface so simple that absolute beginners can type an idea, click generate, and immediately watch the app appear beneath the prompt.
- **Description**: Morphic Web revolutionizes app development by leveraging Groq's lightning-fast AI inference to transform natural language descriptions into production-ready React applications. Built with modern web technologies, it delivers instant, interactive previews without any build steps or npm dependencies.

### Architecture
- **Technology Stack**: React 18 with hooks, Vite-powered client build, Tailwind utility styling, Lucide/react-icons visuals, Groq API integration, browser-based Babel preview runtime, local storage persistence, Groq model discovery service.
- **Key Features**: Single-pass AI generation, dynamic Groq model list in the UI, instant iframe preview with auto-repair, editable code canvas with autosave, version history and timeline insights, AI-generated “Need a spark?” idea suggestions, secure API key onboarding, shareable preview links, export-ready code delivery.
- **Data Flow**: User submits an idea → prompt composer injects guardrails and latest model metadata → Groq API returns JSX bundle in one pass → runtime sanitizes code, normalizes imports, and injects CDN globals → preview renders → versions, manifests, and cached responses persist locally for later restoration.

### Product Concept
- **Core Value**: Deliver a no-friction playground where anyone, especially non-developers, can turn plain-language app ideas into polished, interactive React experiences within seconds.
- **Differentiators**: Dynamic Groq model catalog, AI-driven inspiration feed, premium motion/visuals out of the box, and future-proof export pipeline for desktop/mobile widgets.
- **Success KPI**: High first-run success rate (app renders instantly), repeated engagement through version history, and rapid time-to-share via preview links and exports.

### User Roles & Flows
- **Creators**: Individuals describing app ideas. Flow: enter prompt → pick model (optional) → generate → preview → fine-tune or export.
- **Iterators**: Users refining prior apps. Flow: load saved version → edit prompt/code → regenerate → compare history → finalize.
- **Reviewers**: Stakeholders viewing shared previews. Flow: open preview link → interact with live app → provide feedback → request adjustments.
- **Future Export Consumers**: End users installing widgets. Flow: receive exported installer → launch widget → enjoy AI-powered functionality on desktop or mobile.

### Desired Rebuild Goals
- **Improvements**: Deepen preview reliability, expand accessible theming, streamline onboarding, provide richer timeline analytics, surface reusable component patterns, and ensure AI ideas stay fresh and relevant.
- **New Features**: Interactive AI co-pilot for live edits, theme presets, template marketplace, enhanced “Need a spark?” rotation, optional collaboration mode, export button that bundles apps as installable on-screen widgets for desktop (Windows/macOS/Linux) and mobile (iOS/Android).
- **Performance Goals**: Sub-second preview refresh after generation, under 2s initial load on broadband, responsive 60fps UI interactions.
- **Code Quality**: Maintain modular React hooks, typed data models where feasible, consistent error boundaries, declarative styling tokens, comprehensive guardrails for AI output, and robust handling of dynamically fetched model metadata.

### Technical Requirements
#### Frontend
- **Framework**: React 18 with functional components and Suspense-ready architecture.
- **Styling**: Tailwind CSS with glassmorphism, neon accents, high-contrast palettes, and motion-safe variants.
- **Build Tools**: Vite dev/build pipeline with eslint/prettier automation, preview runtime compatibility, and caching for dynamic model lists and AI suggestions.

#### Backend/APIs
- **AI Integration**: Groq chat completions via browser-side fetch using `getMorphicGroqKey()` helper with automatic retrieval of supported model catalog for dropdown population.
- **Authentication**: Optional Groq key prompt stored locally with revocation controls, no external auth service required.
- **Data Storage**: LocalStorage (or IndexedDB) for versions, manifests, cached AI responses, model lists, and user preferences with export/import support.

### Deployment
- **Platform**: GitHub Pages static hosting with SPA routing safeguards.
- **Build Process**: Automated Vite build → hashed asset publish → optional CI workflow for lint/tests and deployment previews.

### User Interface
- **Layout**: Split-screen workspace (generator, timeline, code editor, live preview) with adaptive stacking on smaller breakpoints.
- **Components**: API key modal, idea generator, dynamic model picker, version cards, live preview frame, reusable status toasts, AI insight panels, “Need a spark?” idea carousel.
- **Interactions**: Drag-free stage navigation, autosave feedback, single-click generate/preview cycle, preview repair triggers, quick copy/export actions.
- **Responsive Design**: Seamless tablet/desktop parity, simplified single-column mode below 1024px, mobile-friendly modal gestures.

### AI/LLM Integration
- **Models**: Fetch Groq-supported models at runtime (prioritizing `llama-3.1-70b-versatile`) and expose the list in the model selector with sensible defaults.
- **Prompts**: Structured single-pass prompt combining idea, guardrails, tone, accessibility rules, and API usage instructions to produce ready-to-render JSX on the first call.
- **Rate Limiting**: Respect Groq per-minute quotas with queued requests, retry backoff, and user-visible usage indicators.
- **Error Handling**: Optional chaining on responses, markdown sanitization fallbacks, friendly inline toasts, automated preview healing routines, and graceful degradation when model catalog fetch fails.

### Prompt Templating & Output Rules
- **Context Envelope**: Inject `MORPHIC CONTEXT:
  {contextJson}

  TASK:
  - Produce JSON only.
  - Follow this schema exactly: {schema}` for planning endpoints; ensure every string value is populated, use concise yet expressive language, set `requiresMarkdown` when AI output is multi-line, set `needsEnhancement` when additional polish is warranted.
- **Implementation Prompt**: After planning, request a single React 18 component that imports exclusively from CDN globals (`https://unpkg.com/react@18`, `https://cdn.tailwindcss.com`, `https://unpkg.com/framer-motion`, `https://unpkg.com/lucide-react`, `https://unpkg.com/recharts`, `https://unpkg.com/axios`, `https://unpkg.com/marked`).
- **API Key Usage**: All AI-enabled code must call `const groqKey = typeof window.getMorphicGroqKey === 'function' ? window.getMorphicGroqKey() : '';` and bail gracefully if absent. NEVER reference `GROQ_API_KEY` directly.
- **Premium UX**: Enforce glassmorphism, gradient layers, motion affordances via Framer Motion, Tailwind responsive utilities, optimistic loading states, and guarded error messaging.
- **Code Quality**: Require balanced JSX, default export of a single component, no TODOs, comments, or diagnostic text. Runtime sanitizes imports; prompt must reinforce this.
- **Output Contract**: For implementation responses, instruct Groq: `CRITICAL: Output ONLY clean, executable React code. NEVER include thinking blocks, explanations, or commentary. The response must be pure React component code only.`
- **Guardrails**: Remind Groq that AI features should only trigger when user experience benefits; otherwise, return deterministic UI. Generated apps should reuse stored API key seamlessly and handle empty/failed responses with friendly fallbacks. Encourage AI-powered behaviors that act as the "brain" of the app—driving decisions, workflows, or dynamic adaptations—rather than defaulting to plain chat boxes unless conversational UX is truly essential.

### Preview Reliability & CDN Strategy
- **Browser Babel Standalone**: Live preview runs entirely in-browser using Babel Standalone, transpiling JSX, hooks, and modern syntax at runtime so any AI-generated code renders immediately without server builds.
- **CDN-Only Imports**: Prompt enforces React 18, Tailwind, Framer Motion, Lucide, Recharts, Axios, and Marked via `window` globals injected by the runtime, removing bundler dependencies and guaranteeing compatibility across browsers.
- **Dynamic Package Injection**: `previewRuntime` inspects generated code, detects required libraries (including newly requested CDN/UMD modules), and loads each asset before mounting the component so feature-rich apps render with full fidelity.
- **Sanitization Pipeline**: `transformAppCode()` strips import/export syntax, normalizes references to `window.React`, `window.Motion`, `window.lucide`, etc., and stitches the component into a Babel-compiled script that runs instantly in the iframe.
- **Graceful Fallbacks**: Runtime automatically sanitizes problematic imports and swaps unsupported packages with safe mocks; the “Try Again” button simply replays the cleaned load as an extra safety net should a rare hiccup occur.
- **Continuous Feedback Loop**: Prompt guardrails and runtime validation enforce balanced code, single default export, and immediate preview refresh so users always see a functioning app moments after generation.

## Core Feature: AI-Powered Text Generation

### Functionality
- User enters a natural-language prompt in a textarea (10–500 characters).
- User selects a preferred AI model from a dropdown (GPT-4, Claude, Llama).
- Clicking **Generate** invokes the Groq-powered inference pipeline.
- A loading spinner appears while the request is in flight.
- The generated response renders in a rich output container with readable typography.
- A copy-to-clipboard control lets users quickly reuse the output elsewhere.

### Technical Implementation
- Integrate with Groq chat completions at `https://api.groq.com/openai/v1/chat/completions` using authenticated fetch calls.
- Wrap outbound requests in exponential backoff (e.g., 250ms → 500ms → 1s) when rate limits occur.
- Cache the 10 most recent prompt-response pairs in LocalStorage for instant retrieval and offline review.
- Surface friendly status messages for network failures, throttling, malformed responses, or empty AI output.

### Roadmap
- Fully exportable, always-on widget that floats above any operating system desktop or mobile environment by creating our own file format.
- On export we package the widget for macOS, Windows, Linux, iOS, and Android.

### Success Criteria
- Zero console errors or unhandled promise rejections during normal usage.
- Consistent sub-2s round-trip responses under typical Groq API latency.
- Accessible UI (WCAG AA) with keyboard navigation and screen-reader support.
