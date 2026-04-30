import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySolTransfer } from "@/lib/solana";
import { createSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "jtrumphq_session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_DURATION: Record<string, number | null> = {
  "launch-pass": 30,
  starter: 30,
  growth: 30,
  enterprise: null,
};

function isTestModeEnabled() {
  return process.env.WEB3MB_TEST_MODE === "false";
}

function jsonWithSession(
  body: any,
  session: {
    userId: string;
    walletAddress: string;
    role: "admin" | "user";
  }
) {
  const token = createSessionToken({
    ...session,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  });

  const response = NextResponse.json(body);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

async function activateSubscription({
  paymentId,
  plan,
  signature,
  senderWallet,
}: {
  paymentId: string;
  plan: string;
  signature: string;
  senderWallet: string;
}) {
  let { data: user, error: userLookupError } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", senderWallet)
    .maybeSingle();

  if (userLookupError) throw userLookupError;

  if (!user) {
    const { data: newUser, error: userCreateError } = await supabase
      .from("users")
      .insert({
        wallet_address: senderWallet,
        role: "user",
      })
      .select()
      .single();

    if (userCreateError) throw userCreateError;

    user = newUser;
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "expired",
    })
    .eq("user_id", user.id)
    .eq("status", "active");

  const durationDays = PLAN_DURATION[plan] ?? 30;

  const endsAt =
    durationDays === null
      ? null
      : new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000
        ).toISOString();

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      wallet_address: senderWallet,
      plan,
      status: "active",
      source_payment_id: paymentId,
      tx_signature: signature,
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
    });

  if (subscriptionError) throw subscriptionError;

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const paymentId = String(body.paymentId || "");
    const signature = String(body.signature || "");
    const senderWallet = String(body.senderWallet || "");
    const testMode = Boolean(body.testMode);
    const testPassword = String(body.testPassword || "");

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "paymentId is required" },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_sessions")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json(
        { ok: false, error: "Payment session not found" },
        { status: 404 }
      );
    }

    if (payment.status === "confirmed") {
      const existingWallet =
        payment.sender_wallet || senderWallet || "WEB3MB_TEST_ADMIN";

      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", existingWallet)
        .maybeSingle();

      if (existingUser) {
        return jsonWithSession(
          {
            ok: true,
            unlocked: true,
            status: "confirmed",
            alreadyConfirmed: true,
            redirectTo: "/app/projects/new",
          },
          {
            userId: existingUser.id,
            walletAddress: existingUser.wallet_address,
            role: existingUser.role || "user",
          }
        );
      }

      return NextResponse.json({
        ok: true,
        unlocked: true,
        status: "confirmed",
        alreadyConfirmed: true,
        redirectTo: "/app/projects/new",
      });
    }

    const isExpired = new Date(payment.expires_at).getTime() < Date.now();

    if (isExpired) {
      await supabase
        .from("payment_sessions")
        .update({ status: "expired" })
        .eq("id", paymentId);

      return NextResponse.json(
        { ok: false, error: "Payment session expired" },
        { status: 400 }
      );
    }

    if (testMode) {
      if (!isTestModeEnabled()) {
        return NextResponse.json(
          { ok: false, error: "Test mode is not enabled." },
          { status: 403 }
        );
      }

      if (
        !process.env.ADMIN_PASSWORD ||
        testPassword !== process.env.ADMIN_PASSWORD
      ) {
        return NextResponse.json(
          { ok: false, error: "Invalid test mode password." },
          { status: 403 }
        );
      }

      const testSenderWallet = senderWallet || "WEB3MB_TEST_ADMIN";
      const testSignature = `test_${paymentId}_${Date.now()}`;

      await supabase
        .from("payment_sessions")
        .update({
          status: "confirmed",
          sender_wallet: testSenderWallet,
          tx_signature: testSignature,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      const user = await activateSubscription({
        paymentId,
        plan: payment.plan,
        signature: testSignature,
        senderWallet: testSenderWallet,
      });

      return jsonWithSession(
        {
          ok: true,
          unlocked: true,
          status: "confirmed",
          testMode: true,
          userId: user.id,
          plan: payment.plan,
          redirectTo: "/app/projects/new",
        },
        {
          userId: user.id,
          walletAddress: user.wallet_address,
          role: user.role || "user",
        }
      );
    }

    if (!signature || !senderWallet) {
      return NextResponse.json(
        {
          ok: false,
          error: "paymentId, signature, and senderWallet are required",
        },
        { status: 400 }
      );
    }

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

    await supabase
      .from("payment_sessions")
      .update({
        status: "confirmed",
        sender_wallet: senderWallet,
        tx_signature: signature,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    const user = await activateSubscription({
      paymentId,
      plan: payment.plan,
      signature,
      senderWallet,
    });

    return jsonWithSession(
      {
        ok: true,
        unlocked: true,
        status: "confirmed",
        userId: user.id,
        plan: payment.plan,
        redirectTo: "/app/projects/new",
      },
      {
        userId: user.id,
        walletAddress: user.wallet_address,
        role: user.role || "user",
      }
    );
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
