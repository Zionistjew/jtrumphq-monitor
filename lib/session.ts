import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "jtrumphq_session";
const SECRET = process.env.APP_SESSION_SECRET || "change-me";

type SessionPayload = {
  userId: string;
  walletAddress: string;
  role: "admin" | "user";
  exp: number;
};

function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(value: string) {
  return base64url(
    crypto.createHmac("sha256", SECRET).update(value).digest()
  );
}

export function createSessionToken(payload: SessionPayload) {
  const encoded = base64url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8")
    ) as SessionPayload;

    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: {
  userId: string;
  walletAddress: string;
  role: "admin" | "user";
}) {
  const cookieStore = await cookies();
  const token = createSessionToken({
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  });

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
