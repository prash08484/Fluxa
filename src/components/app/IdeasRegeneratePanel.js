"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Always-visible regenerate panel used on idea-result screens, both in the
 * standalone /create/ideas tool AND inside the project canvas IdeasStep.
 *
 * Quick chips append preset feedback text to the textarea. The final string
 * is sent to the ideas agent — the prompt is instructed to change DIRECTION
 * not just wording.
 */

const QUICK_ACTIONS = [
  { label: "More contrarian",       text: "Make every idea pick a fight or challenge a popular belief in the niche. No safe takes." },
  { label: "More personal",         text: "Lean into first-person specific stories — 'I tried X', 'I quit Y', 'I lost Z'. No generic explainers." },
  { label: "More viral swings",     text: "I want big-swing ideas — polarising, unusual, or pattern-breaking. Less broad/safe, more risky." },
  { label: "More niche-specific",   text: "Go deeper into the niche — assume the viewer is already an insider. Ideas a generalist wouldn't pitch." },
  { label: "Tighter angles",        text: "Every angle has to name a specific number, date, person, or artefact. No vague 'how to' framings." },
  { label: "Different angles",      text: "Throw these out — give me 10 completely different angles, none related to the current batch." },
];

export function IdeasRegeneratePanel({ onSubmit, submitting, error }) {
  const [text, setText] = useState("");

  function applyAction(presetText) {
    setText((prev) =>
      prev.trim() ? `${prev.trim()}\n\n${presetText}` : presetText,
    );
  }

  const canSubmit = text.trim().length >= 3 && !submitting;

  return (
    <div className="paper-card p-5 space-y-4">
      <div>
        <p className="font-hand text-amber-200 text-base">↻ none of these — try again</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          tap a chip or write what's wrong. we'll change DIRECTION, not just rewording.
        </p>
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
          quick changes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => applyAction(a.text)}
              disabled={submitting}
              className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-zinc-300 hover:border-amber-200/40 hover:bg-amber-200/[0.06] hover:text-amber-100 transition-colors disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="block text-sm text-zinc-300 mb-1.5">Your own notes</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="anything specific — quick actions above add to this textarea so you can edit before sending."
          disabled={submitting}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-24 leading-relaxed disabled:opacity-50"
        />
      </label>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setText("")}
          disabled={submitting || !text}
          className="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-40"
        >
          clear
        </button>
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={() => onSubmit(text.trim())}
          disabled={!canSubmit}
        >
          {submitting ? "regenerating…" : "Regenerate 10 new ideas →"}
        </Button>
      </div>
    </div>
  );
}
