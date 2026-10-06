import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/** Информационный триггер, найденный в интернете. */
export interface BriefTrigger {
  title: string;
  date: string | null;   // YYYY-MM-DD, если указана в источнике
  url: string | null;
  source: string | null; // домен/название источника
  kind: string | null;   // news | procurement | budget | competitor | neighbors | other
  isNew?: boolean;       // не встречался в прошлых брифах по этой сущности
}

export type BriefEntity = "lead" | "deal";

export interface BriefRow {
  id: string;
  entityType: BriefEntity;
  entityId: string;
  title: string | null;
  companyTitle: string | null;
  managerName: string | null;
  bitrixUserId: string | null;
  briefText: string | null;
  triggers: BriefTrigger[];
  newTriggers: number;
  status: "READY" | "FAILED";
  error: string | null;
  pushedAt: string | null;
  notifiedAt: string | null;
  seenAt: string | null;
  createdAt: string;
  bitrixUrl: string | null;
}

let ensured: Promise<void> | null = null;

/** Идемпотентно создаёт таблицу (раннера миграций в проекте нет). */
export function ensureBriefsSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const pool = getTimewebPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_briefs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type text NOT NULL CHECK (entity_type IN ('lead', 'deal')),
          bitrix_entity_id text NOT NULL,
          title text, company_title text, bitrix_user_id text,
          brief_text text,
          triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
          new_triggers integer NOT NULL DEFAULT 0,
          status text NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'FAILED')),
          error text,
          pushed_at timestamptz, notified_at timestamptz, seen_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_ai_briefs_entity ON ai_briefs (entity_type, bitrix_entity_id, created_at DESC);
      `);
    })().catch((e) => { ensured = null; throw e; });
  }
  return ensured;
}

interface Raw {
  id: string; entity_type: BriefEntity; bitrix_entity_id: string; title: string | null; company_title: string | null;
  bitrix_user_id: string | null; manager_name?: string | null; brief_text: string | null; triggers: BriefTrigger[] | null;
  new_triggers: number; status: "READY" | "FAILED"; error: string | null;
  pushed_at: Date | null; notified_at: Date | null; seen_at: Date | null; created_at: Date;
}

function map(r: Raw, withText: boolean): BriefRow {
  const origin = bitrixPortalOrigin();
  return {
    id: r.id, entityType: r.entity_type, entityId: r.bitrix_entity_id, title: r.title, companyTitle: r.company_title,
    managerName: r.manager_name ?? null, bitrixUserId: r.bitrix_user_id,
    briefText: withText ? r.brief_text : null,
    triggers: Array.isArray(r.triggers) ? r.triggers : [],
    newTriggers: r.new_triggers, status: r.status, error: r.error,
    pushedAt: r.pushed_at?.toISOString() ?? null, notifiedAt: r.notified_at?.toISOString() ?? null,
    seenAt: r.seen_at?.toISOString() ?? null, createdAt: r.created_at.toISOString(),
    bitrixUrl: origin ? `${origin}/crm/${r.entity_type}/details/${r.bitrix_entity_id}/` : null,
  };
}

export async function insertBrief(b: {
  entityType: BriefEntity; entityId: string; title: string | null; companyTitle: string | null; bitrixUserId: string | null;
  briefText: string | null; triggers: BriefTrigger[]; newTriggers: number; status: "READY" | "FAILED"; error?: string | null;
}): Promise<string> {
  await ensureBriefsSchema();
  const { rows } = await getTimewebPool().query<{ id: string }>(
    `insert into ai_briefs (entity_type, bitrix_entity_id, title, company_title, bitrix_user_id, brief_text, triggers, new_triggers, status, error)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10) returning id`,
    [b.entityType, b.entityId, b.title, b.companyTitle, b.bitrixUserId, b.briefText, JSON.stringify(b.triggers), b.newTriggers, b.status, b.error ?? null]
  );
  return rows[0].id;
}

export async function markBrief(id: string, patch: { pushed?: boolean; notified?: boolean }): Promise<void> {
  const sets: string[] = [];
  if (patch.pushed) sets.push("pushed_at = now()");
  if (patch.notified) sets.push("notified_at = now()");
  if (!sets.length) return;
  await getTimewebPool().query(`update ai_briefs set ${sets.join(", ")} where id = $1`, [id]);
}

/** URL всех триггеров из прошлых (успешных) брифов по сущности — для отметки «новое». */
export async function previousTriggerUrls(entityType: BriefEntity, entityId: string): Promise<Set<string>> {
  await ensureBriefsSchema();
  const { rows } = await getTimewebPool().query<{ triggers: BriefTrigger[] | null }>(
    `select triggers from ai_briefs where entity_type = $1 and bitrix_entity_id = $2 and status = 'READY'`,
    [entityType, entityId]
  );
  const out = new Set<string>();
  for (const r of rows) for (const t of r.triggers ?? []) if (t.url) out.add(t.url);
  return out;
}

export async function hasBrief(entityType: BriefEntity, entityId: string): Promise<boolean> {
  await ensureBriefsSchema();
  const { rows } = await getTimewebPool().query(
    `select 1 from ai_briefs where entity_type = $1 and bitrix_entity_id = $2 limit 1`, [entityType, entityId]
  );
  return rows.length > 0;
}

export async function listBriefs(f: { managerBitrixId?: string | null; entityType?: string | null; onlyNew?: boolean; q?: string | null; limit?: number; offset?: number }): Promise<{ items: BriefRow[]; total: number; unseenNew: number }> {
  await ensureBriefsSchema();
  const pool = getTimewebPool();
  const where: string[] = ["true"];
  const params: unknown[] = [];
  if (f.entityType === "lead" || f.entityType === "deal") { params.push(f.entityType); where.push(`b.entity_type = $${params.length}`); }
  if (f.managerBitrixId) { params.push(f.managerBitrixId); where.push(`b.bitrix_user_id = $${params.length}`); }
  if (f.onlyNew) where.push(`b.new_triggers > 0 and b.seen_at is null`);
  if (f.q?.trim()) {
    params.push(`%${f.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    where.push(`(b.title ilike $${params.length} or b.company_title ilike $${params.length} or b.bitrix_entity_id = $${params.length + 1})`);
    params.push(f.q.trim());
  }
  // Показываем только последний бриф по каждой сущности.
  const latest = `b.id = (select b2.id from ai_briefs b2 where b2.entity_type = b.entity_type and b2.bitrix_entity_id = b.bitrix_entity_id order by (b2.status = 'READY') desc, b2.created_at desc limit 1)`;
  const whereSql = `${where.join(" and ")} and ${latest}`;
  const limit = Math.min(f.limit ?? 50, 200);
  const offset = f.offset ?? 0;
  const total = await pool.query<{ n: string }>(`select count(*)::text n from ai_briefs b where ${whereSql}`, params);
  const rows = await pool.query<Raw>(
    `select b.*, m.full_name as manager_name from ai_briefs b
       left join ai_managers m on m.bitrix_user_id = b.bitrix_user_id
      where ${whereSql}
      order by (b.new_triggers > 0 and b.seen_at is null) desc, b.created_at desc
      limit ${limit} offset ${offset}`, params);
  const unseen = await pool.query<{ n: string }>(`select count(*)::text n from ai_briefs b where b.new_triggers > 0 and b.seen_at is null and ${latest}`);
  return { items: rows.rows.map((r) => map(r, false)), total: Number(total.rows[0]?.n ?? 0), unseenNew: Number(unseen.rows[0]?.n ?? 0) };
}

