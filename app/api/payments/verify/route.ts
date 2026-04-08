import { getPaymentById, markPaymentConfirmed } from "@/lib/paymentStore";
import {
  getUsdcDestinationTokenAccount,
  verifySolanaPayment,
} from "@/lib/solanaPayments";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentId = body?.paymentId as string;
    const txSignature = body?.txSignature as string;

    if (!paymentId || !txSignature) {
      return Response.json(
        { ok: false, error: "paymentId and txSignature are required." },
        { status: 400 }
      );
    }

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return Response.json(
        { ok: false, error: "Payment not found." },
        { status: 404 }
      );
    }

    if (payment.status === "confirmed") {
      return Response.json({
        ok: true,
        alreadyConfirmed: true,
        payment: {
          paymentId: payment.payment_id,
          status: payment.status,
          txSignature: payment.tx_signature,
          confirmedAt: payment.confirmed_at,
        },
      });
    }

    const verification = await verifySolanaPayment({
      token: payment.token,
      amount: Number(payment.amount),
      txSignature,
      destinationWallet: payment.destination_wallet,
    });

    const confirmed = await markPaymentConfirmed({
      paymentId,
      payerWallet: verification.payerWallet,
      txSignature,
    });

    return Response.json({
      ok: true,
      payment: {
        paymentId: confirmed.payment_id,
        status: confirmed.status,
        txSignature: confirmed.tx_signature,
        confirmedAt: confirmed.confirmed_at,
        payerWallet: confirmed.payer_wallet,
        destinationAddress:
          payment.token === "USDC"
            ? getUsdcDestinationTokenAccount(payment.destination_wallet)
            : payment.destination_wallet,
      },
    });
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Failed to verify payment.",
      },
      { status: 500 }
    );
  }
}
