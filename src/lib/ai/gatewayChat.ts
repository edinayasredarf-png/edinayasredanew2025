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
