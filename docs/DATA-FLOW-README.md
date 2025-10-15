# Morphic Web – Generation Data Flow

## Overview
This guide summarizes the high-level data flow from the moment a user submits a prompt to the point a fully rendered app appears in the live preview.

## 1. User Input & UI State (`src/App.js`, `src/App.jsx`)
- **App idea**: Collected via `AppGenerator` and stored in component state.
- **Model & tool selections**: Dropdowns and toggles update `modelKey` and `toolPreferences`, persisted through `versionService` for subsequent runs.
- **API readiness**: `ApiKeyModal` writes the Groq API key into local storage and hydrates `groqService`.

## 2. Prompt Assembly (`src/prompts/templates.js`)
- `buildPrompt()` merges the selected template (`PROMPT_TEMPLATES[templateKey]`) with the user idea, model ID, and AI usage flags.
- Injects secure API usage guidance (`AI_FEATURES_INJECTION`) and Morphic guardrails (single-file output, UI excellence, AI decision-making).

## 3. Agentic Workflow Invocation (`src/App.js`, `src/App.jsx`)
- `handleGenerate()` calls `groqService.runAgenticWorkflow()` with:
  - `systemPrompt`: `AGENT_SYSTEM_PROMPT` detailing UX, security, and manifest requirements.
  - `userPrompt`: Generated prompt string.
  - `tools`: Current `toolPreferences` filtered to enabled entries.
  - `metadata`: Observability payload (template, idea, model, enabled tools).
  - `requestParameters`: Temperature and token limits.

## 4. Groq MCP Service Layer (`src/services/groqService.js`)
- Builds MCP `/responses` request with normalized messages and tool configuration.
- Receives streaming or batched results; `normalizeResponse()` produces a unified `runResult` containing reasoning, tool calls, artifacts.
- **Code extraction**: `extractCodeFromRun()` inspects artifacts/final text for the React JSX string.
- **Manifest extraction**: `extractPreviewManifest()` sanitizes agent-provided manifests, removing unsafe URLs and collecting `warnings` if guardrails were triggered.

## 5. Persistence & Telemetry (`src/services/versionService.js`)
- `saveVersion()` serializes:
  - Generated code and prompt.
  - `agentRun` summary via `serializeRun()` (final text, reasoning, tool calls, manifest stats).
  - `previewManifest` (sanitized) and `guardrailWarnings`.
  - Tool preferences and metadata for accurate reloads.
- Current version mirrored in local storage for immediate restoration on refresh.

## 6. Rendering Pipeline (`src/components/LivePreview.jsx`)
- `createPreviewDocument()` requires `previewManifest`; throws if absent to enforce agent compliance.
- Builds `<html>` using manifest-provided head/body contents plus sanitized scripts/styles.
- Injects a resilience bridge that reports load errors back to the host for display.
- Iframe receives the generated document and displays the app; warnings and errors are propagated to the parent React state.

## 7. Telemetry UI (`src/components/AgentTimeline.jsx`)
- Renders agent summary, reasoning steps, tool calls.
- Shows manifest summary (script/style counts, custom sections, entry type).
- Lists any guardrail warnings (e.g., stripped URLs) so users understand safety interventions.

## 8. Version History & Export (`src/components/VersionHistory.jsx`)
- Lists saved versions with timestamps, models, and templates.
- Selecting a version hydrates the preview, code editor, and telemetry using stored manifest + guardrails.
- Export functionality emits a JSON package containing code, manifest, telemetry, and warnings for archival or re-import.

## Key Guarantees
- **Single-file integrity**: Prompts and validation ensure the app remains a standalone React file.
- **Manifest-first rendering**: No legacy fallbacks—every preview uses agent-authored assets.
- **Guardrail visibility**: Sanitization steps never go unnoticed; user-facing warnings document every change.
