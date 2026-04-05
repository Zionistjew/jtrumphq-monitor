import { getAllProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const projects = await getAllProjects();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-red-950/20 p-10 shadow-2xl">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center rounded-full border border-red-800 bg-red-950/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-300">
              Platform Mode
            </div>

            <h1 className="text-4xl font-bold md:text-6xl">
              Token Transparency Infrastructure
            </h1>

            <p className="max-w-3xl text-lg text-zinc-300">
              Build branded transparency dashboards, wallet monitoring, and trust
              signals for crypto projects.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/admin/create-project"
                className="rounded-xl border border-red-700 bg-red-900/30 px-5 py-3 text-sm text-red-200 hover:bg-red-900/50"
              >
                Create Project
              </a>

              <a
                href="/transparency"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm hover:bg-zinc-800"
              >
                Legacy Dashboard
              </a>

              <a
                href="/alerts"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm hover:bg-zinc-800"
              >
                Alert Feed
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">Use Case</div>
            <div className="mt-2 text-2xl font-bold">Transparency as a Service</div>
            <p className="mt-3 text-sm text-zinc-400">
              Give token projects investor-grade wallet disclosure, alerting, and
              trust signals.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">Monetization</div>
            <div className="mt-2 text-2xl font-bold">Multi-project SaaS</div>
            <p className="mt-3 text-sm text-zinc-400">
              Offer hosted dashboards, alert subscriptions, and branded public
              monitoring pages.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">Current Status</div>
            <div className="mt-2 text-2xl font-bold">Production Mode</div>
            <p className="mt-3 text-sm text-zinc-400">
              Projects are now stored in Supabase instead of local files.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <div className="text-sm text-zinc-500">
              {projects.length} live project{projects.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <a
                key={project.slug}
                href={`/token/${project.slug}`}
                className="rounded-2xl border border-zinc-800 bg-black/30 p-6 transition hover:border-red-700 hover:bg-red-950/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-zinc-400">{project.symbol}</div>
                    <div className="mt-1 text-2xl font-bold">{project.name}</div>
                  </div>

                  <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                    /token/{project.slug}
                  </div>
                </div>

                <p className="mt-4 text-sm text-zinc-400">
                  {project.description}
                </p>

                <div className="mt-4 text-sm text-red-300">Open project →</div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
