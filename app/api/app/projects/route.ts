import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function getTokenMetadata(mint: string) {
  const fallback = {
    mint,
    name: "",
    symbol: "",
    decimals: null as number | null,
    supply: null as string | null,
    slug: "",
    description: "",
    source: "fallback",
  };

  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "web3mb-get-asset",
        method: "getAsset",
        params: {
          id: mint,
        },
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    const result = data?.result;

    const name =
      result?.content?.metadata?.name ||
      result?.content?.json_uri?.name ||
      result?.token_info?.name ||
      "";

    const symbol =
      result?.content?.metadata?.symbol ||
      result?.token_info?.symbol ||
      "";

    const description =
      result?.content?.metadata?.description ||
      "";

    const slugBase = name || symbol || `token-${mint.slice(0, 6)}`;

    if (name || symbol) {
      return {
        mint,
        name,
        symbol,
        decimals: result?.token_info?.decimals ?? null,
        supply: result?.token_info?.supply
          ? String(result.token_info.supply)
          : null,
        slug: slugify(slugBase),
        description,
        source: "helius-das",
      };
    }
  } catch (error) {
    console.warn("Helius DAS metadata lookup failed:", error);
  }

  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const mintPubkey = new PublicKey(mint);
    const account = await connection.getParsedAccountInfo(mintPubkey);

    const parsed: any = account.value?.data;
    const info = parsed?.parsed?.info;

    return {
      ...fallback,
      decimals: typeof info?.decimals === "number" ? info.decimals : null,
      supply: info?.supply ? String(info.supply) : null,
      name: `Token ${mint.slice(0, 6)}`,
      symbol: "TOKEN",
      slug: slugify(`token-${mint.slice(0, 6)}`),
      source: "solana-parsed-account",
    };
  } catch (error) {
    console.warn("Parsed mint lookup failed:", error);
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

  if (error) throw error;

  return data;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mint = url.searchParams.get("mint");
    const lookup = url.searchParams.get("lookup");

    if (lookup === "metadata" && mint) {
      const metadata = await getTokenMetadata(mint);

      return NextResponse.json({
        ok: true,
        metadata,
      });
    }

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
          error:
            "Payment required. Please choose a plan before creating a project.",
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
          error:
            "No active paid plan found. Please purchase a plan before creating a project.",
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
    const mint = String(body.mint || "").trim();

    if (!mint) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token mint address is required.",
        },
        { status: 400 }
      );
    }

    const metadata = await getTokenMetadata(mint);

    const name =
      String(body.name || "").trim() ||
      metadata.name ||
      `Token ${mint.slice(0, 6)}`;

    const symbol =
      String(body.symbol || "").trim() ||
      metadata.symbol ||
      "TOKEN";

    const slug =
      String(body.slug || "").trim() ||
      metadata.slug ||
      slugify(`${symbol}-${mint.slice(0, 6)}`);

    const description =
      String(body.description || "").trim() ||
      metadata.description ||
      `WEB3MB transparency profile for ${name}.`;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        symbol,
        slug,
        mint,
        owner_email: session.walletAddress,
        description,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      project: data,
      metadata,
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
