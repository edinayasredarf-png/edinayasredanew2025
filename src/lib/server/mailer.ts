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
/** Конфигурация конкретного ящика для отправки (доп. ящик из БД). */
export interface SmtpAccount {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  /** Отображаемое «От кого»: «ООО … <mail@domain>» или просто адрес. */
  from?: string;
}

interface MailConfig {
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from?: string;
  helo?: string;
}

/** Основной ящик из ENV (offer@). */
function envConfig(): MailConfig {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 465);
  // secure=true для 465; для 587 задайте SMTP_SECURE=false (STARTTLS)
  const secure = (process.env.SMTP_SECURE ?? "true").trim().toLowerCase() !== "false";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || user;
  // имя клиента для EHLO/HELO — по умолчанию домен ящика (а не MacBook-Pro.local),
  // это заметно улучшает доверие принимающих серверов.
  const helo =
    process.env.SMTP_EHLO_NAME?.trim() || (user?.split("@")[1] || "").trim() || undefined;
  return { host, port, secure, user, pass, from, helo };
}

/** Конфиг из выбранного ящика (доп. почта) или ENV (по умолчанию). */
function config(account?: SmtpAccount): MailConfig {
  if (account) {
    return {
      host: account.host?.trim(),
      port: account.port || 465,
      secure: account.secure,
      user: account.user?.trim(),
      pass: account.pass,
      from: account.from?.trim() || account.user?.trim(),
      helo: (account.user?.split("@")[1] || "").trim() || undefined,
    };
  }
  return envConfig();
}

export function isMailerConfigured(): boolean {
  const c = envConfig();
  return Boolean(c.host && c.user && c.pass);
}

const transporters = new Map<string, Transporter>();

function getTransporter(account?: SmtpAccount): Transporter {
  const c = config(account);
  if (!c.host || !c.user || !c.pass) {
    throw new Error(
      "SMTP не настроен: укажите хост, логин и пароль ящика (или SMTP_HOST/SMTP_USER/SMTP_PASS)"
    );
  }
  const key = `${c.host}:${c.port}:${c.secure}:${c.user}`;
  const cached = transporters.get(key);
  if (cached) return cached;
  const t = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.pass },
    ...(c.helo ? { name: c.helo } : {}),
  });
  transporters.set(key, t);
  return t;
}

export interface LetterAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/** Результат SMTP-отправки. accepted=false → сервер отклонил адрес сразу. */
export interface SendInfo {
  accepted: boolean;
  messageId: string;
  response: string;
  rejected: string[];
}

/** Публичный адрес сайта — для абсолютной ссылки на пиксель внутри письма. */
function siteUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://xn--80aakbcct4b2aj7m.xn--p1ai"
  ).trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/**
 * Свой Message-ID: по нему возврат (DSN) сопоставляется с записью в БД.
 * Домен берём из адреса отправителя — с чужим доменом принимающие серверы ругаются.
 */
export function buildMessageId(token: string, account?: SmtpAccount): string {
  const c = config(account);
  const domain = (c.user?.split("@")[1] || "localhost").trim();
  return `<${token}@${domain}>`;
}

/**
 * Прозрачный пиксель 1x1 для отметки открытия.
 * Сигнал косвенный: картинки часто заблокированы (открытие не зафиксируется),
 * а Gmail/Apple Mail Privacy Protection подгружают их сами (зафиксируется
 * открытие без участия человека).
 */
export function openPixelHtml(token: string): string {
  const src = `${siteUrl()}/api/letters/track/open?t=${encodeURIComponent(token)}`;
  return `<img src="${src}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`;
}

/** Вставляет пиксель перед </body>, либо в конец, если тега нет. */
function injectPixel(html: string, token: string): string {
  const pixel = openPixelHtml(token);
  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${pixel}</body>`)
    : html + pixel;
}

export async function sendLetterEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string; // текстовая версия (без неё письмо чаще уходит в спам)
  attachments?: LetterAttachment[];
  /** Токен трекинга: задаёт Message-ID и включает пиксель открытия. */
  trackToken?: string;
  /** Ящик отправки. Не задан — основной из ENV (offer@). */
  account?: SmtpAccount;
}): Promise<SendInfo> {
  const c = config(opts.account);
  const transport = getTransporter(opts.account);
  // List-Unsubscribe помогает настоящим массовым рассылкам, но помечает письмо
  // как «bulk». Веб-почта его НЕ шлёт — поэтому по умолчанию выключен, чтобы
  // именное письмо выглядело как личное (и не уходило в спам/промоакции).
  // Включить для больших рассылок: SMTP_LIST_UNSUBSCRIBE=true
  const wantUnsub =
    (process.env.SMTP_LIST_UNSUBSCRIBE || "").trim().toLowerCase() === "true";
  const unsubscribe = wantUnsub && c.user ? `mailto:${c.user}?subject=unsubscribe` : undefined;
  const token = opts.trackToken;
  const html = token ? injectPixel(opts.html, token) : opts.html;
  const info = await transport.sendMail({
    from: c.from,
    to: opts.to,
    replyTo: c.from,
    subject: opts.subject,
    text: opts.text,
    html,
    ...(token ? { messageId: buildMessageId(token, opts.account) } : {}),
    // как в веб-почте Timeweb: quoted-printable вместо base64 + обычный приоритет
    // (base64-тело — слабый спам-сигнал; qp выглядит как обычное письмо)
    textEncoding: "quoted-printable",
    priority: "normal",
    headers: { "X-Priority": "3 (Normal)" },
    ...(unsubscribe ? { list: { unsubscribe } } : {}),
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType || "application/pdf",
    })),
  });

  const accepted = (info.accepted || []) as string[];
  const rejected = (info.rejected || []) as string[];
  return {
    accepted: accepted.length > 0 && rejected.length === 0,
    messageId: info.messageId || (token ? buildMessageId(token, opts.account) : ""),
    response: info.response || "",
    rejected: rejected.map(String),
  };
}

/** Проверка соединения/авторизации SMTP (для диагностики). */
export async function verifyMailer(account?: SmtpAccount): Promise<void> {
  await getTransporter(account).verify();
}
