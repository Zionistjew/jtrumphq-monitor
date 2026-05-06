import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
              WEB3MB Projects
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              My Transparency Projects
            </h1>

            <p className="mt-4 max-w-3xl text-zinc-400">
              Manage token transparency dashboards, disclosures, trust scoring,
              and monitoring.
            </p>
          </div>

          <Link
            href="/app/billing"
            className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-4 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
          >
            Create Project
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Ready To Launch
            </div>

            <h2 className="mt-6 text-3xl font-bold">
              Create Your First Transparency Dashboard
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Launch a public-facing WEB3MB trust dashboard with wallet
              disclosure, trust scoring, alerts, and real-time Solana wallet
              monitoring.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/app/billing"
                className="rounded-2xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-black transition hover:bg-cyan-400"
              >
                Activate Billing & Create Project
              </Link>

              <Link
                href="/transparency"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Transparency Hub
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              Wallet Verification
            </div>

            <h3 className="mt-4 text-xl font-bold">
              Public Wallet Disclosure
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Show investors exactly where treasury, liquidity, marketing,
              development, and team wallets are allocated.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              Trust Scoring
            </div>

            <h3 className="mt-4 text-xl font-bold">
              Real-Time Trust Signals
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Generate live transparency scoring based on disclosures, wallet
              activity, liquidity visibility, and verification status.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              Live Monitoring
            </div>

            <h3 className="mt-4 text-xl font-bold">
              Continuous Blockchain Tracking
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Monitor large transfers, suspicious activity, treasury movement,
              and trust-impacting events automatically.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
