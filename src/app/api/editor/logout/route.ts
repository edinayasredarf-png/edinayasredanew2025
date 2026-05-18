import { NextResponse } from "next/server";
import { EDITOR_COOKIE } from "@/lib/server/editorSession";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EDITOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
