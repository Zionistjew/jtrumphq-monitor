import { NextRequest, NextResponse } from "next/server";

const PRIMARY_DOMAIN = "app.web3mb.com";
const VERCEL_DOMAINS = ["web3mb-transparency-center.vercel.app"];
const SESSION_COOKIE = "jtrumphq_session";

function isProtectedAppRoute(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

function isPublicRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/token/") ||
    pathname.startsWith("/transparency") ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/refunds")
  );
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("0.0.0.0");

  if (!isLocalhost && VERCEL_DOMAINS.includes(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRIMARY_DOMAIN;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = Boolean(sessionCookie);

  if (isProtectedAppRoute(pathname) && !hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (pathname === "/admin/create-project") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|embed.js|api/auth|api/debug/session|api/trust-score|api/trust-seal|api/embed|api/token|api/transparency|api/projects).*)",
  ],
};
