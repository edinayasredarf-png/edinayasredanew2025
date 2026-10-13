import "server-only";

import { createHash } from "node:crypto";
import { getTimewebPool } from "@/lib/timewebPg";
import { bbLink, crmLink, sendBotMessage } from "@/lib/server/bitrix/messenger";
import { getBriefRopIds, getSettingValue } from "@/lib/server/aiSales/settingsDb";
import { BLOCKS, DEFAULT_NOTIFY_RULES, type NotifyRule, type NotifySource } from "@/lib/notifyBlocks";

/**
 * Личные сообщения в Bitrix24 по правилам: кому (ответственный / выбранные сотрудники / РОП),
 * по каким менеджерам, по каким условиям и какие блоки разбора звонка или сделки включить в текст.
 * Правила — настройка `notify.rules`; пока она не задана, действует стандартное «как лучше было ответить» менеджеру.
 */

let ensured: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!ensured) {
    ensured = getTimewebPool()
      .query(`
        CREATE TABLE IF NOT EXISTS ai_notifications (
          rule_id text NOT NULL, entity_key text NOT NULL, recipient text NOT NULL,
          text_hash text NOT NULL, sent_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (rule_id, entity_key, recipient)
        );
      `)
      .then(() => undefined)
      .catch((e) => { ensured = null; throw e; });
  }
  return ensured;
}

export async function loadNotifyRules(): Promise<NotifyRule[]> {
  const saved = await getSettingValue<NotifyRule[] | undefined>("notify.rules", undefined);
  if (Array.isArray(saved)) return saved.filter((r) => r && r.id && (r.source === "call" || r.source === "deal"));
  // Совместимость: старый переключатель «присылать менеджеру разбор» отключает стандартное правило.
  const legacyOff = (await getSettingValue<boolean>("briefs.coachEnabled", true)) === false;
  return DEFAULT_NOTIFY_RULES.map((r) => (r.id === "call-coach" && legacyOff ? { ...r, enabled: false } : r));
}

const list = (items: Array<string | null | undefined> | undefined, limit = 5): string[] =>
  (items ?? []).map((x) => (x ?? "").trim()).filter(Boolean).slice(0, limit);
const bullets = (items: string[]) => items.map((x) => `• ${x}`).join("\n");
const section = (title: string, body: string) => (body.trim() ? `[B]${title}[/B]\n${body.trim()}` : "");
const TEMP: Record<string, string> = { HOT: "горячая", WARM: "тёплая", COLD: "холодная" };

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function callBlock(key: string, d: Any): string {
  const mp: Any = d.managerPerformance ?? {};
  switch (key) {
    case "summary": return section("Кратко о разговоре", String(d.summary ?? ""));
    case "coach": {
      const t = String(mp.exampleBetterResponse ?? "").trim();
      return t.length >= 20 ? section("Как лучше было ответить", t) : "";
    }
    case "didWell": return section("Что получилось", bullets(list(mp.didWell)));
    case "mistakes": return section("Ошибки", bullets(list(mp.mistakes)));
    case "improve": return section("Что улучшить в следующий раз", bullets(list(mp.improveNextTime)));
    case "objections": {
      const o = (Array.isArray(d.objections) ? d.objections : []).filter((x: Any) => x && x.handled !== true).slice(0, 4);
      return section("Возражения клиента", o.map((x: Any) => `• ${x.text}${x.recommendation ? ` — ${x.recommendation}` : ""}`).join("\n"));
    }
    case "nextStep": {
      const n: Any = d.nextStep ?? {};
      return n.action ? section("Следующий шаг", `${n.action}${n.deadline ? ` (до ${n.deadline})` : ""}`) : "";
    }
    case "commitments": return section("Обещания", bullets(list((d.commitments ?? []).map((c: Any) => (typeof c === "string" ? c : c?.text ?? c?.what)))));
    case "needs": return section("Потребности и боли клиента", bullets([...list(d.needs), ...list(d.painPoints)].slice(0, 6)));
    case "risks": return section("Риски", bullets(list(d.risks)));
    case "scores": {
      const parts = [
        typeof mp.overall === "number" ? `оценка менеджера: ${mp.overall}/10` : "",
        typeof d.dealScore?.score === "number" ? `готовность клиента к покупке: ${d.dealScore.score}/100` : "",
        d.dealScore?.temperature ? `температура: ${TEMP[d.dealScore.temperature] ?? d.dealScore.temperature}` : "",
      ].filter(Boolean);
      return section("Оценки", parts.join("; "));
    }
  }
  return "";
}

