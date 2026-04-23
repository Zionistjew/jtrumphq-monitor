import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const connection = new Connection(
  process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  "confirmed"
);

const LOW_SOL_THRESHOLD = 0.01;
const ALLOCATION_VARIANCE_THRESHOLD = 5;

function isValidSolanaAddress(address: string) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function getRiskLevel(score: number) {
  if (score >= 80) return "Low";
  if (score >= 55) return "Moderate";
  return "High";
}

function getVerificationStatus(
  score: number,
  trackedWallets: number,
  invalidMint: boolean
) {
  if (invalidMint) return "Needs Review";
  if (trackedWallets === 0) return "Needs Review";
  if (score >= 85 && trackedWallets >= 3) return "Verified";
  return "Partial";
}

async function getLiveTokenBalance(wallet: string, mint: string) {
  try {
    const owner = new PublicKey(wallet);
    const mintKey = new PublicKey(mint);

    const accounts =
      await connection.getParsedTokenAccountsByOwner(owner, {
        mint: mintKey,
      });

    let total = 0;

    for (const account of accounts.value) {
      total +=
        account.account.data.parsed.info.tokenAmount.uiAmount || 0;
    }

    return total;
  } catch {
    return null;
  }
}

async function getLiveSolBalance(wallet: string) {
  try {
    const lamports = await connection.getBalance(
      new PublicKey(wallet)
    );

    return lamports / 1_000_000_000;
  } catch {
    return null;
  }
}

