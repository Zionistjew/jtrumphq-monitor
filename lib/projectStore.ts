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

function normalizeWallet(wallet: any) {
  return {
    label: String(wallet?.label || "").trim(),
    category: String(wallet?.category || "").trim(),
    address: String(wallet?.address || "").trim(),
    purpose: String(wallet?.purpose || "").trim(),
    allocation: Number(wallet?.allocation || 0),
  };
}

function normalizeProject(project: any) {
  return {
    ...project,
    wallets: Array.isArray(project?.wallets)
      ? project.wallets.map(normalizeWallet)
      : [],
  };
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

  return (data || []).map(normalizeProject);
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

  return normalizeProject(data);
}

export async function saveProject(project: any) {
  const supabase = getSupabaseAdmin();

  const normalizedProject = {
    slug: String(project?.slug || "").trim(),
    name: String(project?.name || "").trim(),
    symbol: String(project?.symbol || "").trim(),
    mint: String(project?.mint || "").trim(),
    description: String(project?.description || "").trim(),
    theme: {
      primary: String(project?.theme?.primary || "cyan").trim(),
      accent: String(project?.theme?.accent || "zinc").trim(),
    },
    wallets: Array.isArray(project?.wallets)
      ? project.wallets.map(normalizeWallet)
      : [],
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(normalizedProject)
    .select()
    .single();

  if (error) {
    throw new Error(`saveProject failed: ${error.message}`);
  }

  return normalizeProject(data);
}
