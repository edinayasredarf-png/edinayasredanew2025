import "server-only";

import { dbListSources, dbTouchSourcePolled, dbUpsertSourceItem, dbCleanupSourceItems } from "@/lib/server/contentOsDb";
import {
  contentSourceItemId,
  fetchText,
  googleNewsSearchUrl,
  parseFeedXml,
  parseTelegramChannelHtml,
  telegramChannelUrl,
  telegramUsername,
  type ParsedFeedItem,
} from "@/lib/server/contentOsFetch";
import type { ContentSource } from "@/lib/contentOsTypes";
import { DEFAULT_COMPANY_ID } from "@/lib/contentOsTypes";

function feedUrlFor(source: ContentSource): string {
  if (source.type === "rss" || source.type === "website") return source.url.trim();
  return googleNewsSearchUrl(source.url);
}

export interface SourcePollResult {
  sources: number;
  fetched: number;
  saved: number;
  errors: { source: string; error: string }[];
}

/**
 * Опрашивает активные источники компании и сохраняет новые записи в
 * content_source_items. Нет выделенного cron-слота (Vercel Hobby, см.
 * audit.md) — вызывается вручную кнопкой «Собрать сейчас» в Sources,
 * как и «Обработать очередь» у AI Sales (тот же паттерн).
 */
export async function refreshContentOsSources(
  companyId: string = DEFAULT_COMPANY_ID,
  perSourceLimit = 30
): Promise<SourcePollResult> {
  const sources = (await dbListSources(companyId)).filter((s) => s.active && s.url.trim());
  const result: SourcePollResult = { sources: sources.length, fetched: 0, saved: 0, errors: [] };
  const now = Date.now();

  for (const source of sources) {
    try {
      let parsed: ParsedFeedItem[];
      if (source.type === "telegram") {
        const username = telegramUsername(source.url);
        const html = await fetchText(telegramChannelUrl(source.url));
        parsed = parseTelegramChannelHtml(html, username);
      } else {
        const xml = await fetchText(feedUrlFor(source));
        parsed = parseFeedXml(xml);
      }

      const candidates = parsed.slice(0, perSourceLimit);
      result.fetched += candidates.length;

      for (const p of candidates) {
        await dbUpsertSourceItem({
          id: contentSourceItemId(p.link),
          source_id: source.id,
          company_id: companyId,
          category: source.categories[0] ?? "other",
          title: p.title,
          link: p.link,
          source_name: p.sourceName || source.name,
          snippet: p.snippet,
          published_at: p.publishedAt,
        });
        result.saved += 1;
      }

      await dbTouchSourcePolled(source.id, now);
    } catch (e) {
      result.errors.push({ source: source.name, error: e instanceof Error ? e.message : String(e) });
    }
  }

  await dbCleanupSourceItems(60);
  return result;
}
