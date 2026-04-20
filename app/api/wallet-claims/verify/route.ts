import nacl from "tweetnacl";
import bs58 from "bs58";
import { getProjectBySlug } from "@/lib/projects";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type VerifyBody = {
  slug: string;
  walletAddress: string;
  signature: string;
  message: string;
};

function normalize(value: string) {
  return value.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<VerifyBody>;

    const slug = normalize(body.slug || "");
    const walletAddress = normalize(body.walletAddress || "");
    const signature = normalize(body.signature || "");
    const message = body.message || "";

    if (!slug || !walletAddress || !signature || !message) {
      return Response.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await getProjectBySlug(slug);

    if (!project) {
      return Response.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const wallet = project.wallets.find(
      (item) => item.address === walletAddress
    );

    if (!wallet) {
      return Response.json(
        { ok: false, error: "Wallet is not disclosed for this project" },
        { status: 400 }
      );
    }

    if (!message.includes(`Project: ${slug}`)) {
      return Response.json(
        { ok: false, error: "Message does not match project slug" },
        { status: 400 }
      );
    }

    if (!message.includes(`Wallet: ${walletAddress}`)) {
      return Response.json(
        { ok: false, error: "Message does not match wallet address" },
        { status: 400 }
      );
    }

    const publicKeyBytes = bs58.decode(walletAddress);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return Response.json(
        { ok: false, error: "Invalid wallet signature" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const payload = {
      project_slug: slug,
      wallet_address: walletAddress,
      wallet_label: wallet.label,
      claimant_address: walletAddress,
      message,
      signature,
      status: "verified",
      verified_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("wallet_claims")
      .upsert(payload, {
        onConflict: "project_slug,wallet_address",
      });

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      slug,
      walletAddress,
      walletLabel: wallet.label,
      status: "verified",
      verifiedAt: payload.verified_at,
    });
  } catch (error) {
    console.error("Wallet claim verify error:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
