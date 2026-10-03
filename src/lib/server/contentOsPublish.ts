import "server-only";

import { dbGetItem, dbGetChannelProfile, dbUpsertPublication, dbUpsertItem } from "@/lib/server/contentOsDb";
import { getPublishingProvider } from "@/lib/publishing";
import { DEFAULT_COMPANY_ID, type ContentOsChannel } from "@/lib/contentOsTypes";

export interface PublishContentItemResult {
  status: "published" | "failed";
  url: string | null;
  externalId: string | null;
  error: string | null;
}

/**
 * Реальная публикация content_item в канал (VK/Telegram, остальные пока
 * только вручную — см. publishing/index.ts). Идемпотентность уже обеспечена
 * на уровне dbUpsertPublication (§29 ТЗ: один item+channel = одна активная
 * попытка) — повторный вызов на том же item просто обновит ту же запись,
 * не создаст вторую публикацию.
 */
export async function publishContentItem(
  itemId: string,
  channel: ContentOsChannel,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<PublishContentItemResult> {
  const item = await dbGetItem(itemId);
  if (!item) throw new Error("Материал не найден");
  if (item.channel !== channel) {
    throw new Error(`Материал относится к каналу «${item.channel}», а не «${channel}»`);
  }

  const provider = getPublishingProvider(channel);
  if (!provider) {
    throw new Error(`Автопубликация для канала «${channel}» не поддерживается — отметьте публикацию вручную`);
  }

  const profile = await dbGetChannelProfile(channel, companyId);
  const credentials = profile?.credentials ?? {};

  const meta = (item.meta ?? {}) as Record<string, unknown>;
  const imageUrls = Array.isArray(meta.imageUrls) ? (meta.imageUrls as string[]) : undefined;

  try {
    const result = await provider.publish({ text: item.body, imageUrls }, credentials);
    await dbUpsertPublication({
      content_item_id: itemId,
      channel,
      status: "published",
      url: result.url,
      external_id: result.externalId,
      published_at: Date.now(),
    });
    await dbUpsertItem({ id: itemId, cluster_id: item.cluster_id, channel, status: "published" });
    return { status: "published", url: result.url, externalId: result.externalId, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await dbUpsertPublication({ content_item_id: itemId, channel, status: "failed", error: message });
    return { status: "failed", url: null, externalId: null, error: message };
  }
}
