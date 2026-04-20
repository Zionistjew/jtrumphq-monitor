import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export async function GET() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const result = await connection.getLatestBlockhash("confirmed");

    return NextResponse.json({
      ok: true,
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to get latest blockhash",
      },
      { status: 500 }
    );
  }
}
