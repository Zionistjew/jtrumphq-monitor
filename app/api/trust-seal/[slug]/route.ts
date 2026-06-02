import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function gradeColor(score: number) {
  if (score >= 90) {
    return {
      primary: "#10B981",
      secondary: "#064E3B",
      glow: "#34D399",
      label: "EXCELLENT",
    };
  }

  if (score >= 80) {
    return {
      primary: "#22C55E",
      secondary: "#052E16",
      glow: "#4ADE80",
      label: "TRUSTED",
    };
  }

  if (score >= 70) {
    return {
      primary: "#F59E0B",
      secondary: "#451A03",
      glow: "#FBBF24",
      label: "MODERATE",
    };
  }

  if (score >= 60) {
    return {
      primary: "#F97316",
      secondary: "#431407",
      glow: "#FB923C",
      label: "WARNING",
    };
  }

  return {
    primary: "#EF4444",
    secondary: "#450A0A",
    glow: "#F87171",
    label: "HIGH RISK",
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return new NextResponse("Missing slug", {
        status: 400,
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://app.web3mb.com";

    const trustRes = await fetch(
      `${baseUrl}/api/trust-score/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!trustRes.ok) {
      return new NextResponse("Unable to load trust score", {
        status: 500,
      });
    }

    const trustData = await trustRes.json();

    if (!trustData?.ok) {
      return new NextResponse("Invalid trust data", {
        status: 500,
      });
    }

    const project = trustData.project || {};
    const trust = trustData.trust || {};
    const metrics = trustData.metrics || {};

    const score = normalizeScore(Number(trust.score || 0));

    const theme = gradeColor(score);

    const verifiedWallets = Number(
      metrics.verifiedWallets || 0
    );

    const totalWallets = Number(
      metrics.wallets || 0
    );

    const mismatchCount = Number(
      metrics.mismatches || 0
    );

    const lowSolCount = Number(
      metrics.lowSolWallets || 0
    );

    const generatedDate = new Date().toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

    const transparencyUrl =
      `${baseUrl}/token/${slug}`;

    const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="900"
  height="260"
  viewBox="0 0 900 260"
  fill="none"
>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="900" y2="260">
      <stop stop-color="#020617"/>
      <stop offset="1" stop-color="#0F172A"/>
    </linearGradient>

    <linearGradient id="score" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="${theme.primary}"/>
      <stop offset="1" stop-color="${theme.glow}"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect
    width="900"
    height="260"
    rx="34"
    fill="url(#bg)"
  />

  <rect
    x="10"
    y="10"
    width="880"
    height="240"
    rx="28"
    fill="#0B1120"
    stroke="#1E293B"
  />

  <circle
    cx="120"
    cy="130"
    r="72"
    fill="${theme.secondary}"
  />

  <circle
    cx="120"
    cy="130"
    r="60"
    fill="url(#score)"
    filter="url(#glow)"
  />

  <text
    x="120"
    y="145"
    text-anchor="middle"
    fill="white"
    font-size="44"
    font-weight="800"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${score}
  </text>

  <text
    x="220"
    y="78"
    fill="#F8FAFC"
    font-size="34"
    font-weight="800"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(project.name || slug)}
  </text>

  <text
    x="220"
    y="118"
    fill="${theme.glow}"
    font-size="22"
    font-weight="700"
    font-family="Arial, Helvetica, sans-serif"
  >
    WEB3MB VERIFIED TRANSPARENCY
  </text>

  <text
    x="220"
    y="152"
    fill="#CBD5E1"
    font-size="18"
    font-family="Arial, Helvetica, sans-serif"
  >
    Trust Grade: ${escapeXml(
      trust.grade || "N/A"
    )} • ${escapeXml(
      trust.status || "Unknown"
    )}
  </text>

  <text
    x="220"
    y="184"
    fill="#94A3B8"
    font-size="16"
    font-family="Arial, Helvetica, sans-serif"
  >
    Verified Wallets: ${verifiedWallets}/${totalWallets}
  </text>

  <text
    x="220"
    y="210"
    fill="#94A3B8"
    font-size="16"
    font-family="Arial, Helvetica, sans-serif"
  >
    Mismatches: ${mismatchCount} • Low SOL Warnings: ${lowSolCount}
  </text>

  <rect
    x="680"
    y="48"
    width="170"
    height="46"
    rx="14"
    fill="${theme.secondary}"
    stroke="${theme.primary}"
  />

  <text
    x="765"
    y="77"
    text-anchor="middle"
    fill="${theme.glow}"
    font-size="18"
    font-weight="800"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${theme.label}
  </text>

  <text
    x="680"
    y="146"
    fill="#E2E8F0"
    font-size="14"
    font-family="Arial, Helvetica, sans-serif"
  >
    Powered by WEB3MB
  </text>

  <text
    x="680"
    y="170"
    fill="#94A3B8"
    font-size="13"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(transparencyUrl)}
  </text>

  <text
    x="680"
    y="206"
    fill="#64748B"
    font-size="12"
    font-family="Arial, Helvetica, sans-serif"
  >
    Generated ${generatedDate}
  </text>
</svg>
`.trim();

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return new NextResponse(
      error?.message || "Trust seal generation failed",
      {
        status: 500,
      }
    );
  }
}
