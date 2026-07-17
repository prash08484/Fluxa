"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";

/**
 * Progressive-disclosure project wizard. Shows ONE question at a time.
 * Pattern lifted from Typeform / Linear onboarding — each step is its own
 * commitment, not a wall of fields. Cheap dopamine ✦
 *
 * Step order:
 *   1 Project name (required)
 *   2 One-liner description (optional)
 *   3 Cover image (optional, Cloudinary)
 *   4 Niche (required) ── from here on we're filling the brief
 *   5 Audience (optional)
 *   6 Tone (optional)
 *   7 Platform (select)
 *   8 Length (select)
 *   → Submit: create project + kick off canvas, then redirect to /projects/[id]
 */

/**
 * Wizard step order. Platform is FIRST — everything else flows from it.
 * Picking a vertical-short platform (shorts / reel / tiktok) auto-defaults
 * videoLength=short so the script agent generates short-form output.
 *
 * The "signature" step is hidden for non-YouTube picks (signatures are a
 * YouTube-description-footer pattern; text-post platforms get adapted via
 * the Extensions panel in the project workspace).
 */
const STEPS = [
  { key: "platform", required: true, hand: "where's the primary post going?", q: "Platform", kind: "platform-pick" },
  { key: "name", required: true, hand: "first things first ↓", q: "What's this project called?", placeholder: "e.g. Devlog #7 — wishlist launch", kind: "text" },
  { key: "description", required: false, hand: "for future-you", q: "One line about it (optional)", placeholder: "the messy week that made me ship", kind: "text" },
  { key: "coverImageUrl", required: false, hand: "skip if you want", q: "Cover image", placeholder: null, kind: "image" },
  { key: "niche", required: true, hand: "the canvas needs this", q: "What's your niche?", placeholder: "e.g. solo founder journey", kind: "text" },
  { key: "thinking", required: false, hand: "context you'd give a friend", q: "What are you thinking? (optional)", placeholder: "e.g. I want to do something around the wishlist bump, maybe a teardown of what worked", kind: "textarea" },
  { key: "audience", required: false, hand: "who's watching?", q: "Audience (optional)", placeholder: "e.g. 25–40 indie hackers", kind: "text" },
  { key: "tone", required: false, hand: "how do you sound?", q: "Tone (optional)", placeholder: "dry, lightly chaotic", kind: "text" },
  { key: "videoLength", required: true, hand: "how long?", q: "Video length", kind: "select", options: [
    { value: "short", label: "Short — ≤ 60s" },
    { value: "medium", label: "Medium — ~5 min" },
    { value: "long", label: "Long — 10+ min" },
  ], default: "medium" },
  { key: "signature", required: false, hand: "we'll append this to every description", q: "Your description signature (optional)", placeholder: "→ socials, sponsor disclaimers, links — paste your boilerplate footer here. you only do this once per project.", kind: "textarea", showIf: (a) => a.platform === "youtube" },
];

/**
 * Platform options. Each pick sets a sensible default videoLength + tells
 * the agent what shape of script to generate. Cross-platform adapters
 * (LinkedIn, X, X Thread) live in the project workspace AFTER creation.
 */
const PLATFORM_OPTIONS = [
  { value: "youtube",        label: "YouTube",        blurb: "Long video — full pipeline with hook, beats, SEO, thumbnail.", defaultLength: "medium" },
  { value: "youtube_shorts", label: "YT Shorts",      blurb: "Vertical short under 60s — punchy hook, tight beats.",        defaultLength: "short" },
  { value: "instagram",      label: "Instagram Reel", blurb: "9:16 vertical, 15–90s — caption-driven.",                       defaultLength: "short" },
  { value: "tiktok",         label: "TikTok",          blurb: "Native vertical short — strong cold open, trend-aware.",       defaultLength: "short" },
];

