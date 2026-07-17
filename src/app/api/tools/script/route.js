import { auth } from "@/auth";
import { z } from "zod";
import { writeScript } from "@/services/ai/agents/script.agent";
import { briefSchema } from "@/services/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  brief: briefSchema,
  idea: z.object({
    id: z.string().default("i1"),
    title: z.string().min(3),
    angle: z.string().min(3),
  }),
  hook: z.object({
    id: z.string().default("h1"),
    text: z.string().min(3),
  }),
  /** Optional: format scaffold the script agent applies (guidance/tutorial/etc). */
  format: z
    .enum(["guidance", "day_in_life", "tutorial", "story", "reaction", "listicle"])
    .optional(),
  /** Optional: free-text direction from the wizard. */
  direction: z.string().max(800).optional(),
  /** Optional: feedback for regeneration. Triggers a re-write that addresses this literally. */
  feedback: z.string().max(1200).optional(),
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
    const script = await writeScript({
      brief: parsed.data.brief,
      idea: parsed.data.idea,
      format: parsed.data.format,
      direction: parsed.data.direction,
      feedback: parsed.data.feedback,
    });
    return Response.json({ script });
  } catch (err) {
    return Response.json(
      { error: "Script generation failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
