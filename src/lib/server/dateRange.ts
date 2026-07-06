import "server-only";

/** Диапазон дат YYYY-MM-DD (включительно), в поясе портала/счётчика. */
export interface DateRange {
  from: string;
  to: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MSK_OFFSET_MS = 3 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Сегодня (МСК) как YYYY-MM-DD. */
export function mskToday(): string {
  const d = new Date(Date.now() + MSK_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** N дней назад (МСК) как YYYY-MM-DD. */
export function mskDaysAgo(n: number): string {
  const d = new Date(Date.now() + MSK_OFFSET_MS);
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Разбирает from/to из query. Некорректные значения игнорируются.
 * По умолчанию — последние 30 дней (29 дней назад → сегодня).
 * Если from > to — меняет местами. Ограничивает диапазон 366 днями.
 */
export function parseRange(
  fromRaw: string | null,
  toRaw: string | null
): DateRange {
  let from = fromRaw && ISO_DATE.test(fromRaw) ? fromRaw : "";
  let to = toRaw && ISO_DATE.test(toRaw) ? toRaw : "";

  if (!from || !to) {
    return { from: mskDaysAgo(29), to: mskToday() };
  }
  if (from > to) [from, to] = [to, from];

  // не даём тянуть слишком широкий диапазон
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
  if (days > 366) from = to; // подстраховка; клиент обычно шлёт разумный диапазон
  return { from, to };
}
