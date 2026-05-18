import "server-only";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { TIMEWEB_CLOUD_CA_PEM } from "@/lib/timewebCloudCa";

let pool: Pool | undefined;

function stripSslFromConnectionString(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("sslrootcert");
    u.searchParams.delete("sslcert");
    u.searchParams.delete("sslkey");
    return u.toString();
  } catch {
    return connectionString;
  }
}

/** SNI: при localhost / 127.0.0.1 / IP в URL задайте DATABASE_SSL_SERVERNAME (*.twc1.net из панели Timeweb). */
function tlsServername(connectionString: string): string | undefined {
  const fromEnv = process.env.DATABASE_SSL_SERVERNAME?.trim();
  if (fromEnv) return fromEnv;
  try {
    const host = new URL(connectionString).hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return undefined;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

/** CA Timeweb: файл (локально) или PEM в переменной (Vercel / Timeweb Apps). */
function resolveSslCa(): string | undefined {
  const pemInline =
    process.env.DATABASE_SSL_CA_PEM?.trim() ||
    process.env.TIMEWEB_PG_CA_PEM?.trim();
  if (pemInline?.includes("BEGIN CERTIFICATE")) {
    return pemInline.replace(/\\n/g, "\n");
  }

  const explicit =
    process.env.PGSSLROOTCERT?.trim() ||
    process.env.DATABASE_SSL_CA?.trim() ||
    process.env.TIMEWEB_PG_CA_PATH?.trim();

  if (explicit?.includes("BEGIN CERTIFICATE")) {
    return explicit.replace(/\\n/g, "\n");
  }

  const bundled = path.join(process.cwd(), "certs", "timeweb-cloud-ca.pem");

  const candidates = [
    explicit,
    bundled,
    path.join(os.homedir(), ".cloud-certs", "root.crt"),
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    try {
      if (file && fs.existsSync(file)) {
        const pem = fs.readFileSync(file, "utf8");
        if (pem.includes("BEGIN CERTIFICATE")) return pem;
      }
    } catch {
      /* пробуем следующий путь */
    }
  }
  return TIMEWEB_CLOUD_CA_PEM;
}

function buildSslForPool(connectionString: string):
  | { rejectUnauthorized: false }
  | { rejectUnauthorized: true; ca: string; servername?: string }
  | { rejectUnauthorized: true; servername?: string } {
  const insecure =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false" ||
    process.env.DATABASE_SSL_INSECURE === "1";

  if (insecure) {
    return { rejectUnauthorized: false };
  }

  const servername = tlsServername(connectionString);
  const sn = servername ? ({ servername } as const) : {};

  const ca = resolveSslCa();
  return { rejectUnauthorized: true, ca, ...sn };
}

/**
 * Пул к PostgreSQL Timeweb Cloud.
 * Строка: `DATABASE_URL` или `TIMEWEB_DATABASE_URL` (postgresql://... из панели).
 * Для TLS: CA + при необходимости DATABASE_SSL_SERVERNAME (туннель на localhost или хост = IP).
 * Из URL удаляются sslmode/ssl* — иначе node-pg может конфликтовать с явным ssl.ca.
 * Только локально: DATABASE_SSL_REJECT_UNAUTHORIZED=false (не для продакшена).
 */
export function getTimewebPool(): Pool {
  if (pool) return pool;

  const connectionString = (
    process.env.DATABASE_URL ??
    process.env.TIMEWEB_DATABASE_URL ??
    ""
  ).trim();

  if (!connectionString) {
    throw new Error(
      "Задайте DATABASE_URL или TIMEWEB_DATABASE_URL для подключения к Timeweb."
    );
  }

  const ssl = buildSslForPool(connectionString);

  /** Timeweb gen_user: таблицы в схеме es_app — см. supabase/migrations/timeweb_es_app_schema.sql */
  const searchPath =
    process.env.DATABASE_SEARCH_PATH?.trim() || "public";

  const connectionStringForPool = stripSslFromConnectionString(connectionString);

  pool = new Pool({
    connectionString: connectionStringForPool,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl,
    options: `-c search_path=${searchPath}`,
  });

  return pool;
}

/** Проверка «живости» БД (для скриптов и health). */
export async function timewebDbPing(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const p = getTimewebPool();
    const r = await p.query("select 1 as ok");
    const row = r.rows[0] as { ok?: number } | undefined;
    if (row?.ok === 1) return { ok: true };
    return { ok: false, message: "Unexpected ping result" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}

export async function closeTimewebPool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
