import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbListTemplates,
  dbUpdateTemplate,
  LetterTemplate,
} from "@/lib/server/letterTemplatesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const templates = await dbListTemplates();
    return NextResponse.json({ templates });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка БД";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const b = (await request.json()) as Partial<LetterTemplate>;
    if (!b.key) return NextResponse.json({ error: "key required" }, { status: 400 });
    await dbUpdateTemplate({
      key: b.key,
      name: b.name ?? "",
      body: b.body ?? "",
      header_image: b.header_image ?? "",
      signer_role: b.signer_role ?? "",
      signature_image: b.signature_image ?? "",
      signer_name: b.signer_name ?? "",
      executor: b.executor ?? "",
      filename_pattern: b.filename_pattern ?? "",
      email_subject: b.email_subject ?? "",
      email_body: b.email_body ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка БД";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
