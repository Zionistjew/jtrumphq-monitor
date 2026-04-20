import { NextResponse } from "next/server";

type Project = {
  slug: string;
  name: string;
  mint?: string;
  wallets?: Array<{
    label: string;
    address: string;
    category?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params?.slug;

    if (!slug) {
      return new NextResponse("Missing slug", { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.web3mb.com";

    const res = await fetch(`${baseUrl}/api/projects`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse("Failed to load projects", { status: 500 });
    }

    const data = await res.json();

    const projects: Project[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.projects)
      ? data.projects
      : [];

    const project = projects.find((p) => p.slug === slug);

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const wallets = project.wallets || [];
    const verified = Boolean(project.mint) && wallets.length > 0;
    const date = new Date().toLocaleDateString("en-US");

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" viewBox="0 0 640 160" fill="none">
  <rect width="640" height="160" rx="24" fill="#09090B"/>
  <rect x="12" y="12" width="616" height="136" rx="18" fill="#111827" stroke="#27272A"/>

  <circle cx="66" cy="80" r="26" fill="#083344"/>
  <path d="M54 80.5L62 88.5L79 71.5" stroke="#22D3EE" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>

  <text x="112" y="62" fill="#F4F4F5" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">
    ${escapeXml(project.name)}
  </text>

  <text x="112" y="94" fill="#67E8F9" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600">
    ${verified ? "Verified by Project" : "Transparency Profile"}
  </text>

  <text x="112" y="122" fill="#A1A1AA" font-family="Arial, Helvetica, sans-serif" font-size="16">
    ${verified ? "Verified by Project • " : ""}${wallets.length} wallets disclosed • ${date}
  </text>
</svg>`.trim();

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Trust seal route error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
