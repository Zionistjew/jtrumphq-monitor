import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type LeaderboardProject = {
  rank: number;
  id: number;
  name: string;
  symbol: string;
  slug: string;
  mint?: string | null;
  score: number;
  grade: string;
  status: string;
  disclosedWallets: number;
  verifiedWallets: number;
  coverageRatio: number;
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}

async function getLeaderboard() {
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/transparency/leaderboard`, {
      cache: "no-store",
    });

    if (!res.ok) return { ok: false, projects: [] };
    return await res.json();
  } catch {
    return { ok: false, projects: [] };
  }
}

function gradeTone(grade: string) {
  if (grade === "A") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  if (grade === "B") return "border-cyan-400/30 bg-cyan-500/15 text-cyan-200";
  if (grade === "C") return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  if (grade === "D") return "border-orange-400/30 bg-orange-500/15 text-orange-200";
  return "border-red-400/30 bg-red-500/15 text-red-200";
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("excellent") || s.includes("trusted")) return "text-emerald-200";
  if (s.includes("moderate")) return "text-yellow-200";
  return "text-red-200";
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function verifiedPercent(project: LeaderboardProject) {
  if (!project.disclosedWallets) return 0;
  return (project.verifiedWallets / project.disclosedWallets) * 100;
}

function StatBox({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className={`mt-2 truncate text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

export default async function PublicLeaderboardPage() {
  const data = await getLeaderboard();
  const projects: LeaderboardProject[] = data?.projects || [];

  const topVerified = [...projects]
    .sort((a, b) => verifiedPercent(b) - verifiedPercent(a))
    .slice(0, 3);

  const highRisk = projects
    .filter((p) => p.grade === "F" || p.status.toLowerCase().includes("risk"))
    .slice(0, 3);

  const averageScore = projects.length
    ? Math.round(
        projects.reduce((sum, p) => sum + Number(p.score || 0), 0) /
          projects.length
      )
    : 0;

  const verifiedProjects = projects.filter(
    (p) => p.disclosedWallets > 0 && p.verifiedWallets === p.disclosedWallets
  ).length;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/transparency" className="inline-flex">
            <img
              src="/WEB3MB-L.png"
              alt="WEB3MB Transparency Center"
              className="h-16 w-auto object-contain sm:h-20"
            />
          </Link>

          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/transparency"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-center text-xs font-bold hover:bg-white/15 sm:text-sm"
            >
              Directory
            </Link>

            <Link
              href="/app/billing"
              className="rounded-xl bg-white px-4 py-2 text-center text-xs font-black text-black hover:opacity-90 sm:text-sm"
            >
              Get Listed
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                WEB3MB Transparency Center
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                Public Trust Leaderboard
              </h1>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
                Ranked public view of token projects by WEB3MB Trust Score,
                wallet coverage, verification progress, and transparency status.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/app"
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-center text-xs font-bold text-cyan-100 hover:bg-cyan-500/25 sm:text-sm"
              >
                Owner Hub
              </Link>

              <Link
                href="/app/projects/new"
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-center text-xs font-bold hover:bg-white/15 sm:text-sm"
              >
                Create Project
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Ranked Projects" value={projects.length} />
            <StatBox
              label="Average Score"
              value={`${averageScore}/100`}
              tone="text-cyan-200"
            />
            <StatBox
              label="Fully Verified"
              value={verifiedProjects}
              tone="text-emerald-200"
            />
            <StatBox label="High Risk" value={highRisk.length} tone="text-red-200" />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                Top Verified Projects
              </div>

              <div className="mt-3 space-y-2">
                {topVerified.length ? (
                  topVerified.map((project) => (
                    <Link
                      key={project.slug}
                      href={`/token/${project.slug}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">
                          {project.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          {project.verifiedWallets}/{project.disclosedWallets} wallets verified
                        </div>
                      </div>
                      <div className="shrink-0 text-lg font-black text-emerald-200">
                        {formatPercent(verifiedPercent(project))}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                    No verified projects yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200">
                High Risk Watch
              </div>

              <div className="mt-3 space-y-2">
                {highRisk.length ? (
                  highRisk.map((project) => (
                    <Link
                      key={project.slug}
                      href={`/token/${project.slug}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">
                          {project.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          Score {project.score} • {project.status}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${gradeTone(
                          project.grade
                        )}`}
                      >
                        {project.grade}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                    No high-risk projects detected.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden grid-cols-[70px_1.5fr_90px_90px_140px_120px_110px] gap-3 bg-white/[0.06] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 lg:grid">
              <div>Rank</div>
              <div>Project</div>
              <div>Score</div>
              <div>Grade</div>
              <div>Status</div>
              <div>Coverage</div>
              <div>Verified</div>
            </div>

            <div className="divide-y divide-white/10">
              {projects.length ? (
                projects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/token/${project.slug}`}
                    className="grid gap-3 px-4 py-3 transition hover:bg-white/[0.04] lg:grid-cols-[70px_1.5fr_90px_90px_140px_120px_110px] lg:items-center"
                  >
                    <div className="text-xl font-black text-cyan-300">
                      #{project.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-base font-black">
                        {project.name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span>{project.symbol}</span>
                        <span>/token/{project.slug}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Score
                      </div>
                      <div className="text-lg font-black">{project.score}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Grade
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${gradeTone(
                          project.grade
                        )}`}
                      >
                        {project.grade}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Status
                      </div>
                      <div className={`truncate text-xs font-semibold ${statusTone(project.status)}`}>
                        {project.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Coverage
                      </div>
                      <div className="text-xs font-bold">
                        {formatPercent(Number(project.coverageRatio || 0))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Verified
                      </div>
                      <div className="text-xs font-bold">
                        {project.verifiedWallets}/{project.disclosedWallets}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-300">
                  No projects available for the leaderboard yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
