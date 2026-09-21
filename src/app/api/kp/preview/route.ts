import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { buildKpDocuments, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";
import { convertDocxToPdf, isPdfConfigured } from "@/lib/server/kp/kpPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Полный предпросмотр: строит DOCX и отдаёт точный PDF (если настроен pdf-service),
 *  иначе — черновой HTML (mammoth), по каждой компании. */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let body: KpGenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body?.form || !Array.isArray(body.orgKeys) || body.orgKeys.length === 0) {
    return NextResponse.json({ error: "Выберите организации и заполните форму" }, { status: 400 });
  }

  // Предпросмотр не должен присваивать номера/писать в реестр.
  const { docs, errors } = await buildKpDocuments({ ...body, recordRegistry: false });
  if (docs.length === 0) {
    return NextResponse.json({ error: errors[0]?.message || "Не удалось собрать документ", errors }, { status: 422 });
  }

  const pdfOn = isPdfConfigured();
  const previews: Array<{ orgName: string; pdf?: string; html?: string }> = [];
  for (const d of docs) {
    // Точный вид документа: DOCX → PDF через LibreOffice-сервис.
    if (pdfOn) {
      try {
        const pdf = await convertDocxToPdf(d.docx);
        previews.push({ orgName: d.shortName, pdf: pdf.toString("base64") });
        continue;
      } catch {
        // pdf-сервис недоступен/упал — падаем на HTML-фолбэк ниже.
      }
    }
    try {
      const res = await mammoth.convertToHtml({ buffer: d.docx });
      previews.push({ orgName: d.shortName, html: res.value });
    } catch (e) {
      previews.push({ orgName: d.shortName, html: `<p style="color:#b91c1c">Не удалось отрендерить: ${(e as Error).message}</p>` });
    }
  }
  return NextResponse.json({ previews, errors });
}
