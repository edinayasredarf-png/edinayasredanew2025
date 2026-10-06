import "server-only";

import { bitrixCall } from "@/lib/server/bitrix";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";
import { getTimewebPool } from "@/lib/timewebPg";
import { agentSearchChat, gatewayChat } from "@/lib/ai/gatewayChat";
import { getBriefModels } from "@/lib/server/aiSales/settingsDb";
import {
  insertBrief, markBrief, previousTriggerUrls,
  type BriefEntity, type BriefTrigger,
} from "@/lib/server/aiSales/briefsDb";

/**
 * AI-бриф по лиду / сделке: данные CRM Bitrix24 + свежие «информационные триггеры» из
 * интернета (новости, бюджеты и программы, закупки, пересечения с нашими услугами, соседи).
 * Результат: запись в ai_briefs, текст в пользовательское поле Bitrix, уведомление в Bitrix.
 */

/** Пользовательские поля Bitrix (можно переопределить через env). */
const LEAD_FIELD = process.env.BRIEF_LEAD_FIELD?.trim() || "UF_CRM_1791289652";
const DEAL_FIELD = process.env.BRIEF_DEAL_FIELD?.trim() || "UF_CRM_1791289910";
const FIELD_MAX_CHARS = 15000;

type Row = Record<string, unknown>;
const s = (v: unknown): string => (v == null ? "" : String(v).trim());

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

/* ───────────────────────── 1. Данные CRM ───────────────────────── */

export interface CrmSnapshot {
  entityType: BriefEntity;
  entityId: string;
  title: string;
  companyTitle: string;
  responsibleId: string | null;
  region: string;
  data: Record<string, unknown>;
}

function multi(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => s((x as Row)?.VALUE)).filter(Boolean) : [];
}

export async function gatherCrm(entityType: BriefEntity, id: string): Promise<CrmSnapshot> {
  const ownerTypeId = entityType === "lead" ? 1 : 2;
  const get = await bitrixCall<Row>(entityType === "lead" ? "crm.lead.get" : "crm.deal.get", { id });
  const e = get.result || {};
  if (!e.ID) throw new Error(`${entityType === "lead" ? "Лид" : "Сделка"} ${id} не найден(а) в Bitrix`);

  const companyId = s(e.COMPANY_ID);
  const contactId = s(e.CONTACT_ID);

  const [company, requisites, contact, comments, activities, pastDeals] = await Promise.all([
    companyId && companyId !== "0" ? safe(async () => (await bitrixCall<Row>("crm.company.get", { id: companyId })).result) : null,
    companyId && companyId !== "0" ? safe(async () => (await bitrixCall<Row[]>("crm.requisite.list", {
      filter: { ENTITY_TYPE_ID: 4, ENTITY_ID: companyId }, select: ["RQ_INN", "RQ_KPP", "RQ_OGRN", "NAME"],
    })).result) : null,
    contactId && contactId !== "0" ? safe(async () => (await bitrixCall<Row>("crm.contact.get", { id: contactId })).result) : null,
    safe(async () => (await bitrixCall<Row[]>("crm.timeline.comment.list", {
      filter: { ENTITY_ID: id, ENTITY_TYPE: entityType }, select: ["ID", "CREATED", "COMMENT"],
    })).result),
    safe(async () => (await bitrixCall<Row[]>("crm.activity.list", {
      filter: { OWNER_ID: id, OWNER_TYPE_ID: ownerTypeId }, order: { CREATED: "DESC" },
      select: ["ID", "TYPE_ID", "SUBJECT", "DESCRIPTION", "CREATED", "DIRECTION", "COMPLETED"],
    })).result),
    companyId && companyId !== "0" ? safe(async () => (await bitrixCall<Row[]>("crm.deal.list", {
      filter: { COMPANY_ID: companyId }, order: { DATE_CREATE: "DESC" },
      select: ["ID", "TITLE", "STAGE_ID", "OPPORTUNITY", "CURRENCY", "DATE_CREATE", "CLOSED"],
    })).result) : null,
  ]);

  const contactName = contact ? [s(contact.LAST_NAME), s(contact.NAME), s(contact.SECOND_NAME)].filter(Boolean).join(" ") : [s(e.LAST_NAME), s(e.NAME)].filter(Boolean).join(" ");
  const companyTitle = s(company?.TITLE) || s(e.COMPANY_TITLE) || "";
  const requisite = Array.isArray(requisites) ? requisites[0] : null;

  const data: Record<string, unknown> = {
    [entityType === "lead" ? "Лид" : "Сделка"]: {
      id, название: s(e.TITLE), стадия: s(e.STAGE_ID || e.STATUS_ID), сумма: s(e.OPPORTUNITY), валюта: s(e.CURRENCY_ID),
      источник: s(e.SOURCE_ID), описание_источника: s(e.SOURCE_DESCRIPTION), ответственный_id: s(e.ASSIGNED_BY_ID),
      создан: s(e.DATE_CREATE), изменён: s(e.DATE_MODIFY), комментарий: s(e.COMMENTS),
    },
    Компания: { название: companyTitle, инн: s(requisite?.RQ_INN), кпп: s(requisite?.RQ_KPP), огрн: s(requisite?.RQ_OGRN),
      юр_адрес: s(company?.ADDRESS_LEGAL || company?.ADDRESS || e.ADDRESS), город_регион: s(company?.ADDRESS_CITY || e.ADDRESS_CITY || e.ADDRESS_PROVINCE) },
    Контакт: { фио: contactName, должность: s(contact?.POST || e.POST), телефоны: multi(contact?.PHONE ?? e.PHONE), email: multi(contact?.EMAIL ?? e.EMAIL) },
    Комментарии: (Array.isArray(comments) ? comments : []).slice(0, 15).map((c) => ({ дата: s(c.CREATED), текст: s(c.COMMENT).slice(0, 600) })),
    Активности: (Array.isArray(activities) ? activities : []).slice(0, 20).map((a) => ({
      дата: s(a.CREATED), тип: s(a.TYPE_ID), тема: s(a.SUBJECT), описание: s(a.DESCRIPTION).slice(0, 400),
    })),
    Прошлые_сделки_компании: (Array.isArray(pastDeals) ? pastDeals : []).filter((d) => s(d.ID) !== id).slice(0, 15).map((d) => ({
      id: s(d.ID), название: s(d.TITLE), стадия: s(d.STAGE_ID), сумма: s(d.OPPORTUNITY), создана: s(d.DATE_CREATE), закрыта: s(d.CLOSED),
    })),
  };

  // Наши собственные разборы звонков (локальная БД) — что уже обсуждали.
  if (entityType === "deal") {
    const ins = await safe(async () => (await getTimewebPool().query<{ summary: string | null; next_action: string | null }>(
      `select data->>'summary' as summary, next_action from ai_deal_insights where bitrix_deal_id = $1`, [id])).rows[0]);
    if (ins?.summary) data["AI_разбор_звонков"] = { резюме: ins.summary.slice(0, 1500), следующий_шаг: ins.next_action };
  }

  return {
    entityType, entityId: id, title: s(e.TITLE), companyTitle: companyTitle || s(e.TITLE),
    responsibleId: s(e.ASSIGNED_BY_ID) || null,
    region: s(company?.ADDRESS_PROVINCE || company?.ADDRESS_CITY || e.ADDRESS_PROVINCE || e.ADDRESS_CITY),
    data,
  };
}

