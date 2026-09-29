import "server-only";

import { randomUUID } from "node:crypto";
import { getTimewebPool } from "@/lib/timewebPg";
import { dbEnsureRadarTables } from "@/lib/server/radarDb";
import {
  DEFAULT_CHANNEL_PROFILES,
  type ContentBrandDocument,
  type ContentBrief,
  type ContentChannelProfile,
  type ContentCluster,
  type ContentFactCheck,
  type ContentItem,
  type ContentItemVersion,
  type ContentItemWithCluster,
  type ContentOsChannel,
  type ContentOsTask,
  type ContentPublication,
  type ContentQcCheck,
  type ContentResearchPack,
  type ContentResearchSource,
  type ContentSeo,
  type ContentSource,
  type ContentTopic,
  type PublicationStatus,
  type QcCheckStatus,
  type QcCheckType,
} from "@/lib/contentOsTypes";

export async function dbEnsureContentOsTables(): Promise<void> {
  await dbEnsureRadarTables();
  const pool = getTimewebPool();

  // Расширение радара — темы Content OS (не пересоздаёт radar_items, только добавляет поля).
  await pool.query(`alter table if exists radar_items add column if not exists popularity int`);
  await pool.query(`alter table if exists radar_items add column if not exists trust_weight int`);

  await pool.query(`
    create table if not exists content_topics (
      id text primary key,
      title text not null default '',
      radar_item_id text,
      thesis text not null default '',
      relevance int not null default 5,
      popularity int not null default 50,
      score numeric,
      status text not null default 'new',
      created_by text,
      created_at bigint not null,
      updated_at bigint not null
    )
  `);

  await pool.query(`
    create table if not exists content_clusters (
      id text primary key,
      title text not null default '',
      primary_topic_id text references content_topics(id),
      status text not null default 'new',
      created_by text,
      created_at bigint not null,
      updated_at bigint not null
    )
  `);

  await pool.query(`
    create table if not exists content_briefs (
      id text primary key,
      cluster_id text not null references content_clusters(id) on delete cascade,
      audience text not null default '',
      angle text not null default '',
      requirements text not null default '',
      channels jsonb not null default '[]',
      created_by text,
      created_at bigint not null
    )
  `);

  await pool.query(`
    create table if not exists content_items (
      id text primary key,
      cluster_id text not null references content_clusters(id) on delete cascade,
      channel text not null,
      status text not null default 'draft',
      title text not null default '',
      body text not null default '',
      meta jsonb not null default '{}',
      scheduled_at bigint,
      approved_by text,
      approved_at bigint,
      created_at bigint not null,
      updated_at bigint not null
    )
  `);
  await pool.query(`alter table content_items add column if not exists scheduled_at bigint`);
  await pool.query(`create index if not exists content_items_cluster_idx on content_items (cluster_id)`);
  await pool.query(`create index if not exists content_items_scheduled_idx on content_items (scheduled_at)`);

  // Источники (§19 ТЗ) — свой реестр с полным набором полей поверх radar_triggers
  // (переиспользуем рабочий пайплайн сбора radarFetch.ts, не дублируем его).
  // dbEnsureRadarTables() уже вызван выше — radar_triggers точно существует.
  await pool.query(`alter table radar_triggers add column if not exists priority int not null default 5`);
  await pool.query(`alter table radar_triggers add column if not exists poll_interval int not null default 60`);
  await pool.query(`alter table radar_triggers add column if not exists categories jsonb not null default '[]'`);
  await pool.query(`alter table radar_triggers add column if not exists tags jsonb not null default '[]'`);
  await pool.query(`alter table radar_triggers add column if not exists external_id text`);
  await pool.query(`alter table radar_triggers add column if not exists last_polled_at bigint`);
  // Тип источника для UI Content OS (может отличаться от radar 'kind' — напр.
  // 'website' отображается отдельно, но физически тянется как rss, если по
  // указанному URL есть лента; иначе источник просто не соберёт новых тем
  // до появления парсера произвольных сайтов, см. integrations.md).
  await pool.query(`alter table radar_triggers add column if not exists source_type text`);

  await pool.query(`
    create table if not exists content_qc_checks (
      id text primary key,
      content_item_id text not null references content_items(id) on delete cascade,
      check_type text not null,
      status text not null default 'review',
      notes text not null default '',
      created_at bigint not null
    )
  `);
  await pool.query(`create index if not exists content_qc_checks_item_idx on content_qc_checks (content_item_id, created_at desc)`);

  await pool.query(`
    create table if not exists content_seo (
      content_item_id text primary key references content_items(id) on delete cascade,
      intent text not null default '',
      primary_keyword text not null default '',
      secondary_keywords jsonb not null default '[]',
      meta_title text not null default '',
      meta_description text not null default '',
      h1 text not null default '',
      faq jsonb not null default '[]',
      internal_links jsonb not null default '[]',
      slug text not null default '',
      updated_at bigint not null
    )
  `);

  await pool.query(`
    create table if not exists content_research_packs (
      id text primary key,
      cluster_id text not null references content_clusters(id) on delete cascade,
      summary text not null default '',
      created_at bigint not null
    )
  `);
  await pool.query(`
    create table if not exists content_research_sources (
      id text primary key,
      pack_id text not null references content_research_packs(id) on delete cascade,
      url text not null default '',
      title text not null default '',
      extracted_text text not null default '',
      verified boolean not null default false,
      created_at bigint not null
    )
  `);

  await pool.query(`
    create table if not exists content_fact_checks (
      id text primary key,
      content_item_id text not null references content_items(id) on delete cascade,
      claim text not null,
      verdict text not null default 'unverified',
      source_url text not null default '',
      checked_at bigint not null
    )
  `);

  await pool.query(`
    create table if not exists content_publications (
      id text primary key,
      content_item_id text not null references content_items(id) on delete cascade,
      channel text not null,
      external_id text,
      url text,
      status text not null default 'pending',
      scheduled_at bigint,
      published_at bigint,
      error text,
      retry_count int not null default 0,
      created_at bigint not null,
      updated_at bigint not null
    )
  `);
  await pool.query(`create index if not exists content_publications_item_idx on content_publications (content_item_id)`);

  await pool.query(`
    create table if not exists content_item_versions (
      id text primary key,
      content_item_id text not null references content_items(id) on delete cascade,
      body text not null,
      edited_by text,
      note text not null default '',
      created_at bigint not null
    )
  `);
  await pool.query(`create index if not exists content_item_versions_item_idx on content_item_versions (content_item_id, created_at desc)`);

  await pool.query(`
    create table if not exists content_channel_profiles (
      id text primary key,
      name text not null,
      status text not null default 'setup',
      char_limit int not null default 4096,
      formality int not null default 50,
      emoji_level int not null default 1,
      hashtags boolean not null default false,
      hashtag_count int not null default 0,
      cta text not null default '',
      ai_prompt text not null default '',
      qa_notes text not null default '',
      sort_order int not null default 0
    )
  `);

  await pool.query(`
    create table if not exists content_brand_documents (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      category text not null default 'brand',
      content text not null default '',
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await pool.query(`
    create table if not exists content_ai_runs (
      id text primary key,
      task text not null,
      provider text not null,
      model text not null,
      content_item_id text,
      data_classification text not null default 'INTERNAL',
      input_tokens int,
      output_tokens int,
      latency_ms int,
      cost numeric,
      status text not null default 'ok',
      error text,
      created_at bigint not null
    )
  `);
  await pool.query(`create index if not exists content_ai_runs_task_idx on content_ai_runs (task, created_at desc)`);
}

async function seedChannelProfilesIfEmpty(): Promise<void> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select count(*)::int as n from content_channel_profiles");
  if ((rows[0]?.n ?? 0) > 0) return;
  for (const p of DEFAULT_CHANNEL_PROFILES) {
    await pool.query(
      `insert into content_channel_profiles (id, name, status, char_limit, formality, emoji_level, hashtags, hashtag_count, cta, ai_prompt, qa_notes, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (id) do nothing`,
      [p.id, p.name, p.status, p.char_limit, p.formality, p.emoji_level, p.hashtags, p.hashtag_count, p.cta, p.ai_prompt, p.qa_notes, p.sort_order]
    );
  }
}

async function ready(): Promise<void> {
  await dbEnsureContentOsTables();
  await seedChannelProfilesIfEmpty();
}

/* ─────────── Темы ─────────── */

export async function dbListTopics(opts: { status?: string } = {}): Promise<ContentTopic[]> {
  await ready();
  const pool = getTimewebPool();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status) { params.push(opts.status); where.push(`status = $${params.length}`); }
  const sql = `select * from content_topics ${where.length ? "where " + where.join(" and ") : ""} order by created_at desc`;
  const { rows } = await pool.query(sql, params);
  return rows as ContentTopic[];
}

export async function dbGetTopic(id: string): Promise<ContentTopic | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_topics where id = $1", [id]);
  return (rows[0] as ContentTopic) ?? null;
}

export async function dbUpsertTopic(t: Partial<ContentTopic> & { id?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const id = t.id || randomUUID();
  const existing = t.id ? await dbGetTopic(t.id) : null;
  if (!existing) {
    await pool.query(
      `insert into content_topics (id, title, radar_item_id, thesis, relevance, popularity, status, created_by, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, t.title ?? "", t.radar_item_id ?? null, t.thesis ?? "", t.relevance ?? 5, t.popularity ?? 50, t.status ?? "new", t.created_by ?? null, now, now]
    );
  } else {
    await pool.query(
      `update content_topics set title=$2, thesis=$3, relevance=$4, popularity=$5, status=$6, updated_at=$7 where id=$1`,
      [id, t.title ?? existing.title, t.thesis ?? existing.thesis, t.relevance ?? existing.relevance, t.popularity ?? existing.popularity, t.status ?? existing.status, now]
    );
  }
  return id;
}

