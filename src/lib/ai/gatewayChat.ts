import "server-only";

import { AiProviderNotConfiguredError } from "@/lib/ai/interfaces";

/**
 * Свободный (не структурированный) чат с OpenAI-совместимым шлюзом (Timeweb AI Gateway):
 * тот же SELFHOSTED_LLM_URL / SELFHOSTED_LLM_API_KEY, что у остального AI. Нужен для задач,
 * где ответ — текст (брифы), а не JSON по схеме. Если модель шлюза умеет искать в интернете
 * (поисковые «online»-модели), она сама ищет; ссылки-цитаты, которые шлюз вернул
 * (поле `citations` или `annotations`), собираются и возвращаются отдельно.
 */

interface ChatResponse {
  choices?: Array<{ message?: { content?: string; annotations?: Array<{ type?: string; url_citation?: { url?: string; title?: string } }> } }>;
  citations?: Array<string | { url?: string; title?: string }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export interface GatewayChatResult {
  text: string;
  citations: Array<{ url: string; title: string | null }>;
  model: string;
}

export function gatewayConfigured(): boolean {
  return Boolean((process.env.SELFHOSTED_LLM_URL || process.env.SELFHOSTED_LLM_BASE_URL || "").trim());
}

export async function gatewayChat(opts: {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs: number;
  temperature?: number;
}): Promise<GatewayChatResult> {
  const base = (process.env.SELFHOSTED_LLM_URL?.trim() || process.env.SELFHOSTED_LLM_BASE_URL?.trim() || "").replace(/\/+$/, "");
  if (!base) throw new AiProviderNotConfiguredError("AI Gateway не настроен: задайте SELFHOSTED_LLM_URL (и SELFHOSTED_LLM_API_KEY)");
  const apiKey = process.env.SELFHOSTED_LLM_API_KEY?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(opts.timeoutMs),
      body: JSON.stringify({
        model: opts.model,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 3000,
        stream: false,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
  } catch (e) {
    const timedOut = (e as Error).name === "TimeoutError" || (e as Error).name === "AbortError";
    throw new Error(timedOut ? `Шлюз не ответил за ${Math.round(opts.timeoutMs / 1000)} с (модель ${opts.model})` : `Шлюз недоступен: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Шлюз ${res.status} (модель ${opts.model}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as ChatResponse;
  const msg = json.choices?.[0]?.message;
  const text = (msg?.content ?? "").replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "").trim();

  const seen = new Set<string>();
  const citations: Array<{ url: string; title: string | null }> = [];
  const add = (url: string | undefined, title: string | null) => {
    if (url && /^https?:\/\//.test(url) && !seen.has(url)) { seen.add(url); citations.push({ url, title }); }
  };
  for (const c of json.citations ?? []) {
    if (typeof c === "string") add(c, null);
    else add(c?.url, c?.title ?? null);
  }
  for (const a of msg?.annotations ?? []) if (a.type === "url_citation") add(a.url_citation?.url, a.url_citation?.title ?? null);
  return { text, citations, model: opts.model };
}

/* ───────────── AI-агент Timeweb с веб-поиском ─────────────
 * У AI Gateway встроенного веб-поиска нет (подтверждено поддержкой Timeweb) — поиск выполняет
 * AI-агент с включённой опцией «Поиск в интернете» (0,49 ₽ за поисковый запрос, агент сам решает,
 * когда искать). Настройка (env на Vercel):
 *   BRIEF_SEARCH_AGENT_URL — endpoint агента из «ИИ-сервисы → Агенты → API-доступ»:
 *       https://agent.timeweb.cloud/api/v1/cloud-ai/agents/<id>/v1 — OpenAI-совместимый (рекомендуется;
 *       поле model агент игнорирует), либо …/agents/<id>/call — «родной» формат ({message})
 *   BRIEF_SEARCH_AGENT_KEY — ключ доступа агента (Bearer).
 */
export function agentSearchConfigured(): boolean {
  return Boolean(process.env.BRIEF_SEARCH_AGENT_URL?.trim() && process.env.BRIEF_SEARCH_AGENT_KEY?.trim());
}

export async function agentSearchChat(opts: { system: string; user: string; timeoutMs: number; model?: string }): Promise<GatewayChatResult> {
  const url = process.env.BRIEF_SEARCH_AGENT_URL?.trim() || "";
  const key = process.env.BRIEF_SEARCH_AGENT_KEY?.trim() || "";
  if (!url || !key) {
    throw new AiProviderNotConfiguredError("Не настроен агент поиска: задайте BRIEF_SEARCH_AGENT_URL и BRIEF_SEARCH_AGENT_KEY (AI-агент Timeweb с включённым веб-поиском)");
  }
  const native = /\/call\/?$/.test(url);
  const endpoint = native ? url.replace(/\/+$/, "") : url.replace(/\/+$/, "").replace(/\/chat\/completions$/, "") + "/chat/completions";
  const body = native
    ? { message: `${opts.system}\n\n${opts.user}` }
    : { model: opts.model || "agent", stream: false, temperature: 0.2, messages: [{ role: "system", content: opts.system }, { role: "user", content: opts.user }] };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      // x-proxy-source помечен в документации агента Timeweb как обязательный заголовок.
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "x-proxy-source": "edinayasreda" },
      signal: AbortSignal.timeout(opts.timeoutMs),
      body: JSON.stringify(body),
    });
  } catch (e) {
    const timedOut = (e as Error).name === "TimeoutError" || (e as Error).name === "AbortError";
    throw new Error(timedOut ? `Агент поиска не ответил за ${Math.round(opts.timeoutMs / 1000)} с` : `Агент поиска недоступен: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Агент поиска ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as ChatResponse & { message?: string };
  const text = (native ? json.message : json.choices?.[0]?.message?.content ?? json.message) ?? "";
  const clean = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "").trim();

  const seen = new Set<string>();
  const citations: Array<{ url: string; title: string | null }> = [];
  const add = (u: string | undefined, title: string | null) => {
    if (u && /^https?:\/\//.test(u) && !seen.has(u)) { seen.add(u); citations.push({ url: u, title }); }
  };
  for (const c of json.citations ?? []) {
    if (typeof c === "string") add(c, null);
    else add(c?.url, c?.title ?? null);
  }
  for (const a of json.choices?.[0]?.message?.annotations ?? []) if (a.type === "url_citation") add(a.url_citation?.url, a.url_citation?.title ?? null);
  return { text: clean, citations, model: "timeweb-agent" };
}
