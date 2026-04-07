import { cookies } from "next/headers";

export async function POST() {
  cookies().set("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
