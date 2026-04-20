import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const walletAddress = String(body.walletAddress || "");

    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: "walletAddress is required" },
        { status: 400 }
      );
    }

    const nonce = crypto.randomBytes(24).toString("hex");
    store.createNonce(walletAddress, nonce);

    const message = [
      "JTRUMPHQ Login",
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
    ].join("\n");

    return NextResponse.json({
      ok: true,
      walletAddress,
      nonce,
      message,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create nonce" },
      { status: 500 }
    );
  }
}
