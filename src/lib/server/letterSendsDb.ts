import "server-only";
import { getTimewebPool } from "@/lib/timewebPg";

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists letter_sends (
      id bigserial primary key,
      template_key text not null default '',
      template_name text not null default '',
      fio text not null default '',
      email text not null default '',
      subject text not null default '',
      status text not null default '',
      error text not null default '',
      created_at timestamptz not null default now()
    )
  `);
  ensured = true;
}

export interface LetterSendLog {
  template_key: string;
  template_name: string;
  fio: string;
  email: string;
  subject: string;
  status: "ok" | "error";
  error?: string;
}

export interface LetterSendRow extends LetterSendLog {
  id: string;
  created_at: string;
}

/** Пишет запись в историю рассылок. Не бросает — лог не должен ронять отправку. */
export async function dbLogLetterSend(log: LetterSendLog): Promise<void> {
  try {
    await ensureTable();
    const pool = getTimewebPool();
    await pool.query(
      `insert into letter_sends
        (template_key, template_name, fio, email, subject, status, error)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        log.template_key,
        log.template_name,
        log.fio,
        log.email,
        log.subject,
        log.status,
        log.error || "",
      ]
    );
  } catch {
    /* игнорируем ошибки логирования */
  }
}

export async function dbListLetterSends(limit = 200): Promise<LetterSendRow[]> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select id, template_key, template_name, fio, email, subject, status, error, created_at
       from letter_sends
      order by created_at desc, id desc
      limit $1`,
    [Math.min(Math.max(limit, 1), 1000)]
  );
  return rows as LetterSendRow[];
}
