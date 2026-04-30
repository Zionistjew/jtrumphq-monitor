import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_PRICES: Record<string, number> = {
  "launch-pass": 149,
  starter: 99,
  growth: 299,
};

const SOL_USD_RATE = Number(process.env.SOL_USD_RATE || "150");

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Login required before checkout." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const plan = String(body.plan || "starter").toLowerCase();

    if (plan === "enterprise") {
      return NextResponse.json(
        { ok: false, error: "Enterprise requires manual setup." },
        { status: 400 }
      );
    }

    const amountUsd = PLAN_PRICES[plan];

    if (!amountUsd) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan." },
        { status: 400 }
      );
    }

    const solAmount = Number((amountUsd / SOL_USD_RATE).toFixed(9));
    const lamports = Math.ceil(solAmount * 1_000_000_000);

    const { data, error } = await supabase
      .from("payment_sessions")
      .insert({
        user_id: session.userId,
        plan,
        amount_usd: amountUsd,
        sol_amount: solAmount,
        lamports,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      payment: {
        id: data.id,
        plan,
        amountUsd,
        solAmount,
        lamports,
        solUsdRate: SOL_USD_RATE,
        solUsdRateSource: "ENV_SOL_USD_RATE",
        recipient: process.env.SOLANA_RECEIVING_WALLET,
      },
    });
  } catch (error: any) {
    console.error("POST /api/payments/create error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create payment session.",
      },
      { status: 500 }
    );
  }
}
