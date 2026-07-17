import { chatJSON } from "../providers/openai.js";
import { titlesPrompt } from "../prompts/titles.prompt.js";
import { titlesOutSchema } from "../schemas/index.js";

export async function generateTitles({ brief, script }) {
  return chatJSON({
    system: titlesPrompt.system,
    user: titlesPrompt.user({ brief, script }),
    schema: titlesOutSchema,
    tier: "smart",
    temperature: 0.75,
    mock: {
      options: [
        { id: "tt1", text: script.title, flavour: "literal", reason: "Plain English, matches search intent." },
        { id: "tt2", text: `What no one tells you about ${brief.niche}`, flavour: "curiosity", reason: "Curiosity gap + insider framing." },
        { id: "tt3", text: `I tried ${brief.niche} for 30 days (honest results)`, flavour: "outcome", reason: "Outcome-led, mid-tail keyword friendly." },
        { id: "tt4", text: `${brief.niche} is mostly a scam. Proof inside.`, flavour: "polarising", reason: "Polarising — strong CTR, harder to retain." },
        { id: "tt5", text: `The ${brief.niche} mistake I keep seeing`, flavour: "curiosity", reason: "Soft authority + curiosity." },
      ],
      best_index: 2,
    },
  });
}
