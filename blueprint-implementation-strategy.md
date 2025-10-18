# Blueprint → Implementation Prompt Strategy for Generating React Apps

## Mission
Deliver fully functional, beautiful single-file React applications through a disciplined two-pass workflow: blueprint planning followed by implementation execution, with robust guardrails against adversarial prompts.

## High-Level Flow
1. **Blueprint Stage**
   - Capture user requirements, UI structure, data flows, and AI features in a detailed JSON schema.
   - Embed guardrails for accessibility, security, CDN-only dependencies, and consistent tone.
   - Generate structured component outlines, state management plans, and integration specs for deterministic consumption.

2. **Implementation Stage**
   - Transform the blueprint into executable JSX code without markdown, comments, or extraneous artifacts.
   - Adhere strictly to CDN-friendly patterns (no npm imports) and use runtime helpers for API keys or models.
   - Produce balanced, well-formed JSX with default exports and semantic component naming for immediate rendering.

## Guardrail Architecture
- **Rule Synthesis**: Combine accessibility, security, CDN restrictions, and tone guidelines into immutable prompt payloads.
- **Output Contracts**: Blueprints must return valid JSON; implementations must return clean JSX.
- **Injection Immunity**: Explicitly forbid secrets, npm packages, unsupported imports, or markdown wrappers; agents are trained to ignore conflicting directives.

## Validation & Sanitization
- Remove any lingering imports/exports that breach CDN rules.
- Substitute literal API keys or model references with secure helper calls.
- Guarantee a default renderable component (e.g., `GeneratedApp`) exists.
- Validate JSX structure (brace/parenthesis balance, root presence) before acceptance.

## Low-Level Prompt Flow (Current Implementation)
- **Prompt Constructors**: Build stage-specific payloads merging guardrails with context, using densely informative yet concise language to maximize Groq API efficiency.
- **System Directives**: Inject stage-appropriate rules rejecting markdown, enforcing CDN usage, and demanding format compliance (JSON for blueprints, JSX for implementations).
- **Context Packing**: Embed blueprint data, guardrail rules, and notes into structured JSON blocks for comprehensive yet token-efficient transmission.
- **Strict Output Enforcement**: Immediately validate responses against required formats, re-prompting on deviations to ensure preview-ready code.
- **Resource Efficiency**: Balance prompt brevity with exhaustive context to minimize API calls while maximizing generated app quality and fidelity.

## Persistence & Telemetry
- Capture blueprint summaries, implementation artifacts, and generation metadata per run.
- Display guardrail violations, sanitization actions, and stage linkages in the operator timeline.
- Preserve inter-stage connections for version history reconstruction and debugging.

## Operational Playbook
- Update guardrail payloads as security policies change.
- Track quality metrics and refine blueprint schemas for improved coverage.
- Conduct periodic prompt-injection tests to verify defense integrity.
- Default to the blueprint → implementation flow for reliable, production-ready React apps.
