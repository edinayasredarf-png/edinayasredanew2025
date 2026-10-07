import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bbLink, crmLink, sendBotMessage } from "@/lib/server/bitrix/messenger";
import { getSettingValue } from "@/lib/server/aiSales/settingsDb";

/**
 * Личное сообщение менеджеру, который говорил с клиентом: «как лучше было ответить» из разбора звонка —
 * от бота в Bitrix24, с названием сделки и ссылкой. Шлём только по свежим звонкам (не по бэкфиллу прошлых недель).
 */
const MAX_AGE_HOURS = Math.max(1, Number(process.env.COACH_MAX_AGE_HOURS) || 48);

interface Row {
  bitrix_user_id: string | null;
  bitrix_deal_id: string | null;
  bitrix_lead_id: string | null;
  started_at: Date | null;
  data: {
    managerScoreApplicable?: boolean;
    managerPerformance?: { exampleBetterResponse?: string | null; improveNextTime?: string[] };
  } | null;
  deal_title: string | null;
  company_title: string | null;
  client_title: string | null;
}

export async function runCoachNotify(callId: string): Promise<unknown> {
  if ((await getSettingValue<boolean>("briefs.coachEnabled", true)) === false) return { skipped: "выключено в настройках" };

  const { rows } = await getTimewebPool().query<Row>(
    `select c.bitrix_user_id, c.bitrix_deal_id, c.bitrix_lead_id, c.started_at, a.data,
            d.title as deal_title, co.title as company_title, c.client_title
       from ai_calls c
       left join lateral (select data from ai_call_analysis aa where aa.call_id = c.id order by aa.created_at desc limit 1) a on true
       left join ai_deals d on d.bitrix_deal_id = c.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = coalesce(c.bitrix_company_id, d.bitrix_company_id)
      where c.id = $1`,
    [callId]
  );
  const r = rows[0];
  if (!r) return { skipped: "звонок не найден" };
  if (!r.bitrix_user_id) return { skipped: "нет менеджера у звонка" };
  if (r.started_at && Date.now() - r.started_at.getTime() > MAX_AGE_HOURS * 3600_000) return { skipped: `звонок старше ${MAX_AGE_HOURS} ч` };
  if (r.data?.managerScoreApplicable === false) return { skipped: "технический звонок" };

  const better = (r.data?.managerPerformance?.exampleBetterResponse ?? "").trim();
  if (better.length < 20) return { skipped: "в разборе нет рекомендации «как лучше ответить»" };

  const isDeal = Boolean(r.bitrix_deal_id);
  const id = (isDeal ? r.bitrix_deal_id : r.bitrix_lead_id) ?? "";
  const name = [r.deal_title, r.company_title ?? r.client_title].filter(Boolean).join(" — ") || `${isDeal ? "Сделка" : "Лид"} #${id}`;
  const when = r.started_at ? r.started_at.toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  const link = id ? crmLink(isDeal ? "deal" : "lead", id) : "";

  const text =
    `[B]Разбор вашего звонка${when ? ` от ${when}` : ""}[/B]\n` +
    `${isDeal ? "Сделка" : "Лид"}: ${bbLink(link, name)}\n\n` +
    `[B]Как лучше было ответить:[/B]\n${better}`;
  const res = await sendBotMessage(r.bitrix_user_id, text);
  if (res.notConfigured) return { skipped: res.error };
  if (!res.ok) throw new Error(`Не удалось отправить сообщение менеджеру: ${res.error}`);
  return { sentTo: r.bitrix_user_id, via: res.via };
}
