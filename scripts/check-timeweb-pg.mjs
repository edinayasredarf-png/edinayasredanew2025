#!/usr/bin/env node
/**
 * Проверка подключения к PostgreSQL Timeweb.
 * Читает .env.local (если есть), иначе только переменные окружения.
 *
 * Перед запуском (macOS, из инструкции Timeweb):
 *   mkdir -p ~/.cloud-certs && curl -o ~/.cloud-certs/root.crt "https://st.timeweb.com/cloud-static/ca.crt" && chmod 0600 ~/.cloud-certs/root.crt
 *   export PGSSLROOTCERT=$HOME/.cloud-certs/root.crt
 *
 * В .env.local:
 *   DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=verify-full
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { buildPgSsl, sslDebugLines, connectionHostname, tlsServername } from "./timeweb-pg-ssl.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDotEnvFile(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return;
  const raw = fs.readFileSync(full, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnvFile(".env.local");
loadDotEnvFile(".env");

const connectionString = (
  process.env.DATABASE_URL ||
  process.env.TIMEWEB_DATABASE_URL ||
  ""
).trim();

if (!connectionString) {
  console.error(
    "Нет DATABASE_URL / TIMEWEB_DATABASE_URL. Добавьте строку из панели Timeweb в .env.local."
  );
  process.exit(1);
}

const { connectionString: pgConn, ssl } = buildPgSsl(connectionString);
if (!ssl?.ca && ssl?.rejectUnauthorized !== false) {
  console.warn(
    "Предупреждение: CA не найден (PGSSLROOTCERT / DATABASE_SSL_CA / ~/.cloud-certs/root.crt). Подключение может упасть с ошибкой SSL.\n"
  );
}

const searchPath = (process.env.DATABASE_SEARCH_PATH || "public").trim();
const pool = new pg.Pool({
  connectionString: pgConn,
  ssl,
  max: 1,
  options: `-c search_path=${searchPath}`,
});

try {
  const { rows } = await pool.query("select current_database() as db, current_user as usr");
  console.log("Timeweb PostgreSQL: OK", rows[0]);

  const tables = await pool.query(`
    select
      to_regclass('posts') is not null as has_posts,
      to_regclass('cases') is not null as has_cases,
      to_regclass('news') is not null as has_news
  `);
  const t = tables.rows[0];
  if (!t.has_posts || !t.has_cases || !t.has_news) {
    console.error(
      "\nТаблицы не найдены в search_path=" + searchPath +
        ". Выполните в Adminer: supabase/migrations/timeweb_public_schema.sql (или timeweb_es_app_schema.sql + DATABASE_SEARCH_PATH=es_app,public)."
    );
    process.exit(1);
  }
  const counts = await pool.query(
    "select (select count(*)::int from posts) as posts, (select count(*)::int from cases) as cases, (select count(*)::int from news) as news"
  );
  console.log("Таблицы в search_path: OK, записей:", counts.rows[0]);
} catch (e) {
  const msg = String(e?.message || e);
  console.error("Ошибка подключения:", msg);

  if (/certificate|self-signed|UNABLE_TO_GET_ISSUER|SSL|TLS/i.test(msg)) {
    const caPath = path.join(os.homedir(), ".cloud-certs", "root.crt");
    console.error("\nДиагностика SSL:\n  " + sslDebugLines().join("\n  "));
    console.error(`
SSL: доверие к серверу Timeweb.

1) Скачайте CA (если файла нет или он пустой):
   mkdir -p ~/.cloud-certs
   curl -fsSLo ~/.cloud-certs/root.crt "https://st.timeweb.com/cloud-static/ca.crt"
   chmod 0600 ~/.cloud-certs/root.crt

2) В .env.local (надёжнее, чем export в терминале):
   DATABASE_SSL_CA=${caPath}

   Строка DATABASE_URL должна быть без конфликта: можно оставить ?sslmode=require
   или без query — скрипт сам убирает sslmode при явной настройке ssl.

3) Только для локальной отладки (не в продакшене):
   DATABASE_SSL_REJECT_UNAUTHORIZED=false

Затем снова: npm run db:check-timeweb
`);
  } else if (/Hostname\/IP does not match|does not match certificate/i.test(msg)) {
    const host = connectionHostname(connectionString);
    const sn = tlsServername(connectionString);
    console.error("\nДиагностика TLS (имя хоста):\n  " + sslDebugLines().join("\n  "));
    console.error(`  Хост в DATABASE_URL: ${host || "(не разобрать)"}`);
    console.error(`  servername для TLS: ${sn || "(не задан — для localhost/IP добавьте ниже)"}`);
    console.error(`
Имя в сертификате Timeweb (обычно *.twc1.net) не совпадает с хостом подключения.

В .env.local добавьте (подставьте свой хост из ошибки или из панели Timeweb → строка подключения):
  DATABASE_SSL_SERVERNAME=e09d0f7fc61424c49ea033c9.twc1.net

Либо в DATABASE_URL укажите этот хост вместо localhost / IP (если порт 5432 доступен напрямую).

Затем: npm run db:check-timeweb
`);
  } else if (/public/i.test(connectionString) && /ECONNREFUSED|does not exist|password/i.test(msg)) {
    console.error(
      "\nПодсказка: в URL после порта — имя **базы** из панели Timeweb (часто `public` у gen_user)."
    );
  }
  process.exit(1);
} finally {
  await pool.end();
}
