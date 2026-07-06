import "server-only";

/**
 * Клиент REST-вебхука Битрикс24 (входящий вебхук).
 *
 * ENV:
 *   BITRIX24_WEBHOOK_URL — входящий вебхук вида
 *                          https://<portal>.bitrix24.ru/rest/<user_id>/<code>/
 *                          Нужны права scope `crm`.
 *
 * Примечание: статистика CRM-маркетинга (открытия/клики массовых рассылок)
 * в REST Битрикс24 не выведена. Поэтому email-часть строится по активностям
 * CRM (crm.activity с PROVIDER_ID=CRM_EMAIL) — реальный поток писем: сколько
 * отправлено/получено, динамика по дням, последние письма.
 */

export function bitrixConfigured(): boolean {
  return Boolean(process.env.BITRIX24_WEBHOOK_URL);
}

function webhookBase(): string {
  const raw = (process.env.BITRIX24_WEBHOOK_URL || "").trim();
  return raw.endsWith("/") ? raw : `${raw}/`;
}

class BitrixError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** Низкоуровневый вызов метода REST-вебхука. */
export async function bitrixCall<T = unknown>(
  method: string,
  params: Record<string, unknown> = {}
): Promise<{ result: T; total?: number; next?: number }> {
  if (!bitrixConfigured()) {
    throw new BitrixError("BITRIX24_WEBHOOK_URL не задан", 503);
  }
  const url = `${webhookBase()}${method}.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    next: { revalidate: 60 },
  });

  const json = (await res.json().catch(() => ({}))) as {
    result?: T;
    total?: number;
    next?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || json.error) {
    throw new BitrixError(
      json.error_description || json.error || `Битрикс вернул ${res.status}`,
      res.status === 401 || res.status === 403 ? res.status : 502
    );
  }
  return { result: json.result as T, total: json.total, next: json.next };
}

/* ── Даты в поясе портала (Москва, +03:00) ── */
const pad = (n: number) => String(n).padStart(2, "0");
const MSK_OFFSET_MS = 3 * 3600 * 1000;

/** Начало дня (МСК) `daysAgo` дней назад в ISO 8601 c оффсетом +03:00. */
function mskDayStart(daysAgo: number): string {
  const msk = new Date(Date.now() + MSK_OFFSET_MS);
  msk.setUTCDate(msk.getUTCDate() - daysAgo);
  const y = msk.getUTCFullYear();
  const m = msk.getUTCMonth() + 1;
  const d = msk.getUTCDate();
  return `${y}-${pad(m)}-${pad(d)}T00:00:00+03:00`;
}

/** YYYY-MM-DD (МСК) из ISO-даты Битрикса (CREATED). */
function mskDateKey(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const msk = new Date(t + MSK_OFFSET_MS);
  return `${msk.getUTCFullYear()}-${pad(msk.getUTCMonth() + 1)}-${pad(msk.getUTCDate())}`;
}

const toStr = (v: unknown): string => (v == null ? "" : String(v));

const CRM_EMAIL = "CRM_EMAIL";

/** Точный счётчик писем через поле total (без выкачивания строк). */
async function countEmails(
  fromISO: string,
  direction?: "1" | "2"
): Promise<number> {
  const filter: Record<string, unknown> = {
    PROVIDER_ID: CRM_EMAIL,
    ">=CREATED": fromISO,
  };
  if (direction) filter.DIRECTION = direction;

  const { total } = await bitrixCall("crm.activity.list", {
    filter,
    select: ["ID"],
    start: 0,
  });
  return total ?? 0;
}

interface RawActivity {
  ID?: string | number;
  SUBJECT?: string;
  CREATED?: string;
  DIRECTION?: string | number;
}

/** Страницы crm.activity.list за период (с ограничением по числу страниц). */
async function fetchEmailRows(fromISO: string, maxPages = 20): Promise<RawActivity[]> {
  const rows: RawActivity[] = [];
  let start = 0;
  for (let page = 0; page < maxPages; page++) {
    const { result, next } = await bitrixCall<RawActivity[]>("crm.activity.list", {
      filter: { PROVIDER_ID: CRM_EMAIL, ">=CREATED": fromISO },
      select: ["ID", "SUBJECT", "CREATED", "DIRECTION"],
      order: { CREATED: "DESC" },
      start,
    });
    if (Array.isArray(result)) rows.push(...result);
    if (typeof next !== "number") break;
    start = next;
  }
  return rows;
}

export type EmailPeriod = 7 | 30 | 90;

export interface EmailActivitySummary {
  total: number;
  sent: number;
  received: number;
}
export interface EmailActivityPoint {
  date: string; // YYYY-MM-DD
  sent: number;
  received: number;
}
export interface EmailRecentItem {
  id: string;
  subject: string;
  date: string | null;
  direction: "in" | "out";
}
export interface EmailActivityResult {
  configured: boolean;
  period: EmailPeriod;
  summary: EmailActivitySummary;
  timeline: EmailActivityPoint[];
  recent: EmailRecentItem[];
  truncated: boolean; // true, если строк больше, чем успели выгрузить
}

/** Итоговая сводка email-активности CRM за период. */
export async function getEmailActivity(
  period: EmailPeriod
): Promise<EmailActivityResult> {
  const fromISO = mskDayStart(period);

  // Точные счётчики — независимо от объёма
  const [total, sent, received, rows] = await Promise.all([
    countEmails(fromISO),
    countEmails(fromISO, "2"),
    countEmails(fromISO, "1"),
    fetchEmailRows(fromISO),
  ]);

  // Заготовка дней периода (МСК) с нулями
  const buckets = new Map<string, EmailActivityPoint>();
  for (let i = period - 1; i >= 0; i--) {
    const key = mskDateKey(mskDayStart(i));
    buckets.set(key, { date: key, sent: 0, received: 0 });
  }

  for (const r of rows) {
    const key = mskDateKey(String(r.CREATED ?? ""));
    const point = buckets.get(key);
    if (!point) continue;
    if (String(r.DIRECTION) === "2") point.sent += 1;
    else point.received += 1;
  }

  const recent: EmailRecentItem[] = rows.slice(0, 10).map((r) => ({
    id: String(r.ID ?? ""),
    subject: (r.SUBJECT || "").trim() || "Без темы",
    date: r.CREATED ?? null,
    direction: String(r.DIRECTION) === "2" ? "out" : "in",
  }));

  return {
    configured: true,
    period,
    summary: { total, sent, received },
    timeline: Array.from(buckets.values()),
    recent,
    truncated: rows.length < total, // выгрузили не все строки за период
  };
}

/* ── Новые лиды из CRM (сайт + рассылки) ── */

/** Origin портала из URL вебхука — для ссылок на карточки лидов. */
function portalOrigin(): string {
  try {
    return new URL(webhookBase()).origin;
  } catch {
    return "";
  }
}

/** Справочник crm.status.list (STATUS_ID → NAME) для стадий/источников. */
async function loadStatusMap(
  entityId: "STATUS" | "SOURCE"
): Promise<Record<string, string>> {
  const { result } = await bitrixCall<Array<{ STATUS_ID: string; NAME: string }>>(
    "crm.status.list",
    { filter: { ENTITY_ID: entityId } }
  );
  const map: Record<string, string> = {};
  for (const r of result || []) map[r.STATUS_ID] = r.NAME;
  return map;
}

/** Источники «Сайт» и «Рассылка» (при желании список легко расширить). */
const LEAD_SOURCES = ["WEBFORM", "RC_GENERATOR"];

const stripHtml = (s: string) =>
  s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

export type LeadQuality = "converted" | "junk" | "in_progress";

export interface LeadUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface CrmLead {
  id: string;
  title: string;
  createdAt: string | null;
  source: string;
  sourceId: string;
  sourceDescription: string | null;
  utm: LeadUtm;
  company: string | null;
  contact: string | null;
  comment: string | null;
  status: string;
  statusId: string;
  quality: LeadQuality;
  url: string;
}

export interface LeadsResult {
  configured: boolean;
  period: EmailPeriod;
  total: number;
  leads: CrmLead[];
}

function qualityOf(statusId: string, semantic: string): LeadQuality {
  if (statusId === "CONVERTED" || semantic === "S") return "converted";
  if (statusId === "JUNK" || semantic === "F") return "junk";
  return "in_progress";
}

type RawLead = Record<string, unknown>;

/** Новые лиды за период с источниками «Сайт» и «Рассылка». */
export async function getRecentLeads(period: EmailPeriod): Promise<LeadsResult> {
  const fromISO = mskDayStart(period);
  const [statusMap, sourceMap] = await Promise.all([
    loadStatusMap("STATUS"),
    loadStatusMap("SOURCE"),
  ]);
  const origin = portalOrigin();

  const rows: RawLead[] = [];
  let start = 0;
  let total = 0;
  for (let page = 0; page < 10; page++) {
    const { result, total: t, next } = await bitrixCall<RawLead[]>("crm.lead.list", {
      filter: { ">=DATE_CREATE": fromISO, SOURCE_ID: LEAD_SOURCES },
      select: [
        "ID", "TITLE", "NAME", "LAST_NAME", "SECOND_NAME", "COMPANY_TITLE",
        "DATE_CREATE", "SOURCE_ID", "SOURCE_DESCRIPTION", "STATUS_ID",
        "STATUS_SEMANTIC_ID", "COMMENTS",
        "UTM_SOURCE", "UTM_MEDIUM", "UTM_CAMPAIGN", "UTM_CONTENT", "UTM_TERM",
      ],
      order: { DATE_CREATE: "DESC" },
      start,
    });
    if (typeof t === "number") total = t;
    if (Array.isArray(result)) rows.push(...result);
    if (typeof next !== "number") break;
    start = next;
  }

  const leads: CrmLead[] = rows.map((r) => {
    const statusId = toStr(r.STATUS_ID);
    const semantic = toStr(r.STATUS_SEMANTIC_ID);
    const contact =
      [r.NAME, r.SECOND_NAME, r.LAST_NAME].map((x) => toStr(x).trim()).filter(Boolean).join(" ") ||
      null;
    const commentRaw = toStr(r.COMMENTS);
    return {
      id: toStr(r.ID),
      title: toStr(r.TITLE) || "Без названия",
      createdAt: (r.DATE_CREATE as string) ?? null,
      source: sourceMap[toStr(r.SOURCE_ID)] || toStr(r.SOURCE_ID) || "—",
      sourceId: toStr(r.SOURCE_ID),
      sourceDescription: toStr(r.SOURCE_DESCRIPTION) || null,
      utm: {
        source: toStr(r.UTM_SOURCE) || undefined,
        medium: toStr(r.UTM_MEDIUM) || undefined,
        campaign: toStr(r.UTM_CAMPAIGN) || undefined,
        content: toStr(r.UTM_CONTENT) || undefined,
        term: toStr(r.UTM_TERM) || undefined,
      },
      company: toStr(r.COMPANY_TITLE) || null,
      contact,
      comment: commentRaw ? stripHtml(commentRaw) || null : null,
      status: statusMap[statusId] || statusId || "—",
      statusId,
      quality: qualityOf(statusId, semantic),
      url: origin ? `${origin}/crm/lead/details/${toStr(r.ID)}/` : "",
    };
  });

  return { configured: true, period, total, leads };
}

export { BitrixError };
