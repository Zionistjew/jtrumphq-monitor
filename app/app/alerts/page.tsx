"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Severity = "critical" | "warning" | "info";

type LiveAlert = {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  createdAt: string;
  projectId: number;
  projectSlug: string;
  projectName: string;
  projectSymbol: string;
  walletLabel?: string | null;
  walletAddress?: string | null;
  walletCategory?: string | null;
  value?: string | null;
  variancePct?: number | null;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  occurrenceCount?: number | null;
  isActive?: boolean;
  isNew?: boolean;
};

type ResolvedAlert = LiveAlert & {
  resolvedAt: string;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
};

type EngineSummary = {
  rpc?: string;
  walletSourceUsed?: string;
  projectsScanned?: number;
  walletsScanned?: number;
  healthyWalletReads?: number;
  rpcFailures?: number;
  allocationMismatches?: number;
  lowSolWarnings?: number;
  invalidWallets?: number;
  invalidMints?: number;
  projectsWithNoWallets?: number;
  activeAlertsInRegistry?: number;
  newCriticalAlerts?: number;
  newCriticalCount?: number;
  sampleMode?: boolean;
  generatedAt?: string;
};

type ApiAlert = {
  id?: string;
  severity?: string;
  title?: string;
  message?: string;
  createdAt?: string;
  created_at?: string;
  projectId?: number;
  project_id?: number;
  projectSlug?: string;
  project_slug?: string;
  projectName?: string;
  project_name?: string;
  projectSymbol?: string;
  project_symbol?: string;
  walletLabel?: string | null;
  wallet_label?: string | null;
  walletAddress?: string | null;
  wallet_address?: string | null;
  walletCategory?: string | null;
  wallet_category?: string | null;
  value?: string | null;
  variancePct?: number | null;
  variance_pct?: number | null;
  firstSeenAt?: string | null;
  first_seen_at?: string | null;
  lastSeenAt?: string | null;
  last_seen_at?: string | null;
  occurrenceCount?: number | null;
  occurrence_count?: number | null;
  isActive?: boolean;
  is_active?: boolean;
  isNew?: boolean;
  is_new?: boolean;
};

