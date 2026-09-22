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

/**
 * OCR PDF (многостраничного) через async API. deadlineMs — общий бюджет
 * (на Vercel Hobby функция ≤60с, поэтому по умолчанию 50с).
 */
export async function ocrPdf(buffer: Buffer, deadlineMs = 50_000): Promise<string> {
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

  const pages: string[] = [];
  for (const line of raw.split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      const obj = JSON.parse(s) as { result?: { textAnnotation?: { fullText?: string } } };
      const t = obj.result?.textAnnotation?.fullText;
      if (t) pages.push(t);
    } catch {
      /* строка не JSON — пропускаем */
    }
  }
  return pages.join("\n\n");
}
