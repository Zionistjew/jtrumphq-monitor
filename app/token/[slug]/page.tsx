import Link from "next/link";
import { headers } from "next/headers";

type HolderAnalysis = {
  model?: string;
  totalAnalyzedWallets?: number;
  totalAnalyzedTokens?: number;
  largestHolderPercent?: number;
  top10Percent?: number;
  top20Percent?: number;
  top50Percent?: number;
  concentrationRisk?: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN" | string;
};

type SellPressure = {
  score?: number;
  level?: "LOW" | "MODERATE" | "HIGH" | string;
  teamControlledPercent?: number;
  liquidityPercent?: number;
  drivers?: string[];
  model?: string;
};


type WalletRiskRanking = {
  rank: number;
  label: string;
  category: string;
  address?: string | null;
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  drivers: string[];
  declaredPercent: number;
  liveSharePercent: number;
  variancePercent: number;
  lowSol: boolean;
  verified: boolean;
};

type WalletHealthRanking = {
  rank: number;
  label: string;
  category: string;
  address?: string | null;
  score: number;
  level: "HEALTHY" | "WARNING" | "CRITICAL";
  drivers: string[];
  solBalance: number;
  verified: boolean;
  variancePercent: number;
  declaredPercent: number;
};

type WalletRow = {
  label?: string | null;
  category?: string | null;
  address?: string | null;
  purpose?: string | null;

  allocation?: number | null;
  allocationPercent?: number | null;
  declaredTokenBalance?: number | null;
  tokenSupply?: number | null;

  liveTokenBalance?: number | null;
  liveSolBalance?: number | null;

  variance?: number | null;
  variancePercent?: number | null;

  verified?: boolean | null;
  lowSol?: boolean | null;
};

type WalletApiResponse = {
  ok: boolean;
  slug: string;
  name: string;
  symbol: string;
  mint?: string | null;
  count: number;
  wallets: WalletRow[];
  holderAnalysis?: HolderAnalysis;
  sellPressure?: SellPressure;
};

type TrustScoreResponse = {
  ok: boolean;
  project?: {
    id: number;
    slug: string;
    name: string;
    symbol: string;
    mint?: string | null;
  };
  score?: number;
  grade?: string;
  status?: string;
  trust?: {
    score?: number;
    grade?: string;
    status?: string;
  };
  breakdown?: {
    walletScore?: number;
    alertScore?: number;
    liquidityScore?: number;
    disclosureScore?: number;
  };
  metrics?: {
    walletSourceUsed?: string;
    disclosedWallets?: number;
    validWallets?: number;
    readableWallets?: number;
    verifiedWallets?: number;
    mismatchWallets?: number;
    lowSolWallets?: number;
    invalidWallets?: number;
    declaredAllocation?: number;
    liveDisclosedBalance?: number;
    coverageRatio?: number;
    activeCriticalAlerts?: number;
    activeWarningAlerts?: number;
    activeInfoAlerts?: number;
  };
  issues?: string[];
  generatedAt?: string;
  rpc?: string;
};

function formatNumber(value?: number | null, maximumFractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value?: number | null, maximumFractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "—";

  return `${formatNumber(value, maximumFractionDigits)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function shortAddress(address?: string | null) {
  if (!address) return "—";
  if (address.length <= 14) return address;

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function getDeclaredTokens(wallet: WalletRow) {
  return Number(wallet.declaredTokenBalance ?? wallet.allocation ?? 0);
}

function getAllocationPercent(wallet: WalletRow) {
  const n = Number(wallet.allocationPercent ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getVarianceTokens(wallet: WalletRow) {
  return Number(wallet.variance ?? 0);
}

function getVariancePercent(wallet: WalletRow) {
  const n = Number(wallet.variancePercent ?? wallet.variance ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function gradeTone(grade?: string) {
  if (!grade) return "border-white/10 bg-white/5 text-white";

  if (grade.startsWith("A")) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (grade.startsWith("B")) {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-200";
  }

  if (grade.startsWith("C")) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-rose-500/20 bg-rose-500/10 text-rose-200";
}

function riskTone(risk?: string) {
  const value = String(risk || "").toUpperCase();

  if (value === "LOW") {
    return {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      text: "text-emerald-200",
      label: "LOW",
    };
  }

  if (value === "MODERATE") {
    return {
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      text: "text-amber-200",
      label: "MODERATE",
    };
  }

  if (value === "HIGH") {
    return {
      border: "border-rose-500/20",
      bg: "bg-rose-500/10",
      text: "text-rose-200",
      label: "HIGH",
    };
  }

  return {
    border: "border-white/10",
    bg: "bg-white/5",
    text: "text-zinc-200",
    label: "UNKNOWN",
  };
}


function walletRiskTone(level?: string) {
  const value = String(level || "").toUpperCase();

  if (value === "CRITICAL") {
    return {
      border: "border-rose-500/30",
      bg: "bg-rose-500/15",
      text: "text-rose-100",
      label: "CRITICAL",
    };
  }

  return riskTone(value);
}

function walletHealthTone(level?: string) {
  const value = String(level || "").toUpperCase();

  if (value === "HEALTHY") {
    return {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      text: "text-emerald-200",
      label: "HEALTHY",
    };
  }

  if (value === "WARNING") {
    return {
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      text: "text-amber-200",
      label: "WARNING",
    };
  }

  return {
    border: "border-rose-500/30",
    bg: "bg-rose-500/15",
    text: "text-rose-100",
    label: "CRITICAL",
  };
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";

  const isLocalHost =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  if (host && isLocalHost) {
    return `${proto}://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3001";
}

