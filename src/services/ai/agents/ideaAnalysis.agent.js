import { chatJSON } from "../providers/openai.js";
import { ideaAnalysisPrompt } from "../prompts/ideaAnalysis.prompt.js";
import { ideaAnalysisOutSchema } from "../schemas/index.js";

export async function analyzeIdeas({ brief, ideas }) {
  return chatJSON({
    system: ideaAnalysisPrompt.system,
    user: ideaAnalysisPrompt.user({ brief, ideas }),
    schema: ideaAnalysisOutSchema,
    tier: "smart",
    temperature: 0.4,
    mock: {
      analyses: ideas.map((idea, i) => ({
        idea_id: idea.id,
        viral_score: [8, 6, 4][i] ?? 5,
        reasoning:
          "Strong curiosity gap + transformation arc — viewers want to see what changed and why.",
        audience_fit: `${brief.niche} creators 25–40 who self-identify as 'serious about the craft'.`,
        risk:
          "If the payoff is mild or the proof is thin, retention drops mid-video and the comments turn.",
        similar_examples: [
          {
            channel: "format match",
            title: `30-day ${brief.niche} experiment videos`,
            why_it_worked: "Time-based experiments invite the algorithm to recommend to lookalikes.",
          },
          {
            channel: "format match",
            title: `"I tried every X for a week" pattern`,
            why_it_worked: "Endurance framing is a proven retention scaffold.",
          },
        ],
      })),
    },
  });
}