async function calculateTrustScore(project: any) {
  let score = 100;
  const factors: any[] = [];

  const { data: wallets } = await supabase
    .from("project_wallets")
    .select("*")
    .eq("project_id", project.id);

  const trackedWallets = wallets?.length || 0;

  let healthyWalletReads = 0;
  let allocationMismatches = 0;
  let lowSolWarnings = 0;
  let invalidWallets = 0;

  const invalidMint = !project.mint || !isValidSolanaAddress(project.mint);

  /*
  -----------------------------
  INVALID MINT
  -----------------------------
  */

  if (invalidMint) {
    score -= 35;

    factors.push({
      key: "invalid_mint",
      label: "Invalid Mint",
      impact: -35,
      status: "negative",
      detail:
        "Project mint is invalid or missing."
    });
  } else {
    score += 5;

    factors.push({
      key: "valid_mint",
      label: "Valid Mint",
      impact: 5,
      status: "positive",
      detail:
        "Project mint supports on-chain verification."
    });
  }

  /*
  -----------------------------
  WALLET DISCLOSURE
  -----------------------------
  */

  if (trackedWallets === 0) {
    score -= 30;

    factors.push({
      key: "no_wallets",
      label: "No Wallet Disclosure",
      impact: -30,
      status: "negative",
      detail:
        "No tracked wallets disclosed."
    });
  } else if (trackedWallets >= 5) {
    score += 12;
  } else if (trackedWallets >= 3) {
    score += 8;
  } else {
    score += 3;
  }

  /*
  -----------------------------
  LIVE WALLET ANALYSIS
  -----------------------------
  */

  if (!invalidMint && wallets?.length) {
    for (const wallet of wallets) {
      if (!isValidSolanaAddress(wallet.address)) {
        invalidWallets++;
        continue;
      }

      const tokenBalance =
        await getLiveTokenBalance(
          wallet.address,
          project.mint
        );

      const solBalance =
        await getLiveSolBalance(wallet.address);

      if (tokenBalance !== null) {
        healthyWalletReads++;

        const declared =
          Number(wallet.allocation || 0);

        const variance =
          declared > 0
            ? Math.abs(
                ((tokenBalance - declared) /
                  declared) *
                  100
              )
            : tokenBalance > 0
            ? 100
            : 0;

        if (
          declared === 0 && tokenBalance > 0
        ) {
          allocationMismatches++;
        }

        if (
          variance >=
          ALLOCATION_VARIANCE_THRESHOLD
        ) {
          allocationMismatches++;
        }
      }

      if (
        solBalance !== null &&
        solBalance <= LOW_SOL_THRESHOLD
      ) {
        lowSolWarnings++;
      }
    }
  }

  /*
  -----------------------------
  INVALID WALLET PENALTY
  -----------------------------
  */

  if (invalidWallets > 0) {
    const penalty =
      Math.min(
        invalidWallets * 8,
        24
      );

    score -= penalty;

    factors.push({
      key: "invalid_wallets",
      label: "Invalid Wallets",
      impact: -penalty,
      status: "negative",
      detail:
        `${invalidWallets} invalid wallets detected`
    });
  }

  /*
  -----------------------------
  ALLOCATION MISMATCH
  -----------------------------
  */

  if (allocationMismatches === 0) {
    score += 15;

    factors.push({
      key: "allocation_clean",
      label: "Allocation Integrity",
      impact: 15,
      status: "positive",
      detail:
        "Declared allocations match live balances."
    });
  } else {
    let penalty = 0;

    if (allocationMismatches === 1) {
      penalty = 45;
    } else if (
      allocationMismatches <= 3
    ) {
      penalty = 65;
    } else {
      penalty = 80;
    }

    score -= penalty;

    factors.push({
      key: "allocation_mismatch",
      label: "Allocation Risk",
      impact: -penalty,
      status: "negative",
      detail:
        `${allocationMismatches} mismatched wallets detected`
    });
  }

  /*
  -----------------------------
  LOW SOL
  -----------------------------
  */

  if (lowSolWarnings === 0) {
    score += 8;
  } else {
    let penalty = 0;

    if (lowSolWarnings === 1) {
      penalty = 15;
    } else if (
      lowSolWarnings <= 3
    ) {
      penalty = 30;
    } else {
      penalty = 45;
    }

    score -= penalty;

    factors.push({
      key: "low_sol",
      label: "Low SOL Risk",
      impact: -penalty,
      status: "negative",
      detail:
        `${lowSolWarnings} wallets may fail operational transactions`
    });
  }

  /*
  -----------------------------
  COVERAGE
  -----------------------------
  */

  const coverage =
    trackedWallets > 0
      ? Math.round(
          (healthyWalletReads /
            trackedWallets) *
            100
        )
      : 0;

  if (coverage >= 90) {
    score += 8;
  } else if (coverage >= 60) {
    score += 3;
  } else {
    score -= 12;
  }

  /*
  -----------------------------
  HARD CAPS
  -----------------------------
  */

  if (
    allocationMismatches >= 1 &&
    score > 55
  ) {
    score = 55;
  }

  if (
    lowSolWarnings >= 3 &&
    score > 70
  ) {
    score = 70;
  }

  if (
    trackedWallets === 0 &&
    score > 45
  ) {
    score = 45;
  }

  if (
    invalidMint &&
    score > 30
  ) {
    score = 30;
  }

  score = Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );

  return {
    projectId: project.id,
    projectSlug: project.slug,
    projectName: project.name,
    projectSymbol: project.symbol,
    score,
    riskLevel:
      getRiskLevel(score),
    verificationStatus:
      getVerificationStatus(
        score,
        trackedWallets,
        invalidMint
      ),
    factors,
    stats: {
      trackedWallets,
      healthyWalletReads,
      allocationMismatches,
      lowSolWarnings,
      invalidWallets,
      invalidMint,
      disclosedWalletCoveragePct:
        coverage,
    },
  };
}

export async function GET(
  req: NextRequest
) {
  try {
    const { searchParams } =
      new URL(req.url);

    const slug =
      searchParams.get("slug");

    if (slug) {
      const { data: project } =
        await supabase
          .from("projects")
          .select("*")
          .eq("slug", slug)
          .single();

      if (!project) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Project not found",
          },
          { status: 404 }
        );
      }

      const result =
        await calculateTrustScore(
          project
        );

      return NextResponse.json({
        ok: true,
        project: result,
        engine: {
          rpc: "Helius",
          generatedAt:
            new Date().toISOString(),
          mode:
            "single-project",
        },
      });
    }

    const { data: projects } =
      await supabase
        .from("projects")
        .select("*");

    const scoredProjects =
      [];

    for (const project of projects || []) {
      const result =
        await calculateTrustScore(
          project
        );

      scoredProjects.push(
        result
      );
    }

    scoredProjects.sort(
      (a, b) =>
        b.score - a.score
    );

    return NextResponse.json({
      ok: true,
      count:
        scoredProjects.length,
      projects:
        scoredProjects,
      engine: {
        rpc: "Helius",
        generatedAt:
          new Date().toISOString(),
        mode:
          "all-projects",
      },
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error.message,
      },
      { status: 500 }
    );
  }
}
