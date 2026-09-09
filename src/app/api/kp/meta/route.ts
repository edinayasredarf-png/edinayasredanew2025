import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbListExecutors,
  dbListOrganizations,
  dbListTemplates,
  dbListTiers,
  KP_SERVICE_TYPES,
} from "@/lib/server/kp/kpDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Справочники для формы «Создать КП»: организации, тиры, исполнители, шаблоны. */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  try {
    const [organizations, tiers, executors, templates] = await Promise.all([
      dbListOrganizations(),
      dbListTiers(),
      dbListExecutors(),
      dbListTemplates(),
    ]);
    return NextResponse.json({
      organizations,
      tiers,
      executors,
      templates,
      serviceTypes: KP_SERVICE_TYPES,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Ошибка загрузки справочников" },
      { status: 500 }
    );
  }
}
