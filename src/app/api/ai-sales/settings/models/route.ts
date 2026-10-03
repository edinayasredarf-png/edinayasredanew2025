import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ModelsListResponse {
  data?: Array<{ id?: string }>;
}

/**
 * Список моделей self-hosted/OpenAI-совместимого шлюза (напр. Timeweb AI
 * Gateway) — чтобы в настройках AI выбирать модель из реального каталога, а
 * не вслепую переписывать id руками (что уже один раз привело к 404 "model
 * not found": в поле стояло отображаемое имя вместо API id).
 */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }

  const base = (process.env.SELFHOSTED_LLM_URL?.trim() || process.env.SELFHOSTED_LLM_BASE_URL?.trim() || "").replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json({ error: "SELFHOSTED_LLM_URL не задан в env" }, { status: 400 });
  }
  const apiKey = process.env.SELFHOSTED_LLM_API_KEY?.trim();

  try {
    const res = await fetch(`${base}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json({ error: `Шлюз ${res.status}: ${detail.slice(0, 300)}` }, { status: 502 });
    }
    const json = (await res.json()) as ModelsListResponse;
    const models = (json.data || [])
      .map((m) => m.id)
      .filter((id): id is string => !!id)
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ models });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Не удалось получить список моделей";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
