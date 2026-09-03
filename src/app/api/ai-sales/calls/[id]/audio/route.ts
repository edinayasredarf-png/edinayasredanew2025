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

    // Пробрасываем Range клиента в Bitrix → браузер сможет перематывать запись
    // (без Range плеер каждый раз тянет файл с нуля и не умеет seek).
    const range = request.headers.get("range");
    const upstream = await fetch(url, {
      headers: range ? { Range: range } : {},
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Ошибка источника" }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=300");
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    // 206, если источник отдал частичный контент; иначе 200.
    return new NextResponse(upstream.body, { status: upstream.status === 206 ? 206 : 200, headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка проксирования";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
