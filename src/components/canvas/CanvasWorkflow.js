"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";
import { Icon } from "@/components/app/Icon";
import { ScriptRegeneratePanel } from "@/components/app/ScriptRegeneratePanel";
import { IdeasRegeneratePanel } from "@/components/app/IdeasRegeneratePanel";

/**
 * Project-aware canvas. Receives a projectId and (optionally) the initial
 * snapshot. Drives the new pipeline:
 *
 *   ideas → analysis → script (with direction) → titles → description+thumb → done
 *
 * Feedback loops (regenerate with feedback) are available at IDEAS and SCRIPT.
 */

const STEP_ORDER = ["ideas", "analysis", "direction", "script", "titles", "done"];
const STEP_LABEL = {
  ideas: "Ideas",
  analysis: "Analyze",
  direction: "Direction",
  script: "Script",
  titles: "Title",
  done: "Done",
};

export function CanvasWorkflow({ projectId, initialSnapshot = null, onSnapshotChange }) {
  const [snapshot, setSnapshotState] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);
  const [error, setError] = useState(null);

  // Wrap setSnapshot so the parent (ProjectWorkspace) can react to changes —
  // e.g. show the Extensions panel only after step === "done".
  const setSnapshot = useCallback(
    (next) => {
      setSnapshotState(next);
      if (onSnapshotChange) onSnapshotChange(next);
    },
    [onSnapshotChange],
  );

  useEffect(() => {
    if (snapshot || !projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load project.");
        if (!cancelled) setSnapshot(data.snapshot);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, snapshot, setSnapshot]);

  const step = snapshot?.step ?? "ideas";
  const state = snapshot?.state ?? {};

  const advance = useCallback(async (input, nextLabel) => {
    if (!projectId) return;
    setLoading(true);
    setLoadingStep(nextLabel ?? step);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Step failed.");
      setSnapshot(data.snapshot);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }, [projectId, step]);

  const regenerate = useCallback(async (stepKey, feedback) => {
    if (!projectId) return;
    setLoading(true);
    setLoadingStep(stepKey);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepKey, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Regenerate failed.");
      setSnapshot(data.snapshot);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }, [projectId]);

  return (
    <div className="space-y-8">
      <Stepper current={step} />

      {error && (
        <div className="paper-card border-red-400/40 bg-red-400/5 text-red-300 p-4 text-sm">
          {error}
        </div>
      )}

      {/* Special case: when regenerating ideas or script, keep the existing
          content visible — the regenerate panel handles the "rewriting…" UI.
          For all other loading transitions (first-time gen, advancing to next
          step), the full-page loader takes over. */}
      {(() => {
        const regenInPlace =
          loading &&
          ((loadingStep === "ideas" && state.ideas?.length > 0) ||
            (loadingStep === "script" && state.script));
        if (loading && !regenInPlace) {
          return <AICookingLoader step={loadingStep ?? step} />;
        }
        if (!snapshot) return <AICookingLoader step="ideas" />;
        return null;
      })()}

      {(snapshot &&
        (!loading ||
          (loading && loadingStep === "ideas" && state.ideas?.length > 0) ||
          (loading && loadingStep === "script" && state.script))) && (
        <>
          {step === "ideas" && (
            <IdeasStep
              ideas={state.ideas ?? []}
              onPick={(ids) => advance({ selectedIdeasShortlist: ids }, "analysis")}
              onRegenerate={(fb) => regenerate("ideas", fb)}
              regenerating={loading && loadingStep === "ideas"}
              error={error}
            />
          )}

          {step === "analysis" && (
            <AnalysisStep
              ideas={state.ideas ?? []}
              shortlist={state.selectedIdeasShortlist ?? []}
              analyses={state.ideaAnalyses ?? []}
              brief={state.brief}
              projectId={projectId}
              onPick={(id) => advance({ selectedIdeaId: id }, "script")}
            />
          )}

          {step === "direction" && (
            <DirectionStep
              idea={(state.ideas ?? []).find((i) => i.id === state.selectedIdeaId)}
              onSubmit={({ format, direction }) => advance({ scriptFormat: format, scriptDirection: direction }, "script")}
            />
          )}

          {step === "script" && state.script && (
            <ScriptStep
              script={state.script}
              onApprove={() => advance({ scriptApproved: true }, "titles")}
              onRegenerate={(fb) => regenerate("script", fb)}
              regenerating={loading && loadingStep === "script"}
              error={error}
            />
          )}

          {step === "titles" && (
            <TitlesStep
              titles={state.titles}
              onPick={(id, count) => advance({ selectedTitleId: id, thumbnailCount: count }, "done")}
            />
          )}

          {step === "done" && <DoneView state={state} />}
        </>
      )}
    </div>
  );
}

