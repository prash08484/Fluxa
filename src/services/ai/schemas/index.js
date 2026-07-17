import { z } from "zod";

/* ─── Brief ─────────────────────────────────────────────────────────── */

export const briefSchema = z.object({
  niche: z.string().min(2),
  /** Free-form: what is the creator thinking, what's the angle they have in mind. */
  thinking: z.string().optional(),
  audience: z.string().default("general"),
  tone: z.string().default("authentic, conversational"),
  platform: z.enum(["youtube", "youtube_shorts", "tiktok", "instagram"]).default("youtube"),
  videoLength: z.enum(["short", "medium", "long"]).default("medium"),
  /** Boilerplate the creator appends to every video description (socials, sponsor disclaimer, etc.). */
  signature: z.string().max(2000).optional(),
});

/* ─── Trends (internal, not user-visible in the new flow) ─────────── */

export const trendSchema = z.object({
  id: z.string(),
  title: z.string(),
  why_now: z.string(),
  signal_strength: z.enum(["low", "medium", "high"]),
  example_creators: z.array(z.string()).default([]),
});

export const trendsOutSchema = z.object({
  trends: z.array(trendSchema).min(3).max(8),
});

/* ─── Ideas (up to 12 now, 1-3 picked) ────────────────────────────── */

export const ideaSchema = z.object({
  id: z.string(),
  title: z.string(),
  angle: z.string(),
  why_it_works: z.string(),
  estimated_appeal: z.enum(["niche", "broad", "viral"]),
});

export const ideasOutSchema = z.object({
  ideas: z.array(ideaSchema).min(6).max(12),
});

/* ─── Idea analysis (NEW) ─────────────────────────────────────────── */

export const similarExampleSchema = z.object({
  channel: z.string(),
  title: z.string(),
  why_it_worked: z.string(),
});

export const ideaAnalysisSchema = z.object({
  idea_id: z.string(),
  viral_score: z.number().int().min(1).max(10),
  reasoning: z.string(),
  audience_fit: z.string(),
  risk: z.string(),
  similar_examples: z.array(similarExampleSchema).min(1).max(3),
});

export const ideaAnalysisOutSchema = z.object({
  analyses: z.array(ideaAnalysisSchema).min(1).max(3),
});

/* ─── Hooks (standalone helper for /create/script) ────────────────── */

export const hookSchema = z.object({
  id: z.string(),
  text: z.string().min(4),
  pattern: z.string(),
  risk: z.enum(["safe", "spicy", "polarising"]),
});

export const hooksOutSchema = z.object({
  hooks: z.array(hookSchema).min(3).max(6),
});

/* ─── Angle suggestion (standalone helper) ─────────────────────────── */

export const angleOutSchema = z.object({
  angle: z.string().min(10).max(400),
  why_it_works: z.string().min(10).max(200),
});

/* ─── Script (hook now embedded, accepts direction + feedback) ────── */

/** Format = the SHAPE of the video. Picked by the user before script gen. */
export const scriptFormatSchema = z.enum([
  "guidance",
  "day_in_life",
  "tutorial",
  "story",
  "reaction",
  "listicle",
]);

/** Human-friendly labels + one-line descriptions for the UI picker. */
export const SCRIPT_FORMAT_OPTIONS = [
  { value: "guidance", label: "Guidance", blurb: "Explain a topic, leave the viewer smarter." },
  { value: "day_in_life", label: "Day in the life", blurb: "First-person walkthrough, mundane → reveal." },
  { value: "tutorial", label: "Tutorial", blurb: "Step-by-step how-to. Action-first sentences." },
  { value: "story", label: "Story", blurb: "Personal narrative arc with stakes + payoff." },
  { value: "reaction", label: "Reaction", blurb: "React + commentary on a clip / claim / news." },
  { value: "listicle", label: "Listicle", blurb: "Ranked countdown, top N pattern." },
];

export const scriptBeatSchema = z.object({
  t: z.string(),
  label: z.string(),
  /** The LITERAL spoken script for this beat. Minimum 40 chars stops the
   *  model from returning bullet-summary one-liners. */
  body: z.string().min(40),
  // OpenAI strict structured-output mode requires every property to appear in
  // `required` — `.optional()` is rejected. Use `.nullable()` so the field is
  // always present, but may be null when the beat has no b-roll suggestion.
  bRoll: z.string().nullable(),
});

export const scriptOutSchema = z.object({
  title: z.string(),
  hook: z.string(),
  /** Minimum 5 forces the model past 4-beat thin scripts. Medium/long videos
   *  should hit 7+ — that's enforced via the prompt + length targets, not the
   *  schema (schema can't measure runtime). */
  beats: z.array(scriptBeatSchema).min(5),
  cta: z.string(),
  est_runtime_seconds: z.number().int().positive(),
});

/* ─── Titles (separate from description, multi-option) ────────────── */

export const titleOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(4).max(80),
  flavour: z.enum(["literal", "curiosity", "outcome", "polarising"]),
  reason: z.string(),
});

export const titlesOutSchema = z.object({
  options: z.array(titleOptionSchema).min(3).max(6),
  /** Index into `options` that the agent recommends. */
  best_index: z.number().int().min(0),
});

/* ─── Description (separate, with signature appended client-side) ── */

export const descriptionOutSchema = z.object({
  body: z.string().min(40),
  tags: z.array(z.string()).min(5).max(20),
  chapters: z.array(z.object({ t: z.string(), label: z.string() })).min(3).max(10),
});

/* ─── Thumbnails (already had, now configurable count) ─────────────── */

