import { NextRequest, NextResponse } from "next/server";
import {
  editorCookieMaxAge,
  getEditorCredentials,
  signEditorSession,
  EDITOR_COOKIE,
} from "@/lib/server/editorSession";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || body.user || "").trim();
    const password = String(body.password || body.pass || "");

    const creds = getEditorCredentials();
    if (
      email.toLowerCase() !== creds.email.toLowerCase() ||
      password !== creds.password
    ) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signEditorSession(creds.email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(EDITOR_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: editorCookieMaxAge(),
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
