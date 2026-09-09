import "server-only";

/*
 * Клиент к отдельному микросервису конвертации DOCX → PDF (pdf-service,
 * LibreOffice). Настройка через env: KP_PDF_SERVICE_URL + KP_PDF_SERVICE_TOKEN.
 * Пока не настроен — isPdfConfigured() = false, сайт отдаёт только DOCX.
 */

export function isPdfConfigured(): boolean {
  return Boolean(process.env.KP_PDF_SERVICE_URL?.trim());
}

export class PdfNotConfiguredError extends Error {
  constructor() {
    super(
      "PDF-сервис не настроен. Задайте KP_PDF_SERVICE_URL (и KP_PDF_SERVICE_TOKEN) и разверните контейнер pdf-service."
    );
    this.name = "PdfNotConfiguredError";
  }
}

/** Конвертирует .docx-буфер в .pdf-буфер через внешний сервис. */
export async function convertDocxToPdf(docx: Buffer): Promise<Buffer> {
  const base = process.env.KP_PDF_SERVICE_URL?.trim();
  if (!base) throw new PdfNotConfiguredError();
  const token = process.env.KP_PDF_SERVICE_TOKEN?.trim();

  const url = `${base.replace(/\/$/, "")}/v1/convert`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: new Uint8Array(docx),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PDF-сервис вернул ${res.status}: ${text.slice(0, 300)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error("PDF-сервис вернул пустой ответ");
    return buf;
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      throw new Error("PDF-сервис не ответил вовремя (таймаут)");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
