"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";
import { ScriptRegeneratePanel } from "@/components/app/ScriptRegeneratePanel";

/**
 * Gamified 6-step script wizard:
 *   1. Brief (niche + platform + length)
 *   2. Idea title
 *   3. Angle — input + "✨ suggest" button (calls /api/tools/angle)
 *   4. Hook — input + "✨ suggest 5 hooks" button (calls /api/tools/hooks), pick one or write your own
 *   5. Format pick (6 cards)
 *   6. Direction (optional notes)
 *   → Generate script, show with regenerate-with-feedback
 */

const FORMAT_OPTIONS = [
  { value: "guidance",     label: "Guidance",        blurb: "Explain a topic, viewer leaves smarter." },
  { value: "day_in_life",  label: "Day in the life", blurb: "First-person walkthrough, mundane → reveal." },
  { value: "tutorial",     label: "Tutorial",        blurb: "Step-by-step how-to. Action-first sentences." },
  { value: "story",        label: "Story",           blurb: "Personal narrative arc with stakes + payoff." },
  { value: "reaction",     label: "Reaction",        blurb: "React + commentary on a clip / claim / news." },
  { value: "listicle",     label: "Listicle",        blurb: "Ranked countdown, top N pattern." },
];

const PLATFORMS = [
  { value: "youtube",        label: "YouTube" },
  { value: "youtube_shorts", label: "YT Shorts" },
  { value: "tiktok",         label: "TikTok" },
  { value: "instagram",      label: "Instagram" },
];

const LENGTHS = [
  { value: "short",  label: "Short — ≤ 60s" },
  { value: "medium", label: "Medium — ~5 min" },
  { value: "long",   label: "Long — 10+ min" },
];

const TOTAL_STEPS = 6;

