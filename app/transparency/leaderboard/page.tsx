"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LeaderboardProject = {
  rank: number;
  id: number;
  slug: string;
  name: string;
  symbol: string;
  mint?: string | null;
  score: number;
  grade: string;
  status: string;
  disclosedWallets: number;
  verifiedWallets: number;
  verificationRate: number;
  verificationTier: string;
  verificationTierRank: number;
  verificationLabel: string;
  trustBonus: number;
  coverageRatio: number;
  mismatchWallets: number;
  lowSolWallets: number;
  createdAt?: string;
};

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function shortAddress(address?: string | null) {
  if (!address) return "—";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function gradeTone(grade: string) {
  if (grade === "A") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  if (grade === "B") return "border-cyan-400/30 bg-cyan-500/15 text-cyan-200";
  if (grade === "C") return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  if (grade === "D") return "border-orange-400/30 bg-orange-500/15 text-orange-200";
  return "border-rose-400/30 bg-rose-500/15 text-rose-200";
}

function statusTone(status: string) {
  const s = String(status || "").toLowerCase();

  if (s.includes("excellent") || s.includes("trusted")) {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  }

  if (s.includes("moderate")) {
    return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  }

  if (s.includes("warning")) {
    return "border-orange-400/30 bg-orange-500/15 text-orange-200";
  }

  return "border-rose-400/30 bg-rose-500/15 text-rose-200";
}

function tierTone(tier: string) {
  const t = String(tier || "").toLowerCase();

  if (t === "platinum") {
    return "border-purple-300/40 bg-purple-500/20 text-purple-100";
  }

  if (t === "gold") {
    return "border-yellow-300/40 bg-yellow-500/20 text-yellow-100";
  }

  if (t === "silver") {
    return "border-slate-300/40 bg-slate-400/20 text-slate-100";
  }

  if (t === "bronze") {
    return "border-orange-300/40 bg-orange-500/20 text-orange-100";
  }

  if (t === "starter") {
    return "border-cyan-300/40 bg-cyan-500/20 text-cyan-100";
  }

  return "border-zinc-400/30 bg-zinc-500/15 text-zinc-200";
}

function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>

      <div className="mt-3 break-words text-3xl font-black text-white">
        {value}
      </div>

      {hint ? <div className="mt-2 text-sm leading-6 text-zinc-400">{hint}</div> : null}
    </div>
  );
}

