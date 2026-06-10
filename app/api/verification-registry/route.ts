import { NextResponse } from "next/server";
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

function shortAddress(address?: string | null) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
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

function tierFromCoverage(verifiedWallets: number, totalWallets: number) {
  if (!verifiedWallets || !totalWallets) return "Unverified";

  const rate = (verifiedWallets / totalWallets) * 100;

  if (rate >= 100 && verifiedWallets >= 1) return "Platinum";
  if (rate >= 80) return "Gold";
  if (rate >= 50) return "Silver";
  if (rate >= 25) return "Bronze";
  return "Starter";
}

export async function GET() {
  try {
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, slug, name, symbol, mint, created_at")
      .order("created_at", { ascending: false });

    if (projectsError) {
      return NextResponse.json(
        { ok: false, error: projectsError.message },
        { status: 500 }
      );
    }

    const publicProjects = (projects || []).filter(
      (project: any) => !isPublicHiddenSlug(project.slug)
    );

    const publicProjectIds = new Set(publicProjects.map((project: any) => project.id));

    const { data: wallets, error: walletsError } = await supabase
      .from("project_wallets")
      .select("id, project_id, label, address, verified, created_at")
      .order("created_at", { ascending: false });

    if (walletsError) {
      return NextResponse.json(
        { ok: false, error: walletsError.message },
        { status: 500 }
      );
    }

    const publicWallets = (wallets || []).filter((wallet: any) =>
      publicProjectIds.has(wallet.project_id)
    );

    const { data: requests } = await supabase
      .from("wallet_verification_requests")
      .select("project_slug, wallet_address, status, reviewed_at, reviewed_by, created_at")
      .ilike("status", "approved")
      .order("reviewed_at", { ascending: false });

    const publicRequests = (requests || []).filter(
      (request: any) => !isPublicHiddenSlug(request.project_slug)
    );

    const projectMap = new Map(publicProjects.map((p: any) => [p.id, p]));

    const walletCounts = new Map<
      string | number,
      { total: number; verified: number }
    >();

    for (const wallet of publicWallets) {
      const current = walletCounts.get(wallet.project_id) || {
        total: 0,
        verified: 0,
      };

      current.total += 1;
      if (wallet.verified) current.verified += 1;

      walletCounts.set(wallet.project_id, current);
    }

    const approvedMap = new Map<string, any>();

    for (const request of publicRequests) {
      const key = `${String(request.project_slug).toLowerCase()}::${String(
        request.wallet_address
      ).toLowerCase()}`;

      if (!approvedMap.has(key)) {
        approvedMap.set(key, request);
      }
    }

    const rows = publicWallets
      .filter((wallet: any) => wallet.verified === true)
      .map((wallet: any) => {
        const project = projectMap.get(wallet.project_id);
        const counts = walletCounts.get(wallet.project_id) || {
          total: 0,
          verified: 0,
        };

        const tier = tierFromCoverage(counts.verified, counts.total);

        const approvalKey = `${String(project?.slug || "").toLowerCase()}::${String(
          wallet.address
        ).toLowerCase()}`;

        const approval = approvedMap.get(approvalKey);

        return {
          projectId: wallet.project_id,
          projectSlug: project?.slug || "",
          projectName: project?.name || "Unknown Project",
          projectSymbol: project?.symbol || "",
          mint: project?.mint || null,

          walletId: wallet.id,
          walletLabel: wallet.label || "Project Wallet",
          walletAddress: wallet.address,
          shortWalletAddress: shortAddress(wallet.address),

          status: "Verified",
          verified: true,
          verifiedAt:
            approval?.reviewed_at ||
            approval?.created_at ||
            wallet.created_at ||
            project?.created_at ||
            null,
          reviewedBy: approval?.reviewed_by || "WEB3MB",

          projectVerifiedWallets: counts.verified,
          projectTotalWallets: counts.total,
          verificationRate:
            counts.total > 0
              ? Number(((counts.verified / counts.total) * 100).toFixed(2))
              : 0,
          verificationTier: tier,
          verificationTierRank: tierRank(tier),

          dashboardUrl: `/token/${project?.slug || ""}`,
          sealUrl: `/api/trust-seal/${project?.slug || ""}`,
        };
      })
      .sort((a: any, b: any) => {
        if (b.verificationTierRank !== a.verificationTierRank) {
          return b.verificationTierRank - a.verificationTierRank;
        }

        return (
          new Date(b.verifiedAt || 0).getTime() -
          new Date(a.verifiedAt || 0).getTime()
        );
      });

    return NextResponse.json(
      {
        ok: true,
        count: rows.length,
        hiddenPublicSlugs: PUBLIC_HIDDEN_SLUGS,
        registry: rows,
        stats: {
          verifiedWallets: rows.length,
          verifiedProjects: new Set(rows.map((row: any) => row.projectSlug)).size,
          platinumProjects: new Set(
            rows
              .filter((row: any) => row.verificationTier === "Platinum")
              .map((row: any) => row.projectSlug)
          ).size,
          generatedAt: new Date().toISOString(),
        },
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
        error: err?.message || "Failed to load verification registry.",
      },
      { status: 500 }
    );
  }
}
