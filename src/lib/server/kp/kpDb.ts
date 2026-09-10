import "server-only";
import { getTimewebPool } from "@/lib/timewebPg";
import { seedKpTemplates } from "./kpSeedTemplates";

/*
 * Хранилище генератора КП (отдел продаж). Таблицы создаются и мигрируются
 * лениво (create table if not exists + alter add column), как в модуле «Письма».
 * Сид-данные — организации/тиры/исполнители из Excel «Расчёт по документам»
 * и скриншотов текущего микросервиса ОП (черновик, редактируется в админке).
 */

/** Типы услуг (справочник). Совпадает с выпадающим списком в текущем сервисе. */
export const KP_SERVICE_TYPES = [
  "ИМЗ",
  "ИЗН",
  "ЕС",
  "ИМЗ + ЕС",
  "ИЗН + ЕС",
  "ИЗН + ИМЗ + ЕС",
  "Контейнерные площадки",
  "Лесохозяйственный регламент",
  "Лесоустройство",
  "Лес + ЛХР",
  "Проект освоения лесов",
  "Пролонгация ЕС",
  "ФГИС ЛК",
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
  skipAutoBlocks: boolean; // шаблон уже содержит шапку/подписанта — не добавлять авто
  source: string; // 'docx' (загружен) | 'html' (редактируется в админке)
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
    `alter table kp_templates add column if not exists skip_auto_blocks boolean not null default false`
  );
  // Редактируемые (HTML) шаблоны: источник и тело.
  await pool.query(
    `alter table kp_templates add column if not exists source text not null default 'docx'`
  );
  await pool.query(
    `alter table kp_templates add column if not exists body_html text not null default ''`
  );
  // Для HTML-шаблонов .docx-байтов нет — делаем колонку необязательной.
  await pool.query(`alter table kp_templates alter column data drop not null`).catch(() => {});
  // Ключ сид-шаблона (чтобы засеять готовые из кода без дублей).
  await pool.query(`alter table kp_templates add column if not exists seed_key text`);
  await pool.query(
    `create unique index if not exists kp_templates_seed_key_idx on kp_templates (seed_key)`
  );
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

  // Справочник услуг (редактируемый). Сид — из константы KP_SERVICE_TYPES.
  await pool.query(`
    create table if not exists kp_service_types (
      name text primary key,
      sort_order integer not null default 0,
      is_active boolean not null default true
    )
  `);
  await pool.query(
    `alter table kp_service_types add column if not exists row_formula text not null default ''`
  );
  // Добавляем недостающие услуги (не затирая пользовательские).
  let stI = 1;
  for (const name of KP_SERVICE_TYPES) {
    await pool.query(
      "insert into kp_service_types (name, sort_order) values ($1,$2) on conflict (name) do nothing",
      [name, stI++]
    );
  }

  // Настройки (key/value JSON): например, расположение шапки документа.
  await pool.query(
    `create table if not exists kp_settings (key text primary key, value text not null default '{}')`
  );
  // Миграция шапки: старый правый блок [org, fio_short] → [org, должность дат., фио дат.].
  await pool
    .query("select value from kp_settings where key='headerLayout'")
    .then(async (r) => {
      const raw = r.rows[0]?.value;
      if (!raw) return;
      try {
        const v = JSON.parse(String(raw));
        const right = Array.isArray(v.right) ? v.right : [];
        if (right.length === 2 && right[0] === "{{client_org_full}}" && right[1] === "{{client_fio_short}}") {
          v.right = ["{{client_org_full}}", "{{client_position_dative}}", "{{client_fio_short_dative}}"];
          await pool.query("update kp_settings set value=$1 where key='headerLayout'", [JSON.stringify(v)]);
        }
      } catch {
        /* игнорируем битый JSON */
      }
    })
    .catch(() => {});

  // Алиасы: справочник встроенных (для UI) + пользовательские (со значением).
  await pool.query(`
    create table if not exists kp_aliases (
      key text primary key,
      label text not null default '',
      value text not null default '',
      is_custom boolean not null default true,
      sort_order integer not null default 0
    )
  `);
  await seedBuiltinAliases(pool);

  // Конфигурируемые расчётные таблицы (колонки в JSON).
  await pool.query(`
    create table if not exists kp_calc_tables (
      key text primary key,
      name text not null default '',
      columns text not null default '[]',
      is_active boolean not null default true,
      sort_order integer not null default 0
    )
  `);
  await seedDefaultCalcTable(pool);
  await seedKpTemplates(pool);

  await seedDefaults(pool);
  ensured = true;
}