/* ───────────────────────── 2. Поиск и сборка (AI Gateway Timeweb) ───────────────────────── */

/** Шаг 1 — AI-агент Timeweb с веб-поиском: ищет в интернете и отдаёт факты со ссылками. */
const SEARCH_SYSTEM = `Ты — исследователь-аналитик отдела продаж компании «Единая среда» (цифровая платформа учёта и управления территориями и муниципальными объектами; услуги: инвентаризация мест захоронений, инвентаризация и паспортизация зелёных насаждений, цифровое лесоустройство, благоустройство, озеленение, содержание кладбищ).
Найди в интернете актуальную информацию («информационные триггеры») по указанной организации и её региону:
1. Свежие новости об организации и её руководстве (смена главы/директора, кадровые изменения, выборы).
2. Бюджетные и муниципальные программы, нацпроекты, гранты, на которые сейчас выделены деньги.
3. Тендеры и закупки (в т.ч. 44-ФЗ/223-ФЗ) по их профилю.
4. Направления, пересекающиеся с нашими услугами (инвентаризация захоронений и зелёных насаждений, благоустройство, озеленение, содержание кладбищ).
5. Что делают соседние районы/организации региона («соседи уже делают»).
Правила: приоритет материалов последних 12 месяцев; не выдумывай — если по пункту ничего не найдено, так и напиши; у КАЖДОГО факта указывай дату и URL источника; не путай организации-тёзки (сверяй регион/ИНН). Ответ — по пунктам 1–5, кратко.`;

