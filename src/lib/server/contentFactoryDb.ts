import "server-only";

import { randomUUID } from "node:crypto";
import { getTimewebPool } from "@/lib/timewebPg";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_PLATFORMS,
  DEFAULT_RUBRICS,
  EMPTY_QA,
  type CfBrandSettings,
  type CfPlanItem,
  type CfPlanVersion,
  type CfPlatform,
  type CfQaChecklist,
  type CfRubric,
  type CfTopic,
} from "@/lib/contentFactoryTypes";

export async function dbEnsureContentFactoryTables(): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists cf_rubrics (
      id text primary key,
      name text not null default '',
      icon text not null default '',
      color text not null default '#6b7280',
      sort_order int not null default 0,
      created_at bigint not null default 0
    )
  `);
  await pool.query(`
    create table if not exists cf_topics (
      id text primary key,
      title text not null default '',
      rubric_id text,
      source_name text not null default '',
      source_url text not null default '',
      thesis text not null default '',
      relevance int not null default 5,
      popularity int not null default 50,
      status text not null default 'new',
      radar_item_id text,
      sort_order int not null default 0,
      created_at bigint not null default 0,
      updated_at bigint not null default 0
    )
  `);
  await pool.query(`
    create table if not exists cf_platforms (
      id text primary key,
      name text not null default '',
      icon text not null default '',
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
    create table if not exists cf_plan_items (
      id text primary key,
      topic_id text,
      title text not null default '',
      type text not null default 'post',
      scheduled_at bigint not null default 0,
      platforms jsonb not null default '[]'::jsonb,
      status text not null default 'draft',
      created_at bigint not null default 0,
      updated_at bigint not null default 0
    )
  `);
  await pool.query(`create index if not exists cf_plan_items_sched_idx on cf_plan_items (scheduled_at asc)`);
  await pool.query(`
    create table if not exists cf_plan_versions (
      id text primary key,
      plan_id text not null references cf_plan_items(id) on delete cascade,
      platform_id text not null,
      body text not null default '',
      qa jsonb not null default '{}'::jsonb,
      created_at bigint not null default 0,
      updated_at bigint not null default 0,
      unique(plan_id, platform_id)
    )
  `);
  await pool.query(`
    create table if not exists cf_brand_settings (
      id text primary key default 'default',
      description text not null default '',
      avoid text not null default '',
      utp text not null default '',
      forbidden_words text not null default '',
      updated_at bigint not null default 0
    )
  `);
}

async function seedIfEmpty(): Promise<void> {
  const pool = getTimewebPool();
  const now = Date.now();

  const { rows: rr } = await pool.query("select count(*)::int as n from cf_rubrics");
  if ((rr[0]?.n ?? 0) === 0) {
    for (const r of DEFAULT_RUBRICS) {
      await pool.query(
        `insert into cf_rubrics (id, name, icon, color, sort_order, created_at)
         values ($1,$2,$3,$4,$5,$6) on conflict (id) do nothing`,
        [r.id, r.name, r.icon, r.color, r.sort_order, now]
      );
    }
  }

  const { rows: pr } = await pool.query("select count(*)::int as n from cf_platforms");
  if ((pr[0]?.n ?? 0) === 0) {
    for (const p of DEFAULT_PLATFORMS) {
      await pool.query(
        `insert into cf_platforms (id, name, icon, status, char_limit, formality, emoji_level, hashtags, hashtag_count, cta, ai_prompt, qa_notes, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (id) do nothing`,
        [p.id, p.name, p.icon, p.status, p.char_limit, p.formality, p.emoji_level, p.hashtags, p.hashtag_count, p.cta, p.ai_prompt, p.qa_notes, p.sort_order]
      );
    }
  }

  const { rows: br } = await pool.query("select count(*)::int as n from cf_brand_settings");
  if ((br[0]?.n ?? 0) === 0) {
    await pool.query(
      `insert into cf_brand_settings (id, description, avoid, utp, forbidden_words, updated_at)
       values ('default',$1,$2,$3,$4,$5) on conflict (id) do nothing`,
      [DEFAULT_BRAND_SETTINGS.description, DEFAULT_BRAND_SETTINGS.avoid, DEFAULT_BRAND_SETTINGS.utp, DEFAULT_BRAND_SETTINGS.forbidden_words, now]
    );
  }
}

async function ready(): Promise<void> {
  await dbEnsureContentFactoryTables();
  await seedIfEmpty();
}

/* ─────────── Рубрики ─────────── */

export async function dbListRubrics(): Promise<CfRubric[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cf_rubrics order by sort_order asc, name asc");
  return rows as CfRubric[];
}

export async function dbUpsertRubric(r: Partial<CfRubric> & { id?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = r.id || randomUUID();
  const { rows } = await pool.query("select coalesce(max(sort_order),0)::int as m from cf_rubrics");
  const nextOrder = (rows[0]?.m ?? 0) + 1;
  await pool.query(
    `insert into cf_rubrics (id, name, icon, color, sort_order, created_at)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (id) do update set name = excluded.name, icon = excluded.icon, color = excluded.color`,
    [id, r.name ?? "", r.icon ?? "🏷️", r.color ?? "#6b7280", r.sort_order ?? nextOrder, Date.now()]
  );
  return id;
}

export async function dbDeleteRubric(id: string): Promise<number> {
  const pool = getTimewebPool();
  await pool.query("update cf_topics set rubric_id = null where rubric_id = $1", [id]);
  const { rowCount } = await pool.query("delete from cf_rubrics where id = $1", [id]);
  return rowCount ?? 0;
}

export async function dbReorderRubric(id: string, direction: "up" | "down"): Promise<void> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select id, sort_order from cf_rubrics order by sort_order asc, name asc");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  await pool.query("update cf_rubrics set sort_order = $2 where id = $1", [a.id, b.sort_order]);
  await pool.query("update cf_rubrics set sort_order = $2 where id = $1", [b.id, a.sort_order]);
}

/* ─────────── Темы ─────────── */

export interface CfTopicsQuery {
  status?: string;
  rubric_id?: string;
  q?: string;
}

export async function dbListTopics(opts: CfTopicsQuery = {}): Promise<CfTopic[]> {
  await ready();
  const pool = getTimewebPool();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status) {
    params.push(opts.status);
    where.push(`status = $${params.length}`);
  }
  if (opts.rubric_id) {
    params.push(opts.rubric_id);
    where.push(`rubric_id = $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q.toLowerCase()}%`);
    where.push(`lower(title) like $${params.length}`);
  }
  const sql = `select * from cf_topics ${where.length ? "where " + where.join(" and ") : ""} order by sort_order asc, created_at desc`;
  const { rows } = await pool.query(sql, params);
  return rows as CfTopic[];
}

export async function dbGetTopic(id: string): Promise<CfTopic | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cf_topics where id = $1", [id]);
  return (rows[0] as CfTopic) ?? null;
}

export async function dbUpsertTopic(t: Partial<CfTopic> & { id?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const id = t.id || randomUUID();
  const isNew = !t.id;
  let sortOrder = t.sort_order;
  if (sortOrder == null) {
    const { rows } = await pool.query("select coalesce(max(sort_order),0)::int as m from cf_topics");
    sortOrder = (rows[0]?.m ?? 0) + 1;
  }
  if (isNew) {
    await pool.query(
      `insert into cf_topics (id, title, rubric_id, source_name, source_url, thesis, relevance, popularity, status, radar_item_id, sort_order, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, t.title ?? "", t.rubric_id ?? null, t.source_name ?? "", t.source_url ?? "", t.thesis ?? "",
        t.relevance ?? 5, t.popularity ?? 50, t.status ?? "new", t.radar_item_id ?? null, sortOrder, now, now]
    );
  } else {
    const existing = await dbGetTopic(id);
    if (!existing) throw Object.assign(new Error("Тема не найдена"), { status: 404 });
    await pool.query(
      `update cf_topics set
        title = $2, rubric_id = $3, source_name = $4, source_url = $5, thesis = $6,
        relevance = $7, popularity = $8, status = $9, sort_order = $10, updated_at = $11
       where id = $1`,
      [id, t.title ?? existing.title, t.rubric_id ?? existing.rubric_id, t.source_name ?? existing.source_name,
        t.source_url ?? existing.source_url, t.thesis ?? existing.thesis, t.relevance ?? existing.relevance,
        t.popularity ?? existing.popularity, t.status ?? existing.status, t.sort_order ?? existing.sort_order, now]
    );
  }
  return id;
}

