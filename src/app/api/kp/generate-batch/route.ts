import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getEditorFromRequest } from "@/lib/server/editorSession";
import { buildKpDocuments, safeKpFilename, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";
import { dbInsertHistory } from "@/lib/server/kp/kpDb";
import { convertDocxToPdf, isPdfConfigured } from "@/lib/server/kp/kpPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type KpFormat = "docx" | "pdf" | "both";

interface BatchClient {
  orgFull: string;
  fio?: string;
  position?: string;
  territory?: string;
  areaTotal?: string;
  quantity?: string;
}

function cd(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

/** Пакетная генерация: одна услуга/организации × список клиентов → один ZIP. */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let body: KpGenerateRequest & { format?: KpFormat; clients?: BatchClient[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!body?.form || !Array.isArray(body.orgKeys) || body.orgKeys.length === 0) {
    return NextResponse.json({ error: "Выберите организации и заполните форму" }, { status: 400 });
  }
  const clients = (body.clients || []).filter((c) => (c.orgFull || "").trim());
  if (clients.length === 0) {
    return NextResponse.json({ error: "Добавьте хотя бы одного клиента" }, { status: 400 });
  }

  const format: KpFormat = body.format === "pdf" || body.format === "both" ? body.format : "docx";
  const wantPdf = format === "pdf" || format === "both";
  if (wantPdf && !isPdfConfigured()) {
    return NextResponse.json({ error: "PDF-сервис не настроен. Доступен DOCX." }, { status: 501 });
  }

  const editor = getEditorFromRequest(request);
  const createdBy = editor?.email || "admin";

  const zip = new JSZip();
  const usedFolders = new Set<string>();
  const results: Array<{ client: string; docs: number; errors: string[] }> = [];
  let totalDocs = 0;

  for (const c of clients) {
    const form = {
      ...body.form,
      client: {
        ...body.form.client,
        orgFull: c.orgFull,
        fioFull: (c.fio ?? body.form.client?.fioFull ?? "").trim(),
        position: c.position ?? body.form.client?.position,
        territory: c.territory ?? body.form.client?.territory,
        areaTotal: c.areaTotal ?? body.form.client?.areaTotal,
      },
      object: (c.quantity || "").trim()
        ? { quantityUnits: Number(String(c.quantity).replace(/\s+/g, "").replace(",", ".")) || 0 }
        : body.form.object,
    };

    const req: KpGenerateRequest = { form, orgKeys: body.orgKeys, executorId: body.executorId };
    let built;
    try {
      built = await buildKpDocuments(req);
    } catch (e) {
      results.push({ client: c.orgFull, docs: 0, errors: [(e as Error).message] });
      continue;
    }

    // Папка на клиента (уникальная).
    let folder = safeKpFilename(c.orgFull) || "Клиент";
    let n = 2;
    while (usedFolders.has(folder)) folder = `${safeKpFilename(c.orgFull)} (${n++})`;
    usedFolders.add(folder);

    let pdfs: (Buffer | null)[] = [];
    if (wantPdf) {
      try {
        pdfs = await Promise.all(built.docs.map((d) => convertDocxToPdf(d.docx)));
      } catch (e) {
        results.push({ client: c.orgFull, docs: 0, errors: [`PDF: ${(e as Error).message}`] });
        continue;
      }
    }

    built.docs.forEach((d, i) => {
      if (format !== "pdf") zip.file(`${folder}/${d.filename}.docx`, d.docx);
      if (wantPdf && pdfs[i]) zip.file(`${folder}/${d.filename}.pdf`, pdfs[i] as Buffer);
    });
    totalDocs += built.docs.length;
    results.push({ client: c.orgFull, docs: built.docs.length, errors: built.errors.map((e) => e.message) });

    // История — по записи на организацию.
    await Promise.all(
      built.docs.map((d) =>
        dbInsertHistory({
          title: c.orgFull,
          clientOrg: c.orgFull,
          serviceType: body.form.serviceType,
          orgKey: d.orgKey,
          orgName: d.orgName,
          format,
          totalCost: d.totalCost,
          createdBy,
          payload: { batch: true, orgKeys: [d.orgKey] },
        }).catch(() => 0)
      )
    );
  }

  if (totalDocs === 0) {
    return NextResponse.json({ error: "Не удалось сгенерировать ни одного КП", results }, { status: 422 });
  }

  const zipBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new NextResponse(new Uint8Array(zipBuf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": cd(`КП пакет (${clients.length} клиентов, ${totalDocs} файлов).zip`),
      "X-Kp-Batch": encodeURIComponent(JSON.stringify(results)),
    },
  });
}
