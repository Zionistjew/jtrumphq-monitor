import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { store } from "@/lib/store";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const walletAddress = String(body.walletAddress || "");
    const message = String(body.message || "");
    const signature = body.signature;

    if (!walletAddress || !message || !signature) {
      return NextResponse.json(
        { ok: false, error: "walletAddress, message, and signature are required" },
        { status: 400 }
      );
    }

    const nonceRecord = store.getNonce(walletAddress);
    if (!nonceRecord) {
      return NextResponse.json(
        { ok: false, error: "No nonce found for wallet" },
        { status: 400 }
      );
    }

    if (!message.includes(`Nonce: ${nonceRecord.nonce}`)) {
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

    store.deleteNonce(walletAddress);

    const user = store.getOrCreateUser(walletAddress, "user");

    await setSessionCookie({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to verify wallet login" },
      { status: 500 }
    );
  }
}
