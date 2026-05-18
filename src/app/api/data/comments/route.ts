import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";
import {
  requireUser,
  requireAdminAccess,
} from "@/lib/server/authFromBearer";

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

function mapCommentRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    post_id: r.post_id,
    post_type: r.post_type,
    parent_id: r.parent_id,
    author_id: r.author_id,
    author_name: (r.author_full_name as string) || "Аноним",
    author_avatar: r.author_avatar_url as string | undefined,
    content: r.content,
    created_at: r.created_at,
    updated_at: r.updated_at,
    replies_count: (r.replies_count as number) ?? 0,
    is_deleted: r.is_deleted,
  };
}

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get("all");
    if (all === "1") {
      await requireAdminAccess(request);
      const rows = await db.dbListAllComments();
      return NextResponse.json(rows.map((r) => mapCommentRow(r as Record<string, unknown>)));
    }
    const postId = request.nextUrl.searchParams.get("postId");
    const postType = request.nextUrl.searchParams.get("postType");
    if (!postId || !postType || (postType !== "post" && postType !== "news")) {
      return NextResponse.json(
        { error: "postId and postType (post|news) required" },
        { status: 400 }
      );
    }
    const rows = await db.dbListComments(postId, postType);
    return NextResponse.json(rows.map((r) => mapCommentRow(r as Record<string, unknown>)));
  } catch (e) {
    return jsonErr(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await db.dbEnsureUserProfile(user);
    const body = await request.json();
    const { postId, postType, content, parentId } = body;
    if (!postId || !postType || !content) {
      return NextResponse.json(
        { error: "postId, postType, content required" },
        { status: 400 }
      );
    }
    const row = await db.dbInsertComment(
      postId,
      postType,
      user.id,
      String(content),
      parentId ?? null
    );
    const prof = await db.dbGetUserProfile(user.id);
    return NextResponse.json(
      mapCommentRow({
        ...row,
        author_full_name: prof?.full_name,
        author_avatar_url: prof?.avatar_url,
      } as Record<string, unknown>)
    );
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const id = body?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const ok = await db.dbSoftDeleteComment(id, user.id);
    if (!ok) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
