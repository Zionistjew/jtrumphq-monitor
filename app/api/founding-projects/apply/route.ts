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

async function sendApplicationEmail(application: {
  id: string;
  project_name: string;
  token_symbol: string;
  website: string;
  x_account: string;
  telegram: string;
  founder_name: string;
  founder_email: string;
  project_description: string;
  why_selected: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const alertEmail =
    process.env.FOUNDING_ALERT_EMAIL || "founder@web3mb.com";
  const fromEmail =
    process.env.EMAIL_FROM ||
    "WEB3MB Transparency Center <founder@web3mb.com>";

  if (!resendApiKey) {
    console.error("RESEND_API_KEY missing");
    return { ok: false };
  }

  const adminUrl =
    "https://app.web3mb.com/admin/founding-projects";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: alertEmail,
      subject: `New Founding Project Application: ${application.project_name}`,
      html: `
        <h2>New WEB3MB Founding Project Application</h2>

        <p><strong>Project:</strong> ${application.project_name}</p>
        <p><strong>Token Symbol:</strong> ${application.token_symbol || "N/A"}</p>

        <hr />

        <p><strong>Founder:</strong> ${application.founder_name}</p>
        <p><strong>Email:</strong> ${application.founder_email}</p>

        <hr />

        <p><strong>Website:</strong> ${application.website || "N/A"}</p>
        <p><strong>X:</strong> ${application.x_account || "N/A"}</p>
        <p><strong>Telegram:</strong> ${application.telegram || "N/A"}</p>

        <hr />

        <p><strong>Description</strong></p>
        <p>${application.project_description || "N/A"}</p>

        <p><strong>Why Selected</strong></p>
        <p>${application.why_selected || "N/A"}</p>

        <hr />

        <p>
          Review application:
          <br />
          <a href="${adminUrl}">
            ${adminUrl}
          </a>
        </p>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend Error:", error);

    return {
      ok: false,
      error,
    };
  }

  return {
    ok: true,
  };
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
          error:
            "Project name, founder name, and founder email are required.",
        },
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
      console.error(error);

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to save application.",
        },
        { status: 500 }
      );
    }

    const emailResult = await sendApplicationEmail({
      id: data.id,
      project_name,
      token_symbol,
      website,
      x_account,
      telegram,
      founder_name,
      founder_email,
      project_description,
      why_selected,
    });

    return NextResponse.json({
      ok: true,
      id: data.id,
      emailSent: emailResult.ok,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
