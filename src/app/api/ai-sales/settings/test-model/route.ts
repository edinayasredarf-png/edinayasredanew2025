import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { gatewayChat } from "@/lib/ai/gatewayChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Быстрая проверка модели шлюза: время ответа на короткую задачу вроде разметки ролей.
 * Помогает выбрать модель, которая не упирается в тайм-аут (для call.roles — 45 с на задачу).
 * POST { models: string[] } — модели проверяются параллельно.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const body = (await request.json().catch(() => ({}))) as { models?: string[] };
  const models = (body.models ?? []).map((m) => String(m).trim()).filter(Boolean).slice(0, 6);
  if (!models.length) return NextResponse.json({ error: "Передайте models: string[]" }, { status: 400 });

  const results = await Promise.all(models.map(async (model) => {
    const t0 = Date.now();
    try {
      const r = await gatewayChat({
        model, maxTokens: 200, timeoutMs: 40_000, temperature: 0,
        system: 'Определи, кто из говорящих менеджер. Верни СТРОГО JSON {"manager":"<метка>"}.',
        user: "Говорящий A: Здравствуйте, меня зовут Ольга, компания Единая среда, предлагаем инвентаризацию кладбищ.\n\nГоворящий B: Слушаю вас, администрация поселения.",
      });
      return { model, ok: true, ms: Date.now() - t0, answer: r.text.slice(0, 120) };
    } catch (e) {
      return { model, ok: false, ms: Date.now() - t0, error: e instanceof Error ? e.message.slice(0, 160) : String(e) };
    }
  }));
  return NextResponse.json({ results });
}