/** Шаг 2 — модель БРИФА: CRM + найденное → итоговый бриф. */
const SYSTEM = `Ты — помощник отдела продаж компании «Единая среда» (цифровая платформа учёта и управления территориями; услуги: инвентаризация мест захоронений, инвентаризация и паспортизация зелёных насаждений, цифровое лесоустройство, благоустройство, озеленение, содержание кладбищ, контроль подрядчиков).
Готовишь бриф менеджеру перед звонком. Тебе даны данные CRM и результаты поиска в интернете. Используй ТОЛЬКО эти данные, ничего не выдумывай; если данных нет — так и пиши.

Формат ответа (обычный текст, без Markdown-таблиц), разделы строго в таком порядке:
Компания и контакты
Состояние сделки (что было, что сейчас)
Потребность и точки входа (наши услуги, которые могут быть актуальны)
Информационные триггеры из новостей и закупок (с датами и источниками)
Рекомендуемая цель звонка и одно ключевое предложение

В самом конце, после текста, выведи блок \`\`\`json со списком найденных триггеров:
[{"title":"...","date":"YYYY-MM-DD или null","url":"https://...","source":"домен","kind":"news|procurement|budget|competitor|neighbors|other"}]
Только реальные триггеры из результатов поиска (URL бери оттуда), максимум 12. Если ничего нет — [].`;

export interface ResearchResult { text: string; triggers: BriefTrigger[] }

function parseResult(raw: string): ResearchResult {
  const m = raw.match(/```json\s*([\s\S]*?)```/i);
  let triggers: BriefTrigger[] = [];
  if (m) {
    try {
      const arr = JSON.parse(m[1]);
      if (Array.isArray(arr)) {
        triggers = arr.map((t: Row): BriefTrigger => ({
          title: s(t.title).slice(0, 300), date: s(t.date) && s(t.date) !== "null" ? s(t.date).slice(0, 10) : null,
          url: s(t.url) || null, source: s(t.source) || null, kind: s(t.kind) || "other",
        })).filter((t) => t.title);
      }
    } catch { /* оставляем пусто — текст всё равно полезен */ }
  }
  const text = (m ? raw.slice(0, m.index) : raw).trim();
  return { text, triggers };
}

export async function researchWeb(snap: CrmSnapshot): Promise<ResearchResult> {
  const models = await getBriefModels();
  const today = new Date().toISOString().slice(0, 10);
  const company = snap.data["Компания"] as Row | undefined;
  const who = `«${snap.companyTitle}»${s(company?.инн) ? `, ИНН ${s(company?.инн)}` : ""}${snap.region ? `, регион: ${snap.region}` : ""}${s(company?.юр_адрес) ? `, адрес: ${s(company?.юр_адрес)}` : ""}`;

  // Шаг 1: поиск в интернете через AI-агента (бюджет ~28 с — вся функция на Vercel Hobby живёт 60 с).
  const found = await agentSearchChat({
    system: SEARCH_SYSTEM, timeoutMs: 28_000, model: models.search,
    user: `Организация: ${who}. Сегодня ${today}. Найди информационные триггеры по пунктам 1–5.`,
  });
  const sources = found.citations.map((c) => `- ${c.title ? `${c.title}: ` : ""}${c.url}`).join("\n");
  const research = `${found.text}${sources ? `\n\nСсылки, найденные поиском:\n${sources}` : ""}`;

  // Шаг 2: анализ CRM + результатов поиска → бриф (бюджет ~25 с).
  const brief = await gatewayChat({
    model: models.brief, system: SYSTEM, maxTokens: 3500, timeoutMs: 25_000,
    user: `Подготовь бриф по ${snap.entityType === "lead" ? "лиду" : "сделке"} #${snap.entityId} («${snap.title}»), организация: ${who}.\nСегодня ${today}.\n\nДанные из CRM (JSON):\n${JSON.stringify(snap.data, null, 1).slice(0, 9000)}\n\nРезультаты поиска в интернете:\n${research.slice(0, 9000)}`,
  });
  if (!brief.text.trim()) throw new Error("Модель вернула пустой бриф");
  const parsed = parseResult(brief.text);
  // Если модель не вернула JSON, но поиск дал ссылки — оформляем их как триггеры без классификации.
  if (!parsed.triggers.length && found.citations.length) {
    parsed.triggers = found.citations.slice(0, 8).map((c) => ({ title: c.title || c.url, date: null, url: c.url, source: new URL(c.url).hostname, kind: "other" }));
  }
  return parsed;
}

/* ───────────────────────── 3. Запись в Bitrix и уведомления ───────────────────────── */

