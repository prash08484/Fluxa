import { chatJSON } from "../providers/openai.js";
import { anglePrompt } from "../prompts/angle.prompt.js";
import { angleOutSchema } from "../schemas/index.js";

export async function suggestAngle({ brief, title }) {
  return chatJSON({
    system: anglePrompt.system,
    user: anglePrompt.user({ brief, title }),
    schema: angleOutSchema,
    tier: "fast",
    temperature: 0.75,
    mock: {
      angle: `Frame "${title}" as a personal experiment with a clear before/after — the viewer comes for the result, stays for the receipts.`,
      why_it_works: "Transformation arcs + specific proof beat generic explainers on retention.",
    },
  });
}