function dealBlock(key: string, d: Any, managerScore: number | null): string {
  const ma: Any = d.managerAssessment ?? {};
  switch (key) {
    case "dealSummary": return section("Сводка по сделке", String(d.summary ?? ""));
    case "nextBestAction": {
      const n = d.nextBestAction;
      const t = typeof n === "string" ? n : n?.action ?? "";
      return section("Что делать дальше", String(t));
    }
    case "risks": return section("Риски", bullets(list((d.risks ?? []).map((r: Any) => (typeof r === "string" ? r : r?.text ?? r?.risk)))));
    case "keyFacts": {
      const k: Any = d.keyFacts ?? {};
      const rows = [
        k.budget && `Бюджет: ${k.budget}`, k.timeline && `Сроки: ${k.timeline}`, k.decisionMaker && `Принимает решение: ${k.decisionMaker}`,
        Array.isArray(k.products) && k.products.length && `Продукты: ${k.products.join(", ")}`, k.currentSolution && `Сейчас используют: ${k.currentSolution}`,
      ].filter(Boolean) as string[];
      return section("Ключевые факты", bullets(rows));
    }
    case "coaching": return section("Что улучшить", bullets([...list(ma.weaknesses), ...list(ma.coaching)].slice(0, 6)));
    case "strengths": return section("Сильные стороны", bullets(list(ma.strengths)));
    case "stage": {
      const s = d.stageRecommendation;
      const t = typeof s === "string" ? s : s?.recommendation ?? s?.stage ?? "";
      return section("Рекомендация по стадии", String(t));
    }
    case "scores": {
      const parts = [
        typeof d.dealScore?.score === "number" ? `готовность клиента к покупке: ${d.dealScore.score}/100` : "",
        d.dealScore?.temperature ? `температура: ${TEMP[d.dealScore.temperature] ?? d.dealScore.temperature}` : "",
        managerScore != null ? `оценка менеджера: ${managerScore}/10` : "",
      ].filter(Boolean);
      return section("Оценки", parts.join("; "));
    }
  }
  return "";
}

function buildBody(source: NotifySource, rule: NotifyRule, data: Any, managerScore: number | null): string {
  const allowed = new Set(BLOCKS[source].map((b) => b.key));
  return rule.blocks
    .filter((k) => allowed.has(k))
    .map((k) => (source === "call" ? callBlock(k, data) : dealBlock(k, data, managerScore)))
    .filter(Boolean)
    .join("\n\n");
}

async function recipientsFor(rule: NotifyRule, ownerId: string | null): Promise<string[]> {
  const set = new Set<string>();
  if (rule.recipients.owner && ownerId) set.add(ownerId);
  for (const id of rule.recipients.managerIds ?? []) if (/^\d+$/.test(String(id))) set.add(String(id));
  if (rule.recipients.rop) for (const id of await getBriefRopIds()) set.add(id);
  return [...set];
}

/** Отправка с защитой от дублей: одно правило — один получатель — одна сущность; тот же текст повторно не шлём. */
async function deliver(rule: NotifyRule, entityKey: string, recipients: string[], text: string, opts: { resendAfterHours?: number } = {}): Promise<{ sent: string[]; failed: string[]; dup: number; via?: string }> {
  await ensureSchema();
  const pool = getTimewebPool();
  const hash = createHash("sha1").update(text).digest("hex");
  const out = { sent: [] as string[], failed: [] as string[], dup: 0, via: undefined as string | undefined };
  for (const to of recipients) {
    const { rows } = await pool.query<{ text_hash: string; sent_at: Date }>(
      `select text_hash, sent_at from ai_notifications where rule_id = $1 and entity_key = $2 and recipient = $3`,
      [rule.id, entityKey, to]
    );
    const prev = rows[0];
    if (prev && (prev.text_hash === hash || !opts.resendAfterHours || Date.now() - prev.sent_at.getTime() < opts.resendAfterHours * 3600_000)) { out.dup++; continue; }
    const res = await sendBotMessage(to, text);
    if (res.notConfigured) throw new Error(res.error);
    if (!res.ok) { out.failed.push(`${to}: ${res.error}`); continue; }
    out.via = res.via;
    out.sent.push(to);
    await pool.query(
      `insert into ai_notifications (rule_id, entity_key, recipient, text_hash) values ($1,$2,$3,$4)
       on conflict (rule_id, entity_key, recipient) do update set text_hash = excluded.text_hash, sent_at = now()`,
      [rule.id, entityKey, to, hash]
    );
  }
  return out;
}