export async function markBriefSeen(id: string): Promise<void> {
  await getTimewebPool().query(`update ai_briefs set seen_at = now() where id = $1 and seen_at is null`, [id]);
}

export async function getBrief(id: string, markSeen = true): Promise<{ brief: BriefRow; history: Array<{ id: string; createdAt: string; newTriggers: number }> } | null> {
  await ensureBriefsSchema();
  const pool = getTimewebPool();
  const { rows } = await pool.query<Raw>(
    `select b.*, m.full_name as manager_name from ai_briefs b left join ai_managers m on m.bitrix_user_id = b.bitrix_user_id where b.id = $1`, [id]);
  if (!rows[0]) return null;
  if (markSeen && !rows[0].seen_at) await pool.query(`update ai_briefs set seen_at = now() where id = $1`, [id]);
  const h = await pool.query<{ id: string; created_at: Date; new_triggers: number }>(
    `select id, created_at, new_triggers from ai_briefs where entity_type = $1 and bitrix_entity_id = $2 order by created_at desc limit 20`,
    [rows[0].entity_type, rows[0].bitrix_entity_id]);
  return { brief: map(rows[0], true), history: h.rows.map((x) => ({ id: x.id, createdAt: x.created_at.toISOString(), newTriggers: x.new_triggers })) };
}
