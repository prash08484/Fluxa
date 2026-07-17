import { chatJSON } from "../providers/openai.js";
import { thumbnailPrompt } from "../prompts/thumbnail.prompt.js";
import { thumbnailsOutSchema } from "../schemas/index.js";
import { generateThumbnailImages } from "./thumbnailImage.agent.js";

export async function generateThumbnails({ idea, hook, count = 3 }) {
  const n = Math.max(1, Math.min(6, count));

  // Step 1: get TEXT concepts from the chat model.
  const concepts = await chatJSON({
    system: thumbnailPrompt.system,
    user: thumbnailPrompt.user({ idea, hook, count: n }),
    schema: thumbnailsOutSchema,
    tier: "fast",
    temperature: 0.8,
    mock: {
      thumbnails: Array.from({ length: n }).map((_, i) => ({
        id: `th${i + 1}`,
        concept: ["Split-frame contrast", "Single object hero", "Reaction face", "Side-by-side ranking", "Number tease", "Negative-space text"][i],
        composition: `Concept ${i + 1} — phone-shot, simple props, single subject.`,
        overlay_text: ["DAY 1 vs 30", "THIS BROKE IT", "I WAS WRONG", "RANKED", "$5 vs $500", "DON'T"][i],
        expression_or_emotion: ["Mild shock", "(no face)", "Genuine 'oh no'", "Confident grin", "Stunned", "Eyes off-frame"][i],
        imageUrl: null,
      })),
    },
  });

  // Step 2: generate actual images for each concept in parallel.
  // generateThumbnailImages never throws — bad ones just have imageUrl: null.
  const withImages = await generateThumbnailImages(
    concepts.thumbnails,
    idea?.title ?? "",
  );

  return { thumbnails: withImages };
}
