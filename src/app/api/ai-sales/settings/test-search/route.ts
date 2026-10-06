import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { gatewayChat, searchExtraFor } from "@/lib/ai/gatewayChat";

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

async function run(model: string, query: string, variant: string, extraBody?: Record<string, unknown>): Promise<VariantResult> {
  const t0 = Date.now();
  try {
    const r = await gatewayChat({
      model, extraBody, maxTokens: 900, timeoutMs: 24_000,
      system: "Ты исследователь. Используй поиск в интернете, если он тебе доступен. Не выдумывай: если не нашёл — так и скажи.",
      user: query,
    });
    return {
      variant, ok: true, ms: Date.now() - t0, citations: r.citations.length,
      urls: (r.text.match(/https?:\/\/\S+/g) ?? []).length,
      recentDates: countRecentDates(r.text), preview: r.text.slice(0, 600),
    };
  } catch (e) {
    return { variant, ok: false, ms: Date.now() - t0, citations: 0, urls: 0, recentDates: 0, preview: "", error: e instanceof Error ? e.message : String(e) };
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
  const body = (await request.json().catch(() => ({}))) as { model?: string; query?: string };
  const model = String(body.model ?? "").trim() || process.env.SELFHOSTED_LLM_MODEL?.trim() || "";
  if (!model) return NextResponse.json({ error: "Укажите модель" }, { status: 400 });
  const query = String(body.query ?? "").trim() || DEFAULT_QUERY;

  const extra = searchExtraFor(model);
  // Два варианта параллельно: обычный чат и с параметрами поиска провайдера (если известны).
  const variants = await Promise.all([
    run(model, query, "обычный запрос"),
    ...(extra ? [run(model, query, "с параметрами поиска провайдера", extra)] : []),
  ]);
  const best = variants.find((v) => v.ok && (v.citations > 0 || (v.urls > 0 && v.recentDates > 0)));
  const verdict = best
    ? { searches: true, message: `Модель ищет в интернете (вариант: ${best.variant}) — подходит для поиска.` }
    : variants.some((v) => v.ok)
      ? { searches: false, message: "Ответ получен, но ссылок и свежих дат нет — похоже, модель отвечает из памяти. Попробуйте другую модель." }
      : { searches: false, message: "Модель не ответила — проверьте id модели и доступность шлюза." };
  return NextResponse.json({ model, verdict, variants });
}
