import "server-only";

/**
 * Клиент Reporting API Яндекс.Метрики.
 * Docs: https://yandex.ru/dev/metrika/doc/api2/api_v1/intro.html
 *
 * Требует OAuth-токен со scope `metrika:read`.
 * ENV:
 *   YANDEX_METRIKA_TOKEN   — OAuth-токен (обязателен для живых данных)
 *   YANDEX_METRIKA_COUNTER — ID счётчика (по умолчанию 89202191, см. lib/config.ts)
 */

const API_BASE = "https://api-metrika.yandex.net/stat/v1/data";
const DEFAULT_COUNTER = "89202191";

export function metrikaConfigured(): boolean {
  return Boolean(process.env.YANDEX_METRIKA_TOKEN);
}

function counterId(): string {
  return (process.env.YANDEX_METRIKA_COUNTER || DEFAULT_COUNTER).trim();
}

export interface MetrikaSummary {
  visits: number;
  users: number;
  pageviews: number;
  bounceRate: number; // %
  avgVisitDurationSeconds: number;
}

export interface MetrikaTimePoint {
  date: string; // YYYY-MM-DD
  visits: number;
  users: number;
}

export interface MetrikaNamedValue {
  name: string;
  visits: number;
  share: number; // %
}

export interface MetrikaOverview {
  from: string;
  to: string;
  counter: string;
  summary: MetrikaSummary;
  timeline: MetrikaTimePoint[];
  sources: MetrikaNamedValue[];
  topPages: MetrikaNamedValue[];
}

class MetrikaError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

async function metrikaFetch(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = process.env.YANDEX_METRIKA_TOKEN;
  if (!token) {
    throw new MetrikaError("YANDEX_METRIKA_TOKEN не задан", 503);
  }

  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("ids", counterId());
  url.searchParams.set("lang", "ru"); // русские названия измерений (источники и т.п.)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `OAuth ${token}` },
    // данные меняются часто, но кэшируем на минуту, чтобы не бить по лимитам
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new MetrikaError(
      `Метрика вернула ${res.status}: ${text.slice(0, 300)}`,
      res.status === 403 || res.status === 401 ? res.status : 502
    );
  }
  return (await res.json()) as Record<string, unknown>;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchSummary(from: string, to: string): Promise<MetrikaSummary> {
  const data = await metrikaFetch("", {
    metrics:
      "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
    date1: from,
    date2: to,
  });
  const totals = (data.totals as unknown[])?.map(num) ?? [];
  return {
    visits: totals[0] ?? 0,
    users: totals[1] ?? 0,
    pageviews: totals[2] ?? 0,
    bounceRate: Math.round((totals[3] ?? 0) * 10) / 10,
    avgVisitDurationSeconds: Math.round(totals[4] ?? 0),
  };
}

async function fetchTimeline(from: string, to: string): Promise<MetrikaTimePoint[]> {
  const data = await metrikaFetch("/bytime", {
    metrics: "ym:s:visits,ym:s:users",
    date1: from,
    date2: to,
    group: "day",
  });

  // bytime: data[].dimensions задают серию, а time_intervals — оси дат
  const intervals = (data.time_intervals as string[][] | undefined) ?? [];
  const rows = (data.data as Array<{ metrics: number[][] }> | undefined) ?? [];
  const visitsSeries = rows[0]?.metrics?.[0] ?? [];
  const usersSeries = rows[0]?.metrics?.[1] ?? [];

  return intervals.map((iv, i) => ({
    date: iv?.[0] ?? "",
    visits: num(visitsSeries[i]),
    users: num(usersSeries[i]),
  }));
}

async function fetchDimension(
  from: string,
  to: string,
  dimension: string,
  limit = 8
): Promise<MetrikaNamedValue[]> {
  const data = await metrikaFetch("", {
    metrics: "ym:s:visits",
    dimensions: dimension,
    date1: from,
    date2: to,
    sort: "-ym:s:visits",
    limit: String(limit),
  });

  const total = num((data.totals as unknown[])?.[0]);
  const rows =
    (data.data as Array<{
      dimensions: Array<{ name?: string | null }>;
      metrics: number[];
    }>) ?? [];

  return rows.map((row) => {
    const visits = num(row.metrics?.[0]);
    return {
      name: row.dimensions?.[0]?.name || "Не определено",
      visits,
      share: total > 0 ? Math.round((visits / total) * 1000) / 10 : 0,
    };
  });
}

export async function getMetrikaOverview(
  from: string,
  to: string
): Promise<MetrikaOverview> {
  const [summary, timeline, sources, topPages] = await Promise.all([
    fetchSummary(from, to),
    fetchTimeline(from, to),
    fetchDimension(from, to, "ym:s:lastTrafficSource"),
    fetchDimension(from, to, "ym:s:startURLPath"),
  ]);

  return { from, to, counter: counterId(), summary, timeline, sources, topPages };
}

export { MetrikaError };
