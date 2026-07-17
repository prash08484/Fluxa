"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";
import { ErrorBanner } from "@/components/app/toolUI";

/**
 * Gamified 4-step thumbnail wizard:
 *   1. Idea title
 *   2. Angle (one-liner)
 *   3. Hook
 *   4. How many concepts (1–6) → generate
 *
 * Result panel shows REAL generated images at 1280x720 (YT spec) + concept text.
 */

const STEPS = [
  { key: "title",  hand: "what's the video?",        q: "Video title",  placeholder: "e.g. I tried every productivity app for 30 days", kind: "text" },
  { key: "angle",  hand: "the story spine",          q: "Idea angle",   placeholder: "Endurance test with brutal honesty about what stuck.", kind: "textarea" },
  { key: "hook",   hand: "the first 5 seconds",      q: "Your hook",    placeholder: "I used 12 productivity apps in 30 days. Only one survived.", kind: "textarea" },
  { key: "count",  hand: "phone-shot, simple props", q: "How many concepts?", kind: "count" },
];

export function ThumbnailTool() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({ count: 3 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [thumbs, setThumbs] = useState(null);

  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const value = answers[step.key];
  const canAdvance =
    step.kind === "count"
      ? value >= 1 && value <= 6
      : typeof value === "string" && value.trim().length >= 3;

  const next = () => {
    if (!canAdvance || submitting) return;
    if (isLast) return submit();
    setIdx((i) => i + 1);
  };
  const back = () => idx > 0 && !submitting && setIdx((i) => i - 1);
  const setAnswer = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  async function submit() {
    setSubmitting(true);
    setError(null);
    setThumbs(null);
    try {
      const res = await fetch("/api/tools/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: { id: "i1", title: answers.title.trim(), angle: answers.angle.trim() },
          hook: { id: "h1", text: answers.hook.trim() },
          count: answers.count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setThumbs(data.thumbnails);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setIdx(0);
    setThumbs(null);
    setAnswers({ count: 3 });
  }

  // Result state — show generated thumbnails
  if (thumbs) {
    return (
      <>
        <Progress pct={100} label="done" />
        <Results thumbs={thumbs} onReset={reset} />
      </>
    );
  }

  if (submitting) {
    return (
      <>
        <Progress pct={100} label="generating…" />
        <AICookingLoader
          messages={[
            "sketching three concepts…",
            "rendering each one as an image…",
            "cropping to 1280×720 (YouTube spec)…",
            "this takes ~20–40s, hang tight ↓",
          ]}
        />
      </>
    );
  }

  return (
    <>
      <Progress pct={Math.round(((idx + 0.5) / STEPS.length) * 100)} label={`${idx + 1} / ${STEPS.length}`} />

      <div key={idx} className="paper-card p-7 sm:p-9 mt-5 animate-[fadeIn_0.3s_ease-out]">
        <p className="font-hand text-amber-200 text-base mb-1">{step.hand}</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-50 mb-5">{step.q}</h2>

        <StepInput
          step={step}
          value={value}
          onChange={(v) => setAnswer(step.key, v)}
          onEnter={next}
        />

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <div className="mt-3"><ErrorBanner error={null} /></div>
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
          {isLast ? `Generate ${answers.count} thumbnail${answers.count === 1 ? "" : "s"} →` : "Next →"}
        </Button>
      </div>
    </>
  );
}

/* ─── input renderers ──────────────────────────────────────────── */

function StepInput({ step, value, onChange, onEnter }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && typeof el.focus === "function") {
      const t = setTimeout(() => el.focus(), 50);
      return () => clearTimeout(t);
    }
  }, []);

  if (step.kind === "count") {
    return (
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs text-zinc-500">drag to pick</p>
          <span className="font-mono text-2xl text-zinc-50">{value ?? 3}</span>
        </div>
        <input
          ref={ref}
          type="range"
          min={1}
          max={6}
          value={value ?? 3}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-amber-200"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <span key={n} className={(value ?? 3) === n ? "text-amber-200" : ""}>{n}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">each costs ~$0.04 in OpenAI image credits.</p>
      </div>
    );
  }

  if (step.kind === "textarea") {
    return (
      <textarea
        ref={ref}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-28 leading-relaxed"
      />
    );
  }

  return (
    <input
      ref={ref}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      placeholder={step.placeholder}
      className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
    />
  );
}

/* ─── results ──────────────────────────────────────────────────── */

function Results({ thumbs, onReset }) {
  return (
    <section className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-hand text-amber-200 text-base">pick the best one ↓</p>
          <h2 className="text-xl font-semibold text-zinc-50">
            {thumbs.length} thumbnail{thumbs.length === 1 ? "" : "s"} at 1280×720
          </h2>
        </div>
        <Button as="button" type="button" variant="ghost" size="sm" onClick={onReset}>
          ↻ start over
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {thumbs.map((t) => (
          <ThumbCard key={t.id} thumb={t} />
        ))}
      </div>

      <p className="text-xs text-zinc-500 pt-2">
        right-click → save image · all images are 1280×720 jpeg (YouTube spec)
      </p>
    </section>
  );
}

function ThumbCard({ thumb }) {
  return (
    <div className="paper-card overflow-hidden">
      {thumb.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={thumb.imageUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
          <img
            src={thumb.imageUrl}
            alt={thumb.concept}
            className="w-full aspect-video object-cover border-b border-white/5 hover:opacity-90 transition-opacity"
            loading="lazy"
            width={1280}
            height={720}
          />
        </a>
      ) : (
        <div className="w-full aspect-video grid place-items-center border-b border-white/5 bg-white/[0.02] text-zinc-500 text-xs font-hand p-4 text-center">
          (image not generated — concept only. check OpenAI image-gen access on your key)
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-zinc-500">{thumb.id.toUpperCase()}</span>
          <span className="sticky-note px-2 py-0.5 rounded text-[10px] font-hand">
            {thumb.overlay_text}
          </span>
        </div>
        <div className="font-medium text-zinc-50">{thumb.concept}</div>
        <p className="text-xs text-zinc-400 mt-1">{thumb.composition}</p>
        <p className="mt-2 text-[11px] text-zinc-500">{thumb.expression_or_emotion}</p>
      </div>
    </div>
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
