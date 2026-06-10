import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requestId = body.requestId;

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    const { data: requestRow, error: requestError } = await supabase
      .from("wallet_verification_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json(
        { ok: false, error: "Verification request not found" },
        { status: 404 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", requestRow.project_slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const { error: walletError } = await supabase
      .from("project_wallets")
      .update({
        verified: true,
      })
      .eq("project_id", project.id)
      .eq("address", requestRow.wallet_address);

    if (walletError) {
      return NextResponse.json(
        {
          ok: false,
          error: walletError.message,
        },
        { status: 500 }
      );
    }

    await supabase
      .from("wallet_verification_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: "admin",
      })
      .eq("id", requestId);

    return NextResponse.json({
      ok: true,
      approved: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
