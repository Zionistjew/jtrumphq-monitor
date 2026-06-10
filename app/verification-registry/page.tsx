"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RegistryRow = {
  projectId: string | number;
  projectSlug: string;
  projectName: string;
  projectSymbol: string;
  mint?: string | null;

  walletId: string | number;
  walletLabel: string;
  walletAddress: string;
  shortWalletAddress: string;

  status: string;
  verified: boolean;
  verifiedAt?: string | null;
  reviewedBy?: string;

  projectVerifiedWallets: number;
  projectTotalWallets: number;
  verificationRate: number;
  verificationTier: string;
  verificationTierRank: number;

  dashboardUrl: string;
  sealUrl: string;
};

type RegistryStats = {
  verifiedWallets: number;
  verifiedProjects: number;
  platinumProjects: number;
  generatedAt?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortAddress(address?: string | null) {
  if (!address) return "—";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function tierTone(tier: string) {
  const t = String(tier || "").toLowerCase();

  if (t === "platinum") return "border-purple-300/40 bg-purple-500/20 text-purple-100";
  if (t === "gold") return "border-yellow-300/40 bg-yellow-500/20 text-yellow-100";
  if (t === "silver") return "border-slate-300/40 bg-slate-400/20 text-slate-100";
  if (t === "bronze") return "border-orange-300/40 bg-orange-500/20 text-orange-100";
  if (t === "starter") return "border-cyan-300/40 bg-cyan-500/20 text-cyan-100";

  return "border-zinc-400/30 bg-zinc-500/15 text-zinc-200";
}

function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>

      <div className="mt-3 text-3xl font-black text-white">{value}</div>

      <div className="mt-2 text-sm leading-6 text-zinc-400">{hint}</div>
    </div>
  );
}