export async function dbDeleteTopic(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from content_topics where id = $1", [id]);
  return rowCount ?? 0;
}

/* ─────────── Источники (§19 ТЗ) — поверх radar_triggers ─────────── */

function toContentSource(r: Record<string, unknown>): ContentSource {
  return {
    id: r.id as string,
    name: r.label as string,
    type: (r.source_type as ContentSource["type"]) || (r.kind === "telegram" ? "telegram" : r.kind === "rss" ? "rss" : "keyword"),
    url: r.query as string,
    external_id: (r.external_id as string) ?? null,
    priority: (r.priority as number) ?? 5,
    active: r.enabled as boolean,
    poll_interval: (r.poll_interval as number) ?? 60,
    categories: (r.categories as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
    last_polled_at: (r.last_polled_at as number) ?? null,
    created_at: r.created_at as number,
  };
}

export async function dbListSources(): Promise<ContentSource[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from radar_triggers order by created_at desc");
  return rows.map(toContentSource);
}

/** type 'website' физически тянется как rss (если по URL есть лента) — своего парсера сайтов пока нет, см. integrations.md. */
function sourceTypeToRadarKind(type: ContentSource["type"]): "keyword" | "rss" | "telegram" {
  if (type === "telegram") return "telegram";
  if (type === "keyword") return "keyword";
  return "rss";
}

export async function dbUpsertSource(s: Partial<ContentSource> & { id?: string; name: string; type: ContentSource["type"]; url: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const id = s.id || randomUUID();
  const kind = sourceTypeToRadarKind(s.type);
  await pool.query(
    `insert into radar_triggers (id, kind, query, label, category, enabled, created_at, priority, poll_interval, categories, tags, external_id, source_type)
     values ($1,$2,$3,$4,'other',$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict (id) do update set
       kind=excluded.kind, query=excluded.query, label=excluded.label, enabled=excluded.enabled,
       priority=excluded.priority, poll_interval=excluded.poll_interval, categories=excluded.categories,
       tags=excluded.tags, external_id=excluded.external_id, source_type=excluded.source_type`,
    [id, kind, s.url, s.name, s.active ?? true, now, s.priority ?? 5, s.poll_interval ?? 60,
      JSON.stringify(s.categories ?? []), JSON.stringify(s.tags ?? []), s.external_id ?? null, s.type]
  );
  return id;
}

export async function dbDeleteSource(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from radar_triggers where id = $1", [id]);
  return rowCount ?? 0;
}

/* ─────────── Кластеры и брифы ─────────── */

export async function dbListClusters(): Promise<ContentCluster[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_clusters order by created_at desc");
  return rows as ContentCluster[];
}

export async function dbGetCluster(id: string): Promise<ContentCluster | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_clusters where id = $1", [id]);
  return (rows[0] as ContentCluster) ?? null;
}

export async function dbUpsertCluster(c: Partial<ContentCluster> & { id?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const id = c.id || randomUUID();
  const existing = c.id ? await dbGetCluster(c.id) : null;
  if (!existing) {
    await pool.query(
      `insert into content_clusters (id, title, primary_topic_id, status, created_by, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, c.title ?? "", c.primary_topic_id ?? null, c.status ?? "new", c.created_by ?? null, now, now]
    );
  } else {
    await pool.query(
      `update content_clusters set title=$2, status=$3, updated_at=$4 where id=$1`,
      [id, c.title ?? existing.title, c.status ?? existing.status, now]
    );
  }
  return id;
}

export async function dbDeleteCluster(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from content_clusters where id = $1", [id]);
  return rowCount ?? 0;
}

export async function dbGetBrief(clusterId: string): Promise<ContentBrief | null> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from content_briefs where cluster_id = $1 order by created_at desc limit 1",
    [clusterId]
  );
  if (!rows[0]) return null;
  return { ...rows[0], channels: rows[0].channels ?? [] } as ContentBrief;
}

export async function dbSaveBrief(b: {
  cluster_id: string;
  audience: string;
  angle: string;
  requirements: string;
  channels: ContentOsChannel[];
  created_by?: string | null;
}): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = randomUUID();
  await pool.query(
    `insert into content_briefs (id, cluster_id, audience, angle, requirements, channels, created_by, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, b.cluster_id, b.audience, b.angle, b.requirements, JSON.stringify(b.channels), b.created_by ?? null, Date.now()]
  );
  await pool.query("update content_clusters set status = 'briefed', updated_at = $2 where id = $1 and status = 'new'", [b.cluster_id, Date.now()]);
  return id;
}

/* ─────────── Контент-айтемы и версии ─────────── */

export async function dbListItemsByCluster(clusterId: string): Promise<ContentItem[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_items where cluster_id = $1 order by created_at asc", [clusterId]);
  return rows.map((r) => ({ ...r, meta: r.meta ?? {} })) as ContentItem[];
}

export async function dbGetItem(id: string): Promise<ContentItem | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_items where id = $1", [id]);
  if (!rows[0]) return null;
  return { ...rows[0], meta: rows[0].meta ?? {} } as ContentItem;
}

export async function dbUpsertItem(it: Partial<ContentItem> & { id?: string; cluster_id: string; channel: ContentOsChannel }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const existing = it.id ? await dbGetItem(it.id) : null;
  if (!existing) {
    const id = it.id || randomUUID();
    await pool.query(
      `insert into content_items (id, cluster_id, channel, status, title, body, meta, scheduled_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, it.cluster_id, it.channel, it.status ?? "draft", it.title ?? "", it.body ?? "", JSON.stringify(it.meta ?? {}), it.scheduled_at ?? null, now, now]
    );
    await pool.query("update content_clusters set status = 'in_production', updated_at = $2 where id = $1 and status in ('new','briefed')", [it.cluster_id, now]);
    return id;
  }
  await pool.query(
    `update content_items set status=$2, title=$3, body=$4, meta=$5, scheduled_at=$6, approved_by=$7, approved_at=$8, updated_at=$9 where id=$1`,
    [existing.id, it.status ?? existing.status, it.title ?? existing.title, it.body ?? existing.body,
      JSON.stringify(it.meta ?? existing.meta), it.scheduled_at !== undefined ? it.scheduled_at : existing.scheduled_at,
      it.approved_by ?? existing.approved_by, it.approved_at ?? existing.approved_at, now]
  );
  return existing.id;
}

const ITEM_WITH_CLUSTER_SELECT = `select i.*, c.title as cluster_title from content_items i join content_clusters c on c.id = i.cluster_id`;

/** Список контент-айтемов за период (для Content Plan, §44 ТЗ) — по всем кластерам. */
export async function dbListItemsScheduled(opts: { from?: number; to?: number } = {}): Promise<ContentItemWithCluster[]> {
  await ready();
  const pool = getTimewebPool();
  const where: string[] = ["i.scheduled_at is not null"];
  const params: unknown[] = [];
  if (opts.from != null) { params.push(opts.from); where.push(`i.scheduled_at >= $${params.length}`); }
  if (opts.to != null) { params.push(opts.to); where.push(`i.scheduled_at < $${params.length}`); }
  const { rows } = await pool.query(`${ITEM_WITH_CLUSTER_SELECT} where ${where.join(" and ")} order by i.scheduled_at asc`, params);
  return rows.map((r) => ({ ...r, meta: r.meta ?? {} })) as ContentItemWithCluster[];
}

/** Все айтемы одного/нескольких каналов (для Articles/Social, §14 ТЗ), с последних. */
export async function dbListItemsByChannel(channel: ContentOsChannel | ContentOsChannel[]): Promise<ContentItemWithCluster[]> {
  await ready();
  const pool = getTimewebPool();
  const channels = Array.isArray(channel) ? channel : [channel];
  const { rows } = await pool.query(`${ITEM_WITH_CLUSTER_SELECT} where i.channel = any($1) order by i.updated_at desc limit 200`, [channels]);
  return rows.map((r) => ({ ...r, meta: r.meta ?? {} })) as ContentItemWithCluster[];
}

export async function dbDeleteItem(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from content_items where id = $1", [id]);
  return rowCount ?? 0;
}

export async function dbAddItemVersion(v: { content_item_id: string; body: string; edited_by?: string | null; note?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = randomUUID();
  await pool.query(
    `insert into content_item_versions (id, content_item_id, body, edited_by, note, created_at) values ($1,$2,$3,$4,$5,$6)`,
    [id, v.content_item_id, v.body, v.edited_by ?? null, v.note ?? "", Date.now()]
  );
  return id;
}

export async function dbListItemVersions(contentItemId: string): Promise<ContentItemVersion[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from content_item_versions where content_item_id = $1 order by created_at desc limit 20",
    [contentItemId]
  );
  return rows as ContentItemVersion[];
}

/* ─────────── Каналы ─────────── */

export async function dbListChannelProfiles(): Promise<ContentChannelProfile[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_channel_profiles order by sort_order asc");
  return rows as ContentChannelProfile[];
}

export async function dbUpsertChannelProfile(p: Partial<ContentChannelProfile> & { id: string }): Promise<void> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_channel_profiles where id = $1", [p.id]);
  const existing = rows[0] as ContentChannelProfile | undefined;
  if (!existing) {
    await pool.query(
      `insert into content_channel_profiles (id, name, status, char_limit, formality, emoji_level, hashtags, hashtag_count, cta, ai_prompt, qa_notes, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.id, p.name ?? p.id, p.status ?? "setup", p.char_limit ?? 4096, p.formality ?? 50, p.emoji_level ?? 1,
        p.hashtags ?? false, p.hashtag_count ?? 0, p.cta ?? "", p.ai_prompt ?? "", p.qa_notes ?? "", p.sort_order ?? 0]
    );
    return;
  }
  await pool.query(
    `update content_channel_profiles set name=$2, status=$3, char_limit=$4, formality=$5, emoji_level=$6,
      hashtags=$7, hashtag_count=$8, cta=$9, ai_prompt=$10, qa_notes=$11 where id=$1`,
    [p.id, p.name ?? existing.name, p.status ?? existing.status, p.char_limit ?? existing.char_limit,
      p.formality ?? existing.formality, p.emoji_level ?? existing.emoji_level, p.hashtags ?? existing.hashtags,
      p.hashtag_count ?? existing.hashtag_count, p.cta ?? existing.cta, p.ai_prompt ?? existing.ai_prompt, p.qa_notes ?? existing.qa_notes]
  );
}

/* ─────────── QC-пайплайн (§27 ТЗ) ─────────── */

export async function dbListQcChecks(contentItemId: string): Promise<ContentQcCheck[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select distinct on (check_type) * from content_qc_checks where content_item_id = $1 order by check_type, created_at desc",
    [contentItemId]
  );
  return rows as ContentQcCheck[];
}

export async function dbAddQcCheck(c: { content_item_id: string; check_type: QcCheckType; status: QcCheckStatus; notes: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = randomUUID();
  await pool.query(
    `insert into content_qc_checks (id, content_item_id, check_type, status, notes, created_at) values ($1,$2,$3,$4,$5,$6)`,
    [id, c.content_item_id, c.check_type, c.status, c.notes, Date.now()]
  );
  return id;
}

/* ─────────── SEO Engine (§23 ТЗ) ─────────── */

export async function dbGetSeo(contentItemId: string): Promise<ContentSeo | null> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_seo where content_item_id = $1", [contentItemId]);
  if (!rows[0]) return null;
  return { ...rows[0], secondary_keywords: rows[0].secondary_keywords ?? [], faq: rows[0].faq ?? [], internal_links: rows[0].internal_links ?? [] } as ContentSeo;
}

export async function dbSaveSeo(s: Partial<ContentSeo> & { content_item_id: string }): Promise<void> {
  await ready();
  const pool = getTimewebPool();
  const existing = await dbGetSeo(s.content_item_id);
  const merged = { ...existing, ...s };
  await pool.query(
    `insert into content_seo (content_item_id, intent, primary_keyword, secondary_keywords, meta_title, meta_description, h1, faq, internal_links, slug, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (content_item_id) do update set
       intent=excluded.intent, primary_keyword=excluded.primary_keyword, secondary_keywords=excluded.secondary_keywords,
       meta_title=excluded.meta_title, meta_description=excluded.meta_description, h1=excluded.h1,
       faq=excluded.faq, internal_links=excluded.internal_links, slug=excluded.slug, updated_at=excluded.updated_at`,
    [s.content_item_id, merged.intent ?? "", merged.primary_keyword ?? "", JSON.stringify(merged.secondary_keywords ?? []),
      merged.meta_title ?? "", merged.meta_description ?? "", merged.h1 ?? "", JSON.stringify(merged.faq ?? []),
      JSON.stringify(merged.internal_links ?? []), merged.slug ?? "", Date.now()]
  );
}

/* ─────────── Research Engine (§22 ТЗ) ─────────── */

export async function dbGetResearchPack(clusterId: string): Promise<(ContentResearchPack & { sources: ContentResearchSource[] }) | null> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_research_packs where cluster_id = $1 order by created_at desc limit 1", [clusterId]);
  const pack = rows[0] as ContentResearchPack | undefined;
  if (!pack) return null;
  const { rows: srcRows } = await pool.query("select * from content_research_sources where pack_id = $1 order by created_at asc", [pack.id]);
  return { ...pack, sources: srcRows as ContentResearchSource[] };
}

