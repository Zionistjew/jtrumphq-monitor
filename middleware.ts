import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const adminSession = request.cookies.get("admin_session")?.value;

  const isAdminRoute =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isAdminRoute && !adminSession) {
    const loginUrl = new URL("/admin/login", request.url);

    const originalDestination = `${pathname}${search || ""}`;
    loginUrl.searchParams.set("next", originalDestination);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
