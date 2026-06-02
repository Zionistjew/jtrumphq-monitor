import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function getStartDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const slug = String(id || "").toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Missing project slug." },
        { status: 400 }
      );
    }

    const since30 = getStartDate(30);
    const since7 = getStartDate(7);

    const { count: totalImpressions, error: totalImpressionError } =
      await supabase
        .from("trust_seal_events")
        .select("*", { count: "exact", head: true })
        .eq("project_slug", slug)
        .eq("event_type", "impression");

    if (totalImpressionError) throw totalImpressionError;

    const { count: totalClicks, error: totalClickError } = await supabase
      .from("trust_seal_events")
      .select("*", { count: "exact", head: true })
      .eq("project_slug", slug)
      .eq("event_type", "click");

    if (totalClickError) throw totalClickError;

    const { count: impressions7d, error: impressions7dError } = await supabase
      .from("trust_seal_events")
      .select("*", { count: "exact", head: true })
      .eq("project_slug", slug)
      .eq("event_type", "impression")
      .gte("created_at", since7);

    if (impressions7dError) throw impressions7dError;

    const { count: clicks7d, error: clicks7dError } = await supabase
      .from("trust_seal_events")
      .select("*", { count: "exact", head: true })
      .eq("project_slug", slug)
      .eq("event_type", "click")
      .gte("created_at", since7);

    if (clicks7dError) throw clicks7dError;

    const { data: events30d, error: events30dError } = await supabase
      .from("trust_seal_events")
      .select("event_type, domain, created_at")
      .eq("project_slug", slug)
      .gte("created_at", since30)
      .order("created_at", { ascending: true });

    if (events30dError) throw events30dError;

    const domainMap = new Map<
      string,
      {
        domain: string;
        impressions: number;
        clicks: number;
      }
    >();

    const dailyMap = new Map<
      string,
      {
        date: string;
        impressions: number;
        clicks: number;
      }
    >();

    for (const event of events30d || []) {
      const domain = event.domain || "direct / unknown";
      const day = new Date(event.created_at).toISOString().slice(0, 10);

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          impressions: 0,
          clicks: 0,
        });
      }

      if (!dailyMap.has(day)) {
        dailyMap.set(day, {
          date: day,
          impressions: 0,
          clicks: 0,
        });
      }

      const domainRow = domainMap.get(domain)!;
      const dailyRow = dailyMap.get(day)!;

      if (event.event_type === "impression") {
        domainRow.impressions += 1;
        dailyRow.impressions += 1;
      }

      if (event.event_type === "click") {
        domainRow.clicks += 1;
        dailyRow.clicks += 1;
      }
    }

    const topDomains = Array.from(domainMap.values())
      .map((row) => ({
        ...row,
        ctr:
          row.impressions > 0
            ? Number(((row.clicks / row.impressions) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    const daily = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const totalCtr =
      totalImpressions && totalImpressions > 0
        ? Number((((totalClicks || 0) / totalImpressions) * 100).toFixed(2))
        : 0;

    const ctr7d =
      impressions7d && impressions7d > 0
        ? Number((((clicks7d || 0) / impressions7d) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      ok: true,
      slug,
      totals: {
        impressions: totalImpressions || 0,
        clicks: totalClicks || 0,
        ctr: totalCtr,
      },
      last7d: {
        impressions: impressions7d || 0,
        clicks: clicks7d || 0,
        ctr: ctr7d,
      },
      top_domains: topDomains,
      daily,
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/analytics error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to load analytics.",
      },
      { status: 500 }
    );
  }
}
