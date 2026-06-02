import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

type ProjectRow = {
  id: number;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  wallets?: unknown;
};

type ProjectWalletRow = {
  label: string | null;
  category: string | null;
  address: string;
  purpose: string | null;
  allocation: number | null;
  verified?: boolean | null;
  verified_at?: string | null;
  verification_message?: string | null;
};

type LegacyWallet = {
  label?: string;
  category?: string;
  address?: string;
  purpose?: string;
  allocation?: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

function getRpcUrl() {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com"
  );
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

function normalizeLegacyWallets(wallets: unknown): ProjectWalletRow[] {
  if (!Array.isArray(wallets)) return [];

  return wallets
    .map((wallet) => wallet as LegacyWallet)
    .filter(
      (wallet) =>
        typeof wallet?.address === "string" &&
        wallet.address.trim().length > 0
    )
    .map((wallet) => ({
      label: wallet.label || "Wallet",
      category: wallet.category || "uncategorized",
      address: String(wallet.address).trim(),
      purpose: wallet.purpose || "",
      allocation:
        typeof wallet.allocation === "number" &&
        Number.isFinite(wallet.allocation)
          ? wallet.allocation
          : 0,
      verified: false,
      verified_at: null,
      verification_message: null,
    }));
}

async function getTokenSupply(connection: Connection, mint: PublicKey) {
  const supply = await connection.getTokenSupply(mint, "confirmed");
  const amount = Number(supply.value.uiAmount || 0);
  return Number.isFinite(amount) ? amount : 0;
}

async function getTokenBalanceForOwner(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<number> {
  const parsed = await connection.getParsedTokenAccountsByOwner(owner, {
    mint,
  });

  if (!parsed.value.length) return 0;

  return parsed.value.reduce((sum, item) => {
    const parsedInfo = item.account.data.parsed?.info;
    const amount = parsedInfo?.tokenAmount?.uiAmount;

    if (typeof amount === "number" && Number.isFinite(amount)) {
      return sum + amount;
    }

    const uiAmountString = parsedInfo?.tokenAmount?.uiAmountString;
    const numeric = Number(uiAmountString || 0);

    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);
}

function buildWalletResponse(params: {
  wallet: ProjectWalletRow;
  tokenSupply: number;
  liveTokenBalance: number;
  liveSolBalance: number;
  error?: string;
}) {
  const allocationPercent =
    typeof params.wallet.allocation === "number" &&
    Number.isFinite(params.wallet.allocation)
      ? params.wallet.allocation
      : 0;

  const declaredTokenBalance =
    params.tokenSupply > 0 ? (params.tokenSupply * allocationPercent) / 100 : 0;

  const variance = params.liveTokenBalance - declaredTokenBalance;

  const variancePercent =
    declaredTokenBalance > 0
      ? (variance / declaredTokenBalance) * 100
      : params.liveTokenBalance > 0
        ? 100
        : 0;

  const lowSol = params.liveSolBalance <= 0.01;

  const ownerVerified = Boolean(params.wallet.verified);
  const allocationHealthy =
    declaredTokenBalance > 0 &&
    Math.abs(variancePercent) <= 2 &&
    params.liveSolBalance > 0.01;

  return {
    label: params.wallet.label || "Wallet",
    category: params.wallet.category || "uncategorized",
    address: params.wallet.address,
    purpose: params.wallet.purpose || "",

    allocation: declaredTokenBalance,
    allocationPercent,
    declaredTokenBalance,
    tokenSupply: params.tokenSupply,

    verified: ownerVerified,
    ownerVerified,
    verified_at: params.wallet.verified_at || null,
    verifiedAt: params.wallet.verified_at || null,
    verification_message: params.wallet.verification_message || null,

    allocationHealthy,
    healthVerified: allocationHealthy,
    verificationStatus: ownerVerified
      ? "owner_verified"
      : allocationHealthy
        ? "health_verified"
        : "mismatch",

    lowSol,
    variance,
    variancePercent,

    liveTokenBalance: params.liveTokenBalance,
    liveSolBalance: params.liveSolBalance,

    tokenBalance: params.liveTokenBalance,
    solBalance: params.liveSolBalance,

    tokenAccounts: [],
    error: params.error || null,
  };
}

function buildHolderAnalysis(wallets: ReturnType<typeof buildWalletResponse>[]) {
  const sortedBalances = [...wallets]
    .map((wallet) => Number(wallet.liveTokenBalance || 0))
    .filter((balance) => Number.isFinite(balance) && balance >= 0)
    .sort((a, b) => b - a);

  const totalHolderTokens = sortedBalances.reduce(
    (sum, balance) => sum + balance,
    0
  );

  function percentOfTop(count: number) {
    if (totalHolderTokens <= 0) return 0;

    const topBalance = sortedBalances
      .slice(0, count)
      .reduce((sum, balance) => sum + balance, 0);

    return Number(((topBalance / totalHolderTokens) * 100).toFixed(2));
  }

  const largestHolderPercent =
    totalHolderTokens > 0
      ? Number((((sortedBalances[0] || 0) / totalHolderTokens) * 100).toFixed(2))
      : 0;

  const top10Percent = percentOfTop(10);
  const top20Percent = percentOfTop(20);
  const top50Percent = percentOfTop(50);

  let concentrationRisk: "LOW" | "MODERATE" | "HIGH" = "LOW";

  if (largestHolderPercent > 20 || top10Percent > 70) {
    concentrationRisk = "HIGH";
  } else if (largestHolderPercent > 10 || top10Percent > 50) {
    concentrationRisk = "MODERATE";
  }

  return {
    model: "DISCLOSED_PROJECT_WALLETS",
    totalAnalyzedWallets: sortedBalances.length,
    totalAnalyzedTokens: totalHolderTokens,
    largestHolderPercent,
    top10Percent,
    top20Percent,
    top50Percent,
    concentrationRisk,
  };
}

function buildSellPressure(
  wallets: ReturnType<typeof buildWalletResponse>[],
  holderAnalysis: ReturnType<typeof buildHolderAnalysis>,
  lowSolCount: number,
  mismatchCount: number
) {
  const pressureCategories = ["team", "marketing", "treasury"];

  const teamControlledPercent = wallets
    .filter((wallet) =>
      pressureCategories.includes(String(wallet.category || "").toLowerCase())
    )
    .reduce((sum, wallet) => sum + Number(wallet.allocationPercent || 0), 0);

  const liquidityPercent = wallets
    .filter(
      (wallet) => String(wallet.category || "").toLowerCase() === "liquidity"
    )
    .reduce((sum, wallet) => sum + Number(wallet.allocationPercent || 0), 0);

  let score = 0;
  const drivers: string[] = [];

  if (teamControlledPercent >= 50) {
    score += 35;
    drivers.push("High team, treasury, and marketing allocation.");
  } else if (teamControlledPercent >= 30) {
    score += 25;
    drivers.push("Moderate team, treasury, and marketing allocation.");
  } else if (teamControlledPercent >= 15) {
    score += 12;
    drivers.push("Some team, treasury, and marketing allocation exposure.");
  }

  if (liquidityPercent < 10) {
    score += 20;
    drivers.push("Liquidity allocation is below 10%.");
  } else if (liquidityPercent < 15) {
    score += 10;
    drivers.push("Liquidity allocation is below preferred range.");
  }

  if (holderAnalysis.concentrationRisk === "HIGH") {
    score += 20;
    drivers.push("Holder concentration risk is high.");
  } else if (holderAnalysis.concentrationRisk === "MODERATE") {
    score += 10;
    drivers.push("Holder concentration risk is moderate.");
  }

  if (mismatchCount > 0) {
    score += Math.min(20, mismatchCount * 5);
    drivers.push(`${mismatchCount} wallet${mismatchCount === 1 ? "" : "s"} show allocation mismatch.`);
  }

  if (lowSolCount > 0) {
    score += Math.min(15, lowSolCount * 5);
    drivers.push(`${lowSolCount} wallet${lowSolCount === 1 ? "" : "s"} have low SOL balance.`);
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let level: "LOW" | "MODERATE" | "HIGH" = "LOW";

  if (score >= 70) {
    level = "HIGH";
  } else if (score >= 40) {
    level = "MODERATE";
  }

  if (!drivers.length) {
    drivers.push("No major disclosed sell-pressure drivers detected.");
  }

  return {
    score,
    level,
    teamControlledPercent: Number(teamControlledPercent.toFixed(2)),
    liquidityPercent: Number(liquidityPercent.toFixed(2)),
    drivers,
    model: "DISCLOSED_PROJECT_WALLETS",
  };
}

export async function GET(
  _request: Request,
  context: { params: { slug: string } }
) {
  try {
    const slug = context.params.slug;

    if (!slug) {
      return json({ ok: false, detail: "Missing project slug." }, 400);
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, slug, name, symbol, mint, wallets")
      .eq("slug", slug)
      .maybeSingle<ProjectRow>();

    if (projectError) {
      return json({ ok: false, detail: projectError.message }, 500);
    }

    if (!project) {
      return json({ ok: false, detail: "Project not found." }, 404);
    }

    if (!project.mint || !isValidPublicKey(project.mint)) {
      return json(
        {
          ok: false,
          detail: "Project mint is missing or invalid.",
        },
        400
      );
    }

    const { data: normalizedWallets, error: walletRowsError } = await supabase
      .from("project_wallets")
      .select(
        "label, category, address, purpose, allocation, verified, verified_at, verification_message"
      )
      .eq("project_id", project.id);

    if (walletRowsError) {
      return json({ ok: false, detail: walletRowsError.message }, 500);
    }

    const walletRows: ProjectWalletRow[] =
      normalizedWallets && normalizedWallets.length > 0
        ? normalizedWallets
        : normalizeLegacyWallets(project.wallets);

    const validWalletRows = walletRows.filter((wallet) =>
      isValidPublicKey(wallet.address)
    );

    const connection = new Connection(getRpcUrl(), "confirmed");
    const mintKey = new PublicKey(project.mint);

    const tokenSupply = await getTokenSupply(connection, mintKey);

    const wallets = await Promise.all(
      validWalletRows.map(async (wallet) => {
        try {
          const owner = new PublicKey(wallet.address);

          const [lamports, liveTokenBalance] = await Promise.all([
            connection.getBalance(owner, "confirmed"),
            getTokenBalanceForOwner(connection, owner, mintKey),
          ]);

          const liveSolBalance = lamports / 1_000_000_000;

          return buildWalletResponse({
            wallet,
            tokenSupply,
            liveTokenBalance,
            liveSolBalance,
          });
        } catch (error) {
          return buildWalletResponse({
            wallet,
            tokenSupply,
            liveTokenBalance: 0,
            liveSolBalance: 0,
            error:
              error instanceof Error ? error.message : "Wallet read failed",
          });
        }
      })
    );

    const ownerVerifiedCount = wallets.filter((wallet) => wallet.verified).length;

    const healthVerifiedCount = wallets.filter(
      (wallet) => wallet.allocationHealthy
    ).length;

    const lowSolCount = wallets.filter((wallet) => wallet.lowSol).length;

    const mismatchCount = wallets.filter(
      (wallet) => Math.abs(Number(wallet.variancePercent || 0)) > 2
    ).length;

    const holderAnalysis = buildHolderAnalysis(wallets);

    const sellPressure = buildSellPressure(
      wallets,
      holderAnalysis,
      lowSolCount,
      mismatchCount
    );

    return json({
      ok: true,
      slug: project.slug,
      name: project.name,
      symbol: project.symbol,
      mint: project.mint,
      tokenSupply,
      count: wallets.length,
      ownerVerifiedCount,
      healthVerifiedCount,
      lowSolCount,
      mismatchCount,

      holderAnalysis,
      sellPressure,

      wallets,
      updatedAt: new Date().toISOString(),
      rpc: getRpcUrl(),
      source:
        normalizedWallets && normalizedWallets.length > 0
          ? "project_wallets"
          : "projects.wallets",
      cache: {
        ttlSeconds: 60,
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        detail:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      500
    );
  }
}
