import { auth } from "@/auth";
import { z } from "zod";
import { findTrends } from "@/services/ai/agents/trend.agent";
import { generateIdeas } from "@/services/ai/agents/idea.agent";
import { briefSchema } from "@/services/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  brief: briefSchema,
  /** Optional: if provided, skip trend discovery and use these literal trends. */
  trendsOverride: z
    .array(z.object({ id: z.string(), title: z.string(), why_now: z.string() }))
    .optional(),
  /** Optional: feedback for regeneration — sent to the ideas agent so it
   *  changes DIRECTION, not just wording. */
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
    const { brief, trendsOverride, feedback } = parsed.data;
    const { trends } = trendsOverride
      ? { trends: trendsOverride }
      : await findTrends({ brief });
    const { ideas } = await generateIdeas({
      brief,
      selectedTrends: trends,
      feedback,
    });
    return Response.json({ trends, ideas });
  } catch (err) {
    return Response.json(
      { error: "Tool failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