const fmtWhen = (d: Date | null) => (d ? d.toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");

/** Правила по разбору звонка (после call.analyze). */
export async function runCallNotify(callId: string): Promise<unknown> {
  const rules = (await loadNotifyRules()).filter((r) => r.enabled && r.source === "call");
  if (!rules.length) return { skipped: "нет включённых правил по звонкам" };

  const { rows } = await getTimewebPool().query<{
    bitrix_user_id: string | null; bitrix_deal_id: string | null; bitrix_lead_id: string | null; started_at: Date | null;
    data: Any | null; deal_title: string | null; company_title: string | null; client_title: string | null;
  }>(
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
  if (!r || !r.data) return { skipped: "звонок или разбор не найден" };

  const isDeal = Boolean(r.bitrix_deal_id);
  const id = (isDeal ? r.bitrix_deal_id : r.bitrix_lead_id) ?? "";
  const name = [r.deal_title, r.company_title ?? r.client_title].filter(Boolean).join(" — ") || `${isDeal ? "Сделка" : "Лид"} #${id}`;
  const link = id ? crmLink(isDeal ? "deal" : "lead", id) : "";
  const when = fmtWhen(r.started_at);
  const ageH = r.started_at ? (Date.now() - r.started_at.getTime()) / 3600_000 : 0;
  const mpScore = typeof r.data.managerPerformance?.overall === "number" ? (r.data.managerPerformance.overall as number) : null;
  const dealScore = typeof r.data.dealScore?.score === "number" ? (r.data.dealScore.score as number) : null;
  const temp = r.data.dealScore?.temperature as string | undefined;

  const result: Record<string, unknown> = {};
  for (const rule of rules) {
    const c = rule.conditions;
    const skip = (why: string) => { result[rule.name] = { skipped: why }; };
    if (rule.onlyManagers?.length && !(r.bitrix_user_id && rule.onlyManagers.includes(r.bitrix_user_id))) { skip("менеджер не входит в правило"); continue; }
    if (ageH > (c.maxAgeHours || 48)) { skip(`звонок старше ${c.maxAgeHours} ч`); continue; }
    if (c.skipTechnical && r.data.managerScoreApplicable === false) { skip("технический звонок"); continue; }
    if (c.onlyConnected && r.data.connected === false) { skip("разговор не состоялся"); continue; }
    if (c.temperatures?.length && !(temp && c.temperatures.includes(temp as "HOT"))) { skip("температура не подходит"); continue; }
    if (c.managerScoreBelow != null && !(mpScore != null && mpScore <= c.managerScoreBelow)) { skip("оценка менеджера выше порога"); continue; }
    if (c.dealScoreAtLeast != null && !(dealScore != null && dealScore >= c.dealScoreAtLeast)) { skip("оценка сделки ниже порога"); continue; }

    const body = buildBody("call", rule, r.data, mpScore);
    if (!body) { skip("в разборе нет выбранных блоков"); continue; }
    const to = await recipientsFor(rule, r.bitrix_user_id);
    if (!to.length) { skip("нет получателей"); continue; }
    const text = `[B]Разбор звонка${when ? ` от ${when}` : ""}[/B]\n${isDeal ? "Сделка" : "Лид"}: ${bbLink(link, name)}\n\n${body}`;
    result[rule.name] = await deliver(rule, `call:${callId}`, to, text);
  }
  return result;
}

/** Правила по итоговому анализу сделки (после deal.analyze). */
export async function runDealNotify(dealId: string): Promise<unknown> {
  const rules = (await loadNotifyRules()).filter((r) => r.enabled && r.source === "deal");
  if (!rules.length) return { skipped: "нет включённых правил по сделкам" };

  const { rows } = await getTimewebPool().query<{
    data: Any; manager_score: string | null; updated_at: Date | null; title: string | null; company_title: string | null; bitrix_user_id: string | null; last_call_at: Date | null;
  }>(
    `select di.data, di.manager_score, di.updated_at, di.last_call_at, d.title, co.title as company_title, d.bitrix_user_id
       from ai_deal_insights di
       join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
      where di.bitrix_deal_id = $1`,
    [dealId]
  ).catch(() => ({ rows: [] as never[] }));
  const r = rows[0];
  if (!r) return { skipped: "анализ сделки не найден" };

  const ageH = r.last_call_at ? (Date.now() - new Date(r.last_call_at).getTime()) / 3600_000 : 0;
  const ms = r.manager_score != null ? Number(r.manager_score) : null;
  const dScore = typeof r.data.dealScore?.score === "number" ? (r.data.dealScore.score as number) : null;
  const temp = r.data.dealScore?.temperature as string | undefined;
  const name = [r.title, r.company_title].filter(Boolean).join(" — ") || `Сделка #${dealId}`;

  const result: Record<string, unknown> = {};
  for (const rule of rules) {
    const c = rule.conditions;
    const skip = (why: string) => { result[rule.name] = { skipped: why }; };
    if (rule.onlyManagers?.length && !(r.bitrix_user_id && rule.onlyManagers.includes(r.bitrix_user_id))) { skip("менеджер не входит в правило"); continue; }
    if (ageH > (c.maxAgeHours || 48)) { skip(`последний звонок старше ${c.maxAgeHours} ч`); continue; }
    if (c.temperatures?.length && !(temp && c.temperatures.includes(temp as "HOT"))) { skip("температура не подходит"); continue; }
    if (c.managerScoreBelow != null && !(ms != null && ms <= c.managerScoreBelow)) { skip("оценка менеджера выше порога"); continue; }
    if (c.dealScoreAtLeast != null && !(dScore != null && dScore >= c.dealScoreAtLeast)) { skip("оценка сделки ниже порога"); continue; }

    const body = buildBody("deal", rule, r.data, ms);
    if (!body) { skip("в анализе нет выбранных блоков"); continue; }
    const to = await recipientsFor(rule, r.bitrix_user_id);
    if (!to.length) { skip("нет получателей"); continue; }
    const text = `[B]Анализ сделки[/B]\nСделка: ${bbLink(crmLink("deal", dealId), name)}\n\n${body}`;
    // Анализ сделки пересчитывается после каждого звонка: повторно шлём не чаще раза в сутки и только если текст изменился.
    result[rule.name] = await deliver(rule, `deal:${dealId}`, to, text, { resendAfterHours: 24 });
  }
  return result;
}

/** Предпросмотр текста правила на последних данных (без отправки). */
export async function previewRule(rule: NotifyRule): Promise<{ text: string } | { error: string }> {
  const pool = getTimewebPool();
  if (rule.source === "call") {
    const { rows } = await pool.query<{ data: Any; deal_title: string | null }>(
      `select a.data, d.title as deal_title from ai_call_analysis a join ai_calls c on c.id = a.call_id
         left join ai_deals d on d.bitrix_deal_id = c.bitrix_deal_id
        order by a.created_at desc limit 1`
    );
    if (!rows[0]) return { error: "Нет ни одного разбора звонка для примера" };
    const body = buildBody("call", rule, rows[0].data, rows[0].data.managerPerformance?.overall ?? null);
    return { text: `Разбор звонка\nСделка: ${rows[0].deal_title ?? "пример"}\n\n${body || "(в последнем разборе нет выбранных блоков)"}`.replace(/\[\/?B\]/g, "") };
  }
  const { rows } = await pool.query<{ data: Any; manager_score: string | null; title: string | null }>(
    `select di.data, di.manager_score, d.title from ai_deal_insights di join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id order by di.updated_at desc limit 1`
  ).catch(() => ({ rows: [] as never[] }));
  if (!rows[0]) return { error: "Нет ни одного анализа сделки для примера" };
  const body = buildBody("deal", rule, rows[0].data, rows[0].manager_score != null ? Number(rows[0].manager_score) : null);
  return { text: `Анализ сделки\nСделка: ${rows[0].title ?? "пример"}\n\n${body || "(в последнем анализе нет выбранных блоков)"}`.replace(/\[\/?B\]/g, "") };
}
