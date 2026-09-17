import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getEditorFromRequest } from "@/lib/server/editorSession";
import { buildKpDocuments, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";
import { convertDocxToPdf, isPdfConfigured } from "@/lib/server/kp/kpPdf";
import { sendLetterEmail, isMailerConfigured, type SmtpAccount } from "@/lib/server/mailer";
import { dbGetMailAccountSecret } from "@/lib/server/mailAccountsDb";
import { dbInsertHistory } from "@/lib/server/kp/kpDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Рассылка сгенерированных КП на почту клиента (вложения — DOCX или PDF). */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let body: KpGenerateRequest & {
    clientEmail?: string;
    subject?: string;
    message?: string;
    accountId?: string;
    asPdf?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const to = (body.clientEmail || "").trim();
  if (!to || !/.+@.+\..+/.test(to)) {
    return NextResponse.json({ error: "Укажите корректный e-mail клиента" }, { status: 400 });
  }
  if (!body.form || !Array.isArray(body.orgKeys) || body.orgKeys.length === 0) {
    return NextResponse.json({ error: "Выберите организации и заполните форму" }, { status: 400 });
  }

  // Ящик отправки: из БД по accountId либо основной (ENV).
  let account: SmtpAccount | undefined;
  const accountId = (body.accountId || "").trim();
  if (accountId && accountId !== "default") {
    const sec = await dbGetMailAccountSecret(accountId);
    if (!sec) return NextResponse.json({ error: "Ящик отправки не найден" }, { status: 404 });
    if (!sec.enabled) return NextResponse.json({ error: "Выбранный ящик отключён" }, { status: 400 });
    if (!sec.smtp_host || !sec.smtp_user || !sec.smtp_pass) {
      return NextResponse.json({ error: "У ящика не заданы SMTP-настройки или пароль" }, { status: 400 });
    }
    account = {
      host: sec.smtp_host,
      port: sec.smtp_port,
      secure: sec.smtp_secure,
      user: sec.smtp_user,
      pass: sec.smtp_pass,
      from: sec.from_name ? `${sec.from_name} <${sec.from_email}>` : sec.from_email,
    };
  } else if (!isMailerConfigured()) {
    return NextResponse.json(
      { error: "Почта не настроена: выберите ящик или задайте SMTP в переменных окружения" },
      { status: 400 }
    );
  }

  const asPdf = Boolean(body.asPdf);
  if (asPdf && !isPdfConfigured()) {
    return NextResponse.json({ error: "PDF-сервис не настроен — отправьте в DOCX или настройте pdf-service" }, { status: 501 });
  }

  const { docs, errors } = await buildKpDocuments(body);
  if (docs.length === 0) {
    return NextResponse.json({ error: errors[0]?.message || "Не удалось сгенерировать КП", errors }, { status: 422 });
  }

  // Вложения: все КП (по одному на организацию).
  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
  try {
    for (const d of docs) {
      if (asPdf) {
        const pdf = await convertDocxToPdf(d.docx);
        attachments.push({ filename: `${d.filename}.pdf`, content: pdf, contentType: "application/pdf" });
      } else {
        attachments.push({ filename: `${d.filename}.docx`, content: d.docx, contentType: DOCX_MIME });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: `Ошибка конвертации в PDF: ${(e as Error).message}` }, { status: 502 });
  }

  const subject = (body.subject || "").trim() || "Коммерческое предложение";
  const messageText = (body.message || "").trim() || "Здравствуйте!\n\nНаправляем коммерческое предложение во вложении.";
  const html = messageText.split(/\n/).map((l) => escapeHtml(l)).join("<br>");

  let result;
  try {
    result = await sendLetterEmail({ to, subject, html, text: messageText, attachments, account });
  } catch (e) {
    return NextResponse.json({ error: `Ошибка отправки: ${(e as Error).message}` }, { status: 502 });
  }

  // Журнал истории (по записи на организацию).
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
        format: asPdf ? "pdf" : "docx",
        totalCost: d.totalCost,
        createdBy,
        payload: { ...body, orgKeys: [d.orgKey], sentTo: to },
      }).catch(() => 0)
    )
  );

  return NextResponse.json({
    ok: result.accepted,
    to,
    count: docs.length,
    messageId: result.messageId,
    rejected: result.rejected,
    errors,
  });
}
