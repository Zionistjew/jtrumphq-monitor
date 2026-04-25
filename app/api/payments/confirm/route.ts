import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySolTransfer } from "@/lib/solana";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_DURATION: Record<string, number | null> = {
  "launch-pass": 30,     // one-time plan = 30 days visibility
  starter: 30,           // monthly
  growth: 30,            // monthly
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const paymentId = String(body.paymentId || "");
    const signature = String(body.signature || "");
    const senderWallet = String(body.senderWallet || "");

    if (!paymentId || !signature || !senderWallet) {
      return NextResponse.json(
        {
          ok: false,
          error: "paymentId, signature, and senderWallet are required",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // Fetch payment session
    // -------------------------
    const { data: payment, error: paymentError } = await supabase
      .from("payment_sessions")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payment session not found",
        },
        { status: 404 }
      );
    }

    if (payment.status === "confirmed") {
      return NextResponse.json({
        ok: true,
        unlocked: true,
        status: "confirmed",
        alreadyConfirmed: true,
      });
    }

    const expired =
      new Date(payment.expires_at).getTime() < Date.now();

    if (expired) {
      await supabase
        .from("payment_sessions")
        .update({
          status: "expired",
        })
        .eq("id", paymentId);

      return NextResponse.json(
        {
          ok: false,
          error: "Payment session expired",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // Verify blockchain transfer
    // -------------------------
    const verification = await verifySolTransfer({
      signature,
      senderWallet,
      recipientWallet: payment.recipient_wallet,
      expectedLamports: payment.amount_lamports,
    });

    if (!verification.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: verification.reason || "Payment verification failed",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // Create / find user
    // -------------------------
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", senderWallet)
      .single();

    if (!user) {
      const { data: newUser } = await supabase
        .from("users")
        .insert({
          wallet_address: senderWallet,
          role: "user",
        })
        .select()
        .single();

      user = newUser;
    }

    // -------------------------
    // Mark payment confirmed
    // -------------------------
    await supabase
      .from("payment_sessions")
      .update({
        status: "confirmed",
        sender_wallet: senderWallet,
        tx_signature: signature,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    // -------------------------
    // Expire old subscriptions
    // -------------------------
    await supabase
      .from("subscriptions")
      .update({
        status: "expired",
      })
      .eq("user_id", user.id)
      .eq("status", "active");

    const durationDays = PLAN_DURATION[payment.plan];
    let endsAt = null;

    if (durationDays) {
      endsAt = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    // -------------------------
    // Create active subscription
    // -------------------------
    await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan: payment.plan,
        status: "active",
        source_payment_id: payment.id,
        tx_signature: signature,
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
      });

    // -------------------------
    // Create login session
    // -------------------------
    await setSessionCookie({
      userId: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      unlocked: true,
      status: "confirmed",
      redirectTo: "/app/projects/new",
    });
  } catch (error: any) {
    console.error("payment confirm error", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to confirm payment",
      },
      { status: 500 }
    );
  }
}