export default function VerificationRegistryPage() {
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [stats, setStats] = useState<RegistryStats>({
    verifiedWallets: 0,
    verifiedProjects: 0,
    platinumProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [search, setSearch] = useState("");

  async function loadRegistry() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/verification-registry", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load verification registry");
      }

      setRows(data.registry || []);
      setStats(data.stats || {});
    } catch (err: any) {
      setError(err?.message || "Failed to load verification registry");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistry();
  }, []);

  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (tierFilter !== "All") {
      list = list.filter((row) => row.verificationTier === tierFilter);
    }

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((row) => {
        return (
          row.projectName.toLowerCase().includes(q) ||
          row.projectSymbol.toLowerCase().includes(q) ||
          row.projectSlug.toLowerCase().includes(q) ||
          row.walletLabel.toLowerCase().includes(q) ||
          row.walletAddress.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [rows, tierFilter, search]);

const projectSummaries = useMemo(() => {
  const projects = new Map();

  filteredRows.forEach((row) => {
    const key = row.projectSlug;

    if (!projects.has(key)) {
      projects.set(key, {
        projectName: row.projectName,
        projectSymbol: row.projectSymbol,
        projectSlug: row.projectSlug,
        verificationTier: row.verificationTier,
        verifiedWallets: row.projectVerifiedWallets,
        totalWallets: row.projectTotalWallets,
        verificationRate: row.verificationRate,
      });
    }
  });

  return Array.from(projects.values());
}, [filteredRows]);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/transparency">
            <img
              src="/WEB3MB-L.png"
              alt="WEB3MB"
              className="h-20 w-auto object-contain"
            />
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/transparency"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"
            >
              Directory
            </Link>

            <Link
              href="/transparency/leaderboard"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"
            >
              Leaderboard
            </Link>

            <Link
              href="/app/billing"
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
            >
              Get Verified
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-5xl">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                WEB3MB Verification Registry
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                Public Proof of Verified Project Wallets
              </h1>

              <p className="mt-5 max-w-5xl text-base leading-8 text-zinc-300">
                The WEB3MB Verification Registry lists project wallets that have
                completed owner verification. This creates a public proof layer
                for investors, communities, exchanges, and launch partners.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-100">
                  ✅ Verified Wallets
                </span>
                <span className="rounded-full border border-purple-300/30 bg-purple-500/15 px-4 py-2 text-sm font-black text-purple-100">
                  🥇 Platinum Projects
                </span>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-4 py-2 text-sm font-black text-cyan-100">
                  Public Transparency Record
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={loadRegistry}
                className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
              >
                Refresh Registry
              </button>

              <Link
                href="/app/billing"
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-5 py-3 text-center text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
              >
                Verify Your Wallets
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatBox
              label="Verified Wallets"
              value={stats.verifiedWallets || rows.length}
              hint="Wallets publicly confirmed by WEB3MB verification."
            />

            <StatBox
              label="Verified Projects"
              value={stats.verifiedProjects || 0}
              hint="Projects with at least one verified wallet."
            />

            <StatBox
              label="Platinum Projects"
              value={stats.platinumProjects || 0}
              hint="Projects with full disclosed wallet verification."
            />

            <StatBox
              label="Registry Status"
              value="Live"
              hint="Registry updates from live WEB3MB verification records."
            />
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Registry Controls
                </div>

                <h2 className="mt-3 text-2xl font-black text-white">
                  Search Verified Wallet Records
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-300">
                  Search by project, symbol, slug, wallet label, or wallet
                  address. Filter by verification tier.
                </p>
              </div>

              <div className="grid w-full gap-4 md:grid-cols-2 lg:max-w-2xl">
                <label className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
                    Search
                  </div>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Project, wallet, label, address..."
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
                    Filter by Tier
                  </div>

                  <select
                    value={tierFilter}
                    onChange={(event) => setTierFilter(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                  >
                    <option>All</option>
                    <option>Platinum</option>
                    <option>Gold</option>
                    <option>Silver</option>
                    <option>Bronze</option>
                    <option>Starter</option>
                    <option>Unverified</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

         <div className="mt-8">
  <div className="mb-4">
    <h2 className="text-2xl font-black text-white">
      Verified Projects
    </h2>

    <p className="mt-1 text-sm text-zinc-400">
      Project-level verification summaries.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {projectSummaries.map((project) => (
      <div
        key={project.projectSlug}
        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-black text-white">
              {project.projectName}
            </div>

            <div className="mt-1 text-sm text-zinc-400">
              {project.projectSymbol}
            </div>
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-xs font-black ${tierTone(
              project.verificationTier
            )}`}
          >
            {project.verificationTier}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <div className="text-lg font-black text-emerald-200">
            A+ • Perfect
          </div>

          <div className="mt-1 text-sm text-zinc-300">
            {project.verifiedWallets}/{project.totalWallets} Verified
          </div>

          <div className="text-sm text-zinc-300">
            {project.verificationRate}% Verification Rate
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href={`/token/${project.projectSlug}`}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
          >
            Dashboard
          </Link>

          <Link
            href={`/embed/${project.projectSlug}`}
            className="rounded-xl border border-purple-400/30 bg-purple-500/15 px-4 py-2 text-sm font-bold text-purple-100 hover:bg-purple-500/25"
          >
            Trust Seal
          </Link>
        </div>
      </div>
    ))}
  </div>
</div>          

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
            <div className="hidden grid-cols-[minmax(220px,1.1fr)_190px_minmax(260px,1fr)_140px_160px_150px_140px] gap-4 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 xl:grid">
              <div>Project</div>
              <div>Wallet Label</div>
              <div>Wallet Address</div>
              <div>Status</div>
              <div>Tier</div>
              <div>Verified Date</div>
              <div>Dashboard</div>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-10 text-center text-zinc-300">
                  Loading verification registry...
                </div>
              ) : filteredRows.length ? (
                filteredRows.map((row) => (
                  <div
                    key={`${row.projectSlug}-${row.walletAddress}`}
                    className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(220px,1.1fr)_190px_minmax(260px,1fr)_140px_160px_150px_140px] xl:items-center"
                  >
                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Project
                      </div>

                      <Link
                        href={`/token/${row.projectSlug}`}
                        className="break-words text-lg font-black text-white hover:text-cyan-200"
                      >
                        {row.projectName}
                      </Link>

                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-400">
                        <span>{row.projectSymbol}</span>
                        <span>•</span>
                        <span>/token/{row.projectSlug}</span>
                      </div>

                      <div className="mt-2 truncate font-mono text-xs text-zinc-500">
                        {shortAddress(row.mint)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Wallet Label
                      </div>

                      <div className="font-black text-white">
                        {row.walletLabel}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Wallet Address
                      </div>

                      <div className="break-all font-mono text-sm text-zinc-300">
                        {row.walletAddress}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {row.shortWalletAddress}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Status
                      </div>

                      <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-200">
                        ✅ Verified
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Tier
                      </div>

                      <div
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${tierTone(
                          row.verificationTier
                        )}`}
                      >
                        {row.verificationTier}
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        {row.projectVerifiedWallets}/{row.projectTotalWallets} wallets
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Verified Date
                      </div>

                      <div className="font-black text-white">
                        {formatDate(row.verifiedAt)}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        by {row.reviewedBy || "WEB3MB"}
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/token/${row.projectSlug}`}
                        className="inline-flex rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-zinc-300">
                  No verified wallet records match this filter.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
            <div>
              Registry records are generated from approved WEB3MB wallet
              verification requests and verified project wallet records.
            </div>

            <div>
              Last generated: {formatDate(stats.generatedAt)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
