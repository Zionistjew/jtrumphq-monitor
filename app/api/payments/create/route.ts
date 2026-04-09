import { createPaymentRecord } from "@/lib/paymentStore";
import { PRICING, PlanKey } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = body?.plan as PlanKey;
    const projectSlug = body?.projectSlug as string | undefined;

    if (!plan || !PRICING[plan]) {
      return Response.json(
        { ok: false, error: "Invalid plan." },
        { status: 400 }
      );
    }

    const destinationWallet = process.env.NEXT_PUBLIC_RECEIVING_WALLET;
    if (!destinationWallet) {
      return Response.json(
        { ok: false, error: "Receiving wallet not configured." },
        { status: 500 }
      );
    }

    const payment = await createPaymentRecord({
      projectSlug,
      plan,
      token: "SOL",
      amount: PRICING[plan].sol,
      amountUsd: PRICING[plan].usd,
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
