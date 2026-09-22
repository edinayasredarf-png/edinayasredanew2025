import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { extractText, getDocumentProxy } from "unpdf";
import { ocrConfigured, ocrPdfPages } from "@/lib/server/ocr";
import { ocrPagesToHtml } from "@/lib/server/ocrFormat";
import { buildDocxFromHtml } from "@/lib/server/kp/kpHtmlDocx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Текст → HTML-абзацы (пустая строка = новый абзац, перевод строки = <br>). */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((l) => esc(l.trim())).filter(Boolean);
      return lines.length ? `<p>${lines.join("<br/>")}</p>` : "";
    })
    .filter(Boolean)
    .join("");
}

/** PDF → Word (.docx) с распознаванием текста (OCR для сканов). */
export async function POST(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Не выбран PDF-файл" }, { status: 400 });
  if (!/\.pdf$/i.test(file.name || "")) return NextResponse.json({ error: "Нужен файл .pdf" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const forceOcr = String(form.get("ocr") || "") === "1";

  let html = "";

  // 1) Текстовый слой (обычный PDF) — плоский текст в абзацы.
  if (!forceOcr) {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text: t } = await extractText(pdf, { mergePages: true });
      const text = (Array.isArray(t) ? t.join("\n") : String(t || "")).trim();
      if (text.length >= 40) html = textToHtml(text);
    } catch {
      /* нет текстового слоя — уйдём в OCR ниже */
    }
  }

  // 2) OCR (скан) — с восстановлением вёрстки (центрирование, красная строка, заголовки).
  if (!html) {
    if (!ocrConfigured()) {
      return NextResponse.json({ error: "У PDF нет текстового слоя, а OCR не настроен (YANDEX_VISION_API_KEY)" }, { status: 422 });
    }
    try {
      const pages = await ocrPdfPages(buf);
      const totalLines = pages.reduce((n, p) => n + p.lines.length, 0);
      if (!totalLines) {
        return NextResponse.json({ error: "Не удалось распознать текст (пустой скан?)" }, { status: 422 });
      }
      html = ocrPagesToHtml(pages);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message || "Ошибка OCR" }, { status: 502 });
    }
  }

  const docx = await buildDocxFromHtml(html);
  const base = (file.name || "документ").replace(/\.[^.]+$/, "") || "документ";
  const filename = `${base}.docx`;
  return new NextResponse(new Uint8Array(docx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
