import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const walletAddress = String(body.walletAddress || "").trim();

    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: "walletAddress is required" },
        { status: 400 }
      );
    }

    const nonce = crypto.randomBytes(24).toString("hex");

    const message = [
      "WEB3MB Login",
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
    ].join("\n");

    const res = NextResponse.json({
      ok: true,
      walletAddress,
      nonce,
      message,
    });

    res.cookies.set("web3mb_wallet_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    });

    res.cookies.set("web3mb_wallet_address", walletAddress, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create nonce" },
      { status: 500 }
    );
  }
}
