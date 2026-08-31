import "server-only";

import { createHash, createHmac } from "node:crypto";

/**
 * Загрузка аудио в S3-совместимое объектное хранилище (Yandex Object Storage).
 * Нужна для Yandex SpeechKit longRunningRecognize, который принимает audio.uri
 * из Object Storage (как в рабочем n8n-пайплайне клиента).
 *
 * Реализован минимальный SigV4-PUT на node:crypto — без новых зависимостей
 * (проект уже хендролит pg/TLS). Если хранилище не настроено — понятная ошибка.
 *
 * ENV:
 *   YANDEX_S3_ENDPOINT     (default storage.yandexcloud.net)
 *   YANDEX_S3_REGION       (default ru-central1)
 *   YANDEX_S3_BUCKET
 *   YANDEX_S3_ACCESS_KEY
 *   YANDEX_S3_SECRET_KEY
 */

export class ObjectStorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectStorageNotConfiguredError";
  }
}

export interface ObjectStorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

export function objectStorageConfigured(): boolean {
  return Boolean(
    process.env.YANDEX_S3_BUCKET?.trim() &&
      process.env.YANDEX_S3_ACCESS_KEY?.trim() &&
      process.env.YANDEX_S3_SECRET_KEY?.trim()
  );
}

function getConfig(): ObjectStorageConfig {
  const bucket = process.env.YANDEX_S3_BUCKET?.trim();
  const accessKey = process.env.YANDEX_S3_ACCESS_KEY?.trim();
  const secretKey = process.env.YANDEX_S3_SECRET_KEY?.trim();
  if (!bucket || !accessKey || !secretKey) {
    throw new ObjectStorageNotConfiguredError(
      "Object Storage не настроен: задайте YANDEX_S3_BUCKET / YANDEX_S3_ACCESS_KEY / YANDEX_S3_SECRET_KEY"
    );
  }
  return {
    endpoint: process.env.YANDEX_S3_ENDPOINT?.trim() || "storage.yandexcloud.net",
    region: process.env.YANDEX_S3_REGION?.trim() || "ru-central1",
    bucket,
    accessKey,
    secretKey,
  };
}

const sha256hex = (data: Buffer | string) =>
  createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string) =>
  createHmac("sha256", key).update(data, "utf8").digest();

function amzDate(now = new Date()): { amzDate: string; dateStamp: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

/** Кодирование ключа объекта для canonical URI (path-style, без кодирования '/'). */
function encodeKey(key: string): string {
  return key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export interface PutResult {
  /** URI объекта, пригодный для audio.uri в Yandex SpeechKit. */
  uri: string;
  bucket: string;
  key: string;
}

/**
 * Загрузить объект (PUT) в S3-совместимое хранилище через SigV4.
 * Path-style URL: https://<endpoint>/<bucket>/<key>.
 */
export async function putObject(
  key: string,
  body: Buffer,
  contentType = "audio/mpeg"
): Promise<PutResult> {
  const cfg = getConfig();
  const host = cfg.endpoint;
  const canonicalUri = `/${cfg.bucket}/${encodeKey(key)}`;
  const { amzDate: xAmzDate, dateStamp } = amzDate();
  const payloadHash = sha256hex(body);
  const service = "s3";

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${xAmzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${cfg.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    xAmzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${cfg.secretKey}`, dateStamp);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKey}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${canonicalUri}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": xAmzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Object Storage PUT ${res.status}: ${detail.slice(0, 300)}`);
  }

  return { uri: url, bucket: cfg.bucket, key };
}
