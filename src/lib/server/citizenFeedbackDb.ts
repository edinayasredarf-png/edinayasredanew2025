import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Обратная связь от граждан (с кампейн-страниц: помощь городу и т.п.).
 *  info   — просто оставить информацию
 *  access — заявка на доступ к «Единой среде» для внесения данных на карту
 */
export type CitizenFeedbackType = "info" | "access";

export interface CitizenFeedbackInput {
  type: CitizenFeedbackType;
  fio: string;
  phone: string;
  email: string;
  region?: string;
  message?: string;
  source?: string;
}

export interface CitizenFeedbackRow extends CitizenFeedbackInput {
  id: string;
  handled: boolean;
  created_at: string;
}

let ensured = false;
async function ensureTable(): Promise<void> {
  if (ensured) return;
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists citizen_feedback (
      id bigserial primary key,
      type text not null default 'info',
      fio text not null default '',
      phone text not null default '',
      email text not null default '',
      region text not null default '',
      message text not null default '',
      source text not null default '',
      handled boolean not null default false,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(
    `create index if not exists citizen_feedback_created_idx on citizen_feedback (created_at desc)`
  );
  ensured = true;
}

export async function dbInsertCitizenFeedback(input: CitizenFeedbackInput): Promise<void> {
  await ensureTable();
  const pool = getTimewebPool();
  await pool.query(
    `insert into citizen_feedback (type, fio, phone, email, region, message, source)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [
      input.type === "access" ? "access" : "info",
      (input.fio || "").slice(0, 300),
      (input.phone || "").slice(0, 60),
      (input.email || "").slice(0, 200),
      (input.region || "").slice(0, 300),
      (input.message || "").slice(0, 4000),
      (input.source || "").slice(0, 120),
    ]
  );
}

export async function dbListCitizenFeedback(opts: { type?: string; limit?: number } = {}): Promise<CitizenFeedbackRow[]> {
  await ensureTable();
  const pool = getTimewebPool();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.type && opts.type !== "all") {
    params.push(opts.type);
    where.push(`type = $${params.length}`);
  }
  params.push(Math.min(Math.max(opts.limit ?? 500, 1), 2000));
  const { rows } = await pool.query(
    `select id, type, fio, phone, email, region, message, source, handled, created_at
       from citizen_feedback
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by created_at desc, id desc
      limit $${params.length}`,
    params
  );
  return rows as CitizenFeedbackRow[];
}

export async function dbSetCitizenFeedbackHandled(id: string, handled: boolean): Promise<void> {
  await ensureTable();
  const pool = getTimewebPool();
  await pool.query("update citizen_feedback set handled = $2 where id = $1", [id, handled]);
}

export async function dbDeleteCitizenFeedback(id: string): Promise<number> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from citizen_feedback where id = $1", [id]);
  return rowCount ?? 0;
}
