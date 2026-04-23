import Link from "next/link";

export default function AppHome() {
  return (
    <main className="min-h-screen bg-[#030712] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            WEB3MB / OWNER HUB
          </div>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            WEB3MB Owner Dashboard
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            Manage crypto transparency projects, verify wallets, review alerts,
            and monitor public trust signals.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/app/projects"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">My Projects</div>
              <p className="mt-2 text-sm text-zinc-400">
                View and manage transparency projects.
              </p>
            </Link>

            <Link
              href="/app/projects/new"
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 transition hover:bg-cyan-500/15"
            >
              <div className="text-lg font-semibold text-cyan-200">
                Create Project
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Add a new token for verification.
              </p>
            </Link>

            <Link
              href="/app/verify-wallets"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">
                Wallet Verification
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Check live wallet balances and disclosures.
              </p>
            </Link>

            <Link
              href="/app/alerts"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">
                Alert Center
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Review critical transparency alerts.
              </p>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/transparency"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
            >
              Public Transparency Directory
            </Link>

            <Link
              href="/pricing"
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
