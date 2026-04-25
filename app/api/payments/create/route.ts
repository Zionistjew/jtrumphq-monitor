import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RECEIVING_WALLET, solToLamports } from "@/lib/solana";
import { randomId } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLANS = {
  "launch-pass": {
    label: "Launch Pass",
    priceUsd: 149,
  },
  starter: {
    label: "Starter",
    priceUsd: 99,
  },
  growth: {
    label: "Growth",
    priceUsd: 299,
  },
} as const;

type PlanKey = keyof typeof PLANS;

function isValidPlan(plan: string): plan is PlanKey {
  return plan === "launch-pass" || plan === "starter" || plan === "growth";
}

function getFallbackSolUsdRate() {
  const value = Number(process.env.SOL_USD_RATE || "86.31");
  return Number.isFinite(value) && value > 0 ? value : 86.31;
}

async function getLiveSolUsdRate() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko pricing request failed: ${response.status}`);
    }

    const data = await response.json();
    const price = Number(data?.solana?.usd);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid SOL price returned");
    }

    return {
      rate: price,
      source: "coingecko-live",
    };
  } catch (error) {
    console.warn(
      "Live SOL pricing failed. Falling back to environment pricing.",
      error
    );

    return {
      rate: getFallbackSolUsdRate(),
      source: "fallback-env",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestedPlan = String(body.plan || "").toLowerCase();

    if (!isValidPlan(requestedPlan)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid plan",
        },
        { status: 400 }
      );
    }

    if (!RECEIVING_WALLET) {
      return NextResponse.json(
        {
          ok: false,
          error: "SOLANA_RECEIVING_WALLET is not configured",
        },
        { status: 500 }
      );
    }

    const plan = requestedPlan;
    const config = PLANS[plan];

    const solPricing = await getLiveSolUsdRate();
    const amountSol = Number((config.priceUsd / solPricing.rate).toFixed(4));
    const amountLamports = solToLamports(amountSol);

    const paymentId = randomId("pay");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 30);

    const memo = `WEB3MB ${config.label} plan`;

    const { data, error } = await supabase
      .from("payment_sessions")
      .insert({
        id: paymentId,
        plan,
        amount_usd: config.priceUsd,
        amount_sol: amountSol,
        amount_lamports: amountLamports,
        recipient_wallet: RECEIVING_WALLET,
        reference: paymentId,
        memo,
        status: "pending",
        created_at: createdAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      paymentId: data.id,
      plan: data.plan,
      amountUsd: Number(data.amount_usd),
      solUsdRate: solPricing.rate,
      solUsdRateSource: solPricing.source,
      amountSol: Number(data.amount_sol),
      amountLamports: Number(data.amount_lamports),
      recipientWallet: data.recipient_wallet,
      reference: data.reference,
      memo: data.memo,
      status: data.status,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    });
  } catch (error: any) {
    console.error("POST /api/payments/create error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create payment session",
      },
      { status: 500 }
    );
  }
}
