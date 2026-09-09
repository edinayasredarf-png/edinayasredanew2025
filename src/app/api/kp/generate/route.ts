import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getEditorFromRequest } from "@/lib/server/editorSession";
import { buildKpDocuments, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";
import { dbInsertHistory } from "@/lib/server/kp/kpDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

  let body: KpGenerateRequest;
  try {
    body = (await request.json()) as KpGenerateRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!body?.form || !Array.isArray(body.orgKeys) || body.orgKeys.length === 0) {
    return NextResponse.json(
      { error: "Выберите хотя бы одну организацию и заполните форму" },
      { status: 400 }
    );
  }

  const { docs, errors } = await buildKpDocuments(body);

  if (docs.length === 0) {
    return NextResponse.json(
      { error: errors[0]?.message || "Не удалось сгенерировать ни одного КП", errors },
      { status: 422 }
    );
  }

  // Журнал истории (по одной записи на организацию).
  const editor = getEditorFromRequest(request);
  const createdBy = editor?.email || "admin";
  await Promise.all(
    docs.map((d) =>
      dbInsertHistory({
        title: body.form.client.orgShort || body.form.client.orgFull,
        clientOrg: body.form.client.orgFull,
        serviceType: body.form.serviceType,
        orgKey: d.orgKey,
        orgName: d.orgName,
        format: docs.length > 1 ? "zip(docx)" : "docx",
        totalCost: d.totalCost,
        createdBy,
        payload: { ...body, orgKeys: [d.orgKey] },
      }).catch(() => 0)
    )
  );

  // Один документ → .docx, несколько → .zip.
  if (docs.length === 1) {
    const d = docs[0];
    return new NextResponse(new Uint8Array(d.docx), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": cd(`${d.filename}.docx`),
        "X-Kp-Errors": encodeURIComponent(JSON.stringify(errors)),
      },
    });
  }

  const zip = new JSZip();
  const used = new Map<string, number>();
  for (const d of docs) {
    let name = `${d.filename}.docx`;
    const n = used.get(name) || 0;
    if (n) name = `${d.filename} (${n + 1}).docx`;
    used.set(`${d.filename}.docx`, n + 1);
    zip.file(name, d.docx);
  }
  const zipBuf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const clientName = body.form.client.orgShort || body.form.client.orgFull || "КП";
  return new NextResponse(new Uint8Array(zipBuf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": cd(`КП ${clientName} (${docs.length}).zip`),
      "X-Kp-Errors": encodeURIComponent(JSON.stringify(errors)),
    },
  });
}
