import { NextRequest, NextResponse } from "next/server";

const PRIMARY_DOMAIN = "app.web3mb.com";

const VERCEL_DOMAINS = [
  "web3mb-transparency-center.vercel.app",
];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  // Force production domain
  if (!isLocalhost && VERCEL_DOMAINS.includes(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRIMARY_DOMAIN;
    return NextResponse.redirect(url, 308);
  }

  // Redirect root homepage
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL("/app", req.url)
    );
  }

  // Redirect legacy dashboard
  if (pathname === "/dashboard") {
    return NextResponse.redirect(
      new URL("/app", req.url)
    );
  }

  // Protect legacy admin create-project route
  if (pathname === "/admin/create-project") {
    return NextResponse.redirect(
      new URL("/admin/login", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
