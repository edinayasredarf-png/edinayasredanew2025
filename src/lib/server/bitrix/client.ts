import "server-only";

import { bitrixCall, bitrixConfigured, BitrixError } from "@/lib/server/bitrix";

/**
 * Расширение существующего Bitrix-клиента (src/lib/server/bitrix.ts) для AI Sales.
 * Здесь — переиспользуемый пагинатор поверх низкоуровневого bitrixCall.
 * Не дублируем сам вызов REST — только удобные обёртки.
 */

export { bitrixCall, bitrixConfigured, BitrixError };

/** Origin портала из URL вебхука — для deep-link на карточки Bitrix. */
export function bitrixPortalOrigin(): string {
  try {
    return new URL((process.env.BITRIX24_WEBHOOK_URL || "").trim()).origin;
  } catch {
    return "";
  }
}

export interface ListParams {
  filter?: Record<string, unknown>;
  select?: string[];
  order?: Record<string, "ASC" | "DESC">;
}

/**
 * Полная выборка списочного метода Bitrix с пагинацией по `next`.
 * maxPages — предохранитель от бесконечных циклов на больших порталах.
 * Тяжёлые синхронизации всё равно должны идти через очередь, не в HTTP-запросе.
 */
export async function bitrixListAll<T = Record<string, unknown>>(
  method: string,
  params: ListParams = {},
  maxPages = 50
): Promise<T[]> {
  const rows: T[] = [];
  let start = 0;
  for (let page = 0; page < maxPages; page++) {
    const { result, next } = await bitrixCall<T[]>(method, { ...params, start });
    if (Array.isArray(result)) rows.push(...result);
    if (typeof next !== "number") break;
    start = next;
  }
  return rows;
}

/** Одна страница списочного метода (для очереди — обработка по кусочкам). */
export async function bitrixListPage<T = Record<string, unknown>>(
  method: string,
  params: ListParams & { start?: number } = {}
): Promise<{ rows: T[]; next: number | null; total: number | null }> {
  const { result, next, total } = await bitrixCall<T[]>(method, { ...params });
  return {
    rows: Array.isArray(result) ? result : [],
    next: typeof next === "number" ? next : null,
    total: typeof total === "number" ? total : null,
  };
}

/** Утилита: безопасно привести неизвестное к строке (пустое → ""). */
export const bxStr = (v: unknown): string => (v == null ? "" : String(v));

/** Утилита: строка Bitrix-даты → Date | null. */
export function bxDate(v: unknown): Date | null {
  if (!v) return null;
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : new Date(t);
}
