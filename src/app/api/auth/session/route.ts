import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/server/authFromBearer";
import { dbGetUserById, sanitizeProfile } from "@/lib/server/timewebAuthDb";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ user: null, profile: null });
    }
    const row = await dbGetUserById(user.id);
    if (!row) {
      return NextResponse.json({ user: null, profile: null });
    }
    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile: sanitizeProfile(row),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
