import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ModelsListResponse {
  data?: Array<{ id?: string }>;
}

/**
 * Список моделей, реально доступных через настроенный шлюз
 * (SELFHOSTED_LLM_URL — self-hosted сервер или облачный OpenAI-совместимый
 * шлюз вроде Timeweb AI Gateway). Тот же паттерн, что уже работает для AI
 * Sales (src/app/api/ai-sales/settings/models/route.ts) — чтобы в Settings
 * выбирать модель из реального каталога, а не вслепую вписывать id руками.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const base = (process.env.SELFHOSTED_LLM_URL?.trim() || process.env.SELFHOSTED_LLM_BASE_URL?.trim() || "").replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json({ error: "Шлюз не настроен — нет SELFHOSTED_LLM_URL в окружении" }, { status: 400 });
  }
  const apiKey = process.env.SELFHOSTED_LLM_API_KEY?.trim();

  try {
    const res = await fetch(`${base}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json({ error: `Шлюз ответил ошибкой ${res.status}: ${detail.slice(0, 300)}` }, { status: 502 });
    }
    const json = (await res.json()) as ModelsListResponse;
    const models = (json.data || [])
      .map((m) => m.id)
      .filter((id): id is string => !!id)
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ models });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Не удалось получить список моделей со шлюза";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
