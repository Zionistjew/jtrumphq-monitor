import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function clearAdminSession() {
  cookies().set("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function POST() {
  clearAdminSession();

  return NextResponse.json({
    ok: true,
    message: "Admin logged out.",
  });
}

export async function GET() {
  clearAdminSession();

  return NextResponse.redirect(
    new URL("/admin/login", "https://app.web3mb.com")
  );
}
