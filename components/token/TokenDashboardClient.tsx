"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StaticWallet = {
  id: string;
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation: number | null;
  created_at?: string;
};

type ProjectInfo = {
  id: number;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  description: string;
  theme_primary: string;
  theme_accent: string;
};

type LiveWallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation?: number | null;
  solBalance?: number;
  tokenBalance?: number;
  tokenAccounts?: Array<{
    mint?: string;
    amount?: number;
  }>;
};

type AlertsResponse = {
  ok: boolean;
  count?: number;
  alerts?: Array<{
    signature: string;
    wallet: string;
    category: string;
    amount: number;
    severity: "info" | "warning" | "critical";
    message: string;
    createdAt: string;
  }>;
  error?: string;
};

type ClaimsResponse = {
  ok: boolean;
  count?: number;
  claims?: Array<{
    wallet_address: string;
    wallet_label: string;
    status: string;
    verified_at?: string;
  }>;
  error?: string;
};

type WalletsResponse = {
  ok: boolean;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  count: number;
  wallets: LiveWallet[];
  updatedAt: string;
  error?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function scoreSeverityLabel(score: number) {
  if (score >= 80) return "Low Risk";
  if (score >= 60) return "Moderate Risk";
  if (score >= 40) return "Elevated Risk";
  return "Critical";
}

export default function TokenDashboardClient({
  slug,
  project,
  initialWallets,
}: {
  slug: string;
  project: ProjectInfo;
  initialWallets: StaticWallet[];
}) {
  const [liveWallets, setLiveWallets] = useState<LiveWallet[]>([]);
  const [alerts, setAlerts] = useState<AlertsResponse["alerts"]>([]);
  const [claimsCount, setClaimsCount] = useState(0);
  const [claimsUpdatedAt, setClaimsUpdatedAt] = useState<string | null>(null);

  const [walletsLoading, setWalletsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);

  const [walletsError, setWalletsError] = useState("");
  const [alertsError, setAlertsError] = useState("");
  const [claimsError, setClaimsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWallets() {
      try {
        setWalletsLoading(true);
        setWalletsError("");

        const res = await fetch(`/api/token/${slug}/wallets`, {
          cache: "no-store",
        });
        const data: WalletsResponse = await res.json();

        if (!active) return;

        if (!res.ok || !data.ok) {
          setWalletsError(data.error || "Failed to load live wallets");
          setWalletsLoading(false);
          return;
        }

        setLiveWallets(data.wallets || []);
        setWalletsLoading(false);
      } catch (error) {
        if (!active) return;
        setWalletsError(error instanceof Error ? error.message : "Failed to load live wallets");
        setWalletsLoading(false);
      }
    }

    async function loadAlerts() {
      try {
        setAlertsLoading(true);
        setAlertsError("");

        const res = await fetch(`/api/token/${slug}/alerts`, {
          cache: "no-store",
        });
        const data: AlertsResponse = await res.json();

        if (!active) return;

        if (!res.ok || !data.ok) {
          setAlertsError(data.error || "Failed to load alerts");
          setAlertsLoading(false);
          return;
        }

        setAlerts(data.alerts || []);
        setAlertsLoading(false);
      } catch (error) {
        if (!active) return;
        setAlertsError(error instanceof Error ? error.message : "Failed to load alerts");
        setAlertsLoading(false);
      }
    }

    async function loadClaims() {
      try {
        setClaimsLoading(true);
        setClaimsError("");

        const res = await fetch(`/api/token/${slug}/claims`, {
          cache: "no-store",
        });
        const data: ClaimsResponse = await res.json();

        if (!active) return;

        if (!res.ok || !data.ok) {
          setClaimsError(data.error || "Failed to load claims");
          setClaimsLoading(false);
          return;
        }

        setClaimsCount(data.count || 0);
        setClaimsUpdatedAt(data.claims?.[0]?.verified_at || null);
        setClaimsLoading(false);
      } catch (error) {
        if (!active) return;
        setClaimsError(error instanceof Error ? error.message : "Failed to load claims");
        setClaimsLoading(false);
      }
    }

    loadWallets();
    loadAlerts();
    loadClaims();

    return () => {
      active = false;
    };
  }, [slug]);

  const mergedWallets = useMemo(() => {
    if (liveWallets.length > 0) return liveWallets;

    return initialWallets.map((wallet) => ({
      label: wallet.label,
      category: wallet.category,
      address: wallet.address,
      purpose: wallet.purpose,
      allocation: wallet.allocation,
      solBalance: 0,
      tokenBalance: 0,
      tokenAccounts: [],
    }));
  }, [initialWallets, liveWallets]);

  const metrics = useMemo(() => {
    const disclosedWallets = mergedWallets.length;
    const walletsHolding = mergedWallets.filter((w) => (w.tokenBalance || 0) > 0).length;
    const trackedToken = mergedWallets.reduce((sum, w) => sum + (w.tokenBalance || 0), 0);
    const trackedSol = mergedWallets.reduce((sum, w) => sum + (w.solBalance || 0), 0);

    const balances = mergedWallets.map((w) => w.tokenBalance || 0).sort((a, b) => b - a);
    const topHolderPct = trackedToken > 0 ? ((balances[0] || 0) / trackedToken) * 100 : 0;
    const top3Pct = trackedToken > 0
      ? (balances.slice(0, 3).reduce((a, b) => a + b, 0) / trackedToken) * 100
      : 0;

    const marketingPct = trackedToken > 0
      ? (mergedWallets
          .filter((w) => (w.category || "").toLowerCase().includes("marketing"))
          .reduce((sum, w) => sum + (w.tokenBalance || 0), 0) / trackedToken) * 100
      : 0;

    const devPct = trackedToken > 0
      ? (mergedWallets
          .filter((w) => (w.category || "").toLowerCase().includes("dev"))
          .reduce((sum, w) => sum + (w.tokenBalance || 0), 0) / trackedToken) * 100
      : 0;

    const treasuryPct = trackedToken > 0
      ? (mergedWallets
          .filter((w) => (w.category || "").toLowerCase().includes("treasury"))
          .reduce((sum, w) => sum + (w.tokenBalance || 0), 0) / trackedToken) * 100
      : 0;

    const verificationCoverage = disclosedWallets > 0 ? (claimsCount / disclosedWallets) * 100 : 0;

    let investorScore = 100;
    investorScore -= Math.min(topHolderPct, 60) * 0.6;
    investorScore -= Math.min(top3Pct, 100) * 0.2;
    investorScore += Math.min(verificationCoverage, 100) * 0.2;
    investorScore = Math.max(0, Math.min(100, Math.round(investorScore)));

    let sellPressure = 0;
    sellPressure += marketingPct * 0.2;
    sellPressure += devPct * 0.15;
    sellPressure += alerts?.filter((a) => a.severity === "critical").length ? 20 : 0;
    sellPressure += alerts?.filter((a) => a.severity === "warning").length ? 10 : 0;
    sellPressure = Math.max(0, Math.min(10, Number((sellPressure / 10).toFixed(1))));

    return {
      disclosedWallets,
      walletsHolding,
      trackedToken,
      trackedSol,
      topHolderPct,
      top3Pct,
      marketingPct,
      devPct,
      treasuryPct,
      verificationCoverage,
      investorScore,
      sellPressure,
    };
  }, [alerts, claimsCount, mergedWallets]);

  const riskNotes = useMemo(() => {
    const notes: string[] = [];

    if (metrics.topHolderPct >= 50) {
      notes.push(`Top holder concentration is ${metrics.topHolderPct.toFixed(1)}% of tracked ${project.symbol}.`);
    }

    if (metrics.top3Pct >= 80) {
      notes.push(`Top 3 wallets control ${metrics.top3Pct.toFixed(1)}% of tracked ${project.symbol}.`);
    }

    if (metrics.marketingPct > 20) {
      notes.push(`Marketing wallets control ${metrics.marketingPct.toFixed(1)}% of tracked ${project.symbol}.`);
    }

    if (metrics.verificationCoverage < 100) {
      notes.push(`${Math.round(metrics.verificationCoverage)}% of disclosed wallets are currently verified.`);
    }

    if (!notes.length) {
      notes.push("No major concentration or verification risks detected from the currently tracked wallets.");
    }

    return notes;
  }, [metrics, project.symbol]);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-950/80 p-6 shadow-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-600/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Public Transparency Dashboard
            </span>
            <span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Verified by Project
            </span>
            <span className="ml-auto rounded-full border border-emerald-600/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Active
            </span>
          </div>

          <h1 className="text-4xl font-bold">{project.name}</h1>
          <div className="mt-2 text-sm uppercase tracking-widest text-zinc-400">
            {project.symbol}
          </div>
          <p className="mt-4 max-w-3xl text-zinc-300">
            {project.description || "Transparency dashboard for disclosed wallets, tracked holdings, and verification coverage."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-zinc-800 p-4">
              <div className="text-xs text-zinc-400">Project Symbol</div>
              <div className="mt-2 text-xl font-bold">{project.symbol}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 p-4">
              <div className="text-xs text-zinc-400">Disclosed Wallets</div>
              <div className="mt-2 text-xl font-bold">{metrics.disclosedWallets}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 p-4">
              <div className="text-xs text-zinc-400">Wallets Holding {project.symbol}</div>
              <div className="mt-2 text-xl font-bold">{metrics.walletsHolding}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 p-4">
              <div className="text-xs text-zinc-400">Tracked {project.symbol}</div>
              <div className="mt-2 text-xl font-bold">{formatCompact(metrics.trackedToken)}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 p-4">
              <div className="text-xs text-zinc-400">Tracked SOL</div>
              <div className="mt-2 text-xl font-bold">{formatNumber(metrics.trackedSol)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 p-4">
            <div className="text-xs text-zinc-400">Mint Address</div>
            <div className="mt-2 break-all text-sm text-zinc-200">{project.mint}</div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">Investor-Grade Score</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Concentration, distribution, and verification coverage.
                </p>
              </div>
              <span className="rounded-full border border-red-600/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {scoreSeverityLabel(metrics.investorScore)}
              </span>
            </div>

            <div className="mt-6 text-5xl font-bold">{metrics.investorScore}</div>
            <div className="mt-4 h-2 rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full bg-red-500"
                style={{ width: `${metrics.investorScore}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Top Holder</div>
                <div className="mt-2 text-lg font-bold">{metrics.topHolderPct.toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Top 3 Concentration</div>
                <div className="mt-2 text-lg font-bold">{metrics.top3Pct.toFixed(1)}%</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">Sell Pressure Index</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Marketing, dev exposure, and recent movement risk.
                </p>
              </div>
              <span className="rounded-full border border-red-600/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {metrics.sellPressure >= 7 ? "Critical" : metrics.sellPressure >= 4 ? "Elevated" : "Low"}
              </span>
            </div>

            <div className="mt-6 text-5xl font-bold">{metrics.sellPressure}/10</div>
            <div className="mt-4 h-2 rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full bg-red-500"
                style={{ width: `${metrics.sellPressure * 10}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Marketing Exposure</div>
                <div className="mt-2 text-lg font-bold">{metrics.marketingPct.toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Dev Exposure</div>
                <div className="mt-2 text-lg font-bold">{metrics.devPct.toFixed(1)}%</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold">Signal Summary</h2>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Treasury Share</div>
                <div className="mt-2 text-lg font-bold">{metrics.treasuryPct.toFixed(1)}%</div>
              </div>

              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Critical Alerts</div>
                <div className="mt-2 text-lg font-bold">
                  {alerts?.filter((a) => a.severity === "critical").length || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 p-4">
                <div className="text-xs text-zinc-400">Warnings / Info</div>
                <div className="mt-2 text-lg font-bold">
                  {(alerts?.filter((a) => a.severity === "warning").length || 0)}/
                  {(alerts?.filter((a) => a.severity === "info").length || 0)}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold">Trust Seal</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Public-facing verification block for websites, investor decks, and community pages.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">{project.name}</div>
                  <div className="mt-2 text-sm text-cyan-400">Verified by Project</div>
                  <div className="mt-2 text-sm text-zinc-400">
                    Verified by Project • {metrics.disclosedWallets} wallets disclosed • {claimsUpdatedAt ? formatDate(claimsUpdatedAt) : "Not yet claimed"}
                  </div>
                </div>

                <span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  {claimsCount > 0 ? "Verified" : "Unverified"}
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-black p-4">
                <div className="text-xs text-zinc-400">SVG MARKUP</div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">
{`<svg width="640" height="160" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="160" rx="24" fill="#09090b" />
  <text x="32" y="50" fill="#ffffff" font-size="28" font-family="Arial">WEB3MB Trust Seal</text>
  <text x="32" y="88" fill="#22d3ee" font-size="20" font-family="Arial">${project.name}</text>
  <text x="32" y="118" fill="#a1a1aa" font-size="16" font-family="Arial">Verified by Project • ${metrics.disclosedWallets} wallets disclosed</text>
</svg>`}
                </pre>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-black p-4">
                <div className="text-xs text-zinc-400">EMBED SNIPPET</div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">
{`<img src="https://app.web3mb.com/token/${slug}" alt="${project.name} trust seal" />`}
                </pre>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold">Risk Notes</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Quick interpretation of current wallet concentration and flow risk.
            </p>

            <div className="mt-6 space-y-3">
              {riskNotes.map((note, index) => (
                <div key={index} className="rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-200">
                  {note}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Disclosed Wallets</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {walletsLoading
                  ? "Refreshing live balances..."
                  : walletsError
                  ? `Live wallet feed issue: ${walletsError}`
                  : "Live wallet snapshot is active."}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300">
              Verification Coverage: {metrics.verificationCoverage.toFixed(0)}%
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {mergedWallets.map((wallet, index) => (
              <div key={`${wallet.address}-${index}`} className="rounded-2xl border border-zinc-800 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-2xl font-semibold">{wallet.label}</div>
                    <div className="mt-1 text-sm uppercase tracking-wide text-cyan-400">
                      {wallet.category}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-zinc-800 p-3">
                      <div className="text-xs text-zinc-400">Allocation</div>
                      <div className="mt-1 font-semibold">
                        {wallet.allocation != null ? formatCompact(Number(wallet.allocation)) : "Not set"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 p-3">
                      <div className="text-xs text-zinc-400">{project.symbol} Balance</div>
                      <div className="mt-1 font-semibold">
                        {formatCompact(wallet.tokenBalance || 0)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 p-3">
                      <div className="text-xs text-zinc-400">SOL Balance</div>
                      <div className="mt-1 font-semibold">
                        {formatNumber(wallet.solBalance || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 break-all text-sm text-zinc-400">{wallet.address}</div>

                {wallet.purpose ? (
                  <div className="mt-3 text-zinc-300">Purpose: {wallet.purpose}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Recent Alerts</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {alertsLoading
                  ? "Refreshing live alert feed..."
                  : alertsError
                  ? `Alert feed issue: ${alertsError}`
                  : "Recent wallet movements and risk signals."}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.signature} className="rounded-2xl border border-zinc-800 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold">{alert.message}</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {alert.wallet} • {alert.category} • {formatDate(alert.createdAt)}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        alert.severity === "critical"
                          ? "border border-red-600/40 bg-red-500/10 text-red-300"
                          : alert.severity === "warning"
                          ? "border border-yellow-600/40 bg-yellow-500/10 text-yellow-300"
                          : "border border-cyan-600/40 bg-cyan-500/10 text-cyan-300"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-zinc-800 p-4 text-zinc-400">
                No recent alerts yet.
              </div>
            )}
          </div>
        </section>

        <div>
          <Link
            href="/app/projects"
            className="inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black"
          >
            Back to My Projects
          </Link>
        </div>
      </div>
    </main>
  );
}
