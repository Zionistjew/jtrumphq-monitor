import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn("Missing Supabase environment variables for verification queue.");
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("wallet_verification_requests")
      .select(
        "id, project_slug, wallet_address, signature, message, status, reviewed_by, reviewed_at, created_at"
      )
      .ilike("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        count: data?.length || 0,
        requests: data || [],
        source: "wallet_verification_requests",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load pending verification requests.",
      },
      { status: 500 }
    );
  }
}
