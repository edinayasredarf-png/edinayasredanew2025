import "server-only";

import { bitrixCall, bitrixConfigured } from "@/lib/server/bitrix";
import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Живой контекст сделки из Bitrix: последние комментарии таймлайна и активности
 * (звонки/задачи/встречи). Нужно, чтобы РОП понимал «что там происходит» —
 * особенно когда по звонку «не дозвонились», а в Bitrix уже идёт работа.
 *
 * Данные тянем на чтение (не кэшируем в БД): всегда актуальны, объём мал.
 */

export interface TimelineItem {
  kind: "comment" | "activity";
  text: string;
  author: string | null;
  createdAt: string | null; // ISO
  done?: boolean;           // для активности — завершена ли
  activityType?: string | null;
}

export interface DealTimeline {
  items: TimelineItem[];
  lastActivityAt: string | null;
  configured: boolean;
}

const ACT_TYPE: Record<string, string> = {
  "1": "встреча", "2": "звонок", "3": "задача", "4": "письмо", "6": "чат",
};

/** Имена пользователей Bitrix (id → ФИО) из нашей таблицы ai_managers. */
async function userNames(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return new Map();
  const pool = getTimewebPool();
  try {
    const { rows } = await pool.query<{ bitrix_user_id: string; full_name: string | null }>(
      `select bitrix_user_id, full_name from ai_managers where bitrix_user_id = any($1)`,
      [uniq]
    );
    return new Map(rows.filter((r) => r.full_name).map((r) => [r.bitrix_user_id, r.full_name as string]));
  } catch {
    return new Map();
  }
}

const stripHtml = (s: string) => s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Комментарии + активности сделки, самые свежие сверху. */
export async function getDealTimeline(dealId: string, limit = 12): Promise<DealTimeline> {
  if (!bitrixConfigured()) return { items: [], lastActivityAt: null, configured: false };
  const id = Number(dealId);
  if (!id) return { items: [], lastActivityAt: null, configured: true };

  const [commentsRes, actsRes] = await Promise.all([
    bitrixCall<Array<Record<string, unknown>>>("crm.timeline.comment.list", {
      filter: { ENTITY_ID: id, ENTITY_TYPE: "deal" },
      order: { CREATED: "DESC" },
      select: ["ID", "COMMENT", "AUTHOR_ID", "CREATED"],
      start: 0,
    }).catch(() => ({ result: [] as Array<Record<string, unknown>> })),
    bitrixCall<Array<Record<string, unknown>>>("crm.activity.list", {
      filter: { OWNER_TYPE_ID: 2, OWNER_ID: id },
      order: { CREATED: "DESC" },
      select: ["ID", "SUBJECT", "TYPE_ID", "COMPLETED", "CREATED", "AUTHOR_ID", "RESPONSIBLE_ID"],
      start: 0,
    }).catch(() => ({ result: [] as Array<Record<string, unknown>> })),
  ]);

  const comments = (commentsRes.result || []).slice(0, limit);
  const acts = (actsRes.result || []).slice(0, limit);

  const names = await userNames([
    ...comments.map((c) => String(c.AUTHOR_ID || "")),
    ...acts.map((a) => String(a.AUTHOR_ID || a.RESPONSIBLE_ID || "")),
  ]);

  const items: TimelineItem[] = [];
  for (const c of comments) {
    const text = stripHtml(String(c.COMMENT || ""));
    if (!text) continue;
    const authorId = String(c.AUTHOR_ID || "");
    items.push({
      kind: "comment",
      text,
      author: names.get(authorId) || null,
      createdAt: c.CREATED ? new Date(String(c.CREATED)).toISOString() : null,
    });
  }
  for (const a of acts) {
    const subject = stripHtml(String(a.SUBJECT || "")) || "(без темы)";
    const authorId = String(a.AUTHOR_ID || a.RESPONSIBLE_ID || "");
    items.push({
      kind: "activity",
      text: subject,
      author: names.get(authorId) || null,
      createdAt: a.CREATED ? new Date(String(a.CREATED)).toISOString() : null,
      done: String(a.COMPLETED || "") === "Y",
      activityType: ACT_TYPE[String(a.TYPE_ID || "")] || null,
    });
  }

  items.sort((x, y) => (y.createdAt || "").localeCompare(x.createdAt || ""));
  const trimmed = items.slice(0, limit);
  return {
    items: trimmed,
    lastActivityAt: trimmed[0]?.createdAt ?? null,
    configured: true,
  };
}

/**
 * Была ли по сделке активность (комментарий/активность) ПОСЛЕ момента sinceISO.
 * Используется сигналом «брошен клиент»: если после недозвона никто ничего не
 * делал в Bitrix — это реальный сигнал. Лёгкий вызов (по одной странице).
 */
export async function dealHasActivitySince(dealId: string, sinceISO: string): Promise<boolean> {
  if (!bitrixConfigured()) return false;
  const id = Number(dealId);
  if (!id) return false;
  const since = new Date(sinceISO);
  try {
    const [c, a] = await Promise.all([
      bitrixCall<Array<Record<string, unknown>>>("crm.timeline.comment.list", {
        filter: { ENTITY_ID: id, ENTITY_TYPE: "deal", ">CREATED": sinceISO },
        select: ["ID", "CREATED"],
        start: 0,
      }).catch(() => ({ result: [] as Array<Record<string, unknown>> })),
      bitrixCall<Array<Record<string, unknown>>>("crm.activity.list", {
        filter: { OWNER_TYPE_ID: 2, OWNER_ID: id, ">CREATED": sinceISO },
        select: ["ID", "CREATED"],
        start: 0,
      }).catch(() => ({ result: [] as Array<Record<string, unknown>> })),
    ]);
    const has = (rows: Array<Record<string, unknown>>) =>
      (rows || []).some((r) => r.CREATED && new Date(String(r.CREATED)).getTime() > since.getTime());
    return has(c.result) || has(a.result);
  } catch {
    return false; // при ошибке не глушим сигнал (лучше показать, чем спрятать)
  }
}
