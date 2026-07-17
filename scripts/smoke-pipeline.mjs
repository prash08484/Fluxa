// End-to-end smoke test of the LangGraph pipeline (new flow).
// Run: AI_MOCK=true node scripts/smoke-pipeline.mjs
process.env.AI_MOCK = process.env.AI_MOCK ?? "true";

import { createProject } from "../src/services/projects/store.js";
import { start, advance, regenerate } from "../src/services/ai/graph/runner.js";

function tick(label, snap) {
  const s = snap.state;
  console.log(`\n[${label}]`, {
    step: snap.step,
    next: snap.next,
    ideas: s.ideas?.length,
    shortlist: s.selectedIdeasShortlist?.length,
    analyses: s.ideaAnalyses?.length,
    selectedIdeaId: s.selectedIdeaId,
    direction: s.scriptDirection ? "set" : undefined,
    script: s.script?.title,
    titles: s.titles?.options?.length,
    selectedTitleId: s.selectedTitleId,
    description: s.description?.body ? "yes" : undefined,
    thumbnails: s.thumbnails?.length,
  });
}

function expect(cond, msg) {
  if (!cond) {
    console.error("\nFAIL —", msg);
    process.exit(1);
  }
}

const brief = {
  niche: "indie game dev",
  thinking: "the post-launch wishlist bump and what nobody talks about",
  audience: "solo devs",
  tone: "dry honest",
  platform: "youtube",
  videoLength: "medium",
  signature: "→ wishlist on Steam: link\n→ devlog every Sunday",
};

const project = await createProject({ userId: "smoke", name: "Devlog #7", brief });
console.log("project", project.id);

const s0 = await start({ sessionId: project.id, brief });
tick("start → parked on IDEAS screen", s0);
expect(s0.step === "ideas", "step should be 'ideas'");
expect((s0.state.ideas ?? []).length === 10, "expected 10 ideas");

const s0r = await regenerate({ sessionId: project.id, step: "ideas", feedback: "more contrarian, less listicle" });
tick("ideas regen → still on IDEAS", s0r);
expect(s0r.step === "ideas", "regenerate must stay parked on ideas");

const top3 = s0r.state.ideas.slice(0, 3).map((i) => i.id);
const s1 = await advance({ sessionId: project.id, input: { selectedIdeasShortlist: top3 } });
tick("picked 3 → ANALYSIS screen", s1);
expect(s1.step === "analysis", "expected analysis");
expect((s1.state.ideaAnalyses ?? []).length === 3, "expected 3 analyses");

const s2 = await advance({ sessionId: project.id, input: { selectedIdeaId: top3[0] } });
tick("picked final → DIRECTION screen", s2);
expect(s2.step === "direction", "expected direction");
expect(!s2.state.script, "script must not exist yet (no direction submitted)");

const s3 = await advance({
  sessionId: project.id,
  input: {
    scriptDirection: "open with a one-line story, end with a question, keep under 4 min",
    scriptFormat: "guidance",
  },
});
tick("direction submitted → SCRIPT screen", s3);
expect(s3.step === "script", "expected script");
expect(!!s3.state.script, "script must exist");

const oldHook = s3.state.script.hook;
const s3r = await regenerate({ sessionId: project.id, step: "script", feedback: "make the hook more confrontational" });
tick("script regen → still on SCRIPT", s3r);
expect(s3r.step === "script", "regenerate must stay parked on script");
expect(s3r.state.script.hook !== oldHook, "regen should produce a different hook");

const s4 = await advance({ sessionId: project.id, input: { scriptApproved: true } });
tick("approved → TITLES screen", s4);
expect(s4.step === "titles", "expected titles");
expect((s4.state.titles?.options ?? []).length >= 3, "expected title options");

const bestIdx = s4.state.titles.best_index ?? 0;
const titleId = s4.state.titles.options[bestIdx].id;
const s5 = await advance({ sessionId: project.id, input: { selectedTitleId: titleId, thumbnailCount: 4 } });
tick("picked title + 4 thumbs → DONE", s5);
expect(s5.step === "done", "expected done");
expect((s5.state.thumbnails ?? []).length === 4, "expected 4 thumbnails");
expect(!!s5.state.description?.body, "description missing");

console.log("\nPASS — new pipeline reached done; ideas+script feedback loops working.");