export function ScriptTool() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({
    niche: "",
    platform: "youtube",
    videoLength: "medium",
    tone: "",
    title: "",
    angle: "",
    hook: "",
    format: null,
    direction: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [script, setScript] = useState(null);
  const [error, setError] = useState(null);

  const setAnswer = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  const canAdvance = (() => {
    if (idx === 0) return answers.niche.trim().length >= 2;
    if (idx === 1) return answers.title.trim().length >= 3;
    if (idx === 2) return answers.angle.trim().length >= 3;
    if (idx === 3) return answers.hook.trim().length >= 3;
    if (idx === 4) return !!answers.format;
    if (idx === 5) return true; // direction is optional
    return false;
  })();

  const isLast = idx === TOTAL_STEPS - 1;
  const next = () => canAdvance && !submitting && (isLast ? submit() : setIdx((i) => i + 1));
  const back = () => idx > 0 && !submitting && setIdx((i) => i - 1);

  function buildBody(feedback) {
    return {
      brief: {
        niche: answers.niche.trim(),
        tone: answers.tone.trim() || undefined,
        platform: answers.platform,
        videoLength: answers.videoLength,
      },
      idea: { id: "i1", title: answers.title.trim(), angle: answers.angle.trim() },
      hook: { id: "h1", text: answers.hook.trim() },
      format: answers.format ?? undefined,
      direction: answers.direction?.trim() || undefined,
      ...(feedback ? { feedback } : {}),
    };
  }

  async function callScript(feedback) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(feedback)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setScript(data.script);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const submit = () => callScript(null);
  const regenerate = (feedback) => callScript(feedback);

  function reset() {
    setIdx(0);
    setScript(null);
  }

  if (script) {
    return (
      <>
        <Progress pct={100} label="done" />
        <ScriptResult
          script={script}
          onRegenerate={regenerate}
          onReset={reset}
          submitting={submitting}
          error={error}
        />
      </>
    );
  }

  if (submitting) {
    return (
      <>
        <Progress pct={100} label="writing…" />
        <AICookingLoader step="script" />
      </>
    );
  }

  return (
    <>
      <Progress
        pct={Math.round(((idx + 0.5) / TOTAL_STEPS) * 100)}
        label={`${idx + 1} / ${TOTAL_STEPS}`}
      />

      <div key={idx} className="paper-card p-7 sm:p-9 mt-5 space-y-5 animate-[fadeIn_0.3s_ease-out]">
        {idx === 0 && <BriefStep answers={answers} setAnswer={setAnswer} />}
        {idx === 1 && <TitleStep value={answers.title} onChange={(v) => setAnswer("title", v)} onEnter={next} />}
        {idx === 2 && (
          <AngleStep
            value={answers.angle}
            onChange={(v) => setAnswer("angle", v)}
            title={answers.title}
            brief={answers}
          />
        )}
        {idx === 3 && (
          <HookStep
            value={answers.hook}
            onChange={(v) => setAnswer("hook", v)}
            title={answers.title}
            angle={answers.angle}
            brief={answers}
          />
        )}
        {idx === 4 && <FormatStep value={answers.format} onChange={(v) => setAnswer("format", v)} />}
        {idx === 5 && (
          <DirectionStep
            value={answers.direction}
            onChange={(v) => setAnswer("direction", v)}
          />
        )}

        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 mt-5">
        <Button
          as="button"
          type="button"
          variant="ghost"
          size="md"
          onClick={back}
          disabled={idx === 0}
          className={idx === 0 ? "opacity-40 pointer-events-none" : ""}
        >
          ← Back
        </Button>
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={next}
          disabled={!canAdvance}
        >
          {isLast ? "Write the script →" : "Next →"}
        </Button>
      </div>
    </>
  );
}

/* ─── steps ─────────────────────────────────────────────────────── */

function BriefStep({ answers, setAnswer }) {
  return (
    <div className="space-y-4">
      <Q hand="set the scene" title="What's the channel about?" />
      <Field label="Niche">
        <input
          value={answers.niche}
          onChange={(e) => setAnswer("niche", e.target.value)}
          placeholder="e.g. JOSSAA counselling, solo founder journey"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
          autoFocus
          required
        />
      </Field>
      <Field label="Tone (optional)">
        <input
          value={answers.tone}
          onChange={(e) => setAnswer("tone", e.target.value)}
          placeholder="dry honest"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Platform">
          <ChipPick value={answers.platform} options={PLATFORMS} onChange={(v) => setAnswer("platform", v)} />
        </Field>
        <Field label="Length">
          <ChipPick value={answers.videoLength} options={LENGTHS} onChange={(v) => setAnswer("videoLength", v)} />
        </Field>
      </div>
    </div>
  );
}

function TitleStep({ value, onChange, onEnter }) {
  return (
    <div className="space-y-3">
      <Q hand="what's the video?" title="Video title" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } }}
        placeholder="e.g. I forgot the JOSSAA deadline. Here's exactly what saved me."
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
      />
    </div>
  );
}

function AngleStep({ value, onChange, title, brief }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function suggest() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tools/angle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: { niche: brief.niche, platform: brief.platform }, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      onChange(data.angle);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <Q hand="the story spine" title="Idea angle" />
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="One or two sentences — the specific question or proof this video pivots on."
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-28 leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={suggest}
          disabled={busy || title.trim().length < 3}
          className="text-sm font-hand text-amber-200 hover:text-amber-100 disabled:opacity-50 transition-colors"
        >
          {busy ? "thinking…" : "✨ suggest an angle from the title"}
        </button>
        {err && <span className="text-xs text-red-300">{err}</span>}
      </div>
    </div>
  );
}

