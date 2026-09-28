import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess, requireRopAccess } from "@/lib/server/authFromBearer";
import { listScripts, createScript } from "@/lib/server/aiSales/scriptsDb";
import { listDepartmentOptions } from "@/lib/server/aiSales/departmentsDb";
import { ALL_STAGES, PIPELINE_LABEL } from "@/lib/ai/dealStages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Этапы, показательные для полноценного разговора (см. StageInfo.callable) —
// только для них имеет смысл заводить отдельный чек-лист скрипта.
const STAGE_OPTIONS = ALL_STAGES.filter((s) => s.callable).map((s) => ({
  key: s.key,
  label: `${PIPELINE_LABEL[s.pipeline]} — ${s.label}`,
}));

/** Активные скрипты (общий + по отделам/этапам), отделы и этапы для выбора. */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const [scripts, departments] = await Promise.all([listScripts(), listDepartmentOptions()]);
    return NextResponse.json({ scripts, departments, stages: STAGE_OPTIONS });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка скриптов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Создать скрипт (общий при departmentId=null, вне зависимости от этапа при stageKey=''). РОП/админ. */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { departmentId?: string | null; name?: string; stageKey?: string };
    const id = await createScript(body.departmentId ?? null, body.name || "Скрипт продаж", body.stageKey || "");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания скрипта";
    // Уникальный индекс (department_id, stage_key) — уже есть активный скрипт для этой комбинации.
    if (message.includes("duplicate key") || message.includes("uq_ai_scripts_active")) {
      return NextResponse.json({ error: "Для этого отдела/этапа уже есть активный скрипт" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
