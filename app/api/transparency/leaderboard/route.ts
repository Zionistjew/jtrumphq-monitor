import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PUBLIC_HIDDEN_SLUGS = ["jtrump", "10m"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isPublicHiddenSlug(slug?: string | null) {
  return PUBLIC_HIDDEN_SLUGS.includes(String(slug || "").toLowerCase());
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

function normalizeTier(value?: string | null) {
  return value || "Unverified";
}

function tierRank(tier?: string | null) {
  const t = String(tier || "").toLowerCase();

  if (t === "platinum") return 5;
  if (t === "gold") return 4;
  if (t === "silver") return 3;
  if (t === "bronze") return 2;
  if (t === "starter") return 1;

  return 0;
}

function getTierBadge(tier?: string | null) {
  const t = String(tier || "").toLowerCase();

  if (t === "platinum") return "🥇 Platinum Verified";
  if (t === "gold") return "🥈 Gold Verified";
  if (t === "silver") return "🥉 Silver Verified";
  if (t === "bronze") return "Bronze Verified";
  if (t === "starter") return "Starter Verified";

  return "Unverified";
}

function getScoreBadge(score: number, rank: number) {
  if (rank <= 10 && score > 0) return "🏆 Top 10 Trust Score";
  if (score >= 90) return "Elite Trust";
  if (score >= 80) return "Strong Trust";
  if (score >= 70) return "Moderate Trust";
  if (score >= 50) return "Developing Trust";

  return "Needs Improvement";
}

function getTransparencyBadge(row: any, rank: number) {
  if (rank <= 10 && row.verificationTierRank > 0) return "🏆 Top 10 Verified";
  if (row.verificationTier === "Platinum") return "🥇 Platinum";
  if (row.verificationTier === "Gold") return "🥈 Gold";
  if (row.verificationTier === "Silver") return "🥉 Silver";
  if (row.verifiedWallets > 0) return "Verified Wallets";

  return "Disclosure Pending";
}

function safeNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, slug, name, symbol, mint, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const publicProjects = (projects || []).filter(
      (project: any) => !isPublicHiddenSlug(project.slug)
    );

    const rows = await Promise.all(
      publicProjects.map(async (project: any) => {
        try {
          const res = await fetch(`${baseUrl}/api/trust-score/${project.slug}`, {
            cache: "no-store",
          });

          const trust = await res.json().catch(() => null);

          const score = safeNumber(trust?.trust?.score ?? trust?.score);
          const grade = String(trust?.trust?.grade ?? trust?.grade ?? "F");
          const status = String(
            trust?.trust?.status ?? trust?.status ?? "High Risk"
          );

          const verification = trust?.verification || {};
          const metrics = trust?.metrics || {};

          const disclosedWallets = safeNumber(
            verification.totalWallets ?? metrics.disclosedWallets
          );

          const verifiedWallets = safeNumber(
            verification.verifiedWallets ??
              metrics.verifiedWallets ??
              metrics.ownerVerifiedWallets
          );

          const verificationRate =
            typeof verification.verificationRate === "number"
              ? verification.verificationRate
              : disclosedWallets > 0
                ? Number(((verifiedWallets / disclosedWallets) * 100).toFixed(2))
                : 0;

          const verificationTier = normalizeTier(
            verification.tier || metrics.verificationTier
          );

          const coverageRatio = safeNumber(metrics.coverageRatio);
          const mismatchWallets = safeNumber(metrics.mismatchWallets);
          const lowSolWallets = safeNumber(metrics.lowSolWallets);
          const trustBonus = safeNumber(verification.scoreBonus);

          return {
            id: project.id,
            slug: project.slug,
            name: project.name,
            symbol: project.symbol,
            mint: project.mint,

            score,
            grade,
            status,

            disclosedWallets,
            verifiedWallets,
            verificationRate,
            verificationTier,
            verificationTierRank: tierRank(verificationTier),
            verificationLabel:
              verification.label || "Wallet owner verification coverage",
            tierBadge: getTierBadge(verificationTier),
            trustBonus,

            coverageRatio,
            mismatchWallets,
            lowSolWallets,

            marketCap: null,
            marketCapLabel: "Coming soon",

            createdAt: project.created_at,
            updatedAt: project.created_at,

            dashboardUrl: `${baseUrl}/token/${project.slug}`,
            embedUrl: `${baseUrl}/embed/${project.slug}`,
            sealUrl: `${baseUrl}/api/trust-seal/${project.slug}`,
          };
        } catch {
          return {
            id: project.id,
            slug: project.slug,
            name: project.name,
            symbol: project.symbol,
            mint: project.mint,

            score: 0,
            grade: "F",
            status: "High Risk",

            disclosedWallets: 0,
            verifiedWallets: 0,
            verificationRate: 0,
            verificationTier: "Unverified",
            verificationTierRank: 0,
            verificationLabel: "Trust score unavailable",
            tierBadge: "Unverified",
            trustBonus: 0,

            coverageRatio: 0,
            mismatchWallets: 0,
            lowSolWallets: 0,

            marketCap: null,
            marketCapLabel: "Coming soon",

            createdAt: project.created_at,
            updatedAt: project.created_at,

            dashboardUrl: `${baseUrl}/token/${project.slug}`,
            embedUrl: `${baseUrl}/embed/${project.slug}`,
            sealUrl: `${baseUrl}/api/trust-seal/${project.slug}`,
          };
        }
      })
    );

    rows.sort((a, b) => {
      if (Number(b.score) !== Number(a.score)) {
        return Number(b.score) - Number(a.score);
      }

      if (Number(b.verificationTierRank) !== Number(a.verificationTierRank)) {
        return Number(b.verificationTierRank) - Number(a.verificationTierRank);
      }

      return Number(b.verificationRate) - Number(a.verificationRate);
    });

    const rankedRows = rows.map((row, index) => ({
      rank: index + 1,
      scoreBadge: getScoreBadge(row.score, index + 1),
      transparencyBadge: getTransparencyBadge(row, index + 1),
      ...row,
    }));

    const topVerifiedProjects = [...rankedRows]
      .filter((row) => row.verifiedWallets > 0)
      .sort((a, b) => {
        if (b.verificationTierRank !== a.verificationTierRank) {
          return b.verificationTierRank - a.verificationTierRank;
        }

        if (b.verificationRate !== a.verificationRate) {
          return b.verificationRate - a.verificationRate;
        }

        return b.verifiedWallets - a.verifiedWallets;
      })
      .slice(0, 10);

    const topTrustScores = [...rankedRows]
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const recentlyVerified = [...rankedRows]
      .filter((row) => row.verifiedWallets > 0)
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 10);

    const highestTransparency = [...rankedRows]
      .sort((a, b) => {
        const aScore =
          a.verificationRate +
          a.verificationTierRank * 20 +
          a.verifiedWallets * 5 -
          a.mismatchWallets * 10 -
          a.lowSolWallets * 5;

        const bScore =
          b.verificationRate +
          b.verificationTierRank * 20 +
          b.verifiedWallets * 5 -
          b.mismatchWallets * 10 -
          b.lowSolWallets * 5;

        return bScore - aScore;
      })
      .slice(0, 10);

    return NextResponse.json(
      {
        ok: true,
        count: rankedRows.length,
        hiddenPublicSlugs: PUBLIC_HIDDEN_SLUGS,
        projects: rankedRows,
        sections: {
          topVerifiedProjects,
          topTrustScores,
          recentlyVerified,
          highestTransparency,
        },
        stats: {
          totalProjects: rankedRows.length,
          verifiedProjects: rankedRows.filter((row) => row.verifiedWallets > 0)
            .length,
          platinumProjects: rankedRows.filter(
            (row) => row.verificationTier === "Platinum"
          ).length,
          goldProjects: rankedRows.filter((row) => row.verificationTier === "Gold")
            .length,
          silverProjects: rankedRows.filter(
            (row) => row.verificationTier === "Silver"
          ).length,
          totalVerifiedWallets: rankedRows.reduce(
            (sum, row) => sum + row.verifiedWallets,
            0
          ),
          averageTrustScore:
            rankedRows.length > 0
              ? Number(
                  (
                    rankedRows.reduce((sum, row) => sum + row.score, 0) /
                    rankedRows.length
                  ).toFixed(2)
                )
              : 0,
        },
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load leaderboard",
      },
      { status: 500 }
    );
  }
}
