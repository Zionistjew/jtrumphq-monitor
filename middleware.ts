import { NextRequest, NextResponse } from "next/server";

const PRIMARY_DOMAIN = "app.web3mb.com";

const VERCEL_DOMAINS = [
  "web3mb-transparency-center.vercel.app",
];

// ONLY lock actual project creation
const protectedRoutes = [
  "/app/projects/new",
];

// Billing must always stay public
const publicAppRoutes = [
  "/app/billing",
];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("0.0.0.0");

  // Force custom production domain
  if (!isLocalhost && VERCEL_DOMAINS.includes(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRIMARY_DOMAIN;
    return NextResponse.redirect(url, 308);
  }

  // Redirect old root
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL("/app", req.url)
    );
  }

  // Redirect old dashboard route
  if (pathname === "/dashboard") {
    return NextResponse.redirect(
      new URL("/app", req.url)
    );
  }

  // Redirect old admin route
  if (pathname === "/admin/create-project") {
    return NextResponse.redirect(
      new URL("/admin/login", req.url)
    );
  }

  // Billing always accessible
  if (
    publicAppRoutes.some((route) =>
      pathname.startsWith(route)
    )
  ) {
    return NextResponse.next();
  }

  // Only protect project creation
  const requiresProtection = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (requiresProtection) {
    const subscriptionStatus =
      req.cookies.get("subscription_status")?.value;

    const subscriptionEndsAt =
      req.cookies.get("subscription_ends_at")?.value;

    if (!subscriptionStatus) {
      return NextResponse.redirect(
        new URL("/app/billing", req.url)
      );
    }

    if (subscriptionStatus !== "active") {
      return NextResponse.redirect(
        new URL("/app/billing?expired=true", req.url)
      );
    }

    if (subscriptionEndsAt) {
      const expirationDate = new Date(subscriptionEndsAt);
      const now = new Date();

      if (now > expirationDate) {
        const response = NextResponse.redirect(
          new URL("/app/billing?expired=true", req.url)
        );

        response.cookies.delete("subscription_status");
        response.cookies.delete("subscription_plan");
        response.cookies.delete("subscription_ends_at");

        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
