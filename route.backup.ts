import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Award = {
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  bg: string;
};

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

function tierColor(tier?: string) {
  const value = String(tier || "").toLowerCase();

  if (value === "platinum") {
    return {
      primary: "#C084FC",
      secondary: "#3B0764",
      label: "PLATINUM",
    };
  }

  if (value === "gold") {
    return {
      primary: "#FACC15",
      secondary: "#422006",
      label: "GOLD",
    };
  }

  if (value === "silver") {
    return {
      primary: "#CBD5E1",
      secondary: "#334155",
      label: "SILVER",
    };
  }

  if (value === "bronze") {
    return {
      primary: "#FB923C",
      secondary: "#431407",
      label: "BRONZE",
    };
  }

  if (value === "starter") {
    return {
      primary: "#22D3EE",
      secondary: "#164E63",
      label: "STARTER",
    };
  }

  return {
    primary: "#94A3B8",
    secondary: "#1E293B",
    label: "UNVERIFIED",
  };
}

function escapeXml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function percentText(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function tierRank(tier?: string) {
  const value = String(tier || "").toLowerCase();

  if (value === "platinum") return 5;
  if (value === "gold") return 4;
  if (value === "silver") return 3;
  if (value === "bronze") return 2;
  if (value === "starter") return 1;

  return 0;
}

function buildAwards({
  score,
  tier,
  rank,
  verifiedWallets,
}: {
  score: number;
  tier: string;
  rank?: number | null;
  verifiedWallets: number;
}) {
  const awards: Award[] = [];
  const normalizedTier = String(tier || "").toLowerCase();

  if (rank && rank <= 10 && verifiedWallets > 0) {
    awards.push({
      label: "Top 10 Verified",
      shortLabel: "TOP 10",
      emoji: "🏆",
      color: "#FDE68A",
      bg: "#422006",
    });
  }

  if (normalizedTier === "platinum") {
    awards.push({
      label: "Platinum Verified",
      shortLabel: "PLATINUM",
      emoji: "🥇",
      color: "#E9D5FF",
      bg: "#3B0764",
    });
  } else if (normalizedTier === "gold") {
    awards.push({
      label: "Gold Verified",
      shortLabel: "GOLD",
      emoji: "🥈",
      color: "#FEF3C7",
      bg: "#422006",
    });
  } else if (normalizedTier === "silver") {
    awards.push({
      label: "Silver Verified",
      shortLabel: "SILVER",
      emoji: "🥉",
      color: "#E2E8F0",
      bg: "#334155",
    });
  }

  if (score >= 90) {
    awards.push({
      label: "Elite Trust",
      shortLabel: "ELITE",
      emoji: "⭐",
      color: "#A7F3D0",
      bg: "#064E3B",
    });
  } else if (score >= 75) {
    awards.push({
      label: "Strong Trust",
      shortLabel: "STRONG",
      emoji: "✅",
      color: "#BAE6FD",
      bg: "#164E63",
    });
  }

  return awards.slice(0, 3);
}

async function getLeaderboardRank(baseUrl: string, slug: string) {
  try {
    const res = await fetch(`${baseUrl}/api/transparency/leaderboard`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (!data?.ok || !Array.isArray(data.projects)) return null;

    const row = data.projects.find(
      (project: any) =>
        String(project?.slug || "").toLowerCase() === String(slug).toLowerCase()
    );

    return typeof row?.rank === "number" ? row.rank : null;
  } catch {
    return null;
  }
}

function renderAwardPill(award: Award, x: number, y: number) {
  return `
  <rect
    x="${x}"
    y="${y}"
    width="150"
    height="34"
    rx="17"
    fill="${award.bg}"
    stroke="${award.color}"
    opacity="0.96"
  />

  <text
    x="${x + 75}"
    y="${y + 22}"
    text-anchor="middle"
    fill="${award.color}"
    font-size="12"
    font-weight="900"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(`${award.emoji} ${award.shortLabel}`)}
  </text>
`.trim();
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.web3mb.com";

    const trustRes = await fetch(`${baseUrl}/api/trust-score/${slug}`, {
      cache: "no-store",
    });

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
    const verification = trustData.verification || {};

    const score = normalizeScore(Number(trust.score || trustData.score || 0));
    const theme = gradeColor(score);

    const verifiedWallets = Number(
      verification.verifiedWallets ??
        metrics.verifiedWallets ??
        metrics.ownerVerifiedWallets ??
        0
    );

    const totalWallets = Number(
      verification.totalWallets ?? metrics.disclosedWallets ?? 0
    );

    const verificationRate = Number(
      verification.verificationRate ??
        metrics.verificationRate ??
        (totalWallets > 0 ? (verifiedWallets / totalWallets) * 100 : 0)
    );

    const tier = String(
      verification.tier || metrics.verificationTier || "Unverified"
    );

    const verificationLabel = String(
      verification.label || "Wallet owner verification coverage"
    );

    const trustBonus = Number(verification.scoreBonus || 0);

    const tierTheme = tierColor(tier);

    const mismatchCount = Number(metrics.mismatchWallets || 0);
    const lowSolCount = Number(metrics.lowSolWallets || 0);

    const generatedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const transparencyUrl = `${baseUrl}/token/${slug}`;

    const progressWidth = Math.max(0, Math.min(240, (verificationRate / 100) * 240));

    const leaderboardRank = await getLeaderboardRank(baseUrl, slug);
    const awards = buildAwards({
      score,
      tier,
      rank: leaderboardRank,
      verifiedWallets,
    });

    const awardSvg = awards.length
      ? awards
          .map((award, index) => renderAwardPill(award, 225 + index * 162, 250))
          .join("\n\n")
      : `
  <rect
    x="225"
    y="250"
    width="170"
    height="34"
    rx="17"
    fill="#1E293B"
    stroke="#334155"
  />

  <text
    x="310"
    y="272"
    text-anchor="middle"
    fill="#CBD5E1"
    font-size="12"
    font-weight="900"
    font-family="Arial, Helvetica, sans-serif"
  >
    TRANSPARENCY ACTIVE
  </text>
`.trim();

    const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="960"
  height="330"
  viewBox="0 0 960 330"
  fill="none"
>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="960" y2="330">
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
    width="960"
    height="330"
    rx="36"
    fill="url(#bg)"
  />

  <rect
    x="10"
    y="10"
    width="940"
    height="310"
    rx="30"
    fill="#0B1120"
    stroke="#1E293B"
  />

  <circle
    cx="122"
    cy="146"
    r="76"
    fill="${theme.secondary}"
  />

  <circle
    cx="122"
    cy="146"
    r="62"
    fill="url(#score)"
    filter="url(#glow)"
  />

  <text
    x="122"
    y="162"
    text-anchor="middle"
    fill="white"
    font-size="46"
    font-weight="800"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${score}
  </text>

  <text
    x="122"
    y="197"
    text-anchor="middle"
    fill="#CBD5E1"
    font-size="12"
    font-weight="700"
    font-family="Arial, Helvetica, sans-serif"
  >
    TRUST SCORE
  </text>

  <text
    x="225"
    y="68"
    fill="#F8FAFC"
    font-size="34"
    font-weight="800"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(project.name || slug)}
  </text>

  <text
    x="225"
    y="105"
    fill="${theme.glow}"
    font-size="21"
    font-weight="800"
    font-family="Arial, Helvetica, sans-serif"
  >
    WEB3MB VERIFIED TRANSPARENCY
  </text>

  <text
    x="225"
    y="137"
    fill="#CBD5E1"
    font-size="17"
    font-family="Arial, Helvetica, sans-serif"
  >
    Grade ${escapeXml(trust.grade || trustData.grade || "N/A")} • ${escapeXml(
      trust.status || trustData.status || "Unknown"
    )}
  </text>

  <rect
    x="225"
    y="160"
    width="270"
    height="54"
    rx="16"
    fill="#020617"
    stroke="#1E293B"
  />

  <text
    x="245"
    y="184"
    fill="#94A3B8"
    font-size="13"
    font-weight="700"
    font-family="Arial, Helvetica, sans-serif"
  >
    VERIFICATION TIER
  </text>

  <text
    x="245"
    y="203"
    fill="${tierTheme.primary}"
    font-size="20"
    font-weight="900"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(tierTheme.label)}
  </text>

  <rect
    x="515"
    y="160"
    width="270"
    height="54"
    rx="16"
    fill="#020617"
    stroke="#1E293B"
  />

  <text
    x="535"
    y="184"
    fill="#94A3B8"
    font-size="13"
    font-weight="700"
    font-family="Arial, Helvetica, sans-serif"
  >
    VERIFIED WALLETS
  </text>

  <text
    x="535"
    y="203"
    fill="#E2E8F0"
    font-size="20"
    font-weight="900"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${verifiedWallets}/${totalWallets} • ${percentText(verificationRate)}
  </text>

  <rect
    x="225"
    y="230"
    width="240"
    height="10"
    rx="5"
    fill="#1E293B"
  />

  <rect
    x="225"
    y="230"
    width="${progressWidth}"
    height="10"
    rx="5"
    fill="${tierTheme.primary}"
  />

  <text
    x="225"
    y="246"
    fill="#94A3B8"
    font-size="13"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(verificationLabel)} • Trust Bonus +${trustBonus}
  </text>

  ${awardSvg}

  <rect
    x="805"
    y="48"
    width="110"
    height="46"
    rx="14"
    fill="${theme.secondary}"
    stroke="${theme.primary}"
  />

  <text
    x="860"
    y="77"
    text-anchor="middle"
    fill="${theme.glow}"
    font-size="16"
    font-weight="900"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${theme.label}
  </text>

  <rect
    x="805"
    y="110"
    width="110"
    height="46"
    rx="14"
    fill="${tierTheme.secondary}"
    stroke="${tierTheme.primary}"
  />

  <text
    x="860"
    y="139"
    text-anchor="middle"
    fill="${tierTheme.primary}"
    font-size="16"
    font-weight="900"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(tierTheme.label)}
  </text>

  <text
    x="805"
    y="194"
    fill="#E2E8F0"
    font-size="13"
    font-family="Arial, Helvetica, sans-serif"
  >
    Mismatches: ${mismatchCount}
  </text>

  <text
    x="805"
    y="217"
    fill="#E2E8F0"
    font-size="13"
    font-family="Arial, Helvetica, sans-serif"
  >
    Low SOL: ${lowSolCount}
  </text>

  <text
    x="805"
    y="247"
    fill="#94A3B8"
    font-size="12"
    font-family="Arial, Helvetica, sans-serif"
  >
    Generated ${generatedDate}
  </text>

  <text
    x="225"
    y="310"
    fill="#64748B"
    font-size="11"
    font-family="Arial, Helvetica, sans-serif"
  >
    ${escapeXml(transparencyUrl)}
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
