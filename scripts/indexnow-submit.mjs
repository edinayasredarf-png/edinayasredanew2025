#!/usr/bin/env node
/**
 * IndexNow: уведомляет поисковые системы (Яндекс, Bing и участников протокола)
 * об обновлённых URL. Быстрее доносит свежие/изменённые страницы до индексов,
 * которые питают ИИ-ответы (Поиск с Алисой, Bing Copilot, ChatGPT Search).
 *
 * Запуск: автоматически после `next build` на продакшн-деплое Vercel,
 * либо вручную: `npm run indexnow`.
 *
 * Скрипт НИКОГДА не роняет сборку: любые ошибки логируются и завершаются 0.
 */

const KEY = process.env.INDEXNOW_KEY || "8e2b5a9c4f7d41e6b3a0d8c5f19274e6";
const HOST = "xn--80aakbcct4b2aj7m.xn--p1ai"; // единаясреда.рф (punycode)
const BASE = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

// GEO-приоритетные страницы. При добавлении новой важной страницы — впишите путь сюда.
const PATHS = [
  "/",
  "/services/imz",
  "/services/izn",
  "/services/les",
  "/resheniya",
  "/resheniya/municipalnye-sistemy-ucheta",
  "/resheniya/blagoustroystvo",
  "/resheniya/uchet-zelenyh-nasazhdeniy",
  "/resheniya/uchet-mest-zahoroneniy",
  "/resheniya/programma-dlya-inventarizacii",
  "/resheniya/sravnenie-sistem-inventarizacii",
  "/resheniya/preimushchestva",
  "/resheniya/lesoustrojstvo",
  "/resheniya/ocifrovka-territorij",
  "/resheniya/inventarizaciya-kladbishch",
  "/resheniya/luchshie-sistemy-inventarizacii",
  "/reviews",
  "/dlya/zhk",
  "/dlya/sanatorii",
  "/dlya/oteli",
];

async function main() {
  // Отправлять только на продакшн-деплое Vercel. Локальные и превью-сборки —
  // пропускаем. Для ручной проверки: INDEXNOW_FORCE=1 npm run indexnow.
  if (process.env.INDEXNOW_FORCE !== "1" && process.env.VERCEL_ENV !== "production") {
    console.log(
      `[indexnow] skip: VERCEL_ENV=${process.env.VERCEL_ENV || "(unset)"} (отправка только на production)`
    );
    return;
  }

  const urlList = PATHS.map((p) => `${BASE}${p}`);
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `${BASE}/${KEY}.txt`,
    urlList,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    console.log(
      `[indexnow] отправлено ${urlList.length} URL → HTTP ${res.status} ${res.statusText}`
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log(`[indexnow] ответ: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`[indexnow] ошибка отправки (не критично): ${err?.message || err}`);
  }
}

main().finally(() => process.exit(0));
