import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = request.cookies.get("admin_session")?.value;
  const isLoginPage = pathname === LOGIN_PATH;

  const isProtected =
    pathname === "/admin" ||
    pathname === "/admin/create-project" ||
    pathname.startsWith("/admin/create-project/");

  if (isLoginPage) {
    if (adminSession === "authenticated") {
      return NextResponse.redirect(new URL("/admin/create-project", request.url));
    }
    return NextResponse.next();
  }

  if (isProtected && adminSession !== "authenticated") {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
