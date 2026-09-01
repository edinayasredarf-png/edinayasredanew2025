import "server-only";

import { bitrixListPage } from "@/lib/server/bitrix/client";
import {
  mapUser,
  mapCompany,
  mapContact,
  mapDeal,
} from "@/lib/server/bitrix/entities";
import {
  upsertManagers,
  upsertCompanies,
  upsertContacts,
  upsertDeals,
  setSyncState,
  type SyncEntity,
} from "@/lib/server/aiSales/syncDb";

/**
 * Синхронизация Bitrix → зеркала AI Sales, ЧАНКАМИ ПО СТРАНИЦАМ (§61 ТЗ,
 * адаптировано под лимит времени функции Vercel Hobby ~10-60с).
 *
 * Одна задача bitrix.sync = ОДНА страница Bitrix (≈50 записей). Если есть
 * следующая страница — обработчик докладывает задачу со start=next в очередь.
 * Так полная выгрузка растягивается на много коротких вызовов и не упирается
 * в таймаут serverless. Пагинация по ID ASC — стабильна.
 *
 * Апсерты идемпотентны (bitrix_*_id UNIQUE), поэтому повторный прогон безопасен.
 */

export interface PageResult {
  entity: SyncEntity;
  start: number;
  upserted: number;
  next: number | null;
  total: number | null;
}

type Row = Record<string, unknown>;

/** Обработать одну страницу указанной сущности. */
export async function syncEntityPage(
  entity: SyncEntity,
  start = 0
): Promise<PageResult> {
  let upserted = 0;
  let next: number | null = null;
  let total: number | null = null;

  switch (entity) {
    case "users": {
      const p = await bitrixListPage<Row>("user.get", {
        filter: { ACTIVE: true },
        order: { ID: "ASC" },
        start,
      });
      upserted = await upsertManagers(p.rows.map(mapUser));
      next = p.next;
      total = p.total;
      break;
    }
    case "companies": {
      const p = await bitrixListPage<Row>("crm.company.list", {
        select: ["ID", "TITLE", "COMPANY_TYPE", "INDUSTRY"],
        order: { ID: "ASC" },
        start,
      });
      upserted = await upsertCompanies(p.rows.map(mapCompany));
      next = p.next;
      total = p.total;
      break;
    }
    case "contacts": {
      const p = await bitrixListPage<Row>("crm.contact.list", {
        select: ["ID", "NAME", "LAST_NAME", "SECOND_NAME", "POST", "COMPANY_ID", "PHONE"],
        order: { ID: "ASC" },
        start,
      });
      upserted = await upsertContacts(p.rows.map(mapContact));
      next = p.next;
      total = p.total;
      break;
    }
    case "deals": {
      const p = await bitrixListPage<Row>("crm.deal.list", {
        select: [
          "ID", "TITLE", "COMPANY_ID", "CONTACT_ID", "ASSIGNED_BY_ID", "STAGE_ID",
          "OPPORTUNITY", "CURRENCY_ID", "CLOSED", "DATE_CREATE", "DATE_MODIFY",
        ],
        order: { ID: "ASC" },
        start,
      });
      upserted = await upsertDeals(p.rows.map(mapDeal));
      next = p.next;
      total = p.total;
      break;
    }
    default:
      throw new Error(`Неизвестная сущность синхронизации: ${entity}`);
  }

  // Последняя страница — отметить полную синхронизацию завершённой.
  if (next === null) {
    await setSyncState(entity, { fullSyncDone: true, stats: { total } });
  }
  return { entity, start, upserted, next, total };
}

export const SYNC_ENTITIES: SyncEntity[] = ["users", "companies", "contacts", "deals"];
