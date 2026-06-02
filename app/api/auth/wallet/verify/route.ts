import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { setSessionCookie } from "@/lib/session";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value
  );
}

function uuidFromWallet(walletAddress: string) {
  const hash = crypto.createHash("sha256").update(walletAddress).digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    "8" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const walletAddress = String(body.walletAddress || "").trim();
    const message = String(body.message || "");
    const signature = body.signature;

    if (!walletAddress || !message || !signature) {
      return NextResponse.json(
        {
          ok: false,
          error: "walletAddress, message, and signature are required",
        },
        { status: 400 }
      );
    }

    const nonce = req.cookies.get("web3mb_wallet_nonce")?.value;
    const nonceWallet = req.cookies.get("web3mb_wallet_address")?.value;

    if (!nonce || !nonceWallet) {
      return NextResponse.json(
        { ok: false, error: "Login nonce expired. Please connect Phantom again." },
        { status: 400 }
      );
    }

    if (nonceWallet !== walletAddress) {
      return NextResponse.json(
        { ok: false, error: "Wallet mismatch. Please reconnect Phantom." },
        { status: 400 }
      );
    }

    if (!message.includes(`Nonce: ${nonce}`)) {
      return NextResponse.json(
        { ok: false, error: "Invalid nonce in message" },
        { status: 400 }
      );
    }

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = new Uint8Array(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!verified) {
      return NextResponse.json(
        { ok: false, error: "Signature verification failed" },
        { status: 400 }
      );
    }

    const userId = isUuid(walletAddress) ? walletAddress : uuidFromWallet(walletAddress);

    await setSessionCookie({
      userId,
      walletAddress,
      role: "user",
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        walletAddress,
        role: "user",
      },
    });

    res.cookies.delete("web3mb_wallet_nonce");
    res.cookies.delete("web3mb_wallet_address");

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to verify wallet login" },
      { status: 500 }
    );
  }
}