export default function TransparencyLeaderboardPage() {
  const [projects, setProjects] = useState<LeaderboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "score" | "verification" | "tier" | "wallets"
  >("score");

  async function loadLeaderboard() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/transparency/leaderboard", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load leaderboard");
      }

      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (tierFilter !== "All") {
      list = list.filter((project) => project.verificationTier === tierFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "verification") {
        return Number(b.verificationRate || 0) - Number(a.verificationRate || 0);
      }

      if (sortBy === "tier") {
        return Number(b.verificationTierRank || 0) - Number(a.verificationTierRank || 0);
      }

      if (sortBy === "wallets") {
        return Number(b.verifiedWallets || 0) - Number(a.verifiedWallets || 0);
      }

      return Number(b.score || 0) - Number(a.score || 0);
    });

    return list.map((project, index) => ({
      ...project,
      displayRank: index + 1,
    }));
  }, [projects, tierFilter, sortBy]);

  const averageScore = projects.length
    ? Math.round(
        projects.reduce((sum, project) => sum + Number(project.score || 0), 0) /
          projects.length
      )
    : 0;

  const verifiedProjects = projects.filter(
    (project) =>
      project.disclosedWallets > 0 &&
      project.verifiedWallets === project.disclosedWallets
  ).length;

  const tierCounts = {
    Platinum: projects.filter((p) => p.verificationTier === "Platinum").length,
    Gold: projects.filter((p) => p.verificationTier === "Gold").length,
    Silver: projects.filter((p) => p.verificationTier === "Silver").length,
    Bronze: projects.filter((p) => p.verificationTier === "Bronze").length,
    Starter: projects.filter((p) => p.verificationTier === "Starter").length,
    Unverified: projects.filter((p) => p.verificationTier === "Unverified").length,
  };

  const topVerified = [...projects]
    .filter((project) => project.verifiedWallets > 0)
    .sort((a, b) => Number(b.verificationRate) - Number(a.verificationRate))
    .slice(0, 3);

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
              href="/app/billing"
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
            >
              Get Verified
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                WEB3MB Public Trust Leaderboard
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                Verified Project Rankings
              </h1>

              <p className="mt-5 max-w-4xl text-base leading-8 text-zinc-300">
                Ranked public view of token projects by WEB3MB Trust Score,
                wallet ownership verification, verified wallet percentage, and
                transparency signals.
              </p>
            </div>

            <button
              onClick={loadLeaderboard}
              className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatBox
              label="Ranked Projects"
              value={projects.length}
              hint="Projects included in the public leaderboard."
            />

            <StatBox
              label="Average Score"
              value={`${averageScore}/100`}
              hint="Average WEB3MB Trust Score."
            />

            <StatBox
              label="Fully Verified"
              value={verifiedProjects}
              hint="Projects with all disclosed wallets verified."
            />

            <StatBox
              label="Silver+ Projects"
              value={
                tierCounts.Silver + tierCounts.Gold + tierCounts.Platinum
              }
              hint="Projects with meaningful verification coverage."
            />
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Verification Tier Breakdown
                </div>

                <h2 className="mt-3 text-2xl font-black text-white">
                  Wallet Ownership Verification
                </h2>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(tierCounts).map(([tier, count]) => (
                  <div
                    key={tier}
                    className={`rounded-2xl border px-4 py-3 text-center ${tierTone(
                      tier
                    )}`}
                  >
                    <div className="text-xs font-black uppercase tracking-[0.14em]">
                      {tier}
                    </div>
                    <div className="mt-1 text-2xl font-black">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Top Verification Coverage
              </div>

              <div className="mt-5 space-y-3">
                {topVerified.length ? (
                  topVerified.map((project) => (
                    <Link
                      key={`top-${project.slug}`}
                      href={`/token/${project.slug}`}
                      className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-white">
                            {project.name}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {project.verifiedWallets}/{project.disclosedWallets} wallets verified
                          </div>
                        </div>

                        <div
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${tierTone(
                            project.verificationTier
                          )}`}
                        >
                          {project.verificationTier}
                        </div>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, project.verificationRate || 0)
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 text-sm font-bold text-cyan-200">
                        {formatPercent(project.verificationRate)}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-300">
                    No verified projects yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Leaderboard Controls
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
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

                <label className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Sort By
                  </div>

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value as
                          | "score"
                          | "verification"
                          | "tier"
                          | "wallets"
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="score">Trust Score</option>
                    <option value="verification">Verification Rate</option>
                    <option value="tier">Verification Tier</option>
                    <option value="wallets">Verified Wallets</option>
                  </select>
                </label>
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-400">
                Verification tiers are based on the percentage of disclosed
                project wallets that have completed WEB3MB owner verification.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
            <div className="hidden grid-cols-[70px_minmax(220px,1.1fr)_120px_150px_170px_160px_130px] gap-4 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 xl:grid">
              <div>Rank</div>
              <div>Project</div>
              <div>Score</div>
              <div>Grade</div>
              <div>Tier</div>
              <div>Verification</div>
              <div>Bonus</div>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-10 text-center text-zinc-300">
                  Loading leaderboard...
                </div>
              ) : filteredProjects.length ? (
                filteredProjects.map((project: any) => (
                  <Link
                    key={project.slug}
                    href={`/token/${project.slug}`}
                    className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.04] xl:grid-cols-[70px_minmax(220px,1.1fr)_120px_150px_170px_160px_130px] xl:items-center"
                  >
                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Rank
                      </div>
                      <div className="text-2xl font-black text-white">
                        #{project.displayRank}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Project
                      </div>
                      <div className="break-words text-lg font-black text-white">
                        {project.name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-400">
                        <span>{project.symbol}</span>
                        <span>•</span>
                        <span>/token/{project.slug}</span>
                      </div>
                      <div className="mt-2 truncate font-mono text-xs text-zinc-500">
                        {shortAddress(project.mint)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Score
                      </div>
                      <div className="text-2xl font-black text-white">
                        {project.score}
                      </div>
                      <div className="text-xs text-zinc-500">/100</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Grade
                      </div>
                      <div
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${gradeTone(
                          project.grade
                        )}`}
                      >
                        Grade {project.grade}
                      </div>
                      <div
                        className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${statusTone(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Verification Tier
                      </div>
                      <div
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${tierTone(
                          project.verificationTier
                        )}`}
                      >
                        {project.verificationTier}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-500">
                        {project.verificationLabel}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Verification
                      </div>
                      <div className="text-sm font-black text-white">
                        {project.verifiedWallets}/{project.disclosedWallets}
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, project.verificationRate || 0)
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs font-bold text-emerald-200">
                        {formatPercent(project.verificationRate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 xl:hidden">
                        Trust Bonus
                      </div>
                      <div className="text-xl font-black text-cyan-300">
                        +{project.trustBonus || 0}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        verification boost
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-10 text-center text-zinc-300">
                  No projects match this leaderboard filter.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
