import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const activePlan = "Starter";
  const status = "Active";
  const expiration = "30 days from payment";
  const projectCount = 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div>
          <h1 className="text-4xl font-bold">User Dashboard</h1>
          <p className="mt-3 text-zinc-400">
            Manage your plan, create projects, and publish transparency dashboards.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="text-sm text-zinc-400">Active Plan</div>
            <div className="mt-2 text-2xl font-semibold">{activePlan}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="text-sm text-zinc-400">Status</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-400">
              {status}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="text-sm text-zinc-400">Expiration</div>
            <div className="mt-2 text-lg font-semibold">{expiration}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="text-sm text-zinc-400">Projects</div>
            <div className="mt-2 text-2xl font-semibold">{projectCount}</div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8">
            <h2 className="text-2xl font-semibold">Get Started</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Create your first project and publish a transparency dashboard
              investors can review publicly.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/admin/create-project"
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-black hover:bg-cyan-400"
              >
                Create Project
              </Link>

              <Link
                href="/transparency"
                className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                View Transparency Directory
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8">
            <h2 className="text-2xl font-semibold">Account Value</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>Public project trust page</li>
              <li>Wallet disclosure and treasury visibility</li>
              <li>Investor-facing transparency dashboard</li>
              <li>Upgradeable SaaS plan structure</li>
            </ul>

            <Link
              href="/pricing"
              className="mt-6 inline-block rounded-xl border border-cyan-500/30 px-5 py-3 text-sm font-medium text-cyan-300 hover:bg-cyan-500/10"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
