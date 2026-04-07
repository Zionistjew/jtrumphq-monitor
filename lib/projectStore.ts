import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseAdmin() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  const serviceRoleKey = requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    supabaseServiceRoleKey
  );

  return createClient(url, serviceRoleKey, {
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
    throw new Error(`getProjects failed: ${error.message}`);
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
    throw new Error(`getProjectBySlugFromStore failed: ${error.message}`);
  }

  return data;
}

export async function saveProject(project: any) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      slug: project.slug,
      name: project.name,
      symbol: project.symbol,
      mint: project.mint,
      description: project.description,
      theme: project.theme,
      wallets: project.wallets,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`saveProject failed: ${error.message}`);
  }

  return data;
}
