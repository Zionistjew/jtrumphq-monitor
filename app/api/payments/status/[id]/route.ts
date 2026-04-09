import { getPaymentById } from "@/lib/paymentStore";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await getPaymentById(params.id);

    return Response.json({
      ok: true,
      payment: {
        paymentId: payment.payment_id,
        reference: payment.reference,
        plan: payment.plan,
        token: payment.token,
        amount: Number(payment.amount),
        amountUsd: Number(payment.amount_usd),
        destinationWallet: payment.destination_wallet,
        status: payment.status,
        txSignature: payment.tx_signature,
        confirmedAt: payment.confirmed_at,
        payerWallet: payment.payer_wallet,
      },
    });
  } catch (error: any) {
    return Response.json(
      { ok: false, error: error?.message || "Failed to load payment." },
      { status: 500 }
    );
  }
}
