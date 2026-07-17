import { chatJSON } from "../providers/openai.js";
import { analyzePrompt } from "../prompts/analyze.prompt.js";
import { analyzeOutSchema } from "../schemas/index.js";

export async function analyzeVideo({ input, platform = "youtube", niche }) {
  return chatJSON({
    system: analyzePrompt.system,
    user: analyzePrompt.user({ input, platform, niche }),
    schema: analyzeOutSchema,
    tier: "smart",
    temperature: 0.3,
    mock: {
      overall_score: 6,
      verdict: "publish_after_fixes",
      dimensions: [
        { name: "hook", score: 5, strongest: "Specific and concrete.", weakest: "Buries the stakes — viewer doesn't know what they lose by skipping.", fix: "Move the stakes to the first sentence." },
        { name: "structure", score: 7, strongest: "Clear three-act spine.", weakest: "Mid-section has two unrelated tangents.", fix: "Cut the second tangent and merge the first into the payoff." },
        { name: "clarity", score: 8, strongest: "Jargon-free.", weakest: "One numeric claim isn't explained.", fix: "Add a one-second on-screen calc for the 47% figure." },
        { name: "pacing", score: 6, strongest: "Strong cold open.", weakest: "Sags around the 2:30 mark.", fix: "Drop a pattern interrupt (B-roll cut + question) at 2:30." },
        { name: "cta", score: 4, strongest: "It exists.", weakest: "Generic 'like and subscribe'.", fix: "Replace with a curiosity CTA tied to the payoff." },
        { name: "seo_readiness", score: 5, strongest: "Title has the keyword.", weakest: "No chapter markers, weak description first line.", fix: "Add chapters + rewrite first 120 chars to lead with the result." },
      ],
      top_3_fixes: [
        "Rewrite the CTA to be specific to this video's payoff.",
        "Move the stakes into the first sentence of the hook.",
        "Add a pattern interrupt at 2:30 to fight the sag.",
      ],
      one_line_summary: "Solid bones, hook and CTA leave 30% of the click on the table.",
    },
  });
}
