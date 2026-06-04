import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type WalletResult = {
  label?: string;
  category?: string;
  verified?: boolean;
  ownerVerified?: boolean;
  allocationHealthy?: boolean;
  lowSol?: boolean;
  allocation?: number;
  allocationPercent?: number;
  declaredTokenBalance?: number;
  liveTokenBalance?: number;
  liveSolBalance?: number;
  variance?: number;
  variancePercent?: number;
};

function normalize(num: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(num)));
}

function getBaseUrl(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";

  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  if (process.env.NEXT_PUBLIC_APP_URL && !host.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return `${proto}://${host}`;
}

function getScoreStatus(score: number) {
  if (score >= 90) return { grade: "A", status: "Excellent" };
  if (score >= 80) return { grade: "B", status: "Trusted" };
  if (score >= 70) return { grade: "C", status: "Moderate" };
  if (score >= 60) return { grade: "D", status: "Warning" };

  return { grade: "F", status: "High Risk" };
}

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

function getVerificationTier(rate: number, verifiedWallets: number) {
  if (verifiedWallets <= 0) {
    return {
      tier: "Unverified",
      label: "No owner-verified wallets",
      bonus: 0,
    };
  }

  if (rate >= 100) {
    return {
      tier: "Platinum",
      label: "All disclosed wallets owner verified",
      bonus: 20,
    };
  }

  if (rate >= 75) {
    return {
      tier: "Gold",
      label: "Majority of disclosed wallets owner verified",
      bonus: 16,
    };
  }

  if (rate >= 50) {
    return {
      tier: "Silver",
      label: "Strong owner verification coverage",
      bonus: 12,
    };
  }

  if (rate >= 25) {
    return {
      tier: "Bronze",
      label: "Partial owner verification coverage",
      bonus: 8,
    };
  }

  return {
    tier: "Starter",
    label: "Initial owner verification completed",
    bonus: 5,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const { slug } = context.params;

    if (!slug) {
      return json({ ok: false, error: "Missing project slug" }, 400);
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, symbol, slug, mint")
      .eq("slug", slug)
      .single();

    if (projectError || !project) {
      return json(
        {
          ok: false,
          error: "Project not found",
        },
        404
      );
    }

    const baseUrl = getBaseUrl(req);

    const walletRes = await fetch(`${baseUrl}/api/token/${slug}/wallets`, {
      next: { revalidate: 60 },
    });

    const walletData = await walletRes.json().catch(() => null);

    if (!walletRes.ok || !walletData?.ok) {
      return json(
        {
          ok: false,
          error:
            walletData?.detail || "Failed to load wallet verification data",
        },
        500
      );
    }

    const walletList: WalletResult[] = walletData.wallets || [];

    let ownerVerifiedCount = 0;
    let healthVerifiedCount = 0;
    let mismatchCount = 0;
    let lowSolCount = 0;
    let healthyWallets = 0;

    let totalDeclaredTokens = 0;
    let totalDeclaredPercent = 0;
    let totalLiveTokens = 0;

    const walletResults = walletList.map((wallet) => {
      const declaredTokens = Number(
        wallet.declaredTokenBalance ?? wallet.allocation ?? 0
      );

      const allocationPercent = Number(wallet.allocationPercent || 0);
      const liveTokens = Number(wallet.liveTokenBalance || 0);
      const solBalance = Number(wallet.liveSolBalance || 0);
      const varianceTokens = Number(wallet.variance || 0);
      const variancePercent = Number(wallet.variancePercent || 0);

      const ownerVerified = Boolean(wallet.ownerVerified || wallet.verified);
      const healthVerified = Boolean(wallet.allocationHealthy);
      const lowSol = Boolean(wallet.lowSol);
      const mismatch = Math.abs(variancePercent) > 2;

      if (ownerVerified) ownerVerifiedCount++;
      if (healthVerified) healthVerifiedCount++;
      if (mismatch) mismatchCount++;
      if (lowSol) lowSolCount++;
      if (!mismatch && !lowSol) healthyWallets++;

      totalDeclaredTokens += declaredTokens;
      totalDeclaredPercent += allocationPercent;
      totalLiveTokens += liveTokens;

      return {
        label: wallet.label,
        category: wallet.category,
        verified: ownerVerified,
        ownerVerified,
        healthVerified,
        mismatch,
        lowSol,
        declared: declaredTokens,
        declaredPercent: allocationPercent,
        live: liveTokens,
        variance: varianceTokens,
        variancePercent,
        solBalance,
      };
    });

    const verificationRate =
      walletList.length > 0
        ? Number(((ownerVerifiedCount / walletList.length) * 100).toFixed(2))
        : 0;

    const verificationTier = getVerificationTier(
      verificationRate,
      ownerVerifiedCount
    );

    const allWalletsVerified =
      walletList.length > 0 && ownerVerifiedCount === walletList.length;

    let score = 100;

    score -= mismatchCount * 25;
    score -= lowSolCount * 10;

    score += verificationTier.bonus;
    score += ownerVerifiedCount * 4;
    score += healthVerifiedCount * 4;

    if (allWalletsVerified) {
      score += 10;
    }

    if (healthyWallets === walletList.length && walletList.length > 0) {
      score += 8;
    }

    score = normalize(score);

    const { grade, status } = getScoreStatus(score);

    const walletScore = normalize(
      40 - mismatchCount * 10 - lowSolCount * 4 + ownerVerifiedCount * 5
    );

    const alertScore = normalize(25 - mismatchCount * 5 - lowSolCount * 3);

    const liquidityScore = normalize(20 - lowSolCount * 4);

    const disclosureScore = normalize(
      walletList.length > 0
        ? Math.min(15, walletList.length * 3) +
            Math.min(10, ownerVerifiedCount * 2)
        : 0,
      0,
      25
    );

    const verificationScore = normalize(
      walletList.length > 0 ? verificationRate : 0
    );

    const issues: string[] = [];
    const positiveSignals: string[] = [];

    if (mismatchCount > 0) {
      issues.push(
        `${mismatchCount} wallet${
          mismatchCount === 1 ? "" : "s"
        } have allocation mismatches.`
      );
    }

    if (lowSolCount > 0) {
      issues.push(
        `${lowSolCount} wallet${
          lowSolCount === 1 ? "" : "s"
        } have low SOL balance.`
      );
    }

    if (ownerVerifiedCount === 0 && walletList.length > 0) {
      issues.push("No wallets have owner verification yet.");
    }

    if (ownerVerifiedCount > 0) {
      positiveSignals.push(
        `${ownerVerifiedCount} of ${walletList.length} disclosed wallet${
          walletList.length === 1 ? "" : "s"
        } owner verified.`
      );
    }

    if (allWalletsVerified) {
      positiveSignals.push("All disclosed wallets have owner verification.");
    }

    if (healthyWallets > 0) {
      positiveSignals.push(
        `${healthyWallets} wallet${
          healthyWallets === 1 ? "" : "s"
        } show healthy wallet status.`
      );
    }

    return json({
      ok: true,

      project: {
        id: project.id,
        name: project.name,
        symbol: project.symbol,
        slug: project.slug,
        mint: project.mint,
      },

      score,
      grade,
      status,

      trust: {
        score,
        grade,
        status,
      },

      verification: {
        verifiedWallets: ownerVerifiedCount,
        totalWallets: walletList.length,
        verificationRate,
        allWalletsVerified,
        tier: verificationTier.tier,
        label: verificationTier.label,
        scoreBonus: verificationTier.bonus,
      },

      breakdown: {
        walletScore,
        alertScore,
        liquidityScore,
        disclosureScore,
        verificationScore,
      },

      metrics: {
        walletSourceUsed: walletData.source || "project_wallets",
        disclosedWallets: walletList.length,
        validWallets: walletList.length,
        readableWallets: walletList.length,
        verifiedWallets: ownerVerifiedCount,
        ownerVerifiedWallets: ownerVerifiedCount,
        verificationRate,
        verificationTier: verificationTier.tier,
        verificationScore,
        healthVerifiedWallets: healthVerifiedCount,
        mismatchWallets: mismatchCount,
        lowSolWallets: lowSolCount,
        healthyWallets,
        invalidWallets: 0,
        declaredAllocation: totalDeclaredTokens,
        declaredSupplyShare: totalDeclaredPercent,
        liveDisclosedBalance: totalLiveTokens,
        coverageRatio:
          totalDeclaredTokens > 0
            ? Number(((totalLiveTokens / totalDeclaredTokens) * 100).toFixed(2))
            : 0,
        activeCriticalAlerts: mismatchCount,
        activeWarningAlerts: lowSolCount,
        activeInfoAlerts: 0,
      },

      wallets: walletResults,
      issues,
      positiveSignals,
      generatedAt: new Date().toISOString(),
      rpc: walletData.rpc || null,
      cache: {
        ttlSeconds: 60,
        source: "wallet-api",
      },
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        error: error?.message || "Failed to calculate trust score",
      },
      500
    );
  }
}
