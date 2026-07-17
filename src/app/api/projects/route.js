import { auth } from "@/auth";
import { projectCreateSchema } from "@/services/ai/schemas";
import { createProject, listProjects } from "@/services/projects/store";
import { start, snapshot } from "@/services/ai/graph/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await auth();
  if (!me?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const projects = await listProjects(me.user.id ?? me.user.email);
  return Response.json({ projects });
}

export async function POST(request) {
  const me = await auth();
  if (!me?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const userId = me.user.id ?? me.user.email;
  const project = await createProject({ userId, ...parsed.data });

  // If a brief was supplied with creation, kick off the LangGraph canvas
  // immediately — saves the user one round-trip and the wizard lands them
  // directly on the trends step.
  let snap = null;
  if (parsed.data.brief) {
    try {
      snap = await start({ sessionId: project.id, brief: parsed.data.brief });
    } catch (err) {
      return Response.json(
        {
          error: "Project created but canvas failed to start.",
          project,
          detail: String(err?.message ?? err),
        },
        { status: 500 },
      );
    }
  } else {
    snap = await snapshot(project.id).catch(() => null);
  }

  return Response.json({ project, snapshot: snap }, { status: 201 });
}
