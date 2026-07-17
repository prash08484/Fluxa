/**
 * Graph nodes — thin glue between LangGraph state and the agent functions.
 * Each node:
 *   1. Pulls what it needs from state.
 *   2. Calls one agent (one model call, one tier).
 *   3. Returns a partial state update.
 */

import { findTrends } from "../agents/trend.agent.js";
import { generateIdeas } from "../agents/idea.agent.js";
import { analyzeIdeas } from "../agents/ideaAnalysis.agent.js";
import { writeScript } from "../agents/script.agent.js";
import { generateTitles } from "../agents/titles.agent.js";
import { generateDescription } from "../agents/description.agent.js";
import { generateThumbnails } from "../agents/thumbnail.agent.js";

export async function trendsNode(state) {
  const { trends } = await findTrends({ brief: state.brief });
  return { trends };
}

export async function ideasNode(state) {
  const trends = state.trends ?? [];
  if (trends.length === 0) {
    throw new Error("ideasNode: no trends in state — pipeline misordered.");
  }
  const { ideas } = await generateIdeas({
    brief: state.brief,
    selectedTrends: trends,
  });
  return { ideas };
}

/**
 * No-op pause anchor between analysisNode and scriptNode. Exists only so
 * LangGraph can `interruptBefore` it — gives the user a dedicated screen to
 * pick their final idea (after analysis) and then a separate screen to
 * provide script direction (before scriptNode runs).
 */
export async function directionGateNode() {
  return {};
}

export async function analysisNode(state) {
  const shortlist = state.selectedIdeasShortlist ?? [];
  if (shortlist.length === 0) {
    throw new Error("analysisNode: no shortlist — user must pick 1–3 ideas first.");
  }
  const picked = (state.ideas ?? []).filter((i) => shortlist.includes(i.id));
  if (picked.length === 0) {
    throw new Error("analysisNode: shortlist ids don't match any current ideas.");
  }
  const { analyses } = await analyzeIdeas({
    brief: state.brief,
    ideas: picked,
  });
  return { ideaAnalyses: analyses };
}

export async function scriptNode(state) {
  const idea = (state.ideas ?? []).find((i) => i.id === state.selectedIdeaId);
  if (!idea) {
    throw new Error("scriptNode: no final idea selected.");
  }
  const script = await writeScript({
    brief: state.brief,
    idea,
    format: state.scriptFormat ?? "guidance",
    direction: state.scriptDirection,
  });
  return { script };
}

export async function titlesNode(state) {
  if (!state.script) {
    throw new Error("titlesNode: script must exist before generating titles.");
  }
  const titles = await generateTitles({ brief: state.brief, script: state.script });
  return { titles };
}

export async function descriptionNode(state) {
  const title = (state.titles?.options ?? []).find((t) => t.id === state.selectedTitleId);
  if (!title) {
    throw new Error("descriptionNode: no title selected.");
  }
  const description = await generateDescription({
    brief: state.brief,
    title: title.text,
    script: state.script,
  });
  return { description };
}

export async function thumbnailNode(state) {
  // User opted to skip thumbnails entirely (count === 0 sent from the Titles
  // step's "skip thumbnails" button). Short-circuit — no image gen tokens
  // burned, downstream done-view handles the empty array gracefully.
  if (state.thumbnailCount === 0) {
    return { thumbnails: [] };
  }
  const idea = (state.ideas ?? []).find((i) => i.id === state.selectedIdeaId);
  const hook = state.script?.hook ?? "";
  const count = state.thumbnailCount ?? 3;
  const { thumbnails } = await generateThumbnails({ idea, hook, count });
  return { thumbnails };
}
