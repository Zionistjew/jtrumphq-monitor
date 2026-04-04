export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getProjectBySlug } from "@/lib/projects";
import { fetchWalletSnapshots } from "@/server/walletMonitor";

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return Response.json(
        { ok: false, error: "Missing project slug" },
        { status: 400 }
      );
    }

    const project = getProjectBySlug(slug);

    if (!project) {
      return Response.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const snapshots = await fetchWalletSnapshots();

    const snapshotMap = new Map(
      snapshots.map((wallet: any) => [wallet.address, wallet])
    );

    const wallets = project.wallets.map((wallet) => {
      const snap = snapshotMap.get(wallet.address);

      return {
        ...wallet,
        solBalance: snap?.solBalance ?? 0,
        tokenBalance: snap?.jtrumpBalance ?? 0,
        tokenAccounts: snap?.tokenAccounts ?? [],
      };
    });

    return Response.json({
      ok: true,
      slug: project.slug,
      name: project.name,
      symbol: project.symbol,
      mint: project.mint,
      count: wallets.length,
      wallets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Slug wallets API error:", error);

    return Response.json(
      {
        ok: false,
        error: "Failed to fetch project wallets",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
