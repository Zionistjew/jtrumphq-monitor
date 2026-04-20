import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { store } from "@/lib/store";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const user = store.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const entitlement = store.getActiveEntitlement(user.id);
  const db = store.getDb();

  const recentPayments = db.payments
    .filter(
      (p) =>
        p.userId === user.id ||
        p.expectedSenderWallet?.toLowerCase() === user.walletAddress.toLowerCase()
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      plan: p.plan,
      status: p.status,
      amountSol: p.amountSol,
      txSignature: p.txSignature ?? null,
      createdAt: p.createdAt,
      confirmedAt: p.confirmedAt ?? null,
    }));

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    },
    entitlement,
    recentPayments,
  });
}