const REFRESH_MS = 30_000;
const DEFAULT_RESOLVER = "WEB3MB Operator";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatNumber(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function severityClasses(severity: Severity) {
  switch (severity) {
    case "critical":
      return {
        pill: "border-red-500/30 bg-red-500/10 text-red-300",
        card: "border-red-500/20 bg-red-500/5",
        dot: "bg-red-400",
      };
    case "warning":
      return {
        pill: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        card: "border-amber-500/20 bg-amber-500/5",
        dot: "bg-amber-400",
      };
    default:
      return {
        pill: "border-sky-500/30 bg-sky-500/10 text-sky-300",
        card: "border-sky-500/20 bg-sky-500/5",
        dot: "bg-sky-400",
      };
  }
}

function normalizeSeverity(value?: string): Severity {
  const v = (value || "").toLowerCase();
  if (v === "critical") return "critical";
  if (v === "warning") return "warning";
  return "info";
}

function normalizeAlert(raw: ApiAlert): LiveAlert | null {
  const id = raw.id;
  const title = raw.title;
  const message = raw.message;
  const projectSlug = raw.projectSlug ?? raw.project_slug;
  const projectName = raw.projectName ?? raw.project_name;
  const projectSymbol = raw.projectSymbol ?? raw.project_symbol;
  const createdAt = raw.createdAt ?? raw.created_at;
  const projectId = raw.projectId ?? raw.project_id;

  if (
    !id ||
    !title ||
    !message ||
    !projectSlug ||
    !projectName ||
    !projectSymbol ||
    !createdAt ||
    projectId == null
  ) {
    return null;
  }

  return {
    id,
    severity: normalizeSeverity(raw.severity),
    title,
    message,
    createdAt,
    projectId: Number(projectId),
    projectSlug,
    projectName,
    projectSymbol,
    walletLabel: raw.walletLabel ?? raw.wallet_label ?? null,
    walletAddress: raw.walletAddress ?? raw.wallet_address ?? null,
    walletCategory: raw.walletCategory ?? raw.wallet_category ?? null,
    value: raw.value ?? null,
    variancePct: raw.variancePct ?? raw.variance_pct ?? null,
    firstSeenAt: raw.firstSeenAt ?? raw.first_seen_at ?? null,
    lastSeenAt: raw.lastSeenAt ?? raw.last_seen_at ?? null,
    occurrenceCount: raw.occurrenceCount ?? raw.occurrence_count ?? 1,
    isActive: raw.isActive ?? raw.is_active ?? true,
    isNew: raw.isNew ?? raw.is_new ?? false,
  };
}

function filterProductionAlerts(alerts: LiveAlert[]) {
  return alerts.filter((alert) => {
    const slug = alert.projectSlug.toLowerCase();
    const name = alert.projectName.toLowerCase();
    const symbol = alert.projectSymbol.toLowerCase();

    const isTest =
      slug.includes("test") ||
      name.includes("test") ||
      symbol.includes("test") ||
      slug.includes("demo") ||
      name.includes("demo");

    return !isTest;
  });
}

async function fetchAlerts(): Promise<{
  alerts: LiveAlert[];
  engine: EngineSummary | null;
}> {
  const res = await fetch("/api/alerts", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load alerts: ${res.status}`);
  }

  const data = await res.json();
  const rawAlerts = Array.isArray(data?.alerts) ? data.alerts : [];

  const normalized = rawAlerts
    .map((item: ApiAlert) => normalizeAlert(item))
    .filter(Boolean) as LiveAlert[];

  return {
    alerts: filterProductionAlerts(normalized),
    engine: data?.engine ?? null,
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </div>
      <div className="mt-2 break-words text-2xl font-semibold text-white">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-400">{hint}</div> : null}
    </div>
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

function AlertCard({
  alert,
  action,
  actionLabel,
}: {
  alert: LiveAlert | ResolvedAlert;
  action?: () => void;
  actionLabel?: string;
}) {
  const styles = severityClasses(alert.severity);

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        styles.card,
        "border-white/10"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                styles.pill
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
              {alert.severity.toUpperCase()}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
              {alert.projectName} ({alert.projectSymbol})
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
              {alert.projectSlug}
            </span>

            {"isNew" in alert && alert.isNew ? (
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">
                New
              </span>
            ) : null}

            {"occurrenceCount" in alert && alert.occurrenceCount ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                Seen {alert.occurrenceCount}x
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">{alert.title}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-300">{alert.message}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Created
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {formatDateTime(alert.createdAt)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Wallet Label
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {alert.walletLabel || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Wallet Category
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {alert.walletCategory || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Variance %
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {alert.variancePct != null ? `${formatNumber(alert.variancePct)}%` : "—"}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Wallet Address
              </div>
              <div className="mt-1 break-all font-mono text-xs text-zinc-300">
                {alert.walletAddress || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Value
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {alert.value || "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                First Seen
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {formatDateTime(alert.firstSeenAt)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Last Seen
              </div>
              <div className="mt-1 break-words text-sm text-zinc-200">
                {formatDateTime(alert.lastSeenAt)}
              </div>
            </div>
          </div>

          {"resolvedAt" in alert ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Resolved At
                </div>
                <div className="mt-1 text-sm text-zinc-200">
                  {formatDateTime(alert.resolvedAt)}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Resolved By
                </div>
                <div className="mt-1 break-words text-sm text-zinc-200">
                  {alert.resolvedBy || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Resolution Note
                </div>
                <div className="mt-1 break-words text-sm text-zinc-200">
                  {alert.resolutionNote || "—"}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {action && actionLabel ? (
          <div className="shrink-0">
            <button
              onClick={action}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<ResolvedAlert[]>([]);
  const [engine, setEngine] = useState<EngineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadResolvedAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from("resolved_alerts")
      .select("*")
      .order("resolved_at", { ascending: false });

    if (error) {
      throw error;
    }

    const rows: ResolvedAlert[] = (data || []).map((row: any) => ({
      id: row.alert_id,
      severity: normalizeSeverity(row.severity),
      title: row.title,
      message: row.message,
      createdAt: row.created_at,
      projectId: row.project_id,
      projectSlug: row.project_slug,
      projectName: row.project_name,
      projectSymbol: row.project_symbol,
      walletLabel: row.wallet_label,
      walletAddress: row.wallet_address,
      walletCategory: row.wallet_category,
      value: row.value,
      variancePct: row.variance_pct,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by,
      resolutionNote: row.resolution_note,
    }));

    setResolvedAlerts(rows);
  }, [supabase]);

  const loadAll = useCallback(
    async (showRefreshState = false) => {
      try {
        setError(null);
        if (showRefreshState) setRefreshing(true);

        const [{ alerts: liveAlerts, engine: engineSummary }] = await Promise.all([
          fetchAlerts(),
          loadResolvedAlerts(),
        ]);

        setAlerts(liveAlerts);
        setEngine(engineSummary);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load alert center";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadResolvedAlerts]
  );

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  useEffect(() => {
    if (!autoRefresh) return;

    const tick = async () => {
      if (document.hidden) return;
      await loadAll(false);
    };

    const interval = window.setInterval(tick, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [autoRefresh, loadAll]);

  const resolvedIds = useMemo(
    () => new Set(resolvedAlerts.map((item) => item.id)),
    [resolvedAlerts]
  );

  const visibleActiveAlerts = useMemo(() => {
    const activeOnly = alerts.filter((alert) => !resolvedIds.has(alert.id));
    if (filter === "all") return activeOnly;
    return activeOnly.filter((alert) => alert.severity === filter);
  }, [alerts, filter, resolvedIds]);

  const visibleResolvedAlerts = useMemo(() => {
    if (filter === "all") return resolvedAlerts;
    return resolvedAlerts.filter((alert) => alert.severity === filter);
  }, [resolvedAlerts, filter]);

  const counts = useMemo(() => {
    const activeOnly = alerts.filter((alert) => !resolvedIds.has(alert.id));
    return {
      total: activeOnly.length,
      critical: activeOnly.filter((a) => a.severity === "critical").length,
      warning: activeOnly.filter((a) => a.severity === "warning").length,
      info: activeOnly.filter((a) => a.severity === "info").length,
      resolved: resolvedAlerts.length,
      newCritical:
        engine?.newCriticalCount ??
        engine?.newCriticalAlerts ??
        activeOnly.filter((a) => a.severity === "critical" && a.isNew).length,
    };
  }, [alerts, resolvedAlerts, resolvedIds, engine]);

  const handleResolve = useCallback(
    async (alert: LiveAlert) => {
      const resolvedBy =
        window.prompt("Resolved by:", DEFAULT_RESOLVER)?.trim() || DEFAULT_RESOLVER;

      const resolutionNote =
        window
          .prompt(
            "Resolution note / reason:",
            "Reviewed and acknowledged by operations."
          )
          ?.trim() || "";

      try {
        setBusyId(alert.id);

        const { error } = await supabase.from("resolved_alerts").upsert(
          {
            alert_id: alert.id,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            project_id: alert.projectId,
            project_slug: alert.projectSlug,
            project_name: alert.projectName,
            project_symbol: alert.projectSymbol,
            wallet_label: alert.walletLabel,
            wallet_address: alert.walletAddress,
            wallet_category: alert.walletCategory,
            value: alert.value,
            variance_pct: alert.variancePct,
            created_at: alert.createdAt,
            resolved_at: new Date().toISOString(),
            resolved_by: resolvedBy,
            resolution_note: resolutionNote,
          },
          { onConflict: "alert_id" }
        );

        if (error) throw error;

        await loadResolvedAlerts();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to resolve alert";
        window.alert(message);
      } finally {
        setBusyId(null);
      }
    },
    [loadResolvedAlerts, supabase]
  );

  const handleReopen = useCallback(
    async (alertId: string) => {
      try {
        setBusyId(alertId);

        const { error } = await supabase
          .from("resolved_alerts")
          .delete()
          .eq("alert_id", alertId);

        if (error) throw error;

        await loadResolvedAlerts();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reopen alert";
        window.alert(message);
      } finally {
        setBusyId(null);
      }
    },
    [loadResolvedAlerts, supabase]
  );

  const handleClearResolvedHistory = useCallback(async () => {
    const confirmed = window.confirm(
      "Clear all resolved alert history from Supabase?"
    );
    if (!confirmed) return;

    try {
      setBusyId("clear-history");

      const { error } = await supabase
        .from("resolved_alerts")
        .delete()
        .neq("alert_id", "");

      if (error) throw error;

      setResolvedAlerts([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to clear resolved history";
      window.alert(message);
    } finally {
      setBusyId(null);
    }
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                WEB3MB / ALERT CENTER
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Live Compliance Alerts
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Monitor investor-facing risk signals, wallet integrity exceptions,
                and disclosure mismatches across tracked projects.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => loadAll(true)}
                disabled={refreshing}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh Now"}
              </button>

              <button
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-medium transition",
                  autoRefresh
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-white/10 text-zinc-200 hover:bg-white/15"
                )}
              >
                Auto-Refresh {autoRefresh ? "On" : "Off"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Total Alerts" value={counts.total} />
            <StatCard label="Critical" value={counts.critical} />
            <StatCard label="Warning" value={counts.warning} />
            <StatCard label="Informational" value={counts.info} />
            <StatCard label="New Criticals" value={counts.newCritical} />
            <StatCard label="Resolved History" value={counts.resolved} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FilterChip active={filter === "all"} label="All" onClick={() => setFilter("all")} />
            <FilterChip
              active={filter === "critical"}
              label="Critical"
              onClick={() => setFilter("critical")}
            />
            <FilterChip
              active={filter === "warning"}
              label="Warning"
              onClick={() => setFilter("warning")}
            />
            <FilterChip active={filter === "info"} label="Info" onClick={() => setFilter("info")} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("active")}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition",
                activeTab === "active"
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              )}
            >
              Active Alerts
            </button>

            <button
              onClick={() => setActiveTab("resolved")}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition",
                activeTab === "resolved"
                  ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              )}
            >
              Resolved Alerts
            </button>

            {activeTab === "resolved" ? (
              <button
                onClick={handleClearResolvedHistory}
                disabled={busyId === "clear-history"}
                className="ml-auto rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === "clear-history" ? "Clearing..." : "Clear Resolved History"}
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Engine RPC
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {engine?.rpc || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Wallet Source
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {engine?.walletSourceUsed || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Projects / Wallets Scanned
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {engine
                    ? `${engine.projectsScanned ?? 0} / ${engine.walletsScanned ?? 0}`
                    : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Last Engine Run
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {formatDateTime(engine?.generatedAt)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Healthy Reads
                </div>
                <div className="mt-2 text-sm text-zinc-200">{engine?.healthyWalletReads ?? 0}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  RPC Failures
                </div>
                <div className="mt-2 text-sm text-zinc-200">{engine?.rpcFailures ?? 0}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Allocation Mismatches
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {engine?.allocationMismatches ?? 0}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Low SOL Warnings
                </div>
                <div className="mt-2 text-sm text-zinc-200">{engine?.lowSolWarnings ?? 0}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Projects With No Wallets
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {engine?.projectsWithNoWallets ?? 0}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  New Criticals
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {engine?.newCriticalCount ?? engine?.newCriticalAlerts ?? 0}
                </div>
              </div>
            </div>
          </div>

          {engine?.sampleMode ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              Sample alert mode is enabled. Turn off WEB3MB_FORCE_SAMPLE_ALERTS in your environment when done testing.
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-300">
                Loading alert center...
              </div>
            ) : activeTab === "active" ? (
              visibleActiveAlerts.length > 0 ? (
                visibleActiveAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    action={() => handleResolve(alert)}
                    actionLabel={busyId === alert.id ? "Resolving..." : "Resolve Alert"}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <div className="text-lg font-medium text-white">No active alerts right now</div>
                  <div className="mt-2 text-sm text-zinc-400">
                    The alert engine is running. Current scan summary:
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Projects Scanned
                      </div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {engine?.projectsScanned ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Wallets Scanned
                      </div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {engine?.walletsScanned ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Healthy Reads
                      </div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {engine?.healthyWalletReads ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : visibleResolvedAlerts.length > 0 ? (
              visibleResolvedAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  action={() => handleReopen(alert.id)}
                  actionLabel={busyId === alert.id ? "Reopening..." : "Reopen Alert"}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-300">
                No resolved alerts in history.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
