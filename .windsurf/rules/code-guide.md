---
trigger: always_on
---

## Core Practices for AI Agents
- Always document meaningful edits you make in `README.md` (or appropriate docs) so humans understand the change.
- After every code modification run the relevant checks (e.g., `npm run dev`, targeted tests, or `npm run build`) to confirm nothing broke.
- When touching shared logic, keep `src/App.jsx` (declarative app) and `src/App.js` (standalone entry) aligned—update both or explain why only one changes.
- Do not delete or disable functionality without delivering an equivalent or better alternative.

## API & Security
- Never prompt end users for Groq keys in generated apps; rely on injected `GROQ_API_KEY` constants.
- When adding AI-dependent features, update prompts/services so generated code knows to use the provided API key and selected model automatically.

## Preview & Dependencies
- All apps generated from user prompts must be with packages that DO NOT require npm installs.

## UI/UX Consistency
- Keep onboarding flows intact—modal triggers such as the API key splash screen must stay connected across all entry points.
- Document the “keep App.jsx and App.js in sync” guideline in code-guide.md (or wherever you store team guardrails) so future contributors remember both entry points matter.

## Testing Checklist for Agents
- Do not make any changes to the api key code when user enters the key as that connectivity works great.
- Generate at least two representative app (e.g., “video player”) to ensure the preview works and no unsupported import errors occur.

## Collaboration Reminders
- Keep diffs tight and relevant to the user’s request; note any follow-on tasks separately.
- Append any new guardrails or onboarding advice you discover directly to this file.
- Revisit these rules before each refactor and spell out assumptions in the worklog or README so human collaborators stay informed.