/* ─────────────── Расчётные таблицы ─────────────── */

export interface KpCalcTable {
  key: string;
  name: string;
  columns: unknown[];
  isActive: boolean;
  sortOrder: number;
}

async function seedDefaultCalcTable(pool: ReturnType<typeof getTimewebPool>): Promise<void> {
  // Набор готовых таблиц под услуги. Каждая добавляется, если её ещё нет
  // (не затирает пользовательские правки).
  const idx = { key: "idx", label: "№", kind: "index", align: "center" };
  const money = { isCost: true, sum: true, money: true };

  const defaults: Array<{ key: string; name: string; sort: number; columns: unknown[] }> = [
    {
      key: "raschet",
      name: "Кладбища / территории (авто-цена из тарифа)",
      sort: 1,
      columns: [
        idx,
        { key: "name", label: "Наименование территории", kind: "text", align: "left" },
        { key: "cadastral", label: "Кадастровый номер", kind: "text", align: "center" },
        { key: "area_sqm", label: "Площадь, м²", kind: "number", align: "center", sum: true },
        { key: "cost", label: "Стоимость, руб.", kind: "formula", formula: "max(area_sqm/10000, min_ha) * price", align: "center", ...money },
      ],
    },
    {
      key: "izn",
      name: "ИЗН (площадь/протяжённость, цена за единицу)",
      sort: 2,
      columns: [
        idx,
        { key: "name", label: "Наименование услуги", kind: "text", align: "left" },
        { key: "qty", label: "Кол-во (Га/км)", kind: "number", align: "center", sum: true },
        { key: "unit", label: "Ед. изм.", kind: "text", align: "center" },
        { key: "unit_price", label: "Цена за ед., руб.", kind: "number", align: "center" },
        { key: "cost", label: "Стоимость, руб.", kind: "formula", formula: "qty * unit_price", align: "center", ...money },
      ],
    },
    {
      key: "containers",
      name: "Контейнерные площадки (по штукам)",
      sort: 3,
      columns: [
        idx,
        { key: "name", label: "Наименование", kind: "text", align: "left" },
        { key: "qty", label: "Количество, шт.", kind: "number", align: "center", sum: true },
        { key: "unit_price", label: "Цена за ед., руб.", kind: "number", align: "center" },
        { key: "cost", label: "Стоимость, руб.", kind: "formula", formula: "qty * unit_price", align: "center", ...money },
      ],
    },
    {
      key: "uslugi",
      name: "Список услуг (стоимость вручную)",
      sort: 4,
      columns: [
        idx,
        { key: "name", label: "Наименование услуги", kind: "text", align: "left" },
        { key: "area_txt", label: "Площадь", kind: "text", align: "center" },
        { key: "cost", label: "Стоимость, руб.", kind: "number", align: "center", ...money },
      ],
    },
    {
      key: "flat",
      name: "Фикс-цена (одна строка)",
      sort: 5,
      columns: [
        { key: "name", label: "Наименование работ", kind: "text", align: "left" },
        { key: "cost", label: "Стоимость, руб.", kind: "number", align: "center", ...money },
      ],
    },
  ];

  for (const t of defaults) {
    await pool.query(
      "insert into kp_calc_tables (key, name, columns, sort_order) values ($1,$2,$3,$4) on conflict (key) do nothing",
      [t.key, t.name, JSON.stringify(t.columns), t.sort]
    );
  }
}

