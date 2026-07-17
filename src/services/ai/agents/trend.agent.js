import { chatJSON } from "../providers/openai.js";
import { trendsPrompt } from "../prompts/trends.prompt.js";
import { trendsOutSchema } from "../schemas/index.js";

export async function findTrends({ brief }) {
  return chatJSON({
    system: trendsPrompt.system,
    user: trendsPrompt.user({ brief }),
    schema: trendsOutSchema,
    tier: "fast",
    temperature: 0.6,
    mock: {
      trends: [
        { id: "t1", title: `Why ${brief.niche} got weirdly competitive in 2026`, why_now: "Tooling commoditised, the differentiator shifted to taste.", signal_strength: "high", example_creators: [] },
        { id: "t2", title: `The "anti-${brief.niche}" backlash`, why_now: "Audiences are pushing back on the dominant trope.", signal_strength: "medium", example_creators: [] },
        { id: "t3", title: `${brief.niche} for people who hate ${brief.niche}`, why_now: "Niche-of-the-niche framing is over-indexing on retention.", signal_strength: "high", example_creators: [] },
        { id: "t4", title: `What ${brief.niche} actually costs in 2026`, why_now: "Transparency content is converting; viewers reward specificity.", signal_strength: "medium", example_creators: [] },
      ],
    },
  });
}
