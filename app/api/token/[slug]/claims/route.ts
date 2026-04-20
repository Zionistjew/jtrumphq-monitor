import { getProjectBySlug } from "@/lib/projects";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: {
    slug: string;
  };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return Response.json(
        { ok: false, error: "Missing project slug" },
        { status: 400 }
      );
    }

    const project = await getProjectBySlug(slug);

    if (!project) {
      return Response.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("wallet_claims")
      .select(
        "project_slug, wallet_address, wallet_label, claimant_address, status, verified_at"
      )
      .eq("project_slug", slug)
      .eq("status", "verified")
      .order("verified_at", { ascending: false });

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      slug,
      count: data?.length || 0,
      claims: data || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Token claims API error:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
