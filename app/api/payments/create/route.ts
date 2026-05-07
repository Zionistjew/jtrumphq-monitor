import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, setSessionCookie } from "@/lib/session";

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

async function getLiveSolUsdRate() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { cache: "no-store" }
    );

    const data = await res.json();

    const rate = Number(data?.solana?.usd);

    if (Number.isFinite(rate) && rate > 0) {
      return {
        rate,
        source: "CoinGecko Live SOL/USD",
      };
    }
  } catch (error) {
    console.warn("Live SOL price lookup failed:", error);
  }

  const fallbackRate = Number(process.env.SOL_USD_RATE || "100");

  return {
    rate: fallbackRate,
    source: "Fallback SOL_USD_RATE",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const plan = String(body.plan || "starter").toLowerCase();
    const walletAddress = String(body.walletAddress || "").trim();

    if (!walletAddress) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please connect Phantom first.",
        },
        { status: 400 }
      );
    }

    if (plan === "enterprise") {
      return NextResponse.json(
        {
          ok: false,
          error: "Enterprise requires manual setup.",
        },
        { status: 400 }
      );
    }

    const amountUsd = PLAN_PRICES[plan];

    if (!amountUsd) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid plan.",
        },
        { status: 400 }
      );
    }

    let session = await getSession();

    if (!session) {
      const walletUserId = crypto.randomUUID();

      await setSessionCookie({
        userId: walletUserId,
        walletAddress,
        role: "user",
      });

      session = {
        userId: walletUserId,
        walletAddress,
        role: "user",
        exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
      };
    }

    const { rate: solUsdRate, source: solUsdRateSource } =
      await getLiveSolUsdRate();

    const solAmount = Number((amountUsd / solUsdRate).toFixed(9));
    const lamports = Math.ceil(solAmount * 1_000_000_000);

    const { data, error } = await supabase
      .from("payment_sessions")
      .insert({
        user_id: session.userId,
        wallet_address: walletAddress,
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
        solUsdRate,
        solUsdRateSource,
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
