import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bbLink, crmLink, sendBotMessage } from "@/lib/server/bitrix/messenger";
import { getBriefRopIds, getSettingValue } from "@/lib/server/aiSales/settingsDb";
import { DEFAULT_KEYWORD_RULES, type KeywordRule } from "@/lib/keywordRules";

/**
 * Поиск ключевых слов в расшифровке разговора (код, без ИИ — мгновенно и бесплатно): «готовимся выходить на торги»,
 * «тендер», «44-ФЗ» и т.п. Совпадение сохраняется (оно же показывается в «Сигналах») и сразу уходит личным сообщением
 * в Bitrix РОПу и ответственному менеджеру.
 */

let ensured: Promise<void> | null = null;
export function ensureKeywordSchema(): Promise<void> {
  if (!ensured) {
    ensured = getTimewebPool()
      .query(`
        CREATE TABLE IF NOT EXISTS ai_keyword_hits (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          call_id uuid NOT NULL, rule_id text NOT NULL, rule_name text NOT NULL, severity text NOT NULL DEFAULT 'critical',
          phrase text NOT NULL, snippet text NOT NULL, speaker text,
          bitrix_user_id text, bitrix_deal_id text, bitrix_lead_id text, client_title text, action text,
          call_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), notified_at timestamptz,
          UNIQUE (call_id, rule_id)
        );
        CREATE INDEX IF NOT EXISTS idx_ai_keyword_hits_created ON ai_keyword_hits (created_at DESC);
      `)
      .then(() => undefined)
      .catch((e) => { ensured = null; throw e; });
  }
  return ensured;
}

export async function loadKeywordRules(): Promise<KeywordRule[]> {
  const saved = await getSettingValue<KeywordRule[] | undefined>("keywords.rules", undefined);
  return Array.isArray(saved) ? saved : DEFAULT_KEYWORD_RULES;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

/** Первое совпадение цепочки основ: слова по порядку, между соседними не больше MAX_GAP посторонних слов. */
const MAX_GAP = 3;
function findPhrase(tokens: Array<{ t: string; i: number; e: number }>, stems: string[]): { from: number; to: number } | null {
  if (!stems.length) return null;
  for (let s = 0; s < tokens.length; s++) {
    if (!tokens[s].t.startsWith(stems[0])) continue;
    let last = s, ok = true;
    for (let k = 1; k < stems.length && ok; k++) {
      let found = -1;
      for (let j = last + 1; j <= Math.min(tokens.length - 1, last + 1 + MAX_GAP); j++) {
        if (tokens[j].t.startsWith(stems[k])) { found = j; break; }
      }
      if (found < 0) ok = false; else last = found;
    }
    if (ok) return { from: tokens[s].i, to: tokens[last].e };
  }
  return null;
}

/** Совпадения правил в тексте (чистая функция — удобно проверять). */
export function matchRules(text: string, rules: KeywordRule[]): Array<{ rule: KeywordRule; phrase: string; snippet: string }> {
  const lower = norm(text);
  const tokens = [...lower.matchAll(/[a-zа-я0-9]+/g)].map((m) => ({ t: m[0], i: m.index ?? 0, e: (m.index ?? 0) + m[0].length }));
  const out: Array<{ rule: KeywordRule; phrase: string; snippet: string }> = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const phrase of rule.phrases) {
      const stems = norm(phrase).match(/[a-zа-я0-9]+/g) ?? [];
      const hit = findPhrase(tokens, stems);
      if (!hit) continue;
      const a = Math.max(0, hit.from - 110), b = Math.min(text.length, hit.to + 110);
      out.push({ rule, phrase, snippet: `${a > 0 ? "…" : ""}${text.slice(a, b).replace(/\s+/g, " ").trim()}${b < text.length ? "…" : ""}` });
      break; // одного совпадения на правило достаточно
    }
  }
  return out;
}

