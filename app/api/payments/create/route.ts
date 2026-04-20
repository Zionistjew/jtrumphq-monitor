import { NextRequest, NextResponse } from "next/server";
import { isValidPlan, PLANS } from "@/lib/plans";
import { RECEIVING_WALLET, solToLamports } from "@/lib/solana";
import { randomId, store, type PaymentRecord } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = String(body.plan || "").toLowerCase();

    if (!isValidPlan(plan)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    if (!RECEIVING_WALLET) {
      return NextResponse.json(
        { ok: false, error: "SOLANA_RECEIVING_WALLET is not configured" },
        { status: 500 }
      );
    }

    const config = PLANS[plan];
    const paymentId = randomId("pay");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 30);

    const payment: PaymentRecord = {
      id: paymentId,
      plan,
      amountSol: config.priceSol,
      amountLamports: solToLamports(config.priceSol),
      recipientWallet: RECEIVING_WALLET,
      reference: paymentId,
      memo: `JTRUMPHQ ${config.label} plan`,
      status: "pending",
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    store.createPayment(payment);

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      plan: payment.plan,
      amountSol: payment.amountSol,
      amountLamports: payment.amountLamports,
      recipientWallet: payment.recipientWallet,
      reference: payment.reference,
      memo: payment.memo,
      status: payment.status,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
