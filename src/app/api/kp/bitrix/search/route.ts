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

interface Item {
  id?: string;
  title: string;
  position?: string;
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
  if (q.length < 2 || !bitrixConfigured()) return NextResponse.json({ items: [] });

  try {
    if (type === "contact") {
      const first = q.split(/\s+/)[0];
      const { result } = await bitrixCall<Array<Record<string, unknown>>>("crm.contact.list", {
        filter: { "%LAST_NAME": first },
        select: ["ID", "NAME", "LAST_NAME", "SECOND_NAME", "POST"],
        order: { LAST_NAME: "ASC" },
        start: 0,
      });
      const items: Item[] = (result || []).slice(0, 15).map((r) => {
        const title = [r.LAST_NAME, r.NAME, r.SECOND_NAME].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
        return { id: String(r.ID || ""), title, position: String(r.POST || "").trim() || undefined };
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
      .map((r) => ({ id: String(r.ID || ""), title: String(r.TITLE || "").trim() }))
      .filter((i) => i.title);
    return NextResponse.json({ items });
  } catch {
    // Ошибка/лимит Bitrix — не мешаем вводу вручную.
    return NextResponse.json({ items: [] });
  }
}
