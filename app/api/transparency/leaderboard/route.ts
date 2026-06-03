import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET() {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase environment variables missing." },
        { status: 500 }
      );
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, name, symbol, slug, mint, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const baseUrl = await getBaseUrl();

    const rows = await Promise.all(
      (projects || []).map(async (project: any) => {
        try {
          const res = await fetch(`${baseUrl}/api/trust-score/${project.slug}`, {
            cache: "no-store",
          });

          const trust = await res.json().catch(() => null);

          const score = trust?.trust?.score ?? trust?.score ?? 0;
          const grade = trust?.trust?.grade ?? trust?.grade ?? "F";
          const status = trust?.trust?.status ?? trust?.status ?? "High Risk";

          return {
            id: project.id,
            name: project.name,
            symbol: project.symbol,
            slug: project.slug,
            mint: project.mint,
            score,
            grade,
            status,
            disclosedWallets: trust?.metrics?.disclosedWallets ?? 0,
            verifiedWallets: trust?.metrics?.verifiedWallets ?? 0,
            coverageRatio: trust?.metrics?.coverageRatio ?? 0,
          };
        } catch {
          return {
            id: project.id,
            name: project.name,
            symbol: project.symbol,
            slug: project.slug,
            mint: project.mint,
            score: 0,
            grade: "F",
            status: "Unavailable",
            disclosedWallets: 0,
            verifiedWallets: 0,
            coverageRatio: 0,
          };
        }
      })
    );

    rows.sort((a, b) => Number(b.score) - Number(a.score));

    return NextResponse.json({
      ok: true,
      count: rows.length,
      projects: rows.map((row, index) => ({
        rank: index + 1,
        ...row,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Leaderboard failed." },
      { status: 500 }
    );
  }
}
