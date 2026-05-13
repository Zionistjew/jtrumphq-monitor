import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function uuidFromWallet(walletAddress: string) {
  const hash = crypto.createHash("sha256").update(walletAddress).digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    "8" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

async function getNormalizedSession() {
  const session = await getSession();

  if (!session) return null;

  if (isUuid(session.userId)) return session;

  const normalizedUserId = uuidFromWallet(session.walletAddress);

  await setSessionCookie({
    userId: normalizedUserId,
    walletAddress: session.walletAddress,
    role: session.role,
  });

  return {
    ...session,
    userId: normalizedUserId,
  };
}

async function ensureProfile(userId: string) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
    },
    {
      onConflict: "id",
    }
  );

  if (error) throw error;
}

function cleanSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProjectLimit(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "launch-pass":
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
      user_id: session.userId,
      wallet_address: session.walletAddress,
    };
  }

  const nowIso = new Date().toISOString();

  const { data: byUser, error: userError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", session.userId)
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (userError) throw userError;

  if (byUser && (!byUser.ends_at || String(byUser.ends_at) > nowIso)) {
    return byUser;
  }

  const { data: byWallet, error: walletError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("wallet_address", session.walletAddress)
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (walletError) throw walletError;

  if (byWallet && (!byWallet.ends_at || String(byWallet.ends_at) > nowIso)) {
    return byWallet;
  }

  return null;
}

function cleanWallets(input: any) {
  if (!Array.isArray(input)) return [];

  return input
    .map((wallet) => ({
      label: String(wallet?.label || "").trim(),
      category: String(wallet?.category || "Treasury").trim(),
      address: String(wallet?.address || "").trim(),
      purpose: String(wallet?.purpose || "").trim(),
      allocation:
        wallet?.allocation === null ||
        wallet?.allocation === undefined ||
        wallet?.allocation === ""
          ? 0
          : Number(wallet.allocation),
      verified: Boolean(wallet?.verified),
    }))
    .filter((wallet) => wallet.address || wallet.label || wallet.purpose);
}

export async function GET() {
  try {
    const session = await getNormalizedSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    await ensureProfile(session.userId);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      projects: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load projects.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getNormalizedSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized. Please complete billing again.",
          redirectTo: "/app/billing",
        },
        { status: 401 }
      );
    }

    await ensureProfile(session.userId);

    const subscription = await getActiveSubscription(session);

    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error: "No active paid plan found. Please activate billing first.",
          redirectTo: "/app/billing",
        },
        { status: 402 }
      );
    }

    const plan = String(subscription.plan || "starter").toLowerCase();
    const projectLimit = getProjectLimit(plan);

    const { count: projectCount, error: countError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.userId);

    if (countError) throw countError;

    if ((projectCount || 0) >= projectLimit) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project limit reached. Please upgrade your plan.",
          billing: {
            plan,
            project_limit: projectLimit,
            current_projects: projectCount || 0,
          },
          redirectTo: "/app/billing",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const symbol = String(body.symbol || "").trim();
    const mint = String(body.mint || "").trim();
    const description = String(body.description || "").trim();
    const slug = cleanSlug(body.slug || name || symbol);

    if (!name || !symbol || !slug || !mint) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project name, symbol, slug, and mint address are required.",
        },
        { status: 400 }
      );
    }

    const { data: existingSlug, error: slugError } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugError) throw slugError;

    if (existingSlug) {
      return NextResponse.json(
        {
          ok: false,
          error: "This project slug already exists. Please choose another slug.",
        },
        { status: 409 }
      );
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: session.userId,
        name,
        symbol,
        slug,
        mint,
        description,
        theme: body.theme || {
          primary: "cyan",
          accent: "blue",
        },
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    const wallets = cleanWallets(body.wallets);

    if (wallets.length > 0) {
      const walletRows = wallets.map((wallet) => ({
        project_id: project.id,
        label: wallet.label || "Wallet",
        category: wallet.category || "Treasury",
        address: wallet.address,
        purpose: wallet.purpose || "",
        allocation: Number(wallet.allocation || 0),
        verified: Boolean(wallet.verified),
      }));

      const { error: walletError } = await supabase
        .from("project_wallets")
        .insert(walletRows);

      if (walletError) throw walletError;
    }

    return NextResponse.json({
      ok: true,
      project,
      redirect: `/token/${project.slug}`,
      billing: {
        plan,
        project_limit: projectLimit,
        current_projects: (projectCount || 0) + 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create project.",
      },
      { status: 500 }
    );
  }
}
