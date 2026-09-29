import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { TASK_ROUTES } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Только для отображения в Settings (§73-74 ТЗ) — не редактируется через API, роутинг меняется в коде router.ts. */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    return NextResponse.json({
      localConfigured: Boolean((process.env.SELFHOSTED_LLM_URL || process.env.SELFHOSTED_LLM_BASE_URL)?.trim()),
      routes: TASK_ROUTES,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status : 401;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
