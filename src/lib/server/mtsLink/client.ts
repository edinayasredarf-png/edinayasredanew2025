import "server-only";

/**
 * Клиент API МТС Линк (https://help.mts-link.ru/category/4157).
 * Авторизация — заголовок x-auth-token (ключ из личного кабинета → раздел «API», тарифы PRO/Enterprise/Total).
 *   MTS_LINK_API_KEY   — ключ API (обязателен)
 *   MTS_LINK_API_BASE  — база API (по умолчанию https://userapi.mts-link.ru/v3)
 * Записи встреч: GET /records → POST /records/{id}/conversions (MP4) → GET /records/conversions/{id} (state) →
 * GET /fileSystem/file/{conversionId} (downloadUrl).
 */

const BASE = () => (process.env.MTS_LINK_API_BASE?.trim() || "https://userapi.mts-link.ru/v3").replace(/\/+$/, "");

export function mtsConfigured(): boolean {
  return Boolean(process.env.MTS_LINK_API_KEY?.trim());
}

export class MtsError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function mts<T = unknown>(method: "GET" | "POST", path: string, opts: { query?: Record<string, string | number | undefined>; form?: Record<string, string | number> } = {}): Promise<T> {
  const key = process.env.MTS_LINK_API_KEY?.trim();
  if (!key) throw new MtsError("MTS_LINK_API_KEY не задан", 503);
  const url = new URL(`${BASE()}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { "x-auth-token": key, Accept: "application/json" };
  let body: string | undefined;
  if (opts.form) { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(Object.entries(opts.form).map(([k, v]) => [k, String(v)])).toString(); }
  const res = await fetch(url.toString(), { method, headers, body, signal: AbortSignal.timeout(25_000) });
  const text = await res.text().catch(() => "");
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* не JSON */ }
  if (!res.ok) {
    const detail = (json as { message?: string; error?: string } | null)?.message || (json as { error?: string } | null)?.error || text.slice(0, 200);
    throw new MtsError(`МТС Линк ${method} ${path}: ${res.status} ${detail}`.trim(), res.status);
  }
  return json as T;
}

/** Запись встречи из списка GET /records (поля, которых нет в документации, лежат в raw). */
export interface MtsRecord {
  id: string;
  name: string | null;
  link: string | null;
  size: number | null;
  eventSessionId: string | null;
  startedAt: Date | null;
  durationSec: number | null;
  raw: Record<string, unknown>;
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

function toDate(v: unknown): Date | null {
  if (typeof v === "string" || typeof v === "number") { const d = new Date(v); if (!Number.isNaN(d.getTime())) return d; }
  return null;
}

function normalize(r: Record<string, unknown>): MtsRecord {
  const es = (r.eventSession ?? r.eventsession ?? {}) as Record<string, unknown>;
  const dur = Number(r.duration ?? es.duration ?? es.durationSec ?? NaN);
  return {
    id: String(r.id),
    name: (typeof r.name === "string" && r.name) || (typeof es.name === "string" && es.name) || null,
    link: typeof r.link === "string" ? r.link : null,
    size: typeof r.size === "number" ? r.size : null,
    eventSessionId: es.id != null ? String(es.id) : null,
    startedAt: toDate(es.startsAt ?? es.startDate ?? es.startAt ?? es.date ?? r.createdAt ?? r.createAt ?? r.date),
    durationSec: Number.isFinite(dur) && dur > 0 ? Math.round(dur) : null,
    raw: r,
  };
}

/** Список онлайн-записей за период (пагинация по offset/limit до 500). */
export async function listRecords(opts: { from: Date; to?: Date; limit?: number; offset?: number }): Promise<MtsRecord[]> {
  const j = await mts<unknown>("GET", "/records", {
    query: { from: fmt(opts.from), to: opts.to ? fmt(opts.to) : undefined, limit: opts.limit ?? 100, offset: opts.offset ?? 0 },
  });
  const arr = Array.isArray(j) ? j : Array.isArray((j as { records?: unknown[] } | null)?.records) ? (j as { records: unknown[] }).records : [];
  return (arr as Array<Record<string, unknown>>).filter((r) => r && r.id != null).map(normalize);
}

/** Поставить запись на конвертацию в MP4 → ID конвертации. */
export async function startConversion(recordId: string, quality: 720 | 1080 = 720): Promise<string> {
  const j = await mts<{ id?: number | string }>("POST", `/records/${encodeURIComponent(recordId)}/conversions`, { form: { quality } });
  if (j?.id == null) throw new MtsError("МТС Линк не вернул ID конвертации", 502);
  return String(j.id);
}

export type MtsConversionState = "waiting" | "processing" | "completed" | "failed" | "canceled" | string;

export async function getConversionState(conversionId: string): Promise<MtsConversionState> {
  const j = await mts<{ state?: string }>("GET", `/records/conversions/${encodeURIComponent(conversionId)}`);
  return j?.state ?? "unknown";
}

/** Ссылка на скачивание готового MP4. */
export async function getConversionFileUrl(conversionId: string): Promise<string | null> {
  const j = await mts<{ downloadUrl?: string }>("GET", `/fileSystem/file/${encodeURIComponent(conversionId)}`);
  return j?.downloadUrl ?? null;
}
