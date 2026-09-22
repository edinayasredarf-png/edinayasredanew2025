import "server-only";

/*
 * OCR через Yandex Vision (та же Yandex Cloud, что STT/GPT/S3).
 * ENV:
 *   YANDEX_VISION_API_KEY (или YANDEX_GPT_API_KEY / YANDEX_STT_API_KEY) — Api-Key сервисного
 *                          аккаунта с ролью ai.vision.user
 *   YANDEX_FOLDER_ID       — каталог
 *
 * Изображения — синхронно (recognizeText); PDF (многостраничный) — асинхронно
 * (recognizeTextAsync → опрос операции → getRecognition, по странице на строку).
 */

const OCR_SYNC = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText";
const OCR_ASYNC = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeTextAsync";
const OCR_GET = "https://ocr.api.cloud.yandex.net/ocr/v1/getRecognition";
const OP_URL = "https://operation.api.cloud.yandex.net/operations/";

function creds() {
  const apiKey =
    process.env.YANDEX_VISION_API_KEY?.trim() ||
    process.env.YANDEX_GPT_API_KEY?.trim() ||
    process.env.YANDEX_STT_API_KEY?.trim();
  const folderId = process.env.YANDEX_FOLDER_ID?.trim() || process.env.YANDEX_GPT_FOLDER_ID?.trim();
  if (!apiKey || !folderId) {
    throw new Error("OCR не настроен: задайте YANDEX_VISION_API_KEY и YANDEX_FOLDER_ID");
  }
  return { apiKey, folderId };
}

export function ocrConfigured(): boolean {
  try { creds(); return true; } catch { return false; }
}

function headers(apiKey: string, folderId?: string): Record<string, string> {
  return {
    Authorization: `Api-Key ${apiKey}`,
    "Content-Type": "application/json",
    ...(folderId ? { "x-folder-id": folderId } : {}),
  };
}

/** OCR одностраничного изображения (png/jpeg). */
export async function ocrImage(buffer: Buffer, mime = "image/png"): Promise<string> {
  const { apiKey, folderId } = creds();
  const res = await fetch(OCR_SYNC, {
    method: "POST",
    headers: headers(apiKey, folderId),
    body: JSON.stringify({ mimeType: mime, languageCodes: ["ru", "en"], model: "page", content: buffer.toString("base64") }),
  });
  if (!res.ok) throw new Error(`OCR ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const j = (await res.json()) as { result?: { textAnnotation?: { fullText?: string } } };
  return j.result?.textAnnotation?.fullText || "";
}

/* ─── Структурный OCR (с координатами строк — для сохранения вёрстки) ─── */

interface Vertex { x?: string | number; y?: string | number }
interface TextAnnotation {
  width?: string | number;
  height?: string | number;
  fullText?: string;
  blocks?: Array<{ lines?: Array<{ text?: string; boundingBox?: { vertices?: Vertex[] } }> }>;
}

export interface OcrLine { text: string; x0: number; x1: number; top: number; height: number }
export interface OcrPage { width: number; height: number; lines: OcrLine[] }

const num = (v: string | number | undefined): number => (v == null ? 0 : Number(v) || 0);

/** Общий вызов: submit → опрос → getRecognition. Возвращает textAnnotation по страницам. */
async function recognizePdf(buffer: Buffer, deadlineMs: number): Promise<TextAnnotation[]> {
  const { apiKey, folderId } = creds();
  const start = await fetch(OCR_ASYNC, {
    method: "POST",
    headers: headers(apiKey, folderId),
    body: JSON.stringify({ mimeType: "application/pdf", languageCodes: ["ru", "en"], model: "page", content: buffer.toString("base64") }),
  });
  if (!start.ok) throw new Error(`OCR submit ${start.status}: ${(await start.text().catch(() => "")).slice(0, 300)}`);
  const { id } = (await start.json()) as { id?: string };
  if (!id) throw new Error("OCR: не получен id операции");

  const deadline = Date.now() + deadlineMs;
  let done = false;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const op = await fetch(OP_URL + id, { headers: { Authorization: `Api-Key ${apiKey}` } });
    if (!op.ok) continue;
    const opj = (await op.json()) as { done?: boolean; error?: { message?: string } };
    if (opj.error) throw new Error(`OCR операция: ${opj.error.message || "ошибка"}`);
    if (opj.done) { done = true; break; }
  }
  if (!done) throw new Error("OCR: распознавание не успело за отведённое время (крупный PDF). Разбейте документ на меньшие части.");

  const rec = await fetch(`${OCR_GET}?operationId=${encodeURIComponent(id)}`, { headers: headers(apiKey, folderId) });
  if (!rec.ok) throw new Error(`OCR result ${rec.status}: ${(await rec.text().catch(() => "")).slice(0, 300)}`);
  const raw = await rec.text();

  const anns: TextAnnotation[] = [];
  for (const line of raw.split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      const obj = JSON.parse(s) as { result?: { textAnnotation?: TextAnnotation } };
      if (obj.result?.textAnnotation) anns.push(obj.result.textAnnotation);
    } catch { /* строка не JSON — пропускаем */ }
  }
  return anns;
}

/** OCR PDF → просто текст (для базы знаний). */
export async function ocrPdf(buffer: Buffer, deadlineMs = 50_000): Promise<string> {
  const anns = await recognizePdf(buffer, deadlineMs);
  return anns.map((a) => a.fullText || "").filter(Boolean).join("\n\n");
}

/** OCR PDF → страницы со строками и координатами (для сохранения вёрстки). */
export async function ocrPdfPages(buffer: Buffer, deadlineMs = 50_000): Promise<OcrPage[]> {
  const anns = await recognizePdf(buffer, deadlineMs);
  return anns.map((a) => {
    const lines: OcrLine[] = [];
    for (const b of a.blocks || []) {
      for (const ln of b.lines || []) {
        const vs = ln.boundingBox?.vertices || [];
        if (!ln.text || vs.length === 0) continue;
        const xs = vs.map((v) => num(v.x));
        const ys = vs.map((v) => num(v.y));
        const x0 = Math.min(...xs), x1 = Math.max(...xs);
        const y0 = Math.min(...ys), y1 = Math.max(...ys);
        lines.push({ text: ln.text, x0, x1, top: y0, height: y1 - y0 });
      }
    }
    lines.sort((p, q) => p.top - q.top || p.x0 - q.x0);
    return { width: num(a.width) || 1000, height: num(a.height) || 1400, lines };
  });
}
