import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { agentSearchChat, agentSearchConfigured } from "@/lib/ai/gatewayChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface VariantResult {
  variant: string;
  ok: boolean;
  ms: number;
  citations: number;
  urls: number;
  recentDates: number;
  preview: string;
  error?: string;
}

const DEFAULT_QUERY =
  "Найди в интернете свежие новости (последние 3 месяца) о закупках на благоустройство, озеленение или инвентаризацию кладбищ в Республике Хакасия. Для каждого факта укажи дату и URL источника.";

/** Сколько дат из текущего или прошлого года встречено в тексте — признак свежих данных из сети. */
function countRecentDates(text: string): number {
  const y = new Date().getFullYear();
  const re = new RegExp(`(?:\\b${y}\\b|\\b${y - 1}\\b)`, "g");
  return (text.match(re) ?? []).length;
}

async function run(query: string): Promise<VariantResult> {
  const t0 = Date.now();
  try {
    const r = await agentSearchChat({
      timeoutMs: 28_000,
      system: "Ты исследователь. Используй поиск в интернете. Не выдумывай: если не нашёл — так и скажи.",
      user: query,
    });
    return {
      variant: "агент Timeweb с веб-поиском", ok: true, ms: Date.now() - t0, citations: r.citations.length,
      urls: (r.text.match(/https?:\/\/\S+/g) ?? []).length,
      recentDates: countRecentDates(r.text), preview: r.text.slice(0, 600),
    };
  } catch (e) {
    return { variant: "агент Timeweb с веб-поиском", ok: false, ms: Date.now() - t0, citations: 0, urls: 0, recentDates: 0, preview: "", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Проверка: умеет ли выбранная модель шлюза искать в интернете (ссылки, свежие даты). */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  if (!agentSearchConfigured()) {
    return NextResponse.json({ error: "Агент поиска не настроен. Создайте AI-агента Timeweb с включённым веб-поиском и задайте на Vercel BRIEF_SEARCH_AGENT_URL и BRIEF_SEARCH_AGENT_KEY." }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { query?: string };
  const query = String(body.query ?? "").trim() || DEFAULT_QUERY;
  const v = await run(query);
  const searches = v.ok && (v.citations > 0 || (v.urls > 0 && v.recentDates > 0));
  const verdict = searches
    ? { searches: true, message: "Агент ищет в интернете — подходит для брифов." }
    : v.ok
      ? { searches: false, message: "Ответ получен, но ссылок и свежих дат нет. Проверьте, что у агента включена опция «Поиск в интернете»." }
      : { searches: false, message: "Агент не ответил — проверьте URL, ключ и что агент запущен." };
  return NextResponse.json({ verdict, variants: [v] });
}
