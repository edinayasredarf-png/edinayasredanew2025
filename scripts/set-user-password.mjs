#!/usr/bin/env node
/**
 * Задать пароль существующему пользователю в Timeweb (user_profiles).
 *
 *   npm run auth:set-password -- proeco09@yandex.ru ВашПароль
 *
 * Для email из EDITOR_EMAIL также выставляется role = admin.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import bcrypt from "bcryptjs";
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

const emailArg = process.argv[2]?.trim().toLowerCase();
let passwordArg = process.argv[3];

if (!emailArg) {
  console.error(
    "Использование: npm run auth:set-password -- email@example.com [Пароль]\n" +
      "  Без пароля для EDITOR_EMAIL подставится EDITOR_PASSWORD из .env.local"
  );
  process.exit(1);
}

if (!passwordArg) {
  const editor = (process.env.EDITOR_EMAIL || "proeco09@yandex.ru")
    .trim()
    .toLowerCase();
  if (emailArg === editor && process.env.EDITOR_PASSWORD) {
    passwordArg = process.env.EDITOR_PASSWORD;
    console.log("(пароль из EDITOR_PASSWORD в .env.local)\n");
  } else {
    console.error("Укажите пароль вторым аргументом.");
    process.exit(1);
  }
}

if (passwordArg.length < 6) {
  console.error("Пароль должен быть не короче 6 символов.");
  process.exit(1);
}

const connectionString = (
  process.env.DATABASE_URL ||
  process.env.TIMEWEB_DATABASE_URL ||
  ""
).trim();

if (!connectionString) {
  console.error("Нет DATABASE_URL в .env.local");
  process.exit(1);
}

const editorEmail = (
  process.env.EDITOR_EMAIL || "proeco09@yandex.ru"
).trim().toLowerCase();
const { connectionString: pgConn, ssl } = buildPgSsl(connectionString);
const searchPath = (process.env.DATABASE_SEARCH_PATH || "public").trim();
const pool = new pg.Pool({
  connectionString: pgConn,
  ssl,
  max: 1,
  options: `-c search_path=${searchPath}`,
});

try {
  const { rows } = await pool.query(
    `select id, email, role, password_hash is not null as has_password
     from user_profiles
     where lower(trim(email)) = lower(trim($1))
     limit 1`,
    [emailArg]
  );

  if (!rows[0]) {
    console.error(`Пользователь ${emailArg} не найден в user_profiles.`);
    console.error("Сначала зарегистрируйтесь на сайте или создайте запись вручную.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(passwordArg, 12);
  const newRole = emailArg === editorEmail ? "admin" : rows[0].role;

  await pool.query(
    `update user_profiles
     set password_hash = $1, role = $2, updated_at = now()
     where id = $3`,
    [hash, newRole, rows[0].id]
  );

  console.log("OK:", rows[0].email);
  console.log("  role:", newRole);
  console.log(
    rows[0].has_password
      ? "  пароль обновлён — войдите через «Вход» на сайте"
      : "  пароль задан — войдите через «Вход» на сайте (не «Регистрация»)"
  );
} catch (e) {
  console.error("Ошибка:", e?.message || e);
  process.exit(1);
} finally {
  await pool.end();
}
