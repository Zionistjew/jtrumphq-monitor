import Image from "next/image";
import { headers } from "next/headers";

type TrustResponse = {
  ok: boolean;
  project?: {
    name?: string;
    symbol?: string;
    slug?: string;
  };
  score?: number;
  grade?: string;
  status?: string;
  trust?: {
    score?: number;
    grade?: string;
    status?: string;
  };
  verification?: {
    verifiedWallets?: number;
    totalWallets?: number;
    verificationRate?: number;
    allWalletsVerified?: boolean;
    tier?: string;
    label?: string;
    scoreBonus?: number;
  };
  metrics?: {
    verifiedWallets?: number;
    ownerVerifiedWallets?: number;
    disclosedWallets?: number;
    verificationRate?: number;
    verificationTier?: string;
    lowSolWallets?: number;
    mismatchWallets?: number;
  };
};

async function getBaseUrl() {
  const h = await headers();

  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    "localhost:3000";

  const proto =
    h.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return `${proto}://${host}`;
}

async function getTrustData(slug: string): Promise<TrustResponse | null> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(`${baseUrl}/api/trust-score/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as TrustResponse;

    if (!data.ok) return null;

    return data;
  } catch {
    return null;
  }
}

function getGradeColors(grade?: string) {
  if (!grade) {
    return {
      border: "border-zinc-700",
      badge: "bg-zinc-800 text-zinc-200",
      glow: "from-zinc-900 via-zinc-950 to-black",
      score: "text-white",
    };
  }

  if (grade.startsWith("A")) {
    return {
      border: "border-emerald-500/40",
      badge: "bg-emerald-500/20 text-emerald-200",
      glow: "from-emerald-950 via-[#071421] to-black",
      score: "text-emerald-300",
    };
  }

  if (grade.startsWith("B")) {
    return {
      border: "border-cyan-500/40",
      badge: "bg-cyan-500/20 text-cyan-200",
      glow: "from-cyan-950 via-[#071421] to-black",
      score: "text-cyan-300",
    };
  }

  if (grade.startsWith("C")) {
    return {
      border: "border-amber-500/40",
      badge: "bg-amber-500/20 text-amber-200",
      glow: "from-amber-950 via-[#071421] to-black",
      score: "text-amber-300",
    };
  }

  return {
    border: "border-rose-500/40",
    badge: "bg-rose-500/20 text-rose-200",
    glow: "from-rose-950 via-[#071421] to-black",
    score: "text-rose-300",
  };
}

function getTierColors(tier?: string) {
  const value = String(tier || "").toLowerCase();

  if (value === "platinum") {
    return {
      badge: "border-purple-300/40 bg-purple-500/20 text-purple-100",
      text: "text-purple-200",
      bar: "bg-purple-300",
    };
  }

  if (value === "gold") {
    return {
      badge: "border-yellow-300/40 bg-yellow-500/20 text-yellow-100",
      text: "text-yellow-200",
      bar: "bg-yellow-300",
    };
  }

  if (value === "silver") {
    return {
      badge: "border-slate-300/40 bg-slate-400/20 text-slate-100",
      text: "text-slate-200",
      bar: "bg-slate-300",
    };
  }

  if (value === "bronze") {
    return {
      badge: "border-orange-300/40 bg-orange-500/20 text-orange-100",
      text: "text-orange-200",
      bar: "bg-orange-300",
    };
  }

  if (value === "starter") {
    return {
      badge: "border-cyan-300/40 bg-cyan-500/20 text-cyan-100",
      text: "text-cyan-200",
      bar: "bg-cyan-300",
    };
  }

  return {
    badge: "border-zinc-400/30 bg-zinc-500/15 text-zinc-200",
    text: "text-zinc-300",
    bar: "bg-zinc-400",
  };
}

function displayPercent(value?: number) {
  const n = Number(value || 0);
  return `${n.toFixed(n % 1 === 0 ? 0 : 2)}%`;
}

export default async function EmbedWidget({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const trust = await getTrustData(slug);

  if (!trust) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="rounded-3xl border border-white/10 bg-[#050816] p-6 text-center text-white shadow-2xl">
          <div className="text-sm text-zinc-400">
            WEB3MB Widget Unavailable
          </div>
        </div>
      </div>
    );
  }

  const score = trust.trust?.score ?? trust.score ?? 0;
  const grade = trust.trust?.grade ?? trust.grade;
  const status = trust.trust?.status ?? trust.status;

  const verifiedWallets =
    trust.verification?.verifiedWallets ??
    trust.metrics?.verifiedWallets ??
    trust.metrics?.ownerVerifiedWallets ??
    0;

  const totalWallets =
    trust.verification?.totalWallets ??
    trust.metrics?.disclosedWallets ??
    0;

  const verificationRate =
    trust.verification?.verificationRate ??
    trust.metrics?.verificationRate ??
    (totalWallets > 0 ? (verifiedWallets / totalWallets) * 100 : 0);

  const tier =
    trust.verification?.tier ||
    trust.metrics?.verificationTier ||
    "Unverified";

  const scoreBonus = trust.verification?.scoreBonus ?? 0;
  const label =
    trust.verification?.label || "Wallet owner verification coverage";

  const colors = getGradeColors(grade);
  const tierColors = getTierColors(tier);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-3">
      <div
        className={`w-full max-w-md overflow-hidden rounded-3xl border ${colors.border} bg-gradient-to-br ${colors.glow} shadow-[0_25px_80px_rgba(0,0,0,0.55)]`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <Image
              src="/WEB3MB-L.png"
              alt="WEB3MB"
              width={180}
              height={50}
              priority
              className="h-auto w-auto"
            />

            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              Live Seal
            </div>
          </div>

          <div className="mt-5 text-[11px] uppercase tracking-[0.35em] text-zinc-400">
            WEB3MB Verified Transparency
          </div>

          <div className="mt-4">
            <div className="break-words text-3xl font-black text-white">
              {trust.project?.name || slug}
            </div>

            <div className="mt-2 text-sm text-zinc-400">
              {trust.project?.symbol || "PROJECT"}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                  Trust Score
                </div>

                <div
                  className={`mt-3 text-6xl font-black leading-none ${colors.score}`}
                >
                  {score ?? "—"}
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${colors.badge}`}
                >
                  Grade {grade || "—"}
                </div>

                <div className="mt-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300">
                  {status || "Unknown"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                  Verification Tier
                </div>

                <div className={`mt-3 text-3xl font-black ${tierColors.text}`}>
                  {tier}
                </div>

                <div className="mt-2 text-xs leading-5 text-zinc-400">
                  {label}
                </div>
              </div>

              <div
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${tierColors.badge}`}
              >
                +{scoreBonus}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  Wallets
                </div>

                <div className="mt-2 text-xl font-black text-white">
                  {verifiedWallets}/{totalWallets}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  Rate
                </div>

                <div className="mt-2 text-xl font-black text-emerald-300">
                  {displayPercent(verificationRate)}
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${tierColors.bar}`}
                style={{
                  width: `${Math.min(100, Math.max(0, verificationRate))}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              ✓ Owner wallet verification active
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              ✓ Live trust score monitoring
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              ✓ Public transparency dashboard enabled
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <a
              href={`https://app.web3mb.com/token/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-400"
            >
              View Full Transparency Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
