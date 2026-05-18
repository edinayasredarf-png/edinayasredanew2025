import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";
import { requireUser } from "@/lib/server/authFromBearer";
import { sanitizeProfile } from "@/lib/server/timewebAuthDb";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st =
    typeof e === "object" &&
    e !== null &&
    "status" in e &&
    typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status
      : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    let row = await db.dbGetUserProfile(user.id);
    if (!row) {
      row = await db.dbEnsureUserProfile({
        id: user.id,
        email: user.email,
      });
    }
    return NextResponse.json(sanitizeProfile(row as Record<string, unknown>));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await db.dbEnsureUserProfile({ id: user.id, email: user.email });
    const row = await db.dbGetUserProfile(user.id);
    return NextResponse.json(sanitizeProfile(row as Record<string, unknown>));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    let cur = (await db.dbGetUserProfile(user.id)) as Record<string, unknown> | null;
    if (!cur) {
      await db.dbEnsureUserProfile({ id: user.id, email: user.email });
      cur = (await db.dbGetUserProfile(user.id)) as Record<string, unknown> | null;
    }
    if (!cur) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    await db.dbUpsertUserProfile({
      ...cur,
      ...body,
      id: user.id,
      email: user.email || cur.email,
    });
    const next = await db.dbGetUserProfile(user.id);
    return NextResponse.json(sanitizeProfile(next as Record<string, unknown>));
  } catch (e) {
    return jsonErr(e, 401);
  }
}
