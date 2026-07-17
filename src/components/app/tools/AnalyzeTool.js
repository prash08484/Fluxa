"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";

/**
 * Gamified 3-step analyze wizard:
 *   1. Source — tab toggle: YouTube URL vs paste text
 *      If URL: fetch transcript via /api/tools/youtube-transcript
 *      If text: use directly
 *   2. Context — platform + niche (optional)
 *   3. Run → AICookingLoader → scorecard
 */

const VERDICT_COPY = {
  publish:             { label: "Publish",             color: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
  publish_after_fixes: { label: "Publish after fixes", color: "text-amber-200 border-amber-300/40 bg-amber-200/10" },
  rework:              { label: "Rework",              color: "text-rose-300 border-rose-400/40 bg-rose-400/10" },
};

const PLATFORMS = [
  { value: "youtube",        label: "YouTube" },
  { value: "youtube_shorts", label: "YT Shorts" },
  { value: "tiktok",         label: "TikTok" },
  { value: "instagram",      label: "Instagram" },
];

const TOTAL_STEPS = 3;

export function AnalyzeTool() {
  const [idx, setIdx] = useState(0);

  // Source step
  const [mode, setMode] = useState("text"); // "text" | "url"
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState(null);     // fetched transcript when mode=url
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  // Context step
  const [platform, setPlatform] = useState("youtube");
  const [niche, setNiche] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const sourceReady = mode === "text"
    ? text.trim().length >= 40
    : !!transcript && transcript.trim().length >= 40;

  const canAdvance = idx === 0 ? sourceReady : idx === 1 ? true : false;
  const isLast = idx === TOTAL_STEPS - 1;

  const next = () => canAdvance && !submitting && (isLast ? submit() : setIdx((i) => i + 1));
  const back = () => idx > 0 && !submitting && setIdx((i) => i - 1);

  async function fetchTranscript() {
    setFetching(true);
    setFetchErr(null);
    setTranscript(null);
    try {
      const res = await fetch("/api/tools/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't fetch transcript.");
      setTranscript(data.transcript);
    } catch (e) {
      setFetchErr(e.message);
    } finally {
      setFetching(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const input = mode === "text" ? text.trim() : transcript;
      const res = await fetch("/api/tools/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          platform,
          niche: niche.trim() || undefined,
          sourceUrl: mode === "url" ? url.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setResult(data.analysis);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setIdx(0);
    setResult(null);
    setText("");
    setUrl("");
    setTranscript(null);
    setNiche("");
  }

  if (result) {
    return (
      <>
        <Progress pct={100} label="done" />
        <Scorecard analysis={result} onReset={reset} sourceUrl={mode === "url" ? url : null} />
      </>
    );
  }

  if (submitting) {
    return (
      <>
        <Progress pct={100} label="judging…" />
        <AICookingLoader step="analyze" />
      </>
    );
  }

  return (
    <>
      <Progress
        pct={Math.round(((idx + 0.5) / TOTAL_STEPS) * 100)}
        label={`${idx + 1} / ${TOTAL_STEPS}`}
      />

      <div key={idx} className="paper-card p-7 sm:p-9 mt-5 animate-[fadeIn_0.3s_ease-out]">
        {idx === 0 && (
          <SourceStep
            mode={mode} setMode={setMode}
            text={text} setText={setText}
            url={url} setUrl={setUrl}
            transcript={transcript}
            fetching={fetching} fetchErr={fetchErr}
            onFetch={fetchTranscript}
            onClearTranscript={() => { setTranscript(null); setFetchErr(null); }}
          />
        )}
        {idx === 1 && (
          <ContextStep
            platform={platform} setPlatform={setPlatform}
            niche={niche} setNiche={setNiche}
          />
        )}
        {idx === 2 && (
          <ConfirmStep
            mode={mode} text={text} url={url} transcript={transcript}
            platform={platform} niche={niche}
          />
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
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
          {isLast ? "Judge it →" : "Next →"}
        </Button>
      </div>
    </>
  );
}

/* ─── steps ─────────────────────────────────────────────────────── */

function SourceStep({ mode, setMode, text, setText, url, setUrl, transcript, fetching, fetchErr, onFetch, onClearTranscript }) {
  return (
    <div className="space-y-4">
      <Q hand="what are we judging?" title="Source" />

      <div className="flex gap-1.5 p-1 rounded-full border border-white/10 bg-black/40 w-fit">
        <ModeTab active={mode === "text"} onClick={() => setMode("text")}>Paste script / concept</ModeTab>
        <ModeTab active={mode === "url"} onClick={() => setMode("url")}>YouTube URL</ModeTab>
      </div>

      {mode === "text" ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your draft script, or describe the video you're planning in a paragraph or two."
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-48 leading-relaxed"
        />
      ) : transcript ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.04] p-3 text-xs text-emerald-200">
            ✓ transcript fetched — {transcript.length} characters
          </div>
          <textarea
            value={transcript}
            readOnly
            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-300 text-sm min-h-32 leading-relaxed"
          />
          <button
            type="button"
            onClick={onClearTranscript}
            className="text-xs text-zinc-500 hover:text-amber-200 font-hand"
          >
            ↻ use a different URL
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              autoFocus
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="flex-1 rounded-lg bg-black/40 border border-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
            />
            <Button
              as="button"
              type="button"
              variant="accent"
              size="md"
              onClick={onFetch}
              disabled={fetching || !/youtube\.com|youtu\.be/i.test(url)}
            >
              {fetching ? "fetching…" : "Fetch transcript"}
            </Button>
          </div>
          {fetchErr && (
            <div className="rounded-lg border border-rose-400/30 bg-rose-400/[0.05] p-3 text-xs text-rose-200 space-y-1">
              <p>{fetchErr}</p>
              <p className="text-zinc-400">
                Switch to "Paste script / concept" tab and paste the transcript manually.
              </p>
            </div>
          )}
          <p className="text-xs text-zinc-500">
            we pull the public caption track. videos without captions need manual paste.
          </p>
        </div>
      )}
    </div>
  );
}

function ContextStep({ platform, setPlatform, niche, setNiche }) {
  return (
    <div className="space-y-4">
      <Q hand="quick context" title="Where is this going?" />
      <Field label="Platform">
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((opt) => {
            const selected = platform === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlatform(opt.value)}
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
      </Field>
      <Field label="Niche (optional)">
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. JOSSAA counselling"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50"
        />
      </Field>
    </div>
  );
}

function ConfirmStep({ mode, text, url, transcript, platform, niche }) {
  const preview = mode === "text" ? text : transcript ?? "";
  return (
    <div className="space-y-3">
      <Q hand="ready?" title="Confirm and run" />
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-1 text-xs">
        <Row label="source"   value={mode === "url" ? `YouTube URL → ${url}` : "pasted text"} />
        <Row label="platform" value={platform} />
        {niche && <Row label="niche" value={niche} />}
        <Row label="length"   value={`${preview.length} characters`} />
      </div>
      <details className="text-xs text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-300">preview the input</summary>
        <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap p-3 rounded bg-black/40 border border-white/5 text-zinc-300">
          {preview.slice(0, 800)}
          {preview.length > 800 && "\n\n… (truncated for preview)"}
        </pre>
      </details>
      <p className="text-xs text-zinc-500 pt-1">
        scored on 6 dimensions (hook · structure · clarity · pacing · CTA · SEO readiness) + 3 priority fixes.
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
      <span className="text-zinc-200 truncate">{value}</span>
    </div>
  );
}

/* ─── results ──────────────────────────────────────────────────── */

function Scorecard({ analysis, sourceUrl, onReset }) {
  return (
    <div className="space-y-5 mt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-hand text-amber-200 text-base">verdict ↓</p>
          <h2 className="text-xl font-semibold text-zinc-50">Scorecard</h2>
        </div>
        <Button as="button" type="button" variant="ghost" size="sm" onClick={onReset}>
          ↻ judge another
        </Button>
      </div>

      <div className="paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-zinc-300 font-hand text-xl">{analysis.one_line_summary}</p>
          <div className="flex items-center gap-4">
            <ScoreDial score={analysis.overall_score} />
            <span className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border ${VERDICT_COPY[analysis.verdict].color}`}>
              {VERDICT_COPY[analysis.verdict].label}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {analysis.dimensions.map((d) => (
            <div key={d.name} className="rounded-lg border border-white/10 p-4 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-zinc-100 capitalize">
                  {d.name.replace("_", " ")}
                </div>
                <ScorePill score={d.score} />
              </div>
              <p className="text-xs text-emerald-300/80"><span className="text-zinc-500">+ </span>{d.strongest}</p>
              <p className="text-xs text-rose-300/80 mt-1"><span className="text-zinc-500">− </span>{d.weakest}</p>
              <p className="text-xs text-amber-100 mt-2"><span className="font-hand text-amber-200">fix: </span>{d.fix}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-amber-200/30 bg-amber-200/[0.05] p-5">
          <p className="font-hand text-amber-200 text-base mb-2">do these three first ↓</p>
          <ol className="space-y-2 list-decimal list-inside text-zinc-100">
            {analysis.top_3_fixes.map((f, i) => <li key={i}>{f}</li>)}
          </ol>
        </div>

        {sourceUrl && (
          <p className="mt-4 text-xs text-zinc-500">
            analysed from <a className="underline decoration-amber-200/40 hover:text-amber-200" href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceUrl}</a>
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreDial({ score }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "#34d399" : score >= 6 ? "#fde68a" : score >= 4 ? "#fb923c" : "#fb7185";
  return (
    <div className="relative grid place-items-center h-16 w-16 rounded-full" style={{ background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)` }}>
      <div className="absolute inset-1.5 rounded-full bg-[#0c0c0e] grid place-items-center">
        <span className="text-xl font-semibold text-zinc-50">{score}</span>
      </div>
    </div>
  );
}

function ScorePill({ score }) {
  const color = score >= 8 ? "#34d399" : score >= 6 ? "#fde68a" : score >= 4 ? "#fb923c" : "#fb7185";
  return (
    <span className="text-xs font-mono px-2 py-0.5 rounded-md border" style={{ color, borderColor: color + "55" }}>
      {score}/10
    </span>
  );
}

/* ─── atoms ─────────────────────────────────────────────────────── */

function Q({ hand, title }) {
  return (
    <div className="mb-4">
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

function ModeTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-4 py-1.5 rounded-full text-xs transition-colors " +
        (active ? "bg-amber-200 text-zinc-950" : "text-zinc-400 hover:text-zinc-100")
      }
    >
      {children}
    </button>
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
