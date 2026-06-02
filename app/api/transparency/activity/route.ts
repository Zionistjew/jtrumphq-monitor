export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://solana.drpc.org";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ActivityType =
  | "normal"
  | "treasury"
  | "liquidity"
  | "development"
  | "community"
  | "whale";

type ActivityDirection =
  | "in"
  | "out"
  | "neutral";

type ActivityItem = {
  signature: string;
  timestamp: number;
  projectSlug: string;
  projectName: string;
  symbol: string;
  wallet: string;
  walletAddress: string;
  category: string;
  verified: boolean;
  type: ActivityType;
  direction: ActivityDirection;
  amount: number;
};

function getWalletType(category?: string): ActivityType {
  const value = (category || "").toLowerCase();

  if (value.includes("liquidity")) return "liquidity";
  if (value.includes("treasury")) return "treasury";
  if (value.includes("development")) return "development";
  if (value.includes("community")) return "community";

  return "normal";
}

async function getTokenMovement(
  connection: Connection,
  signature: string,
  walletAddress: string,
  mint: string
): Promise<{
  amount: number;
  direction: ActivityDirection;
}> {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    const pre = tx?.meta?.preTokenBalances ?? [];
    const post = tx?.meta?.postTokenBalances ?? [];

    const preBalance = pre
      .filter(
        (b: any) =>
          b.mint === mint &&
          b.owner === walletAddress
      )
      .reduce(
        (sum: number, b: any) =>
          sum + Number(b.uiTokenAmount?.uiAmount || 0),
        0);

    const postBalance = post
      .filter(
        (b: any) =>
          b.mint === mint &&
          b.owner === walletAddress
      )
      .reduce(
        (sum: number, b: any) =>
          sum + Number(b.uiTokenAmount?.uiAmount || 0),
        0);

    const delta = postBalance - preBalance;

    let direction: ActivityDirection = "neutral";

    if (delta > 0) direction = "in";
    else if (delta < 0) direction = "out";

    return {
      amount: Math.abs(delta),
      direction,
    };
  } catch {
    return {
      amount: 0,
      direction: "neutral",
    };
  }
}

export async function GET() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");

    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        slug,
        symbol,
        mint
      `);

    if (error) {
      throw error;
    }

    const results: ActivityItem[] = [];
    const seen = new Set<string>();

    for (const project of projects || []) {
      const { data: wallets } = await supabase
        .from("project_wallets")
        .select("*")
        .eq("project_id", project.id);

      for (const wallet of wallets || []) {
        try {
          if (!wallet.address) continue;

          const pubkey = new PublicKey(wallet.address);

          const signatures =
            await connection.getSignaturesForAddress(
              pubkey,
              { limit: 5 }
            );

          for (const sig of signatures) {
            if (seen.has(sig.signature)) continue;

            seen.add(sig.signature);

            const movement =
              await getTokenMovement(
                connection,
                sig.signature,
                wallet.address,
                project.mint
              );

            let type = getWalletType(wallet.category);

            if (movement.amount >= 1_000_000) {
              type = "whale";
            }

            results.push({
              signature: sig.signature,
              timestamp: sig.blockTime || 0,
              projectSlug: project.slug,
              projectName: project.name,
              symbol: project.symbol,
              wallet: wallet.label || "Wallet",
              walletAddress: wallet.address,
              category: wallet.category || "unknown",
              verified: Boolean(wallet.verified),
              type,
              direction: movement.direction,
              amount: movement.amount,
            });
          }
        } catch (err) {
          console.error(
            "Wallet activity failure:",
            wallet.address,
            err
          );
        }
      }
    }

    results.sort((a, b) => b.timestamp - a.timestamp);

    return Response.json({
      ok: true,
      projectsTracked: projects?.length || 0,
      activityCount: results.length,
      whaleMovements: results.filter(
        (x) => x.type === "whale"
      ).length,
      verifiedActivity: results.filter(
        (x) => x.verified
      ).length,
      activity: results.slice(0, 100),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transparency activity error:", error);

    return Response.json(
      {
        ok: false,
        error: "Failed to load activity",
      },
      { status: 500 }
    );
  }
}
