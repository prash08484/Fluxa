import { StateGraph, START, END } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { getClient } from "../../db/mongo.js";
import { PipelineState } from "./state.js";
import {
  trendsNode,
  ideasNode,
  analysisNode,
  directionGateNode,
  scriptNode,
  titlesNode,
  descriptionNode,
  thumbnailNode,
} from "./nodes.js";

/**
 * Pipeline:
 *
 *   START → trendsNode → ideasNode
 *         ⏸ analysisNode      (user picks 1–3 ideas)
 *         → analysisNode
 *         ⏸ directionGateNode (user picks final idea, saves others)
 *         → directionGateNode (no-op)
 *         ⏸ scriptNode        (user provides direction)
 *         → scriptNode
 *         ⏸ titlesNode        (user approves script or regenerates)
 *         → titlesNode
 *         ⏸ descriptionNode   (user picks title + thumb count)
 *         → descriptionNode → thumbnailNode → END
 *
 * 5 interrupts = 5 user-facing screens. Each interrupt name describes the
 * NEXT node, but the UI step label (see NODE_TO_STEP below) describes the
 * screen the user is currently on. They never match — that's the whole
 * reason directionGateNode exists.
 *
 * For feedback loops (ideas, script): see runner.regenerate — it re-runs
 * the named node directly without graph routing, leaving the pause intact.
 */

let checkpointerPromise = null;
export async function getCheckpointer() {
  if (!checkpointerPromise) {
    checkpointerPromise = (async () => {
      const client = await getClient();
      return new MongoDBSaver({
        client,
        dbName:
          process.env.MONGO_DB ?? process.env.MONGODB_DB ?? "fluxagent",
      });
    })();
  }
  return checkpointerPromise;
}

let compiledPromise = null;
export function getGraph() {
  if (compiledPromise) return compiledPromise;
  compiledPromise = (async () => {
    const checkpointer = await getCheckpointer();
    return buildGraph(checkpointer);
  })();
  return compiledPromise;
}

function buildGraph(checkpointer) {
  const g = new StateGraph(PipelineState)
    .addNode("trendsNode", trendsNode)
    .addNode("ideasNode", ideasNode)
    .addNode("analysisNode", analysisNode)
    .addNode("directionGateNode", directionGateNode)
    .addNode("scriptNode", scriptNode)
    .addNode("titlesNode", titlesNode)
    .addNode("descriptionNode", descriptionNode)
    .addNode("thumbnailNode", thumbnailNode)
    .addEdge(START, "trendsNode")
    .addEdge("trendsNode", "ideasNode")
    .addEdge("ideasNode", "analysisNode")
    .addEdge("analysisNode", "directionGateNode")
    .addEdge("directionGateNode", "scriptNode")
    .addEdge("scriptNode", "titlesNode")
    .addEdge("titlesNode", "descriptionNode")
    .addEdge("descriptionNode", "thumbnailNode")
    .addEdge("thumbnailNode", END);

  return g.compile({
    checkpointer,
    interruptBefore: [
      "analysisNode",
      "directionGateNode",
      "scriptNode",
      "titlesNode",
      "descriptionNode",
    ],
  });
}

/** "next node about to run" → "screen the user is currently looking at". */
const NODE_TO_STEP = {
  trendsNode: "ideas",
  ideasNode: "ideas",
  analysisNode: "ideas",       // parked here = user reviewing ideas
  directionGateNode: "analysis", // parked here = user reviewing analysis
  scriptNode: "direction",     // parked here = user providing direction
  titlesNode: "script",        // parked here = user reviewing script
  descriptionNode: "titles",   // parked here = user picking title
  thumbnailNode: "titles",     // shouldn't pause here, but just in case
};

export function deriveCurrentStep(graphState) {
  const next = graphState?.next ?? [];
  if (next.length === 0) {
    return graphState?.values?.thumbnails ? "done" : "ideas";
  }
  return NODE_TO_STEP[next[0]] ?? "ideas";
}