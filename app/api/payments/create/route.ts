import { createPaymentRecord } from "@/lib/paymentStore";
import { PRICING, PlanKey, TokenKey } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = body?.plan as PlanKey;
    const token = body?.token as TokenKey;
    const projectSlug = body?.projectSlug as string | undefined;

    if (!plan || !PRICING[plan]) {
      return Response.json({ ok: false, error: "Invalid plan." }, { status: 400 });
    }

    if (!token || !["USDC", "SOL"].includes(token)) {
      return Response.json({ ok: false, error: "Invalid token." }, { status: 400 });
    }

    const destinationWallet = process.env.NEXT_PUBLIC_RECEIVING_WALLET;
    if (!destinationWallet) {
      return Response.json(
        { ok: false, error: "Receiving wallet not configured." },
        { status: 500 }
      );
    }

    const amount = token === "USDC" ? PRICING[plan].usdc : PRICING[plan].sol;
    const amountUsd = PRICING[plan].usdc;

    const payment = await createPaymentRecord({
      projectSlug,
      plan,
      token,
      amount,
      amountUsd,
      destinationWallet,
    });

    return Response.json({
      ok: true,
      payment: {
        paymentId: payment.payment_id,
        reference: payment.reference,
        plan: payment.plan,
        token: payment.token,
        amount: payment.amount,
        amountUsd: payment.amount_usd,
        destinationWallet: payment.destination_wallet,
        status: payment.status,
      },
    });
  } catch (error: any) {
    return Response.json(
      { ok: false, error: error?.message || "Failed to create payment." },
      { status: 500 }
    );
  }
}
