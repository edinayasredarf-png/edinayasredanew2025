import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getEditorFromRequest } from "@/lib/server/editorSession";
import { buildKpDocuments, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";
import { dbInsertHistory } from "@/lib/server/kp/kpDb";
import { convertDocxToPdf, isPdfConfigured } from "@/lib/server/kp/kpPdf";
import { uploadKpToDeal } from "@/lib/server/kp/kpBitrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type KpFormat = "docx" | "pdf" | "both";

function cd(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let body: KpGenerateRequest & { format?: KpFormat; bitrix?: { dealId?: string; upload?: boolean } };
  try {
    body = (await request.json()) as KpGenerateRequest & {
      format?: KpFormat;
      bitrix?: { dealId?: string; upload?: boolean };
    };
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!body?.form || !Array.isArray(body.orgKeys) || body.orgKeys.length === 0) {
    return NextResponse.json(
      { error: "Выберите хотя бы одну организацию и заполните форму" },
      { status: 400 }
    );
  }

  const format: KpFormat = body.format === "pdf" || body.format === "both" ? body.format : "docx";
  const wantPdf = format === "pdf" || format === "both";
  if (wantPdf && !isPdfConfigured()) {
    return NextResponse.json(
      {
        error:
          "PDF-сервис не настроен. Разверните контейнер pdf-service и задайте KP_PDF_SERVICE_URL. Пока доступен только DOCX.",
      },
      { status: 501 }
    );
  }

  const { docs, errors } = await buildKpDocuments(body);
  if (docs.length === 0) {
    return NextResponse.json(
      { error: errors[0]?.message || "Не удалось сгенерировать ни одного КП", errors },
      { status: 422 }
    );
  }

  // Конвертация в PDF (если запрошена) — параллельно, сервис изолирует профили.
  let pdfs: (Buffer | null)[] = [];
  if (wantPdf) {
    try {
      pdfs = await Promise.all(docs.map((d) => convertDocxToPdf(d.docx)));
    } catch (e) {
      return NextResponse.json(
        { error: `Ошибка конвертации в PDF: ${(e as Error).message}` },
        { status: 502 }
      );
    }
  }

  // Журнал истории (по записи на организацию).
  const editor = getEditorFromRequest(request);
  const createdBy = editor?.email || "admin";
  await Promise.all(
    docs.map((d) =>
      dbInsertHistory({
        title: body.form.client.orgShort || body.form.client.orgFull,
        clientOrg: body.form.client.orgFull,
        serviceType: body.form.serviceType,
        orgKey: d.orgKey,
        orgName: d.orgName,
        format,
        totalCost: d.totalCost,
        createdBy,
        payload: { ...body, orgKeys: [d.orgKey] },
      }).catch(() => 0)
    )
  );

  // Загрузка КП в сделку Bitrix24 (если попросили и указана сделка).
  let bitrixStatus = "";
  if (body.bitrix?.upload && body.bitrix.dealId) {
    const kpFiles: Array<{ filename: string; buffer: Buffer }> = [];
    docs.forEach((d, i) => {
      if (format !== "pdf") kpFiles.push({ filename: `${d.filename}.docx`, buffer: d.docx });
      if (wantPdf && pdfs[i]) kpFiles.push({ filename: `${d.filename}.pdf`, buffer: pdfs[i] as Buffer });
    });
    try {
      await uploadKpToDeal(String(body.bitrix.dealId), kpFiles);
      bitrixStatus = `ok:${kpFiles.length}`;
    } catch (e) {
      bitrixStatus = `error:${(e as Error).message}`;
    }
  }

  const errHeader: Record<string, string> = { "X-Kp-Errors": encodeURIComponent(JSON.stringify(errors)) };
  if (bitrixStatus) errHeader["X-Kp-Bitrix"] = encodeURIComponent(bitrixStatus);

  // Один документ, один формат → отдаём файл напрямую.
  if (docs.length === 1 && format !== "both") {
    const d = docs[0];
    if (format === "pdf") {
      return new NextResponse(new Uint8Array(pdfs[0] as Buffer), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": cd(`${d.filename}.pdf`), ...errHeader },
      });
    }
    return new NextResponse(new Uint8Array(d.docx), {
      headers: { "Content-Type": DOCX_MIME, "Content-Disposition": cd(`${d.filename}.docx`), ...errHeader },
    });
  }

  // Иначе — ZIP (несколько организаций и/или оба формата).
  const zip = new JSZip();
  const used = new Set<string>();
  const uniq = (name: string) => {
    let n = name;
    let i = 2;
    while (used.has(n)) {
      n = name.replace(/(\.\w+)$/, ` (${i})$1`);
      i++;
    }
    used.add(n);
    return n;
  };
  docs.forEach((d, i) => {
    if (format !== "pdf") zip.file(uniq(`${d.filename}.docx`), d.docx);
    if (wantPdf && pdfs[i]) zip.file(uniq(`${d.filename}.pdf`), pdfs[i] as Buffer);
  });
  const zipBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const clientName = body.form.client.orgShort || body.form.client.orgFull || "КП";
  return new NextResponse(new Uint8Array(zipBuf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": cd(`КП ${clientName} (${docs.length}).zip`),
      ...errHeader,
    },
  });
}
