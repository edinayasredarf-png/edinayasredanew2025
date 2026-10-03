import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbClearTaskRouteOverride, dbListTaskRouteOverrides, dbSetTaskRouteOverride } from "@/lib/server/contentOsDb";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import { TASK_ROUTES } from "@/lib/ai/router";
import type { ContentOsTask } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status: fallback });
}

/** Дефолты из кода + переопределения компании — одним списком для UI. */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }
  const companyId = getActiveCompanyId(request);
  const overrides = await dbListTaskRouteOverrides(companyId);
  const overrideByTask = new Map(overrides.map((o) => [o.task, o]));

  const routes = Object.entries(TASK_ROUTES).map(([task, def]) => {
    const o = overrideByTask.get(task);
    return {
      task,
      provider: o?.provider ?? def.provider,
      model: o?.model ?? def.model ?? null,
      isOverride: Boolean(o),
      defaultProvider: def.provider,
      defaultModel: def.model ?? null,
    };
  });
  return NextResponse.json({ routes });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }
  const body = await request.json().catch(() => ({}));
  const task = body?.task as ContentOsTask | undefined;
  const provider = body?.provider as "local" | "anthropic" | undefined;
  if (!task || !(task in TASK_ROUTES) || !provider) {
    return NextResponse.json({ error: "task и provider обязательны" }, { status: 400 });
  }
  const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : null;
  await dbSetTaskRouteOverride(task, provider, model, getActiveCompanyId(request));
  return NextResponse.json({ ok: true });
}

/** Сброс переопределения на дефолт из кода. */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }
  const task = request.nextUrl.searchParams.get("task");
  if (!task) return NextResponse.json({ error: "task required" }, { status: 400 });
  await dbClearTaskRouteOverride(task, getActiveCompanyId(request));
  return NextResponse.json({ ok: true });
}
