#!/usr/bin/env node
/**
 * Разовый сид источников мониторинга для Content OS — из
 * ~/Downloads/06_Контент_завод_ЕС/контент-завод/источники-мониторинга.md
 * (владелец прислал список 2026-10-03, в Content OS их ещё не было).
 *
 * Идемпотентно (ON CONFLICT DO NOTHING по id) — безопасно запускать
 * повторно. Добавляет в content_sources для дефолтной компании
 * (edinaya-sreda). Дальше опрашиваются как обычно — кнопка «Собрать
 * сейчас» в Sources или через API /api/content-os/sources/poll.
 *
 * ЧЕСТНО ПРО НАДЁЖНОСТЬ ИСТОЧНИКОВ (не проверено прямым запросом из этой
 * сессии — инструмент веб-фетча был недоступен):
 *  - Telegram-каналы — проверенный рабочий механизм (как у остальных).
 *  - pravo.gov.ru и smartcitiesworld.net — найдены настоящие RSS-адреса
 *    через поиск, не протестированы живым запросом.
 *  - Остальные "сайты" (kremlin.ru, government.ru, duma.gov.ru, garant.ru,
 *    consultant.ru, minstroyrf.gov.ru, rosreestr.gov.ru, zakupki.gov.ru,
 *    зарубежные и СНГ-источники) добавлены как type=keyword с поиском
 *    "site:домен" через Google News — не их собственный RSS (эти сайты
 *    обычно не отдают простую RSS-ленту без специальной настройки), а
 *    непрямой проверенный механизм. Качество покрытия зависит от того,
 *    насколько Google News индексирует конкретный сайт — после первого
 *    опроса стоит проверить в Sources → Лента, что реально приходит, и
 *    поправить query вручную, если пусто.
 *  - news.yandex.ru (агрегатор по ключевым словам) заменён на такой же
 *    keyword-поиск по тем же словам через Google News — у нас нет
 *    отдельного фетчера под Яндекс.Новости.
 *
 * Запуск: node scripts/seed-content-sources.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
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

const COMPANY_ID = "edinaya-sreda";

/** type: keyword | rss | telegram | website. Для keyword — query это поисковая фраза (Google News). */
const SOURCES = [
  // ── Российские — нормативные и официальные ──
  { name: "Kremlin.ru", type: "keyword", query: "site:kremlin.ru", priority: 8, categories: ["нормативка"] },
  { name: "Government.ru", type: "keyword", query: "site:government.ru", priority: 8, categories: ["нормативка"] },
  { name: "Pravo.gov.ru (официальное опубликование НПА)", type: "rss", query: "http://publication.pravo.gov.ru/rss", priority: 8, categories: ["нормативка"] },
  { name: "Duma.gov.ru (законопроекты)", type: "keyword", query: "site:duma.gov.ru", priority: 7, categories: ["нормативка"] },
  { name: "Garant.ru (обзоры изменений законодательства)", type: "keyword", query: "site:garant.ru", priority: 7, categories: ["нормативка"] },
  { name: "Consultant.ru (обзоры изменений законодательства)", type: "keyword", query: "site:consultant.ru", priority: 7, categories: ["нормативка"] },
  { name: "Минстрой России", type: "keyword", query: "site:minstroyrf.gov.ru", priority: 7, categories: ["нормативка", "жкх"] },
  { name: "Росреестр (кадастр)", type: "keyword", query: "site:rosreestr.gov.ru", priority: 6, categories: ["нормативка"] },
  { name: "ЕИС Закупки (zakupki.gov.ru)", type: "keyword", query: "site:zakupki.gov.ru инвентаризация кладбищ", priority: 9, categories: ["закупки", "лиды"] },
  { name: "Закупки 44-ФЗ (Telegram)", type: "telegram", query: "zakupki44fz", priority: 9, categories: ["закупки", "лиды"] },
  { name: "ЕИС Закупки — Казначейство (Telegram)", type: "telegram", query: "gis_eiszakupki", priority: 8, categories: ["закупки"] },
  { name: "Незыгарь (Telegram)", type: "telegram", query: "russica2", priority: 6, categories: ["политика"] },
  { name: "Кремлёвский безБашенник (Telegram)", type: "telegram", query: "kremlebezBashennik", priority: 6, categories: ["политика"] },
  { name: "Региональные новости по теме (кладбища/благоустройство)", type: "keyword", query: "кладбище OR инвентаризация OR благоустройство OR снос OR авария", priority: 7, categories: ["мониторинг"] },

  // ── Зарубежные — тренды и технологии ──
  { name: "Smart Cities World", type: "rss", query: "https://www.smartcitiesworld.net/Syndication/DF.cfm?f=7&ft=10", priority: 5, categories: ["технологии"] },
  { name: "UN-Habitat", type: "keyword", query: "site:unhabitat.org", priority: 5, categories: ["технологии"] },
  { name: "Eurocities", type: "keyword", query: "site:eurocities.eu", priority: 5, categories: ["технологии"] },
  { name: "Congress of Local and Regional Authorities (CoE)", type: "keyword", query: "site:coe.int local authorities", priority: 5, categories: ["технологии"] },
  { name: "Apolitical", type: "keyword", query: "site:apolitical.co", priority: 5, categories: ["технологии"] },
  { name: "Government Technology (govtech.com)", type: "keyword", query: "site:govtech.com", priority: 5, categories: ["технологии"] },

  // ── СНГ ──
  { name: "eGov.kz (Казахстан)", type: "keyword", query: "site:egov.kz", priority: 5, categories: ["снг"] },
  { name: "NCES.by (Беларусь)", type: "keyword", query: "site:nces.by", priority: 5, categories: ["снг"] },
];

try {
  const { rows: company } = await pool.query("select id from content_companies where id = $1", [COMPANY_ID]);
  if (company.length === 0) {
    console.error(`Компания '${COMPANY_ID}' не найдена — похоже, миграция Content OS ещё не применилась на этой БД. Откройте раздел «Контент» в админке хотя бы раз, затем запустите скрипт снова.`);
    process.exit(1);
  }

  const now = Date.now();
  let inserted = 0;
  let skipped = 0;
  for (const s of SOURCES) {
    // Детерминированный id (компания+название) — повторный запуск скрипта
    // не плодит дубли, а молча пропускает уже добавленные источники.
    const id = createHash("sha1").update(`${COMPANY_ID}:${s.name}`).digest("hex");
    const { rowCount } = await pool.query(
      `insert into content_sources (id, company_id, name, type, query, priority, active, poll_interval, categories, tags, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,true,60,$7,'[]',$8,$8)
       on conflict (id) do nothing`,
      [id, COMPANY_ID, s.name, s.type, s.query, s.priority, JSON.stringify(s.categories), now]
    );
    if (rowCount > 0) inserted++; else skipped++;
  }

  console.log(`Готово. Добавлено источников: ${inserted}, уже существовали (пропущены): ${skipped}.`);
  console.log(`\nПроверить результат: откройте админку → Контент → Источники, или выполните SELECT name, type, query FROM content_sources WHERE company_id='${COMPANY_ID}';`);
  console.log(`Дальше — нажмите «Собрать сейчас» в Sources и посмотрите, что реально пришло в ленту: источники типа keyword зависят от индексации Google News, не все дадут результат одинаково хорошо.`);
} catch (e) {
  console.error("Ошибка:", e?.message || e);
  process.exit(1);
} finally {
  await pool.end();
}
