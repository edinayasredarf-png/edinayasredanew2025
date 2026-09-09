import "server-only";

import { AiProviderNotConfiguredError } from "@/lib/ai/interfaces";

/**
 * Текстовые эмбеддинги Yandex Foundation Models (те же ключ/каталог, что у
 * YandexGPT/SpeechKit). Модели: text-search-doc (документы) и text-search-query
 * (запрос) — 256-мерные. Для RAG базы знаний (§31 ТЗ).
 */

const EMBED_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/textEmbedding";

function cfg() {
  const apiKey = process.env.YANDEX_GPT_API_KEY?.trim() || process.env.YANDEX_STT_API_KEY?.trim();
  const folderId = process.env.YANDEX_GPT_FOLDER_ID?.trim() || process.env.YANDEX_FOLDER_ID?.trim();
  if (!apiKey || !folderId) {
    throw new AiProviderNotConfiguredError(
      "Эмбеддинги Yandex не настроены: задайте YANDEX_GPT_API_KEY/YANDEX_STT_API_KEY и YANDEX_GPT_FOLDER_ID/YANDEX_FOLDER_ID"
    );
  }
  return { apiKey, folderId };
}

async function embed(text: string, kind: "doc" | "query"): Promise<number[]> {
  const { apiKey, folderId } = cfg();
  const model = kind === "doc" ? "text-search-doc" : "text-search-query";
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${apiKey}`,
      "x-folder-id": folderId,
    },
    body: JSON.stringify({ modelUri: `emb://${folderId}/${model}/latest`, text: text.slice(0, 8000) }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Yandex embedding ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { embedding?: number[] };
  if (!Array.isArray(json.embedding)) throw new Error("Yandex embedding: пустой ответ");
  return json.embedding;
}

/** Эмбеддинг документа (для индексации базы знаний). */
export const embedDocument = (text: string) => embed(text, "doc");
/** Эмбеддинг запроса (для поиска). */
export const embedQuery = (text: string) => embed(text, "query");

/** Косинусная близость двух векторов. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
