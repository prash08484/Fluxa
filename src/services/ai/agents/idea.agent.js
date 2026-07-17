import { chatJSON } from "../providers/openai.js";
import { ideasPrompt } from "../prompts/ideas.prompt.js";
import { ideasOutSchema } from "../schemas/index.js";

export async function generateIdeas({ brief, selectedTrends, feedback }) {
  return chatJSON({
    system: ideasPrompt.system,
    user: ideasPrompt.user({ brief, selectedTrends, feedback }),
    schema: ideasOutSchema,
    tier: "smart",
    temperature: 0.9,
    mock: {
      ideas: Array.from({ length: 10 }).map((_, i) => ({
        id: `i${i + 1}`,
        title: feedback
          ? `[regen] Take ${i + 1} on ${brief.niche}`
          : [
              `I tried every ${brief.niche} trick for 30 days`,
              `The ${brief.niche} thing no one talks about`,
              `Ranking 12 ${brief.niche} products by how often they break`,
              `${brief.niche} on a $5 budget`,
              `I quit ${brief.niche} for a month — here's what happened`,
              `${brief.niche} myths I believed until I checked`,
              `Why ${brief.niche} got weirdly competitive in 2026`,
              `Honest review: my 12 months in ${brief.niche}`,
              `${brief.niche} for people who hate ${brief.niche}`,
              `The cheapest ${brief.niche} setup that actually works`,
            ][i],
        angle: `Take #${i + 1} angle — ${brief.thinking ?? "experiment + reveal"}.`,
        why_it_works: "Curiosity + transformation + tangible proof.",
        estimated_appeal: i < 2 ? "viral" : i < 7 ? "broad" : "niche",
      })),
    },
  });
}
