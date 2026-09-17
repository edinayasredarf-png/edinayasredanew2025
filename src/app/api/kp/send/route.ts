import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getEditorFromRequest } from "@/lib/server/editorSession";
import { buildKpDocuments, type KpGenerateRequest } from "@/lib/server/kp/kpBuild";
import { convertDocxToPdf, isPdfConfigured } from "@/lib/server/kp/kpPdf";
import { sendLetterEmail, isMailerConfigured, type SmtpAccount } from "@/lib/server/mailer";
import { dbGetMailAccountSecret } from "@/lib/server/mailAccountsDb";
import { dbGetOrganization, dbInsertHistory } from "@/lib/server/kp/kpDb";
import { dbLogLetterSend } from "@/lib/server/letterSendsDb";
import { randomUUID } from "node:crypto";

/** Резолвит ящик отправки по id (или основной ENV). */
async function resolveAccount(accountId: string): Promise<{ account?: SmtpAccount; error?: string }> {
  const id = (accountId || "").trim();
  if (!id || id === "default") {
    if (!isMailerConfigured()) return { error: "основной SMTP не настроен" };
    return {};
  }
  const sec = await dbGetMailAccountSecret(id);
  if (!sec) return { error: "ящик не найден" };
  if (!sec.enabled) return { error: "ящик отключён" };
  if (!sec.smtp_host || !sec.smtp_user || !sec.smtp_pass) return { error: "у ящика нет SMTP-настроек" };
  return {
    account: {
      host: sec.smtp_host,
      port: sec.smtp_port,
      secure: sec.smtp_secure,
      user: sec.smtp_user,
      pass: sec.smtp_pass,
      from: sec.from_name ? `${sec.from_name} <${sec.from_email}>` : sec.from_email,
    },
  };
}

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
    perOrg?: boolean; // отправлять от каждой организации из её ящика (отдельными письмами)
    extraAttachments?: Array<{ filename?: string; content?: string; contentType?: string }>; // доп. файлы (base64)
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

  const perOrg = Boolean(body.perOrg);
  const accountId = (body.accountId || "").trim();

  // Общий ящик (для режима «одним письмом» или как фолбэк per-org).
  const baseAcc = await resolveAccount(accountId);
  if (!perOrg && baseAcc.error) {
    return NextResponse.json({ error: `Ящик отправки: ${baseAcc.error}` }, { status: 400 });
  }
  const account = baseAcc.account;

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

  // Доп. вложения (прайс, презентация и т.п.) — приходят как base64.
  const MAX_EXTRA = 15 * 1024 * 1024; // ~15 МБ на файл
  for (const a of body.extraAttachments || []) {
    const raw = (a.content || "").includes(",") ? (a.content || "").split(",").pop()! : (a.content || "");
    if (!raw || !a.filename) continue;
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 0 || buf.length > MAX_EXTRA) continue;
    attachments.push({ filename: a.filename, content: buf, contentType: a.contentType || undefined });
  }

  const subject = (body.subject || "").trim() || "Коммерческое предложение";
  const messageText = (body.message || "").trim() || "Здравствуйте!\n\nНаправляем коммерческое предложение во вложении.";
  const html = messageText.split(/\n/).map((l) => escapeHtml(l)).join("<br>");

  const editor = getEditorFromRequest(request);
  const createdBy = editor?.email || "admin";
  const clientTitle = body.form.client.orgShort || body.form.client.orgFull;
  const clientFio = (body.form.client as { fioFull?: string }).fioFull || "";
  const emailOf = (acc?: SmtpAccount): string => {
    const from = acc?.from || process.env.SMTP_FROM || process.env.SMTP_USER || "";
    const m = from.match(/<([^>]+)>/);
    return (m ? m[1] : from).trim();
  };
  const logHistory = (d: (typeof docs)[number]) =>
    dbInsertHistory({
      title: clientTitle,
      clientOrg: body.form.client.orgFull,
      serviceType: body.form.serviceType,
      orgKey: d.orgKey,
      orgName: d.orgName,
      format: asPdf ? "pdf" : "docx",
      totalCost: d.totalCost,
      createdBy,
      payload: { ...body, orgKeys: [d.orgKey], sentTo: to },
    }).catch(() => 0);
  const logSend = (opts: { ok: boolean; error?: string; token: string; messageId?: string; acc?: SmtpAccount; orgName?: string }) =>
    dbLogLetterSend({
      template_key: "kp",
      template_name: `КП ${clientTitle}${opts.orgName ? ` · ${opts.orgName}` : ""}`,
      fio: clientFio,
      email: to,
      subject,
      status: opts.ok ? "ok" : "error",
      error: opts.error || "",
      track_token: opts.token,
      message_id: opts.messageId,
      delivery_status: opts.ok ? "accepted" : "error",
      from_email: emailOf(opts.acc),
    }).catch(() => {});

  // Режим «от каждой организации отдельно»: письмо на клиента из ящика каждой организации.
  if (perOrg) {
    const sent: Array<{ org: string; ok: boolean; error?: string }> = [];
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      const org = await dbGetOrganization(d.orgKey);
      const acc = await resolveAccount((org?.mailAccountKey || accountId || "").trim());
      if (acc.error) { sent.push({ org: d.shortName, ok: false, error: `ящик: ${acc.error}` }); continue; }
      const token = `kp_${randomUUID()}`;
      try {
        const r = await sendLetterEmail({ to, subject, html, text: messageText, attachments: [attachments[i]], account: acc.account, trackToken: token });
        sent.push({ org: d.shortName, ok: r.accepted, error: r.accepted ? undefined : (r.rejected.join(", ") || "не принято") });
        await logSend({ ok: r.accepted, error: r.accepted ? "" : (r.rejected.join(", ") || "не принято"), token, messageId: r.messageId, acc: acc.account, orgName: d.shortName });
        await logHistory(d);
      } catch (e) {
        sent.push({ org: d.shortName, ok: false, error: (e as Error).message });
        await logSend({ ok: false, error: (e as Error).message, token, acc: acc.account, orgName: d.shortName });
      }
    }
    const okCount = sent.filter((s) => s.ok).length;
    return NextResponse.json({ ok: okCount > 0, to, count: okCount, perOrg: sent, errors });
  }

  // Одним письмом со всеми вложениями.
  const token = `kp_${randomUUID()}`;
  let result;
  try {
    result = await sendLetterEmail({ to, subject, html, text: messageText, attachments, account, trackToken: token });
  } catch (e) {
    await logSend({ ok: false, error: (e as Error).message, token, acc: account });
    return NextResponse.json({ error: `Ошибка отправки: ${(e as Error).message}` }, { status: 502 });
  }
  await logSend({ ok: result.accepted, error: result.accepted ? "" : (result.rejected.join(", ") || "не принято"), token, messageId: result.messageId, acc: account });
  await Promise.all(docs.map(logHistory));

  return NextResponse.json({
    ok: result.accepted,
    to,
    count: docs.length,
    messageId: result.messageId,
    rejected: result.rejected,
    errors,
  });
}
