import "server-only";

import type { ContentOsChannel } from "@/lib/contentOsTypes";
import type { PublishingProvider } from "@/lib/publishing/interfaces";
import { vkProvider } from "@/lib/publishing/providers/vk";
import { telegramProvider } from "@/lib/publishing/providers/telegram";

const providers: Partial<Record<ContentOsChannel, PublishingProvider>> = {
  vk: vkProvider,
  telegram: telegramProvider,
  // dzen, max — нет официального API для прямой публикации (см. integrations.md).
  // article — публикуется штатным механизмом сайта, не через этот слой.
};

export function getPublishingProvider(channel: ContentOsChannel): PublishingProvider | null {
  return providers[channel] ?? null;
}

export { PublishError } from "@/lib/publishing/interfaces";
export type { PublishInput, PublishOutput } from "@/lib/publishing/interfaces";
