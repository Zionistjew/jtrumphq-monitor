import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

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

type PlanConfig = {
  projectsLimit: number;
  walletsLimit: number;
  lifetime: boolean;
};

function getPlanConfig(planInput: string): PlanConfig {
  const plan = String(planInput || "starter").toLowerCase();

  switch (plan) {
    case "launch-pass":
      return {
        projectsLimit: 1,
        walletsLimit: 10,
        lifetime: true,
      };

    case "growth":
      return {
        projectsLimit: 5,
        walletsLimit: 50,
        lifetime: false,
      };

    case "enterprise":
      return {
        projectsLimit: 999999,
        walletsLimit: 999999,
        lifetime: false,
      };

    case "starter":
    default:
      return {
        projectsLimit: 1,
        walletsLimit: 15,
        lifetime: false,
      };
  }
}

function getSubscriptionEnd(plan: string) {
  const now = new Date();
  const config = getPlanConfig(plan);

  if (config.lifetime) {
    now.setFullYear(2099);
    return now.toISOString();
  }

  now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTransaction(connection: Connection, signature: string) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (tx) {
        return tx;
      }
    } catch (err) {
      console.error(`Transaction fetch attempt ${attempt} failed`, err);
    }

    await sleep(2500);
  }

  return null;
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

    if (!RECEIVING_WALLET) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payment receiving wallet is not configured.",
        },
        { status: 500 }
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

    if (payment.status === "confirmed" && payment.signature === signature) {
      return NextResponse.json({
        ok: true,
        unlocked: true,
        signature,
        plan: payment.plan,
        redirectTo: "/app/projects/new",
        replay: true,
      });
    }

    const connection = new Connection(RPC_URL, "confirmed");

    console.log("Waiting for transaction confirmation:", signature);

    const tx = await waitForTransaction(connection, signature);

    if (!tx) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Transaction was submitted but could not yet be confirmed on Solana. Please wait a few seconds and try again.",
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
    const plan = String(payment.plan || "starter").toLowerCase();
    const planConfig = getPlanConfig(plan);
    const endsAt = getSubscriptionEnd(plan);

    const session = await getSession();

    const userId = payment.user_id || session?.userId || crypto.randomUUID();

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
          plan,
          status: "active",
          starts_at: nowIso,
          ends_at: endsAt,
          projects_limit: planConfig.projectsLimit,
          wallets_limit: planConfig.walletsLimit,
          source_payment_id: paymentId,
          tx_signature: signature,
        },
        {
          onConflict: "user_id",
        }
      );

    if (subscriptionError) throw subscriptionError;

    return NextResponse.json({
      ok: true,
      unlocked: true,
      signature,
      plan,
      subscription: {
        status: "active",
        starts_at: nowIso,
        ends_at: endsAt,
        projects_limit: planConfig.projectsLimit,
        wallets_limit: planConfig.walletsLimit,
      },
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
