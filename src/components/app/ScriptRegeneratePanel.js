"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Always-visible regenerate panel used on the script-result screen, both in
 * the standalone /create/script tool AND inside the project canvas.
 *
 * Quick action chips append preset feedback text to the textarea (user can
 * still edit before submitting). The final feedback string is what gets sent
 * to the script agent — the prompt knows to APPLY feedback literally rather
 * than just nodding at it.
 *
 * Props:
 *   onSubmit(feedback: string)  — called when the user clicks "Rewrite"
 *   submitting: boolean         — disables the button while in flight
 *   error?: string              — surface inline below the textarea
 */

const QUICK_ACTIONS = [
  { label: "Make it longer",   text: "Make it noticeably longer — add 2-3 more substantive beats and expand each beat body with more detail, examples, and specifics." },
  { label: "Make it shorter",  text: "Cut this down — consolidate to 5 tight beats, trim every line that isn't load-bearing." },
  { label: "More casual",      text: "Loosen the tone — more contractions, conversational asides, a bit of self-deprecation." },
  { label: "More formal",      text: "Tighten the tone — fewer asides, more authoritative phrasing, no filler." },
  { label: "Sharper hook",     text: "The hook is too soft. Open with a punchier pattern interrupt — make me unable to scroll past." },
  { label: "Better CTA",       text: "Rewrite the CTA so it's tied to this video's specific payoff, not generic 'comment below'." },
  { label: "Add real examples", text: "Drop in 2-3 concrete examples / numbers / named references — the script feels too abstract." },
];

export function ScriptRegeneratePanel({ onSubmit, submitting, error }) {
  const [text, setText] = useState("");
  const [mustInclude, setMustInclude] = useState("");

  function applyAction(presetText) {
    // Append (separated) so multiple quick actions stack rather than replace.
    setText((prev) =>
      prev.trim() ? `${prev.trim()}\n\n${presetText}` : presetText,
    );
  }

  function submit() {
    const parts = [text.trim()];
    const must = mustInclude.trim();
    if (must) parts.push(`Must include these words/phrases verbatim somewhere natural: ${must}`);
    const feedback = parts.filter(Boolean).join("\n\n");
    onSubmit(feedback);
  }

  const canSubmit = (text.trim().length + mustInclude.trim().length) >= 3 && !submitting;

  return (
    <div className="paper-card p-5 space-y-4">
      <div>
        <p className="font-hand text-amber-200 text-base">↻ improve this script</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          tap a quick change or write what to fix. we'll keep your idea + hook + format the same.
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
        <span className="block text-sm text-zinc-300 mb-1.5">
          Must include these words / phrases
          <span className="text-zinc-500 font-normal"> (optional, comma-separated)</span>
        </span>
        <input
          type="text"
          value={mustInclude}
          onChange={(e) => setMustInclude(e.target.value)}
          placeholder="e.g. JOSSAA round 3, 47%, my counselling spreadsheet"
          disabled={submitting}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 disabled:opacity-50"
        />
      </label>

      <label className="block">
        <span className="block text-sm text-zinc-300 mb-1.5">
          Your own notes
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="anything specific to fix — quick actions above add to this textarea so you can edit before sending."
          disabled={submitting}
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-28 leading-relaxed disabled:opacity-50"
        />
      </label>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => { setText(""); setMustInclude(""); }}
          disabled={submitting || (!text && !mustInclude)}
          className="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-40"
        >
          clear
        </button>
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={submit}
          disabled={!canSubmit}
        >
          {submitting ? "rewriting…" : "Rewrite the script →"}
        </Button>
      </div>
    </div>
  );
}