export async function dbCreateResearchPack(clusterId: string, summary: string): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = randomUUID();
  await pool.query(`insert into content_research_packs (id, cluster_id, summary, created_at) values ($1,$2,$3,$4)`, [id, clusterId, summary, Date.now()]);
  return id;
}

export async function dbAddResearchSource(s: { pack_id: string; url: string; title: string; extracted_text: string; verified?: boolean }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = randomUUID();
  await pool.query(
    `insert into content_research_sources (id, pack_id, url, title, extracted_text, verified, created_at) values ($1,$2,$3,$4,$5,$6,$7)`,
    [id, s.pack_id, s.url, s.title, s.extracted_text, s.verified ?? false, Date.now()]
  );
  return id;
}

export async function dbListFactChecks(contentItemId: string): Promise<ContentFactCheck[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_fact_checks where content_item_id = $1 order by checked_at desc", [contentItemId]);
  return rows as ContentFactCheck[];
}

export async function dbAddFactCheck(f: { content_item_id: string; claim: string; verdict: ContentFactCheck["verdict"]; source_url?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = randomUUID();
  await pool.query(
    `insert into content_fact_checks (id, content_item_id, claim, verdict, source_url, checked_at) values ($1,$2,$3,$4,$5,$6)`,
    [id, f.content_item_id, f.claim, f.verdict, f.source_url ?? "", Date.now()]
  );
  return id;
}

/* ─────────── Publications (§29 ТЗ) ─────────── */

export async function dbListPublications(): Promise<ContentPublication[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_publications order by created_at desc limit 200");
  return rows as ContentPublication[];
}

export async function dbListPublicationsByItem(contentItemId: string): Promise<ContentPublication[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_publications where content_item_id = $1 order by created_at desc", [contentItemId]);
  return rows as ContentPublication[];
}

/** Идемпотентно (§29 ТЗ): один content_item в один channel — одна активная запись публикации. */
export async function dbUpsertPublication(p: {
  content_item_id: string;
  channel: ContentOsChannel;
  status: PublicationStatus;
  scheduled_at?: number | null;
  published_at?: number | null;
  url?: string | null;
  external_id?: string | null;
  error?: string | null;
}): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from content_publications where content_item_id = $1 and channel = $2 order by created_at desc limit 1",
    [p.content_item_id, p.channel]
  );
  const existing = rows[0] as ContentPublication | undefined;
  const now = Date.now();
  if (!existing) {
    const id = randomUUID();
    await pool.query(
      `insert into content_publications (id, content_item_id, channel, external_id, url, status, scheduled_at, published_at, error, retry_count, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11)`,
      [id, p.content_item_id, p.channel, p.external_id ?? null, p.url ?? null, p.status, p.scheduled_at ?? null, p.published_at ?? null, p.error ?? null, now, now]
    );
    return id;
  }
  await pool.query(
    `update content_publications set status=$2, scheduled_at=$3, published_at=$4, url=$5, external_id=$6, error=$7,
      retry_count = case when $7 is not null then retry_count + 1 else retry_count end, updated_at=$8 where id=$1`,
    [existing.id, p.status, p.scheduled_at ?? existing.scheduled_at, p.published_at ?? existing.published_at,
      p.url ?? existing.url, p.external_id ?? existing.external_id, p.error ?? null, now]
  );
  return existing.id;
}

