import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";
import { notifyCriticalAlert } from "@/lib/alerts/notify";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Severity = "critical" | "warning" | "info";

type AlertItem = {
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

type ProjectRow = {
  id: number | string;
  slug?: string | null;
  name?: string | null;
  symbol?: string | null;
  mint?: string | null;
  wallets?: unknown;
};

type WalletRow = {
  id?: number | string | null;
  label?: string | null;
  category?: string | null;
  address?: string | null;
  allocation?: number | string | null;
  project_id?: number | string | null;
};

type ActiveAlertRow = {
  alert_id: string;
  severity: Severity;
  title: string;
  message: string;
  project_id: number;
  project_slug: string;
  project_name: string;
  project_symbol: string;
  wallet_label?: string | null;
  wallet_address?: string | null;
  wallet_category?: string | null;
  value?: string | null;
  variance_pct?: number | null;
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  is_active: boolean;
  updated_at: string;
  critical_notified_at?: string | null;
  last_notification_status?: string | null;
  last_notification_error?: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const rpcUrl =
  process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;

const connection = new Connection(rpcUrl, "confirmed");

const LOW_SOL_WARNING_THRESHOLD = 0.01;
const ALLOCATION_WARNING_THRESHOLD = 5;
const ALLOCATION_CRITICAL_THRESHOLD = 15;
const ENABLE_SAMPLE_ALERTS =
  process.env.WEB3MB_FORCE_SAMPLE_ALERTS === "true";

function nowIso() {
  return new Date().toISOString();
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isValidPublicKey(value?: string | null) {
  try {
    if (!value) return false;
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function toSeverityFromVariance(variancePct: number): Severity {
  if (variancePct >= ALLOCATION_CRITICAL_THRESHOLD) return "critical";
  if (variancePct >= ALLOCATION_WARNING_THRESHOLD) return "warning";
  return "info";
}

function createAlert(input: AlertItem): AlertItem {
  return input;
}

function normalizeWalletRow(raw: any): WalletRow {
  return {
    id: raw?.id ?? null,
    label: raw?.label ?? raw?.wallet_label ?? raw?.name ?? null,
    category: raw?.category ?? raw?.wallet_category ?? null,
    address: raw?.address ?? raw?.wallet_address ?? null,
    allocation: raw?.allocation ?? raw?.declared_allocation ?? 0,
    project_id: raw?.project_id ?? null,
  };
}

function isMissingTableError(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

async function getTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<number | null> {
  try {
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
      mint,
    });

    let total = 0;

    for (const account of tokenAccounts.value) {
      const amount =
        account.account.data.parsed.info.tokenAmount.uiAmount || 0;
      total += amount;
    }

    return total;
  } catch (error) {
    console.error("getTokenBalance error:", error);
    return null;
  }
}

async function getSolBalance(walletAddress: string): Promise<number | null> {
  try {
    const lamports = await connection.getBalance(new PublicKey(walletAddress));
    return lamports / 1_000_000_000;
  } catch (error) {
    console.error("getSolBalance error:", error);
    return null;
  }
}

async function tryLoadWalletsFromTable(
  tableName: string,
  projectId: number
): Promise<{ wallets: WalletRow[]; source: string } | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("project_id", projectId)
    .order("id", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw new Error(`${tableName}: ${error.message}`);
  }

  return {
    wallets: Array.isArray(data) ? data.map(normalizeWalletRow) : [],
    source: tableName,
  };
}

async function loadProjectWallets(
  project: ProjectRow
): Promise<{
  wallets: WalletRow[];
  source: string;
}> {
  const projectId = safeNumber(project.id);
  const candidateTables = ["wallets", "project_wallets", "tracked_wallets"];

  for (const tableName of candidateTables) {
    const result = await tryLoadWalletsFromTable(tableName, projectId);
    if (result) {
      return result;
    }
  }

  if (Array.isArray(project.wallets)) {
    return {
      wallets: project.wallets.map(normalizeWalletRow),
      source: "projects.wallets-json",
    };
  }

  return {
    wallets: [],
    source: "none",
  };
}

async function syncActiveAlerts(
  currentAlerts: AlertItem[],
  generatedAt: string
): Promise<Map<string, ActiveAlertRow>> {
  const currentIds = currentAlerts.map((a) => a.id);

  const { data: existingRows, error: existingError } = await supabase
    .from("active_alerts")
    .select("*");

  if (existingError) {
    throw new Error(`active_alerts read failed: ${existingError.message}`);
  }

  const existingMap = new Map<string, ActiveAlertRow>();
  for (const row of (existingRows || []) as ActiveAlertRow[]) {
    existingMap.set(row.alert_id, row);
  }

  const upserts: ActiveAlertRow[] = currentAlerts.map((alert) => {
    const existing = existingMap.get(alert.id);

    return {
      alert_id: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      project_id: alert.projectId,
      project_slug: alert.projectSlug,
      project_name: alert.projectName,
      project_symbol: alert.projectSymbol,
      wallet_label: alert.walletLabel ?? null,
      wallet_address: alert.walletAddress ?? null,
      wallet_category: alert.walletCategory ?? null,
      value: alert.value ?? null,
      variance_pct: alert.variancePct ?? null,
      first_seen_at: existing?.first_seen_at ?? generatedAt,
      last_seen_at: generatedAt,
      occurrence_count: existing ? (existing.occurrence_count || 0) + 1 : 1,
      is_active: true,
      updated_at: generatedAt,
      critical_notified_at: existing?.critical_notified_at ?? null,
      last_notification_status: existing?.last_notification_status ?? null,
      last_notification_error: existing?.last_notification_error ?? null,
    };
  });

  if (upserts.length > 0) {
    const { error: upsertError } = await supabase
      .from("active_alerts")
      .upsert(upserts, { onConflict: "alert_id" });

    if (upsertError) {
      throw new Error(`active_alerts upsert failed: ${upsertError.message}`);
    }
  }

  const staleIds = (existingRows || [])
    .map((row: any) => row.alert_id as string)
    .filter((id) => !currentIds.includes(id));

  if (staleIds.length > 0) {
    const { error: staleError } = await supabase
      .from("active_alerts")
      .update({
        is_active: false,
        updated_at: generatedAt,
      })
      .in("alert_id", staleIds);

    if (staleError) {
      throw new Error(`active_alerts stale update failed: ${staleError.message}`);
    }
  }

  const { data: finalRows, error: finalError } = await supabase
    .from("active_alerts")
    .select("*")
    .in("alert_id", currentIds);

  if (finalError) {
    throw new Error(`active_alerts final read failed: ${finalError.message}`);
  }

  const finalMap = new Map<string, ActiveAlertRow>();
  for (const row of (finalRows || []) as ActiveAlertRow[]) {
    finalMap.set(row.alert_id, row);
  }

  return finalMap;
}

async function notifyNewCriticalAlerts(
  alerts: AlertItem[],
  activeRegistry: Map<string, ActiveAlertRow>
) {
  const candidates = alerts.filter((alert) => {
    const row = activeRegistry.get(alert.id);
    return (
      alert.severity === "critical" &&
      (alert.occurrenceCount ?? 1) === 1 &&
      !row?.critical_notified_at
    );
  });

  let notifiedCount = 0;
  let failedCount = 0;

  for (const alert of candidates) {
    const result = await notifyCriticalAlert({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      projectSlug: alert.projectSlug,
      projectName: alert.projectName,
      projectSymbol: alert.projectSymbol,
      walletLabel: alert.walletLabel,
      walletAddress: alert.walletAddress,
      walletCategory: alert.walletCategory,
      value: alert.value,
      variancePct: alert.variancePct,
      createdAt: alert.createdAt,
      firstSeenAt: alert.firstSeenAt,
      lastSeenAt: alert.lastSeenAt,
      occurrenceCount: alert.occurrenceCount,
    });

    if (result.ok) {
      notifiedCount += 1;

      await supabase
        .from("active_alerts")
        .update({
          critical_notified_at: nowIso(),
          last_notification_status: result.status,
          last_notification_error: null,
        })
        .eq("alert_id", alert.id);
    } else {
      failedCount += 1;

      await supabase
        .from("active_alerts")
        .update({
          last_notification_status: result.status,
          last_notification_error: result.error || null,
        })
        .eq("alert_id", alert.id);
    }
  }

  return {
    attempted: candidates.length,
    notified: notifiedCount,
    failed: failedCount,
  };
}

export async function GET() {
  const createdAt = nowIso();

  try {
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("id", { ascending: true });

    if (projectsError) {
      throw projectsError;
    }

    const alerts: AlertItem[] = [];

    let projectsScanned = 0;
    let walletsScanned = 0;
    let healthyWalletReads = 0;
    let rpcFailures = 0;
    let allocationMismatches = 0;
    let lowSolWarnings = 0;
    let invalidWallets = 0;
    let invalidMints = 0;
    let projectsWithNoWallets = 0;

    let walletSourceUsed = "unknown";

    for (const project of (projects || []) as ProjectRow[]) {
      projectsScanned += 1;

      const projectId = safeNumber(project.id);
      const projectSlug = safeString(project.slug, `project-${project.id}`);
      const projectName = safeString(project.name, "Unnamed Project");
      const projectSymbol = safeString(project.symbol, "N/A");
      const mint = safeString(project.mint);

      let walletLoad;
      try {
        walletLoad = await loadProjectWallets(project);
      } catch (error: any) {
        alerts.push(
          createAlert({
            id: `${projectSlug}-wallet-query-failure`,
            severity: "warning",
            title: "Wallet Query Failure",
            message:
              "Unable to load tracked wallets for this project from Supabase.",
            createdAt,
            projectId,
            projectSlug,
            projectName,
            projectSymbol,
            value: error?.message || "Wallet query failed",
          })
        );
        continue;
      }

      walletSourceUsed = walletLoad.source;
      const wallets = walletLoad.wallets;

      if (!wallets || wallets.length === 0) {
        projectsWithNoWallets += 1;

        alerts.push(
          createAlert({
            id: `${projectSlug}-no-wallets`,
            severity: "warning",
            title: "No Tracked Wallets Configured",
            message:
              "This project has no tracked wallets configured, so transparency coverage is incomplete.",
            createdAt,
            projectId,
            projectSlug,
            projectName,
            projectSymbol,
            value: `Wallet source: ${walletLoad.source}`,
          })
        );

        continue;
      }

      if (!isValidPublicKey(mint)) {
        invalidMints += 1;

        alerts.push(
          createAlert({
            id: `${projectSlug}-invalid-mint`,
            severity: "warning",
            title: "Invalid or Missing Mint",
            message:
              "This project does not have a valid mint address configured, so token balance verification cannot run.",
            createdAt,
            projectId,
            projectSlug,
            projectName,
            projectSymbol,
            value: mint || "Missing mint",
          })
        );

        continue;
      }

      for (const wallet of wallets) {
        walletsScanned += 1;

        const walletLabel = safeString(wallet.label, "Unnamed Wallet");
        const walletAddress = safeString(wallet.address);
        const walletCategory = safeString(wallet.category, "uncategorized");
        const declaredAllocation = safeNumber(wallet.allocation, 0);

        if (!isValidPublicKey(walletAddress)) {
          invalidWallets += 1;

          alerts.push(
            createAlert({
              id: `${projectSlug}-${wallet.id ?? walletLabel}-invalid-wallet`,
              severity: "warning",
              title: "Invalid Wallet Address",
              message:
                "A tracked wallet has an invalid address and cannot be verified.",
              createdAt,
              projectId,
              projectSlug,
              projectName,
              projectSymbol,
              walletLabel,
              walletAddress: walletAddress || "Missing address",
              walletCategory,
              value: `Wallet source: ${walletLoad.source}`,
            })
          );

          continue;
        }

        const [liveTokenBalance, liveSolBalance] = await Promise.all([
          getTokenBalance(walletAddress, mint),
          getSolBalance(walletAddress),
        ]);

        if (liveTokenBalance === null) {
          rpcFailures += 1;

          alerts.push(
            createAlert({
              id: `${projectSlug}-${walletAddress}-rpc-token-read-failure`,
              severity: "warning",
              title: "RPC Wallet Read Failure",
              message:
                "Unable to retrieve live token balance for this tracked wallet.",
              createdAt,
              projectId,
              projectSlug,
              projectName,
              projectSymbol,
              walletLabel,
              walletAddress,
              walletCategory,
              value: "Token read failed",
            })
          );

          continue;
        }

        healthyWalletReads += 1;

        const variance = liveTokenBalance - declaredAllocation;
        const variancePct =
          declaredAllocation > 0
            ? Math.abs((variance / declaredAllocation) * 100)
            : liveTokenBalance > 0
            ? 100
            : 0;

        if (declaredAllocation === 0 && liveTokenBalance > 0) {
          allocationMismatches += 1;

          alerts.push(
            createAlert({
              id: `${projectSlug}-${walletAddress}-undeclared-balance`,
              severity: "critical",
              title: "Undeclared Token Balance Detected",
              message:
                "This wallet holds live tokens but has no declared allocation in WEB3MB.",
              createdAt,
              projectId,
              projectSlug,
              projectName,
              projectSymbol,
              walletLabel,
              walletAddress,
              walletCategory,
              value: liveTokenBalance.toLocaleString(),
              variancePct: 100,
            })
          );
        } else if (variancePct >= ALLOCATION_WARNING_THRESHOLD) {
          allocationMismatches += 1;

          alerts.push(
            createAlert({
              id: `${projectSlug}-${walletAddress}-allocation-mismatch`,
              severity: toSeverityFromVariance(variancePct),
              title: "Allocation Mismatch Detected",
              message:
                "Live wallet balance differs materially from the declared allocation.",
              createdAt,
              projectId,
              projectSlug,
              projectName,
              projectSymbol,
              walletLabel,
              walletAddress,
              walletCategory,
              value: `${liveTokenBalance.toLocaleString()} live vs ${declaredAllocation.toLocaleString()} declared`,
              variancePct,
            })
          );
        }

        if (liveSolBalance === null) {
          rpcFailures += 1;

          alerts.push(
            createAlert({
              id: `${projectSlug}-${walletAddress}-rpc-sol-read-failure`,
              severity: "warning",
              title: "SOL Balance Read Failure",
              message:
                "Unable to retrieve live SOL balance for this tracked wallet.",
              createdAt,
              projectId,
              projectSlug,
              projectName,
              projectSymbol,
              walletLabel,
              walletAddress,
              walletCategory,
              value: "SOL read failed",
            })
          );
        } else if (liveSolBalance <= LOW_SOL_WARNING_THRESHOLD) {
          lowSolWarnings += 1;

          alerts.push(
            createAlert({
              id: `${projectSlug}-${walletAddress}-low-sol`,
              severity: "warning",
              title: "Low SOL Balance",
              message:
                "This wallet may not have enough SOL for future transactions or operational activity.",
              createdAt,
              projectId,
              projectSlug,
              projectName,
              projectSymbol,
              walletLabel,
              walletAddress,
              walletCategory,
              value: `${liveSolBalance} SOL`,
            })
          );
        }
      }
    }

    if (ENABLE_SAMPLE_ALERTS && alerts.length === 0) {
      alerts.push(
        createAlert({
          id: "sample-critical-alert",
          severity: "critical",
          title: "Sample Critical Alert",
          message:
            "Sample mode is enabled. This alert is generated for UI testing.",
          createdAt,
          projectId: 0,
          projectSlug: "sample-project",
          projectName: "Sample Project",
          projectSymbol: "SAMPLE",
          walletLabel: "Treasury",
          walletAddress: "SampleWalletAddress",
          walletCategory: "treasury",
          value: "Sample critical",
          variancePct: 22.5,
        })
      );
    }

    const activeRegistry = await syncActiveAlerts(alerts, createdAt);

    const enrichedAlerts = alerts.map((alert) => {
      const row = activeRegistry.get(alert.id);
      const occurrenceCount = row?.occurrence_count ?? 1;

      return {
        ...alert,
        firstSeenAt: row?.first_seen_at ?? null,
        lastSeenAt: row?.last_seen_at ?? null,
        occurrenceCount,
        isActive: row?.is_active ?? true,
        isNew: occurrenceCount === 1,
      };
    });

    const newCriticalCount = enrichedAlerts.filter(
      (alert) => alert.severity === "critical" && alert.isNew
    ).length;

    const notificationSummary = await notifyNewCriticalAlerts(
      enrichedAlerts,
      activeRegistry
    );

    return NextResponse.json({
      ok: true,
      count: enrichedAlerts.length,
      alerts: enrichedAlerts,
      engine: {
        rpc: rpcUrl.includes("helius") ? "Helius" : "Custom RPC",
        walletSourceUsed,
        projectsScanned,
        walletsScanned,
        healthyWalletReads,
        rpcFailures,
        allocationMismatches,
        lowSolWarnings,
        invalidWallets,
        invalidMints,
        projectsWithNoWallets,
        sampleMode: ENABLE_SAMPLE_ALERTS,
        generatedAt: createdAt,
        newCriticalCount,
        notificationsAttempted: notificationSummary.attempted,
        notificationsSent: notificationSummary.notified,
        notificationsFailed: notificationSummary.failed,
      },
    });
  } catch (error: any) {
    console.error("alerts route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown alert engine failure",
        alerts: [],
      },
      { status: 500 }
    );
  }
}
