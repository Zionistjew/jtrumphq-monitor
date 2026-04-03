export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Connection, PublicKey } from "@solana/web3.js";
import { OFFICIAL_WALLETS, JTRUMP_MINT } from "@/lib/wallets";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

type ActivityType = "normal" | "treasury" | "liquidity" | "whale";

type ActivityItem = {
  signature: string;
  timestamp: number;
  wallet: string;
  walletAddress: string;
  category: string;
  status: string | null;
  type: ActivityType;
  direction: "in" | "out" | "neutral";
  amount: number;
};

function getWalletType(category: string): ActivityType {
  if (category === "liquidity") return "liquidity";
  if (category === "treasury") return "treasury";
  return "normal";
}

export async function GET() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const results: ActivityItem[] = [];
    const seen = new Set<string>();

    for (const wallet of OFFICIAL_WALLETS) {
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
              .filter((b) => b.mint === JTRUMP_MINT && b.owner === wallet.address)
              .reduce((sum, b) => sum + Number(b.uiTokenAmount.uiAmount || 0), 0);

            const postBalance = post
              .filter((b) => b.mint === JTRUMP_MINT && b.owner === wallet.address)
              .reduce((sum, b) => sum + Number(b.uiTokenAmount.uiAmount || 0), 0);

            const delta = postBalance - preBalance;
            amount = Math.abs(delta);

            if (delta > 0) direction = "in";
            else if (delta < 0) direction = "out";
          } catch (txError) {
            console.error("Parsed tx error:", sig.signature, txError);
          }

          let type: ActivityType = getWalletType(wallet.category);

          if (amount >= 1_000_000) {
            type = "whale";
          }

          results.push({
            signature: sig.signature,
            timestamp: sig.blockTime || 0,
            wallet: wallet.label,
            walletAddress: wallet.address,
            category: wallet.category,
            status: sig.confirmationStatus ?? null,
            type,
            direction,
            amount,
          });
        }
      } catch (walletError) {
        console.error("Wallet activity error:", wallet.address, walletError);
      }
    }

    results.sort((a, b) => b.timestamp - a.timestamp);

    return Response.json({
      ok: true,
      count: results.length,
      activity: results,
    });
  } catch (error) {
    console.error("Activity API error:", error);

    return Response.json(
      {
        ok: false,
        error: "Failed to fetch activity",
      },
      { status: 500 }
    );
  }
}
