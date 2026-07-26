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

export interface FeedbackFileMeta {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
}

export interface CitizenFeedbackRow extends CitizenFeedbackInput {
  id: string;
  handled: boolean;
  created_at: string;
  files: FeedbackFileMeta[];
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
  // Прикреплённые фото/видео (хранятся в БД, чтобы потом скачать из админки).
  await pool.query(`
    create table if not exists citizen_feedback_files (
      id bigserial primary key,
      feedback_id bigint not null references citizen_feedback(id) on delete cascade,
      filename text not null default '',
      mime text not null default '',
      size_bytes integer not null default 0,
      data bytea not null,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(
    `create index if not exists citizen_feedback_files_fid_idx on citizen_feedback_files (feedback_id)`
  );
  ensured = true;
}

export async function dbInsertCitizenFeedback(input: CitizenFeedbackInput): Promise<string> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `insert into citizen_feedback (type, fio, phone, email, region, message, source)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
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
  return String(rows[0].id);
}

export async function dbInsertFeedbackFile(
  feedbackId: string,
  filename: string,
  mime: string,
  data: Buffer
): Promise<void> {
  await ensureTable();
  const pool = getTimewebPool();
  await pool.query(
    `insert into citizen_feedback_files (feedback_id, filename, mime, size_bytes, data)
     values ($1,$2,$3,$4,$5)`,
    [feedbackId, (filename || "file").slice(0, 300), (mime || "").slice(0, 120), data.length, data]
  );
}

/** Метаданные файла для скачивания (без самих данных). */
export async function dbGetFeedbackFileMeta(id: string): Promise<{ filename: string; mime: string } | null> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select filename, mime from citizen_feedback_files where id = $1", [id]);
  const r = rows[0] as { filename: string; mime: string } | undefined;
  return r ?? null;
}

/** Сам файл (данные) для отдачи. */
export async function dbGetFeedbackFile(id: string): Promise<{ filename: string; mime: string; data: Buffer } | null> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select filename, mime, data from citizen_feedback_files where id = $1", [id]);
  const r = rows[0] as { filename: string; mime: string; data: Buffer } | undefined;
  return r ?? null;
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
  const list = rows as CitizenFeedbackRow[];

  // Прикрепляем метаданные файлов одним запросом (без N+1).
  const ids = list.map((r) => r.id);
  if (ids.length) {
    const { rows: fileRows } = await pool.query(
      `select id, feedback_id, filename, mime, size_bytes
         from citizen_feedback_files
        where feedback_id = any($1::bigint[])
        order by id asc`,
      [ids]
    );
    const byFeedback = new Map<string, FeedbackFileMeta[]>();
    for (const fr of fileRows as Array<{ id: string; feedback_id: string; filename: string; mime: string; size_bytes: number }>) {
      const key = String(fr.feedback_id);
      const arr = byFeedback.get(key) ?? [];
      arr.push({ id: String(fr.id), filename: fr.filename, mime: fr.mime, size_bytes: fr.size_bytes });
      byFeedback.set(key, arr);
    }
    for (const r of list) r.files = byFeedback.get(String(r.id)) ?? [];
  } else {
    for (const r of list) r.files = [];
  }
  return list;
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
