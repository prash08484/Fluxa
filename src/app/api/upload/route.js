import { auth } from "@/auth";
import { uploadImage, cloudinaryAvailable } from "@/services/storage/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — covers are small
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request) {
  const me = await auth();
  if (!me?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!cloudinaryAvailable()) {
    return Response.json(
      { error: "Image upload not configured. Set CLOUDINARY_* env vars." },
      { status: 503 },
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "No file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "JPEG, PNG or WebP only." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Max 5MB." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: "Upload failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
