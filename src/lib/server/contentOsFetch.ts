import "server-only";

import { createHash } from "node:crypto";
import { parse as parseHtml } from "node-html-parser";

/**
 * Сбор источников — полностью внутри Content OS, НЕ переиспользует
 * «Новостной радар» (ни таблицы radar_triggers/radar_items, ни
 * src/lib/server/radarFetch.ts) — это сознательное решение владельца
 * 2026-10-03: Content OS должен быть самодостаточным модулем, радар —
 * отдельная, не связанная с ним функция админки.
 *
 * Логика разбора RSS/Google News/Telegram-превью здесь намеренно похожа на
 * radarFetch.ts (тот же класс задачи — публичные открытые источники без
 * токенов), но это независимая копия, а не общий импорт — чтобы изменения
 * в одном модуле не могли случайно сломать другой.
 */

const GOOGLE_NEWS_SEARCH = "https://news.google.com/rss/search";
const TELEGRAM_PREVIEW = "https://t.me/s";

export interface ParsedFeedItem {
  title: string;
  link: string;
  sourceName: string;
  snippet: string;
  publishedAt: number;
}

/** Стабильный id элемента ленты на основе ссылки — повторный опрос не плодит дубликаты. */
export function contentSourceItemId(link: string): string {
  return createHash("sha1").update(link.trim()).digest("hex");
}

export function googleNewsSearchUrl(query: string): string {
  return `${GOOGLE_NEWS_SEARCH}?q=${encodeURIComponent(query)}&hl=ru&gl=RU&ceid=RU:ru`;
}

export function telegramUsername(query: string): string {
  return query.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "").replace(/\/+$/, "");
}

export function telegramChannelUrl(query: string): string {
  return `${TELEGRAM_PREVIEW}/${encodeURIComponent(telegramUsername(query))}`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function innerTag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

/** Разбор RSS 2.0 / Atom без внешних зависимостей. */
export function parseFeedXml(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const blocks = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

  for (const b of blocks) {
    const title = stripTags(innerTag(b, "title"));

    let link = decodeEntities(innerTag(b, "link")).trim();
    if (!link) {
      const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (m) link = m[1].trim();
    }

    const pubRaw = innerTag(b, "pubDate") || innerTag(b, "published") || innerTag(b, "updated") || innerTag(b, "dc:date");
    const parsed = pubRaw ? Date.parse(stripTags(pubRaw)) : NaN;
    const publishedAt = Number.isNaN(parsed) ? Date.now() : parsed;

    let sourceName = stripTags(innerTag(b, "source"));
    const snippet = stripTags(innerTag(b, "description") || innerTag(b, "summary") || innerTag(b, "content")).slice(0, 400);

    if (!sourceName && title.includes(" - ")) {
      sourceName = title.slice(title.lastIndexOf(" - ") + 3).trim();
    }

    if (!title || !link) continue;
    items.push({ title, link, sourceName, snippet, publishedAt });
  }
  return items;
}

/** Разбор открытого веб-просмотра публичного Telegram-канала (t.me/s/<name>), без токена/бота. */
export function parseTelegramChannelHtml(html: string, username: string): ParsedFeedItem[] {
  const root = parseHtml(html);
  const posts = root.querySelectorAll(".tgme_widget_message_wrap");
  const items: ParsedFeedItem[] = [];

  for (const post of posts) {
    const textEl = post.querySelector(".tgme_widget_message_text");
    const timeEl = post.querySelector(".tgme_widget_message_date time");
    const linkEl = post.querySelector(".tgme_widget_message_date");
    if (!textEl) continue;

    const text = textEl.text.replace(/\s+/g, " ").trim();
    if (!text) continue;

    const datetime = timeEl?.getAttribute("datetime");
    const parsed = datetime ? Date.parse(datetime) : NaN;
    const publishedAt = Number.isNaN(parsed) ? Date.now() : parsed;
    const link = linkEl?.getAttribute("href") || `${TELEGRAM_PREVIEW}/${username}`;

    items.push({
      title: text.length > 140 ? `${text.slice(0, 140)}…` : text,
      link,
      sourceName: `Telegram: @${username}`,
      snippet: text.slice(0, 400),
      publishedAt,
    });
  }
  return items;
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EdinayaSredaContentOS/1.0; +https://xn--80abeipqi4b.xn--p1ai)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
