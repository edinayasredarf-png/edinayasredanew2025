import { NextRequest, NextResponse } from "next/server";
import {
  authCookieOptions,
  signUserSession,
  USER_AUTH_COOKIE,
} from "@/lib/server/userSession";
import { dbLoginUser, sanitizeProfile } from "@/lib/server/timewebAuthDb";

function jsonErr(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  const st =
    typeof e === "object" &&
    e !== null &&
    "status" in e &&
    typeof (e as { status: number }).status === "number"
      ? (e as { status: number }).status
      : 500;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");

    const row = await dbLoginUser(email, password);
    const token = signUserSession(row.id, row.email);
    const res = NextResponse.json({
      user: { id: row.id, email: row.email },
      profile: sanitizeProfile(row),
    });
    res.cookies.set(USER_AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (e) {
    return jsonErr(e);
  }
}
