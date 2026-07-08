import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetTemplate } from "@/lib/server/letterTemplatesDb";
import { renderLetterPdf } from "@/lib/server/letterPdf";
import { buildTags, mergeTags, safeFilename, RecipientRow } from "@/lib/server/letterMerge";
import { computeRecipient } from "@/lib/server/nameTransforms";
import { dbGetEditorMedia } from "@/lib/server/dataDb";

/** /api/media/<id> → data-URI (движок PDF не умеет относительные URL). */
async function resolveImage(url?: string): Promise<string | undefined> {
  const u = (url || "").trim();
  if (!u) return undefined;
  const m = /^\/api\/media\/([\w-]+)$/.exec(u);
  if (!m) return u; // абсолютный URL — как есть
  try {
    const media = await dbGetEditorMedia(m[1]);
    if (!media) return undefined;
    return `data:${media.mimeType};base64,${media.data.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cd(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let payload: { templateKey?: string; recipients?: RecipientRow[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const recipients = (payload.recipients || []).filter((r) => r?.fio?.trim());
  if (!payload.templateKey || recipients.length === 0) {
    return NextResponse.json({ error: "Укажите шаблон и получателей" }, { status: 400 });
  }

  const template = await dbGetTemplate(payload.templateKey);
  if (!template) {
    return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
  }

  try {
    // картинки одинаковы для всех получателей — резолвим один раз
    const [headerImage, signatureImage] = await Promise.all([
      resolveImage(template.header_image),
      resolveImage(template.signature_image),
    ]);

    const files = await Promise.all(
      recipients.map(async (r) => {
        const tags = buildTags(r);
        const c = computeRecipient(r.fio, r.position);
        const buffer = await renderLetterPdf({
          headerImage,
          number: r.number || "",
          date: r.date || "",
          position: r.position || "",
          fioDative: c.fioDative,
          greeting: `${c.address} ${c.io}!`,
          body: mergeTags(template.body, tags),
          signerRole: template.signer_role || "",
          signatureImage,
          signerName: template.signer_name || "",
          executor: mergeTags(template.executor, tags),
        });
        const filename = `${safeFilename(mergeTags(template.filename_pattern, tags))}.pdf`;
        return { filename, buffer };
      })
    );

    // один получатель → PDF, несколько → ZIP
    if (files.length === 1) {
      return new NextResponse(new Uint8Array(files[0].buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": cd(files[0].filename),
        },
      });
    }

    const zip = new JSZip();
    const used = new Map<string, number>();
    for (const f of files) {
      let name = f.filename;
      const n = used.get(name) || 0;
      if (n > 0) name = name.replace(/\.pdf$/, ` (${n}).pdf`);
      used.set(f.filename, n + 1);
      zip.file(name, f.buffer);
    }
    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
    const zipName = `Письма_${template.name}_${new Date().toISOString().slice(0, 10)}.zip`;
    return new NextResponse(new Uint8Array(zipBuf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": cd(zipName),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
