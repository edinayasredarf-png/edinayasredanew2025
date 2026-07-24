import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Симметричное шифрование секретов (SMTP-паролей доп. ящиков) для хранения в БД.
 * Ключ — из ENV MAIL_SECRET_KEY, иначе fallback на AUTH_SESSION_SECRET
 * (он уже задан в окружении). Пароли в открытом виде в БД не хранятся и наружу
 * (в API/UI) не отдаются.
 */
function key(): Buffer {
  const raw = (process.env.MAIL_SECRET_KEY || process.env.AUTH_SESSION_SECRET || "").trim();
  if (!raw) {
    throw new Error(
      "Не задан ключ шифрования: укажите MAIL_SECRET_KEY (или AUTH_SESSION_SECRET) в переменных окружения"
    );
  }
  return createHash("sha256").update(raw).digest(); // 32 байта для AES-256
}

export function isSecretBoxConfigured(): boolean {
  return Boolean((process.env.MAIL_SECRET_KEY || process.env.AUTH_SESSION_SECRET || "").trim());
}

/** plaintext → строка формата v1:iv:tag:data (base64). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/** Обратная операция. Бросает, если формат/ключ не совпадают. */
export function decryptSecret(payload: string): string {
  const parts = (payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Некорректный формат зашифрованного секрета");
  }
  const [, ivb, tagb, datab] = parts;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivb, "base64"));
  decipher.setAuthTag(Buffer.from(tagb, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(datab, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
