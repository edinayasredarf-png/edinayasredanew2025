import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";
import { requireUser } from "@/lib/server/authFromBearer";

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
    const checkPostId = request.nextUrl.searchParams.get("checkPostId");
    const checkPostType = request.nextUrl.searchParams.get("checkPostType");
    if (checkPostId && checkPostType) {
      const isFav = await db.dbIsFavorite(user.id, checkPostId, checkPostType);
      return NextResponse.json({ isFavorite: isFav });
    }
    const rows = await db.dbListFavorites(user.id);
    return NextResponse.json(rows);
  } catch (e) {
    return jsonErr(e, 401);
  }
}

/** POST { postId, postType } — переключить избранное, ответ { isFavorite: boolean } */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await db.dbEnsureUserProfile(user);
    const body = await request.json();
    const { postId, postType } = body;
    if (!postId || !postType) {
      return NextResponse.json(
        { error: "postId, postType required" },
        { status: 400 }
      );
    }
    const isFav = await db.dbIsFavorite(user.id, postId, postType);
    if (isFav) {
      await db.dbRemoveFavorite(user.id, postId, postType);
      return NextResponse.json({ isFavorite: false });
    }
    await db.dbAddFavorite(user.id, postId, postType);
    return NextResponse.json({ isFavorite: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
