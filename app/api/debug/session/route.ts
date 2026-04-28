import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  return NextResponse.json({
    ok: true,
    hasSession: Boolean(session),
    session,
  });
}
