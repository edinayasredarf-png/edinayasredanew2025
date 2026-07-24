import "server-only";
import { getTimewebPool } from "@/lib/timewebPg";

let ensured = false;

/**
 * Статус доставки письма.
 *  accepted  — SMTP-сервер принял письмо (это НЕ гарантия доставки в инбокс)
 *  delivered — принято и за отведённое время не пришёл отказ (см. bounceScan)
 *  bounced   — пришёл возврат (DSN), причина в bounce_reason
 *  rejected  — SMTP-сервер отклонил адрес сразу
 *  error     — исключение при отправке
 */
export type DeliveryStatus =
  | "accepted"
  | "delivered"
  | "bounced"
  | "rejected"
  | "error";

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

  // Миграция существующей таблицы — поля трекинга и работы продажника.
  await pool.query(`
    alter table letter_sends
      add column if not exists phone text not null default '',
      add column if not exists called boolean not null default false,
      add column if not exists call_comment text not null default '',
      add column if not exists called_at timestamptz,
      add column if not exists track_token text,
      add column if not exists message_id text not null default '',
      add column if not exists smtp_response text not null default '',
      add column if not exists delivery_status text not null default '',
      add column if not exists bounced_at timestamptz,
      add column if not exists bounce_reason text not null default '',
      add column if not exists opened_at timestamptz,
      add column if not exists last_opened_at timestamptz,
      add column if not exists open_count integer not null default 0,
      add column if not exists from_email text not null default ''
  `);

  await pool.query(
    `create unique index if not exists letter_sends_track_token_idx
       on letter_sends (track_token) where track_token is not null`
  );
  await pool.query(
    `create index if not exists letter_sends_created_at_idx on letter_sends (created_at desc)`
  );
  await pool.query(
    `create index if not exists letter_sends_message_id_idx on letter_sends (message_id)`
  );

  // Старые записи: status ok/error → delivery_status accepted/error.
  await pool.query(
    `update letter_sends
        set delivery_status = case when status = 'ok' then 'accepted' else 'error' end
      where delivery_status = ''`
  );

  ensured = true;
}

export interface LetterSendLog {
  template_key: string;
  template_name: string;
  fio: string;
  email: string;
  phone?: string;
  subject: string;
  status: "ok" | "error";
  error?: string;
  track_token?: string;
  message_id?: string;
  smtp_response?: string;
  delivery_status?: DeliveryStatus;
  /** Адрес ящика, с которого отправлено (для отчётов). */
  from_email?: string;
}

export interface LetterSendRow {
  id: string;
  template_key: string;
  template_name: string;
  fio: string;
  email: string;
  from_email: string;
  phone: string;
  subject: string;
  status: "ok" | "error";
  error: string;
  message_id: string;
  smtp_response: string;
  delivery_status: DeliveryStatus;
  bounced_at: string | null;
  bounce_reason: string;
  opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  called: boolean;
  call_comment: string;
  called_at: string | null;
  created_at: string;
}

const ROW_COLS = `id, template_key, template_name, fio, email, from_email, phone, subject,
  status, error, message_id, smtp_response, delivery_status, bounced_at,
  bounce_reason, opened_at, last_opened_at, open_count, called, call_comment,
  called_at, created_at`;

/** Пишет запись в историю рассылок. Не бросает — лог не должен ронять отправку. */
export async function dbLogLetterSend(log: LetterSendLog): Promise<void> {
  try {
    await ensureTable();
    const pool = getTimewebPool();
    await pool.query(
      `insert into letter_sends
        (template_key, template_name, fio, email, phone, subject, status, error,
         track_token, message_id, smtp_response, delivery_status, from_email)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        log.template_key,
        log.template_name,
        log.fio,
        log.email,
        log.phone || "",
        log.subject,
        log.status,
        log.error || "",
        log.track_token || null,
        log.message_id || "",
        log.smtp_response || "",
        log.delivery_status || (log.status === "ok" ? "accepted" : "error"),
        log.from_email || "",
      ]
    );
  } catch {
    /* игнорируем ошибки логирования */
  }
}

export interface ListSendsOptions {
  /** YYYY-MM-DD включительно, в МСК */
  from?: string;
  to?: string;
  limit?: number;
}

/**
 * История рассылок за период. Диапазон задаётся датами МСК включительно:
 * from 00:00 МСК → конец дня to.
 */
export async function dbListLetterSends(
  opts: ListSendsOptions = {}
): Promise<LetterSendRow[]> {
  await ensureTable();
  const pool = getTimewebPool();
  const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2000);

  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.from) {
    params.push(`${opts.from} 00:00:00+03`);
    where.push(`created_at >= $${params.length}::timestamptz`);
  }
  if (opts.to) {
    // включительно: строго меньше начала следующего дня
    params.push(`${opts.to} 00:00:00+03`);
    where.push(`created_at < ($${params.length}::timestamptz + interval '1 day')`);
  }

  params.push(limit);
  const { rows } = await pool.query(
    `select ${ROW_COLS}
       from letter_sends
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by created_at desc, id desc
      limit $${params.length}`,
    params
  );
  return rows as LetterSendRow[];
}

/** Обновляет данные по звонку (работа продажника). */
export async function dbUpdateCallInfo(
  id: string,
  patch: { phone?: string; called?: boolean; call_comment?: string }
): Promise<LetterSendRow | null> {
  await ensureTable();
  const pool = getTimewebPool();

  const sets: string[] = [];
  const params: unknown[] = [];

  if (patch.phone !== undefined) {
    params.push(patch.phone);
    sets.push(`phone = $${params.length}`);
  }
  if (patch.call_comment !== undefined) {
    params.push(patch.call_comment);
    sets.push(`call_comment = $${params.length}`);
  }
  if (patch.called !== undefined) {
    params.push(patch.called);
    sets.push(`called = $${params.length}`);
    // время ставится при отметке «прозвонил» и снимается при её снятии
    sets.push(`called_at = case when $${params.length} then now() else null end`);
  }
  if (!sets.length) return null;

  params.push(id);
  const { rows } = await pool.query(
    `update letter_sends set ${sets.join(", ")}
      where id = $${params.length}
      returning ${ROW_COLS}`,
    params
  );
  return (rows[0] as LetterSendRow) || null;
}

/** Отмечает открытие письма по токену пикселя. */
export async function dbMarkOpened(token: string): Promise<void> {
  try {
    await ensureTable();
    const pool = getTimewebPool();
    await pool.query(
      `update letter_sends
          set open_count = open_count + 1,
              opened_at = coalesce(opened_at, now()),
              last_opened_at = now()
        where track_token = $1`,
      [token]
    );
  } catch {
    /* трекер не должен падать */
  }
}

/** Отмечает возврат (bounce) по Message-ID исходного письма. */
export async function dbMarkBounced(
  messageId: string,
  reason: string
): Promise<boolean> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    `update letter_sends
        set delivery_status = 'bounced',
            bounced_at = now(),
            bounce_reason = $2
      where message_id = $1
        and delivery_status <> 'bounced'`,
    [messageId, reason.slice(0, 2000)]
  );
  return (rowCount ?? 0) > 0;
}

/**
 * Переводит «принято» → «доставлено», если за graceHours не пришёл возврат.
 * Это не гарантия доставки, а отсутствие отказа за отведённое время.
 */
export async function dbPromoteAcceptedToDelivered(
  graceHours = 24
): Promise<number> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    `update letter_sends
        set delivery_status = 'delivered'
      where delivery_status = 'accepted'
        and created_at < now() - ($1 || ' hours')::interval`,
    [String(graceHours)]
  );
  return rowCount ?? 0;
}
