import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { DEFAULT_MEETING_TYPES } from "@/lib/ai/prompts/meetingPrompts";
import type { MtsRecord } from "@/lib/server/mtsLink/client";

/** Встречи (ВКС МТС Линк): записи, расшифровка, роли, анализ; типы встреч с собственными промтами и скриптами. */

export type MeetingStatus =
  | "NEW" | "CONVERTING" | "TRANSCRIBING" | "TRANSCRIBED" | "ANALYZING" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface MeetingStep { key: string; title: string }

export interface MeetingType {
  id: string; name: string; slug: string | null; description: string; keywords: string[];
  prompt: string; steps: MeetingStep[]; isDefault: boolean; isActive: boolean; sort: number;
}

let ensured: Promise<void> | null = null;

export function ensureMeetingsSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const pool = getTimewebPool();
      await pool.query(`
        create table if not exists ai_meeting_types (
          id uuid primary key default gen_random_uuid(),
          name text not null, slug text unique, description text not null default '',
          keywords text[] not null default '{}', prompt text not null default '',
          steps jsonb not null default '[]'::jsonb, is_default boolean not null default false,
          is_active boolean not null default true, sort integer not null default 100,
          created_at timestamptz not null default now(), updated_at timestamptz not null default now()
        );
        create table if not exists ai_meetings (
          id uuid primary key default gen_random_uuid(),
          source text not null default 'mts-link',
          external_record_id text not null unique,
          external_session_id text, title text, link text,
          started_at timestamptz, duration_sec integer, size_bytes bigint,
          status text not null default 'NEW',
          conversion_id text, download_url text,
          type_id uuid references ai_meeting_types (id) on delete set null,
          type_source text,
          full_text text, speakers jsonb not null default '[]'::jsonb,
          analysis jsonb, summary text, script_score integer,
          error text, raw jsonb,
          created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
          analyzed_at timestamptz
        );
        create index if not exists idx_ai_meetings_started on ai_meetings (started_at desc);
        create index if not exists idx_ai_meetings_status on ai_meetings (status);
        create table if not exists ai_meeting_segments (
          id uuid primary key default gen_random_uuid(),
          meeting_id uuid not null references ai_meetings (id) on delete cascade,
          idx integer not null, speaker_label text, role text,
          start_ms integer, end_ms integer, text text not null,
          unique (meeting_id, idx)
        );
      `);
      // Стандартные типы — один раз, если таблица пуста.
      const { rows } = await pool.query<{ n: string }>(`select count(*)::text n from ai_meeting_types`);
      if (Number(rows[0].n) === 0) {
        let sort = 10;
        for (const t of DEFAULT_MEETING_TYPES) {
          await pool.query(
            `insert into ai_meeting_types (name, slug, description, keywords, prompt, steps, is_default, sort)
             values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) on conflict (slug) do nothing`,
            [t.name, t.slug, t.description, t.keywords, t.prompt, JSON.stringify(t.steps.map((title, i) => ({ key: `step_${i + 1}`, title }))), t.isDefault, sort]
          );
          sort += 10;
        }
      }
    })().catch((e) => { ensured = null; throw e; });
  }
  return ensured;
}

/* ───────────── типы встреч ───────────── */

interface TypeRow { id: string; name: string; slug: string | null; description: string; keywords: string[]; prompt: string; steps: unknown; is_default: boolean; is_active: boolean; sort: number }
const mapType = (r: TypeRow): MeetingType => ({
  id: r.id, name: r.name, slug: r.slug, description: r.description, keywords: r.keywords ?? [], prompt: r.prompt,
  steps: Array.isArray(r.steps) ? (r.steps as MeetingStep[]) : [], isDefault: r.is_default, isActive: r.is_active, sort: r.sort,
});

export async function listMeetingTypes(includeInactive = false): Promise<MeetingType[]> {
  await ensureMeetingsSchema();
  const { rows } = await getTimewebPool().query<TypeRow>(`select * from ai_meeting_types ${includeInactive ? "" : "where is_active"} order by sort asc, name asc`);
  return rows.map(mapType);
}

export async function getMeetingType(id: string): Promise<MeetingType | null> {
  await ensureMeetingsSchema();
  const { rows } = await getTimewebPool().query<TypeRow>(`select * from ai_meeting_types where id = $1`, [id]);
  return rows[0] ? mapType(rows[0]) : null;
}

function normSteps(raw: unknown): MeetingStep[] {
  const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split("\n") : [];
  return arr.map((x, i) => {
    const title = (typeof x === "string" ? x : String((x as { title?: string })?.title ?? "")).trim();
    return title ? { key: `step_${i + 1}`, title } : null;
  }).filter((s): s is MeetingStep => !!s);
}

