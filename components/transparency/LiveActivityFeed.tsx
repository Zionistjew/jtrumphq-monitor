"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ActivityType =
  | "normal"
  | "treasury"
  | "liquidity"
  | "development"
  | "community"
  | "whale";

type ActivityDirection = "in" | "out" | "neutral";

type ActivityItem = {
  signature: string;
  timestamp: number;
  projectSlug: string;
  projectName: string;
  symbol: string;
  wallet: string;
  walletAddress: string;
  category: string;
  verified: boolean;
  type: ActivityType;
  direction: ActivityDirection;
  amount: number;
};

type ActivityResponse = {
  ok: boolean;
  projectsTracked: number;
  activityCount: number;
  whaleMovements: number;
  verifiedActivity: number;
  activity: ActivityItem[];
  updatedAt: string;
};

const REFRESH_MS = 30_000;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function shortAddress(address?: string | null) {
  if (!address) return "—";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatNumber(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "Pending";
  return new Date(timestamp * 1000).toLocaleString();
}

function typeClasses(type: ActivityType) {
  switch (type) {
    case "whale":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "treasury":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "liquidity":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    case "development":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "community":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

function directionClasses(direction: ActivityDirection) {
  if (direction === "in") return "text-emerald-300";
  if (direction === "out") return "text-red-300";
  return "text-zinc-300";
}

export default function LiveActivityFeed({
  title = "Live Activity Feed",
  subtitle = "Real-time on-chain wallet activity across monitored projects.",
  limit = 12,
  projectSlug,
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
  projectSlug?: string;
}) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async (showRefresh = false) => {
    try {
      setError(null);
      if (showRefresh) setRefreshing(true);

      const res = await fetch("/api/transparency/activity", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Activity engine failed: ${res.status}`);
      }

      const json = (await res.json()) as ActivityResponse;

      if (!json.ok) {
        throw new Error("Activity response was not successful.");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivity(false);
  }, [loadActivity]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) loadActivity(false);
    }, REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [autoRefresh, loadActivity]);

  const activity = useMemo(() => {
    const rows = data?.activity || [];
    const filtered = projectSlug
      ? rows.filter((item) => item.projectSlug === projectSlug)
      : rows;

    return filtered.slice(0, limit);
  }, [data, limit, projectSlug]);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            WEB3MB / ON-CHAIN INTELLIGENCE
          </div>

          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadActivity(true)}
            disabled={refreshing}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-black",
              autoRefresh
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                : "border-white/10 bg-white/10 text-zinc-300"
            )}
          >
            Auto {autoRefresh ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Projects
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {data?.projectsTracked ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Activity
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {data?.activityCount ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-red-300">
            Whale Moves
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {data?.whaleMovements ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-emerald-300">
            Verified Activity
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {data?.verifiedActivity ?? "—"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-300">
            Loading live activity...
          </div>
        ) : activity.length > 0 ? (
          activity.map((item) => (
            <div
              key={item.signature}
              className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em]",
                        typeClasses(item.type)
                      )}
                    >
                      {item.type}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                      {item.projectName} ({item.symbol})
                    </span>

                    {item.verified ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                        Verified Wallet
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-zinc-300">
                        Unverified
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-lg font-black text-white">
                    {item.wallet}{" "}
                    <span className={directionClasses(item.direction)}>
                      {item.direction.toUpperCase()}
                    </span>{" "}
                    {formatNumber(item.amount)} {item.symbol}
                  </div>

                  <div className="mt-2 break-all text-xs text-zinc-400">
                    {item.walletAddress}
                  </div>

                  <div className="mt-2 text-xs text-zinc-500">
                    {formatTime(item.timestamp)}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
                  <a
                    href={`https://solscan.io/tx/${item.signature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-center text-sm font-black text-cyan-200 hover:bg-cyan-500/15"
                  >
                    View Tx
                  </a>

                  <a
                    href={`/token/${item.projectSlug}`}
                    className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-black text-white hover:bg-white/15"
                  >
                    Token Page
                  </a>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 sm:col-span-2">
                    <div className="uppercase tracking-[0.16em] text-zinc-500">
                      Signature
                    </div>
                    <div className="mt-1 truncate font-mono">
                      {shortAddress(item.signature)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-300">
            No recent activity found.
          </div>
        )}
      </div>
    </section>
  );
}
