/**
 * LinkedIn post image generator. Opt-in: user clicks "generate image" on
 * the LinkedIn extension panel, which calls /api/.../extensions/linkedin/image.
 *
 * Output spec: 1200x627 (LinkedIn's recommended share-image size, 1.91:1).
 * gpt-image-1 doesn't offer 1.91:1 natively, so we render at 1536x1024 (3:2)
 * and Cloudinary-crops to 1200x627 with center gravity. The prompt tells the
 * model to keep all subjects in the central horizontal band so the crop
 * doesn't slice off heads.
 */

import OpenAI from "openai";
import { aiConfig } from "../config.js";
import { uploadBase64Image } from "../../storage/cloudinary.js";

let client = null;
function getOpenAI() {
  if (!client) client = new OpenAI({ apiKey: aiConfig.openaiApiKey });
  return client;
}

const STYLE_BY_TYPE = {
  story:            "warm, slightly cinematic — like a still from a documentary",
  educational:      "clean, infographic-adjacent — diagram or single bold concept",
  experience:       "documentary photograph — desk scene, on-the-ground feel",
  hiring:           "team or workplace photograph — welcoming, human, no stock-photo vibe",
  project_showcase: "product / build photograph or screen-mock — show the artefact",
  announcement:    "iconic, slightly graphic — clear hero subject, minimal background",
};

function buildPrompt({ post, brief, postType }) {
  const style = STYLE_BY_TYPE[postType] ?? STYLE_BY_TYPE.experience;
  return [
    `LinkedIn share image at FINAL 1.91:1 widescreen (1200x627). This image will be center-cropped from your 1536x1024 canvas — DO NOT place faces, subjects, or text in the top 20% or bottom 20% of the frame; those zones will be cut. Put everything important in the centre horizontal band.`,
    `Style: ${style}.`,
    `Post hook (visual cue only, do NOT render this text in the image): "${post.hook_line}".`,
    `Niche: ${brief?.niche ?? "professional creator"}.`,
    `One clear hero subject. High readability at 1/4 size (LinkedIn feed thumbnail).`,
    `No overlay text. No watermarks. No fake brand logos. No tiny details that disappear when scaled.`,
  ].join(" ");
}

export async function generateLinkedinImage({ post, brief, postType }) {
  if (aiConfig.mock) {
    return {
      url: `https://placehold.co/1200x627/1c1917/fde68a/png?text=${encodeURIComponent(
        post.hook_line?.slice(0, 30) ?? "LinkedIn",
      )}`,
    };
  }
  if (!aiConfig.openaiApiKey) {
    return { url: null, error: "OPENAI_API_KEY not set." };
  }

  try {
    const oa = getOpenAI();
    const response = await oa.images.generate({
      model: "gpt-image-1",
      prompt: buildPrompt({ post, brief, postType }),
      size: "1536x1024",
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return { url: null, error: "Image API returned no data." };

    const uploaded = await uploadBase64Image(b64, {
      folder: "vidagent/linkedin",
      width: 1200,
      height: 627,
    });
    if (uploaded?.url) return { url: uploaded.url };
    return { url: `data:image/png;base64,${b64}` };
  } catch (err) {
    return { url: null, error: String(err?.message ?? err) };
  }
}
