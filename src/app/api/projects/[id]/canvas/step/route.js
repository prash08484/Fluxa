import { auth } from "@/auth";
import { canvasStepInputSchema } from "@/services/ai/schemas";
import { getProject, updateProject } from "@/services/projects/store";
import { advance } from "@/services/ai/graph/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = canvasStepInputSchema.safeParse(body?.input ?? {});
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid step input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const snap = await advance({ sessionId: id, input: parsed.data });
    if (snap.step === "done" && project.status !== "completed") {
      await updateProject(id, userId, { status: "completed" });
    }
    return Response.json({ project, snapshot: snap });
  } catch (err) {
    return Response.json(
      { error: "Step failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