export async function scanCallKeywords(callId: string): Promise<unknown> {
  const rules = (await loadKeywordRules()).filter((r) => r.enabled && r.phrases.length);
  if (!rules.length) return { skipped: "нет включённых правил" };
  await ensureKeywordSchema();
  const pool = getTimewebPool();

  const { rows: segs } = await pool.query<{ role: string | null; text: string }>(
    `select s.role, s.text from ai_transcript_segments s join ai_transcripts t on t.id = s.transcript_id where t.call_id = $1 order by s.idx`,
    [callId]
  );
  if (!segs.length) return { skipped: "нет расшифровки" };
  const hasRoles = segs.some((s) => s.role === "CLIENT");
  const all = segs.map((s) => s.text).join("\n");
  const client = segs.filter((s) => s.role === "CLIENT").map((s) => s.text).join("\n");

  const { rows: cr } = await pool.query<{
    bitrix_user_id: string | null; bitrix_deal_id: string | null; bitrix_lead_id: string | null; client_title: string | null; started_at: Date | null;
    deal_title: string | null; company_title: string | null;
  }>(
    `select c.bitrix_user_id, c.bitrix_deal_id, c.bitrix_lead_id, c.client_title, c.started_at, d.title as deal_title, co.title as company_title
       from ai_calls c left join ai_deals d on d.bitrix_deal_id = c.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = coalesce(c.bitrix_company_id, d.bitrix_company_id)
      where c.id = $1`,
    [callId]
  );
  const call = cr[0];
  if (!call) return { skipped: "звонок не найден" };
  const ageH = call.started_at ? (Date.now() - call.started_at.getTime()) / 3600_000 : 0;

  const found: Array<{ rule: KeywordRule; phrase: string; snippet: string; speaker: string }> = [];
  for (const m of matchRules(all, rules.filter((r) => r.speaker === "any"))) found.push({ ...m, speaker: "any" });
  const clientRules = rules.filter((r) => r.speaker === "client");
  // Если роли не размечены — реплики клиента не отделить, проверяем весь текст.
  for (const m of matchRules(hasRoles ? client : all, clientRules)) found.push({ ...m, speaker: hasRoles ? "client" : "any" });

  const isDeal = Boolean(call.bitrix_deal_id);
  const entityId = (isDeal ? call.bitrix_deal_id : call.bitrix_lead_id) ?? "";
  const name = [call.deal_title, call.company_title ?? call.client_title].filter(Boolean).join(" — ") || (entityId ? `${isDeal ? "Сделка" : "Лид"} #${entityId}` : "Клиент");
  const link = entityId ? crmLink(isDeal ? "deal" : "lead", entityId) : "";
  const ropIds = await getBriefRopIds();

  const result: unknown[] = [];
  for (const f of found) {
    const ins = await pool.query<{ id: string }>(
      `insert into ai_keyword_hits (call_id, rule_id, rule_name, severity, phrase, snippet, speaker, bitrix_user_id, bitrix_deal_id, bitrix_lead_id, client_title, action, call_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (call_id, rule_id) do nothing returning id`,
      [callId, f.rule.id, f.rule.name, f.rule.severity, f.phrase, f.snippet, f.speaker, call.bitrix_user_id, call.bitrix_deal_id, call.bitrix_lead_id,
        name, f.rule.action || null, call.started_at]
    );
    const hitId = ins.rows[0]?.id;
    if (!hitId) continue; // уже было
    if (ageH > (f.rule.maxAgeHours || 72)) { result.push({ rule: f.rule.name, hit: true, notified: "звонок старый — без рассылки" }); continue; }

    // Не засыпаем: по той же сделке/лиду и тому же правилу уже уведомляли за последние 3 суток.
    if (entityId) {
      const dup = await pool.query(
        `select 1 from ai_keyword_hits where rule_id = $1 and id <> $2 and notified_at > now() - interval '3 days'
            and coalesce(bitrix_deal_id, bitrix_lead_id) = $3 limit 1`,
        [f.rule.id, hitId, entityId]
      );
      if (dup.rowCount) { result.push({ rule: f.rule.name, hit: true, notified: "уже уведомляли недавно" }); continue; }
    }

    const to = new Set<string>();
    if (f.rule.notifyOwner && call.bitrix_user_id) to.add(call.bitrix_user_id);
    if (f.rule.notifyRop) ropIds.forEach((id) => to.add(id));
    const text =
      `[B]⚠ ${f.rule.name}[/B]\n${isDeal ? "Сделка" : "Лид"}: ${link ? bbLink(link, name) : name}\n\n` +
      `В разговоре прозвучало: «${f.snippet}»` + (f.rule.action ? `\n\n[B]Что сделать:[/B] ${f.rule.action}` : "");
    const sent: string[] = [], failed: string[] = [];
    for (const u of to) {
      const res = await sendBotMessage(u, text);
      if (res.ok) sent.push(u); else failed.push(`${u}: ${res.error}`);
    }
    if (sent.length) await pool.query(`update ai_keyword_hits set notified_at = now() where id = $1`, [hitId]);
    result.push({ rule: f.rule.name, hit: true, sent, failed });
  }
  return result.length ? result : { hits: 0 };
}

export interface KeywordSignalRow {
  id: string; rule_name: string; severity: "critical" | "risk" | "opportunity"; phrase: string; snippet: string; action: string | null;
  client_title: string | null; bitrix_deal_id: string | null; bitrix_lead_id: string | null; manager: string | null; call_at: Date | null;
}

/** Совпадения последних 14 дней для ленты «Сигналы». */
export async function listKeywordHits(managerBitrixId: string | null, days = 14): Promise<KeywordSignalRow[]> {
  await ensureKeywordSchema();
  const params: unknown[] = [String(days)];
  let mgr = "";
  if (managerBitrixId) { params.push(managerBitrixId); mgr = ` and h.bitrix_user_id = $2`; }
  const { rows } = await getTimewebPool().query<KeywordSignalRow>(
    `select h.id, h.rule_name, h.severity, h.phrase, h.snippet, h.action, h.client_title, h.bitrix_deal_id, h.bitrix_lead_id, m.full_name as manager, h.call_at
       from ai_keyword_hits h left join ai_managers m on m.bitrix_user_id = h.bitrix_user_id
      where coalesce(h.call_at, h.created_at) >= now() - ($1 || ' days')::interval${mgr}
      order by coalesce(h.call_at, h.created_at) desc limit 30`,
    params
  );
  return rows;
}
