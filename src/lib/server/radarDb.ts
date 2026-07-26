import "server-only";

import { createHash } from "node:crypto";
import { getTimewebPool } from "@/lib/timewebPg";
import {
  DEFAULT_RADAR_FEEDS,
  DEFAULT_RADAR_TRIGGERS,
  type RadarItem,
  type RadarStatus,
  type RadarTrigger,
} from "@/lib/radarTypes";

/** Стабильный id новости по её ссылке (для дедупликации). */
export function radarItemId(link: string): string {
  return createHash("sha1").update(link.trim()).digest("hex");
}

function triggerId(kind: string, query: string): string {
  return createHash("sha1").update(`${kind}:${query}`).digest("hex").slice(0, 16);
}

export async function dbEnsureRadarTables(): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists radar_triggers (
      id text primary key,
      kind text not null default 'keyword',
      query text not null default '',
      label text not null default '',
      category text not null default 'other',
      enabled boolean not null default true,
      created_at bigint not null default 0
    )
  `);
  await pool.query(`
    create table if not exists radar_items (
      id text primary key,
      trigger_id text,
      category text not null default 'other',
      title text not null default '',
      link text not null default '',
      source_name text not null default '',
      snippet text not null default '',
      published_at bigint not null default 0,
      status text not null default 'new',
      created_at bigint not null default 0
    )
  `);
  await pool.query(
    `create index if not exists radar_items_published_idx on radar_items (published_at desc)`
  );
}

async function seedDefaultTriggersIfEmpty(): Promise<void> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select count(*)::int as n from radar_triggers");
  if ((rows[0]?.n ?? 0) > 0) return;
  const now = Date.now();
  for (const t of DEFAULT_RADAR_TRIGGERS) {
    await pool.query(
      `insert into radar_triggers (id, kind, query, label, category, enabled, created_at)
       values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
      [triggerId(t.kind, t.query), t.kind, t.query, t.label, t.category, t.enabled, now]
    );
  }
}

export async function dbListTriggers(): Promise<RadarTrigger[]> {
  await dbEnsureRadarTables();
  await seedDefaultTriggersIfEmpty();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from radar_triggers order by category asc, label asc"
  );
  return rows as RadarTrigger[];
}

export async function dbUpsertTrigger(
  t: Partial<RadarTrigger> & { id?: string }
): Promise<string> {
  await dbEnsureRadarTables();
  const pool = getTimewebPool();
  const kind = t.kind ?? "keyword";
  const query = t.query ?? "";
  const id = t.id || triggerId(kind, query);
  await pool.query(
    `insert into radar_triggers (id, kind, query, label, category, enabled, created_at)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (id) do update set
       kind = excluded.kind,
       query = excluded.query,
       label = excluded.label,
       category = excluded.category,
       enabled = excluded.enabled`,
    [id, kind, query, t.label ?? "", t.category ?? "other", t.enabled ?? true, t.created_at ?? Date.now()]
  );
  return id;
}

export async function dbDeleteTrigger(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from radar_triggers where id = $1", [id]);
  return rowCount ?? 0;
}

/** Идемпотентно добавляет пул RSS-лент российских СМИ. Возвращает число новых. */
export async function dbEnsureDefaultFeeds(): Promise<number> {
  await dbEnsureRadarTables();
  const pool = getTimewebPool();
  const now = Date.now();
  let added = 0;
  for (const f of DEFAULT_RADAR_FEEDS) {
    const id = "feed-" + createHash("sha1").update(f.url).digest("hex").slice(0, 12);
    const { rowCount } = await pool.query(
      `insert into radar_triggers (id, kind, query, label, category, enabled, created_at)
       values ($1,'rss',$2,$3,'other',true,$4) on conflict (id) do nothing`,
      [id, f.url, f.label, now]
    );
    added += rowCount ?? 0;
  }
  return added;
}

export interface RadarItemsQuery {
  category?: string;
  status?: string;
  q?: string;
  limit?: number;
}

export async function dbListItems(opts: RadarItemsQuery = {}): Promise<RadarItem[]> {
  await dbEnsureRadarTables();
  const pool = getTimewebPool();
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.category && opts.category !== "all") {
    params.push(opts.category);
    where.push(`category = $${params.length}`);
  }
  if (opts.status && opts.status !== "all") {
    params.push(opts.status);
    where.push(`status = $${params.length}`);
  } else {
    // По умолчанию скрываем «Скрытые», если статус явно не запрошен.
    where.push(`status <> 'dismissed'`);
  }
  if (opts.q) {
    params.push(`%${opts.q.toLowerCase()}%`);
    where.push(`(lower(title) like $${params.length} or lower(source_name) like $${params.length})`);
  }

  params.push(Math.min(opts.limit ?? 300, 500));
  const sql = `select * from radar_items ${
    where.length ? "where " + where.join(" and ") : ""
  } order by published_at desc limit $${params.length}`;
  const { rows } = await pool.query(sql, params);
  return rows as RadarItem[];
}

export async function dbUpsertItem(it: RadarItem): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `insert into radar_items (id, trigger_id, category, title, link, source_name, snippet, published_at, status, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'new',$9)
     on conflict (id) do update set
       title = excluded.title,
       source_name = excluded.source_name,
       snippet = excluded.snippet,
       published_at = excluded.published_at`,
    [
      it.id,
      it.trigger_id,
      it.category,
      it.title,
      it.link,
      it.source_name,
      it.snippet,
      it.published_at,
      it.created_at,
    ]
  );
}

export async function dbSetItemStatus(id: string, status: RadarStatus): Promise<void> {
  const pool = getTimewebPool();
  await pool.query("update radar_items set status = $2 where id = $1", [id, status]);
}

export async function dbDeleteItem(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from radar_items where id = $1", [id]);
  return rowCount ?? 0;
}

/** Чистка старых непросмотренных/скрытых новостей, чтобы таблица не пухла. */
export async function dbRadarCleanup(days = 60): Promise<number> {
  const pool = getTimewebPool();
  const cutoff = Date.now() - days * 86_400_000;
  const { rowCount } = await pool.query(
    "delete from radar_items where status in ('new','dismissed') and published_at < $1",
    [cutoff]
  );
  return rowCount ?? 0;
}

export async function dbRadarStatusCounts(): Promise<Record<string, number>> {
  await dbEnsureRadarTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select status, count(*)::int as n from radar_items group by status"
  );
  const out: Record<string, number> = {};
  for (const r of rows as { status: string; n: number }[]) out[r.status] = r.n;
  return out;
}
