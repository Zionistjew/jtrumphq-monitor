import { getSupabaseAdmin } from "./supabaseAdmin";

export type ProjectWallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation?: number;
};

export type ProjectConfig = {
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  description: string;
  theme: {
    primary: string;
    accent: string;
  };
  wallets: ProjectWallet[];
};

type ProjectRow = {
  id: number;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  description: string | null;
  theme_primary: string | null;
  theme_accent: string | null;
};

type WalletRow = {
  label: string;
  category: string;
  address: string;
  purpose: string | null;
  allocation: number | null;
};

function mapProject(
  project: ProjectRow,
  wallets: WalletRow[]
): ProjectConfig {
  return {
    slug: project.slug,
    name: project.name,
    symbol: project.symbol,
    mint: project.mint,
    description: project.description || "",
    theme: {
      primary: project.theme_primary || "red",
      accent: project.theme_accent || "zinc",
    },
    wallets: wallets.map((wallet) => ({
      label: wallet.label,
      category: wallet.category,
      address: wallet.address,
      purpose: wallet.purpose || "",
      allocation: wallet.allocation ?? undefined,
    })),
  };
}

export async function getAllProjects(): Promise<ProjectConfig[]> {
  const supabase = getSupabaseAdmin();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, symbol, mint, description, theme_primary, theme_accent")
    .order("id", { ascending: false });

  if (projectsError || !projects) {
    console.error("getAllProjects error:", projectsError);
    return [];
  }

  const results = await Promise.all(
    projects.map(async (project) => {
      const { data: wallets, error: walletsError } = await supabase
        .from("project_wallets")
        .select("label, category, address, purpose, allocation")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true });

      if (walletsError) {
        console.error(`getAllProjects wallets error for ${project.slug}:`, walletsError);
        return mapProject(project, []);
      }

      return mapProject(project, wallets || []);
    })
  );

  return results;
}

export async function getProjectBySlug(
  slug: string
): Promise<ProjectConfig | null> {
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug, name, symbol, mint, description, theme_primary, theme_accent")
    .eq("slug", slug)
    .single();

  if (projectError || !project) {
    console.error(`getProjectBySlug error for ${slug}:`, projectError);
    return null;
  }

  const { data: wallets, error: walletsError } = await supabase
    .from("project_wallets")
    .select("label, category, address, purpose, allocation")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (walletsError) {
    console.error(`getProjectBySlug wallets error for ${slug}:`, walletsError);
    return mapProject(project, []);
  }

  return mapProject(project, wallets || []);
}
