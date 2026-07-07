import "server-only";

/**
 * Статистика соцсетей для админ-дашборда.
 *
 * Реальный API статистики есть по сути только у ВКонтакте (нужен токен
 * сообщества со scope `stats`). У MAX / Дзен / Instagram публичного API
 * статистики нет (или он недоступен из РФ), поэтому эти блоки показывают
 * ссылку и пояснение, а цифры смотрятся в их кабинетах.
 *
 * ENV:
 *   VK_STATS_TOKEN — токен сообщества ВК со scope stats (и правами админа)
 *   VK_GROUP_ID    — screen name или числовой id (по умолчанию edinayasredarf)
 */

export interface SocialMetric {
  label: string;
  value: string;
}
export interface SocialPlatform {
  key: "vk" | "max" | "dzen" | "instagram";
  name: string;
  configured: boolean;
  url?: string;
  note?: string;
  metrics?: SocialMetric[];
}
export interface SocialResult {
  configured: boolean;
  platforms: SocialPlatform[];
}

const nf = new Intl.NumberFormat("ru-RU");
const fmt = (n: number) => nf.format(Math.round(n));

async function vkCall(
  method: string,
  params: Record<string, string>
): Promise<unknown> {
  const token = process.env.VK_STATS_TOKEN!;
  const url = new URL(`https://api.vk.com/method/${method}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("v", "5.199");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  const json = (await res.json()) as {
    response?: unknown;
    error?: { error_msg?: string };
  };
  if (json.error) throw new Error(json.error.error_msg || "VK API error");
  return json.response;
}

/** Блок ВКонтакте: подписчики + статистика за период. */
async function vkPlatform(from: string, to: string): Promise<SocialPlatform> {
  const screen = (process.env.VK_GROUP_ID || "edinayasredarf").trim();
  const base: SocialPlatform = {
    key: "vk",
    name: "ВКонтакте",
    configured: false,
    url: `https://vk.com/${screen}`,
  };

  if (!process.env.VK_STATS_TOKEN) {
    return { ...base, note: "Укажите VK_STATS_TOKEN (токен сообщества со scope stats)." };
  }

  try {
    // 1) сообщество: числовой id + число подписчиков
    const info = (await vkCall("groups.getById", {
      group_id: screen,
      fields: "members_count",
    })) as { groups?: Array<{ id: number; members_count?: number }> } | Array<{ id: number; members_count?: number }>;

    const group = Array.isArray(info) ? info[0] : info.groups?.[0];
    if (!group) throw new Error("Сообщество не найдено");

    const metrics: SocialMetric[] = [];
    if (typeof group.members_count === "number") {
      metrics.push({ label: "Подписчики", value: fmt(group.members_count) });
    }

    // 2) статистика посещаемости за период (нужны права админа + scope stats)
    try {
      const stats = (await vkCall("stats.get", {
        group_id: String(group.id),
        date_from: from,
        date_to: to,
        interval: "day",
      })) as Array<{ visitors?: number; views?: number; reach?: number }>;

      let views = 0;
      let visitors = 0;
      let reach = 0;
      for (const row of stats || []) {
        views += Number(row.views || 0);
        visitors += Number(row.visitors || 0);
        reach += Number(row.reach || 0);
      }
      metrics.push({ label: "Просмотры", value: fmt(views) });
      metrics.push({ label: "Посетители", value: fmt(visitors) });
      metrics.push({ label: "Охват", value: fmt(reach) });
    } catch {
      // подписчики есть, но статистика недоступна (нет прав/скоупа)
    }

    if (metrics.length === 0) throw new Error("Нет доступных метрик");
    return { ...base, configured: true, metrics };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка VK API";
    return { ...base, note: `ВК: ${msg}` };
  }
}

export async function getSocialStats(from: string, to: string): Promise<SocialResult> {
  const vk = await vkPlatform(from, to);

  const platforms: SocialPlatform[] = [
    vk,
    {
      key: "max",
      name: "MAX",
      configured: false,
      url: "https://max.ru/id6150100608_biz",
      note: "Публичного API аналитики нет — данные смотрите в кабинете MAX.",
    },
    {
      key: "dzen",
      name: "Дзен",
      configured: false,
      url: "https://dzen.ru/edinayasreda",
      note: "Статистика Дзена недоступна сторонним сервисам по API — данные в Студии Дзена.",
    },
    {
      key: "instagram",
      name: "Instagram",
      configured: false,
      note: "Instagram Graph API недоступен из РФ и требует бизнес-аккаунт Meta.",
    },
  ];

  return { configured: true, platforms };
}