export async function saveMeetingType(t: { id?: string; name: string; description?: string; keywords?: string[] | string; prompt: string; steps?: unknown; isDefault?: boolean }): Promise<string> {
  await ensureMeetingsSchema();
  const pool = getTimewebPool();
  const keywords = (Array.isArray(t.keywords) ? t.keywords : String(t.keywords ?? "").split(/[,\n]/)).map((k) => k.trim().toLowerCase()).filter(Boolean);
  const steps = JSON.stringify(normSteps(t.steps));
  if (t.isDefault) await pool.query(`update ai_meeting_types set is_default = false where is_default`);
  if (t.id) {
    await pool.query(`update ai_meeting_types set name=$2, description=$3, keywords=$4, prompt=$5, steps=$6::jsonb, is_default=$7, updated_at=now() where id=$1`,
      [t.id, t.name.trim(), t.description ?? "", keywords, t.prompt, steps, !!t.isDefault]);
    return t.id;
  }
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_meeting_types (name, description, keywords, prompt, steps, is_default, sort)
     values ($1,$2,$3,$4,$5::jsonb,$6, coalesce((select max(sort) + 10 from ai_meeting_types), 10)) returning id`,
    [t.name.trim(), t.description ?? "", keywords, t.prompt, steps, !!t.isDefault]);
  return rows[0].id;
}

export async function deleteMeetingType(id: string): Promise<void> {
  await ensureMeetingsSchema();
  await getTimewebPool().query(`update ai_meeting_types set is_active = false, is_default = false, updated_at = now() where id = $1`, [id]);
}

/* ───────────── встречи ───────────── */

export interface MeetingRow {
  id: string; externalRecordId: string; externalSessionId: string | null; title: string | null; link: string | null;
  startedAt: string | null; durationSec: number | null; sizeBytes: number | null; status: MeetingStatus;
  conversionId: string | null; typeId: string | null; typeName: string | null; typeSource: string | null;
  speakers: Array<{ label: string; role: string; name: string | null }>; summary: string | null; scriptScore: number | null;
  analysis: Record<string, unknown> | null; error: string | null; createdAt: string; analyzedAt: string | null;
}

interface Raw {
  id: string; external_record_id: string; external_session_id: string | null; title: string | null; link: string | null;
  started_at: Date | null; duration_sec: number | null; size_bytes: string | null; status: MeetingStatus;
  conversion_id: string | null; type_id: string | null; type_name?: string | null; type_source: string | null;
  speakers: MeetingRow["speakers"] | null; summary: string | null; script_score: number | null;
  analysis: Record<string, unknown> | null; error: string | null; created_at: Date; analyzed_at: Date | null;
}
const map = (r: Raw): MeetingRow => ({
  id: r.id, externalRecordId: r.external_record_id, externalSessionId: r.external_session_id, title: r.title, link: r.link,
  startedAt: r.started_at?.toISOString() ?? null, durationSec: r.duration_sec, sizeBytes: r.size_bytes ? Number(r.size_bytes) : null,
  status: r.status, conversionId: r.conversion_id, typeId: r.type_id, typeName: r.type_name ?? null, typeSource: r.type_source,
  speakers: Array.isArray(r.speakers) ? r.speakers : [], summary: r.summary, scriptScore: r.script_score, analysis: r.analysis,
  error: r.error, createdAt: r.created_at.toISOString(), analyzedAt: r.analyzed_at?.toISOString() ?? null,
});

/** Добавить новые записи (существующие не трогаем). Возвращает ID новых встреч. */
export async function insertNewRecords(records: MtsRecord[], opts: { minDurationSec?: number } = {}): Promise<string[]> {
  await ensureMeetingsSchema();
  const pool = getTimewebPool();
  const ids: string[] = [];
  for (const r of records) {
    const tooShort = opts.minDurationSec && r.durationSec != null && r.durationSec < opts.minDurationSec;
    const { rows } = await pool.query<{ id: string }>(
      `insert into ai_meetings (external_record_id, external_session_id, title, link, started_at, duration_sec, size_bytes, raw, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) on conflict (external_record_id) do nothing returning id`,
      [r.id, r.eventSessionId, r.name, r.link, r.startedAt, r.durationSec, r.size, JSON.stringify(r.raw), tooShort ? "SKIPPED" : "NEW"]
    );
    if (rows[0] && !tooShort) ids.push(rows[0].id);
  }
  return ids;
}

const SELECT = `select m.*, t.name as type_name from ai_meetings m left join ai_meeting_types t on t.id = m.type_id`;

export async function getMeeting(id: string): Promise<(MeetingRow & { fullText: string | null; downloadUrl: string | null }) | null> {
  await ensureMeetingsSchema();
  const { rows } = await getTimewebPool().query<Raw & { full_text: string | null; download_url: string | null }>(`${SELECT} where m.id = $1`, [id]);
  return rows[0] ? { ...map(rows[0]), fullText: rows[0].full_text, downloadUrl: rows[0].download_url } : null;
}

export async function listMeetings(f: { status?: string | null; typeId?: string | null; q?: string | null; limit?: number; offset?: number }): Promise<{ items: MeetingRow[]; total: number }> {
  await ensureMeetingsSchema();
  const pool = getTimewebPool();
  const where: string[] = ["true"]; const params: unknown[] = [];
  if (f.status) { params.push(f.status); where.push(`m.status = $${params.length}`); }
  if (f.typeId) { params.push(f.typeId); where.push(`m.type_id = $${params.length}`); }
  if (f.q?.trim()) { params.push(`%${f.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`); where.push(`(m.title ilike $${params.length} or m.summary ilike $${params.length})`); }
  const w = where.join(" and ");
  const total = await pool.query<{ n: string }>(`select count(*)::text n from ai_meetings m where ${w}`, params);
  const rows = await pool.query<Raw>(`${SELECT} where ${w} order by m.started_at desc nulls last, m.created_at desc limit ${Math.min(f.limit ?? 50, 200)} offset ${f.offset ?? 0}`, params);
  return { items: rows.rows.map(map), total: Number(total.rows[0]?.n ?? 0) };
}

export async function updateMeeting(id: string, patch: Partial<{
  status: MeetingStatus; conversionId: string | null; downloadUrl: string | null; typeId: string | null; typeSource: string | null;
  fullText: string | null; speakers: unknown; analysis: unknown; summary: string | null; scriptScore: number | null; error: string | null;
  durationSec: number | null; analyzedAt: boolean;
}>): Promise<void> {
  const sets: string[] = ["updated_at = now()"]; const params: unknown[] = [id];
  const add = (col: string, v: unknown, cast = "") => { params.push(v); sets.push(`${col} = $${params.length}${cast}`); };
  if (patch.status !== undefined) add("status", patch.status);
  if (patch.conversionId !== undefined) add("conversion_id", patch.conversionId);
  if (patch.downloadUrl !== undefined) add("download_url", patch.downloadUrl);
  if (patch.typeId !== undefined) add("type_id", patch.typeId);
  if (patch.typeSource !== undefined) add("type_source", patch.typeSource);
  if (patch.fullText !== undefined) add("full_text", patch.fullText);
  if (patch.speakers !== undefined) add("speakers", JSON.stringify(patch.speakers), "::jsonb");
  if (patch.analysis !== undefined) add("analysis", patch.analysis == null ? null : JSON.stringify(patch.analysis), "::jsonb");
  if (patch.summary !== undefined) add("summary", patch.summary);
  if (patch.scriptScore !== undefined) add("script_score", patch.scriptScore);
  if (patch.error !== undefined) add("error", patch.error);
  if (patch.durationSec !== undefined) add("duration_sec", patch.durationSec);
  if (patch.analyzedAt) sets.push("analyzed_at = now()");
  await getTimewebPool().query(`update ai_meetings set ${sets.join(", ")} where id = $1`, params);
}

export interface MeetingSegment { idx: number; speakerLabel: string | null; role: string | null; startMs: number | null; endMs: number | null; text: string }

export async function saveMeetingSegments(meetingId: string, segs: Array<{ idx: number; speakerLabel: string | null; startMs: number | null; endMs: number | null; text: string }>): Promise<void> {
  const pool = getTimewebPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`delete from ai_meeting_segments where meeting_id = $1`, [meetingId]);
    for (const s of segs) {
      await client.query(`insert into ai_meeting_segments (meeting_id, idx, speaker_label, start_ms, end_ms, text) values ($1,$2,$3,$4,$5,$6) on conflict (meeting_id, idx) do nothing`,
        [meetingId, s.idx, s.speakerLabel, s.startMs, s.endMs, s.text]);
    }
    await client.query("commit");
  } catch (e) { await client.query("rollback"); throw e; } finally { client.release(); }
}

export async function getMeetingSegments(meetingId: string): Promise<MeetingSegment[]> {
  const { rows } = await getTimewebPool().query<{ idx: number; speaker_label: string | null; role: string | null; start_ms: number | null; end_ms: number | null; text: string }>(
    `select idx, speaker_label, role, start_ms, end_ms, text from ai_meeting_segments where meeting_id = $1 order by idx`, [meetingId]);
  return rows.map((r) => ({ idx: r.idx, speakerLabel: r.speaker_label, role: r.role, startMs: r.start_ms, endMs: r.end_ms, text: r.text }));
}

export async function setSegmentRoles(meetingId: string, roles: Record<string, string>): Promise<void> {
  for (const [label, role] of Object.entries(roles)) {
    await getTimewebPool().query(`update ai_meeting_segments set role = $3 where meeting_id = $1 and speaker_label = $2`, [meetingId, label, role]);
  }
}
