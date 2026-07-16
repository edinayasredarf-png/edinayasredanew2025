import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbGetTemplate,
  plainToHtml,
} from "@/lib/server/letterTemplatesDb";
import { mergeTags, RecipientRow } from "@/lib/server/letterMerge";
import {
  resolveTemplateImages,
  buildLetterPdf,
} from "@/lib/server/letterBuild";
import { sendLetterEmail, isMailerConfigured } from "@/lib/server/mailer";
import { dbLogLetterSend } from "@/lib/server/letterSendsDb";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEND_CONCURRENCY = 3; // порциями — не упереться в SMTP-лимиты и память
const SEND_DELAY_MS = 400; // пауза между письмами внутри воркера

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Грубое HTML → текст для plain-text части письма. */
function htmlToPlain(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

interface SendResult {
  email: string;
  fio: string;
  ok: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  if (!isMailerConfigured()) {
    return NextResponse.json(
      { error: "SMTP не настроен (SMTP_HOST / SMTP_USER / SMTP_PASS)" },
      { status: 503 }
    );
  }

  let payload: {
    templateKey?: string;
    recipients?: RecipientRow[];
    test?: boolean;
    testEmail?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const allRecipients = (payload.recipients || []).filter((r) => r?.fio?.trim());
  if (!payload.templateKey || allRecipients.length === 0) {
    return NextResponse.json({ error: "Укажите шаблон и получателей" }, { status: 400 });
  }

  const template = await dbGetTemplate(payload.templateKey);
  if (!template) {
    return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
  }

  // Тест на себя: одно письмо (первый получатель) на указанный адрес
  let recipients: RecipientRow[];
  if (payload.test) {
    const testEmail = (payload.testEmail || "").trim();
    if (!EMAIL_RE.test(testEmail)) {
      return NextResponse.json({ error: "Укажите корректный тестовый email" }, { status: 400 });
    }
    recipients = [{ ...allRecipients[0], email: testEmail }];
  } else {
    recipients = allRecipients;
  }

  let images;
  try {
    images = await resolveTemplateImages(template);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка подготовки шаблона";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const results = new Array<SendResult>(recipients.length);

  const sendOne = async (r: RecipientRow, i: number): Promise<void> => {
    const email = (r.email || "").trim();
    const phone = (r.phone || "").trim();
    const base = { email, fio: r.fio };
    if (!EMAIL_RE.test(email)) {
      results[i] = { ...base, ok: false, error: "Не указан корректный email" };
      await dbLogLetterSend({
        template_key: template.key,
        template_name: template.name,
        fio: r.fio,
        email,
        phone,
        subject: "",
        status: "error",
        error: "Не указан корректный email",
        delivery_status: "error",
      });
      return;
    }
    try {
      const { filename, buffer, tags } = await buildLetterPdf(template, r, images);
      const subject = mergeTags(template.email_subject || "", tags)
        .replace(/\s*\n\s*/g, " ")
        .trim();
      const mergedBody = mergeTags(template.email_body || "", tags);
      const isHtml = mergedBody.includes("<");
      const html = isHtml ? mergedBody : plainToHtml(mergedBody);
      const text = isHtml ? htmlToPlain(mergedBody) : mergedBody;
      // Токен — и Message-ID (для сопоставления возвратов), и адрес пикселя.
      // Для теста на себя трекинг не нужен: он бы засорял статистику.
      const trackToken = payload.test ? undefined : randomUUID();
      const info = await sendLetterEmail({
        to: email,
        subject,
        html,
        text,
        trackToken,
        attachments: [{ filename, content: buffer, contentType: "application/pdf" }],
      });
      const rejected = !info.accepted;
      results[i] = rejected
        ? { ...base, ok: false, error: `SMTP отклонил адрес: ${info.response}` }
        : { ...base, ok: true };
      await dbLogLetterSend({
        template_key: template.key,
        template_name: template.name,
        fio: r.fio,
        email,
        phone,
        subject,
        status: rejected ? "error" : "ok",
        error: rejected ? `SMTP отклонил адрес: ${info.response}` : "",
        track_token: trackToken,
        message_id: info.messageId,
        smtp_response: info.response,
        delivery_status: rejected ? "rejected" : "accepted",
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : "Ошибка отправки";
      results[i] = { ...base, ok: false, error };
      await dbLogLetterSend({
        template_key: template.key,
        template_name: template.name,
        fio: r.fio,
        email,
        phone,
        subject: "",
        status: "error",
        error,
        delivery_status: "error",
      });
    }
  };

  // порциями: не более SEND_CONCURRENCY одновременно, с паузой между письмами
  let next = 0;
  const workers = Array.from(
    { length: Math.min(SEND_CONCURRENCY, recipients.length) },
    async () => {
      while (true) {
        const i = next++;
        if (i >= recipients.length) break;
        await sendOne(recipients[i], i);
        if (SEND_DELAY_MS) await sleep(SEND_DELAY_MS);
      }
    }
  );
  await Promise.all(workers);

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  return NextResponse.json({ ok: true, sent, failed, results });
}
