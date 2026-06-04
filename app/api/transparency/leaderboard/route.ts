import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const rows = await Promise.all(
      (projects || []).map(async (project: any) => {
        try {
          const res = await fetch(`${baseUrl}/api/trust-score/${project.slug}`, {
            cache: "no-store",
          });

          const trust = await res.json().catch(() => null);

          const score = Number(trust?.trust?.score ?? trust?.score ?? 0);
          const grade = String(trust?.trust?.grade ?? trust?.grade ?? "F");
          const status = String(
            trust?.trust?.status ?? trust?.status ?? "High Risk"
          );

          const verification = trust?.verification || {};
          const metrics = trust?.metrics || {};

          const disclosedWallets = Number(
            verification.totalWallets ?? metrics.disclosedWallets ?? 0
          );

          const verifiedWallets = Number(
            verification.verifiedWallets ??
              metrics.verifiedWallets ??
              metrics.ownerVerifiedWallets ??
              0
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
            trustBonus: Number(verification.scoreBonus || 0),
            coverageRatio: Number(metrics.coverageRatio || 0),
            mismatchWallets: Number(metrics.mismatchWallets || 0),
            lowSolWallets: Number(metrics.lowSolWallets || 0),
            createdAt: project.created_at,
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
            trustBonus: 0,
            coverageRatio: 0,
            mismatchWallets: 0,
            lowSolWallets: 0,
            createdAt: project.created_at,
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

    return NextResponse.json(
      {
        ok: true,
        count: rows.length,
        projects: rows.map((row, index) => ({
          rank: index + 1,
          ...row,
        })),
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
