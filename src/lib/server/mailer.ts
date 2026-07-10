import "server-only";
import nodemailer, { Transporter } from "nodemailer";

/**
 * SMTP через доменную почту Timeweb. Настройки — только из ENV.
 *   SMTP_HOST   smtp.timeweb.ru (или mail.<домен>)
 *   SMTP_PORT   465 (SSL) или 587 (STARTTLS)
 *   SMTP_SECURE true для 465, false для 587
 *   SMTP_USER   полный адрес ящика (offer@единаясреда.рф)
 *   SMTP_PASS   пароль ящика (НИКОГДА не в git)
 *   SMTP_FROM   ООО «Сфера» <offer@единаясреда.рф> (по умолчанию = SMTP_USER)
 */
function config() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 465);
  // secure=true для 465; для 587 задайте SMTP_SECURE=false (STARTTLS)
  const secure = (process.env.SMTP_SECURE ?? "true").trim().toLowerCase() !== "false";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || user;
  return { host, port, secure, user, pass, from };
}

export function isMailerConfigured(): boolean {
  const c = config();
  return Boolean(c.host && c.user && c.pass);
}

let transporter: Transporter | null = null;
let cachedKey = "";

function getTransporter(): Transporter {
  const c = config();
  if (!c.host || !c.user || !c.pass) {
    throw new Error(
      "SMTP не настроен: задайте SMTP_HOST, SMTP_USER, SMTP_PASS в переменных окружения"
    );
  }
  const key = `${c.host}:${c.port}:${c.secure}:${c.user}`;
  if (transporter && cachedKey === key) return transporter;
  transporter = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.pass },
  });
  cachedKey = key;
  return transporter;
}

export interface LetterAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function sendLetterEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: LetterAttachment[];
}): Promise<void> {
  const c = config();
  const transport = getTransporter();
  await transport.sendMail({
    from: c.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType || "application/pdf",
    })),
  });
}

/** Проверка соединения/авторизации SMTP (для диагностики). */
export async function verifyMailer(): Promise<void> {
  await getTransporter().verify();
}
