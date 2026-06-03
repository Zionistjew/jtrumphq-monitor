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

  if (s.includes("excellent") || s.includes("trusted")) {
    return "text-emerald-200";
  }

  if (s.includes("moderate")) {
    return "text-yellow-200";
  }

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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className={`mt-3 text-3xl font-black ${tone}`}>{value}</div>
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
    ? Math.round(projects.reduce((sum, p) => sum + Number(p.score || 0), 0) / projects.length)
    : 0;

  const verifiedProjects = projects.filter(
    (p) => p.disclosedWallets > 0 && p.verifiedWallets === p.disclosedWallets
  ).length;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/transparency" className="inline-flex">
            <img
              src="/WEB3MB-L.png"
              alt="WEB3MB Transparency Center"
              className="h-20 w-auto object-contain sm:h-24"
            />
          </Link>

          <Link
            href="/app/billing"
            className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-black hover:opacity-90"
          >
            Get Listed
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                WEB3MB Transparency Center
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Public Trust Leaderboard
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">
                Ranked public view of token projects by WEB3MB Trust Score,
                wallet coverage, verification progress, and transparency status.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/transparency"
                className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-center text-sm font-bold hover:bg-white/15"
              >
                Transparency Directory
              </Link>

              <Link
                href="/app"
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-5 py-3 text-center text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
              >
                Owner Hub
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Ranked Projects" value={projects.length} />
            <StatBox label="Average Score" value={`${averageScore}/100`} tone="text-cyan-200" />
            <StatBox label="Fully Verified" value={verifiedProjects} tone="text-emerald-200" />
            <StatBox label="High Risk" value={highRisk.length} tone="text-red-200" />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                Top Verified Projects
              </div>

              <div className="mt-4 space-y-3">
                {topVerified.length ? (
                  topVerified.map((project) => (
                    <Link
                      key={project.slug}
                      href={`/token/${project.slug}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/[0.04]"
                    >
                      <div>
                        <div className="font-black">{project.name}</div>
                        <div className="mt-1 text-sm text-zinc-400">
                          {project.verifiedWallets}/{project.disclosedWallets} wallets verified
                        </div>
                      </div>
                      <div className="text-xl font-black text-emerald-200">
                        {formatPercent(verifiedPercent(project))}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    No verified projects yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-red-200">
                High Risk Watch
              </div>

              <div className="mt-4 space-y-3">
                {highRisk.length ? (
                  highRisk.map((project) => (
                    <Link
                      key={project.slug}
                      href={`/token/${project.slug}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/[0.04]"
                    >
                      <div>
                        <div className="font-black">{project.name}</div>
                        <div className="mt-1 text-sm text-zinc-400">
                          Score {project.score} • {project.status}
                        </div>
                      </div>
                      <span className={`rounded-full border px-3 py-2 text-sm font-black ${gradeTone(project.grade)}`}>
                        {project.grade}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    No high-risk projects detected.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden grid-cols-[80px_1.4fr_120px_120px_150px_150px_140px] gap-4 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-zinc-400 lg:grid">
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
                    className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.04] lg:grid-cols-[80px_1.4fr_120px_120px_150px_150px_140px] lg:items-center"
                  >
                    <div className="text-2xl font-black text-cyan-300">
                      #{project.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xl font-black">{project.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-400">
                        <span>{project.symbol}</span>
                        <span>/token/{project.slug}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Score
                      </div>
                      <div className="text-2xl font-black">{project.score}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Grade
                      </div>
                      <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${gradeTone(project.grade)}`}>
                        {project.grade}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Status
                      </div>
                      <div className={`text-sm font-semibold ${statusTone(project.status)}`}>
                        {project.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Coverage
                      </div>
                      <div className="text-sm font-bold">
                        {formatPercent(Number(project.coverageRatio || 0))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Verified
                      </div>
                      <div className="text-sm font-bold">
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