export const thumbnailSchema = z.object({
  id: z.string(),
  concept: z.string(),
  composition: z.string(),
  overlay_text: z.string(),
  expression_or_emotion: z.string(),
  /** Cloudinary URL of the generated image. Null when image gen failed or
   *  was skipped (no OPENAI_API_KEY / no Cloudinary). */
  imageUrl: z.string().nullable().default(null),
});

export const thumbnailsOutSchema = z.object({
  thumbnails: z.array(thumbnailSchema).min(1).max(6),
});

/* ─── Judge & Analyze (the standalone tool, unchanged) ────────────── */

export const analyzeDimensionSchema = z.object({
  name: z.enum(["hook", "structure", "clarity", "pacing", "cta", "seo_readiness"]),
  score: z.number().int().min(1).max(10),
  strongest: z.string(),
  weakest: z.string(),
  fix: z.string(),
});

export const analyzeOutSchema = z.object({
  overall_score: z.number().int().min(1).max(10),
  verdict: z.enum(["publish", "publish_after_fixes", "rework"]),
  dimensions: z.array(analyzeDimensionSchema).length(6),
  top_3_fixes: z.array(z.string()).length(3),
  one_line_summary: z.string(),
});

export const analyzeInputSchema = z.object({
  input: z.string().min(40, "Give us at least a couple of sentences to analyze."),
  platform: z.enum(["youtube", "youtube_shorts", "tiktok", "instagram"]).default("youtube"),
  niche: z.string().optional(),
  /** Optional: original YouTube URL the transcript came from (display only). */
  sourceUrl: z.string().optional(),
});

export const youtubeUrlSchema = z.object({
  url: z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i,
      "Must be a YouTube URL.",
    ),
});

/* ─── Project create/patch ────────────────────────────────────────── */

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  coverImageUrl: z.url().optional(),
  brief: briefSchema.optional(),
});

export const projectPatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(400).optional().nullable(),
  coverImageUrl: z.url().optional().nullable(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
});

/* ─── Cross-platform extensions ───────────────────────────────────── */

/** A LinkedIn post adapted from a project's existing script. */
export const linkedinPostOutSchema = z.object({
  /** First-line hook — the "see more" cliffhanger. LinkedIn truncates around
   *  150 chars, so this MUST work on its own. */
  hook_line: z.string().min(20).max(220),
  body: z.string().min(200).max(2500),
  call_to_action: z.string().min(8).max(280),
  hashtags: z.array(z.string()).min(3).max(8),
});

/** Post styles a user can pick on the LinkedIn extension panel.
 *  These shape the prompt heavily — a "hiring" post is structurally
 *  different from a "story" post. */
export const linkedinPostTypeSchema = z.enum([
  "story",
  "educational",
  "experience",
  "hiring",
  "project_showcase",
  "announcement",
]);

export const LINKEDIN_POST_TYPES = [
  { value: "story",            label: "Story",            blurb: "Personal narrative with a turn + a lesson." },
  { value: "educational",      label: "Educational",      blurb: "Teach a concrete idea, viewer leaves smarter." },
  { value: "experience",       label: "Experience",       blurb: "What you learned doing the work this week." },
  { value: "hiring",           label: "Hiring",           blurb: "Open role — what you need, what you'll provide." },
  { value: "project_showcase", label: "Project showcase", blurb: "Built something — show + tell + what's next." },
  { value: "announcement",     label: "Announcement",     blurb: "Launch / milestone / event with a clear ask." },
];

/** Stored on project.extensions.linkedin after generation. */
export const linkedinPostStoredSchema = linkedinPostOutSchema.extend({
  postType: linkedinPostTypeSchema,
  generatedAt: z.string(),
  feedback: z.string().nullable().optional(),
  /** Optional generated image URL (1200x627). Null when the user didn't
   *  click "generate image" — image gen is opt-in to save tokens. */
  imageUrl: z.string().nullable().optional(),
});

export const extensionRegenerateSchema = z.object({
  feedback: z.string().min(3).max(800),
});

export const linkedinGenerateSchema = z.object({
  postType: linkedinPostTypeSchema,
  feedback: z.string().min(3).max(800).optional(),
});

/* ─── Library (saved items) ───────────────────────────────────────── */

export const libraryItemTypeSchema = z.enum(["idea"]);

/** payload shape varies by type. For "idea": { idea, briefContext } */
export const libraryCreateSchema = z.object({
  type: libraryItemTypeSchema,
  sourceProjectId: z.string().optional(),
  payload: z.object({
    idea: ideaSchema,
    briefContext: briefSchema.optional(),
  }),
  note: z.string().max(280).optional(),
});

/* ─── Canvas step inputs (richer than before) ─────────────────────── */

export const canvasStepInputSchema = z.union([
  z.object({ selectedIdeasShortlist: z.array(z.string()).min(1).max(3) }),
  z.object({ selectedIdeaId: z.string() }),
  // Direction step: format is required, direction is optional. Empty
  // direction string is fine — the script agent uses the format scaffold.
  z.object({
    scriptDirection: z.string().max(800).optional(),
    scriptFormat: scriptFormatSchema,
  }),
  z.object({ scriptApproved: z.literal(true) }),
  // thumbnailCount === 0 means "skip thumbnails" from the Titles step.
  z.object({
    selectedTitleId: z.string(),
    thumbnailCount: z.number().int().min(0).max(6).default(3),
  }),
]);

export const canvasRegenerateSchema = z.object({
  step: z.enum(["ideas", "script"]),
  feedback: z.string().min(3).max(800),
});
