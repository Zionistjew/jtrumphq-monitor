import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";

type Severity = "critical" | "warning" | "info";

type ProjectRow = {
  id: number | string;
  slug?: string | null;
  name?: string | null;
  symbol?: string | null;
  mint?: string | null;
  description?: string | null;
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  discord?: string | null;
  wallets?: unknown;
};

type WalletRow = {
  id?: number | string | null;
  label?: string | null;
  category?: string | null;
  address?: string | null;
  allocation?: number | string | null;
  purpose?: string | null;
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
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  occurrence_count?: number | null;
  is_active?: boolean | null;
  updated_at?: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const rpcUrl =
  process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;

const connection = new Connection(rpcUrl, "confirmed");

const LOW_SOL_THRESHOLD = 0.01;
const WALLET_MAX_POINTS = 40;
const ALERT_MAX_POINTS = 25;
const LIQUIDITY_MAX_POINTS = 20;
const DISCLOSURE_MAX_POINTS = 15;

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function normalizeWalletRow(raw: any): WalletRow {
  return {
    id: raw?.id ?? null,
    label: raw?.label ?? raw?.wallet_label ?? raw?.name ?? null,
    category: raw?.category ?? raw?.wallet_category ?? null,
    address: raw?.address ?? raw?.wallet_address ?? null,
    allocation: raw?.allocation ?? raw?.declared_allocation ?? 0,
    purpose: raw?.purpose ?? null,
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
    if (isMissingTableError(error)) return null;
    throw new Error(`${tableName}: ${error.message}`);
  }

  return {
    wallets: Array.isArray(data) ? data.map(normalizeWalletRow) : [],
    source: tableName,
  };
}

async function loadProjectWallets(project: ProjectRow): Promise<{
  wallets: WalletRow[];
  source: string;
}> {
  const projectId = safeNumber(project.id);
  const candidateTables = ["wallets", "project_wallets", "tracked_wallets"];

  for (const tableName of candidateTables) {
    const result = await tryLoadWalletsFromTable(tableName, projectId);
    if (result) return result;
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
    console.error("trust score token balance error:", error);
    return null;
  }
}

async function getSolBalance(walletAddress: string): Promise<number | null> {
  try {
    const lamports = await connection.getBalance(new PublicKey(walletAddress));
    return lamports / 1_000_000_000;
  } catch (error) {
    console.error("trust score sol balance error:", error);
    return null;
  }
}

function gradeFromScore(score: number) {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

function statusFromScore(score: number) {
  if (score >= 85) return "Trusted";
  if (score >= 70) return "Monitor";
  if (score >= 50) return "Elevated Risk";
  return "High Risk";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Missing project slug" },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const projectRow = project as ProjectRow;
    const projectId = safeNumber(projectRow.id);
    const projectName = safeString(projectRow.name, "Unnamed Project");
    const projectSymbol = safeString(projectRow.symbol, "N/A");
    const mint = safeString(projectRow.mint);

    const walletLoad = await loadProjectWallets(projectRow);
    const wallets = walletLoad.wallets;

    let validWallets = 0;
    let readableWallets = 0;
    let verifiedWallets = 0;
    let mismatchWallets = 0;
    let lowSolWallets = 0;
    let invalidWallets = 0;
    let declaredTotal = 0;
    let liveTotal = 0;

    const walletBreakdown: Array<{
      label: string;
      category: string;
      address: string;
      declaredAllocation: number;
      liveTokenBalance: number | null;
      liveSolBalance: number | null;
      variance: number | null;
      verified: boolean;
      lowSol: boolean;
    }> = [];

    for (const wallet of wallets) {
      const address = safeString(wallet.address);
      const label = safeString(wallet.label, "Unnamed Wallet");
      const category = safeString(wallet.category, "uncategorized");
      const declaredAllocation = safeNumber(wallet.allocation, 0);

      declaredTotal += declaredAllocation;

      if (!isValidPublicKey(address)) {
        invalidWallets += 1;
        walletBreakdown.push({
          label,
          category,
          address: address || "Missing address",
          declaredAllocation,
          liveTokenBalance: null,
          liveSolBalance: null,
          variance: null,
          verified: false,
          lowSol: false,
        });
        continue;
      }

      validWallets += 1;

      let liveTokenBalance: number | null = null;
      if (isValidPublicKey(mint)) {
        liveTokenBalance = await getTokenBalance(address, mint);
      }

      const liveSolBalance = await getSolBalance(address);

      if (liveTokenBalance !== null) {
        readableWallets += 1;
        liveTotal += liveTokenBalance;
      }

      const variance =
        liveTokenBalance === null ? null : liveTokenBalance - declaredAllocation;
      const verified = variance !== null && Math.abs(variance) === 0;
      const lowSol =
        liveSolBalance !== null && liveSolBalance <= LOW_SOL_THRESHOLD;

      if (verified) verifiedWallets += 1;
      if (variance !== null && Math.abs(variance) > 0) mismatchWallets += 1;
      if (lowSol) lowSolWallets += 1;

      walletBreakdown.push({
        label,
        category,
        address,
        declaredAllocation,
        liveTokenBalance,
        liveSolBalance,
        variance,
        verified,
        lowSol,
      });
    }

    let walletScore = WALLET_MAX_POINTS;
    const issues: string[] = [];

    const coverageRatio =
      declaredTotal > 0 ? (liveTotal / declaredTotal) * 100 : 0;

    if (wallets.length === 0) {
      walletScore = 0;
      issues.push("No disclosed wallets configured.");
    } else {
      if (!isValidPublicKey(mint)) {
        walletScore -= 12;
        issues.push("Project mint is missing or invalid.");
      }

      if (invalidWallets > 0) {
        walletScore -= invalidWallets * 5;
        issues.push(
          `${invalidWallets} invalid wallet${invalidWallets > 1 ? "s" : ""} found.`
        );
      }

      if (mismatchWallets > 0) {
        walletScore -= mismatchWallets * 6;
        issues.push(
          `${mismatchWallets} wallet allocation mismatch${
            mismatchWallets > 1 ? "es" : ""
          }.`
        );
      }

      if (coverageRatio > 100) {
        walletScore -= 6;
        issues.push("Coverage ratio exceeds 100%.");
      }

      if (readableWallets < validWallets) {
        walletScore -= (validWallets - readableWallets) * 3;
        issues.push("Some wallets could not be read live from RPC.");
      }

      walletScore = clamp(walletScore, 0, WALLET_MAX_POINTS);
    }

    const { data: activeAlertsRaw, error: activeAlertsError } = await supabase
      .from("active_alerts")
      .select("*")
      .eq("project_slug", slug)
      .eq("is_active", true);

    let criticalAlerts = 0;
    let warningAlerts = 0;
    let infoAlerts = 0;

    if (!activeAlertsError && Array.isArray(activeAlertsRaw)) {
      for (const alert of activeAlertsRaw as ActiveAlertRow[]) {
        if (alert.severity === "critical") criticalAlerts += 1;
        else if (alert.severity === "warning") warningAlerts += 1;
        else infoAlerts += 1;
      }
    }

    let alertScore = ALERT_MAX_POINTS;
    alertScore -= criticalAlerts * 8;
    alertScore -= warningAlerts * 3;
    alertScore -= infoAlerts * 1;
    alertScore = clamp(alertScore, 0, ALERT_MAX_POINTS);

    if (criticalAlerts > 0) {
      issues.push(
        `${criticalAlerts} active critical alert${criticalAlerts > 1 ? "s" : ""}.`
      );
    }
    if (warningAlerts > 0) {
      issues.push(
        `${warningAlerts} active warning alert${warningAlerts > 1 ? "s" : ""}.`
      );
    }

    let liquidityScore = LIQUIDITY_MAX_POINTS;
    const treasuryLikeWallets = walletBreakdown.filter((wallet) => {
      const text = `${wallet.label} ${wallet.category}`.toLowerCase();
      return (
        text.includes("treasury") ||
        text.includes("liquidity") ||
        text.includes("lp") ||
        text.includes("community")
      );
    });

    if (treasuryLikeWallets.length === 0) {
      liquidityScore -= 8;
      issues.push("No treasury, liquidity, or community wallet identified.");
    }

    const lowSolOperational = treasuryLikeWallets.filter(
      (wallet) => wallet.lowSol
    ).length;

    if (lowSolOperational > 0) {
      liquidityScore -= lowSolOperational * 4;
      issues.push(
        `${lowSolOperational} operational wallet${
          lowSolOperational > 1 ? "s" : ""
        } with low SOL.`
      );
    }

    const fundedOperational = treasuryLikeWallets.filter((wallet) => {
      const sol = Number(wallet.liveSolBalance || 0);
      return sol > LOW_SOL_THRESHOLD;
    }).length;

    if (treasuryLikeWallets.length > 0 && fundedOperational === 0) {
      liquidityScore -= 6;
    }

    liquidityScore = clamp(liquidityScore, 0, LIQUIDITY_MAX_POINTS);

    let disclosureScore = DISCLOSURE_MAX_POINTS;

    if (!isValidPublicKey(mint)) disclosureScore -= 5;
    if (wallets.length === 0) disclosureScore -= 5;
    if (!safeString(projectRow.description)) disclosureScore -= 2;
    if (!safeString(projectRow.website)) disclosureScore -= 1;
    if (
      !safeString(projectRow.twitter) &&
      !safeString(projectRow.telegram) &&
      !safeString(projectRow.discord)
    ) {
      disclosureScore -= 2;
    }

    disclosureScore = clamp(disclosureScore, 0, DISCLOSURE_MAX_POINTS);

    const score = clamp(
      walletScore + alertScore + liquidityScore + disclosureScore,
      0,
      100
    );

    const grade = gradeFromScore(score);
    const status = statusFromScore(score);

    return NextResponse.json({
      ok: true,
      project: {
        id: projectId,
        slug,
        name: projectName,
        symbol: projectSymbol,
        mint: mint || null,
      },
      score,
      grade,
      status,
      breakdown: {
        walletScore,
        alertScore,
        liquidityScore,
        disclosureScore,
      },
      metrics: {
        walletSourceUsed: walletLoad.source,
        disclosedWallets: wallets.length,
        validWallets,
        readableWallets,
        verifiedWallets,
        mismatchWallets,
        lowSolWallets,
        invalidWallets,
        declaredAllocation: declaredTotal,
        liveDisclosedBalance: liveTotal,
        coverageRatio,
        activeCriticalAlerts: criticalAlerts,
        activeWarningAlerts: warningAlerts,
        activeInfoAlerts: infoAlerts,
      },
      issues: Array.from(new Set(issues)),
      wallets: walletBreakdown,
      generatedAt: new Date().toISOString(),
      rpc: rpcUrl.includes("helius") ? "Helius" : "Custom RPC",
    });
  } catch (error: any) {
    console.error("trust score route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown trust score error",
      },
      { status: 500 }
    );
  }
}
