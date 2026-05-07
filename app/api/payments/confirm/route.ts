import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getSession, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

const RECEIVING_WALLET = process.env.SOLANA_RECEIVING_WALLET!;

function getSubscriptionEnd(plan: string) {
  const now = new Date();

  if (plan === "launch-pass") {
    now.setFullYear(now.getFullYear() + 10);
    return now.toISOString();
  }

  now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const paymentId = String(body.paymentId || "").trim();
    const signature = String(body.signature || "").trim();
    const walletAddress = String(body.walletAddress || "").trim();

    if (!paymentId || !signature || !walletAddress) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing paymentId, signature, or walletAddress.",
        },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_sessions")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError) throw paymentError;

    if (!payment) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Payment record not found. The SOL transaction may have succeeded, but the checkout session could not be matched.",
          paymentId,
          signature,
        },
        { status: 404 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");

    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx) {
      return NextResponse.json(
        {
          ok: false,
          error: "Transaction not found or not confirmed yet. Try again in a few seconds.",
        },
        { status: 400 }
      );
    }

    if (tx.meta?.err) {
      return NextResponse.json(
        {
          ok: false,
          error: "Transaction failed on-chain.",
        },
        { status: 400 }
      );
    }

    const expectedReceiver = new PublicKey(RECEIVING_WALLET).toBase58();
    const expectedSender = new PublicKey(walletAddress).toBase58();
    const expectedLamports = Number(payment.lamports || 0);

    let validTransfer = false;

    for (const instruction of tx.transaction.message.instructions as any[]) {
      if (
        instruction?.program === "system" &&
        instruction?.parsed?.type === "transfer"
      ) {
        const info = instruction.parsed.info;

        const source = String(info.source);
        const destination = String(info.destination);
        const lamports = Number(info.lamports || 0);

        if (
          source === expectedSender &&
          destination === expectedReceiver &&
          lamports >= expectedLamports
        ) {
          validTransfer = true;
          break;
        }
      }
    }

    if (!validTransfer) {
      return NextResponse.json(
        {
          ok: false,
          error: `Valid payment transfer not found. Required: ${
            expectedLamports / LAMPORTS_PER_SOL
          } SOL.`,
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const endsAt = getSubscriptionEnd(String(payment.plan || "starter"));

    const session = await getSession();

    const userId =
      payment.user_id || session?.userId || crypto.randomUUID();

    await setSessionCookie({
      userId,
      walletAddress,
      role: "user",
    });

    const { error: updatePaymentError } = await supabase
      .from("payment_sessions")
      .update({
        wallet_address: walletAddress,
        signature,
        status: "confirmed",
        confirmed_at: nowIso,
      })
      .eq("id", paymentId);

    if (updatePaymentError) throw updatePaymentError;

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          wallet_address: walletAddress,
          plan: payment.plan,
          status: "active",
          starts_at: nowIso,
          ends_at: endsAt,
          payment_signature: signature,
        },
        { onConflict: "user_id" }
      );

    if (subscriptionError) throw subscriptionError;

    return NextResponse.json({
      ok: true,
      unlocked: true,
      signature,
      plan: payment.plan,
      redirectTo: "/app/projects/new",
    });
  } catch (error: any) {
    console.error("POST /api/payments/confirm error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Payment confirmation failed.",
      },
      { status: 500 }
    );
  }
}
