import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        slug,
        name,
        symbol,
        mint,
        description: description || null,
        theme_primary: theme_primary || "red",
        theme_accent: theme_accent || "zinc",
      })
      .select()
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: projectError?.message || "Failed to create project" },
        { status: 400 }
      );
    }

    if (Array.isArray(wallets) && wallets.length > 0) {
      const walletRows = wallets.map((wallet: any) => ({
        project_id: project.id,
        label: wallet.label,
        category: wallet.category,
        address: wallet.address,
        purpose: wallet.purpose || null,
        allocation:
          wallet.allocation !== undefined &&
          wallet.allocation !== null &&
          wallet.allocation !== ""
            ? Number(wallet.allocation)
            : null,
      }));

      const { error: walletError } = await supabase
        .from("project_wallets")
        .insert(walletRows);

      if (walletError) {
        return NextResponse.json(
          { error: walletError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/app/projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
