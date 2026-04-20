import { NextRequest, NextResponse } from "next/server";
import { verifySolTransfer } from "@/lib/solana";
import { store, randomId } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { setSessionCookie } from "@/lib/session";

const PLAN_RANK: Record<string, number> = {
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const paymentId = String(body.paymentId || "");
    const signature = String(body.signature || "");
    const senderWallet = String(body.senderWallet || "");

    if (!paymentId || !signature || !senderWallet) {
      return NextResponse.json(
        {
          ok: false,
          error: "paymentId, signature, and senderWallet are required",
        },
        { status: 400 }
      );
    }

    const payment = store.getPaymentById(paymentId);

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    const now = Date.now();

    if (new Date(payment.expiresAt).getTime() < now) {
      store.updatePayment(payment.id, { status: "expired" });

      return NextResponse.json(
        { ok: false, error: "Payment session expired" },
        { status: 400 }
      );
    }

    if (payment.status === "confirmed") {
      const existingUser =
        payment.userId
          ? store.getUserById(payment.userId)
          : store.getUserByWallet(senderWallet);

      if (existingUser) {
        await setSessionCookie({
          userId: existingUser.id,
          walletAddress: existingUser.walletAddress,
          role: existingUser.role,
        });
      }

      return NextResponse.json({
        ok: true,
        status: "confirmed",
        unlocked: true,
        paymentId: payment.id,
        confirmedAt: payment.confirmedAt ?? null,
        alreadyConfirmed: true,
      });
    }

    store.updatePayment(payment.id, {
      status: "submitted",
      txSignature: signature,
      expectedSenderWallet: senderWallet,
    });

    const verification = await verifySolTransfer({
      signature,
      senderWallet,
      recipientWallet: payment.recipientWallet,
      expectedLamports: payment.amountLamports,
    });

    if (!verification.ok) {
      if (verification.pending) {
        return NextResponse.json({
          ok: true,
          status: "submitted",
          unlocked: false,
          pending: true,
          reason: verification.reason,
          paymentId: payment.id,
          txSignature: signature,
        });
      }

      store.updatePayment(payment.id, {
        status: "failed",
        txSignature: signature,
        expectedSenderWallet: senderWallet,
      });

      return NextResponse.json(
        {
          ok: false,
          status: "failed",
          unlocked: false,
          error: verification.reason,
          paymentId: payment.id,
          txSignature: signature,
        },
        { status: 400 }
      );
    }

    const user = store.getOrCreateUser(senderWallet, "user");

    store.updatePayment(payment.id, {
      status: "confirmed",
      txSignature: signature,
      expectedSenderWallet: senderWallet,
      confirmedAt: new Date().toISOString(),
      userId: user.id,
    });

    const db = store.getDb();
    const nowIso = new Date().toISOString();

    const activeEntitlements = db.entitlements.filter((e) => {
      if (e.userId !== user.id) return false;
      if (e.status !== "active") return false;
      if (!e.endsAt) return true;
      return new Date(e.endsAt).getTime() > Date.now();
    });

    const strongestExisting = activeEntitlements.sort((a, b) => {
      return (PLAN_RANK[b.plan] || 0) - (PLAN_RANK[a.plan] || 0);
    })[0];

    for (const ent of activeEntitlements) {
      ent.status = "expired";
      if (!ent.endsAt) {
        ent.endsAt = nowIso;
      }
    }

    const planConfig = PLANS[payment.plan];
    let endsAt: string | undefined;

    if (planConfig.entitlementDays === null) {
      endsAt = undefined;
    } else {
      let baseTime = Date.now();

      if (
        strongestExisting?.endsAt &&
        new Date(strongestExisting.endsAt).getTime() > Date.now()
      ) {
        baseTime = new Date(strongestExisting.endsAt).getTime();
      }

      endsAt = new Date(
        baseTime + 1000 * 60 * 60 * 24 * planConfig.entitlementDays
      ).toISOString();
    }

    db.entitlements.push({
      id: randomId("ent"),
      userId: user.id,
      plan: payment.plan,
      status: "active",
      sourcePaymentId: payment.id,
      startsAt: nowIso,
      endsAt,
    });

    store.saveDb(db);

    await setSessionCookie({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    const refreshed = store.getPaymentById(payment.id);

    return NextResponse.json({
      ok: true,
      status: "confirmed",
      unlocked: true,
      paymentId: refreshed?.id,
      txSignature: refreshed?.txSignature ?? null,
      confirmedAt: refreshed?.confirmedAt ?? null,
      userId: refreshed?.userId ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to confirm payment",
      },
      { status: 500 }
    );
  }
}
