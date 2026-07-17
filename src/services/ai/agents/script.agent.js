import { chatJSON } from "../providers/openai.js";
import { scriptPrompt } from "../prompts/script.prompt.js";
import { scriptOutSchema } from "../schemas/index.js";

export async function writeScript({ brief, idea, format = "guidance", direction, feedback }) {
  return chatJSON({
    system: scriptPrompt.system,
    user: scriptPrompt.user({ brief, idea, format, direction, feedback }),
    schema: scriptOutSchema,
    tier: "best",
    temperature: 0.8,
    mock: {
      title: idea.title,
      hook: feedback
        ? `[regen] ${idea.title} — addressed your feedback.`
        : `[${format}] ${idea.title} — opening that fits this format.`,
      beats: [
        { t: "0:00", label: "Hook", body: "Cold open that matches the chosen format.", bRoll: "fast cuts of the setup" },
        { t: "0:10", label: "Setup", body: `Setup line. ${direction ? `(direction: ${direction.slice(0, 60)}…)` : ""}`, bRoll: "title card / archival" },
        { t: "0:45", label: "Beat", body: "The first substantive beat for this format.", bRoll: "screen recording / closeup" },
        { t: "1:40", label: "Reveal", body: "The mechanic / step / surprise that makes the format work.", bRoll: "diagram on screen" },
        { t: "3:10", label: "Proof", body: "Specific receipts — numbers, screenshots, dates.", bRoll: "data overlay" },
        { t: "4:20", label: "Payoff", body: "What this means for the viewer, today.", bRoll: null },
      ],
      cta: "Drop your weirdest result in the comments — I read every one.",
      est_runtime_seconds: 300,
    },
  });
}
