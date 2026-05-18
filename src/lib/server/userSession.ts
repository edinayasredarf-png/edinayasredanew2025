import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const USER_AUTH_COOKIE = "es_auth_session";
const MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 дней

export type UserSessionPayload = {
  userId: string;
  email: string;
  exp: number;
};

function sessionSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.EDITOR_SESSION_SECRET?.trim() ||
    "dev-es-auth-change-in-production"
  );
}

export function signUserSession(userId: string, email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(
    JSON.stringify({ userId, email, exp } satisfies UserSessionPayload)
  ).toString("base64url");
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUserSession(token: string): UserSessionPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as UserSessionPayload;
    if (!data.userId || !data.email || typeof data.exp !== "number") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function userAuthCookieMaxAge(): number {
  return MAX_AGE_SEC;
}

export function getUserSessionFromRequest(
  request: Request
): UserSessionPayload | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${USER_AUTH_COOKIE}=`)) continue;
    const raw = part.slice(USER_AUTH_COOKIE.length + 1);
    try {
      const token = decodeURIComponent(raw);
      return verifyUserSession(token);
    } catch {
      return null;
    }
  }
  return null;
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: userAuthCookieMaxAge(),
  };
}
