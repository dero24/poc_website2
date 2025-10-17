# MCP Removal & Preview Stabilization Plan - COMPLETED

## Goals
- Drop MCP/compound model dependencies.
- Maintain blueprint → implementation flow (no enhancement stage).
- Guarantee generated code relies solely on CDN-safe packages and renders reliably in preview.

## Phase 1 – Strip MCP Support 
- Remove compound models from `SUPPORTED_MODELS` in `groqService.js`.
- Delete tool registry configuration (`DEFAULT_TOOL_REGISTRY`, `configureTools`, etc.).
- Simplify `runAgenticWorkflow()` to always use standard `/chat/completions` endpoint.
- Remove MCP-specific prompts from `App.js`/`App.jsx`, including tool toggles.
- Update UI copy and options to reflect non-MCP flow.

## Phase 2 – Streamline Multi-Pass Workflow 
- Keep automatic blueprint → implementation sequence in `handleGenerate()`.
- Remove enhancement phase (UI toggle, handlers, stage tracking).
- Reduce state to `blueprint`, `stageRuns` (two entries), and progress indicators.
- Update `AgentTimeline` and `VersionHistory` to reflect two-stage flow.

## Phase 3 – Harden Preview & CDN Handling 
- Update `generateImplementation()` prompt (in `src/prompts/templates.js`) to enforce:
  - Only browser-safe CDN React packages.
  - Explicit instructions against `npm install` or unsupported imports.
  - Keeping prompts sent to groq short as possible without loosing details neccessary to create the most satifisfying user experience and functionality in the generated app
- Enhance `createPreviewDocument()` in `LivePreview.jsx` to normalize package names and map them to CDNs (React, ReactDOM, axios, router, etc.).
- Add fallback logic for unexpected imports (warn in console, skip rather than crash).

## Phase 4 – Clean Code & Docs 
- Remove unused files or sections referencing MCP (tool definitions, guardrail prompts requiring tools).
- Update `README.md` and `documentation/ai-agent-blueprint.md` with new architecture and limitations.
- Ensure `PROJECT_PENDING.md` checklist reflects MCP removal.

## Phase 5 – Testing 
- Run `npm run build` to confirm compile success.
- Manually generate several apps (with external libraries) to verify preview renders correctly.
- Capture example outputs verifying CDN imports (`https://cdn.jsdelivr.net/...`, `https://unpkg.com/...`).

## Success Criteria 
- Single "Generate" button runs blueprint → implementation without MCP errors.
- Generated code only references CDN-hosted packages; preview renders every time.
- UI/tooling surfaces no MCP terminology or toggles.
- Documentation matches new non-MCP architecture.

## Final Status
All phases completed successfully. The app now uses a streamlined blueprint → implementation workflow with robust CDN-only package handling and reliable preview rendering.
