import React from 'react';

const AgentTimeline = ({ run, isGenerating, guardrailWarnings = [] }) => {
  if (isGenerating) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-iris"></span>
          <span>Groq agent is reasoning…</span>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
        Agent reasoning history appears here after generation.
      </div>
    );
  }

  const rawSummary = run.finalText?.trim();
  const looksLikeCode = rawSummary
    ? /(import\s+[A-Za-z*{]|export\s+default|<\w+[\s>]|const\s+[A-Z][A-Za-z0-9_]*\s*=\s*\(|function\s+[A-Z][A-Za-z0-9_]*)/.test(rawSummary)
    : false;
  const summary = looksLikeCode
    ? 'Generated JSX was delivered directly to the preview sandbox.'
    : rawSummary;
  const reasoning = Array.isArray(run.reasoning) ? run.reasoning : [];
  const toolCalls = Array.isArray(run.toolCalls) ? run.toolCalls : [];
  const manifestSummary = run.manifestSummary || null;
  const warnings = Array.isArray(guardrailWarnings) ? guardrailWarnings : [];

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-2">Agent summary</h3>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{summary}</p>
        </div>
      ) : null}

      {warnings.length ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-red-200 mb-2">Guardrail warnings</h3>
          <div className="space-y-2 text-sm text-red-100/90">
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
                {warning}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {manifestSummary ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Preview manifest</h3>
          <dl className="grid grid-cols-2 gap-3 text-xs text-white/70">
            <div>
              <dt className="uppercase tracking-wide text-white/40">Scripts</dt>
              <dd className="text-white/80 text-sm">{manifestSummary.scriptCount ?? 0}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Styles</dt>
              <dd className="text-white/80 text-sm">{manifestSummary.styleCount ?? 0}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Custom head</dt>
              <dd className="text-white/80 text-sm">{manifestSummary.hasHead ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Custom body</dt>
              <dd className="text-white/80 text-sm">{manifestSummary.hasCustomBody ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Entry type</dt>
              <dd className="text-white/80 text-sm">{manifestSummary.entryType || 'Legacy runtime'}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {reasoning.length ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Reasoning steps</h3>
          <div className="space-y-3 text-sm text-white/70">
            {reasoning.map((entry, index) => {
              const label = entry.tool || entry.type || `Step ${index + 1}`;
              const payload = entry.result ?? entry.content ?? '';
              const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
              return (
                <div key={`${label}-${index}`} className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-xs text-white/50 mb-1">{label}</div>
                  <div className="whitespace-pre-wrap break-words">{text}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {toolCalls.length ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Tool calls</h3>
          <div className="space-y-3 text-sm text-white/70">
            {toolCalls.map((call) => (
              <div key={call.id || call.name} className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                  <span>{call.name || 'Tool'}</span>
                  <span>{call.status || 'completed'}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words text-xs text-white/70">
                  {JSON.stringify(call.arguments ?? {}, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AgentTimeline;
