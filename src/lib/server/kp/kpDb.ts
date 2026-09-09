import "server-only";
import { getTimewebPool } from "@/lib/timewebPg";

/*
 * Хранилище генератора КП (отдел продаж). Таблицы создаются и мигрируются
 * лениво (create table if not exists + alter add column), как в модуле «Письма».
 * Сид-данные — организации/тиры/исполнители из Excel «Расчёт по документам»
 * и скриншотов текущего микросервиса ОП (черновик, редактируется в админке).
 */

/** Типы услуг (справочник). Совпадает с выпадающим списком в текущем сервисе. */
export const KP_SERVICE_TYPES = [
  "ИМЗ",
  "ЕС",
  "ИЗН",
  "Лесохозяйственный регламент",
  "Лесоустройство",
] as const;
export type KpServiceType = string;

export interface KpOrganization {
  key: string;
  name: string;
  shortName: string;
  directorRole: string; // роль подписанта: «Директор» / «ИП» …
  directorFio: string; // ФИО подписанта
  requisites: string;
  phone: string;
  email: string;
  headerImage: string; // индивидуальная шапка (картинка) — /api/media/{id}
  headerText: string; // либо текстовая шапка (многострочная)
  stampImage: string;
  signatureImage: string;
  writeKpNumber: boolean; // писать ли номер КП/письма в документе
  mailAccountId: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface KpTier {
  orgKey: string;
  serviceType: string;
  pricePerHaDirect: number;
  pricePerHaTender: number;
  aisPrice: number;
  renewalPerYear: number;
  minHectares: number;
}

export interface KpExecutor {
  id: number;
  fio: string;
  phone: string;
  email: string;
  isActive: boolean;
  sortOrder: number;
}

export interface KpTemplateMeta {
  id: number;
  name: string;
  serviceType: string;
  orgKey: string | null;
  filename: string;
  placeholders: string[];
  sizeBytes: number;
  updatedAt: string;
}

let ensured = false;

async function ensureTables(): Promise<void> {
  if (ensured) return;
  const pool = getTimewebPool();

  await pool.query(`
    create table if not exists kp_organizations (
      key text primary key,
      name text not null default '',
      short_name text not null default '',
      director_role text not null default '',
      director_fio text not null default '',
      requisites text not null default '',
      phone text not null default '',
      email text not null default '',
      stamp_image text not null default '',
      signature_image text not null default '',
      mail_account_id bigint,
      is_active boolean not null default true,
      sort_order integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `);
  // Миграции: индивидуальная шапка, текстовая шапка, флаг нумерации.
  await pool.query(`
    alter table kp_organizations
      add column if not exists header_image text not null default '',
      add column if not exists header_text text not null default '',
      add column if not exists write_kp_number boolean not null default true
  `);

  await pool.query(`
    create table if not exists kp_org_services (
      id bigserial primary key,
      org_key text not null references kp_organizations(key) on delete cascade,
      service_type text not null default '',
      price_per_ha_direct numeric not null default 0,
      price_per_ha_tender numeric not null default 0,
      ais_price numeric not null default 0,
      renewal_per_year numeric not null default 0,
      min_hectares numeric not null default 1,
      unique (org_key, service_type)
    )
  `);

  await pool.query(`
    create table if not exists kp_executors (
      id bigserial primary key,
      fio text not null default '',
      phone text not null default '',
      email text not null default '',
      is_active boolean not null default true,
      sort_order integer not null default 0
    )
  `);

  await pool.query(`
    create table if not exists kp_templates (
      id bigserial primary key,
      name text not null default '',
      service_type text not null default '',
      org_key text,
      filename text not null default '',
      data bytea not null,
      placeholders text not null default '[]',
      size_bytes integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(
    `create index if not exists kp_templates_lookup_idx on kp_templates (service_type, org_key)`
  );

  await pool.query(`
    create table if not exists kp_history (
      id bigserial primary key,
      title text not null default '',
      client_org text not null default '',
      service_type text not null default '',
      org_key text not null default '',
      org_name text not null default '',
      format text not null default 'docx',
      total_cost numeric not null default 0,
      created_by text not null default '',
      payload text not null default '{}',
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(
    `create index if not exists kp_history_created_idx on kp_history (created_at desc)`
  );

  await seedDefaults(pool);
  ensured = true;
}

async function seedDefaults(pool: ReturnType<typeof getTimewebPool>): Promise<void> {
  const { rows } = await pool.query("select count(*)::int as n from kp_organizations");
  if ((rows[0]?.n ?? 0) > 0) return; // уже засеяно / отредактировано вручную

  // Организации (полные названия — из скриншотов текущего сервиса).
  const orgs: Array<Partial<KpOrganization> & { key: string; name: string; shortName: string }> = [
    { key: "ekostroy", name: 'ООО "Экострой"', shortName: "Экострой", directorRole: "Директор", sortOrder: 1 },
    { key: "sfera", name: 'ООО "Сфера"', shortName: "Сфера", directorRole: "Директор", sortOrder: 2 },
    { key: "lesnoe", name: 'ООО "Лесное дело"', shortName: "Лесное дело", directorRole: "Директор", sortOrder: 3 },
    { key: "kushnareva", name: "ИП Кушнарева", shortName: "Кушнарева", directorRole: "Индивидуальный предприниматель", sortOrder: 4 },
    { key: "statov", name: "ИП Статов", shortName: "Статов", directorRole: "Индивидуальный предприниматель", sortOrder: 5 },
  ];
  for (const o of orgs) {
    await pool.query(
      `insert into kp_organizations (key, name, short_name, director_role, sort_order)
       values ($1,$2,$3,$4,$5) on conflict (key) do nothing`,
      [o.key, o.name, o.shortName, o.directorRole || "Директор", o.sortOrder || 0]
    );
  }

  // Ценовые тиры для ИМЗ — из листов Excel (Е С / ЛД / Куш = Экострой/Лесное дело/Кушнарёва).
  // Пролонгация 150000/год — из скриншота. Сфера/Статов — копия Экостроя (черновик).
  const imz: Array<[string, number, number, number]> = [
    ["ekostroy", 210000, 245000, 400000],
    ["sfera", 210000, 245000, 400000],
    ["lesnoe", 220000, 265000, 500000],
    ["kushnareva", 235000, 275000, 550000],
    ["statov", 210000, 245000, 400000],
  ];
  for (const [key, direct, tender, ais] of imz) {
    await pool.query(
      `insert into kp_org_services (org_key, service_type, price_per_ha_direct, price_per_ha_tender, ais_price, renewal_per_year, min_hectares)
       values ($1,'ИМЗ',$2,$3,$4,150000,1) on conflict (org_key, service_type) do nothing`,
      [key, direct, tender, ais]
    );
  }

  // Исполнители (менеджеры ОП) — из скриншота.
  const execs: Array<[string, string]> = [
    ["Иванова Анастасия Николаевна", "8 928 102 07 72"],
    ["Пушкарева Ольга Владимировна", ""],
    ["Родякина Диана Дмитриевна", ""],
    ["Савельева Екатерина Олеговна", ""],
    ["Цокур Светлана Александровна", ""],
  ];
  let i = 1;
  for (const [fio, phone] of execs) {
    await pool.query(
      `insert into kp_executors (fio, phone, sort_order) values ($1,$2,$3)`,
      [fio, phone, i++]
    );
  }
}

/* ─────────────── Организации ─────────────── */

function mapOrg(r: Record<string, unknown>): KpOrganization {
  return {
    key: String(r.key),
    name: String(r.name ?? ""),
    shortName: String(r.short_name ?? ""),
    directorRole: String(r.director_role ?? ""),
    directorFio: String(r.director_fio ?? ""),
    requisites: String(r.requisites ?? ""),
    phone: String(r.phone ?? ""),
    email: String(r.email ?? ""),
    headerImage: String(r.header_image ?? ""),
    headerText: String(r.header_text ?? ""),
    stampImage: String(r.stamp_image ?? ""),
    signatureImage: String(r.signature_image ?? ""),
    writeKpNumber: r.write_kp_number == null ? true : Boolean(r.write_kp_number),
    mailAccountId: r.mail_account_id == null ? null : Number(r.mail_account_id),
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export async function dbListOrganizations(): Promise<KpOrganization[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from kp_organizations order by sort_order, name"
  );
  return rows.map(mapOrg);
}

export async function dbGetOrganization(key: string): Promise<KpOrganization | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from kp_organizations where key = $1", [key]);
  return rows[0] ? mapOrg(rows[0]) : null;
}

export async function dbUpsertOrganization(o: KpOrganization): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query(
    `insert into kp_organizations
       (key, name, short_name, director_role, director_fio, requisites, phone, email,
        header_image, header_text, stamp_image, signature_image, write_kp_number,
        mail_account_id, is_active, sort_order, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now())
     on conflict (key) do update set
       name=excluded.name, short_name=excluded.short_name, director_role=excluded.director_role,
       director_fio=excluded.director_fio, requisites=excluded.requisites, phone=excluded.phone,
       email=excluded.email, header_image=excluded.header_image, header_text=excluded.header_text,
       stamp_image=excluded.stamp_image, signature_image=excluded.signature_image,
       write_kp_number=excluded.write_kp_number, mail_account_id=excluded.mail_account_id,
       is_active=excluded.is_active, sort_order=excluded.sort_order, updated_at=now()`,
    [
      o.key, o.name, o.shortName, o.directorRole, o.directorFio, o.requisites, o.phone, o.email,
      o.headerImage, o.headerText, o.stampImage, o.signatureImage, o.writeKpNumber,
      o.mailAccountId, o.isActive, o.sortOrder,
    ]
  );
}

export async function dbDeleteOrganization(key: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_organizations where key=$1", [key]);
}

/* ─────────────── Ценовые тиры ─────────────── */

function mapTier(r: Record<string, unknown>): KpTier {
  return {
    orgKey: String(r.org_key),
    serviceType: String(r.service_type),
    pricePerHaDirect: Number(r.price_per_ha_direct ?? 0),
    pricePerHaTender: Number(r.price_per_ha_tender ?? 0),
    aisPrice: Number(r.ais_price ?? 0),
    renewalPerYear: Number(r.renewal_per_year ?? 0),
    minHectares: Number(r.min_hectares ?? 1),
  };
}

export async function dbListTiers(): Promise<KpTier[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from kp_org_services");
  return rows.map(mapTier);
}

export async function dbGetTier(orgKey: string, serviceType: string): Promise<KpTier | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from kp_org_services where org_key=$1 and service_type=$2",
    [orgKey, serviceType]
  );
  return rows[0] ? mapTier(rows[0]) : null;
}