/* ─── Stepper ─────────────────────────────────────────────────────── */

function Stepper({ current }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  const pct = currentIdx >= 0 ? Math.round((currentIdx / (STEP_ORDER.length - 1)) * 100) : 0;
  return (
    <div className="space-y-3">
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {STEP_ORDER.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={
                  "px-3 py-1 rounded-full border transition-colors " +
                  (active
                    ? "border-amber-200/60 bg-amber-200/10 text-amber-100"
                    : done
                    ? "border-white/10 bg-white/[0.03] text-zinc-500 line-through"
                    : "border-white/10 text-zinc-500")
                }
              >
                {i + 1}. {STEP_LABEL[s]}
              </span>
              {i < STEP_ORDER.length - 1 && <span className="text-zinc-700">→</span>}
            </li>
          );
        })}
      </ol>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-amber-200 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Ideas (pick 1–3 + regenerate) ──────────────────────────────── */

function IdeasStep({ ideas, onPick, onRegenerate, regenerating, error }) {
  const [picked, setPicked] = useState([]);

  const toggle = (id) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id],
    );

  function handleRegenerate(feedback) {
    setPicked([]);
    onRegenerate(feedback);
  }

  return (
    <Section hand="10 ideas — pick 1–3 to analyse" title="Video ideas">
      <div className="grid md:grid-cols-2 gap-4">
        {ideas.map((i) => {
          const isOn = picked.includes(i.id);
          const num = picked.indexOf(i.id) + 1;
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => toggle(i.id)}
              disabled={regenerating}
              className={
                "relative paper-card p-5 text-left transition-all " +
                (isOn ? "border-amber-200/60 bg-amber-200/[0.06]" : "") +
                (regenerating ? " opacity-60" : "")
              }
            >
              {isOn && (
                <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-amber-200 text-zinc-950 text-xs font-bold">
                  {num}
                </span>
              )}
              <div className="flex items-center justify-between mb-2 pr-8">
                <span className="text-xs font-mono text-zinc-500">{i.id.toUpperCase()}</span>
                <AppealPill appeal={i.estimated_appeal} />
              </div>
              <div className="font-medium text-zinc-50 mb-2">{i.title}</div>
              <p className="text-sm text-zinc-300">{i.angle}</p>
              <p className="mt-2 text-xs text-zinc-500 italic">{i.why_it_works}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={() => onPick(picked)}
          disabled={picked.length === 0 || regenerating}
        >
          Analyse {picked.length || "—"} idea{picked.length === 1 ? "" : "s"} →
        </Button>
      </div>

      <IdeasRegeneratePanel
        onSubmit={handleRegenerate}
        submitting={regenerating}
        error={error}
      />
    </Section>
  );
}

/* ─── Analysis (per-idea viral score + similar examples) ─────────── */

function AnalysisStep({ ideas, shortlist, analyses, brief, projectId, onPick }) {
  const shortlistIdeas = useMemo(
    () => ideas.filter((i) => shortlist.includes(i.id)),
    [ideas, shortlist],
  );
  const analysisFor = (id) => analyses.find((a) => a.idea_id === id);

  return (
    <Section hand="viral potential + format matches" title="Pick the one to take forward">
      <div className="space-y-4">
        {shortlistIdeas.map((idea) => {
          const a = analysisFor(idea.id);
          return (
            <AnalysisCard
              key={idea.id}
              idea={idea}
              analysis={a}
              brief={brief}
              projectId={projectId}
              onPick={() => onPick(idea.id)}
            />
          );
        })}
      </div>
    </Section>
  );
}

function AnalysisCard({ idea, analysis, brief, projectId, onPick }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "idea",
          sourceProjectId: projectId,
          payload: { idea, briefContext: brief },
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="paper-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-xs font-mono text-zinc-500 mb-1">{idea.id.toUpperCase()}</div>
          <h3 className="font-medium text-zinc-50">{idea.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{idea.angle}</p>
        </div>
        {analysis ? <ViralDial score={analysis.viral_score} /> : <span className="text-xs text-zinc-500">analyzing…</span>}
      </div>

      {analysis && (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Cell label="why it could go viral">{analysis.reasoning}</Cell>
            <Cell label="audience fit">{analysis.audience_fit}</Cell>
            <Cell label="risk" tone="risk">{analysis.risk}</Cell>
            <Cell label="format matches">
              <ul className="space-y-1.5 text-zinc-300">
                {analysis.similar_examples.map((ex, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-zinc-400">{ex.channel} — </span>
                    <span className="text-zinc-100">{ex.title}</span>
                    <span className="text-zinc-500"> · {ex.why_it_worked}</span>
                  </li>
                ))}
              </ul>
            </Cell>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={save}
              disabled={saved || saving}
              className="text-sm text-zinc-400 hover:text-amber-200 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Icon name="bookmark" size={14} />
              {saved ? "saved to library" : saving ? "saving…" : "save for later"}
            </button>
            <Button as="button" type="button" variant="accent" size="md" onClick={onPick}>
              Use this one — write the script →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Cell({ label, tone, children }) {
  return (
    <div className={"rounded-lg border p-3 " + (tone === "risk" ? "border-rose-400/20 bg-rose-400/[0.04]" : "border-white/10 bg-white/[0.02]")}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </div>
      {typeof children === "string" ? (
        <p className="text-sm text-zinc-200">{children}</p>
      ) : children}
    </div>
  );
}

function ViralDial({ score }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "#34d399" : score >= 6 ? "#fde68a" : score >= 4 ? "#fb923c" : "#fb7185";
  return (
    <div className="relative grid place-items-center h-14 w-14 rounded-full shrink-0" style={{ background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)` }}>
      <div className="absolute inset-1.5 rounded-full bg-[#0c0c0e] grid place-items-center">
        <span className="text-lg font-semibold text-zinc-50">{score}</span>
      </div>
    </div>
  );
}

/* ─── Direction (format picker + free-text, both required) ───────── */

const FORMAT_OPTIONS = [
  { value: "guidance", label: "Guidance", blurb: "Explain a topic, leave the viewer smarter." },
  { value: "day_in_life", label: "Day in the life", blurb: "First-person walkthrough, mundane → reveal." },
  { value: "tutorial", label: "Tutorial", blurb: "Step-by-step how-to. Action-first sentences." },
  { value: "story", label: "Story", blurb: "Personal narrative arc with stakes + payoff." },
  { value: "reaction", label: "Reaction", blurb: "React + commentary on a clip / claim / news." },
  { value: "listicle", label: "Listicle", blurb: "Ranked countdown, top N pattern." },
];

function DirectionStep({ idea, onSubmit }) {
  const [format, setFormat] = useState(null);
  const [direction, setDirection] = useState("");

  // Only format is required. Direction is optional — pick a format and hit
  // submit goes straight to script gen with the format's defaults.
  const canSubmit = !!format;

  return (
    <Section hand="what kind of video is this?" title="Pick a format">
      {idea && (
        <div className="paper-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
            writing for
          </div>
          <p className="text-sm text-zinc-100">{idea.title}</p>
          <p className="text-xs text-zinc-400 mt-1">{idea.angle}</p>
        </div>
      )}

      <div className="space-y-3">
        <p className="font-hand text-amber-200 text-sm">format ↓</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FORMAT_OPTIONS.map((opt) => {
            const selected = format === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormat(opt.value)}
                className={
                  "paper-card p-4 text-left transition-colors " +
                  (selected
                    ? "border-amber-200/60 bg-amber-200/[0.06]"
                    : "")
                }
              >
                <div className="font-medium text-zinc-50">{opt.label}</div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{opt.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="paper-card p-5">
        <label className="block">
          <span className="font-hand text-amber-200 text-sm block mb-1">
            anything specific to add? <span className="text-zinc-500 font-normal">(optional)</span>
          </span>
          <textarea
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="e.g. open with the JOSSAA round 3 stat, include my own counselling timeline, keep under 4 min, end with a hard question…"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-32"
          />
          <p className="mt-1 text-xs text-zinc-500">
            skip this and we'll use the format's defaults. you can always rewrite with feedback later.
          </p>
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={() => onSubmit({ format, direction: direction.trim() })}
          disabled={!canSubmit}
        >
          {direction.trim() ? "Write the script →" : "Write with format defaults →"}
        </Button>
      </div>
    </Section>
  );
}

/* ─── Script (review + approve OR feedback regenerate) ───────────── */

function ScriptStep({ script, onApprove, onRegenerate, regenerating, error }) {
  const wordCount = scriptWordCount(script);
  return (
    <Section hand="ready to film?" title={script.title}>
      <p className="text-xs text-zinc-500 -mt-3">
        {script.beats.length} beats · ~{wordCount} words · ~{Math.round(script.est_runtime_seconds / 60)} min
      </p>

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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
        <Button as="button" type="button" variant="accent" size="md" onClick={onApprove} disabled={regenerating}>
          Looks good — pick a title →
        </Button>
      </div>

      <ScriptRegeneratePanel
        onSubmit={onRegenerate}
        submitting={regenerating}
        error={error}
      />
    </Section>
  );
}

function scriptWordCount(script) {
  const text = [
    script.hook,
    ...script.beats.map((b) => b.body),
    script.cta,
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/* ─── Titles (multi-option, best highlighted, + thumb count) ─────── */

function TitlesStep({ titles, onPick }) {
  const options = titles?.options ?? [];
  const bestIdx = titles?.best_index ?? 0;
  const [selectedId, setSelectedId] = useState(options[bestIdx]?.id ?? options[0]?.id ?? null);
  const [thumbCount, setThumbCount] = useState(3);

  return (
    <Section hand="title decides who clicks" title="Pick a title">
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isBest = i === bestIdx;
          const isSelected = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedId(opt.id)}
              className={
                "relative w-full paper-card text-left p-4 transition-all " +
                (isSelected ? "border-amber-200/60 bg-amber-200/[0.06]" : "")
              }
            >
              {isBest && (
                <span className="absolute -top-2 right-3 sticky-note px-2 py-0.5 text-[10px] font-hand rounded -rotate-2">
                  AI pick ✨
                </span>
              )}
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="font-medium text-zinc-50">{opt.text}</p>
                <FlavourPill flavour={opt.flavour} />
              </div>
              <p className="text-xs text-zinc-500">{opt.reason}</p>
            </button>
          );
        })}
      </div>

      <div className="paper-card p-5 mt-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <p className="font-hand text-amber-200 text-sm">how many thumbnail concepts?</p>
            <p className="text-xs text-zinc-500">pick the best one when they're ready</p>
          </div>
          <span className="font-mono text-zinc-300">{thumbCount}</span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          value={thumbCount}
          onChange={(e) => setThumbCount(Number(e.target.value))}
          className="w-full accent-amber-200"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
          {[1, 2, 3, 4, 5, 6].map((n) => <span key={n}>{n}</span>)}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => onPick(selectedId, 0)}
          disabled={!selectedId}
          className="text-sm text-zinc-400 hover:text-amber-200 transition-colors font-hand disabled:opacity-40"
        >
          skip thumbnails — i'll make my own
        </button>
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={() => onPick(selectedId, thumbCount)}
          disabled={!selectedId}
        >
          Use this title + generate {thumbCount} thumb{thumbCount === 1 ? "" : "s"} →
        </Button>
      </div>
    </Section>
  );
}

/* ─── Done view (final review with copy actions) ─────────────────── */

function DoneView({ state }) {
  const title = (state.titles?.options ?? []).find((t) => t.id === state.selectedTitleId);
  const fullDescription = state.description?.body
    ? stitchSig(state.description.body, state.brief?.signature)
    : "";

  return (
    <div className="space-y-8">
      <div className="paper-card p-6 border-amber-200/30 bg-amber-200/[0.04]">
        <p className="font-hand text-amber-200 text-xl">canvas complete ✨</p>
        <p className="mt-1 text-sm text-zinc-300">
          Everything below is yours. Copy-paste into your upload form.
        </p>
      </div>

      <Section hand="the final title" title="Title">
        <Copyable text={title?.text ?? "—"} />
      </Section>

      <Section hand="hook + beats + CTA" title="Script">
        <div className="paper-card p-6 space-y-3">
          <div>
            <div className="text-xs font-mono text-zinc-500 mb-1">HOOK</div>
            <p className="font-hand text-xl text-amber-200">{state.script?.hook}</p>
          </div>
          <ol className="space-y-3 mt-4">
            {(state.script?.beats ?? []).map((b, i) => (
              <li key={i} className="border-l-2 border-white/10 pl-4">
                <div className="flex items-center gap-3 mb-1 text-xs">
                  <span className="font-mono text-zinc-500">{b.t}</span>
                  <span className="font-hand text-stone-300">{b.label}</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{b.body}</p>
              </li>
            ))}
          </ol>
          <div className="pt-3 border-t border-white/10">
            <div className="text-xs font-mono text-zinc-500 mb-1">CTA</div>
            <p className="text-zinc-200">{state.script?.cta}</p>
          </div>
        </div>
      </Section>

      <Section hand="description + tags + chapters" title="Description">
        <Copyable text={fullDescription} multiline />
        <div className="paper-card p-5 mt-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">tags</div>
          <div className="flex flex-wrap gap-2">
            {(state.description?.tags ?? []).map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300">
                #{t}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 mt-5">chapters</div>
          <ul className="space-y-1 text-zinc-300 font-mono text-sm">
            {(state.description?.chapters ?? []).map((c, i) => (
              <li key={i}>{c.t}  {c.label}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section hand="pick the best one" title="Thumbnails">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(state.thumbnails ?? []).map((t) => (
            <ThumbnailCard key={t.id} thumb={t} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function ThumbnailCard({ thumb }) {
  return (
    <div className="paper-card overflow-hidden">
      {thumb.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb.imageUrl}
          alt={thumb.concept}
          className="w-full aspect-video object-cover border-b border-white/5"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-video grid place-items-center border-b border-white/5 bg-white/[0.02] text-zinc-500 text-xs font-hand">
          (image not generated — concept only)
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

function Copyable({ text, multiline = false }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* clipboard may be blocked */}
  }
  return (
    <div className="paper-card p-5 relative">
      <button
        type="button"
        onClick={copy}
        className="absolute top-3 right-3 text-xs font-hand text-amber-200 hover:text-amber-100"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
      {multiline ? (
        <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-200 pr-12">{text}</pre>
      ) : (
        <p className="text-zinc-100 pr-12">{text}</p>
      )}
    </div>
  );
}

function stitchSig(body, signature) {
  if (!signature || !signature.trim()) return body;
  return `${body}\n\n— — —\n${signature.trim()}`;
}

/* ─── shared bits ────────────────────────────────────────────────── */

function Section({ hand, title, children }) {
  return (
    <section className="space-y-4">
      <div>
        {hand && <p className="font-hand text-amber-200 text-base">{hand}</p>}
        <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AppealPill({ appeal }) {
  const map = {
    viral: "bg-amber-200/15 text-amber-100 border-amber-200/30",
    broad: "bg-stone-300/15 text-stone-200 border-stone-300/30",
    niche: "bg-white/5 text-zinc-400 border-white/10",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[appeal] ?? map.broad}`}>
      {appeal}
    </span>
  );
}

function FlavourPill({ flavour }) {
  const map = {
    literal: "bg-white/5 text-zinc-400 border-white/10",
    curiosity: "bg-amber-200/15 text-amber-100 border-amber-200/30",
    outcome: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
    polarising: "bg-rose-400/15 text-rose-200 border-rose-400/30",
  };
  return (
    <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[flavour] ?? map.literal}`}>
      {flavour}
    </span>
  );
}
