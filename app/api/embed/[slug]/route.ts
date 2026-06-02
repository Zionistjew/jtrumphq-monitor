import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function scoreTheme(score: number) {
  if (score >= 80) {
    return {
      color: "#22c55e",
      bg: "#052e16",
      label: "TRUSTED",
    };
  }

  if (score >= 70) {
    return {
      color: "#f59e0b",
      bg: "#451a03",
      label: "MODERATE",
    };
  }

  if (score >= 60) {
    return {
      color: "#f97316",
      bg: "#431407",
      label: "WARNING",
    };
  }

  return {
    color: "#ef4444",
    bg: "#450a0a",
    label: "HIGH RISK",
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.web3mb.com";

    const res = await fetch(`${baseUrl}/api/trust-score/${slug}`, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      return new NextResponse("WEB3MB project not found.", { status: 404 });
    }

    const project = data.project || {};
    const trust = data.trust || {};
    const metrics = data.metrics || {};

    const score = Math.max(0, Math.min(100, Math.round(Number(trust.score || 0))));
    const theme = scoreTheme(score);

    const html = `
<a href="${baseUrl}/token/${escapeHtml(slug)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;max-width:520px;">
  <div style="font-family:Arial,Helvetica,sans-serif;background:#020617;border:1px solid #1e293b;border-radius:22px;padding:18px;color:#f8fafc;box-shadow:0 14px 40px rgba(0,0,0,.28);">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:76px;height:76px;border-radius:999px;background:${theme.bg};display:flex;align-items:center;justify-content:center;border:2px solid ${theme.color};">
        <div style="font-size:30px;font-weight:900;color:${theme.color};">${score}</div>
      </div>

      <div style="min-width:0;flex:1;">
        <div style="font-size:13px;letter-spacing:.22em;color:#22d3ee;font-weight:800;">WEB3MB VERIFIED</div>
        <div style="margin-top:6px;font-size:22px;font-weight:900;color:white;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(project.name || slug)}
        </div>
        <div style="margin-top:6px;color:#cbd5e1;font-size:14px;">
          Grade ${escapeHtml(trust.grade || "N/A")} · ${escapeHtml(trust.status || theme.label)}
        </div>
      </div>

      <div style="border:1px solid ${theme.color};background:${theme.bg};color:${theme.color};border-radius:999px;padding:8px 11px;font-size:11px;font-weight:900;white-space:nowrap;">
        ${theme.label}
      </div>
    </div>

    <div style="margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:10px;">
        <div style="color:#64748b;font-size:10px;font-weight:800;letter-spacing:.12em;">WALLETS</div>
        <div style="margin-top:5px;color:white;font-size:16px;font-weight:900;">${Number(metrics.wallets || 0)}</div>
      </div>

      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:10px;">
        <div style="color:#64748b;font-size:10px;font-weight:800;letter-spacing:.12em;">VERIFIED</div>
        <div style="margin-top:5px;color:white;font-size:16px;font-weight:900;">${Number(metrics.verifiedWallets || 0)}</div>
      </div>

      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:10px;">
        <div style="color:#64748b;font-size:10px;font-weight:800;letter-spacing:.12em;">WARNINGS</div>
        <div style="margin-top:5px;color:white;font-size:16px;font-weight:900;">${Number(metrics.mismatches || 0) + Number(metrics.lowSolWallets || 0)}</div>
      </div>
    </div>

    <div style="margin-top:14px;color:#94a3b8;font-size:12px;">
      Powered by <strong style="color:#67e8f9;">WEB3MB</strong> · Live transparency report
    </div>
  </div>
</a>`.trim();

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new NextResponse(error?.message || "WEB3MB embed failed.", {
      status: 500,
    });
  }
}
