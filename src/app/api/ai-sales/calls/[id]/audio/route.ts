import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getCallById } from "@/lib/server/aiSales/callsDb";
import { resolveDiskDownloadUrl } from "@/lib/server/bitrix/entities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Проксирование записи звонка (приватность §56): доступ по роли, короткоживущий
 * DOWNLOAD_URL Bitrix не раскрывается в браузер. Стримим аудио плееру.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const { id } = await params;
  const call = await getCallById(id);
  if (!call || !call.recording_url) {
    return NextResponse.json({ error: "Запись недоступна" }, { status: 404 });
  }

  const fileId = call.recording_url.match(/[?&]id=(\d+)/)?.[1] ?? null;
  if (!fileId) return NextResponse.json({ error: "Нет fileId" }, { status: 404 });

  try {
    const url = await resolveDiskDownloadUrl(fileId);
    if (!url) return NextResponse.json({ error: "Нет DOWNLOAD_URL" }, { status: 404 });
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Ошибка источника" }, { status: 502 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка проксирования";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
