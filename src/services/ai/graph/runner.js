/**
 * Thin orchestrator on top of the compiled LangGraph.
 *
 *   start({sessionId, brief})         → runs trendsNode + ideasNode, pauses before analysisNode
 *   advance({sessionId, input})       → updates state, resumes to next interrupt
 *   regenerate({sessionId, step, fb}) → re-runs ONE node with feedback; stays parked
 *   snapshot(sessionId)               → current values + step label
 *
 * `getGraph()` is async because the compiled graph waits on the Mongo
 * checkpointer to be ready.
 */

import { getGraph, deriveCurrentStep } from "./graph.js";
import { generateIdeas } from "../agents/idea.agent.js";
import { writeScript } from "../agents/script.agent.js";

function cfg(sessionId) {
  return { configurable: { thread_id: sessionId } };
}

export async function start({ sessionId, brief }) {
  const g = await getGraph();
  await g.invoke({ brief }, cfg(sessionId));
  return snapshot(sessionId);
}

export async function advance({ sessionId, input }) {
  const g = await getGraph();
  const state = await g.getState(cfg(sessionId));
  if ((state.next ?? []).length === 0) return snapshot(sessionId);

  if (input && Object.keys(input).length > 0) {
    await g.updateState(cfg(sessionId), input);
  }
  await g.invoke(null, cfg(sessionId));
  return snapshot(sessionId);
}

export async function regenerate({ sessionId, step, feedback }) {
  const g = await getGraph();
  const state = await g.getState(cfg(sessionId));
  const values = state.values ?? {};

  if (step === "ideas") {
    const { ideas } = await generateIdeas({
      brief: values.brief,
      selectedTrends: values.trends ?? [],
      feedback,
    });
    await g.updateState(cfg(sessionId), {
      ideas,
      selectedIdeasShortlist: undefined,
    });
  } else if (step === "script") {
    const idea = (values.ideas ?? []).find((i) => i.id === values.selectedIdeaId);
    if (!idea) throw new Error("regenerate(script): no selected idea.");
    const script = await writeScript({
      brief: values.brief,
      idea,
      format: values.scriptFormat ?? "guidance",
      direction: values.scriptDirection,
      feedback,
    });
    await g.updateState(cfg(sessionId), { script });
  } else {
    throw new Error(`regenerate: step "${step}" not supported.`);
  }

  return snapshot(sessionId);
}

export async function snapshot(sessionId) {
  const g = await getGraph();
  const state = await g.getState(cfg(sessionId));
  return {
    sessionId,
    step: deriveCurrentStep(state),
    state: state.values ?? {},
    next: state.next ?? [],
  };
}