export function NewProjectWizard() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({ platform: "youtube", videoLength: "medium" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Compute the active step list — skips steps with showIf returning false.
  const activeSteps = STEPS.filter((s) => !s.showIf || s.showIf(answers));
  const step = activeSteps[idx];
  const isLast = idx === activeSteps.length - 1;
  const value = answers[step.key] ?? "";
  const canAdvance =
    step.kind === "platform-pick"
      ? !!answers.platform
      : !step.required || (typeof value === "string" ? value.trim().length > 0 : !!value);

  const next = () => {
    if (!canAdvance || submitting) return;
    if (isLast) return submit();
    setIdx((i) => i + 1);
  };

  const back = () => {
    if (idx === 0 || submitting) return;
    setIdx((i) => i - 1);
  };

  const skip = () => {
    if (step.required || submitting) return;
    if (isLast) return submit();
    setIdx((i) => i + 1);
  };

  const setAnswer = (key, v) =>
    setAnswers((a) => {
      const next = { ...a, [key]: v };
      // Platform pick auto-defaults videoLength to the platform's natural shape.
      // User can still override at the videoLength step if they want long-form
      // on Shorts (rare but legal).
      if (key === "platform") {
        const opt = PLATFORM_OPTIONS.find((p) => p.value === v);
        if (opt) next.videoLength = opt.defaultLength;
      }
      return next;
    });

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const brief = {
        niche: answers.niche?.trim(),
        ...(answers.thinking?.trim() ? { thinking: answers.thinking.trim() } : {}),
        ...(answers.audience?.trim() ? { audience: answers.audience.trim() } : {}),
        ...(answers.tone?.trim() ? { tone: answers.tone.trim() } : {}),
        platform: answers.platform,
        videoLength: answers.videoLength,
        ...(answers.signature?.trim() ? { signature: answers.signature.trim() } : {}),
      };
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: answers.name.trim(),
          description: answers.description?.trim() || undefined,
          coverImageUrl: answers.coverImageUrl || undefined,
          brief,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      router.push(`/projects/${data.project.id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="space-y-4">
        <ProgressBar idx={activeSteps.length} total={activeSteps.length} />
        <AICookingLoader
          messages={[
            "creating your project…",
            "warming up the canvas…",
            "scanning what's trending in your niche…",
            "almost there ↓",
          ]}
          interval={1400}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar idx={idx} total={activeSteps.length} />

      <div key={idx} className="paper-card p-7 sm:p-9 animate-[fadeIn_0.3s_ease-out]">
        <p className="font-hand text-amber-200 text-base mb-1">
          {step.hand}
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-50 mb-5">
          {step.q}
        </h2>

        <StepInput
          step={step}
          value={value}
          onChange={(v) => setAnswer(step.key, v)}
          onEnter={next}
        />

        {error && (
          <p className="mt-4 text-sm text-red-300">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
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

        <div className="flex items-center gap-3">
          {!step.required && (
            <button
              type="button"
              onClick={skip}
              className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              skip
            </button>
          )}
          <Button
            as="button"
            type="button"
            variant="accent"
            size="md"
            onClick={next}
            disabled={!canAdvance}
          >
            {isLast ? "Create project + fill canvas →" : "Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- inputs -------------------- */

function StepInput({ step, value, onChange, onEnter }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && typeof el.focus === "function") {
      const t = setTimeout(() => el.focus(), 50);
      return () => clearTimeout(t);
    }
  }, []);

  if (step.kind === "platform-pick") {
    return <PlatformPick value={value} onChange={onChange} />;
  }

  if (step.kind === "select") {
    return (
      <div className="grid sm:grid-cols-2 gap-2">
        {step.options.map((opt) => {
          const selected = value === opt.value || (!value && opt.value === step.default);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors " +
                (selected
                  ? "border-amber-200/60 bg-amber-200/10 text-zinc-50"
                  : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (step.kind === "image") {
    return <CoverUpload value={value} onChange={onChange} />;
  }

  if (step.kind === "textarea") {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-36 leading-relaxed"
      />
    );
  }

  return (
    <input
      ref={ref}
      type="text"
      value={value}
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

function PlatformPick({ value, onChange }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {PLATFORM_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "paper-card p-4 text-left transition-all " +
              (selected ? "border-amber-200/60 bg-amber-200/[0.06]" : "")
            }
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-zinc-50">{opt.label}</span>
              {selected && (
                <span className="text-[10px] uppercase tracking-wider font-mono text-amber-200">
                  picked
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{opt.blurb}</p>
          </button>
        );
      })}
      <p className="sm:col-span-2 text-xs text-zinc-500 mt-1">
        whatever you pick, you can extend the same content to LinkedIn, X, Threads or other formats from inside the project — no need to start over.
      </p>
    </div>
  );
}

function CoverUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
      onChange(data.url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="cover" className="w-full max-h-64 object-cover rounded-lg border border-white/10" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-black/70 text-zinc-200 border border-white/10"
          >
            replace
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-white/15 hover:border-amber-200/40 px-6 py-10 text-center transition-colors"
        >
          <p className="font-hand text-amber-200 text-lg">drop or click to upload</p>
          <p className="mt-1 text-xs text-zinc-500">jpeg / png / webp · max 5MB · feel free to skip</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      {uploading && <p className="mt-2 text-xs text-zinc-400 font-hand">uploading…</p>}
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
    </div>
  );
}

/* -------------------- progress -------------------- */

function ProgressBar({ idx, total }) {
  const pct = Math.round(((idx + 0.5) / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-zinc-500">{idx + 1} / {total}</span>
        <span className="font-hand text-amber-200">{pct}% there</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-amber-200 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
