import "server-only";

import {
  dbListTriggers,
  dbRadarCleanup,
  dbUpsertItem,
  radarItemId,
} from "@/lib/server/radarDb";
import type { RadarItem, RadarTrigger } from "@/lib/radarTypes";

const GOOGLE_NEWS_SEARCH = "https://news.google.com/rss/search";

/** URL RSS-ленты для триггера: Google News по ключевым словам либо прямой RSS. */
function feedUrl(t: RadarTrigger): string {
  if (t.kind === "rss") return t.query.trim();
  const q = encodeURIComponent(t.query);
  return `${GOOGLE_NEWS_SEARCH}?q=${q}&hl=ru&gl=RU&ceid=RU:ru`;
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
  return decodeEntities(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function innerTag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

interface ParsedItem {
  title: string;
  link: string;
  source: string;
  snippet: string;
  published_at: number;
}

/** Разбор RSS 2.0 / Atom без внешних зависимостей (достаточно для новостных лент). */
function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const blocks = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

  for (const b of blocks) {
    const title = stripTags(innerTag(b, "title"));

    let link = decodeEntities(innerTag(b, "link")).trim();
    if (!link) {
      // Atom: <link href="...">
      const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (m) link = m[1].trim();
    }

    const pubRaw =
      innerTag(b, "pubDate") || innerTag(b, "published") || innerTag(b, "updated") || innerTag(b, "dc:date");
    const parsed = pubRaw ? Date.parse(stripTags(pubRaw)) : NaN;
    const published_at = Number.isNaN(parsed) ? Date.now() : parsed;

    let source = stripTags(innerTag(b, "source"));
    const snippet = stripTags(innerTag(b, "description") || innerTag(b, "summary") || innerTag(b, "content")).slice(0, 400);

    // Google News: заголовок в формате «Новость - Источник».
    if (!source && title.includes(" - ")) {
      source = title.slice(title.lastIndexOf(" - ") + 3).trim();
    }

    if (!title || !link) continue;
    items.push({ title, link, source, snippet, published_at });
  }
  return items;
}

async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EdinayaSredaRadar/1.0; +https://xn--80abeipqi4b.xn--p1ai)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export interface RadarRefreshResult {
  triggers: number;
  fetched: number;
  saved: number;
  errors: { trigger: string; error: string }[];
}

/** Обходит включённые триггеры, тянет новости и сохраняет их в БД. */
export async function refreshRadar(perFeedLimit = 30): Promise<RadarRefreshResult> {
  const triggers = (await dbListTriggers()).filter((t) => t.enabled && t.query.trim());
  const result: RadarRefreshResult = {
    triggers: triggers.length,
    fetched: 0,
    saved: 0,
    errors: [],
  };
  const now = Date.now();

  for (const t of triggers) {
    try {
      const xml = await fetchFeed(feedUrl(t));
      const parsed = parseFeed(xml).slice(0, perFeedLimit);
      result.fetched += parsed.length;

      for (const p of parsed) {
        const item: RadarItem = {
          id: radarItemId(p.link),
          trigger_id: t.id,
          category: t.category,
          title: p.title,
          link: p.link,
          source_name: p.source,
          snippet: p.snippet,
          published_at: p.published_at,
          status: "new",
          created_at: now,
        };
        await dbUpsertItem(item);
        result.saved += 1;
      }
    } catch (e) {
      result.errors.push({
        trigger: t.label || t.query,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  await dbRadarCleanup(60);
  return result;
}