function mapCalcTable(r: Record<string, unknown>): KpCalcTable {
  let cols: unknown[] = [];
  try {
    cols = JSON.parse(String(r.columns ?? "[]"));
  } catch {
    cols = [];
  }
  return {
    key: String(r.key),
    name: String(r.name ?? ""),
    columns: cols,
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export async function dbListCalcTables(): Promise<KpCalcTable[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from kp_calc_tables order by sort_order, name");
  return rows.map(mapCalcTable);
}

export async function dbUpsertCalcTable(t: {
  key: string;
  name: string;
  columns: unknown[];
  isActive?: boolean;
  sortOrder?: number;
}): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  const key = t.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!key) throw new Error("Ключ таблицы: латиница/цифры/подчёркивание");
  await pool.query(
    `insert into kp_calc_tables (key, name, columns, is_active, sort_order)
     values ($1,$2,$3,$4,$5)
     on conflict (key) do update set name=excluded.name, columns=excluded.columns,
       is_active=excluded.is_active, sort_order=excluded.sort_order`,
    [key, t.name.slice(0, 300), JSON.stringify(t.columns || []), t.isActive ?? true, t.sortOrder ?? 0]
  );
}

export async function dbDeleteCalcTable(key: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_calc_tables where key=$1", [key]);
}

/* ─────────────── Шапка документа (расположение) ─────────────── */

export interface KpHeaderLayout {
  left: string[];
  center: string[];
  right: string[];
}

export const DEFAULT_HEADER_LAYOUT: KpHeaderLayout = {
  left: ["№ {{kp_number}}", "от {{kp_date}}"],
  center: [],
  right: ["{{client_org_full}}", "{{client_position_dative}}", "{{client_fio_short_dative}}"],
};

export async function dbGetHeaderLayout(): Promise<KpHeaderLayout> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select value from kp_settings where key='headerLayout'");
  if (!rows[0]) return DEFAULT_HEADER_LAYOUT;
  try {
    const v = JSON.parse(String(rows[0].value)) as Partial<KpHeaderLayout>;
    return {
      left: Array.isArray(v.left) ? v.left : [],
      center: Array.isArray(v.center) ? v.center : [],
      right: Array.isArray(v.right) ? v.right : [],
    };
  } catch {
    return DEFAULT_HEADER_LAYOUT;
  }
}

export async function dbSetHeaderLayout(layout: KpHeaderLayout): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  const clean: KpHeaderLayout = {
    left: (layout.left || []).map((s) => String(s).slice(0, 500)),
    center: (layout.center || []).map((s) => String(s).slice(0, 500)),
    right: (layout.right || []).map((s) => String(s).slice(0, 500)),
  };
  await pool.query(
    `insert into kp_settings (key, value) values ('headerLayout', $1)
     on conflict (key) do update set value=excluded.value`,
    [JSON.stringify(clean)]
  );
}

/* ─────────────── Алиасы ─────────────── */

export interface KpAlias {
  key: string;
  label: string;
  value: string;
  isCustom: boolean;
  sortOrder: number;
}

const BUILTIN_ALIASES: Array<[string, string]> = [
  ["kp_number", "Номер КП (или «б/н»)"],
  ["kp_date", "Дата КП"],
  ["kp_validity_period", "Срок действия КП"],
  ["client_org_full", "Организация клиента (полн.)"],
  ["client_org_short", "Организация клиента (кратк.)"],
  ["client_fio_full", "ФИО клиента (полн.)"],
  ["client_fio_short", "ФИО клиента (Иванов И.И.)"],
  ["client_fio_short_dative", "ФИО клиента дат. (Иванову И.И.)"],
  ["client_io", "Имя Отчество клиента"],
  ["client_greeting", "Обращение целиком (Уважаемый Иван Иванович!)"],
  ["territory", "Территория/объект (города Луганск, площадь…)"],
  ["client_position", "Должность клиента"],
  ["client_position_dative", "Должность дат. (Главе …)"],
  ["client_salutation", "Обращение (Уважаемый/-ая)"],
  ["client_request_reference", "Ссылка на запрос (№ … от …)"],
  ["request_intro", "Вступление: «В ответ на ваш запрос…» / «Направляем для вас КП на»"],
  ["sender_org", "Компания-отправитель"],
  ["sender_org_short", "Компания (кратко)"],
  ["company_header", "Текстовая шапка компании"],
  ["signer_role", "Должность подписанта"],
  ["signer_name", "ФИО подписанта (полн.)"],
  ["signer_display_name", "Подписант (И.О. Фамилия)"],
  ["executor_fio", "Исполнитель (ФИО)"],
  ["executor_phone", "Телефон исполнителя"],
  ["area_ha", "Площадь, га"],
  ["location", "Местоположение"],
  ["total_cost", "Итоговая стоимость"],
  ["total_cost_in_words", "Стоимость прописью"],
  ["ais_total", "Стоимость АИС"],
  ["renewal_total", "Стоимость пролонгации"],
];

