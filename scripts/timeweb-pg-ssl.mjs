/**
 * Общая логика SSL для check-timeweb-pg.mjs (Node не читает libpq.ini).
 * Убираем sslmode из URL — иначе драйвер и Node TLS могут конфликтовать с явным ssl.ca.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function stripSslFromConnectionString(connectionString) {
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("sslrootcert");
    u.searchParams.delete("sslcert");
    u.searchParams.delete("sslkey");
    return u.toString();
  } catch {
    return connectionString;
  }
}

/** SNI / проверка имени: при localhost, 127.0.0.1 или IP в URL нужен хост из сертификата Timeweb (*.twc1.net). */
export function tlsServername(connectionString) {
  const fromEnv = process.env.DATABASE_SSL_SERVERNAME?.trim();
  if (fromEnv) return fromEnv;
  try {
    const host = new URL(connectionString).hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return undefined;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

export function connectionHostname(connectionString) {
  try {
    return new URL(connectionString).hostname || "";
  } catch {
    return "";
  }
}

export function resolveSslCaContent() {
  const pemInline =
    process.env.DATABASE_SSL_CA_PEM?.trim() ||
    process.env.TIMEWEB_PG_CA_PEM?.trim();
  if (pemInline?.includes("BEGIN CERTIFICATE")) {
    return { content: pemInline.replace(/\\n/g, "\n"), path: "(DATABASE_SSL_CA_PEM)" };
  }

  const explicit = (
    process.env.PGSSLROOTCERT?.trim() ||
    process.env.DATABASE_SSL_CA?.trim() ||
    process.env.TIMEWEB_PG_CA_PATH?.trim() ||
    ""
  );

  if (explicit.includes("BEGIN CERTIFICATE")) {
    return { content: explicit.replace(/\\n/g, "\n"), path: "(inline PEM)" };
  }

  const bundled = path.join(process.cwd(), "certs", "timeweb-cloud-ca.pem");

  const candidates = [
    explicit,
    bundled,
    path.join(os.homedir(), ".cloud-certs", "root.crt"),
  ].filter(Boolean);

  for (const file of candidates) {
    try {
      if (file && fs.existsSync(file)) {
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("BEGIN CERTIFICATE")) return { content, path: file };
      }
    } catch {
      /* next */
    }
  }
  return { content: undefined, path: explicit || undefined };
}

/**
 * @returns {{ connectionString: string, ssl: object | false | undefined }}
 */
export function buildPgSsl(connectionString) {
  const stripped = stripSslFromConnectionString(connectionString);

  const insecure =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false" ||
    process.env.DATABASE_SSL_INSECURE === "1";

  if (insecure) {
    return {
      connectionString: stripped,
      ssl: { rejectUnauthorized: false },
    };
  }

  const servername = tlsServername(connectionString);
  const baseSsl = servername ? { servername } : {};

  const { content: ca, path: caPath } = resolveSslCaContent();
  if (ca) {
    return {
      connectionString: stripped,
      ssl: { rejectUnauthorized: true, ca, ...baseSsl },
    };
  }

  return {
    connectionString: stripped,
    ssl: { rejectUnauthorized: true, ...baseSsl },
  };
}

export function sslDebugLines() {
  const { content, path: caFile } = resolveSslCaContent();
  const dbUrl = (process.env.DATABASE_URL || process.env.TIMEWEB_DATABASE_URL || "").trim();
  const host = dbUrl ? connectionHostname(dbUrl) : "";
  const sn = dbUrl ? tlsServername(dbUrl) : "";
  return [
    `PGSSLROOTCERT=${process.env.PGSSLROOTCERT || "(не задан)"}`,
    `DATABASE_SSL_CA=${process.env.DATABASE_SSL_CA || "(не задан)"}`,
    `DATABASE_SSL_SERVERNAME=${process.env.DATABASE_SSL_SERVERNAME || "(не задан)"}`,
    `Хост из DATABASE_URL: ${host || "(нет)"}`,
    `TLS servername (итог): ${sn || "(авто не задан для localhost/IP)"}`,
    `Проверенный путь к CA: ${caFile || "(нет)"}`,
    `CA загружен: ${content ? `да (${content.length} байт)` : "нет"}`,
    `Файл ~/.cloud-certs/root.crt: ${fs.existsSync(path.join(os.homedir(), ".cloud-certs", "root.crt")) ? "есть" : "нет"}`,
  ];
}
