"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LeaderboardProject = {
  rank: number;
  id: number | string;
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
  tierBadge?: string;
  scoreBadge?: string;
  transparencyBadge?: string;
  trustBonus: number;

  coverageRatio: number;
  mismatchWallets: number;
  lowSolWallets: number;

  marketCap?: number | null;
  marketCapLabel?: string;

  createdAt?: string;
  updatedAt?: string;

  dashboardUrl?: string;
  embedUrl?: string;
  sealUrl?: string;
};

type LeaderboardStats = {
  totalProjects: number;
  verifiedProjects: number;
  platinumProjects: number;
  goldProjects: number;
  silverProjects: number;
  totalVerifiedWallets: number;
  averageTrustScore: number;
};

type LeaderboardSections = {
  topVerifiedProjects: LeaderboardProject[];
  topTrustScores: LeaderboardProject[];
  recentlyVerified: LeaderboardProject[];
  highestTransparency: LeaderboardProject[];
};

const emptyStats: LeaderboardStats = {
  totalProjects: 0,
  verifiedProjects: 0,
  platinumProjects: 0,
  goldProjects: 0,
  silverProjects: 0,
  totalVerifiedWallets: 0,
  averageTrustScore: 0,
};

const emptySections: LeaderboardSections = {
  topVerifiedProjects: [],
  topTrustScores: [],
  recentlyVerified: [],
  highestTransparency: [],
};

type SortKey = "score" | "verification" | "tier" | "wallets" | "updated";
type TierFilter =
  | "All"
  | "Platinum"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Starter"
  | "Unverified";

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)}%`;
}

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

function gradeTone(grade: string) {
  if (grade === "A") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  }

  if (grade === "B") {
    return "border-cyan-400/30 bg-cyan-500/15 text-cyan-200";
  }

  if (grade === "C") {
    return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  }

  if (grade === "D") {
    return "border-orange-400/30 bg-orange-500/15 text-orange-200";
  }

  return "border-rose-400/30 bg-rose-500/15 text-rose-200";
}

function statusTone(status: string) {
  const s = String(status || "").toLowerCase();

  if (s.includes("excellent") || s.includes("trusted") || s.includes("low")) {
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

function badgeTone(label?: string) {
  const value = String(label || "").toLowerCase();

  if (value.includes("top 10") || value.includes("platinum")) {
    return "border-purple-300/40 bg-purple-500/20 text-purple-100";
  }

  if (value.includes("gold") || value.includes("elite")) {
    return "border-yellow-300/40 bg-yellow-500/20 text-yellow-100";
  }

  if (value.includes("silver") || value.includes("strong")) {
    return "border-cyan-300/40 bg-cyan-500/20 text-cyan-100";
  }

  if (value.includes("needs") || value.includes("pending")) {
    return "border-zinc-400/30 bg-zinc-500/15 text-zinc-200";
  }

  return "border-white/10 bg-white/[0.06] text-zinc-200";
}

function medalForRank(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function marketCapLabel(project: LeaderboardProject) {
  if (project.marketCapLabel) return project.marketCapLabel;

  if (typeof project.marketCap === "number") {
    return `$${project.marketCap.toLocaleString()}`;
  }

  return "Coming soon";
}

function safeProjects(value?: LeaderboardProject[]) {
  return Array.isArray(value) ? value : [];
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
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

function ProgressBar({
  value,
  tone = "emerald",
}: {
  value: number;
  tone?: "emerald" | "cyan" | "purple";
}) {
  const width = `${Math.min(100, Math.max(0, value || 0))}%`;

  const barClass =
    tone === "purple"
      ? "bg-purple-300"
      : tone === "cyan"
        ? "bg-cyan-300"
        : "bg-emerald-300";

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
    </div>
  );
}

function BadgePill({ label }: { label?: string }) {
  if (!label) return null;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${badgeTone(
        label
      )}`}
    >
      {label}
    </span>
  );
}

