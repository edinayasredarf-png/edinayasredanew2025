import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { bitrixCall, bitrixConfigured } from "@/lib/server/bitrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Автоподстановка из Bitrix24 для формы КП: компании (crm.company.list) и
 * контакты (crm.contact.list). Возвращает короткий список по подстроке имени.
 * Если Bitrix не настроен — пустой список (поле работает как обычный ввод).
 */

/** Bitrix часто оборачивает всё название компании в «прямые» кавычки —
 *  для клиентов (администраций) это мусор, убираем их из подсказок. */
function cleanCompanyTitle(raw: string): string {
  return String(raw || "").replace(/["“”„]/g, "").replace(/\s+/g, " ").trim();
}

interface Item {
  id?: string;
  title: string;
  position?: string;
  email?: string;
}

/** Достаёт первый e-mail из мультиполя Bitrix (EMAIL: [{ VALUE, ... }]). */
function extractEmail(raw: unknown): string | undefined {
  if (Array.isArray(raw)) {
    for (const e of raw) {
      const v = String((e as { VALUE?: unknown })?.VALUE || "").trim();
      if (v) return v;
    }
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "company";
  const q = (url.searchParams.get("q") || "").trim();
  const companyId = (url.searchParams.get("companyId") || "").trim();
  // Со scope компании достаточно 1 символа; иначе — от 2.
  const minChars = type === "contact" && companyId ? 1 : 2;
  if (q.length < minChars || !bitrixConfigured()) return NextResponse.json({ items: [] });

  try {
    if (type === "contact") {
      const first = q.split(/\s+/)[0];
      // Если выбрана компания — только её контакты (кто в её сделках/карточке).
      const filter: Record<string, unknown> = companyId
        ? { COMPANY_ID: companyId, "%LAST_NAME": first }
        : { "%LAST_NAME": first };
      const { result } = await bitrixCall<Array<Record<string, unknown>>>("crm.contact.list", {
        filter,
        select: ["ID", "NAME", "LAST_NAME", "SECOND_NAME", "POST", "EMAIL"],
        order: { LAST_NAME: "ASC" },
        start: 0,
      });
      const items: Item[] = (result || []).slice(0, 15).map((r) => {
        const title = [r.LAST_NAME, r.NAME, r.SECOND_NAME].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
        return { id: String(r.ID || ""), title, position: String(r.POST || "").trim() || undefined, email: extractEmail(r.EMAIL) };
      }).filter((i) => i.title);
      return NextResponse.json({ items });
    }

    const { result } = await bitrixCall<Array<Record<string, unknown>>>("crm.company.list", {
      filter: { "%TITLE": q },
      select: ["ID", "TITLE"],
      order: { TITLE: "ASC" },
      start: 0,
    });
    const items: Item[] = (result || [])
      .slice(0, 15)
      .map((r) => ({ id: String(r.ID || ""), title: cleanCompanyTitle(String(r.TITLE || "")) }))
      .filter((i) => i.title);
    return NextResponse.json({ items });
  } catch {
    // Ошибка/лимит Bitrix — не мешаем вводу вручную.
    return NextResponse.json({ items: [] });
  }
}
