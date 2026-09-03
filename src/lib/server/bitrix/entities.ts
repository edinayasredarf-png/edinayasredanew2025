import "server-only";

import {
  bitrixCall,
  bitrixListAll,
  bxStr,
  bxDate,
  type ListParams,
} from "@/lib/server/bitrix/client";

/**
 * Типизированные фетчеры сущностей Bitrix24 CRM для зеркалирования в AI Sales.
 * Поля выбираются явно (select) — не тянем лишнее. Инкрементальность —
 * через фильтр по >DATE_MODIFY (курсор хранится в ai_bitrix_sync_state).
 */

/** CRM owner types (CCrmOwnerType) — для activity.OWNER_TYPE_ID. */
export const OWNER_TYPE = { LEAD: 1, DEAL: 2, CONTACT: 3, COMPANY: 4 } as const;

export interface BxUser {
  bitrixUserId: string;
  fullName: string;
  email: string | null;
  active: boolean;
  raw: Record<string, unknown>;
}

export function mapUser(r: Record<string, unknown>): BxUser {
  return {
    bitrixUserId: bxStr(r.ID),
    fullName: [r.NAME, r.LAST_NAME].map((x) => bxStr(x).trim()).filter(Boolean).join(" ") || bxStr(r.EMAIL),
    email: bxStr(r.EMAIL) || null,
    active: bxStr(r.ACTIVE) !== "false" && r.ACTIVE !== false,
    raw: r,
  };
}

export async function fetchUsers(): Promise<BxUser[]> {
  // user.get возвращает всех; фильтруем только активных сотрудников.
  const rows = await bitrixListAll<Record<string, unknown>>("user.get", {
    filter: { ACTIVE: true } as Record<string, unknown>,
  } as ListParams);
  return rows.map(mapUser);
}

export interface BxCompany {
  bitrixCompanyId: string;
  title: string | null;
  organizationType: string | null;
  industry: string | null;
  raw: Record<string, unknown>;
}

export function mapCompany(r: Record<string, unknown>): BxCompany {
  return {
    bitrixCompanyId: bxStr(r.ID),
    title: bxStr(r.TITLE) || null,
    organizationType: bxStr(r.COMPANY_TYPE) || null,
    industry: bxStr(r.INDUSTRY) || null,
    raw: r,
  };
}

export async function fetchCompanies(sinceModify?: Date): Promise<BxCompany[]> {
  const filter: Record<string, unknown> = {};
  if (sinceModify) filter[">DATE_MODIFY"] = sinceModify.toISOString();
  const rows = await bitrixListAll<Record<string, unknown>>("crm.company.list", {
    filter,
    select: ["ID", "TITLE", "COMPANY_TYPE", "INDUSTRY", "DATE_MODIFY"],
    order: { DATE_MODIFY: "ASC" },
  });
  return rows.map(mapCompany);
}

export interface BxContact {
  bitrixContactId: string;
  bitrixCompanyId: string | null;
  fullName: string | null;
  position: string | null;
  phones: string[];
  raw: Record<string, unknown>;
}

export async function fetchContacts(sinceModify?: Date): Promise<BxContact[]> {
  const filter: Record<string, unknown> = {};
  if (sinceModify) filter[">DATE_MODIFY"] = sinceModify.toISOString();
  const rows = await bitrixListAll<Record<string, unknown>>("crm.contact.list", {
    filter,
    select: ["ID", "NAME", "LAST_NAME", "SECOND_NAME", "POST", "COMPANY_ID", "PHONE", "DATE_MODIFY"],
    order: { DATE_MODIFY: "ASC" },
  });
  return rows.map(mapContact);
}

export function mapContact(r: Record<string, unknown>): BxContact {
  const phones = Array.isArray(r.PHONE)
    ? (r.PHONE as Array<{ VALUE?: unknown }>).map((p) => bxStr(p?.VALUE)).filter(Boolean)
    : [];
  return {
    bitrixContactId: bxStr(r.ID),
    bitrixCompanyId: bxStr(r.COMPANY_ID) || null,
    fullName:
      [r.LAST_NAME, r.NAME, r.SECOND_NAME].map((x) => bxStr(x).trim()).filter(Boolean).join(" ") || null,
    position: bxStr(r.POST) || null,
    phones,
    raw: r,
  };
}

export interface BxDeal {
  bitrixDealId: string;
  title: string | null;
  bitrixCompanyId: string | null;
  bitrixContactId: string | null;
  bitrixUserId: string | null;
  stageId: string | null;
  opportunity: number | null;
  currency: string | null;
  isClosed: boolean;
  isWon: boolean | null; // true — выиграна, false — проиграна, null — не закрыта/неясно
  bitrixCreatedAt: Date | null;
  bitrixUpdatedAt: Date | null;
  raw: Record<string, unknown>;
}

export async function fetchDeals(sinceModify?: Date): Promise<BxDeal[]> {
  const filter: Record<string, unknown> = {};
  if (sinceModify) filter[">DATE_MODIFY"] = sinceModify.toISOString();
  const rows = await bitrixListAll<Record<string, unknown>>("crm.deal.list", {
    filter,
    select: [
      "ID", "TITLE", "COMPANY_ID", "CONTACT_ID", "ASSIGNED_BY_ID", "STAGE_ID",
      "OPPORTUNITY", "CURRENCY_ID", "CLOSED", "DATE_CREATE", "DATE_MODIFY",
    ],
    order: { DATE_MODIFY: "ASC" },
  });
  return rows.map(mapDeal);
}

