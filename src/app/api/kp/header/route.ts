import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetHeaderLayout, dbSetHeaderLayout, type KpHeaderLayout } from "@/lib/server/kp/kpDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(request: NextRequest): Promise<NextResponse | null> {
  try {
    await requireAdminAccess(request);
    return null;
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
}

export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const layout = await dbGetHeaderLayout();
  return NextResponse.json({ layout });
}

export async function PUT(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { layout?: KpHeaderLayout };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.layout) return NextResponse.json({ error: "Нет данных" }, { status: 400 });
  await dbSetHeaderLayout(body.layout);
  return NextResponse.json({ ok: true });
}
