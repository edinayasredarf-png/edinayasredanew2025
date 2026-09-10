import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbGetHeaderLayout,
  dbListAliases,
  dbListExecutors,
  dbListOrganizations,
  dbListServiceTypes,
  dbListTemplates,
  dbListTiers,
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
    const [organizations, tiers, executors, templates, services, headerLayout, aliases] =
      await Promise.all([
        dbListOrganizations(),
        dbListTiers(),
        dbListExecutors(),
        dbListTemplates(),
        dbListServiceTypes(),
        dbGetHeaderLayout(),
        dbListAliases(),
      ]);
    return NextResponse.json({
      organizations,
      tiers,
      executors,
      templates,
      services, // полный список услуг (name/sortOrder/isActive)
      serviceTypes: services.filter((s) => s.isActive).map((s) => s.name),
      headerLayout,
      aliases,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Ошибка загрузки справочников" },
      { status: 500 }
    );
  }
}