export function mapDeal(r: Record<string, unknown>): BxDeal {
  const stageId = bxStr(r.STAGE_ID) || null;
  const isClosed = bxStr(r.CLOSED) === "Y";
  // Won/lost по семантике стадии Bitrix: *:WON / *:LOSE|APOLOGY|FAIL.
  let isWon: boolean | null = null;
  if (isClosed && stageId) {
    if (/won$/i.test(stageId)) isWon = true;
    else if (/(lose|apology|fail|junk)$/i.test(stageId)) isWon = false;
  }
  return {
    bitrixDealId: bxStr(r.ID),
    title: bxStr(r.TITLE) || null,
    bitrixCompanyId: bxStr(r.COMPANY_ID) || null,
    bitrixContactId: bxStr(r.CONTACT_ID) || null,
    bitrixUserId: bxStr(r.ASSIGNED_BY_ID) || null,
    stageId,
    opportunity: r.OPPORTUNITY != null && r.OPPORTUNITY !== "" ? Number(r.OPPORTUNITY) : null,
    currency: bxStr(r.CURRENCY_ID) || null,
    isClosed,
    isWon,
    bitrixCreatedAt: bxDate(r.DATE_CREATE),
    bitrixUpdatedAt: bxDate(r.DATE_MODIFY),
    raw: r,
  };
}

/**
 * Данные звонка из CRM-активности (подход из рабочего n8n-пайплайна клиента):
 * запись лежит как файл активности (FILES[0]), скачивается через disk.file.get,
 * привязка к сделке — через OWNER_ID/OWNER_TYPE_ID.
 */
export interface BxCallActivity {
  bitrixActivityId: string;
  ownerId: string | null;
  ownerTypeId: number | null;
  bitrixDealId: string | null;
  bitrixLeadId: string | null;
  bitrixContactId: string | null;
  bitrixCompanyId: string | null;
  bitrixUserId: string | null; // ответственный/автор
  direction: "in" | "out" | null;
  subject: string | null;
  startedAt: Date | null;
  durationSec: number | null;
  phone: string | null; // номер клиента (из COMMUNICATIONS)
  fileId: string | null;
  recordingUrl: string | null; // disk.file.get URL
  raw: Record<string, unknown>;
}

function webhookBase(): string {
  const raw = (process.env.BITRIX24_WEBHOOK_URL || "").trim();
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/**
 * Резолв прямой ссылки на скачивание файла записи (DOWNLOAD_URL) через disk.file.get.
 * DOWNLOAD_URL может быть коротко-живущим — резолвим непосредственно перед скачиванием.
 */
export async function resolveDiskDownloadUrl(fileId: string): Promise<string | null> {
  const { result } = await bitrixCall<Record<string, unknown>>("disk.file.get", {
    id: fileId,
  });
  const url = result?.DOWNLOAD_URL;
  return url ? String(url) : null;
}

/** Получить активность-звонок по ID и извлечь запись + привязки. */
export async function fetchCallActivity(activityId: string): Promise<BxCallActivity> {
  const { result } = await bitrixCall<Record<string, unknown>>("crm.activity.get", {
    id: activityId,
  });
  const a = result || {};

  const files = Array.isArray(a.FILES) ? (a.FILES as Array<{ id?: unknown }>) : [];
  const fileId = files[0]?.id != null ? bxStr(files[0].id) : null;
  const recordingUrl = fileId ? `${webhookBase()}disk.file.get?id=${fileId}` : null;

  const ownerTypeId = a.OWNER_TYPE_ID != null ? Number(a.OWNER_TYPE_ID) : null;
  const ownerId = bxStr(a.OWNER_ID) || null;

  // DIRECTION: 1 = входящий, 2 = исходящий (crm.activity).
  const dir = bxStr(a.DIRECTION);
  const direction = dir === "2" ? "out" : dir === "1" ? "in" : null;

  // Телефон клиента — из COMMUNICATIONS активности.
  const comms = Array.isArray(a.COMMUNICATIONS) ? (a.COMMUNICATIONS as Array<{ VALUE?: unknown; TYPE?: unknown }>) : [];
  const phone = comms.map((c) => bxStr(c?.VALUE)).find(Boolean) || null;

  return {
    bitrixActivityId: bxStr(a.ID) || activityId,
    ownerId,
    ownerTypeId,
    bitrixDealId: ownerTypeId === OWNER_TYPE.DEAL ? ownerId : null,
    bitrixLeadId: ownerTypeId === OWNER_TYPE.LEAD ? ownerId : null,
    bitrixContactId: ownerTypeId === OWNER_TYPE.CONTACT ? ownerId : null,
    bitrixCompanyId: ownerTypeId === OWNER_TYPE.COMPANY ? ownerId : null,
    bitrixUserId: bxStr(a.RESPONSIBLE_ID) || bxStr(a.AUTHOR_ID) || null,
    direction,
    subject: bxStr(a.SUBJECT) || null,
    startedAt: bxDate(a.START_TIME) || bxDate(a.CREATED),
    durationSec: null, // проставляется из STT после транскрипции
    phone,
    fileId,
    recordingUrl,
    raw: a,
  };
}
