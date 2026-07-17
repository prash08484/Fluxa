/**
 * Thumbnail IMAGE generator. Takes a text concept (composition, overlay, etc.)
 * and produces an actual rendered image via OpenAI's image API. Uploads to
 * Cloudinary if configured, returns the public URL; otherwise returns a
 * data: URI (works in-page but won't survive a round-trip cleanly).
 *
 * Cost: ~$0.04 per 1024x1024 image at standard quality (gpt-image-1).
 * For a project with 4 thumbnails that's $0.16. Worth knowing.
 */

import OpenAI from "openai";
import { aiConfig } from "../config.js";
import { uploadBase64Image } from "../../storage/cloudinary.js";

let client = null;
function getOpenAI() {
  if (!client) client = new OpenAI({ apiKey: aiConfig.openaiApiKey });
  return client;
}

/** Build a single image prompt from the thumbnail concept fields.
 *  The 1536×1024 output WILL be cropped to 1280×720 (16:9 YT spec). We tell
 *  the model up front so it composes for the final aspect ratio and keeps
 *  the load-bearing content inside the safe zone. */
function buildPrompt({ concept, composition, overlay_text, expression_or_emotion, ideaTitle }) {
  return [
    `YouTube thumbnail design at FINAL 16:9 widescreen (1280×720). This will be center-cropped from your 1536×1024 canvas — DO NOT place any subject, face, or text in the top 15% or bottom 15% of the frame; they will be cut. Place all critical content in the centre 70% horizontal band.`,
    `Subject: ${concept}.`,
    `Composition: ${composition}`,
    expression_or_emotion ? `Expression / mood: ${expression_or_emotion}.` : null,
    overlay_text
      ? `Bold overlay text "${overlay_text}" — large sans-serif, thick outline, placed in the centre band. Spell it EXACTLY as quoted.`
      : null,
    `Topic context (for visual cues only): ${ideaTitle}.`,
    `Photographic or mixed-media look. High contrast. No clutter. No watermarks. No fake brand logos. No tiny text.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Generate ONE image for ONE thumbnail concept.
 * Returns { url, hostedOn } where hostedOn is "cloudinary" | "inline" | "none".
 * Returns { url: null, hostedOn: "none", error } on failure — we never throw
 * here, because one failed image shouldn't kill the whole pipeline.
 */
export async function generateThumbnailImage(thumb, ideaTitle) {
  if (aiConfig.mock) {
    return {
      url: `https://placehold.co/1024x576/1c1917/fde68a/png?text=${encodeURIComponent(thumb.overlay_text ?? "thumb")}`,
      hostedOn: "placeholder",
    };
  }
  if (!aiConfig.openaiApiKey) {
    return { url: null, hostedOn: "none", error: "OPENAI_API_KEY not set." };
  }

  try {
    const oa = getOpenAI();
    const response = await oa.images.generate({
      model: "gpt-image-1",
      prompt: buildPrompt({ ...thumb, ideaTitle }),
      size: "1536x1024",      // closest to 16:9 supported by gpt-image-1 — we crop to 1280x720 on upload
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return { url: null, hostedOn: "none", error: "Image API returned no data." };
    }
    // Crop to exact YouTube thumbnail spec (1280x720, 16:9) using Cloudinary's
    // smart-gravity fill — keeps the subject centred even though we shed pixels
    // from the sides.
    const uploaded = await uploadBase64Image(b64, { width: 1280, height: 720 });
    if (uploaded?.url) {
      return { url: uploaded.url, hostedOn: "cloudinary" };
    }
    // Cloudinary not configured — fall back to data URI (works in <img>,
    // but bloats Mongo state. Acceptable while user is testing locally.)
    return { url: `data:image/png;base64,${b64}`, hostedOn: "inline" };
  } catch (err) {
    return {
      url: null,
      hostedOn: "none",
      error: String(err?.message ?? err),
    };
  }
}

/** Generate images for many concepts in parallel. Never throws. */
export async function generateThumbnailImages(thumbnails, ideaTitle) {
  return Promise.all(
    thumbnails.map(async (t) => {
      const { url } = await generateThumbnailImage(t, ideaTitle);
      return { ...t, imageUrl: url };
    }),
  );
}
