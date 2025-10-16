# Groq MCP Integration Findings

## TL;DR
- **Model selection is still explicit.** Groq MCP does not auto-route to a best model; clients must pass the `model` field in every request.
- **`groq/compound` family is the recommended default** for tool-using agent workflows. `groq/compound-mini` trades off tool depth for faster latency. Other OpenAI-compatible models (e.g., `openai/gpt-oss-120b`) are available for pure text/code generation when tools are unnecessary.
- **Our generator should keep exposing a model picker** so advanced users can trade speed vs. capability. Default the UI to `groq/compound` for the richest workflow and fall back to the same ID in code sanitization.
- **Generated preview apps should continue calling the OpenAI-compatible Chat Completions endpoint** for now. Shipping full MCP clients into end-user React apps is not advised because it requires long-lived credentials, websocket/event infrastructure, and tool routing that browsers cannot perform securely.

## What MCP Provides
- A standardized protocol for LLMs to call tools, stream events, and share artifacts (`previewManifest`, files, etc.).
- Groqs MCP implementation is exposed through the **Responses API** (`POST /responses`). The companion **Chat Completions API** remains available for OpenAI-compatible payloads.
- Built-in tool registry: web search, code execution, browser automation, and vision. Additional MCP servers can be attached for custom tools.

## Model Routing & Selection
- Groqs documentation explicitly requires a `model` value in every MCP request. No automatic routing or abstraction layer chooses the model for you.
- Recommended pairings:
  - **`groq/compound`**  full agentic flows with tooling, best default for Morphic.
  - **`groq/compound-mini`**  lower latency agent that still supports tool calls.
  - **`openai/gpt-oss-120b` / `openai/gpt-oss-20b`**  large OSS-derived chat/code models, no MCP tool chain.
  - **Lightweight text models** (e.g., `llama-3.1-8b-instant`) for fast drafting when tools arent needed.
- Because Groq doesnt route requests automatically, our sanitization step (`groqService.enforceModelInCode()`) should keep overriding any model strings the LLM emits so generated apps mirror the users selection.

## Should Generated Apps Use MCP Directly?
- **Short answer: no, not yet.** The preview sandbox lives entirely in-browser and cannot safely host MCP credentials or tool streams.
- MCP clients expect a trusted runtime that can:
  - Manage long-lived API keys or service tokens.
  - Maintain streaming connections for tool calls (`responses.stream` events).
  - Register and coordinate agent tool invocations.
- Our generated React apps run in the users browser and only need batched completions. They should therefore keep hitting `https://api.groq.com/openai/v1/chat/completions` with the injected API key.
- If we later expose server-side execution (e.g., via our own API), we could proxy MCP workflows there and stream results back to the UI.

## Recommendations For Morphic Web
- **UI**: Keep the model dropdown, default to `groq/compound`, and refresh the dynamic model list on API-key entry (already implemented).
- **Backend service** (`groqService.runAgenticWorkflow()`): continue using the Responses/Chat bridge we added, ensuring the outgoing payloads `model` matches the user selection and that sanitized code rewrites any hardcoded literals.
- **Generated code**: remain on Chat Completions. Strip API keys, enforce selected model IDs, and avoid embedding full MCP logic in browser output.
- **Future work**: If we add a server-side execution environment, revisit full MCP tool orchestration and expose a toggle that lets power users opt into agentic, tool-rich workflows.
