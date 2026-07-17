"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AICookingLoader } from "@/components/app/AICookingLoader";
import { LINKEDIN_POST_TYPES } from "@/services/ai/schemas";

/**
 * LinkedIn extension panel.
 *
 * Flow:
 *   1. Load any existing post via GET (hydration).
 *   2. If none exists → show post-type picker → generate.
 *   3. Once a post exists → preview + Rewrite panel + optional image gen.
 *
 * Image generation is OPT-IN — a separate "✨ generate image" button below
 * the post (saves token cost when user only needs text).
 */
export function LinkedinExtension({ projectId, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [pickedType, setPickedType] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Hydrate any existing post.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/extensions/linkedin`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load.");
        if (!cancelled) {
          setPost(data.post);
          if (data.post?.postType) setPickedType(data.post.postType);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  async function generate({ feedback: fb, postType: pt } = {}) {
    setGenerating(true);
    setError(null);
    try {
      const body = {};
      if (fb) body.feedback = fb;
      if (pt) body.postType = pt;
      else if (pickedType && !fb) body.postType = pickedType;
      const res = await fetch(`/api/projects/${projectId}/extensions/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setPost(data.post);
      setFeedback("");
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function generateImage() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/extensions/linkedin/image`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Image gen failed.");
      setPost(data.post);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="space-y-4 mt-10 paper-card p-6 sm:p-8 border-amber-200/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-hand text-amber-200 text-base">extension</p>
          <h2 className="text-xl font-semibold text-zinc-50">LinkedIn post</h2>
          <p className="mt-1 text-xs text-zinc-500">
            adapted from this project's script · saved to the project · regeneratable
          </p>
        </div>
        <Button as="button" type="button" variant="ghost" size="sm" onClick={onClose}>
          close
        </Button>
      </div>

      {loading && <AICookingLoader messages={["loading…"]} interval={1000} />}

      {/* Step 1: no post yet — pick type + generate */}
      {!loading && !post && (
        <PostTypePicker
          picked={pickedType}
          onPick={setPickedType}
          onGenerate={() => generate({ postType: pickedType })}
          generating={generating}
        />
      )}

      {generating && post && (
        <AICookingLoader messages={["rewriting your post…", "applying your feedback…"]} />
      )}

      {/* Step 2: post exists — preview + opt-in image + rewrite */}
      {post && !generating && (
        <>
          <PostPreview post={post} />
          <ImagePanel
            post={post}
            onGenerate={generateImage}
            disabled={generating}
          />
          <RewritePanel
            currentType={post.postType}
            value={feedback}
            onChange={setFeedback}
            onSubmit={(type) =>
              generate({ feedback, postType: type !== post.postType ? type : undefined })
            }
            disabled={generating}
          />
        </>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
    </section>
  );
}

/* ─── Post type picker (first-gen) ──────────────────────────────── */

function PostTypePicker({ picked, onPick, onGenerate, generating }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-hand text-amber-200 text-sm">what kind of LinkedIn post?</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          pick the shape — each one is structurally different.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {LINKEDIN_POST_TYPES.map((opt) => {
          const selected = picked === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              className={
                "rounded-lg border p-3 text-left transition-colors " +
                (selected
                  ? "border-amber-200/60 bg-amber-200/10 text-zinc-50"
                  : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.04]")
              }
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{opt.blurb}</p>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-zinc-500">
          adapts from this project's script — finish the script step on the canvas above first.
        </p>
        <Button
          as="button"
          type="button"
          variant="accent"
          size="md"
          onClick={onGenerate}
          disabled={!picked || generating}
        >
          {generating ? "writing…" : "Write the post →"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Post preview ──────────────────────────────────────────────── */

function PostPreview({ post }) {
  const fullText = [
    post.hook_line,
    "",
    post.body,
    "",
    post.call_to_action,
    "",
    post.hashtags.map((h) => `#${h}`).join(" "),
  ].join("\n");
  return (
    <div className="space-y-3">
      <div className="paper-card p-5 bg-white/[0.02]">
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="w-full rounded-md border border-white/10 mb-4"
            style={{ aspectRatio: "1200 / 627", objectFit: "cover" }}
            loading="lazy"
          />
        )}
        <p className="text-zinc-100 font-medium mb-3 whitespace-pre-line">{post.hook_line}</p>
        <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{post.body}</p>
        <p className="mt-3 text-zinc-100 whitespace-pre-line">{post.call_to_action}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.hashtags.map((h) => (
            <span key={h} className="text-xs px-2 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400">
              #{h}
            </span>
          ))}
        </div>
      </div>
      <CopyRow text={fullText} postType={post.postType} />
    </div>
  );
}

