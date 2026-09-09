import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getReview, upsertReview } from "@/lib/server/aiSales/reviewsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clampNum = (v: unknown, min: number, max: number): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};

/** Эталонная оценка текущего пользователя по звонку. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  const review = await getReview(id, user.id);
  return NextResponse.json({ review });
}

/** Создать/обновить эталонную оценку звонка (контроль качества). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      dealScore?: unknown; managerScore?: unknown; note?: unknown;
    };
    await upsertReview({
      callId: id,
      reviewerId: user.id,
      reviewerEmail: user.email ?? null,
      dealScore: clampNum(body.dealScore, 0, 100),
      managerScore: clampNum(body.managerScore, 0, 10),
      note: typeof body.note === "string" ? body.note.slice(0, 2000) : null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка сохранения оценки";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
