import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body?.password;

    if (!password) {
      return Response.json(
        { ok: false, error: "Password is required." },
        { status: 400 }
      );
    }

    if (!process.env.ADMIN_PASSWORD) {
      return Response.json(
        { ok: false, error: "ADMIN_PASSWORD is not configured." },
        { status: 500 }
      );
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json(
        { ok: false, error: "Invalid password." },
        { status: 401 }
      );
    }

    cookies().set("admin_session", "authenticated", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json(
      { ok: false, error: error?.message || "Login failed." },
      { status: 500 }
    );
  }
}
