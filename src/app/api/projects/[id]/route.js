import { auth } from "@/auth";
import { projectPatchSchema, briefSchema } from "@/services/ai/schemas";
import {
  getProject,
  updateProject,
  deleteProject,
} from "@/services/projects/store";
import { start, snapshot } from "@/services/ai/graph/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;
  const project = await getProject(id, userId);
  if (!project) return Response.json({ error: "Not found." }, { status: 404 });

  const snap = await snapshot(id).catch(() => null);
  return Response.json({ project, snapshot: snap });
}

export async function PATCH(request, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Allow either meta patch or a brief submission that starts the canvas.
  const briefParse = briefSchema.safeParse(body?.brief);
  if (briefParse.success) {
    const existing = await getProject(id, userId);
    if (!existing) return Response.json({ error: "Not found." }, { status: 404 });
    try {
      const snap = await start({ sessionId: id, brief: briefParse.data });
      const project = await updateProject(id, userId, {
        brief: briefParse.data,
        status: "in_progress",
      });
      return Response.json({ project, snapshot: snap });
    } catch (err) {
      return Response.json(
        { error: "Canvas failed to start.", detail: String(err?.message ?? err) },
        { status: 500 },
      );
    }
  }

  const parsed = projectPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid patch.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const project = await updateProject(id, userId, parsed.data);
  if (!project) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ project });
}

export async function DELETE(_req, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;
  const ok = await deleteProject(id, userId);
  if (!ok) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ ok: true });
}
