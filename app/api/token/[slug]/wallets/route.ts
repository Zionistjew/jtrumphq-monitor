export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getProjectBySlug } from "@/lib/projects";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana.drpc.org";

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
    const mintPubkey = new PublicKey(project.mint);

    const tokenAccounts = await connection.getParsedProgramAccounts(
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      {
        filters: [
          { dataSize: 165 },
          {
            memcmp: {
              offset: 0,
              bytes: mintPubkey.toBase58(),
            },
          },
        ],
      }
    );

    const ownerToBalance = new Map<string, number>();

    for (const acct of tokenAccounts) {
      const parsed: any = acct.account.data;
      const parsedInfo = parsed?.parsed?.info;
      const owner = parsedInfo?.owner as string | undefined;
      const amount = Number(parsedInfo?.tokenAmount?.uiAmount || 0);

      if (!owner) continue;
      ownerToBalance.set(owner, (ownerToBalance.get(owner) || 0) + amount);
    }

    const wallets = await Promise.all(
      project.wallets.map(async (wallet) => {
        try {
          const pubkey = new PublicKey(wallet.address);
          const lamports = await connection.getBalance(pubkey);
          const solBalance = lamports / LAMPORTS_PER_SOL;
          const tokenBalance = ownerToBalance.get(wallet.address) || 0;

          return {
            ...wallet,
            solBalance,
            tokenBalance,
          };
        } catch (walletError) {
          console.error("Wallet balance error:", wallet.address, walletError);
          return {
            ...wallet,
            solBalance: 0,
            tokenBalance: ownerToBalance.get(wallet.address) || 0,
          };
        }
      })
    );

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