function CopyRow({ text, postType }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* clipboard may be blocked */}
  }
  return (
    <div className="flex items-center justify-end gap-4 text-xs">
      <span className="text-zinc-500">
        {postType} · {text.length} chars
      </span>
      <button
        type="button"
        onClick={copy}
        className="font-hand text-amber-200 hover:text-amber-100"
      >
        {copied ? "copied ✓" : "copy full post"}
      </button>
    </div>
  );
}

/* ─── Opt-in image generation ───────────────────────────────────── */

function ImagePanel({ post, onGenerate, disabled }) {
  const hasImage = !!post.imageUrl;
  return (
    <div className="paper-card p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-hand text-amber-200 text-sm">
          {hasImage ? "image attached ↑" : "want an image?"}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {hasImage
            ? "stored at 1200×627 (LinkedIn share spec). regenerate to swap."
            : "optional — 1200×627 generated by gpt-image-1, ~$0.04 in tokens."}
        </p>
      </div>
      <Button
        as="button"
        type="button"
        variant={hasImage ? "ghost" : "accent"}
        size="sm"
        onClick={onGenerate}
        disabled={disabled}
      >
        {hasImage ? "↻ regenerate image" : "✨ generate image"}
      </Button>
    </div>
  );
}

/* ─── Rewrite panel ─────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: "Shorter",            text: "Cut it down — tighter paragraphs, drop anything not load-bearing." },
  { label: "Longer / more depth", text: "Expand the body — add another example, a concrete number, and tighten the takeaway." },
  { label: "More personal",      text: "Lean into first-person specifics. Use a real moment from the script." },
  { label: "Less salesy",        text: "Tone down anything that reads as a pitch. Make the CTA a genuine question." },
  { label: "More polarising",    text: "Take a stronger position — the post is hedging. Pick a side." },
];

function RewritePanel({ currentType, value, onChange, onSubmit, disabled }) {
  const [switchType, setSwitchType] = useState(null);
  return (
    <div className="paper-card p-5 space-y-3">
      <p className="font-hand text-amber-200 text-sm">↻ rewrite this post</p>

      <details className="text-xs">
        <summary className="text-zinc-400 hover:text-amber-200 cursor-pointer">
          change post type · currently <span className="text-zinc-100">{currentType}</span>
        </summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LINKEDIN_POST_TYPES.filter((t) => t.value !== currentType).map((t) => {
            const selected = switchType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setSwitchType(selected ? null : t.value)}
                className={
                  "px-3 py-1.5 rounded-full text-xs border transition-colors " +
                  (selected
                    ? "border-amber-200/60 bg-amber-200/10 text-amber-100"
                    : "border-white/10 text-zinc-300 hover:bg-white/[0.04]")
                }
              >
                → {t.label}
              </button>
            );
          })}
        </div>
      </details>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() =>
              onChange(value.trim() ? `${value.trim()}\n\n${a.text}` : a.text)
            }
            disabled={disabled}
            className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-zinc-300 hover:border-amber-200/40 hover:bg-amber-200/[0.06] hover:text-amber-100 transition-colors disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="anything else to change in the rewrite — quick actions above add to this textarea"
        disabled={disabled}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-200/50 min-h-24 disabled:opacity-50"
      />
      <div className="flex justify-end">
        <Button
          as="button"
          type="button"
          variant="accent"
          size="sm"
          onClick={() => onSubmit(switchType ?? currentType)}
          disabled={disabled || (value.trim().length < 3 && !switchType)}
        >
          {switchType ? `Rewrite as ${switchType} →` : "Rewrite →"}
        </Button>
      </div>
    </div>
  );
}
