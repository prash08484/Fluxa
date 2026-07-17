import { Annotation } from "@langchain/langgraph";

/**
 * Shared state for the creator pipeline.
 *
 * Flow:
 *   START → trendsNode → ideasNode
 *     ⏸ pick 1–3 ideas (selectedIdeasShortlist) OR submit feedback (→ regenerate API)
 *   → analysisNode (per-idea viral analysis)
 *     ⏸ pick 1 (selectedIdeaId); others can be saved to library
 *   → scriptNode (uses scriptDirection — collected at the pause before this node)
 *     ⏸ approve OR submit feedback (→ regenerate API)
 *   → titlesNode
 *     ⏸ pick title (selectedTitleId) AND set thumbnailCount
 *   → descriptionNode → thumbnailNode → END
 *
 * Channels just use the default reducer (last-write-wins). We never need to
 * merge inside a step — each step owns its slot.
 */
export const PipelineState = Annotation.Root({
  brief: Annotation,

  trends: Annotation,

  ideas: Annotation,
  /** array of idea ids, 1–3, set by user before analysisNode runs */
  selectedIdeasShortlist: Annotation,

  ideaAnalyses: Annotation,
  /** single idea id, set by user before scriptNode runs */
  selectedIdeaId: Annotation,

  /** free-text direction from user, set before scriptNode runs */
  scriptDirection: Annotation,
  /** picked SCRIPT_FORMAT_OPTIONS value, set with scriptDirection */
  scriptFormat: Annotation,
  script: Annotation,
  scriptApproved: Annotation,

  titles: Annotation,
  /** id of the picked title option */
  selectedTitleId: Annotation,

  description: Annotation,
  /** how many thumbnail concepts to generate (1–6, default 3) */
  thumbnailCount: Annotation,
  thumbnails: Annotation,
});

export const STEPS = {
  TRENDS: "trends",
  IDEAS: "ideas",
  ANALYSIS: "analysis",
  SCRIPT: "script",
  TITLES: "titles",
  THUMBNAIL: "thumbnail",
  DONE: "done",
};
