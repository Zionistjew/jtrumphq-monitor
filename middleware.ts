import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/admin", "/admin/create-project"];
const LOGIN_PATH = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const isLoginPage = pathname === LOGIN_PATH;
  const adminSession = request.cookies.get("admin_session")?.value;

  if (isProtected && adminSession !== "authenticated") {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && adminSession === "authenticated") {
    return NextResponse.redirect(new URL("/admin/create-project", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
