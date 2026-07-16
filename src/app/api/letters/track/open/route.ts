import { NextRequest, NextResponse } from "next/server";
import { dbMarkOpened } from "@/lib/server/letterSendsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Пиксель отметки открытия письма. Публичный: его дёргает почтовый клиент
 * получателя, авторизации тут быть не может.
 *
 * Всегда отдаём картинку и 200 — что бы ни случилось. Иначе в письме на месте
 * пикселя появится «битая картинка».
 */

// Прозрачный GIF 1x1.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function pixelResponse(): NextResponse {
  return new NextResponse(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      // почтовые прокси охотно кешируют — иначе повторные открытия не увидим
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  if (token) {
    // dbMarkOpened сам глушит ошибки, но подстрахуемся: отдать пиксель важнее.
    try {
      await dbMarkOpened(token);
    } catch {
      /* отдаём картинку в любом случае */
    }
  }
  return pixelResponse();
}
