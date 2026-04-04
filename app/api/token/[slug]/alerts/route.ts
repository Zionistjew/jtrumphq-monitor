export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Connection, PublicKey } from "@solana/web3.js";
import { getProjectBySlug } from "@/lib/projects";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana.drpc.org";

type AlertSeverity = "info" | "warning" | "critical";

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
        {
          ok: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const alerts: any[] = [];
    const seen = new Set<string>();

    for (const wallet of project.wallets) {
      try {
        const pubkey = new PublicKey(wallet.address);
        const signatures = await connection.getSignaturesForAddress(pubkey, {
          limit: 2,
        });

        for (const sig of signatures) {
          if (seen.has(sig.signature)) continue;
          seen.add(sig.signature);

          let amount = 0;
          let direction: "in" | "out" | "neutral" = "neutral";

          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            const pre = tx?.meta?.preTokenBalances ?? [];
            const post = tx?.meta?.postTokenBalances ?? [];

            const preBalance = pre
              .filter(
                (b: any) => b.mint === project.mint && b.owner === wallet.address
              )
              .reduce(
                (sum: number, b: any) => sum + Number(b.uiTokenAmount?.uiAmount || 0),
                0
              );

            const postBalance = post
              .filter(
                (b: any) => b.mint === project.mint && b.owner === wallet.address
              )
              .reduce(
                (sum: number, b: any) => sum + Number(b.uiTokenAmount?.uiAmount || 0),
                0
              );

            const delta = postBalance - preBalance;
            amount = Math.abs(delta);

            if (delta > 0) direction = "in";
            else if (delta < 0) direction = "out";
          } catch (txError) {
            console.error("Slug alert parse error:", sig.signature, txError);
            continue;
          }

          if (amount <= 0) continue;

          let severity: AlertSeverity = "info";
          if (amount >= 10_000_000) severity = "critical";
          else if (amount >= 1_000_000) severity = "warning";

          alerts.push({
            signature: sig.signature,
            timestamp: sig.blockTime || 0,
            wallet: wallet.label,
            walletAddress: wallet.address,
            category: wallet.category,
            direction,
            amount,
            severity,
            message: `${wallet.label} moved ${amount.toLocaleString()} ${project.symbol}`,
          });
        }
      } catch (walletError) {
        console.error("Slug alerts wallet error:", wallet.address, walletError);
      }
    }

    alerts.sort((a, b) => b.timestamp - a.timestamp);

    return Response.json({
      ok: true,
      slug: project.slug,
      name: project.name,
      symbol: project.symbol,
      mint: project.mint,
      count: alerts.length,
      alerts,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Slug alerts API error:", error);

    return Response.json(
      {
        ok: false,
        error: "Failed to fetch project alerts",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