async function getTokenData(slug: string): Promise<WalletApiResponse | null> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(`${baseUrl}/api/token/${slug}/wallets`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as WalletApiResponse;

    if (!data.ok) return null;

    return data;
  } catch {
    return null;
  }
}

async function getTrustScore(slug: string): Promise<TrustScoreResponse | null> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(`${baseUrl}/api/trust-score/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as TrustScoreResponse;

    if (!data.ok) return null;

    return data;
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>

      <div className="mt-3 break-words text-3xl font-semibold text-white">
        {value}
      </div>

      {hint ? (
        <div className="mt-3 text-sm leading-6 text-zinc-400">{hint}</div>
      ) : null}
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>

      <div className="mt-3 break-words text-xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function SectionJumpNav() {
  const links = [
    {
      href: "#overview",
      label: "📊 Overview",
      className:
        "border-blue-400/30 bg-blue-500/15 text-blue-200 hover:border-blue-300/60 hover:bg-blue-500/25",
    },
    {
      href: "#investor-intelligence",
      label: "🧠 Intelligence",
      className:
        "border-purple-400/30 bg-purple-500/15 text-purple-200 hover:border-purple-300/60 hover:bg-purple-500/25",
    },
    {
      href: "#wallet-health",
      label: "❤️ Wallet Health",
      className:
        "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300/60 hover:bg-emerald-500/25",
    },
    {
      href: "#wallet-risk-ranking",
      label: "⚠️ Risk Ranking",
      className:
        "border-orange-400/30 bg-orange-500/15 text-orange-200 hover:border-orange-300/60 hover:bg-orange-500/25",
    },
    {
      href: "#live-wallets",
      label: "🔗 Live Wallets",
      className:
        "border-cyan-400/30 bg-cyan-500/15 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-500/25",
    },
  ];

  return (
    <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 shadow-lg shadow-cyan-950/20 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="px-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
          Jump Navigation
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${link.className}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvestorIntelligencePanel({
  holderAnalysis,
}: {
  holderAnalysis?: HolderAnalysis;
}) {
  const risk = riskTone(holderAnalysis?.concentrationRisk);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Investor Intelligence
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Holder Concentration
          </h2>

          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Concentration analysis based on disclosed project wallets. Full
            token-holder analysis can be offered later as a premium intelligence
            feature.
          </p>
        </div>

        <div
          className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${risk.border} ${risk.bg} ${risk.text}`}
        >
          {risk.label} Risk
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricTile
          label="Largest Holder"
          value={formatPercent(holderAnalysis?.largestHolderPercent)}
        />

        <MetricTile
          label="Top 10 Holders"
          value={formatPercent(holderAnalysis?.top10Percent)}
        />

        <MetricTile
          label="Top 20 Holders"
          value={formatPercent(holderAnalysis?.top20Percent)}
        />

        <MetricTile
          label="Top 50 Holders"
          value={formatPercent(holderAnalysis?.top50Percent)}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <MetricTile
          label="Analyzed Wallets"
          value={formatNumber(holderAnalysis?.totalAnalyzedWallets || 0, 0)}
        />

        <MetricTile
          label="Analyzed Tokens"
          value={formatNumber(holderAnalysis?.totalAnalyzedTokens || 0, 3)}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
        <span className="font-medium text-white">Model:</span>{" "}
        {holderAnalysis?.model || "DISCLOSED_PROJECT_WALLETS"}
      </div>
    </div>
  );
}


function SellPressurePanel({
  sellPressure,
}: {
  sellPressure?: SellPressure;
}) {
  const tone = riskTone(sellPressure?.level);
  const drivers = sellPressure?.drivers || [
    "No major disclosed sell-pressure drivers detected.",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Investor Intelligence
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Sell Pressure Index
          </h2>

          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Risk signal based on disclosed team, treasury, marketing,
            liquidity, wallet health, and concentration data.
          </p>
        </div>

        <div
          className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${tone.border} ${tone.bg} ${tone.text}`}
        >
          {tone.label}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="text-5xl font-semibold text-white">
          {formatNumber(sellPressure?.score || 0, 0)}
        </div>

        <div className="pb-2 text-lg text-zinc-400">/ 100</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricTile
          label="Team Controlled"
          value={formatPercent(sellPressure?.teamControlledPercent || 0)}
        />

        <MetricTile
          label="Liquidity Allocation"
          value={formatPercent(sellPressure?.liquidityPercent || 0)}
        />
      </div>

      <div className="mt-5 grid gap-3">
        {drivers.map((driver, index) => (
          <div
            key={`${driver}-${index}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-300"
          >
            • {driver}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300">
        <span className="font-medium text-white">Model:</span>{" "}
        {sellPressure?.model || "DISCLOSED_PROJECT_WALLETS"}
      </div>
    </div>
  );
}


