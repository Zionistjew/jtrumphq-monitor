import { NextRequest, NextResponse } from "next/server";
import { RECEIVING_WALLET, solToLamports } from "@/lib/solana";
import { randomId, store, type PaymentRecord } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PLANS = {
  starter: {
    label: "Starter",
    priceUsd: 99,
  },
  growth: {
    label: "Growth",
    priceUsd: 299,
  },
} as const;

type Web3mbPlan = "starter" | "growth";

function isValidPlan(plan: string): plan is Web3mbPlan {
  return plan === "starter" || plan === "growth";
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

    const plan: Web3mbPlan = requestedPlan;

    if (!RECEIVING_WALLET) {
      return NextResponse.json(
        {
          ok: false,
          error: "SOLANA_RECEIVING_WALLET is not configured",
        },
        { status: 500 }
      );
    }

    const config = PLANS[plan];
    const solPricing = await getLiveSolUsdRate();
    const amountSol = Number((config.priceUsd / solPricing.rate).toFixed(4));

    const paymentId = randomId("pay");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 30);

    const payment = {
      id: paymentId,
      plan,
      amountSol,
      amountLamports: solToLamports(amountSol),
      recipientWallet: RECEIVING_WALLET,
      reference: paymentId,
      memo: `WEB3MB ${config.label} plan`,
      status: "pending",
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    } as unknown as PaymentRecord;

    store.createPayment(payment);

    return NextResponse.json({
      ok: true,
      paymentId,
      plan,
      amountUsd: config.priceUsd,
      solUsdRate: solPricing.rate,
      solUsdRateSource: solPricing.source,
      amountSol,
      amountLamports: solToLamports(amountSol),
      reference: paymentId,
      memo: `WEB3MB ${config.label} plan`,
      status: "pending",
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
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