export async function dbUpsertTier(t: KpTier): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query(
    `insert into kp_org_services
       (org_key, service_type, price_per_ha_direct, price_per_ha_tender, ais_price, renewal_per_year, min_hectares)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (org_key, service_type) do update set
       price_per_ha_direct=excluded.price_per_ha_direct,
       price_per_ha_tender=excluded.price_per_ha_tender,
       ais_price=excluded.ais_price, renewal_per_year=excluded.renewal_per_year,
       min_hectares=excluded.min_hectares`,
    [t.orgKey, t.serviceType, t.pricePerHaDirect, t.pricePerHaTender, t.aisPrice, t.renewalPerYear, t.minHectares]
  );
}

/* ─────────────── Исполнители ─────────────── */

function mapExec(r: Record<string, unknown>): KpExecutor {
  return {
    id: Number(r.id),
    fio: String(r.fio ?? ""),
    phone: String(r.phone ?? ""),
    email: String(r.email ?? ""),
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export async function dbListExecutors(): Promise<KpExecutor[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from kp_executors order by sort_order, fio"
  );
  return rows.map(mapExec);
}

export async function dbGetExecutor(id: number): Promise<KpExecutor | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from kp_executors where id=$1", [id]);
  return rows[0] ? mapExec(rows[0]) : null;
}