function WalletHealthScorePanel({
  rankings,
}: {
  rankings: WalletHealthRanking[];
}) {
  const averageHealth = rankings.length
    ? Math.round(
        rankings.reduce((sum, wallet) => sum + wallet.score, 0) /
          rankings.length
      )
    : 0;

  const criticalCount = rankings.filter(
    (wallet) => wallet.level === "CRITICAL"
  ).length;

  const warningCount = rankings.filter(
    (wallet) => wallet.level === "WARNING"
  ).length;

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Investor Intelligence
          </div>

          <h2 className="mt-3 text-3xl font-semibold text-white">
            Wallet Health Score
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Operational health view of disclosed wallets based on SOL balance,
            owner verification, allocation variance, and declared allocation
            size. This is separate from sell-pressure risk.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
          <MetricTile label="Average Health" value={`${averageHealth} / 100`} />
          <MetricTile label="Critical Wallets" value={criticalCount} />
          <MetricTile label="Warning Wallets" value={warningCount} />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {rankings.length > 0 ? (
          rankings.map((wallet) => {
            const tone = walletHealthTone(wallet.level);

            return (
              <div
                key={`${wallet.address}-${wallet.rank}-health`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[90px_minmax(0,1fr)_minmax(360px,0.85fr)] xl:items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-semibold text-white">
                    #{wallet.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="min-w-0 break-words text-xl font-semibold text-white">
                        {wallet.label}
                      </h3>

                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-200">
                        {wallet.category}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.border} ${tone.bg} ${tone.text}`}
                      >
                        {tone.label}
                      </span>
                    </div>

                    <div className="mt-3 truncate font-mono text-xs text-zinc-400">
                      {wallet.address || "—"}
                    </div>

                    <div className="mt-4 grid gap-2">
                      {wallet.drivers.slice(0, 3).map((driver, index) => (
                        <div
                          key={`${wallet.address}-${driver}-${index}-health`}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300"
                        >
                          • {driver}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-2 gap-3">
                    <MetricTile
                      label="Health Score"
                      value={`${wallet.score} / 100`}
                    />

                    <MetricTile
                      label="Live SOL"
                      value={formatNumber(wallet.solBalance, 6)}
                    />

                    <MetricTile
                      label="Variance %"
                      value={formatPercent(wallet.variancePercent, 3)}
                    />

                    <MetricTile
                      label="Verified"
                      value={wallet.verified ? "Yes" : "No"}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-300">
            Wallet health scoring is not available until disclosed wallet data is
            loaded.
          </div>
        )}
      </div>
    </div>
  );
}


function WalletRiskRankingPanel({
  rankings,
}: {
  rankings: WalletRiskRanking[];
}) {
  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Investor Intelligence
          </div>

          <h2 className="mt-3 text-3xl font-semibold text-white">
            Wallet Risk Ranking
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Ranked view of disclosed wallets based on allocation variance, low
            SOL balance, verification status, declared allocation size, and live
            disclosed balance share.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
          Top {rankings.length} disclosed wallets
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {rankings.length > 0 ? (
          rankings.map((wallet) => {
            const tone = walletRiskTone(wallet.level);

            return (
              <div
                key={`${wallet.address}-${wallet.rank}`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[90px_minmax(0,1fr)_minmax(360px,0.85fr)] xl:items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-semibold text-white">
                    #{wallet.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="min-w-0 break-words text-xl font-semibold text-white">
                        {wallet.label}
                      </h3>

                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-200">
                        {wallet.category}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.border} ${tone.bg} ${tone.text}`}
                      >
                        {tone.label}
                      </span>
                    </div>

                    <div className="mt-3 truncate font-mono text-xs text-zinc-400">
                      {wallet.address || "—"}
                    </div>

                    <div className="mt-4 grid gap-2">
                      {wallet.drivers.slice(0, 3).map((driver, index) => (
                        <div
                          key={`${wallet.address}-${driver}-${index}`}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300"
                        >
                          • {driver}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-2 gap-3">
                    <MetricTile
                      label="Risk Score"
                      value={`${wallet.score} / 100`}
                    />

                    <MetricTile
                      label="Declared %"
                      value={formatPercent(wallet.declaredPercent)}
                    />

                    <MetricTile
                      label="Live Share"
                      value={formatPercent(wallet.liveSharePercent)}
                    />

                    <MetricTile
                      label="Variance %"
                      value={formatPercent(wallet.variancePercent, 3)}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-300">
            Wallet risk ranking is not available until disclosed wallet data is
            loaded.
          </div>
        )}
      </div>
    </div>
  );
}




function RecommendedActionsPanel({
  wallets,
  mismatchWallets,
  lowSolWallets,
  verifiedWallets,
  coverageRatio,
  sellPressure,
  holderAnalysis,
}: {
  wallets: WalletRow[];
  mismatchWallets: number;
  lowSolWallets: number;
  verifiedWallets: number;
  coverageRatio: number;
  sellPressure: SellPressure;
  holderAnalysis: HolderAnalysis;
}) {
  const critical: string[] = [];
  const recommended: string[] = [];
  const positive: string[] = [];

  if (lowSolWallets > 0) {
    critical.push(
      `Fund ${lowSolWallets} wallet${
        lowSolWallets === 1 ? "" : "s"
      } with at least 0.05 SOL for operational transactions.`
    );
  }

  if (verifiedWallets === 0 && wallets.length > 0) {
    critical.push("Complete owner verification for disclosed project wallets.");
  }

  if (sellPressure.level === "HIGH") {
    critical.push(
      "Review treasury, liquidity, and team wallet allocations to reduce sell-pressure risk."
    );
  }

  if (mismatchWallets > 0) {
    recommended.push(
      `Investigate ${mismatchWallets} wallet${
        mismatchWallets === 1 ? "" : "s"
      } with allocation mismatches.`
    );
  }

  if (coverageRatio < 50) {
    recommended.push(
      "Increase wallet disclosure coverage above 50% of declared supply."
    );
  }

  if (
    holderAnalysis.concentrationRisk === "HIGH" ||
    holderAnalysis.concentrationRisk === "MODERATE"
  ) {
    recommended.push(
      "Reduce concentration risk through broader token distribution."
    );
  }

  if (wallets.length > 0) {
    positive.push(
      `${wallets.length} project wallet${
        wallets.length === 1 ? "" : "s"
      } disclosed.`
    );
  }

  if (coverageRatio > 25) {
    positive.push(
      `${formatPercent(coverageRatio)} wallet coverage currently monitored.`
    );
  }

  positive.push("Live wallet verification is active.");
  positive.push("WEB3MB transparency monitoring is enabled.");

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Recommended Actions
          </div>

          <h2 className="mt-3 text-3xl font-semibold text-white">
            Operational Guidance
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Actionable recommendations generated from wallet health,
            verification status, allocation variance, concentration analysis,
            and sell-pressure monitoring.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-4 text-center text-cyan-200">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            Launch Readiness
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {critical.length ? "Action Needed" : "Improving"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-red-200">
            Critical
          </div>

          <div className="mt-4 space-y-3">
            {critical.length ? (
              critical.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-red-500/20 bg-black/20 p-4 text-sm leading-6 text-red-100"
                >
                  🔴 {item}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-green-500/20 bg-black/20 p-4 text-sm leading-6 text-green-100">
                No critical actions detected.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-200">
            Recommended
          </div>

          <div className="mt-4 space-y-3">
            {recommended.length ? (
              recommended.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-yellow-500/20 bg-black/20 p-4 text-sm leading-6 text-yellow-100"
                >
                  🟡 {item}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-green-500/20 bg-black/20 p-4 text-sm leading-6 text-green-100">
                No additional recommended actions at this time.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-green-200">
            Positive Progress
          </div>

          <div className="mt-4 space-y-3">
            {positive.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-green-500/20 bg-black/20 p-4 text-sm leading-6 text-green-100"
              >
                🟢 {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function ExecutiveRiskSummaryPanel({
  score,
  status,
  holderAnalysis,
  sellPressure,
  wallets,
  mismatchWallets,
  lowSolWallets,
  verifiedWallets,
  coverageRatio,
}: {
  score?: number;
  status?: string;
  holderAnalysis: HolderAnalysis;
  sellPressure: SellPressure;
  wallets: WalletRow[];
  mismatchWallets: number;
  lowSolWallets: number;
  verifiedWallets: number;
  coverageRatio: number;
}) {
  const overallLevel =
    sellPressure.level === "HIGH" ||
    holderAnalysis.concentrationRisk === "HIGH" ||
    (typeof score === "number" && score < 60)
      ? "HIGH"
      : sellPressure.level === "MODERATE" ||
          holderAnalysis.concentrationRisk === "MODERATE" ||
          (typeof score === "number" && score < 80)
        ? "MODERATE"
        : "LOW";

  const tone = riskTone(overallLevel);

  const primaryRisks: string[] = [];

  if (mismatchWallets > 0) {
    primaryRisks.push(
      `${mismatchWallets} wallet${mismatchWallets === 1 ? "" : "s"} show allocation mismatch.`
    );
  }

  if (lowSolWallets > 0) {
    primaryRisks.push(
      `${lowSolWallets} wallet${lowSolWallets === 1 ? "" : "s"} have low SOL balance.`
    );
  }

  if (verifiedWallets === 0 && wallets.length > 0) {
    primaryRisks.push("No disclosed wallets have owner verification yet.");
  }

  if (holderAnalysis.concentrationRisk === "HIGH") {
    primaryRisks.push("Disclosed wallet concentration risk is high.");
  }

  if (sellPressure.level === "HIGH") {
    primaryRisks.push("Sell Pressure Index is elevated.");
  }

  const positiveSignals: string[] = [];

  if (wallets.length > 0) {
    positiveSignals.push(
      `${wallets.length} project wallet${wallets.length === 1 ? "" : "s"} disclosed.`
    );
  }

  if (coverageRatio > 0) {
    positiveSignals.push(`${formatPercent(coverageRatio)} live coverage ratio detected.`);
  }

  if (
    holderAnalysis.totalAnalyzedTokens &&
    holderAnalysis.totalAnalyzedTokens > 0
  ) {
    positiveSignals.push("Live token balances are being read successfully.");
  }

  if ((sellPressure.liquidityPercent || 0) > 0) {
    positiveSignals.push(
      `${formatPercent(sellPressure.liquidityPercent)} liquidity allocation disclosed.`
    );
  }

  if (!primaryRisks.length) {
    primaryRisks.push("No major immediate risks detected from disclosed wallets.");
  }

  if (!positiveSignals.length) {
    positiveSignals.push("No positive transparency signals are available yet.");
  }

  const investorAssessment =
    overallLevel === "HIGH"
      ? "This project currently presents elevated operational, concentration, or sell-pressure risk. Investors should review wallet verification, allocation mismatches, liquidity posture, and disclosed wallet health before significant exposure."
      : overallLevel === "MODERATE"
        ? "This project shows moderate transparency risk. Investors should monitor verification progress, wallet health, and concentration exposure as the project matures."
        : "This project currently shows lower disclosed-wallet risk based on available WEB3MB transparency signals, though investors should continue monitoring live wallet activity.";

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.09] via-white/[0.04] to-purple-500/[0.08] p-5 shadow-2xl shadow-cyan-950/20 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            Executive Risk Summary
          </div>

          <h2 className="mt-3 text-3xl font-semibold text-white">
            Investor-facing assessment
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            A concise summary of the most important risk and transparency
            signals detected from disclosed wallets, trust scoring, live RPC
            balance checks, and sell-pressure analytics.
          </p>
        </div>

        <div
          className={`w-fit rounded-2xl border px-5 py-4 text-center ${tone.border} ${tone.bg} ${tone.text}`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            Overall Risk
          </div>

          <div className="mt-2 text-3xl font-semibold">{tone.label}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <MetricTile
          label="Trust Score"
          value={typeof score === "number" ? `${formatNumber(score, 0)} / 100` : "—"}
        />

        <MetricTile label="Trust Status" value={status || "—"} />

        <MetricTile
          label="Sell Pressure"
          value={`${sellPressure.level || "LOW"} · ${formatNumber(sellPressure.score || 0, 0)} / 100`}
        />

        <MetricTile
          label="Concentration"
          value={`${holderAnalysis.concentrationRisk || "UNKNOWN"} Risk`}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-rose-200">
            Primary Risks
          </div>

          <div className="mt-4 grid gap-3">
            {primaryRisks.map((risk, index) => (
              <div
                key={`${risk}-${index}`}
                className="rounded-2xl border border-rose-500/20 bg-black/20 p-4 text-sm leading-6 text-rose-100"
              >
                • {risk}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
            Positive Signals
          </div>

          <div className="mt-4 grid gap-3">
            {positiveSignals.map((signal, index) => (
              <div
                key={`${signal}-${index}`}
                className="rounded-2xl border border-emerald-500/20 bg-black/20 p-4 text-sm leading-6 text-emerald-100"
              >
                • {signal}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Investor Assessment
        </div>

        <p className="mt-3 text-sm leading-7 text-zinc-300">
          {investorAssessment}
        </p>
      </div>
    </div>
  );
}


export default async function TokenPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tokenData, trustData] = await Promise.all([
    getTokenData(slug),
    getTrustScore(slug),
  ]);

  if (!tokenData) {
    return (
      <div className="min-h-screen scroll-smooth bg-[#050816] text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              WEB3MB / Public Transparency Layer
            </div>

            <h1 className="mt-4 text-4xl font-semibold">Project not found</h1>

            <p className="mt-4 text-zinc-300">
              We could not load this public project dashboard.
            </p>

            <div className="mt-8">
              <Link
                href="/transparency"
                className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Back to Public Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const wallets = tokenData.wallets || [];

  const totalDeclaredTokens = wallets.reduce(
    (sum, wallet) => sum + getDeclaredTokens(wallet),
    0
  );

  const totalDeclaredPercent = wallets.reduce(
    (sum, wallet) => sum + getAllocationPercent(wallet),
    0
  );

  const totalLive = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.liveTokenBalance || 0),
    0
  );

  const verifiedWallets = wallets.filter((wallet) => wallet.verified).length;
  const lowSolWallets = wallets.filter((wallet) => wallet.lowSol).length;

  const mismatchWallets = wallets.filter(
    (wallet) => Math.abs(getVariancePercent(wallet)) > 0
  ).length;

  const coverageRatio =
    totalDeclaredTokens > 0 ? (totalLive / totalDeclaredTokens) * 100 : 0;

  const liveBalances = wallets
    .map((wallet) => Number(wallet.liveTokenBalance || 0))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a);

  const totalAnalyzedTokens = liveBalances.reduce(
    (sum, value) => sum + value,
    0
  );

  function calculateTopPercent(count: number) {
    if (totalAnalyzedTokens <= 0) return 0;

    const total = liveBalances
      .slice(0, count)
      .reduce((sum, value) => sum + value, 0);

    return Number(((total / totalAnalyzedTokens) * 100).toFixed(2));
  }

  const fallbackHolderAnalysis: HolderAnalysis = {
    model: "DISCLOSED_PROJECT_WALLETS",
    totalAnalyzedWallets: wallets.length,
    totalAnalyzedTokens,
    largestHolderPercent:
      totalAnalyzedTokens > 0
        ? Number((((liveBalances[0] || 0) / totalAnalyzedTokens) * 100).toFixed(2))
        : 0,
    top10Percent: calculateTopPercent(10),
    top20Percent: calculateTopPercent(20),
    top50Percent: calculateTopPercent(50),
    concentrationRisk:
      totalAnalyzedTokens <= 0
        ? "UNKNOWN"
        : calculateTopPercent(10) > 70
          ? "HIGH"
          : calculateTopPercent(10) > 50
            ? "MODERATE"
            : "LOW",
  };

  const holderAnalysis = tokenData.holderAnalysis || fallbackHolderAnalysis;

  const pressureCategories = ["team", "marketing", "treasury"];

  const fallbackTeamControlledPercent = wallets
    .filter((wallet) =>
      pressureCategories.includes(
        String(wallet.category || "").toLowerCase()
      )
    )
    .reduce((sum, wallet) => sum + getAllocationPercent(wallet), 0);

  const fallbackLiquidityPercent = wallets
    .filter(
      (wallet) =>
        String(wallet.category || "").toLowerCase() === "liquidity"
    )
    .reduce((sum, wallet) => sum + getAllocationPercent(wallet), 0);

  const fallbackSellPressureDrivers: string[] = [];
  let fallbackSellPressureScore = 0;

  if (fallbackTeamControlledPercent >= 50) {
    fallbackSellPressureScore += 35;
    fallbackSellPressureDrivers.push(
      "High team, treasury, and marketing allocation."
    );
  } else if (fallbackTeamControlledPercent >= 30) {
    fallbackSellPressureScore += 25;
    fallbackSellPressureDrivers.push(
      "Moderate team, treasury, and marketing allocation."
    );
  } else if (fallbackTeamControlledPercent >= 15) {
    fallbackSellPressureScore += 12;
    fallbackSellPressureDrivers.push(
      "Some team, treasury, and marketing allocation exposure."
    );
  }

  if (fallbackLiquidityPercent < 10) {
    fallbackSellPressureScore += 20;
    fallbackSellPressureDrivers.push("Liquidity allocation is below 10%.");
  } else if (fallbackLiquidityPercent < 15) {
    fallbackSellPressureScore += 10;
    fallbackSellPressureDrivers.push(
      "Liquidity allocation is below preferred range."
    );
  }

  if (holderAnalysis.concentrationRisk === "HIGH") {
    fallbackSellPressureScore += 20;
    fallbackSellPressureDrivers.push("Holder concentration risk is high.");
  } else if (holderAnalysis.concentrationRisk === "MODERATE") {
    fallbackSellPressureScore += 10;
    fallbackSellPressureDrivers.push("Holder concentration risk is moderate.");
  }

  if (mismatchWallets > 0) {
    fallbackSellPressureScore += Math.min(20, mismatchWallets * 5);
    fallbackSellPressureDrivers.push(
      `${mismatchWallets} wallet${mismatchWallets === 1 ? "" : "s"} show allocation mismatch.`
    );
  }

  if (lowSolWallets > 0) {
    fallbackSellPressureScore += Math.min(15, lowSolWallets * 5);
    fallbackSellPressureDrivers.push(
      `${lowSolWallets} wallet${lowSolWallets === 1 ? "" : "s"} have low SOL balance.`
    );
  }

  fallbackSellPressureScore = Math.min(
    100,
    Math.max(0, Math.round(fallbackSellPressureScore))
  );

  const fallbackSellPressureLevel =
    fallbackSellPressureScore >= 70
      ? "HIGH"
      : fallbackSellPressureScore >= 40
        ? "MODERATE"
        : "LOW";

  const fallbackSellPressure: SellPressure = {
    score: fallbackSellPressureScore,
    level: fallbackSellPressureLevel,
    teamControlledPercent: Number(fallbackTeamControlledPercent.toFixed(2)),
    liquidityPercent: Number(fallbackLiquidityPercent.toFixed(2)),
    drivers: fallbackSellPressureDrivers.length
      ? fallbackSellPressureDrivers
      : ["No major disclosed sell-pressure drivers detected."],
    model: "DISCLOSED_PROJECT_WALLETS",
  };

  const sellPressure = tokenData.sellPressure || fallbackSellPressure;

  const score = trustData?.trust?.score ?? trustData?.score;
  const grade = trustData?.trust?.grade ?? trustData?.grade;
  const status = trustData?.trust?.status ?? trustData?.status;

  const walletHealthRankings: WalletHealthRanking[] = wallets
    .map((wallet, index) => {
      const declaredPercent = getAllocationPercent(wallet);
      const variancePercent = getVariancePercent(wallet);
      const absVariance = Math.abs(variancePercent);
      const solBalance = Number(wallet.liveSolBalance || 0);
      const lowSol = Boolean(wallet.lowSol);
      const verified = Boolean(wallet.verified);
      const drivers: string[] = [];
      let healthScore = 100;

      if (lowSol) {
        healthScore -= 35;
        drivers.push("Low SOL balance may prevent operational transactions.");
      } else {
        drivers.push("SOL balance is sufficient for basic operations.");
      }

      if (!verified) {
        healthScore -= 25;
        drivers.push("Owner verification has not been completed.");
      } else {
        drivers.push("Owner verification is complete.");
      }

      if (absVariance > 50) {
        healthScore -= 30;
        drivers.push("Allocation variance is above 50%.");
      } else if (absVariance > 10) {
        healthScore -= 20;
        drivers.push("Allocation variance is above 10%.");
      } else if (absVariance > 2) {
        healthScore -= 10;
        drivers.push("Allocation variance is above 2%.");
      } else {
        drivers.push("Allocation variance is within acceptable range.");
      }

      if (declaredPercent >= 20) {
        healthScore -= 10;
        drivers.push("Wallet controls 20% or more of declared supply.");
      }

      healthScore = Math.min(100, Math.max(0, Math.round(healthScore)));

      const level: WalletHealthRanking["level"] =
        healthScore >= 75
          ? "HEALTHY"
          : healthScore >= 45
            ? "WARNING"
            : "CRITICAL";

      return {
        rank: index + 1,
        label: wallet.label || "Wallet",
        category: wallet.category || "uncategorized",
        address: wallet.address,
        score: healthScore,
        level,
        drivers,
        solBalance,
        verified,
        variancePercent,
        declaredPercent,
      };
    })
    .sort((a, b) => a.score - b.score)
    .map((wallet, index) => ({
      ...wallet,
      rank: index + 1,
    }));

  const walletRiskRankings: WalletRiskRanking[] = wallets
    .map((wallet, index) => {
      const declaredPercent = getAllocationPercent(wallet);
      const live = Number(wallet.liveTokenBalance || 0);
      const liveSharePercent =
        totalLive > 0 ? Number(((live / totalLive) * 100).toFixed(2)) : 0;
      const variancePercent = getVariancePercent(wallet);
      const absVariance = Math.abs(variancePercent);
      const lowSol = Boolean(wallet.lowSol);
      const verified = Boolean(wallet.verified);
      const drivers: string[] = [];
      let riskScore = 0;

      if (absVariance > 50) {
        riskScore += 30;
        drivers.push("Large allocation variance above 50%.");
      } else if (absVariance > 10) {
        riskScore += 20;
        drivers.push("Material allocation variance above 10%.");
      } else if (absVariance > 2) {
        riskScore += 10;
        drivers.push("Minor allocation variance above 2%.");
      }

      if (lowSol) {
        riskScore += 20;
        drivers.push("Wallet has low SOL for operational transactions.");
      }

      if (!verified) {
        riskScore += 10;
        drivers.push("Wallet has not completed owner verification.");
      }

      if (declaredPercent >= 20) {
        riskScore += 20;
        drivers.push("Declared allocation is 20% or higher.");
      } else if (declaredPercent >= 15) {
        riskScore += 15;
        drivers.push("Declared allocation is 15% or higher.");
      } else if (declaredPercent > 0) {
        riskScore += 5;
        drivers.push("Wallet controls disclosed token allocation.");
      }

      if (liveSharePercent >= 50) {
        riskScore += 20;
        drivers.push("Wallet holds 50% or more of live disclosed balance.");
      } else if (liveSharePercent >= 20) {
        riskScore += 10;
        drivers.push("Wallet holds 20% or more of live disclosed balance.");
      }

      riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

      const level: WalletRiskRanking["level"] =
        riskScore >= 70
          ? "CRITICAL"
          : riskScore >= 45
            ? "HIGH"
            : riskScore >= 20
              ? "MODERATE"
              : "LOW";

      if (!drivers.length) {
        drivers.push("No major disclosed wallet risk drivers detected.");
      }

      return {
        rank: index + 1,
        label: wallet.label || "Unnamed Wallet",
        category: wallet.category || "uncategorized",
        address: wallet.address,
        score: riskScore,
        level,
        drivers,
        declaredPercent,
        liveSharePercent,
        variancePercent,
        lowSol,
        verified,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((wallet, index) => ({
      ...wallet,
      rank: index + 1,
    }));


  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-6 xl:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-4 shadow-2xl sm:p-6 md:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-4xl">
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                WEB3MB / Public Transparency Layer
              </div>

              <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
                {tokenData.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
                  {tokenData.symbol}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                  /token/{tokenData.slug}
                </span>

                {status ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                    Status: {status}
                  </span>
                ) : null}
              </div>

              <p className="mt-6 max-w-4xl text-base leading-8 text-zinc-300">
                Public investor-facing transparency dashboard showing disclosed
                wallet coverage, live token balance verification, trust scoring,
                and operational integrity signals.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[560px]">
              <Link
                href="/transparency"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Transparency Directory
              </Link>

              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Open Owner Hub
              </Link>

              <Link
                href="/app/projects/new"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Create Project
              </Link>

              <Link
                href={`/token/${tokenData.slug}/report`}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-5 py-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-500/25"
              >
                Download Audit Report
              </Link>
            </div>
          </div>

          <SectionJumpNav />

          <ExecutiveRiskSummaryPanel
            score={score}
            status={status}
            holderAnalysis={holderAnalysis}
            sellPressure={sellPressure}
            wallets={wallets}
            mismatchWallets={mismatchWallets}
            lowSolWallets={lowSolWallets}
            verifiedWallets={verifiedWallets}
            coverageRatio={coverageRatio}
          />

          <RecommendedActionsPanel
            wallets={wallets}
            mismatchWallets={mismatchWallets}
            lowSolWallets={lowSolWallets}
            verifiedWallets={verifiedWallets}
            coverageRatio={coverageRatio}
            sellPressure={sellPressure}
            holderAnalysis={holderAnalysis}
          />


          <div id="overview" className="mt-8 scroll-mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Disclosed Wallets"
              value={wallets.length}
              hint="Publicly disclosed wallets tracked by WEB3MB."
            />

            <StatCard
              label="Verified Wallets"
              value={verifiedWallets}
              hint="Wallets whose live balance matches declared allocation."
            />

            <StatCard
              label="Allocation Mismatches"
              value={mismatchWallets}
              hint="Wallets showing live balance variance."
            />

            <StatCard
              label="Coverage Ratio"
              value={formatPercent(coverageRatio)}
              hint="Live disclosed balances versus declared total allocation."
            />
          </div>

          <div id="investor-intelligence" className="mt-8 scroll-mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
            <div className="space-y-5">
              <InvestorIntelligencePanel holderAnalysis={holderAnalysis} />

              <SellPressurePanel sellPressure={sellPressure} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Wallet Disclosure Coverage
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Disclosed Wallets"
                  value={`${wallets.length} tracked`}
                />

                <MetricTile
                  label="Coverage Ratio"
                  value={formatPercent(coverageRatio)}
                />

                <MetricTile
                  label="Declared Supply Share"
                  value={formatPercent(totalDeclaredPercent)}
                />

                <MetricTile
                  label="Live Disclosed Balance"
                  value={formatNumber(totalLive, 3)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div className="min-w-0 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Public Project Snapshot
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <MetricTile
                  label="Project Mint"
                  value={shortAddress(tokenData.mint)}
                />

                <MetricTile
                  label="Live Wallet Reads"
                  value={`${wallets.length} tracked wallet${
                    wallets.length === 1 ? "" : "s"
                  }`}
                />

                <MetricTile
                  label="Declared Token Allocation"
                  value={formatNumber(totalDeclaredTokens, 3)}
                />

                <MetricTile
                  label="Declared Supply Share"
                  value={formatPercent(totalDeclaredPercent)}
                />

                <MetricTile
                  label="Live Disclosed Balance"
                  value={formatNumber(totalLive, 3)}
                />
              </div>

              {tokenData.mint ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Full Mint Address
                  </div>

                  <div className="mt-3 break-all font-mono text-sm leading-6 text-zinc-300">
                    {tokenData.mint}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                WEB3MB Trust Score
              </div>

              {trustData ? (
                <>
                  <div className="mt-6 flex flex-wrap items-end gap-3">
                    <div className="text-4xl font-semibold text-white sm:text-5xl">
                      {score ?? "—"}
                    </div>

                    <div className="pb-1 text-lg text-zinc-400">/ 100</div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${gradeTone(
                        grade
                      )}`}
                    >
                      Grade {grade || "—"}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                      Status: {status || "—"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <MetricTile
                      label="Wallet Score"
                      value={`${trustData.breakdown?.walletScore ?? "—"} / 40`}
                    />

                    <MetricTile
                      label="Alert Score"
                      value={`${trustData.breakdown?.alertScore ?? "—"} / 25`}
                    />

                    <MetricTile
                      label="Liquidity Score"
                      value={`${
                        trustData.breakdown?.liquidityScore ?? "—"
                      } / 20`}
                    />

                    <MetricTile
                      label="Disclosure Score"
                      value={`${
                        trustData.breakdown?.disclosureScore ?? "—"
                      } / 15`}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Generated
                    </div>

                    <div className="mt-3 text-sm text-zinc-200">
                      {formatDateTime(trustData.generatedAt)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-300">
                  Trust score is not available yet for this project.
                </div>
              )}
            </div>
          </div>

          {trustData?.issues?.length ? (
            <div className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 sm:p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-amber-300">
                Key Issues
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {trustData.issues.map((issue, index) => (
                  <div
                    key={`${issue}-${index}`}
                    className="rounded-2xl border border-amber-500/20 bg-black/20 p-5 text-sm leading-7 text-amber-100"
                  >
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div id="wallet-health" className="scroll-mt-8">
            <WalletHealthScorePanel rankings={walletHealthRankings} />
          </div>

          <div id="wallet-risk-ranking" className="scroll-mt-8">
            <WalletRiskRankingPanel rankings={walletRiskRankings} />
          </div>

          <div id="live-wallets" className="mt-8 scroll-mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  Disclosed Wallets
                </div>

                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Live Wallet Verification
                </h2>

                <p className="mt-3 max-w-4xl text-base leading-7 text-zinc-300">
                  Publicly disclosed wallet balances compared against declared
                  allocations using live RPC data.
                </p>
              </div>

              {trustData ? (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                  RPC: Helius Mainnet
                </div>
              ) : null}
            </div>

            <div className="mt-8 space-y-5">
              {wallets.length > 0 ? (
                wallets.map((wallet, index) => {
                  const declaredTokens = getDeclaredTokens(wallet);
                  const allocationPercent = getAllocationPercent(wallet);
                  const live = Number(wallet.liveTokenBalance || 0);
                  const sol = Number(wallet.liveSolBalance || 0);
                  const varianceTokens = getVarianceTokens(wallet);
                  const variancePercent = getVariancePercent(wallet);
                  const verified = Boolean(wallet.verified);
                  const lowSol = Boolean(wallet.lowSol);
                  const absVariance = Math.abs(variancePercent);

                  const liveSolClass = lowSol
                    ? "text-rose-300"
                    : "text-white";

                  const varianceClass =
                    absVariance <= 5
                      ? "text-emerald-300"
                      : absVariance <= 25
                        ? "text-amber-300"
                        : "text-rose-300";

                  return (
                    <div
                      key={`${wallet.address}-${index}`}
                      className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4 sm:p-5"
                    >
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(520px,0.9fr)]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="min-w-0 break-words text-xl font-semibold text-white sm:text-2xl">
                              {wallet.label || "Unnamed Wallet"}
                            </h3>

                            {wallet.category ? (
                              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-200">
                                {wallet.category}
                              </span>
                            ) : null}

                            {verified ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">
                                Verified
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200">
                                Mismatch
                              </span>
                            )}

                            {lowSol ? (
                              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-rose-200">
                                Low SOL
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 break-all font-mono text-xs text-zinc-300 sm:text-sm">
                            {wallet.address || "—"}
                          </div>

                          {wallet.purpose ? (
                            <div className="mt-4 text-sm leading-7 text-zinc-300">
                              <span className="font-medium text-zinc-100">
                                Purpose:
                              </span>{" "}
                              {wallet.purpose}
                            </div>
                          ) : null}
                        </div>

                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                          <MetricTile
                            label="Declared Tokens"
                            value={formatNumber(declaredTokens, 3)}
                          />

                          <MetricTile
                            label="Declared %"
                            value={formatPercent(allocationPercent)}
                          />

                          <MetricTile
                            label="Live Balance"
                            value={formatNumber(live, 3)}
                          />

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              Live SOL
                            </div>

                            <div
                              className={`mt-3 break-words text-lg font-semibold ${liveSolClass}`}
                              title={formatNumber(sol, 6)}
                            >
                              {formatNumber(sol, 6)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              Variance Tokens
                            </div>

                            <div
                              className={`mt-3 break-words text-lg font-semibold ${varianceClass}`}
                              title={formatNumber(varianceTokens, 3)}
                            >
                              {formatNumber(varianceTokens, 3)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              Variance %
                            </div>

                            <div
                              className={`mt-3 break-words text-lg font-semibold ${varianceClass}`}
                              title={formatPercent(variancePercent, 3)}
                            >
                              {formatPercent(variancePercent, 3)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                        {wallet.address ? (
                          <a
                            href={`https://solscan.io/account/${wallet.address}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15 md:w-auto"
                          >
                            View on Solscan
                          </a>
                        ) : null}

                        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-zinc-400">
                          <span className="block text-zinc-500">
                            Short address
                          </span>

                          <span
                            className="mt-2 block truncate font-mono text-zinc-300"
                            title={wallet.address || ""}
                          >
                            {shortAddress(wallet.address)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-300">
                  No disclosed wallets are currently available for this project.
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Low SOL Wallets"
              value={lowSolWallets}
              hint="Wallets that may need operational funding."
            />

            <StatCard
              label="Declared Tokens"
              value={formatNumber(totalDeclaredTokens, 3)}
              hint="Total disclosed token allocation across wallets."
            />

            <StatCard
              label="Declared Supply Share"
              value={formatPercent(totalDeclaredPercent)}
              hint="Total disclosed allocation percentage of token supply."
            />

            <StatCard
              label="Live Disclosed Balance"
              value={formatNumber(totalLive, 3)}
              hint="Live token balance across disclosed wallets."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
