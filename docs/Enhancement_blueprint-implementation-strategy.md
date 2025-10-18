# Blueprint → Implementation Prompt Strategy for generating React apps

## Mission
Deliver production-ready single-file React applications by guiding the agent through a disciplined, multi-pass workflow that starts with structured planning and ends with sanitized code—even when confronted with adversarial prompt attempts.

## High-Level Flow
1. **Blueprint Stage**
   - Capture requirements, UI structure, data needs, and AI behaviors in a rich JSON schema.

   - Encode guardrails covering accessibility, security, CDN-only usage, and tone.
   - Produce actionable component outlines, state diagrams, and integration notes that downstream stages can consume deterministically.

2. **Implementation Stage**
   - Consume the blueprint and guardrails to generate executable JSX without markdown or commentary.
   - Maintain CDN-friendly patterns (no npm-only imports) and rely on runtime helpers for sensitive configuration such as API keys.
   - Enforce balanced JSX, a default export, and deterministic component naming.

3. **Optional Enhancement Stage**
   - When enabled, refine styling, microcopy, and interactivity while honoring the original blueprint and guardrails.
   - Keep the output structure intact, making targeted improvements only.

## Guardrail Architecture
- **Rule Synthesis**: Merge tone, accessibility, security, and CDN directives into a single guardrail payload injected into every stage prompt.
- **Strict Output Contracts**: Blueprint responses must be valid JSON, implementation responses must be plain JSX, and enhancements must not deviate from the component layout.
- **Prompt Injection Immunity**: Guardrails explicitly forbid secrets, npm installs, unsupported imports, or markdown wrappers. The agent is instructed to ignore conflicting user content.

## Validation & Sanitization
- Strip residual imports/exports that violate CDN-only rules.
- Replace literal model or API key references with helper invocations.
- Ensure a renderable default component (e.g., `GeneratedApp`) always exists.
- Run structural checks (balanced braces/parentheses, JSX root presence) before accepting output.

## Persistence & Telemetry
- Record blueprint metadata, implementation details, and enhancement summaries for each generation run.
- Surface guardrail warnings, prompt injections avoided, and sanitization notes in the operator timeline.
- Maintain linkage between stages so historical versions can reconstruct the full decision trail.

## Operational Playbook
- Refresh guardrail payloads whenever security policies evolve.
- Monitor generation quality metrics and adjust blueprint schemas if coverage gaps appear.
- Periodically perform red-team prompt-injection drills to confirm defenses hold.
- Keep the multi-pass workflow optional but default-on, ensuring consistent code quality without sacrificing agility.