async function seedBuiltinAliases(pool: ReturnType<typeof getTimewebPool>): Promise<void> {
  let i = 1;
  for (const [key, label] of BUILTIN_ALIASES) {
    await pool.query(
      `insert into kp_aliases (key, label, is_custom, sort_order) values ($1,$2,false,$3)
       on conflict (key) do update set label=excluded.label, is_custom=false`,
      [key, label, i++]
    );
  }
}

export async function dbListAliases(): Promise<KpAlias[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select key, label, value, is_custom, sort_order from kp_aliases order by is_custom, sort_order, key"
  );
  return rows.map((r) => ({
    key: String(r.key),
    label: String(r.label ?? ""),
    value: String(r.value ?? ""),
    isCustom: Boolean(r.is_custom),
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

/** Значения пользовательских алиасов — вливаются в теги при генерации. */
export async function dbGetCustomAliasValues(): Promise<Record<string, string>> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select key, value from kp_aliases where is_custom");
  const out: Record<string, string> = {};
  for (const r of rows) out[String(r.key)] = String(r.value ?? "");
  return out;
}

export async function dbUpsertCustomAlias(key: string, label: string, value: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  const k = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!k) throw new Error("Ключ алиаса: латиница/цифры/подчёркивание");
  await pool.query(
    `insert into kp_aliases (key, label, value, is_custom, sort_order) values ($1,$2,$3,true,999)
     on conflict (key) do update set label=excluded.label, value=excluded.value`,
    [k, label.slice(0, 200), value.slice(0, 2000)]
  );
}

export async function dbDeleteCustomAlias(key: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_aliases where key=$1 and is_custom", [key]);
}

export interface KpServiceTypeRow {
  name: string;
  sortOrder: number;
  isActive: boolean;
  rowFormula: string;
}

export async function dbListServiceTypes(activeOnly = false): Promise<KpServiceTypeRow[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select name, sort_order, is_active, row_formula from kp_service_types ${activeOnly ? "where is_active" : ""} order by sort_order, name`
  );
  return rows.map((r) => ({
    name: String(r.name),
    sortOrder: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
    rowFormula: String(r.row_formula ?? ""),
  }));
}

export async function dbGetServiceFormula(name: string): Promise<string> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query("select row_formula from kp_service_types where name=$1", [name]);
  return rows[0] ? String(rows[0].row_formula ?? "") : "";
}

export async function dbSetServiceFormula(name: string, formula: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("update kp_service_types set row_formula=$2 where name=$1", [name, formula.slice(0, 1000)]);
}

export async function dbAddServiceType(name: string, sortOrder = 0): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query(
    "insert into kp_service_types (name, sort_order) values ($1,$2) on conflict (name) do nothing",
    [name.trim().slice(0, 200), sortOrder]
  );
}

/** Переименование с каскадом на тиры/шаблоны/историю (услуга хранится строкой). */
export async function dbRenameServiceType(oldName: string, newName: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  const nn = newName.trim().slice(0, 200);
  if (!nn || nn === oldName) return;
  await pool.query(
    "insert into kp_service_types (name, sort_order, is_active, row_formula) select $2, sort_order, is_active, row_formula from kp_service_types where name=$1 on conflict (name) do nothing",
    [oldName, nn]
  );
  await pool.query("update kp_org_services set service_type=$2 where service_type=$1", [oldName, nn]);
  await pool.query("update kp_templates set service_type=$2 where service_type=$1", [oldName, nn]);
  await pool.query("update kp_history set service_type=$2 where service_type=$1", [oldName, nn]);
  await pool.query("delete from kp_service_types where name=$1", [oldName]);
}

export async function dbSetServiceTypeActive(name: string, isActive: boolean): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("update kp_service_types set is_active=$2 where name=$1", [name, isActive]);
}

export async function dbDeleteServiceType(name: string): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("delete from kp_service_types where name=$1", [name]);
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
    skipAutoBlocks: Boolean(r.skip_auto_blocks),
    source: String(r.source ?? "docx"),
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function dbListTemplates(): Promise<KpTemplateMeta[]> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select id, name, service_type, org_key, filename, placeholders, size_bytes, skip_auto_blocks, source, updated_at from kp_templates order by updated_at desc"
  );
  return rows.map(mapTemplateMeta);
}

export async function dbInsertTemplate(input: {
  name: string;
  serviceType: string;
  orgKey: string | null;
  filename: string;
  data: Buffer | null;
  placeholders: string[];
  skipAutoBlocks?: boolean;
  source?: string;
  bodyHtml?: string;
}): Promise<number> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `insert into kp_templates (name, service_type, org_key, filename, data, placeholders, size_bytes, skip_auto_blocks, source, body_html)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [
      input.name.slice(0, 300),
      input.serviceType,
      input.orgKey || null,
      input.filename.slice(0, 300),
      input.data,
      JSON.stringify(input.placeholders),
      input.data?.length ?? 0,
      input.skipAutoBlocks ?? false,
      input.source || "docx",
      input.bodyHtml || "",
    ]
  );
  return Number(rows[0].id);
}

