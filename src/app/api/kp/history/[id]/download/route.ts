import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetHistoryPayload } from "@/lib/server/kp/kpDb";
import { buildKpDocuments, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function cd(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

/** Перегенерирует .docx из сохранённой формы (история). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const { id } = await params;
  const payload = (await dbGetHistoryPayload(Number(id))) as KpGenerateRequest | null;
  if (!payload?.form) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  const { docs } = await buildKpDocuments(payload);
  if (docs.length === 0) {
    return NextResponse.json(
      { error: "Не удалось перегенерировать (возможно, удалён шаблон)" },
      { status: 422 }
    );
  }
  const d = docs[0];
  return new NextResponse(new Uint8Array(d.docx), {
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": cd(`${d.filename}.docx`),
    },
  });
}
