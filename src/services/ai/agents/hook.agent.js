import { chatJSON } from "../providers/openai.js";
import { hooksPrompt } from "../prompts/hooks.prompt.js";
import { hooksOutSchema } from "../schemas/index.js";

export async function generateHooks({ brief, idea }) {
  return chatJSON({
    system: hooksPrompt.system,
    user: hooksPrompt.user({ brief, idea }),
    schema: hooksOutSchema,
    tier: "smart",
    temperature: 0.95,
    mock: {
      hooks: [
        { id: "h1", text: `I broke the rule everyone in ${brief?.niche ?? "this space"} swears by. It worked.`, pattern: "rule-break + outcome tease", risk: "spicy" },
        { id: "h2", text: `If you've spent more than $100 on ${brief?.niche ?? "this"}, you got scammed. Proof inside.`, pattern: "accusation + proof tease", risk: "polarising" },
        { id: "h3", text: `30 days. One change. Look what happened.`, pattern: "transformation tease", risk: "safe" },
        { id: "h4", text: `I asked 12 pros the same question. They all lied.`, pattern: "credibility flip", risk: "spicy" },
        { id: "h5", text: `This is the cheapest setup that actually works.`, pattern: "value promise", risk: "safe" },
      ],
    },
  });
}
