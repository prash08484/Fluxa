import { auth } from "@/auth";
import { getProject, updateProject } from "@/services/projects/store";
import { snapshot } from "@/services/ai/graph/runner";
import { generateLinkedinImage } from "@/services/ai/agents/linkedinImage.agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opt-in LinkedIn post image. Separate route from the text generation so
 * users only pay for image tokens when they explicitly click "generate
 * image" on the LinkedIn extension panel.
 *
 * Saves to project.extensions.linkedin.imageUrl.
 */
export async function POST(_request, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const userId = me.user.id ?? me.user.email;
  const project = await getProject(id, userId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });

  const existing = project.extensions?.linkedin;
  if (!existing) {
    return Response.json(
      { error: "Generate the LinkedIn post first, then add an image." },
      { status: 400 },
    );
  }

  const snap = await snapshot(id).catch(() => null);
  const brief = snap?.state?.brief ?? project.brief;

  const { url, error } = await generateLinkedinImage({
    post: existing,
    brief,
    postType: existing.postType ?? "experience",
  });

  if (!url) {
    return Response.json(
      { error: error ?? "Image generation failed." },
      { status: 500 },
    );
  }

  const stored = { ...existing, imageUrl: url };
  const updated = await updateProject(id, userId, {
    extensions: { ...(project.extensions ?? {}), linkedin: stored },
  });
  return Response.json({ project: updated, post: stored });
}