function HookStep({ value, onChange, title, angle, brief }) {
  const [busy, setBusy] = useState(false);
  const [hooks, setHooks] = useState(null);
  const [err, setErr] = useState(null);

  async function suggest() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tools/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: { niche: brief.niche, tone: brief.tone, platform: brief.platform },
          idea: { title, angle },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setHooks(data.hooks);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <Q hand="the first 5 seconds" title="Hook" />
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pattern interrupt, curiosity gap, or stakes — write your own or generate suggestions ↓"
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-24 leading-relaxed"
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={suggest}
          disabled={busy || title.trim().length < 3 || angle.trim().length < 3}
          className="text-sm font-hand text-amber-200 hover:text-amber-100 disabled:opacity-50 transition-colors"
        >
          {busy ? "thinking…" : hooks ? "✨ get 5 new suggestions" : "✨ suggest 5 hooks"}
        </button>
        {err && <span className="text-xs text-red-300">{err}</span>}
      </div>

      {hooks && (
        <div className="space-y-2 mt-2">
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">tap one to use it</p>
          {hooks.map((h) => {
            const selected = value.trim() === h.text.trim();
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onChange(h.text)}
                className={
                  "w-full text-left rounded-lg border p-3 transition-colors " +
                  (selected
                    ? "border-amber-200/60 bg-amber-200/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]")
                }
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-hand text-base text-zinc-100 leading-snug">{h.text}</p>
                  <RiskPill risk={h.risk} />
                </div>
                <p className="text-xs text-zinc-500">pattern: {h.pattern}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormatStep({ value, onChange }) {
  return (
    <div className="space-y-4">
      <Q hand="what kind of video is this?" title="Pick a format" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FORMAT_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                "paper-card p-4 text-left transition-colors " +
                (selected ? "border-amber-200/60 bg-amber-200/[0.06]" : "")
              }
            >
              <div className="font-medium text-zinc-50">{opt.label}</div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{opt.blurb}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DirectionStep({ value, onChange }) {
  return (
    <div className="space-y-3">
      <Q hand="anything specific to add?" title="Direction (optional)" />
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. open with a personal story, end with a hard question, include real numbers…"
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-28 leading-relaxed"
      />
      <p className="text-xs text-zinc-500">leave blank if you want a clean default for this format.</p>
    </div>
  );
}

/* ─── result ────────────────────────────────────────────────────── */

function ScriptResult({ script, onRegenerate, onReset, submitting, error }) {
  const wordCount = countWords(script);
  return (
    <div className="space-y-5 mt-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-hand text-amber-200 text-base">ready to film ↓</p>
          <h2 className="text-xl font-semibold text-zinc-50">{script.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {script.beats.length} beats · ~{wordCount} words · ~{Math.round(script.est_runtime_seconds / 60)} min
          </p>
        </div>
        <Button as="button" type="button" variant="ghost" size="sm" onClick={onReset}>
          ↻ new script (start over)
        </Button>
      </div>

      <div className="paper-card p-6 space-y-5">
        <div>
          <div className="text-xs font-mono text-zinc-500 mb-1">HOOK</div>
          <p className="font-hand text-xl text-amber-200">{script.hook}</p>
        </div>
        <ol className="space-y-4">
          {script.beats.map((b, i) => (
            <li key={i} className="border-l-2 border-white/10 pl-4">
              <div className="flex items-center gap-3 mb-1 text-xs">
                <span className="font-mono text-zinc-500">{b.t}</span>
                <span className="font-hand text-stone-300">{b.label}</span>
              </div>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{b.body}</p>
              {b.bRoll && <p className="mt-1 text-xs text-zinc-500">b-roll: {b.bRoll}</p>}
            </li>
          ))}
        </ol>
        <div className="pt-3 border-t border-white/10">
          <div className="text-xs font-mono text-zinc-500 mb-1">CTA</div>
          <p className="text-zinc-200">{script.cta}</p>
        </div>
      </div>

      <ScriptRegeneratePanel
        onSubmit={onRegenerate}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}

function countWords(script) {
  const text = [
    script.hook,
    ...script.beats.map((b) => b.body),
    script.cta,
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/* ─── tiny atoms ────────────────────────────────────────────────── */

function Q({ hand, title }) {
  return (
    <div>
      <p className="font-hand text-amber-200 text-base mb-1">{hand}</p>
      <h2 className="text-xl sm:text-2xl font-semibold text-zinc-50">{title}</h2>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-zinc-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ChipPick({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "px-3 py-1.5 rounded-full text-xs border transition-colors " +
              (selected
                ? "border-amber-200/60 bg-amber-200/10 text-amber-100"
                : "border-white/10 text-zinc-300 hover:bg-white/[0.04]")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RiskPill({ risk }) {
  const map = {
    safe:       "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
    spicy:      "bg-orange-400/15 text-orange-200 border-orange-400/30",
    polarising: "bg-rose-400/15 text-rose-200 border-rose-400/30",
  };
  return (
    <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[risk] ?? map.safe}`}>
      {risk}
    </span>
  );
}

function Progress({ pct, label }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-zinc-500">{label}</span>
        <span className="font-hand text-amber-200">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-amber-200 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
