import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { createDocument } from "@/lib/server/aiSales/kbDb";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Извлекает текст из файла (docx/pdf/txt/md/csv). */
async function fileToText(name: string, buf: Buffer): Promise<string> {
  const lower = name.toLowerCase();
  if (lower.endsWith(".docx")) {
    const r = await mammoth.extractRawText({ buffer: buf });
    return r.value || "";
  }
  if (lower.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : String(text || "");
  }
  if (/\.(txt|md|markdown|csv)$/.test(lower)) {
    return buf.toString("utf8");
  }
  throw new Error("Формат не поддержан (нужен .docx, .pdf, .txt, .md)");
}

/** Массовая загрузка документов в базу знаний: файлы → текст → индексация. РОП/админ. */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
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

  const category = ((form.get("category") as string) || "").trim() || null;
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Не выбрано ни одного файла" }, { status: 400 });
  }

  const results: Array<{ name: string; ok: boolean; id?: string; chars?: number; error?: string }> = [];
  for (const file of files) {
    const name = file.name || "документ";
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const text = (await fileToText(name, buf)).trim();
      if (!text) throw new Error("Не удалось извлечь текст (пустой документ или скан-картинка)");
      const title = name.replace(/\.[^.]+$/, "").trim() || name;
      const id = await createDocument({ title, category, content: text });
      results.push({ name, ok: true, id, chars: text.length });
    } catch (e) {
      results.push({ name, ok: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: true, results });
}