export async function dbUpsertExecutor(e: Partial<KpExecutor>): Promise<number> {
  await ensureTables();
  const pool = getTimewebPool();
  if (e.id) {
    await pool.query(
      `update kp_executors set fio=$2, phone=$3, email=$4, is_active=$5, sort_order=$6 where id=$1`,
      [e.id, e.fio || "", e.phone || "", e.email || "", e.isActive ?? true, e.sortOrder ?? 0]
    );
    return e.id;
  }
  const { rows } = await pool.query(
    `insert into kp_executors (fio, phone, email, is_active, sort_order) values ($1,$2,$3,$4,$5) returning id`,
    [e.fio || "", e.phone || "", e.email || "", e.isActive ?? true, e.sortOrder ?? 0]
  );
  return Number(rows[0].id);
}

export async function dbDeleteExecutor(id: number): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_executors where id=$1", [id]);
}

/* ─────────────── Шаблоны (.docx) ─────────────── */

function mapTemplateMeta(r: Record<string, unknown>): KpTemplateMeta {
  let ph: string[] = [];
  try {
    ph = JSON.parse(String(r.placeholders ?? "[]"));
  } catch {
    ph = [];
  }
  return {
    id: Number(r.id),
    name: String(r.name ?? ""),
    serviceType: String(r.service_type ?? ""),
    orgKey: r.org_key == null || r.org_key === "" ? null : String(r.org_key),
    filename: String(r.filename ?? ""),
    placeholders: ph,
    sizeBytes: Number(r.size_bytes ?? 0),
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function dbListTemplates(): Promise<KpTemplateMeta[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select id, name, service_type, org_key, filename, placeholders, size_bytes, updated_at from kp_templates order by updated_at desc"
  );
  return rows.map(mapTemplateMeta);
}

export async function dbInsertTemplate(input: {
  name: string;
  serviceType: string;
  orgKey: string | null;
  filename: string;
  data: Buffer;
  placeholders: string[];
}): Promise<number> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `insert into kp_templates (name, service_type, org_key, filename, data, placeholders, size_bytes)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [
      input.name.slice(0, 300),
      input.serviceType,
      input.orgKey || null,
      input.filename.slice(0, 300),
      input.data,
      JSON.stringify(input.placeholders),
      input.data.length,
    ]
  );
  return Number(rows[0].id);
}

export async function dbGetTemplateData(id: number): Promise<{ filename: string; data: Buffer } | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select filename, data from kp_templates where id=$1", [id]);
  if (!rows[0]) return null;
  return { filename: String(rows[0].filename), data: rows[0].data as Buffer };
}

/** Подбор шаблона: точное совпадение (услуга+орг) → общий по услуге (org_key null). */
export async function dbResolveTemplate(
  serviceType: string,
  orgKey: string
): Promise<{ id: number; filename: string; data: Buffer } | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select id, filename, data from kp_templates
      where service_type=$1 and (org_key=$2 or org_key is null)
      order by (org_key=$2) desc, updated_at desc
      limit 1`,
    [serviceType, orgKey]
  );
  if (!rows[0]) return null;
  return { id: Number(rows[0].id), filename: String(rows[0].filename), data: rows[0].data as Buffer };
}

