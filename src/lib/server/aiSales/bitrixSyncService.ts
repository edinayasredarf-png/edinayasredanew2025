import "server-only";

import {
  fetchUsers,
  fetchCompanies,
  fetchContacts,
  fetchDeals,
} from "@/lib/server/bitrix/entities";
import {
  upsertManagers,
  upsertCompanies,
  upsertContacts,
  upsertDeals,
  getSyncState,
  setSyncState,
  type SyncEntity,
} from "@/lib/server/aiSales/syncDb";

/**
 * Сервис синхронизации Bitrix → зеркала AI Sales (§61 ТЗ).
 *   • initial sync — полная выгрузка (при первом запуске);
 *   • incremental — по курсору >DATE_MODIFY (webhook/периодический реконсайл).
 * Тяжёлые выгрузки запускаются через очередь (job bitrix.sync), не в HTTP-запросе.
 */

export interface SyncResult {
  entity: SyncEntity;
  fetched: number;
  upserted: number;
}

/** Максимальная DATE_MODIFY из набора — новый курсор. */
function maxModified(dates: Array<Date | null>): Date | null {
  let max: Date | null = null;
  for (const d of dates) {
    if (d && (!max || d.getTime() > max.getTime())) max = d;
  }
  return max;
}

export async function syncUsers(): Promise<SyncResult> {
  const users = await fetchUsers();
  const upserted = await upsertManagers(users);
  await setSyncState("users", { fullSyncDone: true, stats: { count: users.length } });
  return { entity: "users", fetched: users.length, upserted };
}

export async function syncCompanies(): Promise<SyncResult> {
  const state = await getSyncState("companies");
  const since = state.fullSyncDone ? state.lastBitrixModified ?? undefined : undefined;
  const companies = await fetchCompanies(since);
  const upserted = await upsertCompanies(companies);
  await setSyncState("companies", {
    fullSyncDone: true,
    lastBitrixModified: maxModified(companies.map((c) => (c.raw.DATE_MODIFY ? new Date(String(c.raw.DATE_MODIFY)) : null))),
    stats: { count: companies.length },
  });
  return { entity: "companies", fetched: companies.length, upserted };
}

export async function syncContacts(): Promise<SyncResult> {
  const state = await getSyncState("contacts");
  const since = state.fullSyncDone ? state.lastBitrixModified ?? undefined : undefined;
  const contacts = await fetchContacts(since);
  const upserted = await upsertContacts(contacts);
  await setSyncState("contacts", {
    fullSyncDone: true,
    lastBitrixModified: maxModified(contacts.map((c) => (c.raw.DATE_MODIFY ? new Date(String(c.raw.DATE_MODIFY)) : null))),
    stats: { count: contacts.length },
  });
  return { entity: "contacts", fetched: contacts.length, upserted };
}

export async function syncDeals(): Promise<SyncResult> {
  const state = await getSyncState("deals");
  const since = state.fullSyncDone ? state.lastBitrixModified ?? undefined : undefined;
  const deals = await fetchDeals(since);
  const upserted = await upsertDeals(deals);
  await setSyncState("deals", {
    fullSyncDone: true,
    lastBitrixModified: maxModified(deals.map((d) => d.bitrixUpdatedAt)),
    stats: { count: deals.length },
  });
  return { entity: "deals", fetched: deals.length, upserted };
}

/** Полная синхронизация всех сущностей (порядок: users → companies → contacts → deals). */
export async function syncAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  results.push(await syncUsers());
  results.push(await syncCompanies());
  results.push(await syncContacts());
  results.push(await syncDeals());
  return results;
}

/** Синхронизация одной сущности по имени (для job payload). */
export async function syncEntity(entity: SyncEntity): Promise<SyncResult | SyncResult[]> {
  switch (entity) {
    case "users":
      return syncUsers();
    case "companies":
      return syncCompanies();
    case "contacts":
      return syncContacts();
    case "deals":
      return syncDeals();
    default:
      return syncAll();
  }
}