/** Обновление шаблона (метаданные + HTML-тело). */
export async function dbUpdateTemplate(
  id: number,
  input: {
    name: string;
    serviceType: string;
    orgKey: string | null;
    skipAutoBlocks: boolean;
    bodyHtml: string;
    placeholders: string[];
  }
): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query(
    `update kp_templates set name=$2, service_type=$3, org_key=$4, skip_auto_blocks=$5,
       body_html=$6, placeholders=$7, source='html', updated_at=now() where id=$1`,
    [
      id,
      input.name.slice(0, 300),
      input.serviceType,
      input.orgKey || null,
      input.skipAutoBlocks,
      input.bodyHtml,
      JSON.stringify(input.placeholders),
    ]
  );
}

export interface KpTemplateFull extends KpTemplateMeta {
  bodyHtml: string;
  hasDocx: boolean;
}

export async function dbGetTemplateFull(id: number): Promise<KpTemplateFull | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select id, name, service_type, org_key, filename, placeholders, size_bytes, skip_auto_blocks, source, body_html, (data is not null) as has_docx, updated_at from kp_templates where id=$1",
    [id]
  );
  if (!rows[0]) return null;
  return {
    ...mapTemplateMeta(rows[0]),
    bodyHtml: String(rows[0].body_html ?? ""),
    hasDocx: Boolean(rows[0].has_docx),
  };
}

export async function dbSetTemplateSkipAuto(id: number, skip: boolean): Promise<void> {
  await ensureTables();
  const pool = getTimewebPool();
  await pool.query("update kp_templates set skip_auto_blocks=$2 where id=$1", [id, skip]);
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
): Promise<{
  id: number;
  filename: string;
  data: Buffer | null;
  skipAutoBlocks: boolean;
  source: string;
  bodyHtml: string;
} | null> {
  await ensureTables();
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select id, filename, data, skip_auto_blocks, source, body_html from kp_templates
      where service_type=$1 and (org_key=$2 or org_key is null)
      order by (org_key=$2) desc, updated_at desc
      limit 1`,
    [serviceType, orgKey]
  );
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    filename: String(rows[0].filename),
    data: (rows[0].data as Buffer) ?? null,
    skipAutoBlocks: Boolean(rows[0].skip_auto_blocks),
    source: String(rows[0].source ?? "docx"),
    bodyHtml: String(rows[0].body_html ?? ""),
  };
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
