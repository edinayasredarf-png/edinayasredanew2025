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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEND_CONCURRENCY = 3; // порциями — не упереться в SMTP-лимиты и память
const SEND_DELAY_MS = 400; // пауза между письмами внутри воркера

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    const base = { email, fio: r.fio };
    if (!EMAIL_RE.test(email)) {
      results[i] = { ...base, ok: false, error: "Не указан корректный email" };
      await dbLogLetterSend({
        template_key: template.key,
        template_name: template.name,
        fio: r.fio,
        email,
        subject: "",
        status: "error",
        error: "Не указан корректный email",
      });
      return;
    }
    try {
      const { filename, buffer, tags } = await buildLetterPdf(template, r, images);
      const subject = mergeTags(template.email_subject || "", tags)
        .replace(/\s*\n\s*/g, " ")
        .trim();
      const mergedBody = mergeTags(template.email_body || "", tags);
      const html = mergedBody.includes("<") ? mergedBody : plainToHtml(mergedBody);
      await sendLetterEmail({
        to: email,
        subject,
        html,
        attachments: [{ filename, content: buffer, contentType: "application/pdf" }],
      });
      results[i] = { ...base, ok: true };
      await dbLogLetterSend({
        template_key: template.key,
        template_name: template.name,
        fio: r.fio,
        email,
        subject,
        status: "ok",
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : "Ошибка отправки";
      results[i] = { ...base, ok: false, error };
      await dbLogLetterSend({
        template_key: template.key,
        template_name: template.name,
        fio: r.fio,
        email,
        subject: "",
        status: "error",
        error,
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
