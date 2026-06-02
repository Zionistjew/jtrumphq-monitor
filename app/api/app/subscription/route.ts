import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getSession, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENTERPRISE_LIMIT = 999999;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
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

function getPlanLabel(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "launch-pass":
      return "Launch Pass";
    case "starter":
      return "Starter";
    case "growth":
      return "Growth";
    case "enterprise":
      return "Enterprise";
    default:
      return "No Active Plan";
  }
}

function getUpgradeTarget(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "launch-pass":
    case "starter":
      return "/checkout/crypto/growth";
    case "growth":
      return "mailto:verify@web3mb.com?subject=WEB3MB Enterprise Upgrade";
    case "enterprise":
      return null;
    default:
      return "/app/billing";
  }
}

function fallbackProjectLimit(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "launch-pass":
    case "starter":
      return 1;
    case "growth":
      return 5;
    case "enterprise":
      return ENTERPRISE_LIMIT;
    default:
      return 0;
  }
}

function fallbackWalletLimit(plan: string) {
  switch ((plan || "").toLowerCase()) {
    case "launch-pass":
      return 10;
    case "starter":
      return 15;
    case "growth":
      return 50;
    case "enterprise":
      return ENTERPRISE_LIMIT;
    default:
      return 0;
  }
}

function getDbLimit(value: unknown, fallback: number) {
  const n = Number(value);

  if (Number.isFinite(n) && n >= 0) {
    return n;
  }

  return fallback;
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
      starts_at: new Date().toISOString(),
      ends_at: null,
      projects_limit: ENTERPRISE_LIMIT,
      wallets_limit: ENTERPRISE_LIMIT,
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

export async function GET() {
  try {
    const session = await getNormalizedSession();

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const subscription = await getActiveSubscription(session);

    const plan = String(subscription?.plan || "").toLowerCase();
    const status = String(subscription?.status || "inactive").toLowerCase();

    const projectLimit = subscription
      ? getDbLimit(subscription.projects_limit, fallbackProjectLimit(plan))
      : 0;

    const walletLimit = subscription
      ? getDbLimit(subscription.wallets_limit, fallbackWalletLimit(plan))
      : 0;

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, slug")
      .eq("user_id", session.userId);

    if (projectsError) throw projectsError;

    const projectIds = (projects || []).map((project) => project.id);

    let walletsUsed = 0;

    if (projectIds.length > 0) {
      const { count, error: walletCountError } = await supabase
        .from("project_wallets")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds);

      if (walletCountError) throw walletCountError;

      walletsUsed = count || 0;
    }

    const projectsUsed = projects?.length || 0;

    const projectsRemaining =
      projectLimit >= ENTERPRISE_LIMIT
        ? ENTERPRISE_LIMIT
        : Math.max(projectLimit - projectsUsed, 0);

    const walletsRemaining =
      walletLimit >= ENTERPRISE_LIMIT
        ? ENTERPRISE_LIMIT
        : Math.max(walletLimit - walletsUsed, 0);

    const projectUsagePercent =
      projectLimit > 0 && projectLimit < ENTERPRISE_LIMIT
        ? Math.min(Math.round((projectsUsed / projectLimit) * 100), 100)
        : projectsUsed > 0
          ? 100
          : 0;

    const walletUsagePercent =
      walletLimit > 0 && walletLimit < ENTERPRISE_LIMIT
        ? Math.min(Math.round((walletsUsed / walletLimit) * 100), 100)
        : walletsUsed > 0
          ? 100
          : 0;

    const upgradeRequired =
      projectLimit > 0 &&
      projectLimit < ENTERPRISE_LIMIT &&
      projectsUsed >= projectLimit;

    return NextResponse.json({
      ok: true,
      authenticated: true,
      user: {
        id: session.userId,
        walletAddress: session.walletAddress,
        role: session.role,
      },
      subscription: subscription
        ? {
            id: subscription.id || null,
            plan,
            plan_label: getPlanLabel(plan),
            status,
            starts_at: subscription.starts_at || null,
            ends_at: subscription.ends_at || null,
            renewal_date: subscription.ends_at || null,
            wallet_address: subscription.wallet_address || session.walletAddress,
            projects_limit: projectLimit,
            wallets_limit: walletLimit,
          }
        : null,
      usage: {
        project_limit: projectLimit,
        projects_used: projectsUsed,
        projects_remaining: projectsRemaining,
        project_usage_percent: projectUsagePercent,
        wallet_limit: walletLimit,
        wallets_used: walletsUsed,
        wallets_remaining: walletsRemaining,
        wallet_usage_percent: walletUsagePercent,
        upgrade_required: upgradeRequired,
      },
      upgrade: {
        recommended: !subscription || upgradeRequired,
        target: getUpgradeTarget(plan),
      },
      projects: projects || [],
    });
  } catch (error: any) {
    console.error("GET /api/app/subscription error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load subscription status.",
      },
      { status: 500 }
    );
  }
}
