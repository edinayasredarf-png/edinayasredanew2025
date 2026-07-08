import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetTemplate } from "@/lib/server/letterTemplatesDb";
import { renderLetterPdf } from "@/lib/server/letterPdf";
import { buildTags, mergeTags, safeFilename, RecipientRow } from "@/lib/server/letterMerge";
import { computeRecipient } from "@/lib/server/nameTransforms";

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
    const files = await Promise.all(
      recipients.map(async (r) => {
        const tags = buildTags(r);
        const c = computeRecipient(r.fio, r.position);
        const buffer = await renderLetterPdf({
          headerImage: template.header_image || undefined,
          number: r.number || "",
          date: r.date || "",
          position: r.position || "",
          fioDative: c.fioDative,
          greeting: `${c.address} ${c.io}!`,
          body: mergeTags(template.body, tags),
          signerRole: template.signer_role || "",
          signatureImage: template.signature_image || undefined,
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
