import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser, ParsedMail } from "mailparser";
import { dbMarkBounced, dbPromoteAcceptedToDelivered } from "./letterSendsDb";

/**
 * Разбор возвратов (bounce/DSN) по IMAP.
 *
 * Зачем: на голом SMTP факт доставки узнать нельзя — успешный sendMail означает
 * лишь, что релей принял письмо. Реальный отказ приходит отдельным письмом
 * (Delivery Status Notification) на ящик отправителя. Читаем этот ящик и
 * сопоставляем отказ с записью в БД по Message-ID исходного письма.
 *
 * ENV:
 *   IMAP_HOST    imap.timeweb.ru (по умолчанию — из SMTP_HOST, smtp→imap)
 *   IMAP_PORT    993
 *   IMAP_SECURE  true
 *   IMAP_USER    по умолчанию SMTP_USER
 *   IMAP_PASS    по умолчанию SMTP_PASS
 *   IMAP_MAILBOX INBOX
 *   LETTER_DELIVERED_GRACE_HOURS  через сколько часов «принято» → «доставлено» (24)
 */

function config() {
  const host =
    process.env.IMAP_HOST?.trim() ||
    process.env.SMTP_HOST?.trim().replace(/^smtp\./i, "imap.") ||
    "";
  const port = Number(process.env.IMAP_PORT || 993);
  const secure = (process.env.IMAP_SECURE ?? "true").trim().toLowerCase() !== "false";
  const user = process.env.IMAP_USER?.trim() || process.env.SMTP_USER?.trim() || "";
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS || "";
  const mailbox = process.env.IMAP_MAILBOX?.trim() || "INBOX";
  return { host, port, secure, user, pass, mailbox };
}

export function isBounceScanConfigured(): boolean {
  const c = config();
  return Boolean(c.host && c.user && c.pass);
}

/** Отправители, от которых приходят автоматические отказы. */
const BOUNCE_FROM_RE =
  /(mailer-daemon|postmaster|mail-daemon|no-?reply.*(delivery|bounce))/i;

const BOUNCE_SUBJECT_RE =
  /(undelivered|undeliverable|delivery status notification|delivery failure|returned mail|failure notice|mail delivery failed|не доставлено|недоставленное|ошибка доставки)/i;

/** Похоже ли письмо на возврат. */
function looksLikeBounce(mail: ParsedMail): boolean {
  const from = mail.from?.text || "";
  const subject = mail.subject || "";
  const hasDsnPart = (mail.attachments || []).some((a) =>
    /message\/(delivery-status|rfc822)/i.test(a.contentType || "")
  );
  return BOUNCE_FROM_RE.test(from) || BOUNCE_SUBJECT_RE.test(subject) || hasDsnPart;
}

const MESSAGE_ID_RE = /<[^<>@\s]+@[^<>@\s]+>/g;

/**
 * Достаёт Message-ID исходного письма из возврата.
 * Ищем во всех местах, куда его кладут разные почтовые серверы:
 * заголовки In-Reply-To/References, вложенный оригинал, тело.
 */
function extractOriginalMessageIds(mail: ParsedMail, raw: string): string[] {
  const found = new Set<string>();

  const push = (v?: string | string[] | null) => {
    if (!v) return;
    const s = Array.isArray(v) ? v.join(" ") : v;
    for (const m of s.match(MESSAGE_ID_RE) || []) found.add(m);
  };

  push(mail.inReplyTo);
  push(mail.references as string | string[] | undefined);

  // Оригинал часто вложен как message/rfc822 или процитирован в теле —
  // самый надёжный источник, поэтому смотрим и сырой текст письма.
  push(mail.text);
  push(raw);

  // Message-ID самого возврата исключаем — он не наш.
  if (mail.messageId) found.delete(mail.messageId);
  return [...found];
}

/** Причина отказа: строка Diagnostic-Code / Status, иначе тема. */
function extractReason(mail: ParsedMail, raw: string): string {
  const diag = raw.match(/Diagnostic-Code:\s*([^\r\n]+(?:\r?\n[ \t][^\r\n]+)*)/i);
  if (diag) return diag[1].replace(/\s+/g, " ").trim();
  const status = raw.match(/Status:\s*(\d\.\d\.\d)/i);
  const action = raw.match(/Action:\s*([^\r\n]+)/i);
  if (status || action) {
    return [action?.[1]?.trim(), status?.[1]?.trim()].filter(Boolean).join(" ");
  }
  return (mail.subject || "Возврат письма").trim();
}

export interface BounceScanResult {
  scanned: number;
  bounces: number;
  matched: number;
  promoted: number;
}

/**
 * Читает непрочитанные письма в ящике, помечает возвраты и ставит им \Seen.
 * Затем переводит «принято» → «доставлено» для писем старше grace-периода.
 */
export async function scanBounces(): Promise<BounceScanResult> {
  const c = config();
  if (!isBounceScanConfigured()) {
    throw new Error("IMAP не настроен (IMAP_HOST/IMAP_USER/IMAP_PASS или SMTP_*)");
  }

  const client = new ImapFlow({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.pass },
    logger: false,
  });

  let scanned = 0;
  let bounces = 0;
  let matched = 0;

  await client.connect();
  try {
    const lock = await client.getMailboxLock(c.mailbox);
    try {
      // только непрочитанные: прочитанные мы уже разбирали
      const uids = await client.search({ seen: false });
      if (uids && uids.length) {
        // с конца — свежие важнее; ограничим порцию, чтобы не выйти за таймаут
        const batch = uids.slice(-200);
        for await (const msg of client.fetch(
          batch as unknown as string,
          { source: true, uid: true },
          { uid: true }
        )) {
          scanned++;
          const raw = msg.source ? msg.source.toString("utf8") : "";
          if (!raw) continue;

          let mail: ParsedMail;
          try {
            mail = await simpleParser(raw);
          } catch {
            continue;
          }
          if (!looksLikeBounce(mail)) continue;
          bounces++;

          const reason = extractReason(mail, raw);
          const ids = extractOriginalMessageIds(mail, raw);
          let hit = false;
          for (const id of ids) {
            if (await dbMarkBounced(id, reason)) {
              hit = true;
              matched++;
              break;
            }
          }
          // Возврат разобран — помечаем прочитанным, чтобы не читать снова.
          // Неопознанные тоже помечаем: иначе они будут накапливаться вечно.
          try {
            await client.messageFlagsAdd(
              String(msg.uid),
              ["\\Seen"],
              { uid: true }
            );
          } catch {
            /* не критично */
          }
          void hit;
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  const graceHours = Number(process.env.LETTER_DELIVERED_GRACE_HOURS || 24);
  const promoted = await dbPromoteAcceptedToDelivered(
    Number.isFinite(graceHours) ? graceHours : 24
  );

  return { scanned, bounces, matched, promoted };
}
