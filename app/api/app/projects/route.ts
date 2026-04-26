import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getProjectLimit(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "launch-pass":
      return 1;
    case "starter":
      return 1;
    case "growth":
      return 5;
    case "enterprise":
      return 999999;
    default:
      return 0;
  }
}

async function getActiveSubscription(session: {
  userId: string;
  walletAddress: string;
  role: "admin" | "user";
}) {
  if (session.role === "admin") {
    return {
      plan: "enterprise",
      status: "active",
    };
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .or(
      `user_id.eq.${session.userId},wallet_address.eq.${session.walletAddress}`
    )
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

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
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Payment required. Please choose a plan before creating a project.",
          redirectTo: "/app/billing",
        },
        { status: 401 }
      );
    }

    const subscription = await getActiveSubscription(session);

    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error: "No active paid plan found. Please purchase a plan before creating a project.",
          redirectTo: "/app/billing",
        },
        { status: 403 }
      );
    }

    const plan = String(subscription.plan || "").toLowerCase();
    const projectLimit = getProjectLimit(plan);

    if (projectLimit <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid subscription plan. Please contact support.",
          redirectTo: "/app/billing",
        },
        { status: 403 }
      );
    }

    const { count, error: countError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("owner_email", session.walletAddress);

    if (countError) throw countError;

    if ((count || 0) >= projectLimit) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project limit reached. Please upgrade your plan.",
          plan,
          projectLimit,
          currentProjects: count || 0,
          redirectTo: "/app/billing",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: body.name,
        symbol: body.symbol,
        slug: body.slug,
        mint: body.mint,
        owner_email: session.walletAddress,
        description: body.description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      project: data,
      plan,
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
