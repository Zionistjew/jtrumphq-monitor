"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  description?: string | null;
};

type Wallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation?: number;
  solBalance?: number;
  tokenBalance?: number;
  verified?: boolean;
  verificationStatus?: string;
};

type AlertItem = {
  id?: string | number;
  title?: string;
  message?: string;
  severity?: string;
  createdAt?: string;
  txSignature?: string;
};

type WalletApiResponse = {
  ok?: boolean;
  slug?: string;
  name?: string;
  symbol?: string;
  mint?: string;
  count?: number;
  wallets?: Wallet[];
  updatedAt?: string;
};

type AlertsApiResponse = {
  ok?: boolean;
  slug?: string;
  name?: string;
  symbol?: string;
  mint?: string;
  count?: number;
  alerts?: AlertItem[];
  updatedAt?: string;
};

type Props = {
  project: Project;
};

function shortAddress(value: string, start = 5, end = 5) {
  if (!value) return "";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(value?: string) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function severityClass(severity?: string) {
  const s = (severity || "").toLowerCase();
  if (s.includes("critical")) {
    return "border-red-400/20 bg-red-500/10 text-red-300";
  }
  if (s.includes("warn")) {
    return "border-yellow-400/20 bg-yellow-500/10 text-yellow-300";
  }
  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-cyan-400";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-400";
}

function calculateInvestorScore(args: {
  walletCount: number;
  verifiedCount: number;
  concentrationPct: number;
  alertCount: number;
  criticalCount: number;
}) {
  const { walletCount, verifiedCount, concentrationPct, alertCount, criticalCount } = args;

  let score = 100;

  if (walletCount === 0) score -= 45;
  score -= Math.min(35, concentrationPct * 0.35);
  score -= alertCount * 4;
  score -= criticalCount * 12;

  if (walletCount > 0) {
    const verificationCoverage = (verifiedCount / walletCount) * 100;
    score += Math.min(10, verificationCoverage * 0.1);
  }

  return Math.max(8, Math.min(96, Math.round(score)));
}

function MetricCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
        {label}
      </div>
      <div
        className={`mt-3 min-w-0 break-words font-bold leading-tight text-white ${
          compact ? "text-xl sm:text-2xl" : "text-3xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function TokenDashboardClient({ project }: Props) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [walletsUpdatedAt, setWalletsUpdatedAt] = useState<string>("");
  const [alertsUpdatedAt, setAlertsUpdatedAt] = useState<string>("");
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [alertError, setAlertError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWallets() {
      try {
        setLoadingWallets(true);
        setWalletError("");

        const response = await fetch(`/api/token/${project.slug}/wallets`, {
          cache: "no-store",
        });
        const data: WalletApiResponse = await response.json();

        if (!response.ok || data.ok === false) {
          throw new Error(
            typeof data === "object" && data && "detail" in data
              ? String((data as Record<string, unknown>).detail || "Failed to load wallets")
              : "Failed to load wallets"
          );
        }

        if (!cancelled) {
          setWallets(data.wallets || []);
          setWalletsUpdatedAt(data.updatedAt || "");
        }
      } catch (error) {
        if (!cancelled) {
          setWalletError(error instanceof Error ? error.message : "Failed to load wallets");
        }
      } finally {
        if (!cancelled) {
          setLoadingWallets(false);
        }
      }
    }

    async function loadAlerts() {
      try {
        setLoadingAlerts(true);
        setAlertError("");

        const response = await fetch(`/api/token/${project.slug}/alerts`, {
          cache: "no-store",
        });
        const data: AlertsApiResponse = await response.json();

        if (!response.ok || data.ok === false) {
          throw new Error(
            typeof data === "object" && data && "detail" in data
              ? String((data as Record<string, unknown>).detail || "Failed to load alerts")
              : "Failed to load alerts"
          );
        }

        if (!cancelled) {
          setAlerts(data.alerts || []);
          setAlertsUpdatedAt(data.updatedAt || "");
        }
      } catch (error) {
        if (!cancelled) {
          setAlertError(error instanceof Error ? error.message : "Failed to load alerts");
        }
      } finally {
        if (!cancelled) {
          setLoadingAlerts(false);
        }
      }
    }

    loadWallets();
    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [project.slug]);

  const metrics = useMemo(() => {
    const walletCount = wallets.length;
    const trackedToken = wallets.reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0);
    const trackedSol = wallets.reduce((sum, wallet) => sum + (wallet.solBalance || 0), 0);
    const declaredAllocation = wallets.reduce((sum, wallet) => sum + (wallet.allocation || 0), 0);

    const sortedByBalance = [...wallets].sort(
      (a, b) => (b.tokenBalance || 0) - (a.tokenBalance || 0)
    );

    const topWalletBalance = sortedByBalance[0]?.tokenBalance || 0;
    const topWalletLabel = sortedByBalance[0]?.label || "Top Wallet";
    const topWalletPct = trackedToken > 0 ? (topWalletBalance / trackedToken) * 100 : 0;

    const top3Balance = sortedByBalance
      .slice(0, 3)
      .reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0);
    const top3Pct = trackedToken > 0 ? (top3Balance / trackedToken) * 100 : 0;

    const verifiedCount = wallets.filter(
      (wallet) =>
        wallet.verified === true ||
        (wallet.verificationStatus || "").toLowerCase().includes("verified")
    ).length;

    const verificationCoverage = walletCount > 0 ? (verifiedCount / walletCount) * 100 : 0;

    const marketingPct =
      trackedToken > 0
        ? (wallets
            .filter((wallet) =>
              (wallet.category || "").toLowerCase().includes("marketing")
            )
            .reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0) /
            trackedToken) *
          100
        : 0;

    const devPct =
      trackedToken > 0
        ? (wallets
            .filter((wallet) => {
              const category = (wallet.category || "").toLowerCase();
              return category.includes("dev") || category.includes("team");
            })
            .reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0) /
            trackedToken) *
          100
        : 0;

    const treasuryPct =
      trackedToken > 0
        ? (wallets
            .filter((wallet) =>
              (wallet.category || "").toLowerCase().includes("treasury")
            )
            .reduce((sum, wallet) => sum + (wallet.tokenBalance || 0), 0) /
            trackedToken) *
          100
        : 0;

    const criticalCount = alerts.filter((alert) =>
      (alert.severity || "").toLowerCase().includes("critical")
    ).length;

    const warningCount = alerts.filter((alert) =>
      (alert.severity || "").toLowerCase().includes("warn")
    ).length;

    const investorScore = calculateInvestorScore({
      walletCount,
      verifiedCount,
      concentrationPct: top3Pct,
      alertCount: alerts.length,
      criticalCount,
    });

    const riskNotes: string[] = [];

    if (walletCount === 0) {
      riskNotes.push("No disclosed wallets are currently attached to this public project.");
    } else {
      riskNotes.push(
        `${topWalletLabel} holds ${formatPercent(topWalletPct)} of tracked ${project.symbol}.`
      );

      if (top3Pct > 0) {
        riskNotes.push(
          `Top 3 wallets control ${formatPercent(top3Pct)} of tracked ${project.symbol}.`
        );
      }

      if (declaredAllocation > 0 && trackedToken > 0) {
        const integrityRatio = (trackedToken / declaredAllocation) * 100;
        riskNotes.push(
          `Allocation integrity is ${formatPercent(
            Math.min(999, integrityRatio)
          )}, comparing live balances to declared allocation.`
        );
      }

      riskNotes.push(
        `${formatPercent(verificationCoverage)} of disclosed wallets are currently verified.`
      );
    }

    if (criticalCount > 0) {
      riskNotes.push(`${criticalCount} critical alert(s) require attention.`);
    } else if (warningCount > 0) {
      riskNotes.push(`${warningCount} warning alert(s) are active.`);
    } else {
      riskNotes.push("No major alert conditions are currently active.");
    }

    const categoryTotals = wallets.reduce<Record<string, number>>((acc, wallet) => {
      const key = wallet.category || "uncategorized";
      acc[key] = (acc[key] || 0) + (wallet.tokenBalance || 0);
      return acc;
    }, {});

    const categoryRows = Object.entries(categoryTotals)
      .map(([category, balance]) => ({
        category,
        balance,
        pct: trackedToken > 0 ? (balance / trackedToken) * 100 : 0,
      }))
      .sort((a, b) => b.balance - a.balance);

    return {
      walletCount,
      trackedToken,
      trackedSol,
      declaredAllocation,
      topWalletPct,
      top3Pct,
      verifiedCount,
      verificationCoverage,
      marketingPct,
      devPct,
      treasuryPct,
      criticalCount,
      warningCount,
      investorScore,
      riskNotes,
      categoryRows,
    };
  }, [alerts, project.symbol, wallets]);

  const trustSealMarkup = `<img src="https://app.web3mb.com/token/${project.slug}" alt="${project.name} trust seal" />`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            Public Transparency Dashboard
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {project.name}
          </h1>

          <p className="mt-3 text-xl text-zinc-300">{project.symbol}</p>

          <p className="mt-5 max-w-3xl text-zinc-400">
            {project.description?.trim()
              ? project.description
              : "Live public accountability view for disclosed wallets, risk signals, trust metrics, and investor visibility."}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Status
          </div>
          <div className="mt-2 text-lg font-semibold text-white">Active</div>
        </div>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Project Symbol" value={project.symbol} />
          <MetricCard label="Disclosed Wallets" value={metrics.walletCount} />
          <MetricCard label="Verified Wallets" value={metrics.verifiedCount} />
          <MetricCard
            label="Verification Coverage"
            value={formatPercent(metrics.verificationCoverage)}
          />
          <MetricCard
            label="Declared Allocation"
            value={formatNumber(metrics.declaredAllocation, 0)}
            compact
          />
          <MetricCard
            label="Live Balance"
            value={formatNumber(metrics.trackedToken)}
            compact
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Mint Address
          </div>
          <div className="mt-2 break-all text-zinc-300">{project.mint}</div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                Investor-Grade Score
              </div>
              <h2 className="mt-3 text-4xl font-bold">{metrics.investorScore}</h2>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
                metrics.investorScore >= 80
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : metrics.investorScore >= 60
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : metrics.investorScore >= 40
                  ? "border border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                  : "border border-red-400/20 bg-red-400/10 text-red-300"
              }`}
            >
              {metrics.investorScore >= 80
                ? "Strong"
                : metrics.investorScore >= 60
                ? "Healthy"
                : metrics.investorScore >= 40
                ? "Elevated Risk"
                : "High Risk"}
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${scoreColor(metrics.investorScore)}`}
              style={{ width: `${metrics.investorScore}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Top Holder</div>
              <div className="mt-2 text-lg font-semibold">
                {formatPercent(metrics.topWalletPct)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Top 3 Concentration</div>
              <div className="mt-2 text-lg font-semibold">
                {formatPercent(metrics.top3Pct)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                Sell Pressure Index
              </div>
              <h2 className="mt-3 text-4xl font-bold">
                {Math.min(10, Math.round((metrics.devPct + metrics.marketingPct) / 10))}/10
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-300">
              {metrics.devPct + metrics.marketingPct > 20 ? "Warm" : "Low"}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Marketing Exposure</div>
              <div className="mt-2 text-lg font-semibold">
                {formatPercent(metrics.marketingPct)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Dev Exposure</div>
              <div className="mt-2 text-lg font-semibold">
                {formatPercent(metrics.devPct)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                Allocation Integrity
              </div>
              <h2 className="mt-3 text-4xl font-bold">
                {metrics.declaredAllocation > 0
                  ? formatNumber((metrics.trackedToken / metrics.declaredAllocation) * 100)
                  : "0"}
              </h2>
            </div>

            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
              Ratio
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Allocation Tracked</div>
              <div className="mt-2 text-lg font-semibold">
                {formatNumber(metrics.declaredAllocation, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Treasury Share</div>
              <div className="mt-2 text-lg font-semibold">
                {formatPercent(metrics.treasuryPct)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Verification Summary
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Public Verification Coverage</div>
              <div className="mt-2 text-2xl font-semibold">
                {formatPercent(metrics.verificationCoverage)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Critical Alerts</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.criticalCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Warnings / Info</div>
              <div className="mt-2 text-2xl font-semibold">{metrics.warningCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-6">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Trust Seal
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="text-lg font-semibold text-white">{project.name}</div>
            <div className="mt-1 text-cyan-300">Transparency Profile</div>
            <div className="mt-2 text-sm text-zinc-400">
              {metrics.walletCount} wallet{metrics.walletCount === 1 ? "" : "s"} disclosed •{" "}
              {formatPercent(metrics.verificationCoverage)} verified
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                Trust Seal URL
              </div>
              <div className="mt-3 break-all text-sm text-zinc-300">
                https://app.web3mb.com/token/{project.slug}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                HTML Embed Code
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">
                {trustSealMarkup}
              </pre>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Risk Notes
          </div>

          <div className="mt-5 space-y-3">
            {metrics.riskNotes.map((note, index) => (
              <div
                key={`${note}-${index}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-zinc-300"
              >
                {note}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Public Verification Details
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Verification Coverage</div>
              <div className="mt-2 text-lg font-semibold">
                {metrics.verifiedCount}/{metrics.walletCount} wallets
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Latest Wallet Data</div>
              <div className="mt-2 text-sm text-zinc-300">
                {walletsUpdatedAt ? formatDate(walletsUpdatedAt) : "Pending"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-zinc-500">Latest Alert Data</div>
              <div className="mt-2 text-sm text-zinc-300">
                {alertsUpdatedAt ? formatDate(alertsUpdatedAt) : "Pending"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                All Disclosed Wallets
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Every disclosed wallet is shown below, including token balance,
                SOL balance, allocation, and verification context.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300">
              {loadingWallets ? "Loading..." : `${metrics.walletCount} tracked`}
            </div>
          </div>

          {walletError ? (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
              {walletError}
            </div>
          ) : loadingWallets ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-400">
              Loading wallet disclosures...
            </div>
          ) : wallets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-zinc-400">
              No wallets have been added yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {wallets.map((wallet, index) => (
                <div
                  key={`${wallet.address}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xl font-semibold text-white">{wallet.label}</div>
                      <div className="mt-1 text-sm uppercase tracking-[0.16em] text-cyan-300">
                        {wallet.category}
                      </div>
                      <div className="mt-3 text-sm text-zinc-400">
                        {wallet.address}
                      </div>
                      <div className="mt-3 text-sm text-zinc-300">
                        Purpose: {wallet.purpose || "No purpose provided"}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Allocation
                        </div>
                        <div className="mt-2 font-semibold text-white">
                          {formatNumber(wallet.allocation || 0, 0)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          {project.symbol} Balance
                        </div>
                        <div className="mt-2 font-semibold text-white">
                          {formatNumber(wallet.tokenBalance || 0)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          SOL Balance
                        </div>
                        <div className="mt-2 font-semibold text-white">
                          {formatNumber(wallet.solBalance || 0, 4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] xl:col-span-4">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            Wallet Category Summaries
          </div>

          <div className="mt-5 space-y-3">
            {metrics.categoryRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                No labeled wallet categories available yet.
              </div>
            ) : (
              metrics.categoryRows.map((row) => (
                <div
                  key={row.category}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold capitalize text-white">
                      {row.category}
                    </div>
                    <div className="text-sm text-zinc-300">
                      {formatPercent(row.pct)}
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${Math.min(100, row.pct)}%` }}
                    />
                  </div>

                  <div className="mt-3 text-sm text-zinc-400">
                    {formatNumber(row.balance)} {project.symbol}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Recent Alerts
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Transfer and activity alerts for disclosed wallets.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300">
            {loadingAlerts ? "Loading..." : `${alerts.length} alert${alerts.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {alertError ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
            {alertError}
          </div>
        ) : loadingAlerts ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-400">
            Loading alert stream...
          </div>
        ) : alerts.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-zinc-400">
            No alerts detected yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={`${alert.id || index}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-semibold text-white">
                        {alert.title || "Wallet Alert"}
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${severityClass(
                          alert.severity
                        )}`}
                      >
                        {alert.severity || "Info"}
                      </div>
                    </div>

                    <p className="mt-3 max-w-4xl text-zinc-300">
                      {alert.message || "A monitoring event was detected for this project."}
                    </p>

                    {alert.txSignature ? (
                      <p className="mt-3 text-sm text-zinc-500">
                        Tx: {shortAddress(alert.txSignature, 8, 8)}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-sm text-zinc-500">
                    {formatDate(alert.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