/* ─────────── Бренд-документы (RAG, без pgvector — см. audit.md §6) ─────────── */

export async function dbListBrandDocuments(): Promise<ContentBrandDocument[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from content_brand_documents where is_active = true order by created_at desc");
  return rows.map((r) => ({
    ...r,
    created_at: new Date(r.created_at).getTime(),
    updated_at: new Date(r.updated_at).getTime(),
  })) as ContentBrandDocument[];
}

export async function dbUpsertBrandDocument(d: { id?: string; title: string; category: string; content: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  if (!d.id) {
    const { rows } = await pool.query(
      `insert into content_brand_documents (title, category, content) values ($1,$2,$3) returning id`,
      [d.title, d.category, d.content]
    );
    return rows[0].id as string;
  }
  await pool.query(
    `update content_brand_documents set title=$2, category=$3, content=$4, updated_at=now() where id=$1`,
    [d.id, d.title, d.category, d.content]
  );
  return d.id;
}

export async function dbDeleteBrandDocument(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("update content_brand_documents set is_active = false where id = $1", [id]);
  return rowCount ?? 0;
}

/* ─────────── AI observability ─────────── */

export async function dbLogAiRun(r: {
  task: ContentOsTask;
  promptVersion?: number | null;
  provider: "local" | "anthropic";
  model: string;
  contentItemId?: string | null;
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  status: "ok" | "error" | "fallback";
  error?: string | null;
}): Promise<void> {
  await dbEnsureContentOsTables();
  const pool = getTimewebPool();
  await pool.query(
    `insert into content_ai_runs (id, task, prompt_version, provider, model, content_item_id, data_classification, input_tokens, output_tokens, latency_ms, status, error, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [randomUUID(), r.task, r.promptVersion ?? null, r.provider, r.model, r.contentItemId ?? null, r.dataClassification ?? "INTERNAL",
      r.inputTokens ?? null, r.outputTokens ?? null, r.latencyMs ?? null, r.status, r.error ?? null, Date.now()]
  );
}

export interface ContentOsStats {
  runsByProvider: { provider: string; n: number }[];
  runsByStatus: { status: string; n: number }[];
  fallbackRate: number;
  itemsByStatus: Record<string, number>;
  clustersByStatus: Record<string, number>;
  publicationsByStatus: Record<string, number>;
  sourcesActive: number;
  upcomingScheduled: ContentItemWithCluster[];
}

export async function dbContentOsStats(): Promise<ContentOsStats> {
  await dbEnsureContentOsTables();
  const pool = getTimewebPool();
  const runsByProvider = (await pool.query("select provider, count(*)::int as n from content_ai_runs group by provider")).rows as { provider: string; n: number }[];
  const runsByStatus = (await pool.query("select status, count(*)::int as n from content_ai_runs group by status")).rows as { status: string; n: number }[];
  const total = runsByStatus.reduce((a, r) => a + r.n, 0);
  const fallback = runsByStatus.find((r) => r.status === "fallback")?.n ?? 0;
  const itemsByStatusRows = (await pool.query("select status, count(*)::int as n from content_items group by status")).rows as { status: string; n: number }[];
  const itemsByStatus: Record<string, number> = {};
  for (const r of itemsByStatusRows) itemsByStatus[r.status] = r.n;
  const clustersByStatusRows = (await pool.query("select status, count(*)::int as n from content_clusters group by status")).rows as { status: string; n: number }[];
  const clustersByStatus: Record<string, number> = {};
  for (const r of clustersByStatusRows) clustersByStatus[r.status] = r.n;
  const publicationsByStatusRows = (await pool.query("select status, count(*)::int as n from content_publications group by status")).rows as { status: string; n: number }[];
  const publicationsByStatus: Record<string, number> = {};
  for (const r of publicationsByStatusRows) publicationsByStatus[r.status] = r.n;
  const sourcesActive = (await pool.query("select count(*)::int as n from radar_triggers where enabled = true")).rows[0]?.n ?? 0;
  const upcomingScheduled = await dbListItemsScheduled({ from: Date.now() });
  return {
    runsByProvider, runsByStatus, fallbackRate: total > 0 ? fallback / total : 0, itemsByStatus, clustersByStatus,
    publicationsByStatus, sourcesActive, upcomingScheduled: upcomingScheduled.slice(0, 5),
  };
}
