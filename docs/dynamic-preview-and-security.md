# Dynamic Preview & Prompt-Security Masterplan

## Dynamic Build Window Generation

### Vision
Build a preview environment that never fails, automatically adapts to the generated React code, and self-heals via AI when static analysis is uncertain.

### Strategy Overview
- Inspect generated code to infer runtime dependencies, including heuristics for animations, charting, HTTP clients, and inline CDN URLs.
- Normalize module syntax into globals so the sandbox runs without bundlers or import maps.
- Orchestrate CDN scripts deterministically: critical libraries first, optional packages next, shims last, followed by the transformed app code.
- Guard runtime stability with motion/icon/chart fallbacks and an error boundary that reports status upstream.
- Recover via an AI-issued preview manifest when imports are ambiguous or the sandbox encounters fatal errors.

### Execution Blueprint
- **Detection Layer**: enumerate explicit imports and implicit usage signals, capturing unknown packages as ambiguity markers.
- **Transformation Layer**: strip `import`/`export`, synthesize window-bound bindings, and guarantee a default component for rendering.
- **Assembly Layer**: inject Babel, Tailwind, React, ReactDOM, then optional libraries, followed by consolidated shims and the transformed app script.
- **Monitoring Layer**: post message events for load success or failure, surfacing errors through a friendly boundary.
- **Fallback Layer**: on ambiguity, request a strict JSON manifest from the AI engine, sanitize URLs, persist the manifest with the app, and re-render on demand.
- **Persistence Layer**: track whether detection or AI manifests are active, store them with version history, and clear stale manifests when code changes.

### Operational Guidelines
- Smoke-test representative app archetypes after preview engine updates.
- Maintain legacy fallback HTML for archival compatibility.
- Document manifest usage and guardrail warnings in version history for quick diagnostics.

---

## Prompt-Injection Defense Strategy

### Vision
Ensure the agentic workflow follows security guardrails, never leaks secrets, and consistently outputs well-formed artifacts for each generation stage.

### Strategy Overview
- Encode tone, security posture, CDN-only usage, markdown handling, and AI principles into every stage prompt.
- Use stage-specific system prompts: blueprint (JSON), implementation (plain JSX), manifest repair (JSON only).
- Sanitize and validate every response: strip imports, enforce helper-based API key access, confirm structural integrity.
- Persist serialized reasoning artifacts for auditability and historical insight.
- Monitor and neutralize secret leakage across both generated code and local project materials.

### Execution Blueprint
- **Guardrail Construction**: produce a structured ruleset covering styling, accessibility, security, CDN usage, and markdown rendering; embed it in prompts.
- **Stage Prompting**: demand JSON blueprints, React implementations without commentary, and JSON manifests with strict fields.
- **Normalization**: remove internal reasoning tags, sanitize outputs, enforce model IDs, and ensure export/default component presence.
- **Persistence**: store reasoning, tool calls, metadata, and manifest summaries with each app version; expose guardrail warnings in the UI timeline.

### Operational Guidelines
- Keep prompts synchronized with evolving guardrails; revise on policy changes.
- Run secret-scanning hooks locally before pushing to remote repositories.
- Train contributors on manifest review and approval workflows when manual oversight is needed.
