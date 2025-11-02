# Roadmap: ESM+CDN Instant App Preview — Plan

This document outlines a phased plan to complete the setup so generated apps (from Groq) consistently follow the ESM+CDN fragment contract and render instantly and safely inside our preview. It maps work to concrete deliverables and acceptance criteria.

## Goals
- Ensure Groq-generated apps return preview-ready HTML fragments (importmap + module + #app) by default.
- Make the preview runtime robust, secure, and fast, accepting the fragment without heavy parsing.
- Provide a dynamic prompt builder so the model can produce the best app for the user's idea while following constraints.
- Keep backward compatibility for legacy JSX outputs.

---

## Phase 0 — Discovery (done)
- Review current preview runtime and generator flow.
- Outcome: `esmcdnunderstanding.md` produced; current runtime supports both fragment fast-path and legacy JSX fallback.

Acceptance: document exists and runtime fast-path added.

---

## Phase 1 — Prompt Engineering (current)
Objective: Replace static templates with a dynamic prompt builder that composes strict, context-aware prompts.

Tasks:
- Implement `buildDynamicPrompt(appIdea, options)` that enforces the importmap+module fragment contract.
- Default to lightweight libraries (Preact) and Tailwind for styling unless the idea requires React.
- Use placeholders for secrets (`[[GROQ_API_KEY]]`) and instruct the runtime to inject keys.

Deliverable: `src/prompts/templates.js` exports `buildDynamicPrompt` and `FALLBACK_CODE`.

Acceptance criteria:
- Prompt instructs generator to return only an HTML fragment.
- Prompt includes UI hints and AI integration rules.

---

## Phase 2 — Preview Runtime & Validation
Objective: Make the preview runtime accept fragments directly, apply CSP, and provide feedback/errors.

Tasks:
- Ensure `src/lib/previewRuntime.js` fast-path injects fragments and sets a minimal CSP meta tag.
- Maintain legacy transform fallback for JSX outputs.
- Provide postMessage hooks: `preview-loaded`, `preview-error`.

Deliverable: fast-path injection + fallback kept.

Acceptance:
- Fragment with importmap+module renders correctly in iframe and posts `preview-loaded`.
- Invalid fragments produce a meaningful `preview-error`.

---

## Phase 3 — Generator Integration & UI
Objective: Wire the generator UI to use the dynamic prompt builder and allow options for "fragment-first" vs "legacy JSX" modes.

Tasks:
- Update `src/components/AppGenerator.jsx` to call `buildDynamicPrompt()` and send the prompt to Groq.
- Add UI toggle for "Preview Fragment" (default ON) and optional library choice (Preact/React).
- On generation failure, run a manifest-based fixer (AI) to attempt repair, or fall back to `FALLBACK_CODE`.

Deliverable: UI updates + generator wiring.

Acceptance:
- Generated fragment renders without manual changes in >90% of tests with varied app ideas.
- UI clearly indicates when generator produced a fragment vs legacy output.

---

## Phase 4 — Testing & Hardening
Objective: Add tests and monitoring to ensure reliability.

Tasks:
- Unit tests for `buildPreviewHTML` fast-path and fallback paths.
- Integration test: simulate Groq responses (fragment and JSX) and verify iframe results.
- Add runtime logging and telemetry gates for preview errors.

Deliverable: tests and monitoring hooks.

Acceptance: tests pass locally and CI (if present).

---

## Phase 5 — UX polish & Rollout
Objective: Polish generated app appearance and roll out safely.

Tasks:
- Improve default styles and small UI patterns for generated apps (responsive cards, accessible buttons).
- Provide example prompt presets for "beginner/professional/legacy" in a separate doc (not as static templates in code).
- Deploy and monitor errors; provide a quick re-run workflow for users.

Deliverable: UX polish, example prompts, monitoring dashboard.

Acceptance: positive user feedback and low error rates on preview.

---

## Risks & Mitigations
- Model returns non-conforming output: implement validator + auto-retry with stricter prompt and human-readable error messages.
- External CDN failures: use uniqueByUrl dedupe, fallback to alternate CDN or UMD variant, and show graceful UI.
- Security: always sandbox fragments in iframe and use strict CSP headers.

---

## Next immediate steps (what I'll implement now)
1. Remove static prompt templates and keep `buildDynamicPrompt` (done).
2. Update `AppGenerator.jsx` to call the dynamic prompt builder (done).
3. Add this plan file to the repo (done).
4. If you want, I'll now implement the UI toggle and strict validator + auto-retry flow.

Pick the next task you want me to implement and I'll continue (UI toggle, strict validation & retry, tests, or telemetry).