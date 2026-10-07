import "server-only";

import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * Личные сообщения в Bitrix24 от сотрудника-бота («Эко_бот»).
 *
 * Сообщения через входящий вебхук приходят от пользователя, под которым вебхук создан. Поэтому для рассылки
 * нужен ОТДЕЛЬНЫЙ входящий вебхук, созданный под «Эко_ботом» (права: «Чат и уведомления» (im), «Пользователи» (user)):
 *   BITRIX_BOT_WEBHOOK_URL=https://<портал>.bitrix24.ru/rest/<id бота>/<код>/
 * Если переменная не задана, используется основной вебхук (BITRIX24_WEBHOOK_URL) — тогда автор сообщения
 * будет владелец основного вебхука.
 */

function botBase(): string {
  const raw = (process.env.BITRIX_BOT_WEBHOOK_URL || process.env.BITRIX24_WEBHOOK_URL || "").trim();
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export function botWebhookConfigured(): boolean {
  return Boolean(process.env.BITRIX_BOT_WEBHOOK_URL?.trim());
}

async function call(base: string, method: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${base}${method}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await res.text().catch(() => "");
  let json: { result?: unknown; error?: string; error_description?: string } = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch { /* не JSON */ }
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || `Битрикс ${method}: HTTP ${res.status}${raw ? ` ${raw.slice(0, 160)}` : ""}`);
  }
  return json.result;
}

/** Кто автор сообщений (владелец вебхука бота и основного вебхука) — для диагностики. */
export async function whoAmI(): Promise<{ bot: { id: string; name: string } | null; main: { id: string; name: string } | null; botConfigured: boolean }> {
  const info = async (base: string) => {
    try {
      const u = (await call(base, "user.current", {})) as { ID?: string; NAME?: string; LAST_NAME?: string };
      return { id: String(u.ID ?? ""), name: [u.NAME, u.LAST_NAME].filter(Boolean).join(" ") };
    } catch { return null; }
  };
  const mainRaw = (process.env.BITRIX24_WEBHOOK_URL || "").trim();
  const main = mainRaw ? await info(mainRaw.endsWith("/") ? mainRaw : `${mainRaw}/`) : null;
  const botRaw = (process.env.BITRIX_BOT_WEBHOOK_URL || "").trim();
  const bot = botRaw ? await info(botRaw.endsWith("/") ? botRaw : `${botRaw}/`) : null;
  return { bot, main, botConfigured: botWebhookConfigured() };
}

/** Ссылка на карточку сделки/лида в портале. */
export function crmLink(type: "deal" | "lead", id: string): string {
  const origin = bitrixPortalOrigin();
  return origin ? `${origin}/crm/${type}/details/${id}/` : "";
}

/** BB-ссылка Bitrix: [URL=...]текст[/URL]; без адреса — просто текст. */
export function bbLink(url: string, text: string): string {
  const safe = text.replace(/[\[\]]/g, "");
  return url ? `[URL=${url}]${safe}[/URL]` : safe;
}

/**
 * Личное сообщение пользователю. Сначала im.message.add (живой личный диалог от бота), при отказе — системное
 * уведомление (колокольчик). Возвращает, чем доставлено.
 */
export async function sendBotMessage(userId: string, text: string): Promise<{ ok: boolean; via?: "dialog" | "notify"; error?: string }> {
  const base = botBase();
  const message = text.length > 15000 ? `${text.slice(0, 14980)}\n…` : text;
  try {
    await call(base, "im.message.add", { USER_ID: userId, MESSAGE: message, SYSTEM: "N", URL_PREVIEW: "N" });
    return { ok: true, via: "dialog" };
  } catch (e1) {
    try {
      await call(base, "im.notify.system.add", { USER_ID: userId, MESSAGE: message });
      return { ok: true, via: "notify" };
    } catch (e2) {
      return { ok: false, error: `${e1 instanceof Error ? e1.message : e1}; ${e2 instanceof Error ? e2.message : e2}`.slice(0, 300) };
    }
  }
}
