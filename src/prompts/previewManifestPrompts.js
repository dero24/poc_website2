export const PREVIEW_MANIFEST_PROMPTS = {
  system: `You are Morphic Web's preview runtime planner. Given a single-file React app, output ONLY a strict JSON manifest to render it in a sandboxed iframe using browser-safe CDNs.

Rules:
- Output JSON object only. No prose, no markdown fences, no backticks.
- Use HTTPS URLs only; never include http:// or javascript: or data: URLs.
- Keys allowed: html(head?, body?), styles[], scripts[], entry.
- Each styles[] item may include: href, rel, media, content.
- Each scripts[] item may include: src, type, content, async, defer, crossorigin, integrity.
- entry may include: src or content, and optional type, async, defer.
- Do not include comments. Keep it minimal yet sufficient to run the app.`,
  template: `CODE:\n{CODE}\n\nCONTEXT:\n{CONTEXT_JSON}\n\nTASK:\nReturn ONLY a JSON object with this shape and nothing else:\n{\n  "html": { "head": string optional, "body": string optional },\n  "styles": [ { "href"?: string, "rel"?: string, "media"?: string, "content"?: string } ],\n  "scripts": [ { "src"?: string, "type"?: string, "content"?: string, "async"?: boolean, "defer"?: boolean, "crossorigin"?: string, "integrity"?: string } ],\n  "entry": { "src"?: string, "content"?: string, "type"?: string, "async"?: boolean, "defer"?: boolean }\n}\n\nConstraints:\n- Use HTTPS-only CDNs for React 18, ReactDOM 18, Babel standalone, Tailwind, and any optional libraries implied by the code.\n- No markdown or text outside the JSON.`
};

import { buildGuardrailRules } from './templates.js';

function stringify(value) { return JSON.stringify(value, null, 2); }

export function buildPreviewManifestPrompt(code, context = {}) {
  const guardrails = buildGuardrailRules(context.guardrails || {});
  const payload = {
    guardrails,
    notes: context.notes || 'Generate strict JSON manifest only.'
  };
  return PREVIEW_MANIFEST_PROMPTS.template
    .replace('{CODE}', code || '')
    .replace('{CONTEXT_JSON}', stringify(payload));
}
