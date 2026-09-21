import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { bitrixCall, bitrixConfigured } from "@/lib/server/bitrix";
import { KP_DEAL_FILE_FIELD } from "@/lib/server/kp/kpBitrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Диагностика: список файловых полей сделки Bitrix24 с их кодами — чтобы найти
 * правильный код «Файл КП» и прописать его в env KP_BITRIX_DEAL_FILE_FIELD.
 * Открыть в браузере под админом: /api/kp/bitrix/deal-fields
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  if (!bitrixConfigured()) {
    return NextResponse.json({ error: "Bitrix не настроен (BITRIX24_WEBHOOK_URL)" }, { status: 400 });
  }

  try {
    const { result } = await bitrixCall<Record<string, {
      type?: string; isMultiple?: boolean; title?: string; formLabel?: string; listLabel?: string;
    }>>("crm.deal.fields");

    const all = Object.entries(result || {});
    const fileFields = all
      .filter(([, f]) => f?.type === "file")
      .map(([code, f]) => ({
        code,
        title: f.formLabel || f.listLabel || f.title || code,
        isMultiple: Boolean(f.isMultiple),
        isConfigured: code === KP_DEAL_FILE_FIELD,
      }));

    return NextResponse.json({
      configuredField: KP_DEAL_FILE_FIELD,
      configuredFieldExists: fileFields.some((f) => f.code === KP_DEAL_FILE_FIELD),
      fileFields,
      hint:
        "Найдите поле «Файл КП» в fileFields, скопируйте его code и пропишите в переменную окружения KP_BITRIX_DEAL_FILE_FIELD на Vercel. Если configuredFieldExists=false — текущий код неверный (потому файлы и не появляются).",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Ошибка Bitrix" }, { status: 502 });
  }
}
