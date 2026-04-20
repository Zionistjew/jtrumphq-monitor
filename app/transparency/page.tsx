import Link from "next/link";

type Project = {
  name: string;
  symbol: string;
  slug: string;
  description?: string;
  status?: string;
  wallets?: Array<{
    label: string;
    category: string;
    address: string;
  }>;
};

async function getProjects(): Promise<Project[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.web3mb.com";

    const res = await fetch(`${baseUrl}/api/projects`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.projects)) return data.projects;

    return [];
  } catch {
    return [];
  }
}

export default async function TransparencyPage() {
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
            Public Transparency Directory
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            WEB3MB Transparency Center
          </h1>

          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Explore public crypto transparency profiles, disclosed wallets,
            and investor-facing project accountability dashboards.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="mx-auto mt-14 max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-900/70 p-10 text-center shadow-lg">
            <h2 className="text-3xl font-semibold">No live projects yet</h2>
            <p className="mt-4 text-base text-zinc-400">
              Once projects are created, they will appear here with public
              transparency dashboards.
            </p>

            <Link
              href="/admin/create-project"
              className="mt-8 inline-block rounded-xl bg-cyan-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-400"
            >
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.slug}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{project.name}</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {project.symbol}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                    {project.status || "Active"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {project.description ||
                    "Public transparency dashboard with disclosed wallets, treasury visibility, and token accountability."}
                </p>

                <div className="mt-4 text-sm text-zinc-500">
                  Wallets listed: {project.wallets?.length || 0}
                </div>

                <Link
                  href={`/token/${project.slug}`}
                  className="mt-6 inline-block text-sm font-medium text-cyan-400"
                >
                  View dashboard →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
