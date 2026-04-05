import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getProjects() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProjects error:", error);
    return [];
  }

  return data || [];
}

export async function getProjectBySlugFromStore(slug: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getProjectBySlugFromStore error:", error);
    return null;
  }

  return data;
}

export async function saveProject(project: any) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("projects").insert({
    slug: project.slug,
    name: project.name,
    symbol: project.symbol,
    mint: project.mint,
    description: project.description,
    theme: project.theme,
    wallets: project.wallets,
  });

  if (error) {
    throw error;
  }

  return true;
}
