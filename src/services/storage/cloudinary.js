/**
 * Cloudinary wrapper. One place the SDK is touched.
 *
 * Why server-side upload (not signed direct browser upload)?
 *   Simpler for v1, no client-side SDK, no signing dance. Slower for huge
 *   files, but cover images are <2MB. If volume grows, swap to signed direct
 *   uploads — only this file changes.
 *
 * Env required:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
  return true;
}

export function cloudinaryAvailable() {
  return ensureConfigured();
}

/**
 * Upload a file (Buffer | Uint8Array) and return { url, publicId, width, height }.
 * Throws if Cloudinary isn't configured — caller should check `cloudinaryAvailable()` first.
 */
export async function uploadImage(buffer, { folder = "fluxagent/projects" } = {}) {
  if (!ensureConfigured()) {
    throw new Error("Cloudinary not configured. Set CLOUDINARY_* env vars.");
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 1200, height: 630, crop: "fill", gravity: "auto" }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Upload a base64-encoded image (data URI or raw base64). Used for images
 * we generate ourselves (e.g. OpenAI gpt-image-1 returns b64_json) — we don't
 * want them to live as 500KB+ blobs inside Mongo, so we offload to Cloudinary
 * and keep only the URL in pipeline state.
 *
 * Returns the same shape as uploadImage(). If Cloudinary isn't configured,
 * returns null so callers can fall back to inlining the data URI.
 */
export async function uploadBase64Image(
  b64,
  {
    folder = "fluxagent/thumbnails",
    /** Crop to these exact dimensions via Cloudinary's smart-gravity fill.
     *  Null = no crop, keep original dimensions. */
    width = null,
    height = null,
  } = {},
) {
  if (!ensureConfigured()) return null;
  const dataUri = b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
  const opts = {
    folder,
    resource_type: "image",
  };
  if (width && height) {
    // gravity:center is predictable. gravity:auto can shift focus between
    // images of the same set and produce inconsistent results — bad for a
    // 3-thumbnail comparison view. The image agent prompt already keeps
    // subjects in the centre band so this is the right pick.
    opts.transformation = [{ width, height, crop: "fill", gravity: "center" }];
  }
  const result = await cloudinary.uploader.upload(dataUri, opts);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImage(publicId) {
  if (!ensureConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best-effort — log later when we add observability
  }
}
