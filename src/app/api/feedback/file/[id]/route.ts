import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetFeedbackFile } from "@/lib/server/citizenFeedbackDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Отдаёт прикреплённый файл. По умолчанию inline (просмотр), ?download=1 — скачивание.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const st = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status: st });
  }

  const { id } = await params;
  const file = await dbGetFeedbackFile(id);
  if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const safeName = (file.filename || "file").replace(/["\\\r\n]/g, "_");
  const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.filename || "file")}; filename="${safeName}"`;

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime || "application/octet-stream",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    },
  });
}
