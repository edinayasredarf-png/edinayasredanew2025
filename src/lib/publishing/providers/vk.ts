import "server-only";

import { PublishError, type PublishInput, type PublishOutput, type PublishingProvider } from "@/lib/publishing/interfaces";

/**
 * Публикация на стену сообщества VK (wall.post).
 *
 * credentials:
 *   groupId     — числовой id сообщества (без минуса)
 *   accessToken — токен сообщества со scope `wall,photos,offline` (не путать
 *                 с VK_STATS_TOKEN из social.ts — тот read-only, scope `stats`)
 *
 * Лимиты/практика (см. docs/content-os-implementation-plan.md): VK банит за
 * частые запросы — здесь нет пула параллельных публикаций (публикуем по
 * одному материалу за раз из админки), поэтому троттлинг между вызовами не
 * нужен; retryable=true на кодах 6 (too many requests) и 9 (flood control)
 * позволяет вызывающей стороне показать «повторите позже», а не тихо упасть.
 */

const VK_API_VERSION = "5.199";

interface VkApiError { error_code: number; error_msg: string }
interface VkApiResponse<T> { response?: T; error?: VkApiError }

async function vkCall<T>(method: string, token: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.vk.com/method/${method}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("v", VK_API_VERSION);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { method: "POST" });
  const json = (await res.json()) as VkApiResponse<T>;
  if (json.error) {
    const retryable = json.error.error_code === 6 || json.error.error_code === 9;
    throw new PublishError(`VK ${method}: ${json.error.error_msg} (code ${json.error.error_code})`, retryable);
  }
  if (json.response === undefined) throw new PublishError(`VK ${method}: пустой ответ`);
  return json.response;
}

async function uploadPhoto(token: string, groupId: string, imageUrl: string): Promise<string> {
  const server = await vkCall<{ upload_url: string }>("photos.getWallUploadServer", token, { group_id: groupId });

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new PublishError(`Не удалось скачать изображение для VK: ${imageUrl}`);
  const blob = await imgRes.blob();

  const form = new FormData();
  form.append("photo", blob, "image.jpg");
  const uploadRes = await fetch(server.upload_url, { method: "POST", body: form });
  const uploaded = (await uploadRes.json()) as { server: number; photo: string; hash: string };

  const saved = await vkCall<Array<{ id: number; owner_id: number }>>("photos.saveWallPhoto", token, {
    group_id: groupId,
    server: String(uploaded.server),
    photo: uploaded.photo,
    hash: uploaded.hash,
  });
  const photo = saved[0];
  if (!photo) throw new PublishError("VK photos.saveWallPhoto: пустой результат");
  return `photo${photo.owner_id}_${photo.id}`;
}

export const vkProvider: PublishingProvider = {
  channel: "vk",

  async publish(input: PublishInput, credentials: Record<string, string>): Promise<PublishOutput> {
    const token = credentials.accessToken;
    const groupIdRaw = credentials.groupId;
    if (!token || !groupIdRaw) {
      throw new PublishError("Для VK не настроены groupId/accessToken (вкладка «Каналы»)");
    }
    const groupId = groupIdRaw.replace(/^-/, "");
    const ownerId = `-${groupId}`;

    const attachments: string[] = [];
    for (const url of (input.imageUrls ?? []).slice(0, 10)) {
      attachments.push(await uploadPhoto(token, groupId, url));
    }

    const resp = await vkCall<{ post_id: number }>("wall.post", token, {
      owner_id: ownerId,
      from_group: "1",
      message: input.text,
      ...(attachments.length ? { attachments: attachments.join(",") } : {}),
    });

    return {
      externalId: String(resp.post_id),
      url: `https://vk.com/wall${ownerId}_${resp.post_id}`,
    };
  },
};
