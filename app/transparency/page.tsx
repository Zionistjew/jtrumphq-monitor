"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TrustFactor = {
  key: string;
  label: string;
  impact: number;
  status: "positive" | "negative" | "neutral";
  detail: string;
};

type Project = {
  projectId: number;
  projectSlug: string;
  projectName: string;
  projectSymbol: string;
  score: number;
  riskLevel: string;
  verificationStatus: string;
  factors?: TrustFactor[];
  stats?: {
    trackedWallets: number;
    healthyWalletReads: number;
    allocationMismatches: number;
    lowSolWarnings: number;
    invalidWallets: number;
    invalidMint: boolean;
    disclosedWalletCoveragePct: number;
  };
};

type SortKey =
  | "score_desc"
  | "score_asc"
  | "name_asc"
  | "wallets_desc"
  | "flags_desc";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function riskBadge(risk: string) {
  if (risk === "Low") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (risk === "Moderate") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-red-500/30 bg-red-500/10 text-red-200";
}

function verificationBadge(status: string) {
  if (status === "Verified") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  if (status === "Partial") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-red-500/30 bg-red-500/10 text-red-200";
}

function factorBadge(status: string) {
  if (status === "positive") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "negative") return "border-red-500/20 bg-red-500/10 text-red-300";
  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}

function totalFlags(project: Project) {
  return (
    (project.stats?.allocationMismatches || 0) +
    (project.stats?.lowSolWarnings || 0) +
    (project.stats?.invalidWallets || 0) +
    (project.stats?.invalidMint ? 1 : 0)
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  onClick,
  active,
}: {
  label: string;
  value: number | string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition",
        active ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 bg-white/5",
        onClick && "hover:border-white/20 hover:bg-white/10"
      )}
    >
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </Comp>
  );
}

function PublicSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="min-h-screen w-[310px] shrink-0 border-r border-white/10 bg-[#050816]">
      <div className="sticky top-0 px-4 py-5 sm:px-6 sm:py-8">
        <div>
          <img
            src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
            alt="WEB3MB Logo"
            className="h-24 w-auto object-contain"
          />

          <div className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
            Public Trust Layer
          </div>

          <p className="mt-5 text-sm leading-7 text-zinc-400">
            Discover verified token transparency, wallet disclosures, public trust
            scores, and live on-chain verification signals.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-cyan-300">
              Public
            </div>

            <div className="space-y-3">
              <Link
                href="/transparency"
                className="block rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black"
              >
                Transparency Leaderboard
              </Link>

              <Link
                href="/app"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Owner Hub
              </Link>

              <Link
                href="/app/projects/new"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Create Project
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-cyan-300">
              Operations
            </div>

            <div className="space-y-3">
              <Link
                href="/app/verify-wallets"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Wallet Verification
              </Link>

              <Link
                href="/app/alerts"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Alert Center
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Verification
            </div>
            <div className="mt-3 text-sm font-semibold text-white">
              WEB3MB Public Trust Layer
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Live scoring uses wallet disclosure, allocation integrity, SOL
              readiness, and mint verification.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function TransparencyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  const [riskFilter, setRiskFilter] = useState<"All" | "Low" | "Moderate" | "High">("All");
  const [verificationFilter, setVerificationFilter] = useState<
    "All" | "Verified" | "Partial" | "Needs Review"
  >("All");
  const [sortBy, setSortBy] = useState<SortKey>("score_desc");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/trust-score", { cache: "no-store" });
        const data = await res.json();

        if (data.ok) {
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to load transparency leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (riskFilter !== "All") {
      list = list.filter((p) => p.riskLevel === riskFilter);
    }

    if (verificationFilter !== "All") {
      list = list.filter((p) => p.verificationStatus === verificationFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.projectSlug.toLowerCase().includes(q) ||
          p.projectSymbol.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "score_asc":
          return a.score - b.score;
        case "name_asc":
          return a.projectName.localeCompare(b.projectName);
        case "wallets_desc":
          return (b.stats?.trackedWallets || 0) - (a.stats?.trackedWallets || 0);
        case "flags_desc":
          return totalFlags(b) - totalFlags(a);
        case "score_desc":
        default:
          return b.score - a.score;
      }
    });

    return list;
  }, [projects, riskFilter, verificationFilter, sortBy, search]);

  const summary = useMemo(() => {
    const source =
      filteredProjects.length > 0 ||
      search ||
      riskFilter !== "All" ||
      verificationFilter !== "All"
        ? filteredProjects
        : projects;

    const total = source.length;
    const lowRisk = source.filter((p) => p.riskLevel === "Low").length;
    const moderateRisk = source.filter((p) => p.riskLevel === "Moderate").length;
    const highRisk = source.filter((p) => p.riskLevel === "High").length;
    const verified = source.filter((p) => p.verificationStatus === "Verified").length;
    const avgScore =
      total > 0 ? Math.round(source.reduce((sum, p) => sum + p.score, 0) / total) : 0;

    return { total, lowRisk, moderateRisk, highRisk, verified, avgScore };
  }, [projects, filteredProjects, search, riskFilter, verificationFilter]);

  const featured = filteredProjects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#050816]/95 px-4 py-3 backdrop-blur xl:hidden">
        <Link href="/transparency">
          <img
            src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
            alt="WEB3MB"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
        >
          Menu
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] bg-black/70 xl:hidden">
          <div className="flex h-full w-[88vw] max-w-sm flex-col overflow-y-auto border-r border-white/10 bg-[#050816]">
            <div className="flex items-center justify-end border-b border-white/10 p-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black"
              >
                Close
              </button>
            </div>

            <PublicSidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <div className="hidden xl:block"><PublicSidebar /></div>

        <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-2xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-5xl">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  WEB3MB / PUBLIC TRUST LAYER
                </div>
                <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  Transparency Leaderboard
                </h1>
                <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-300">
                  Ranked by live wallet verification, disclosure quality, allocation
                  integrity, and operational trust. Click any leaderboard row to inspect
                  tracked wallets, mismatch count, low SOL warnings, and the strongest
                  trust and risk factors without leaving the page.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Open Owner Hub
                </Link>
                <Link
                  href="/app/projects/new"
                  className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15"
                >
                  Create Project
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              <SummaryCard label="Ranked Projects" value={loading ? "—" : summary.total} />
              <SummaryCard label="Average Score" value={loading ? "—" : `${summary.avgScore}/100`} />
              <SummaryCard label="Low Risk" value={loading ? "—" : summary.lowRisk} onClick={() => setRiskFilter(riskFilter === "Low" ? "All" : "Low")} active={riskFilter === "Low"} />
              <SummaryCard label="Moderate Risk" value={loading ? "—" : summary.moderateRisk} onClick={() => setRiskFilter(riskFilter === "Moderate" ? "All" : "Moderate")} active={riskFilter === "Moderate"} />
              <SummaryCard label="High Risk" value={loading ? "—" : summary.highRisk} onClick={() => setRiskFilter(riskFilter === "High" ? "All" : "High")} active={riskFilter === "High"} />
              <SummaryCard label="Verified" value={loading ? "—" : summary.verified} onClick={() => setVerificationFilter(verificationFilter === "Verified" ? "All" : "Verified")} active={verificationFilter === "Verified"} />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="grid gap-4 xl:grid-cols-[1.4fr_1.6fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Search
                  </div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by project, symbol, or slug"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      Risk Filter
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <FilterChip active={riskFilter === "All"} label="All" onClick={() => setRiskFilter("All")} />
                      <FilterChip active={riskFilter === "Low"} label="Low" onClick={() => setRiskFilter("Low")} />
                      <FilterChip active={riskFilter === "Moderate"} label="Moderate" onClick={() => setRiskFilter("Moderate")} />
                      <FilterChip active={riskFilter === "High"} label="High" onClick={() => setRiskFilter("High")} />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      Verification
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <FilterChip active={verificationFilter === "All"} label="All" onClick={() => setVerificationFilter("All")} />
                      <FilterChip active={verificationFilter === "Verified"} label="Verified" onClick={() => setVerificationFilter("Verified")} />
                      <FilterChip active={verificationFilter === "Partial"} label="Partial" onClick={() => setVerificationFilter("Partial")} />
                      <FilterChip active={verificationFilter === "Needs Review"} label="Needs Review" onClick={() => setVerificationFilter("Needs Review")} />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      Sort By
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="score_desc">Trust Score: High to Low</option>
                      <option value="score_asc">Trust Score: Low to High</option>
                      <option value="name_asc">Name: A to Z</option>
                      <option value="wallets_desc">Tracked Wallets</option>
                      <option value="flags_desc">Risk Flags</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Featured Projects
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-8 text-center text-zinc-400">
                    Loading featured projects...
                  </div>
                ) : featured.length > 0 ? (
                  featured.map((project, index) => (
                    <div key={project.projectId} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                        Top Ranked #{index + 1}
                      </div>

                      <div className="mt-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-xl font-semibold text-white">
                            {project.projectName}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                              {project.projectSymbol}
                            </span>
                            <span className={cn("rounded-full border px-2.5 py-1 text-xs", riskBadge(project.riskLevel))}>
                              {project.riskLevel} Risk
                            </span>
                            <span className={cn("rounded-full border px-2.5 py-1 text-xs", verificationBadge(project.verificationStatus))}>
                              {project.verificationStatus}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-3xl sm:text-4xl font-semibold text-amber-300">
                            {project.score}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Trust Score
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Wallets</div>
                          <div className="mt-1 text-sm font-semibold text-white">{project.stats?.trackedWallets ?? 0}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Coverage</div>
                          <div className="mt-1 text-sm font-semibold text-white">{project.stats?.disclosedWalletCoveragePct ?? 0}%</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Mismatches</div>
                          <div className="mt-1 text-sm font-semibold text-white">{project.stats?.allocationMismatches ?? 0}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Low SOL</div>
                          <div className="mt-1 text-sm font-semibold text-white">{project.stats?.lowSolWarnings ?? 0}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link href={`/token/${project.projectSlug}`} className="inline-flex rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15">
                          View Token
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-8 text-center text-zinc-400">
                    No projects match the current filters.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-2xl sm:rounded-3xl">
                <div className="border-b border-white/10 px-6 py-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                        Full Ranking
                      </div>
                      <h2 className="mt-2 text-2xl font-semibold text-white">
                        Project Trust Leaderboard
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      Click a row to inspect project factors inline
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead className="bg-white/[0.03]">
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Symbol</th>
                        <th className="px-6 py-4">Trust Score</th>
                        <th className="px-6 py-4">Risk</th>
                        <th className="px-6 py-4">Verification</th>
                        <th className="px-6 py-4">Wallets</th>
                        <th className="px-6 py-4">Flags</th>
                        <th className="px-6 py-4">View</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-10 text-center text-zinc-400">
                            Loading leaderboard...
                          </td>
                        </tr>
                      ) : filteredProjects.length > 0 ? (
                        filteredProjects.map((project, index) => (
                          <Fragment key={project.projectId}>
                            <tr
                              className="cursor-pointer border-t border-white/5 transition hover:bg-white/[0.03]"
                              onClick={() =>
                                setExpandedProjectId(
                                  expandedProjectId === project.projectId ? null : project.projectId
                                )
                              }
                            >
                              <td className="px-6 py-4 font-semibold text-white">#{index + 1}</td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-white">{project.projectName}</div>
                                <div className="mt-1 text-xs text-zinc-500">{project.projectSlug}</div>
                              </td>
                              <td className="px-6 py-4 text-zinc-200">{project.projectSymbol}</td>
                              <td className="px-6 py-4 font-semibold text-cyan-300">{project.score}/100</td>
                              <td className="px-6 py-4">
                                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", riskBadge(project.riskLevel))}>
                                  {project.riskLevel}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", verificationBadge(project.verificationStatus))}>
                                  {project.verificationStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-zinc-200">{project.stats?.trackedWallets ?? 0}</td>
                              <td className="px-6 py-4 text-zinc-200">{totalFlags(project)}</td>
                              <td className="px-6 py-4">
                                <Link
                                  href={`/token/${project.projectSlug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15"
                                >
                                  View Token
                                </Link>
                              </td>
                            </tr>

                            {expandedProjectId === project.projectId ? (
                              <tr className="border-t border-white/5 bg-black/20">
                                <td colSpan={9} className="px-6 py-6">
                                  <div className="grid gap-4 2xl:grid-cols-[1fr_1.2fr]">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                                        Inline Project Metrics
                                      </div>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                          <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Tracked Wallets</div>
                                          <div className="mt-2 text-2xl font-semibold text-white">{project.stats?.trackedWallets ?? 0}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                          <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Mismatch Count</div>
                                          <div className="mt-2 text-2xl font-semibold text-red-300">{project.stats?.allocationMismatches ?? 0}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                          <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Low SOL Warnings</div>
                                          <div className="mt-2 text-2xl font-semibold text-amber-300">{project.stats?.lowSolWarnings ?? 0}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                          <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Coverage</div>
                                          <div className="mt-2 text-2xl font-semibold text-white">{project.stats?.disclosedWalletCoveragePct ?? 0}%</div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                                        Top Trust / Risk Factors
                                      </div>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {(project.factors || []).slice(0, 6).map((factor) => (
                                          <div key={factor.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="min-w-0">
                                                <div className="text-sm font-medium text-white">{factor.label}</div>
                                                <div className="mt-1 text-sm leading-6 text-zinc-400">{factor.detail}</div>
                                              </div>

                                              <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs", factorBadge(factor.status))}>
                                                {factor.impact > 0 ? `+${factor.impact}` : factor.impact}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-6 py-10 text-center text-zinc-400">
                            No projects match the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 shadow-2xl">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    Why This Matters
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Public trust layer
                  </h2>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-medium text-white">Investor due diligence</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        Compare projects quickly by disclosure strength, live verification, and operational risk.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-medium text-white">Project accountability</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        Founders can improve rankings by disclosing tracked wallets, correcting mismatches, and maintaining treasury readiness.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-medium text-white">Public trust signal</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        WEB3MB turns raw on-chain data into a public reputation layer communities and investors can understand quickly.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-2xl">
                  <div className="text-xs uppercase tracking-[0.2em] text-amber-300">
                    Methodology
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Scoring framework
                  </h2>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                      Wallet disclosure depth improves transparency confidence.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                      Allocation mismatches sharply reduce trust scores.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                      Low SOL warnings signal operational fragility.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                      Invalid mint configuration reduces verification confidence.
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 shadow-2xl">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    Launch on WEB3MB
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Improve your ranking
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">
                    Token teams can strengthen trust by disclosing tracked wallets,
                    reducing mismatches, improving treasury readiness, and maintaining
                    clean live verification over time.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/app/projects/new" className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/15">
                      Create Project
                    </Link>
                    <Link href="/app" className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15">
                      Open Owner Hub
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {!loading && (riskFilter !== "All" || verificationFilter !== "All" || search) ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  Showing {filteredProjects.length} filtered project(s)
                </div>
                <button
                  onClick={() => {
                    setRiskFilter("All");
                    setVerificationFilter("All");
                    setSearch("");
                    setSortBy("score_desc");
                    setExpandedProjectId(null);
                  }}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Reset Filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
