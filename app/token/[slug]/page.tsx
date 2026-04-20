import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TokenDashboardClient from "@/components/token/TokenDashboardClient";

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function TokenPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug, name, symbol, mint, description, theme_primary, theme_accent")
    .eq("slug", params.slug)
    .single();

  if (projectError || !project) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 p-12 text-center shadow-2xl">
          <h1 className="text-5xl font-bold">Project not found</h1>
          <p className="mt-6 text-2xl text-zinc-400">
            This transparency dashboard does not exist yet.
          </p>

          <div className="mt-10">
            <Link
              href="/transparency"
              className="inline-block rounded-xl bg-cyan-500 px-8 py-4 text-xl font-semibold text-black"
            >
              Back to Transparency Directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: wallets, error: walletsError } = await supabase
    .from("project_wallets")
    .select("id, label, category, address, purpose, allocation, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (walletsError) {
    console.error("Token page wallets error:", walletsError);
  }

  return (
    <TokenDashboardClient
      slug={project.slug}
      project={{
        id: project.id,
        slug: project.slug,
        name: project.name,
        symbol: project.symbol,
        mint: project.mint,
        description: project.description || "",
        theme_primary: project.theme_primary || "red",
        theme_accent: project.theme_accent || "zinc",
      }}
      initialWallets={(wallets || []).map((wallet) => ({
        id: wallet.id,
        label: wallet.label,
        category: wallet.category,
        address: wallet.address,
        purpose: wallet.purpose || "",
        allocation: wallet.allocation ?? null,
        created_at: wallet.created_at,
      }))}
    />
  );
}
