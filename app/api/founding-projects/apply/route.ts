import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clean(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const project_name = clean(body.project_name);
    const token_symbol = clean(body.token_symbol);
    const website = clean(body.website);
    const x_account = clean(body.x_account);
    const telegram = clean(body.telegram);
    const founder_name = clean(body.founder_name);
    const founder_email = clean(body.founder_email);
    const project_description = clean(body.project_description);
    const why_selected = clean(body.why_selected);

    if (!project_name || !founder_name || !founder_email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project name, founder name, and founder email are required.",
        },
        { status: 400 }
      );
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(founder_email);

    if (!emailOk) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid founder email address." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("founding_project_applications")
      .insert({
        project_name,
        token_symbol,
        website,
        x_account,
        telegram,
        founder_name,
        founder_email,
        project_description,
        why_selected,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Founding project application error:", error);
      return NextResponse.json(
        { ok: false, error: "Application could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    console.error("Founding project apply route error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
