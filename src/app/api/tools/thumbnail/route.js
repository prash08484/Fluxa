import { auth } from "@/auth";
import { z } from "zod";
import { generateThumbnails } from "@/services/ai/agents/thumbnail.agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  idea: z.object({
    id: z.string().default("i1"),
    title: z.string().min(3),
    angle: z.string().min(3),
  }),
  hook: z.object({
    id: z.string().default("h1"),
    text: z.string().min(3),
  }),
  count: z.number().int().min(1).max(6).default(3),
});

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { thumbnails } = await generateThumbnails({
      idea: parsed.data.idea,
      hook: parsed.data.hook.text,
      count: parsed.data.count,
    });
    return Response.json({ thumbnails });
  } catch (err) {
    return Response.json(
      { error: "Thumbnail generation failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
