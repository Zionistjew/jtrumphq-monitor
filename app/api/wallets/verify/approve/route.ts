import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing requestId" }, { status: 400 });
    }

    const { data: request, error: requestError } = await supabase
      .from("wallet_verification_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { ok: false, error: requestError?.message || "Request not found" },
        { status: 404 }
      );
    }

    const { error: walletError } = await supabase
      .from("project_wallets")
      .update({ verified: true })
      .eq("address", request.wallet_address);

    if (walletError) {
      return NextResponse.json({ ok: false, error: walletError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("wallet_verification_requests")
      .update({
        status: "approved",
        reviewed_by: "admin",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Approve failed" },
      { status: 500 }
    );
  }
}
