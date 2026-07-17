import { auth } from "@/auth";
import { canvasRegenerateSchema } from "@/services/ai/schemas";
import { getProject } from "@/services/projects/store";
import { regenerate } from "@/services/ai/graph/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Re-run the current step's agent with feedback. Used by the "regenerate"
 * button on the ideas and script steps — the graph stays parked at the same
 * interrupt, only the artefact in state changes.
 *
 * Body: { step: "ideas"|"script", feedback: string }
 */
export async function POST(request, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;
  const project = await getProject(id, userId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = canvasRegenerateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid regenerate input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const snap = await regenerate({ sessionId: id, ...parsed.data });
    return Response.json({ project, snapshot: snap });
  } catch (err) {
    return Response.json(
      { error: "Regenerate failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
