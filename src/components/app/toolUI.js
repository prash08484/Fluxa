"use client";

/** Shared bits for the standalone tool pages — kept here so each tool page
 *  is just a thin orchestrator around a form and a result panel. */

export const inputCls =
  "w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50";

export const textareaCls = inputCls + " min-h-32 leading-relaxed";

export function Field({ label, hand, children }) {
  return (
    <label className="block">
      {hand && <span className="block font-hand text-amber-200 text-sm">{hand}</span>}
      <span className="block text-sm text-zinc-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function ToolCard({ children, className = "" }) {
  return <div className={`paper-card p-6 ${className}`}>{children}</div>;
}

export function ResultShell({ title, children, hand }) {
  return (
    <section className="mt-8 space-y-3">
      <div>
        {hand && <p className="font-hand text-stone-300 text-base">{hand}</p>}
        <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="paper-card border-red-400/40 bg-red-400/5 text-red-300 p-4 text-sm">
      {error}
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <div className="paper-card p-5 flex items-center gap-3 text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-amber-200 animate-pulse" />
      <span className="font-hand text-base">{label}</span>
    </div>
  );
}
