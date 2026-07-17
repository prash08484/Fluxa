"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";
import { IdeasRegeneratePanel } from "@/components/app/IdeasRegeneratePanel";

/**
 * Gamified 4-step ideas wizard:
 *   1. Niche
 *   2. Audience + tone (optional both)
 *   3. Platform
 *   4. Length → generate
 *
 * Result panel shows 10 ideas + the IdeasRegeneratePanel for "none of these,
 * try again with feedback".
 */

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

const TOTAL_STEPS = 4;

export function IdeasTool() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({
    niche: "",
    audience: "",
    tone: "",
    platform: "youtube",
    videoLength: "medium",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const setAnswer = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  const canAdvance = (() => {
    if (idx === 0) return answers.niche.trim().length >= 2;
    if (idx === 1) return true; // both optional
    return true; // selects always have defaults
  })();

  const isLast = idx === TOTAL_STEPS - 1;
  const next = () => canAdvance && !submitting && (isLast ? submit() : setIdx((i) => i + 1));
  const back = () => idx > 0 && !submitting && setIdx((i) => i - 1);

  function buildBody(feedback) {
    return {
      brief: {
        niche: answers.niche.trim(),
        audience: answers.audience.trim() || undefined,
        tone: answers.tone.trim() || undefined,
        platform: answers.platform,
        videoLength: answers.videoLength,
      },
      ...(feedback ? { feedback } : {}),
    };
  }

  async function callIdeas(feedback) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(feedback)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed.");
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const submit = () => callIdeas(null);
  const regenerate = (fb) => callIdeas(fb);

  function reset() {
    setIdx(0);
    setData(null);
    setAnswers({
      niche: "",
      audience: "",
      tone: "",
      platform: "youtube",
      videoLength: "medium",
    });
  }

  if (data) {
    return (
      <>
        <Progress pct={100} label="done" />
        <IdeasResult
          data={data}
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
        <Progress pct={100} label="generating…" />
        <AICookingLoader step="ideas" />
      </>
    );
  }

  return (
    <>
      <Progress
        pct={Math.round(((idx + 0.5) / TOTAL_STEPS) * 100)}
        label={`${idx + 1} / ${TOTAL_STEPS}`}
      />

      <div key={idx} className="paper-card p-7 sm:p-9 mt-5 space-y-4 animate-[fadeIn_0.3s_ease-out]">
        {idx === 0 && (
          <NicheStep value={answers.niche} onChange={(v) => setAnswer("niche", v)} onEnter={next} />
        )}
        {idx === 1 && (
          <ContextStep
            audience={answers.audience}
            tone={answers.tone}
            setAudience={(v) => setAnswer("audience", v)}
            setTone={(v) => setAnswer("tone", v)}
          />
        )}
        {idx === 2 && (
          <PlatformStep value={answers.platform} onChange={(v) => setAnswer("platform", v)} />
        )}
        {idx === 3 && (
          <LengthStep value={answers.videoLength} onChange={(v) => setAnswer("videoLength", v)} />
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
          {isLast ? "Generate 10 ideas →" : "Next →"}
        </Button>
      </div>
    </>
  );
}

/* ─── steps ─────────────────────────────────────────────────────── */

function NicheStep({ value, onChange, onEnter }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="space-y-3">
      <Q hand="what are you posting about?" title="Your niche" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="e.g. JOSSAA counselling, solo founder devlog, vintage tech repair"
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
      />
    </div>
  );
}

function ContextStep({ audience, tone, setAudience, setTone }) {
  return (
    <div className="space-y-4">
      <Q hand="who's watching, how do you sound?" title="Context (optional)" />
      <Field label="Audience">
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. 18–22 engineering aspirants, 30–45 indie founders"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
        />
      </Field>
      <Field label="Tone">
        <input
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="e.g. dry honest, soft and reassuring, chaotic energy"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
        />
      </Field>
      <p className="text-xs text-zinc-500">leave blank for sensible defaults.</p>
    </div>
  );
}

function PlatformStep({ value, onChange }) {
  return (
    <div className="space-y-3">
      <Q hand="where's it going?" title="Platform" />
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors " +
                (selected
                  ? "border-amber-200/60 bg-amber-200/10 text-zinc-50"
                  : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.04]")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LengthStep({ value, onChange }) {
  return (
    <div className="space-y-3">
      <Q hand="how long?" title="Target video length" />
      <div className="grid gap-2">
        {LENGTHS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors " +
                (selected
                  ? "border-amber-200/60 bg-amber-200/10 text-zinc-50"
                  : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.04]")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── result ────────────────────────────────────────────────────── */

function IdeasResult({ data, onRegenerate, onReset, submitting, error }) {
  return (
    <div className="space-y-5 mt-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-hand text-amber-200 text-base">filmable, not categories ↓</p>
          <h2 className="text-xl font-semibold text-zinc-50">
            {data.ideas?.length ?? 0} ideas
          </h2>
        </div>
        <Button as="button" type="button" variant="ghost" size="sm" onClick={onReset}>
          ↻ change inputs
        </Button>
      </div>

      <ul className="space-y-3">
        {(data.ideas ?? []).map((i) => (
          <li key={i.id} className="paper-card p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-xs font-mono text-zinc-500 mr-2">{i.id.toUpperCase()}</span>
                <span className="font-medium text-zinc-50">{i.title}</span>
              </div>
              <AppealPill appeal={i.estimated_appeal} />
            </div>
            <p className="text-sm text-zinc-300">{i.angle}</p>
            <p className="mt-2 text-xs text-zinc-500 italic">{i.why_it_works}</p>
          </li>
        ))}
      </ul>

      <IdeasRegeneratePanel
        onSubmit={onRegenerate}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}

/* ─── atoms ─────────────────────────────────────────────────────── */

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

function AppealPill({ appeal }) {
  const map = {
    viral: "bg-amber-200/15 text-amber-100 border-amber-200/30",
    broad: "bg-stone-300/15 text-stone-200 border-stone-300/30",
    niche: "bg-white/5 text-zinc-400 border-white/10",
  };
  return (
    <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[appeal] ?? map.broad}`}>
      {appeal}
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