export async function dbDeleteTopic(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from cf_topics where id = $1", [id]);
  return rowCount ?? 0;
}

export async function dbReorderTopic(id: string, direction: "up" | "down"): Promise<void> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select id, sort_order from cf_topics order by sort_order asc, created_at desc");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  await pool.query("update cf_topics set sort_order = $2 where id = $1", [a.id, b.sort_order]);
  await pool.query("update cf_topics set sort_order = $2 where id = $1", [b.id, a.sort_order]);
}

/* ─────────── Платформы ─────────── */

export async function dbListPlatforms(): Promise<CfPlatform[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cf_platforms order by sort_order asc");
  return rows as CfPlatform[];
}

export async function dbUpsertPlatform(p: Partial<CfPlatform> & { id?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const id = p.id || randomUUID();
  const { rows } = await pool.query("select * from cf_platforms where id = $1", [id]);
  const existing = rows[0] as CfPlatform | undefined;
  if (!existing) {
    const { rows: mrows } = await pool.query("select coalesce(max(sort_order),0)::int as m from cf_platforms");
    const nextOrder = (mrows[0]?.m ?? 0) + 1;
    await pool.query(
      `insert into cf_platforms (id, name, icon, status, char_limit, formality, emoji_level, hashtags, hashtag_count, cta, ai_prompt, qa_notes, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, p.name ?? "Новая платформа", p.icon ?? "📣", p.status ?? "setup", p.char_limit ?? 4096,
        p.formality ?? 50, p.emoji_level ?? 1, p.hashtags ?? false, p.hashtag_count ?? 0,
        p.cta ?? "", p.ai_prompt ?? "", p.qa_notes ?? "", p.sort_order ?? nextOrder]
    );
  } else {
    await pool.query(
      `update cf_platforms set name=$2, icon=$3, status=$4, char_limit=$5, formality=$6, emoji_level=$7,
        hashtags=$8, hashtag_count=$9, cta=$10, ai_prompt=$11, qa_notes=$12 where id=$1`,
      [id, p.name ?? existing.name, p.icon ?? existing.icon, p.status ?? existing.status,
        p.char_limit ?? existing.char_limit, p.formality ?? existing.formality, p.emoji_level ?? existing.emoji_level,
        p.hashtags ?? existing.hashtags, p.hashtag_count ?? existing.hashtag_count, p.cta ?? existing.cta,
        p.ai_prompt ?? existing.ai_prompt, p.qa_notes ?? existing.qa_notes]
    );
  }
  return id;
}

export async function dbDeletePlatform(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from cf_platforms where id = $1", [id]);
  return rowCount ?? 0;
}

/* ─────────── Бренд-настройки ─────────── */

export async function dbGetBrandSettings(): Promise<CfBrandSettings> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cf_brand_settings where id = 'default'");
  if (!rows[0]) return DEFAULT_BRAND_SETTINGS;
  return rows[0] as CfBrandSettings;
}

export async function dbSaveBrandSettings(b: Partial<CfBrandSettings>): Promise<void> {
  await ready();
  const pool = getTimewebPool();
  const current = await dbGetBrandSettings();
  await pool.query(
    `insert into cf_brand_settings (id, description, avoid, utp, forbidden_words, updated_at)
     values ('default',$1,$2,$3,$4,$5)
     on conflict (id) do update set description=excluded.description, avoid=excluded.avoid, utp=excluded.utp, forbidden_words=excluded.forbidden_words, updated_at=excluded.updated_at`,
    [b.description ?? current.description, b.avoid ?? current.avoid, b.utp ?? current.utp, b.forbidden_words ?? current.forbidden_words, Date.now()]
  );
}

/* ─────────── Контент-план ─────────── */

export interface CfPlanQuery {
  from?: number;
  to?: number;
}

export async function dbListPlanItems(opts: CfPlanQuery = {}): Promise<CfPlanItem[]> {
  await ready();
  const pool = getTimewebPool();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.from != null) {
    params.push(opts.from);
    where.push(`scheduled_at >= $${params.length}`);
  }
  if (opts.to != null) {
    params.push(opts.to);
    where.push(`scheduled_at < $${params.length}`);
  }
  const sql = `select * from cf_plan_items ${where.length ? "where " + where.join(" and ") : ""} order by scheduled_at asc`;
  const { rows } = await pool.query(sql, params);
  return rows.map((r) => ({ ...r, platforms: r.platforms ?? [] })) as CfPlanItem[];
}

export async function dbGetPlanItem(id: string): Promise<CfPlanItem | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cf_plan_items where id = $1", [id]);
  if (!rows[0]) return null;
  return { ...rows[0], platforms: rows[0].platforms ?? [] } as CfPlanItem;
}

export async function dbUpsertPlanItem(p: Partial<CfPlanItem> & { id?: string }): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const id = p.id || randomUUID();
  const existing = p.id ? await dbGetPlanItem(p.id) : null;
  if (!existing) {
    await pool.query(
      `insert into cf_plan_items (id, topic_id, title, type, scheduled_at, platforms, status, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, p.topic_id ?? null, p.title ?? "", p.type ?? "post", p.scheduled_at ?? now,
        JSON.stringify(p.platforms ?? []), p.status ?? "draft", now, now]
    );
  } else {
    await pool.query(
      `update cf_plan_items set topic_id=$2, title=$3, type=$4, scheduled_at=$5, platforms=$6, status=$7, updated_at=$8 where id=$1`,
      [id, p.topic_id ?? existing.topic_id, p.title ?? existing.title, p.type ?? existing.type,
        p.scheduled_at ?? existing.scheduled_at, JSON.stringify(p.platforms ?? existing.platforms),
        p.status ?? existing.status, now]
    );
  }
  return id;
}

export async function dbDeletePlanItem(id: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from cf_plan_items where id = $1", [id]);
  return rowCount ?? 0;
}

/* ─────────── Платформенные версии (редактор) ─────────── */

export async function dbListPlanVersions(planId: string): Promise<CfPlanVersion[]> {
  await ready();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cf_plan_versions where plan_id = $1", [planId]);
  return rows.map((r) => ({ ...r, qa: { ...EMPTY_QA, ...(r.qa ?? {}) } })) as CfPlanVersion[];
}

export async function dbUpsertPlanVersion(v: {
  plan_id: string;
  platform_id: string;
  body?: string;
  qa?: Partial<CfQaChecklist>;
}): Promise<string> {
  await ready();
  const pool = getTimewebPool();
  const now = Date.now();
  const { rows } = await pool.query(
    "select * from cf_plan_versions where plan_id = $1 and platform_id = $2",
    [v.plan_id, v.platform_id]
  );
  const existing = rows[0] as CfPlanVersion | undefined;
  const qa = { ...EMPTY_QA, ...(existing?.qa ?? {}), ...(v.qa ?? {}) };
  if (!existing) {
    const id = randomUUID();
    await pool.query(
      `insert into cf_plan_versions (id, plan_id, platform_id, body, qa, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, v.plan_id, v.platform_id, v.body ?? "", JSON.stringify(qa), now, now]
    );
    return id;
  }
  await pool.query(
    `update cf_plan_versions set body=$3, qa=$4, updated_at=$5 where plan_id=$1 and platform_id=$2`,
    [v.plan_id, v.platform_id, v.body ?? existing.body, JSON.stringify(qa), now]
  );
  return existing.id;
}

export async function dbDeletePlanVersion(planId: string, platformId: string): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    "delete from cf_plan_versions where plan_id = $1 and platform_id = $2",
    [planId, platformId]
  );
  return rowCount ?? 0;
}

/* ─────────── Аналитика (внутренняя, без внешних API) ─────────── */

export interface CfStats {
  topicsByStatus: Record<string, number>;
  topicsByRubric: { rubric_id: string | null; n: number }[];
  planByStatus: Record<string, number>;
  planByPlatform: { platform_id: string; n: number }[];
  planByType: Record<string, number>;
  topTopics: CfTopic[];
  upcoming: CfPlanItem[];
}

export async function dbContentFactoryStats(): Promise<CfStats> {
  await ready();
  const pool = getTimewebPool();

  const topicsByStatusRows = (await pool.query("select status, count(*)::int as n from cf_topics group by status")).rows;
  const topicsByStatus: Record<string, number> = {};
  for (const r of topicsByStatusRows as { status: string; n: number }[]) topicsByStatus[r.status] = r.n;

  const topicsByRubric = (await pool.query("select rubric_id, count(*)::int as n from cf_topics group by rubric_id")).rows as
    { rubric_id: string | null; n: number }[];

  const planByStatusRows = (await pool.query("select status, count(*)::int as n from cf_plan_items group by status")).rows;
  const planByStatus: Record<string, number> = {};
  for (const r of planByStatusRows as { status: string; n: number }[]) planByStatus[r.status] = r.n;

  const planByTypeRows = (await pool.query("select type, count(*)::int as n from cf_plan_items group by type")).rows;
  const planByType: Record<string, number> = {};
  for (const r of planByTypeRows as { type: string; n: number }[]) planByType[r.type] = r.n;

  const planByPlatformRows = (
    await pool.query(
      `select platform, count(*)::int as n from cf_plan_items, jsonb_array_elements_text(platforms) as platform group by platform`
    )
  ).rows as { platform: string; n: number }[];
  const planByPlatform = planByPlatformRows.map((r) => ({ platform_id: r.platform, n: r.n }));

  const topTopics = (
    await pool.query("select * from cf_topics order by popularity desc, relevance desc limit 8")
  ).rows as CfTopic[];

  const now = Date.now();
  const upcoming = (
    await pool.query("select * from cf_plan_items where scheduled_at >= $1 order by scheduled_at asc limit 5", [now])
  ).rows.map((r) => ({ ...r, platforms: r.platforms ?? [] })) as CfPlanItem[];

  return { topicsByStatus, topicsByRubric, planByStatus, planByPlatform, planByType, topTopics, upcoming };
}
