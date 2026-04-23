import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type WalletInput = {
  label?: string;
  category?: string;
  address?: string;
  purpose?: string;
  allocation?: string | number | null;
};

function normalizeWallet(wallet: WalletInput) {
  return {
    label: String(wallet.label || "").trim(),
    category: String(wallet.category || "").trim(),
    address: String(wallet.address || "").trim(),
    purpose: String(wallet.purpose || "").trim(),
    allocation:
      wallet.allocation !== undefined &&
      wallet.allocation !== null &&
      wallet.allocation !== ""
        ? Number(wallet.allocation)
        : 0,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      slug,
      name,
      symbol,
      mint,
      description,
      theme_primary,
      theme_accent,
      wallets = [],
    } = body;

    if (!slug || !name || !symbol || !mint) {
      return NextResponse.json(
        { error: "slug, name, symbol, and mint are required" },
        { status: 400 }
      );
    }

    const normalizedWallets = Array.isArray(wallets)
      ? wallets
          .map(normalizeWallet)
          .filter(
            (wallet) =>
              wallet.label &&
              wallet.category &&
              wallet.address
          )
      : [];

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        owner_id: user.id,
        slug: String(slug).trim(),
        name: String(name).trim(),
        symbol: String(symbol).trim(),
        mint: String(mint).trim(),
        description: description ? String(description).trim() : "",
        theme_primary: theme_primary || "red",
        theme_accent: theme_accent || "zinc",
        wallets: normalizedWallets, // legacy/public dashboard dependency
      })
      .select()
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: projectError?.message || "Failed to create project" },
        { status: 400 }
      );
    }

    if (normalizedWallets.length > 0) {
      const walletRows = normalizedWallets.map((wallet) => ({
        project_id: project.id,
        label: wallet.label,
        category: wallet.category,
        address: wallet.address,
        purpose: wallet.purpose || null,
        allocation: wallet.allocation || 0,
      }));

      const { error: walletError } = await supabase
        .from("project_wallets")
        .insert(walletRows);

      if (walletError) {
        return NextResponse.json(
          {
            error: `Project created, but wallet rows failed: ${walletError.message}`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        project,
        walletCount: normalizedWallets.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/app/projects error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
