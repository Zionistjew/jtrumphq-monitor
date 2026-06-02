import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";

export const dynamic = "force-dynamic";

const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL,
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

export async function GET() {
  const errors: string[] = [];

  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(rpcUrl, {
        commitment: "confirmed",
      });

      const result = await connection.getLatestBlockhash("confirmed");

      return NextResponse.json({
        ok: true,
        blockhash: result.blockhash,
        lastValidBlockHeight: result.lastValidBlockHeight,
        rpcUsed: maskRpcUrl(rpcUrl),
      });
    } catch (error: any) {
      errors.push(`${maskRpcUrl(rpcUrl)}: ${error?.message || "RPC failed"}`);
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Failed to get latest blockhash from all configured Solana RPC endpoints.",
      details: errors,
    },
    { status: 500 }
  );
}

function maskRpcUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname ? "/..." : ""}`;
  } catch {
    return "invalid-rpc-url";
  }
}
