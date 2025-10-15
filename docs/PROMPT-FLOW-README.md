# Morphic Web – Prompt Engineering Flow

## Overview
This document outlines the high-level prompt strategy Morphic Web employs when generating React applications through Groq MCP.

## 1. System Prompt Foundation (`src/App.js`, `src/App.jsx`)
- `AGENT_SYSTEM_PROMPT` is injected with every run, defining:
  - Single-file JSX requirements and import placement.
  - Mandated premium UI/UX (animations, accessibility, microcopy).
  - AI-as-brain expectations: Groq must leverage reasoning for intelligent features.
  - Security guardrails: prompt-injection resistance, API key secrecy, safe asset usage.
  - Preview manifest obligations and sandbox compatibility.

## 2. Template Prompts (`src/prompts/templates.js`)
- `PROMPT_TEMPLATES` categorize app types (`base`, `dashboard`, `utility`, etc.).
- Each template enumerates structural requirements (hooks, layout, data scaffolding).
- The `AI_FEATURES_INJECTION` snippet describes how to call Groq’s REST API using the injected `GROQ_API_KEY` when the experience needs AI.
- `buildPrompt()` replaces placeholders (`{APP_IDEA}`, `{MODEL_ID}`, `{API_KEY}`) and conditionally appends AI instructions based on `includeAI`.

## 3. Tool Awareness & Metadata
- `toolPreferences` passes the enabled MCP tools to the agent, reflected in the prompt via metadata.
- Metadata (template, idea, model, enabled tools) is included with each run for observability and potential future conditioning.

## 4. Agent Reasoning Expectations
- The system prompt encourages strategic tool use: web search for context, code execution for validation, browser automation for scraping, vision for UI intelligence.
- Reasoning chains are preserved (`runResult.reasoning`) so downstream components can display step-by-step logic.

## 5. Manifest & Asset Instructions
- Prompts state that the agent must deliver a `previewManifest` including all CDN/script/style requirements.
- Guardrails remind the agent to avoid unsupported imports and rely on browser-safe CDNs.
- The system warning clarifies that the runtime is sandboxed, so the agent must provide all assets explicitly.

## 6. Error Handling & Resilience
- Prompts require graceful loading/error states, meaning generated apps should handle API failures and optimistic UI interactions.
- The agent is instructed to remove placeholders/TODOs, ensuring production-quality output.

## 7. Feedback Loop
- After generation, the stored `agentRun` (summary, reasoning, tool calls, manifest summary) and `guardrailWarnings` provide feedback on prompt compliance.
- These insights inform prompt refinements—e.g., if warnings frequently strip certain URLs, templates or system prompts can be adjusted to guide the agent toward approved CDNs.

## Summary
The prompt engineering stack pairs a strict system prompt with scenario-specific templates, enforced by guardrails and telemetry. Together they ensure Groq produces stunning, secure, single-file React apps with manifests that render flawlessly inside Morphic Web’s sandbox.
