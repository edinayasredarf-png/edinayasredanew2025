#!/usr/bin/env node
/**
 * Проверка, что миграции Content OS (company_id, content_companies,
 * content_sources/content_source_items, composite PK на
 * content_channel_profiles) реально применились на Timeweb Postgres.
 *
 * Ничего не меняет — только read-only запросы к information_schema/pg_catalog.
 * Миграции здесь нет отдельным шагом: таблицы/колонки создаются лениво,
 * при первом же реальном обращении задеплоенного приложения к Content OS
 * (см. dbEnsureContentOsTables() в src/lib/server/contentOsDb.ts). Этот
 * скрипт просто смотрит, применилось ли это уже.
 *
 * Запуск: node scripts/check-content-os-schema.mjs
 * (использует тот же .env.local/.env, что и npm run db:check-timeweb)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { buildPgSsl } from "./timeweb-pg-ssl.mjs";

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadDotEnvFile(".env.local");
loadDotEnvFile(".env");

const connectionString = (process.env.DATABASE_URL || process.env.TIMEWEB_DATABASE_URL || "").trim();
if (!connectionString) {
  console.error("Нет DATABASE_URL / TIMEWEB_DATABASE_URL. Добавьте строку из панели Timeweb в .env.local.");
  process.exit(1);
}

const { connectionString: pgConn, ssl } = buildPgSsl(connectionString);
const searchPath = (process.env.DATABASE_SEARCH_PATH || "public").trim();
const pool = new pg.Pool({ connectionString: pgConn, ssl, max: 1, options: `-c search_path=${searchPath}` });

const EXPECTED_TABLES = ["content_companies", "content_sources", "content_source_items"];
const EXPECTED_COMPANY_ID = [
  "content_clusters", "content_topics", "content_brand_documents",
  "content_channel_profiles", "content_ai_runs", "content_sources", "content_source_items",
];

let failed = false;
function report(ok, label) {
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failed = true;
}

try {
  const { rows: pingRows } = await pool.query("select current_database() as db, current_user as usr");
  console.log("Подключение: OK", pingRows[0], "\n");

  for (const t of EXPECTED_TABLES) {
    const { rows } = await pool.query("select to_regclass($1) is not null as exists", [t]);
    report(rows[0].exists, `таблица ${t} существует`);
  }

  for (const t of EXPECTED_COMPANY_ID) {
    const { rows } = await pool.query(
      `select exists (
         select 1 from information_schema.columns
         where table_schema = $1 and table_name = $2 and column_name = 'company_id'
       ) as has_col`,
      [searchPath.split(",")[0].trim(), t]
    );
    report(rows[0]?.has_col, `${t}.company_id существует`);
  }

  // Composite PK на content_channel_profiles — самая рискованная часть миграции.
  const { rows: pkRows } = await pool.query(`
    select array_agg(a.attname order by a.attnum) as cols
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'content_channel_profiles'::regclass and c.contype = 'p'
    group by c.conname
  `);
  const pkCols = pkRows[0]?.cols ?? [];
  report(
    pkCols.length === 2 && pkCols.includes("company_id") && pkCols.includes("id"),
    `content_channel_profiles PK = (company_id, id) — сейчас: (${pkCols.join(", ") || "?"})`
  );

  const { rows: companyRows } = await pool.query("select id, name, is_active from content_companies order by created_at asc");
  console.log(`\nКомпании в БД (${companyRows.length}):`, companyRows);
  report(companyRows.some((c) => c.id === "edinaya-sreda"), "дефолтная компания 'edinaya-sreda' существует");

  console.log(failed ? "\n❌ Есть расхождения — см. выше." : "\n✅ Всё применилось как ожидалось.");
  process.exit(failed ? 1 : 0);
} catch (e) {
  console.error("Ошибка проверки:", e?.message || e);
  process.exit(1);
} finally {
  await pool.end();
}
