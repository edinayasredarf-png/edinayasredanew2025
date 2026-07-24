import "server-only";

import { randomUUID } from "node:crypto";
import { getTimewebPool } from "@/lib/timewebPg";
import { decryptSecret, encryptSecret } from "@/lib/server/secretBox";

/**
 * Дополнительные почтовые ящики для рассылок (основной offer@ остаётся в ENV).
 * SMTP-пароль хранится в БД в зашифрованном виде и наружу не отдаётся.
 */
export interface MailAccount {
  id: string;
  label: string;
  from_name: string;
  from_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  enabled: boolean;
  has_password: boolean;
  created_at: number;
}

/** Полные данные ящика с расшифрованным паролем — только для отправки на сервере. */
export interface MailAccountSecret extends MailAccount {
  smtp_pass: string;
}

let ensured = false;
async function ensureTable(): Promise<void> {
  if (ensured) return;
  const pool = getTimewebPool();
  await pool.query(`
    create table if not exists mail_accounts (
      id text primary key,
      label text not null default '',
      from_name text not null default '',
      from_email text not null default '',
      smtp_host text not null default '',
      smtp_port integer not null default 465,
      smtp_secure boolean not null default true,
      smtp_user text not null default '',
      smtp_pass_enc text not null default '',
      enabled boolean not null default true,
      created_at bigint not null default 0
    )
  `);
  ensured = true;
}

function rowToAccount(r: Record<string, unknown>): MailAccount {
  return {
    id: String(r.id),
    label: String(r.label ?? ""),
    from_name: String(r.from_name ?? ""),
    from_email: String(r.from_email ?? ""),
    smtp_host: String(r.smtp_host ?? ""),
    smtp_port: Number(r.smtp_port ?? 465),
    smtp_secure: Boolean(r.smtp_secure),
    smtp_user: String(r.smtp_user ?? ""),
    enabled: Boolean(r.enabled),
    has_password: Boolean(String(r.smtp_pass_enc ?? "")),
    created_at: Number(r.created_at ?? 0),
  };
}

export async function dbListMailAccounts(): Promise<MailAccount[]> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from mail_accounts order by created_at asc"
  );
  return (rows as Record<string, unknown>[]).map(rowToAccount);
}

export interface MailAccountInput {
  id?: string;
  label?: string;
  from_name?: string;
  from_email?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  /** Новый пароль в открытом виде; пусто/undefined — не менять существующий. */
  password?: string;
  enabled?: boolean;
}

export async function dbUpsertMailAccount(input: MailAccountInput): Promise<string> {
  await ensureTable();
  const pool = getTimewebPool();
  const id = input.id || randomUUID();

  // пароль меняем только если он передан; иначе оставляем прежний
  let passEnc: string | null = null;
  if (input.password) passEnc = encryptSecret(input.password);

  const existing = input.id
    ? (await pool.query("select id from mail_accounts where id = $1", [id])).rowCount
    : 0;

  if (existing) {
    await pool.query(
      `update mail_accounts set
         label = $2, from_name = $3, from_email = $4,
         smtp_host = $5, smtp_port = $6, smtp_secure = $7, smtp_user = $8,
         enabled = $9
         ${passEnc !== null ? ", smtp_pass_enc = $10" : ""}
       where id = $1`,
      passEnc !== null
        ? [id, input.label ?? "", input.from_name ?? "", input.from_email ?? "", input.smtp_host ?? "", input.smtp_port ?? 465, input.smtp_secure ?? true, input.smtp_user ?? "", input.enabled ?? true, passEnc]
        : [id, input.label ?? "", input.from_name ?? "", input.from_email ?? "", input.smtp_host ?? "", input.smtp_port ?? 465, input.smtp_secure ?? true, input.smtp_user ?? "", input.enabled ?? true]
    );
  } else {
    await pool.query(
      `insert into mail_accounts
         (id, label, from_name, from_email, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, enabled, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, input.label ?? "", input.from_name ?? "", input.from_email ?? "", input.smtp_host ?? "", input.smtp_port ?? 465, input.smtp_secure ?? true, input.smtp_user ?? "", passEnc ?? "", input.enabled ?? true, Date.now()]
    );
  }
  return id;
}

export async function dbDeleteMailAccount(id: string): Promise<number> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rowCount } = await pool.query("delete from mail_accounts where id = $1", [id]);
  return rowCount ?? 0;
}

/** Ящик с расшифрованным паролем — для отправки и проверки соединения. */
export async function dbGetMailAccountSecret(id: string): Promise<MailAccountSecret | null> {
  await ensureTable();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from mail_accounts where id = $1", [id]);
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  const base = rowToAccount(r);
  const enc = String(r.smtp_pass_enc ?? "");
  let smtp_pass = "";
  if (enc) {
    try {
      smtp_pass = decryptSecret(enc);
    } catch {
      smtp_pass = "";
    }
  }
  return { ...base, smtp_pass };
}
