import { NextRequest, NextResponse } from "next/server";
import { store, randomId } from "@/lib/store";
import { verifySolTransfer } from "@/lib/solana";
import { PLANS } from "@/lib/plans";

type RouteContext = {
  params: { id: string };
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const id = context.params.id;
    const payment = store.getPaymentById(id);

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    const now = Date.now();

    if (
      payment.status !== "confirmed" &&
      new Date(payment.expiresAt).getTime() < now
    ) {
      store.updatePayment(payment.id, { status: "expired" });

      return NextResponse.json({
        ok: true,
        paymentId: payment.id,
        status: "expired",
        unlocked: false,
      });
    }

    if (
      payment.status === "submitted" &&
      payment.txSignature &&
      payment.expectedSenderWallet
    ) {
      const verification = await verifySolTransfer({
        signature: payment.txSignature,
        senderWallet: payment.expectedSenderWallet,
        recipientWallet: payment.recipientWallet,
        expectedLamports: payment.amountLamports,
      });

      if (verification.ok) {
        const user = store.getOrCreateUser(payment.expectedSenderWallet, "user");

        const current = store.getPaymentById(payment.id);

        if (current?.status !== "confirmed") {
          store.updatePayment(payment.id, {
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
            userId: user.id,
          });

          const active = store.getActiveEntitlement(user.id);

          if (!active) {
            const config = PLANS[payment.plan];
            const startsAt = new Date();
            const endsAt =
              config.entitlementDays === null
                ? undefined
                : new Date(
                    startsAt.getTime() +
                      1000 * 60 * 60 * 24 * config.entitlementDays
                  ).toISOString();

            store.createEntitlement({
              id: randomId("ent"),
              userId: user.id,
              plan: payment.plan,
              status: "active",
              sourcePaymentId: payment.id,
              startsAt: startsAt.toISOString(),
              endsAt,
            });
          }
        }
      }
    }

    const refreshed = store.getPaymentById(payment.id);

    return NextResponse.json({
      ok: true,
      paymentId: refreshed?.id,
      status: refreshed?.status,
      unlocked: refreshed?.status === "confirmed",
      txSignature: refreshed?.txSignature ?? null,
      plan: refreshed?.plan,
      amountSol: refreshed?.amountSol,
      createdAt: refreshed?.createdAt,
      expiresAt: refreshed?.expiresAt,
      confirmedAt: refreshed?.confirmedAt ?? null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}
