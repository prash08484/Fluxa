// Direct-agent smoke test for the new standalone tools.
// Run: AI_MOCK=true node scripts/smoke-tools.mjs
process.env.AI_MOCK = process.env.AI_MOCK ?? "true";

import { findTrends } from "../src/services/ai/agents/trend.agent.js";
import { generateIdeas } from "../src/services/ai/agents/idea.agent.js";
import { writeScript } from "../src/services/ai/agents/script.agent.js";
import { generateThumbnails } from "../src/services/ai/agents/thumbnail.agent.js";
import { analyzeVideo } from "../src/services/ai/agents/analyze.agent.js";

const brief = { niche: "indie game dev", audience: "solo devs", tone: "dry honest", platform: "youtube", videoLength: "medium" };

console.log("\n[1/5] trends…");
const { trends } = await findTrends({ brief });
console.log("  ✓", trends.length, "trends");

console.log("\n[2/5] ideas (from 2 trends)…");
const { ideas } = await generateIdeas({ brief, selectedTrends: trends.slice(0, 2) });
console.log("  ✓", ideas.length, "ideas");

console.log("\n[3/5] script…");
const script = await writeScript({
  brief,
  idea: ideas[0],
  hook: { id: "h1", text: "If I quit my job to make games, would you watch?" },
});
console.log("  ✓ script:", script.title, "/ beats:", script.beats.length);

console.log("\n[4/5] thumbnails…");
const { thumbnails } = await generateThumbnails({
  idea: ideas[0],
  hook: { id: "h1", text: script.hook },
});
console.log("  ✓", thumbnails.length, "thumbnails");

console.log("\n[5/5] analyze (pasted script body)…");
const analysis = await analyzeVideo({
  input: script.beats.map((b) => `[${b.t}] ${b.label}: ${b.body}`).join("\n"),
  platform: "youtube",
  niche: brief.niche,
});
console.log("  ✓ verdict:", analysis.verdict, "/ overall:", analysis.overall_score, "/ top fixes:", analysis.top_3_fixes.length);

console.log("\nPASS — all 4 standalone tools + analyze produced valid output.");
