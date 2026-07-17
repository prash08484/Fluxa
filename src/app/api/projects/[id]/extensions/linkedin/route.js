import { auth } from "@/auth";
import { linkedinGenerateSchema, extensionRegenerateSchema } from "@/services/ai/schemas";
import { getProject, updateProject } from "@/services/projects/store";
import { snapshot } from "@/services/ai/graph/runner";
import { generateLinkedinPost } from "@/services/ai/agents/linkedinPost.agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  → return the currently-stored LinkedIn post (or null).
 * POST → generate a fresh one. Body shapes:
 *          { postType: "story"|... }                — first generation
 *          { postType: ..., feedback: "..." }       — regenerate
 *          { feedback: "..." }                      — regenerate using stored postType
 *
 * Persists to project.extensions.linkedin so it survives reloads.
 * Image is NOT generated here — see ./image route for opt-in image gen.
 */

export async function GET(_req, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;
  const project = await getProject(id, userId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  return Response.json({ post: project.extensions?.linkedin ?? null });
}

export async function POST(request, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;
  const project = await getProject(id, userId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });

  let body = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Decide postType + feedback. Three legal shapes:
  //   1. { postType }              → first gen
  //   2. { postType, feedback }    → regen with different type or same
  //   3. { feedback }              → regen using stored postType
  let postType = body.postType;
  let feedback = null;
  if (body.feedback != null) {
    const parsed = extensionRegenerateSchema.safeParse({ feedback: body.feedback });
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid feedback.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    feedback = parsed.data.feedback;
    if (!postType) postType = project.extensions?.linkedin?.postType ?? "experience";
  } else {
    const parsed = linkedinGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Pick a post type.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    postType = parsed.data.postType;
  }

  const snap = await snapshot(id).catch(() => null);
  const state = snap?.state ?? {};
  if (!state.script) {
    return Response.json(
      { error: "Finish the script step on this project's canvas first — LinkedIn adapts from the script." },
      { status: 400 },
    );
  }
  const idea = (state.ideas ?? []).find((i) => i.id === state.selectedIdeaId);

  try {
    const post = await generateLinkedinPost({
      brief: state.brief ?? project.brief,
      idea,
      script: state.script,
      postType,
      feedback,
    });
    // Preserve a previously-generated imageUrl through text-only regenerates
    // — user shouldn't lose an image they generated just because they
    // rewrote the post text.
    const prevImage = project.extensions?.linkedin?.imageUrl ?? null;
    const stored = {
      ...post,
      postType,
      imageUrl: prevImage,
      generatedAt: new Date().toISOString(),
      feedback: feedback ?? null,
    };
    const updated = await updateProject(id, userId, {
      extensions: { ...(project.extensions ?? {}), linkedin: stored },
    });
    return Response.json({ project: updated, post: stored });
  } catch (err) {
    return Response.json(
      { error: "LinkedIn generation failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
