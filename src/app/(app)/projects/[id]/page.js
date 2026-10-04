import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProject } from "@/services/projects/store";
import { snapshot } from "@/services/ai/graph/runner";
import { PageHeader } from "@/components/app/PageHeader";
import { ProjectWorkspace } from "@/components/canvas/ProjectWorkspace";

export async function generateMetadata(props) {
  const { id } = await props.params;
  const me = await auth();
  if (!me?.user) return { title: "Project — FluxAgent" };
  const project = await getProject(id, me.user.id ?? me.user.email);
  return { title: project ? `${project.name} — FluxAgent` : "Project — FluxAgent" };
}

export default async function ProjectWorkspacePage(props) {
  const { id } = await props.params;
  const me = await auth();
  const userId = me.user.id ?? me.user.email;
  const project = await getProject(id, userId);
  if (!project) notFound();

  const snap = await snapshot(id).catch(() => null);

  return (
    <>
      <PageHeader
        hand={project.brief?.niche ? `niche · ${project.brief.niche}` : "your canvas"}
        title={project.name}
        subtitle={project.description ?? undefined}
      />
      <ProjectWorkspace projectId={project.id} initialSnapshot={snap} />
    </>
  );
}
