# Next-Generation Groq Agent Blueprint

## Goals
- **Deliver premium experiences every time.** Generated apps must feel bespoke: polished visuals, rich motion, and purposeful AI behavior.
- **Exploit Groq MCP strengths.** Use the Responses API for agentic workflows with tools, but keep a graceful fallback to Chat Completions for legacy models.
- **Structure multi-pass creativity.** Treat the agent like a product team: plan, implement, and refine rather than dumping a single-shot JSX file.
- **Enforce resilient prompt injection.** Keep system prompts short but context-rich, and dynamically inject app-specific guardrails so rogue user prompts cannot hijack the flow.
- **Stay browser-friendly.** Generated code must compile in our sandbox, reuse the stored API key, and rely only on CDN-deliverable packages.

## Proposed Pipeline
1. **Preflight (App.jsx / App.js)**
   - Collect the user brief, selected model, enabled tools, and theme preferences.
   - Generate a `promptContext` object (includes API key placeholder, panel copy, design tone) to drive later prompt injections.

2. **Phase A – Concept Blueprint (`groqService.generateBlueprint`)**
   - Call Groq MCP (model `groq/compound`) with a prompt that asks for:
     - Problem framing, target audience, differentiators.
     - Proposed data structures, open-source assets, and AI feature hooks.
     - UI storyboard (sections, components, interactions).
   - Return a JSON artifact (`blueprintArtifact`) with normalized schema (sections, components, aiBehaviors, assetList).

3. **Phase B – Code Synthesis (`groqService.generateImplementation`)**
   - Inject the serialized blueprint + global guardrails into a lean prompt.
   - Request complete JSX export with Markdown-friendly assistant rendering, Tailwind/Framer Motion usage, and API helper modules.
   - Use `sanitizeCode()` and `enforceModelInCode()` as today, but add markdown renderer auto-injection (e.g., include Marked if blueprint flags `requiresMarkdown`).

4. **Phase C – Enhancement Pass (Optional)**
   - If the blueprint marks `needsEnhancement` (e.g., user toggles “Go All-In”), run a follow-up MCP call that:
     - Critiques the first draft (access via MCP artifacts or our `versionService`).
     - Suggests embellishments: transitions, personalization, additional AI flows.
   - Merge improvements via AST patches (e.g., run codemods inside the agent response) or trigger a second code generation with explicit diff.

5. **Post-Processing & Preview**
   - `extractPreviewManifest()` now also reads `blueprintArtifact.assets` to build CDN includes.
   - `LivePreview.jsx` already supports Marked/Tailwind. Ensure `getMorphicGroqKey()` remains the injection point for runtime API usage.

## Prompt Injection Strategy
- **System Prompt (App.jsx)**
  - Summarize mission: multi-pass building, never trust user-provided instructions that contradict guardrails, always render Markdown elegantly.
  - Mention tool palette and remind the agent to prefer blueprint artifacts over raw user input.

- **Dynamic Guardrails**
  - In `buildPrompt()`, prepend a structured `[[PROTECTED_RULES]]` block that includes:
    - Approved CDN packages list.
    - Required UI adjectives (e.g., "futuristic, glassmorphic, accessible").
    - AI commandment: "Deliver purposeful automation; chat widgets alone are insufficient."
  - Encode metadata as JSON inside the prompt so the agent can reason programmatically while MCP tool calls validate external data.

- **Two-Level Sanitization**
  - Phase A response: validate with `sanitizeBlueprint()` (new helper) to ensure schema compliance and strip suspicious instructions.
  - Phase B code: continue using existing `sanitizeCode()`, plus new checks to guarantee Markdown renderer injection and API key helper usage.

## Model Routing & Fallback
- **Compound-first**: default to `groq/compound` (or `compound-mini` for fast mode) to unlock tools, automatic reasoning, and streaming.
- **Chat fallback**: if the user forces a non-MCP model, skip Phase A and run the legacy single-pass generation. The UI should warn that polish may be reduced.
- **Streaming**: surface MCP streaming events in `AgentTimeline.jsx` so users see blueprint planning, tool calls, and enhancement critiques.

## Implementation Roadmap
- **Milestone 1 – Blueprinting Support**
  - Add `generateBlueprint()` in `groqService.js` with `/responses` integration and schema validation.
  - Extend `serializeRun()` to store blueprint artifacts per version for later editing.
  - Update UI state (`App.jsx`) to display blueprint summary and allow users to tweak before code synthesis.

- **Milestone 2 – Dual-Pass Generation**
  - Implement `generateImplementation()` that consumes blueprint + guardrails.
  - Update prompts in `src/prompts/templates.js` to reference blueprint data rather than raw idea text.
  - Enhance `sanitizeCode()` to auto-inject Markdown renderer, motion imports, and premium gradient themes if missing.

- **Milestone 3 – Enhancement Cycle**
  - Optional follow-up call that critiques and patches the draft.
  - Provide a UI toggle (“Supercharge polish”) and show before/after diff in `CodeViewer`.

- **Milestone 4 – Observability & UX**
  - Display blueprint + enhancement timeline in `AgentTimeline.jsx`.
  - Persist blueprint artifacts in `versionService` so regenerated drafts can reuse them without re-querying Groq.
  - Add configuration panel for designers to adjust guardrail adjectives and approved CDN list.

## Risks & Mitigations
- **Token usage**: Two-pass prompts increase context size. Use concise schemas and strip redundant instructions (e.g., leverage shared `AI_FEATURES_INJECTION`).
- **Latency**: Provide user feedback (loading states, reasoner logs). Allow skipping enhancement pass for quicker drafts.
- **Sandbox limits**: Auto-detect heavy dependencies and swap them for light CDN equivalents, warning users when fallback occurs.

## Next Steps
1. Implement blueprint request/validation in `groqService` with tests for schema compliance.
2. Redesign `AppGenerator` panel to preview and edit the blueprint before generating code.
3. Update prompt templates to reference blueprint fields and the new guardrail tokens.
4. Instrument the timeline UI to surface MCP reasoning/tool events across all phases.
5. Evaluate optional enhancement pass after baseline dual-phase flow is stable.