function SectionProjectCard({
  project,
  variant,
}: {
  project: LeaderboardProject;
  variant: "verified" | "score" | "recent" | "transparent";
}) {
  const accent =
    variant === "verified"
      ? "text-emerald-200"
      : variant === "score"
        ? "text-cyan-200"
        : variant === "recent"
          ? "text-purple-200"
          : "text-yellow-200";

  return (
    <Link
      href={`/token/${project.slug}`}
      className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-black ${accent}`}>
              {medalForRank(project.rank)}
            </span>
            <span className="break-words font-black text-white">
              {project.name}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-400">
            <span>{project.symbol}</span>
            <span>•</span>
            <span>/token/{project.slug}</span>
          </div>
        </div>

        <div
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${tierTone(
            project.verificationTier
          )}`}
        >
          {project.tierBadge || project.verificationTier}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase text-zinc-500">Score</div>
          <div className="mt-1 font-black text-white">{project.score}/100</div>
        </div>

        <div>
          <div className="text-xs uppercase text-zinc-500">Verified</div>
          <div className="mt-1 font-black text-white">
            {project.verifiedWallets}/{project.disclosedWallets}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase text-zinc-500">Updated</div>
          <div className="mt-1 font-black text-white">
            {formatDate(project.updatedAt || project.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar
          value={variant === "score" ? project.score : project.verificationRate}
          tone={variant === "score" ? "cyan" : "emerald"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <BadgePill label={project.transparencyBadge} />
        <BadgePill label={project.scoreBadge} />
      </div>
    </Link>
  );
}

function LeaderboardSection({
  title,
  subtitle,
  projects,
  variant,
}: {
  title: string;
  subtitle: string;
  projects: LeaderboardProject[];
  variant: "verified" | "score" | "recent" | "transparent";
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
        {title}
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>

      <div className="mt-5 space-y-3">
        {projects.length ? (
          projects.slice(0, 5).map((project) => (
            <SectionProjectCard
              key={`${title}-${project.slug}`}
              project={project}
              variant={variant}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-300">
            No projects available yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransparencyLeaderboardPage() {
  const [projects, setProjects] = useState<LeaderboardProject[]>([]);
  const [sections, setSections] = useState<LeaderboardSections>(emptySections);
  const [stats, setStats] = useState<LeaderboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("All");
  const [sortBy, setSortBy] = useState<SortKey>("score");

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

      setProjects(safeProjects(data.projects));
      setSections({
        topVerifiedProjects: safeProjects(data.sections?.topVerifiedProjects),
        topTrustScores: safeProjects(data.sections?.topTrustScores),
        recentlyVerified: safeProjects(data.sections?.recentlyVerified),
        highestTransparency: safeProjects(data.sections?.highestTransparency),
      });
      setStats(data.stats || emptyStats);
      setGeneratedAt(data.generatedAt || "");
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

      if (sortBy === "updated") {
        return (
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
      }

      return Number(b.score || 0) - Number(a.score || 0);
    });

    return list.map((project, index) => ({
      ...project,
      displayRank: index + 1,
    }));
  }, [projects, tierFilter, sortBy]);

  const fallbackAverageScore = projects.length
    ? Number(
        (
          projects.reduce((sum, project) => sum + Number(project.score || 0), 0) /
          projects.length
        ).toFixed(2)
      )
    : 0;

  const tierCounts = {
    Platinum: projects.filter((p) => p.verificationTier === "Platinum").length,
    Gold: projects.filter((p) => p.verificationTier === "Gold").length,
    Silver: projects.filter((p) => p.verificationTier === "Silver").length,
    Bronze: projects.filter((p) => p.verificationTier === "Bronze").length,
    Starter: projects.filter((p) => p.verificationTier === "Starter").length,
    Unverified: projects.filter((p) => p.verificationTier === "Unverified").length,
  };

  const totalVerifiedWallets =
    stats.totalVerifiedWallets ||
    projects.reduce((sum, project) => sum + Number(project.verifiedWallets || 0), 0);

  const verifiedProjectCount =
    stats.verifiedProjects || projects.filter((project) => project.verifiedWallets > 0).length;

  const averageScore = stats.averageTrustScore || fallbackAverageScore;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-8">
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
              href="/verification-registry"
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
            >
              Registry
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
                WEB3MB Public Trust Leaderboard
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                Investor-Grade Transparency Rankings
              </h1>

              <p className="mt-5 max-w-5xl text-base leading-8 text-zinc-300">
                Public ranking of Solana token projects by WEB3MB Trust Score,
                verified owner wallets, disclosure coverage, risk signals, and
                transparency readiness. Projects with stronger wallet verification
                and cleaner monitoring signals rise higher.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-purple-300/30 bg-purple-500/15 px-4 py-2 text-sm font-black text-purple-100">
                  🏆 Top Verified
                </span>
                <span className="rounded-full border border-yellow-300/30 bg-yellow-500/15 px-4 py-2 text-sm font-black text-yellow-100">
                  🥇 Platinum
                </span>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-4 py-2 text-sm font-black text-cyan-100">
                  🥈 Gold / 🥉 Silver
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={loadLeaderboard}
                className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
              >
                Refresh Rankings
              </button>

              <Link
                href="/app/billing"
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-5 py-3 text-center text-sm font-bold text-emerald-100 hover:bg-emerald-500/25"
              >
                Verify Your Project
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatBox
              label="Ranked Projects"
              value={stats.totalProjects || projects.length}
              hint="Projects included in the public leaderboard."
            />

            <StatBox
              label="Verified Projects"
              value={verifiedProjectCount}
              hint="Projects with at least one verified owner wallet."
            />

            <StatBox
              label="Platinum Projects"
              value={stats.platinumProjects || tierCounts.Platinum}
              hint="Highest WEB3MB verification tier."
            />

            <StatBox
              label="Verified Wallets"
              value={totalVerifiedWallets}
              hint="Total owner wallets verified across ranked projects."
            />

            <StatBox
              label="Average Score"
              value={`${Math.round(averageScore || 0)}/100`}
              hint="Average WEB3MB Trust Score."
            />
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Verification Tier Breakdown
                </div>

                <h2 className="mt-3 text-2xl font-black text-white">
                  Public Wallet Ownership Coverage
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-300">
                  WEB3MB tiers help investors identify which projects have
                  disclosed and verified owner-controlled wallets.
                </p>
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

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            <LeaderboardSection
              title="🏆 Top Verified Projects"
              subtitle="Projects ranked by verified wallet coverage and verification tier."
              projects={sections.topVerifiedProjects}
              variant="verified"
            />

            <LeaderboardSection
              title="📈 Highest Trust Scores"
              subtitle="Projects with the strongest WEB3MB Trust Score signals."
              projects={sections.topTrustScores}
              variant="score"
            />

            <LeaderboardSection
              title="🆕 Recently Verified"
              subtitle="Projects with recently approved owner wallet verification records."
              projects={sections.recentlyVerified}
              variant="recent"
            />

            <LeaderboardSection
              title="🌎 Highest Transparency"
              subtitle="Projects ranked by verification, disclosure coverage, and low-risk signals."
              projects={sections.highestTransparency}
              variant="transparent"
            />
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  Investor Leaderboard Controls
                </div>

                <h2 className="mt-3 text-2xl font-black">
                  Compare Project Transparency
                </h2>

                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Filter by verification tier or sort by score, verified
                  wallets, verification percentage, or most recent update.
                </p>
              </div>

              <div className="grid w-full gap-4 md:grid-cols-2 lg:max-w-2xl">
                <label className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Filter by Tier
                  </div>

                  <select
                    value={tierFilter}
                    onChange={(event) => setTierFilter(event.target.value as TierFilter)}
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
                    onChange={(event) => setSortBy(event.target.value as SortKey)}
                    className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="score">Trust Score</option>
                    <option value="verification">Verification Rate</option>
                    <option value="tier">Verification Tier</option>
                    <option value="wallets">Verified Wallets</option>
                    <option value="updated">Recently Updated</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
            <div className="hidden grid-cols-[70px_minmax(220px,1.1fr)_110px_130px_170px_150px_120px_130px_140px_170px] gap-4 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 2xl:grid">
              <div>Rank</div>
              <div>Project</div>
              <div>Score</div>
              <div>Grade</div>
              <div>Tier</div>
              <div>Verified</div>
              <div>Bonus</div>
              <div>Market Cap</div>
              <div>Updated</div>
              <div>Badges</div>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-10 text-center text-zinc-300">
                  Loading leaderboard...
                </div>
              ) : filteredProjects.length ? (
                filteredProjects.map((project: LeaderboardProject & { displayRank?: number }) => (
                  <Link
                    key={project.slug}
                    href={`/token/${project.slug}`}
                    className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.04] 2xl:grid-cols-[70px_minmax(220px,1.1fr)_110px_130px_170px_150px_120px_130px_140px_170px] 2xl:items-center"
                  >
                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Rank
                      </div>
                      <div className="text-2xl font-black text-white">
                        {medalForRank(project.displayRank || project.rank)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
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
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Trust Score
                      </div>
                      <div className="text-2xl font-black text-white">
                        {project.score}
                      </div>
                      <ProgressBar value={project.score} tone="cyan" />
                      <div className="mt-1 text-xs text-zinc-500">/100</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
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
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Verification Tier
                      </div>
                      <div
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${tierTone(
                          project.verificationTier
                        )}`}
                      >
                        {project.tierBadge || project.verificationTier}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-500">
                        {project.verificationLabel}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Verified Wallets
                      </div>
                      <div className="text-sm font-black text-white">
                        {project.verifiedWallets}/{project.disclosedWallets}
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={project.verificationRate} tone="emerald" />
                      </div>
                      <div className="mt-2 text-xs font-bold text-emerald-200">
                        {formatPercent(project.verificationRate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Trust Bonus
                      </div>
                      <div className="text-xl font-black text-cyan-300">
                        +{project.trustBonus || 0}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        verification boost
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Market Cap
                      </div>
                      <div className="text-sm font-black text-white">
                        {marketCapLabel(project)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Last Updated
                      </div>
                      <div className="text-sm font-black text-white">
                        {formatDate(project.updatedAt || project.createdAt)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 2xl:hidden">
                        Badges
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <BadgePill label={project.transparencyBadge} />
                        <BadgePill label={project.scoreBadge} />
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

          <div className="mt-6 flex flex-col gap-3 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
            <div>
              Rankings update from live WEB3MB Trust Score and wallet verification data.
            </div>

            <div>Last generated: {generatedAt ? formatDate(generatedAt) : "—"}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
