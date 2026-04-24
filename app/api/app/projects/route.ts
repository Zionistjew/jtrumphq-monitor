import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getProjectLimit(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "starter":
      return 1;
    case "growth":
      return 5;
    case "enterprise":
      return 999999;
    default:
      return 1;
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      projects: data || [],
    });
  } catch (error: any) {
    console.error("GET /api/app/projects error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load projects",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = body.email || "verify@web3mb.com";

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("email", email)
      .eq("status", "active")
      .maybeSingle();

    if (subError) throw subError;

    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error: "No active subscription found. Please choose a plan.",
        },
        { status: 403 }
      );
    }

    const projectLimit = getProjectLimit(subscription.plan);

    const { count, error: countError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("owner_email", email);

    if (countError) throw countError;

    if ((count || 0) >= projectLimit) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project limit reached. Please upgrade your subscription plan.",
          plan: subscription.plan,
          projectLimit,
          currentProjects: count || 0,
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: body.name,
        symbol: body.symbol,
        slug: body.slug,
        mint: body.mint,
        owner_email: email,
        description: body.description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      project: data,
      plan: subscription.plan,
      projectLimit,
      currentProjects: (count || 0) + 1,
    });
  } catch (error: any) {
    console.error("POST /api/app/projects error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create project",
      },
      { status: 500 }
    );
  }
}
