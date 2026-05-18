import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const EDITOR_COOKIE = "es_editor_session";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export function getEditorCredentials(): { email: string; password: string } {
  return {
    email: (process.env.EDITOR_EMAIL || "proeco09@yandex.ru").trim(),
    password: (process.env.EDITOR_PASSWORD || "ecostroy2013").trim(),
  };
}

function sessionSecret(): string {
  const s = process.env.EDITOR_SESSION_SECRET?.trim();
  if (s) return s;
  return "dev-es-editor-change-in-production";
}

export function signEditorSession(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString(
    "base64url"
  );
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyEditorSession(
  token: string
): { email: string } | null {
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
    ) as { email?: string; exp?: number };
    if (!data.email || typeof data.exp !== "number") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export function editorCookieMaxAge(): number {
  return MAX_AGE_SEC;
}

export function getEditorFromRequest(request: Request): { email: string } | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${EDITOR_COOKIE}=`)) continue;
    const raw = part.slice(EDITOR_COOKIE.length + 1);
    try {
      const token = decodeURIComponent(raw);
      return verifyEditorSession(token);
    } catch {
      return null;
    }
  }
  return null;
}

export function isAllowedEditorEmail(email: string): boolean {
  const { email: allowed } = getEditorCredentials();
  return email.toLowerCase() === allowed.toLowerCase();
}