export async function dbDeleteTemplate(id: number): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_templates where id=$1", [id]);
}

/* ─────────────── История ─────────────── */

export interface KpHistoryRow {
  id: number;
  title: string;
  clientOrg: string;
  serviceType: string;
  orgKey: string;
  orgName: string;
  format: string;
  totalCost: number;
  createdBy: string;
  createdAt: string;
}

export async function dbListHistory(limit = 100): Promise<KpHistoryRow[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select id, title, client_org, service_type, org_key, org_name, format, total_cost, created_by, created_at
       from kp_history order by created_at desc limit $1`,
    [Math.min(limit, 500)]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title ?? ""),
    clientOrg: String(r.client_org ?? ""),
    serviceType: String(r.service_type ?? ""),
    orgKey: String(r.org_key ?? ""),
    orgName: String(r.org_name ?? ""),
    format: String(r.format ?? ""),
    totalCost: Number(r.total_cost ?? 0),
    createdBy: String(r.created_by ?? ""),
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
  }));
}

export async function dbInsertHistory(input: {
  title: string;
  clientOrg: string;
  serviceType: string;
  orgKey: string;
  orgName: string;
  format: string;
  totalCost: number;
  createdBy: string;
  payload: unknown;
}): Promise<number> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `insert into kp_history (title, client_org, service_type, org_key, org_name, format, total_cost, created_by, payload)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    [
      input.title.slice(0, 300),
      input.clientOrg.slice(0, 500),
      input.serviceType,
      input.orgKey,
      input.orgName,
      input.format,
      input.totalCost,
      input.createdBy.slice(0, 200),
      JSON.stringify(input.payload ?? {}),
    ]
  );
  return Number(rows[0].id);
}

export async function dbGetHistoryPayload(id: number): Promise<unknown | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select payload from kp_history where id=$1", [id]);
  if (!rows[0]) return null;
  try {
    return JSON.parse(String(rows[0].payload));
  } catch {
    return null;
  }
}

export async function dbDeleteHistory(id: number): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_history where id=$1", [id]);
}
