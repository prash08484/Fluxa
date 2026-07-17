import { chatJSON } from "../providers/openai.js";
import { descriptionPrompt } from "../prompts/description.prompt.js";
import { descriptionOutSchema } from "../schemas/index.js";

export async function generateDescription({ brief, title, script }) {
  return chatJSON({
    system: descriptionPrompt.system,
    user: descriptionPrompt.user({ brief, title, script }),
    schema: descriptionOutSchema,
    tier: "fast",
    temperature: 0.5,
    mock: {
      body: `${script.hook}\n\nIn this video I break down what actually changed and what didn't, with the numbers. If you've been on the fence about ${brief.niche}, this is the cheat sheet I wish I'd had.`,
      tags: [brief.niche, `${brief.niche} 2026`, `${brief.niche} honest review`, `${brief.niche} for beginners`, "tested", "honest review", "30 day experiment", "no sponsor"],
      chapters: script.beats.map((b) => ({ t: b.t, label: b.label })),
    },
  });
}

/**
 * Helper used client- AND server-side: stitch the generated description body
 * with the creator's signature. Kept here so prompt + stitching live together.
 */
export function stitchDescription(body, signature) {
  if (!signature || !signature.trim()) return body;
  return `${body}\n\n— — —\n${signature.trim()}`;
}
