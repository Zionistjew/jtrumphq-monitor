import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_EVENTS = new Set(["impression", "click"]);

function hashIp(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cleanText(value: unknown, max = 500) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

function getIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const realIp = req.headers.get("x-real-ip") || "";

  return forwardedFor.split(",")[0]?.trim() || realIp.trim() || "";
}

function getDomainFromReferrer(referrer: string) {
  try {
    if (!referrer) return "";
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const project_slug = cleanText(body.project_slug, 120).toLowerCase();
    const event_type = cleanText(body.event_type, 40).toLowerCase();
    const referrer =
      cleanText(body.referrer, 1000) ||
      cleanText(req.headers.get("referer"), 1000);

    if (!project_slug) {
      return NextResponse.json(
        { ok: false, error: "Missing project slug." },
        { status: 400 }
      );
    }

    if (!ALLOWED_EVENTS.has(event_type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid event type." },
        { status: 400 }
      );
    }

    const ip = getIp(req);
    const userAgent = cleanText(req.headers.get("user-agent"), 500);
    const domain = getDomainFromReferrer(referrer);

    const { error } = await supabase.from("trust_seal_events").insert({
      project_slug,
      event_type,
      domain: domain || null,
      referrer: referrer || null,
      user_agent: userAgent || null,
      ip_hash: ip ? hashIp(ip) : null,
      country: null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("POST /api/embed/track error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to track trust seal event.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "WEB3MB Trust Seal Event Tracker",
    events: Array.from(ALLOWED_EVENTS),
  });
}
