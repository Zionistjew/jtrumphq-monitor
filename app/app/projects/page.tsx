import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function ProjectCard({
  id,
  name,
  symbol,
  slug,
}: {
  id: number;
  name: string;
  symbol: string;
  slug: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition hover:border-cyan-400/20 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Project
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white">{name}</h2>
          <p className="mt-2 text-zinc-300">{symbol}</p>
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
          Live
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
          Slug
        </div>
        <div className="mt-2 break-all text-white">{slug}</div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/app/projects/${id}`}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          Open Owner Console
        </Link>

        <Link
          href={`/token/${slug}`}
          className="rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200"
        >
          View Public Dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-white">Not authenticated</div>;
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, symbol")
    .eq("owner_id", user.id)
    .order("id", { ascending: false });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            Project Management
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            My Projects
          </h1>

          <p className="mt-4 max-w-3xl text-zinc-400">
            Manage your transparency projects, review owner-side details, and
            open each public dashboard from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/app"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Back to Home
          </Link>

          <Link
            href="/app/projects/new"
            className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
          >
            Create New Project
          </Link>
        </div>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Owner Portfolio</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Only projects owned by your account appear here.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            Total Projects: {projects?.length || 0}
          </div>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
            <p className="text-lg text-zinc-300">No projects yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Create your first WEB3MB transparency project to get started.
            </p>

            <div className="mt-6">
              <Link
                href="/app/projects/new"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Create First Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                symbol={project.symbol}
                slug={project.slug}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
