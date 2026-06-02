import crypto from "crypto";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createClient } from "@supabase/supabase-js";
import { getSession, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
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

async function getNormalizedSession() {
  const session = await getSession();

  if (!session) return null;

  if (isUuid(session.userId)) return session;

  const normalizedUserId = uuidFromWallet(session.walletAddress);

  await setSessionCookie({
    userId: normalizedUserId,
    walletAddress: session.walletAddress,
    role: session.role,
  });

  return {
    ...session,
    userId: normalizedUserId,
  };
}

function isValidPublicKey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function decodeSignature(signature: unknown): Uint8Array {
  if (Array.isArray(signature)) {
    return Uint8Array.from(signature.map((n) => Number(n)));
  }

  if (typeof signature !== "string") {
    throw new Error("Invalid signature format.");
  }

  const clean = signature.trim();

  try {
    return bs58.decode(clean);
  } catch {
    // Continue to base64 fallback.
  }

  try {
    return Uint8Array.from(Buffer.from(clean, "base64"));
  } catch {
    throw new Error("Unable to decode signature.");
  }
}

function buildExpectedMessage(params: {
  walletAddress: string;
  projectSlug?: string;
  projectId?: string | number;
}) {
  const projectRef =
    params.projectSlug || params.projectId
      ? `Project: ${params.projectSlug || params.projectId}`
      : "Project: WEB3MB";

  return [
    "WEB3MB Wallet Verification",
    projectRef,
    `Wallet: ${params.walletAddress}`,
    "Purpose: Verify wallet ownership for project transparency.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const session = await getNormalizedSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized. Please connect your wallet again.",
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const walletAddress = String(body.walletAddress || "").trim();
    const projectSlug = String(body.projectSlug || body.slug || "").trim();
    const projectId = body.projectId || body.project_id || null;
    const message = String(body.message || "").trim();
    const signature = body.signature;

    if (!walletAddress || !signature) {
      return NextResponse.json(
        {
          ok: false,
          error: "walletAddress and signature are required.",
        },
        { status: 400 }
      );
    }

    if (!projectSlug && !projectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "projectSlug or projectId is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidPublicKey(walletAddress)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid wallet address.",
        },
        { status: 400 }
      );
    }

    const expectedMessage = buildExpectedMessage({
      walletAddress,
      projectSlug,
      projectId,
    });

    const messageToVerify = message || expectedMessage;

    if (message && message !== expectedMessage) {
      return NextResponse.json(
        {
          ok: false,
          error: "Verification message does not match WEB3MB expected format.",
          expectedMessage,
        },
        { status: 400 }
      );
    }

    const publicKey = new PublicKey(walletAddress);
    const signatureBytes = decodeSignature(signature);
    const messageBytes = new TextEncoder().encode(messageToVerify);

    const validSignature = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    if (!validSignature) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid wallet signature. Verification failed.",
        },
        { status: 400 }
      );
    }

    let projectQuery = supabase
      .from("projects")
      .select("id, slug, name, symbol, user_id")
      .limit(1);

    if (projectSlug) {
      projectQuery = projectQuery.eq("slug", projectSlug);
    } else {
      projectQuery = projectQuery.eq("id", projectId);
    }

    const { data: project, error: projectError } =
      await projectQuery.maybeSingle();

    if (projectError) throw projectError;

    if (!project) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project not found.",
        },
        { status: 404 }
      );
    }

    const ownsProject =
      session.role === "admin" || String(project.user_id) === session.userId;

    if (!ownsProject) {
      return NextResponse.json(
        {
          ok: false,
          error: "You do not own this project.",
        },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();

    const { data: updatedWallet, error: updateError } = await supabase
      .from("project_wallets")
      .update({
        verified: true,
        verified_at: nowIso,
        verification_message: messageToVerify,
      })
      .eq("project_id", project.id)
      .eq("address", walletAddress)
      .select("project_id, label, category, address, verified, verified_at")
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedWallet) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Wallet not found in this project. Add the wallet to the project before verifying ownership.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      verifiedAt: nowIso,
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
        symbol: project.symbol,
      },
      wallet: updatedWallet,
      message: messageToVerify,
    });
  } catch (error: any) {
    console.error("POST /api/wallets/verify error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Wallet verification failed.",
      },
      { status: 500 }
    );
  }
}
