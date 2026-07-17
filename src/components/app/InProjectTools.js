"use client";

import Link from "next/link";
import { Icon } from "@/components/app/Icon";

/**
 * Project-scoped tool grid. Shown BELOW the canvas on the project workspace
 * page. These are the items that used to live in the global sidebar — they
 * now belong to the project so users don't see them on the dashboard.
 *
 * The "Quick tools" group is a set of one-shot generators that take the
 * project's brief as context (open in a new tab so the user doesn't lose the
 * canvas).
 *
 * The "Extensions" group adapts the project's existing output (script, idea)
 * to a different platform. v1 has LinkedIn live; the rest are coming-soon
 * stubs that follow the same pattern.
 */

const QUICK_TOOLS = [
  { href: "/create/ideas",     label: "Get ideas",      icon: "spark", blurb: "More ideas in this niche." },
  { href: "/create/script",    label: "Write script",   icon: "pen",   blurb: "Standalone script writer." },
  { href: "/create/thumbnail", label: "Make thumbnail", icon: "image", blurb: "Just thumbnail concepts + images." },
  { href: "/analyze",          label: "Judge & analyze", icon: "gauge", blurb: "Score a draft script or any YT URL." },
];

const EXTENSIONS = [
  { key: "linkedin", label: "LinkedIn post", blurb: "Adapt your script to a native LinkedIn post.", live: true,  icon: "linkedin" },
  { key: "x",        label: "X post",        blurb: "A single, sharp X post + image.",              live: false, icon: "x" },
  { key: "x_thread", label: "X thread",      blurb: "5–10-tweet thread + cover image.",             live: false, icon: "x" },
  { key: "reel",     label: "Reel / Short",  blurb: "Vertical 15–60s script with on-screen text.",  live: false, icon: "spark" },
];

export function InProjectTools({ projectId, canExtend = false, onOpenExtension }) {
  return (
    <div className="space-y-10 mt-12">
      {canExtend && (
        <section>
          <div className="mb-3">
            <p className="font-hand text-stone-300 text-base">extend this project ↓</p>
            <h2 className="text-lg font-semibold text-zinc-50">Cross-platform extensions</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              adapt the same content to other platforms — they all share your script + idea + brief.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {EXTENSIONS.map((ext) => (
              <button
                key={ext.key}
                type="button"
                onClick={() => ext.live && onOpenExtension(ext.key)}
                disabled={!ext.live}
                className={
                  "paper-card p-4 text-left transition-all " +
                  (ext.live
                    ? "hover:-translate-y-0.5 hover:border-amber-200/40 cursor-pointer"
                    : "opacity-60 cursor-not-allowed")
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-zinc-50">{ext.label}</span>
                  {!ext.live && (
                    <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                      soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{ext.blurb}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {!canExtend && (
        <section className="paper-card p-5 bg-white/[0.02] text-center">
          <p className="font-hand text-amber-200 text-base mb-1">extensions unlock at the end ↓</p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            finish the canvas pipeline (ideas → script → titles → thumbnails) and the
            cross-platform adapters (LinkedIn, X, Threads, Reel) will appear here.
          </p>
        </section>
      )}

      <section>
        <div className="mb-3">
          <p className="font-hand text-amber-200 text-base">side tools</p>
          <h2 className="text-lg font-semibold text-zinc-50">Quick tools</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            one-shot generators outside the main canvas. open in a new tab.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              target="_blank"
              className="paper-card p-4 flex items-start gap-3 hover:-translate-y-0.5 transition-transform"
            >
              <span className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-amber-200 shrink-0">
                <Icon name={t.icon} size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-sm text-zinc-100">{t.label}</div>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{t.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
