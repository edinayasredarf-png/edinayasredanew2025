import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import type {
  BxUser,
  BxCompany,
  BxContact,
  BxDeal,
} from "@/lib/server/bitrix/entities";

/**
 * Апсерты зеркал Bitrix в ai_*-таблицы (схема по search_path). Идемпотентно по bitrix_*_id (UNIQUE).
 * Хранит только то, что нужно для аналитики; полная карточка — в Bitrix.
 */

export async function upsertManagers(users: BxUser[]): Promise<number> {
  if (!users.length) return 0;
  const pool = getTimewebPool();
  let n = 0;
  for (const u of users) {
    await pool.query(
      `insert into ai_managers (bitrix_user_id, full_name, email, active, raw, updated_at)
       values ($1,$2,$3,$4,$5::jsonb, now())
       on conflict (bitrix_user_id) do update set
         full_name = excluded.full_name,
         email = excluded.email,
         active = excluded.active,
         raw = excluded.raw,
         updated_at = now()`,
      [u.bitrixUserId, u.fullName, u.email, u.active, JSON.stringify(u.raw)]
    );
    n++;
  }
  return n;
}

export async function upsertCompanies(companies: BxCompany[]): Promise<number> {
  if (!companies.length) return 0;
  const pool = getTimewebPool();
  let n = 0;
  for (const c of companies) {
    await pool.query(
      `insert into ai_companies (bitrix_company_id, title, organization_type, industry, raw, updated_at)
       values ($1,$2,$3,$4,$5::jsonb, now())
       on conflict (bitrix_company_id) do update set
         title = excluded.title,
         organization_type = excluded.organization_type,
         industry = excluded.industry,
         raw = excluded.raw,
         updated_at = now()`,
      [c.bitrixCompanyId, c.title, c.organizationType, c.industry, JSON.stringify(c.raw)]
    );
    n++;
  }
  return n;
}

export async function upsertContacts(contacts: BxContact[]): Promise<number> {
  if (!contacts.length) return 0;
  const pool = getTimewebPool();
  let n = 0;
  for (const c of contacts) {
    await pool.query(
      `insert into ai_contacts (bitrix_contact_id, bitrix_company_id, full_name, position, phones, raw, updated_at)
       values ($1,$2,$3,$4,$5::jsonb,$6::jsonb, now())
       on conflict (bitrix_contact_id) do update set
         bitrix_company_id = excluded.bitrix_company_id,
         full_name = excluded.full_name,
         position = excluded.position,
         phones = excluded.phones,
         raw = excluded.raw,
         updated_at = now()`,
      [
        c.bitrixContactId,
        c.bitrixCompanyId,
        c.fullName,
        c.position,
        JSON.stringify(c.phones),
        JSON.stringify(c.raw),
      ]
    );
    n++;
  }
  return n;
}

export async function upsertDeals(deals: BxDeal[]): Promise<number> {
  if (!deals.length) return 0;
  const pool = getTimewebPool();
  let n = 0;
  for (const d of deals) {
    await pool.query(
      `insert into ai_deals (
         bitrix_deal_id, title, bitrix_company_id, bitrix_contact_id, bitrix_user_id,
         stage_id, opportunity, currency, is_closed, bitrix_created_at, bitrix_updated_at, raw, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb, now())
       on conflict (bitrix_deal_id) do update set
         title = excluded.title,
         bitrix_company_id = excluded.bitrix_company_id,
         bitrix_contact_id = excluded.bitrix_contact_id,
         bitrix_user_id = excluded.bitrix_user_id,
         stage_id = excluded.stage_id,
         opportunity = excluded.opportunity,
         currency = excluded.currency,
         is_closed = excluded.is_closed,
         bitrix_updated_at = excluded.bitrix_updated_at,
         raw = excluded.raw,
         updated_at = now()`,
      [
        d.bitrixDealId, d.title, d.bitrixCompanyId, d.bitrixContactId, d.bitrixUserId,
        d.stageId, d.opportunity, d.currency, d.isClosed,
        d.bitrixCreatedAt, d.bitrixUpdatedAt, JSON.stringify(d.raw),
      ]
    );
    n++;
  }
  return n;
}

/* ── Состояние синхронизации (курсоры по DATE_MODIFY) ── */

export type SyncEntity = "users" | "companies" | "contacts" | "deals" | "calls" | "activities";

export interface SyncState {
  entity: SyncEntity;
  lastSyncedAt: Date | null;
  lastBitrixModified: Date | null;
  fullSyncDone: boolean;
}

export async function getSyncState(entity: SyncEntity): Promise<SyncState> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    last_synced_at: Date | null;
    last_bitrix_modified: Date | null;
    full_sync_done: boolean;
  }>(
    `select last_synced_at, last_bitrix_modified, full_sync_done
       from ai_bitrix_sync_state where entity = $1`,
    [entity]
  );
  const r = rows[0];
  return {
    entity,
    lastSyncedAt: r?.last_synced_at ?? null,
    lastBitrixModified: r?.last_bitrix_modified ?? null,
    fullSyncDone: r?.full_sync_done ?? false,
  };
}

export async function setSyncState(
  entity: SyncEntity,
  patch: { lastBitrixModified?: Date | null; fullSyncDone?: boolean; stats?: unknown }
): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `insert into ai_bitrix_sync_state (entity, last_synced_at, last_bitrix_modified, full_sync_done, stats, updated_at)
     values ($1, now(), $2, coalesce($3, false), $4::jsonb, now())
     on conflict (entity) do update set
       last_synced_at = now(),
       last_bitrix_modified = coalesce(excluded.last_bitrix_modified, ai_bitrix_sync_state.last_bitrix_modified),
       full_sync_done = ai_bitrix_sync_state.full_sync_done or excluded.full_sync_done,
       stats = excluded.stats,
       updated_at = now()`,
    [
      entity,
      patch.lastBitrixModified ?? null,
      patch.fullSyncDone ?? null,
      patch.stats === undefined ? null : JSON.stringify(patch.stats),
    ]
  );
}