function plainForBitrix(snap: CrmSnapshot, text: string, triggers: BriefTrigger[]): string {
  const date = new Date().toLocaleDateString("ru-RU");
  const links = triggers.filter((t) => t.url).map((t) => `• ${t.date ? `[${t.date}] ` : ""}${t.title} — ${t.url}`).join("\n");
  const body = `AI-бриф от ${date}\n\n${text}${links ? `\n\nИсточники:\n${links}` : ""}`;
  return body.length > FIELD_MAX_CHARS ? `${body.slice(0, FIELD_MAX_CHARS - 20)}\n…(обрезано)` : body;
}

async function pushToBitrix(snap: CrmSnapshot, text: string): Promise<void> {
  const field = snap.entityType === "lead" ? LEAD_FIELD : DEAL_FIELD;
  await bitrixCall(snap.entityType === "lead" ? "crm.lead.update" : "crm.deal.update", { id: snap.entityId, fields: { [field]: text } });
}

/** Bitrix-ID пользователей с ролью «РОП» в админке (user_profiles.role = 'rop'). */
async function ropBitrixIds(): Promise<string[]> {
  const { rows } = await getTimewebPool().query<{ bitrix_user_id: string }>(
    `select m.bitrix_user_id from ai_managers m join user_profiles u on u.id = m.user_profile_id where u.role = 'rop' and m.active`);
  return rows.map((r) => r.bitrix_user_id);
}

async function notify(userIds: string[], message: string): Promise<boolean> {
  let ok = false;
  for (const uid of [...new Set(userIds.filter(Boolean))]) {
    try {
      await bitrixCall("im.notify.system.add", { USER_ID: uid, MESSAGE: message });
      ok = true;
    } catch {
      try { await bitrixCall("im.notify", { to: uid, message, type: "SYSTEM" }); ok = true; } catch { /* нет прав im — пропускаем */ }
    }
  }
  return ok;
}

/* ───────────────────────── 4. Оркестрация ───────────────────────── */

export interface BriefRunResult { briefId: string; newTriggers: number; pushed: boolean; notified: boolean }

export async function runBrief(entityType: BriefEntity, id: string, opts: { notifyAlways?: boolean } = {}): Promise<BriefRunResult> {
  const snap = await gatherCrm(entityType, id);
  let research: ResearchResult;
  try {
    research = await researchWeb(snap);
  } catch (e) {
    await insertBrief({ entityType, entityId: id, title: snap.title, companyTitle: snap.companyTitle, bitrixUserId: snap.responsibleId,
      briefText: null, triggers: [], newTriggers: 0, status: "FAILED", error: e instanceof Error ? e.message : String(e) });
    throw e;
  }

  // «Новое» — триггеры, чьих ссылок не было в прошлых брифах по этой сущности.
  const seen = await previousTriggerUrls(entityType, id);
  const hadBefore = seen.size > 0;
  const triggers = research.triggers.map((t) => ({ ...t, isNew: hadBefore ? !(t.url && seen.has(t.url)) : false }));
  const newCount = hadBefore ? triggers.filter((t) => t.isNew).length : 0;

  const briefId = await insertBrief({
    entityType, entityId: id, title: snap.title, companyTitle: snap.companyTitle, bitrixUserId: snap.responsibleId,
    briefText: research.text, triggers, newTriggers: newCount, status: "READY",
  });

  // В поле Bitrix пишем всегда для первого брифа; для повторных — только если есть новое.
  let pushed = false;
  if (!hadBefore || newCount > 0) {
    pushed = !!(await safe(async () => { await pushToBitrix(snap, plainForBitrix(snap, research.text, triggers)); return true; }));
    if (pushed) await markBrief(briefId, { pushed: true });
  }

  // Уведомляем: по новому лиду — всегда; по отложенным сделкам — только при новых триггерах.
  let notified = false;
  if (opts.notifyAlways || newCount > 0) {
    const origin = bitrixPortalOrigin();
    const url = origin ? `${origin}/crm/${entityType}/details/${id}/` : "";
    const head = entityType === "lead" ? "Новый лид — готов AI-бриф" : "Отложенный спрос — найдено новое";
    const top = triggers.filter((t) => t.isNew || !hadBefore).slice(0, 3).map((t) => `• ${t.title}${t.date ? ` (${t.date})` : ""}`).join("\n");
    const msg = `${head}: ${url ? `[URL=${url}]${snap.companyTitle || snap.title}[/URL]` : snap.companyTitle || snap.title}${top ? `\n${top}` : ""}\nПодробности — в поле «Бриф» карточки и в админке (Речевая аналитика → Брифы).`;
    const rops = (await safe(ropBitrixIds)) ?? [];
    notified = await notify([...(snap.responsibleId ? [snap.responsibleId] : []), ...rops], msg);
    if (notified) await markBrief(briefId, { notified: true });
  }
  return { briefId, newTriggers: newCount, pushed, notified };
}
