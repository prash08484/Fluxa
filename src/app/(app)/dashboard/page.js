import Link from "next/link";
import { auth } from "@/auth";
import { listProjects } from "@/services/projects/store";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/app/Icon";

export const metadata = { title: "Dashboard — vidagent" };

const STATUS_COPY = {
  draft: { label: "draft", color: "text-zinc-400 border-white/10 bg-white/[0.03]" },
  in_progress: { label: "in progress", color: "text-amber-200 border-amber-200/30 bg-amber-200/[0.06]" },
  completed: { label: "complete", color: "text-emerald-200 border-emerald-400/30 bg-emerald-400/[0.06]" },
};

export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "creator").split(" ")[0];
  const userId = session.user.id ?? session.user.email;
  const projects = await listProjects(userId);

  return (
    <>
      <PageHeader
        hand={`hi ${firstName.toLowerCase()},`}
        title="Your projects"
        subtitle="One project = one video. Each lives on its own canvas with its own brief, ideas, script and assets."
        action={
          <Button as="a" href="/projects/new" variant="accent" size="md">
            + New project
          </Button>
        }
      />

      {projects.length === 0 ? <EmptyState /> : <ProjectsGrid projects={projects} />}

      <div className="mt-12">
        <p className="font-hand text-stone-300 text-base mb-3">
          quick tools (no project needed)
        </p>
        <ToolShortcuts />
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="paper-card p-10 text-center bg-amber-200/[0.02]">
      <div className="font-hand text-amber-200 text-2xl mb-2">
        a blank canvas ↓
      </div>
      <p className="text-zinc-400 max-w-md mx-auto">
        Start your first project. We'll walk you through it one question at a time —
        you'll have a complete video plan in 90 seconds.
      </p>
      <div className="mt-6">
        <Button as="a" href="/projects/new" variant="accent" size="lg">
          Start your first project →
        </Button>
      </div>
    </div>
  );
}

function ProjectsGrid({ projects }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => {
        const s = STATUS_COPY[p.status] ?? STATUS_COPY.draft;
        return (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="paper-card overflow-hidden group hover:-translate-y-0.5 transition-transform"
          >
            <Cover url={p.coverImageUrl} name={p.name} />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-semibold text-zinc-50 truncate" title={p.name}>
                  {p.name}
                </h3>
                <span
                  className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.color}`}
                >
                  {s.label}
                </span>
              </div>
              {p.description && (
                <p className="text-sm text-zinc-400 line-clamp-2">{p.description}</p>
              )}
              {p.brief?.niche && (
                <p className="mt-2 text-xs text-zinc-500">niche · {p.brief.niche}</p>
              )}
              <p className="mt-3 text-xs text-zinc-600">
                updated {timeAgo(p.updatedAt)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Cover({ url, name }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-32 w-full object-cover border-b border-white/5"
      />
    );
  }
  return (
    <div className="h-32 w-full grid place-items-center border-b border-white/5 bg-white/[0.02]">
      <span className="font-hand text-amber-200 text-3xl opacity-60">
        {name.slice(0, 2).toLowerCase()}
      </span>
    </div>
  );
}

const TOOLS = [
  { href: "/create/ideas", label: "Get ideas", icon: "spark" },
  { href: "/create/script", label: "Write script", icon: "pen" },
  { href: "/create/thumbnail", label: "Thumbnail", icon: "image" },
  { href: "/analyze", label: "Judge", icon: "gauge" },
];

function ToolShortcuts() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {TOOLS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="paper-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform"
        >
          <span className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-amber-200">
            <Icon name={t.icon} size={16} />
          </span>
          <span className="text-sm text-zinc-200">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
