import { auth } from "@/auth";
import { z } from "zod";
import { suggestAngle } from "@/services/ai/agents/angle.agent";
import { briefSchema } from "@/services/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  brief: briefSchema.partial().optional(),
  title: z.string().min(3),
});

export async function POST(request) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const out = await suggestAngle(parsed.data);
    return Response.json(out);
  } catch (err) {
    return Response.json(
      { error: "Angle suggestion failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
