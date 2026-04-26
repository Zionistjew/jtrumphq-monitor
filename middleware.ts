import { NextRequest, NextResponse } from "next/server";

const PRIMARY_DOMAIN = "app.web3mb.com";

const VERCEL_DOMAINS = [
  "web3mb-transparency-center.vercel.app",
];

const protectedRoutes = [
  "/app",
  "/app/projects",
  "/app/projects/new",
  "/app/alerts",
  "/app/verify-wallets",
];

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  // Force custom production domain
  if (!isLocalhost && VERCEL_DOMAINS.includes(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRIMARY_DOMAIN;
    return NextResponse.redirect(url, 308);
  }

  // Redirect legacy root
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL("/app", req.url)
    );
  }

  // Redirect old dashboard
  if (pathname === "/dashboard") {
    return NextResponse.redirect(
      new URL("/app", req.url)
    );
  }

  // Protect old admin create project route
  if (pathname === "/admin/create-project") {
    return NextResponse.redirect(
      new URL("/admin/login", req.url)
    );
  }

  // Protected app routes
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
