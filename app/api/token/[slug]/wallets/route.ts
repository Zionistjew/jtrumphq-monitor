import { getProjectBySlug } from "@/lib/projects";
import { fetchWalletSnapshots } from "@/server/walletMonitor";

type RouteContext = {
  params: {
    slug: string;
  };
};

type TokenAccountSnapshot = {
  mint?: string;
  amount?: number;
};

type WalletSnapshot = {
  address: string;
  solBalance?: number;
  tokenAccounts?: TokenAccountSnapshot[];
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return Response.json(
        { ok: false, error: "Missing project slug" },
        { status: 400 }
      );
    }

    const project = await getProjectBySlug(slug);

    if (!project) {
      return Response.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const snapshots = (await fetchWalletSnapshots(
      project.wallets,
      project.mint
    )) as WalletSnapshot[];

    const snapshotMap = new Map(
      snapshots.map((wallet) => [wallet.address, wallet])
    );

    const wallets = project.wallets.map((wallet) => {
      const snap = snapshotMap.get(wallet.address);

      const tokenAccount = snap?.tokenAccounts?.find(
        (account) => account.mint === project.mint
      );

      return {
        ...wallet,
        solBalance: snap?.solBalance ?? 0,
        tokenBalance: tokenAccount?.amount ?? 0,
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
