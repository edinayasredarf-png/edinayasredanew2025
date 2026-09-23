import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";
import { dealHasActivitySince } from "@/lib/server/aiSales/dealTimelineService";

/**
 * «Брошенный клиент»: по звонку не дозвонились И за сутки не было ни повторного
 * состоявшегося звонка (по той же сделке/номеру), ни активности в Bitrix.
 *
 * Реконсиляция за день (SQL): один недозвон сам по себе — не проблема; проблема,
 * если контакт так и не состоялся и в сделке тишина. Список «на сейчас» (по
 * свежим звонкам), не зависит от выбранного периода — как и просрочки.
 */

export interface AbandonedClient {
  callId: string;
  bitrixDealId: string | null;
  phone: string | null;
  clientTitle: string | null;
  manager: string | null;
  startedAt: string | null; // ISO — момент недозвона
  dealUrl: string | null;
}

/** Кандидаты: недозвоны без более позднего дозвона (по сделке/номеру, ≤24ч). */
async function unresolvedNoContact(managerBitrixId: string | null, days: number): Promise<Array<{
  call_id: string; bitrix_deal_id: string | null; phone_number: string | null;
  client_title: string | null; manager: string | null; started_at: Date | null;
}>> {
  const pool = getTimewebPool();
  const params: unknown[] = [String(days)];
  let mgr = "";
  if (managerBitrixId) { params.push(managerBitrixId); mgr = ` and c.bitrix_user_id = $${params.length}`; }

  // Один свежайший недозвон на сделку (а без сделки — на номер по последним 10 цифрам).
  const { rows } = await pool.query(
    `with nc as (
       select c.id as call_id, c.bitrix_deal_id, c.phone_number, c.client_title,
              c.bitrix_user_id, c.started_at,
              nullif(right(regexp_replace(coalesce(c.phone_number,''), '\\D', '', 'g'), 10), '') as phone10
         from ai_calls c
         join ai_call_analysis a on a.call_id = c.id and a.result_type = 'no_contact'
        where c.started_at >= now() - ($1 || ' days')::interval${mgr}
          and not exists (
            select 1 from ai_calls c2
            join ai_call_analysis a2 on a2.call_id = c2.id
            where c2.id <> c.id
              and c2.started_at > c.started_at
              and c2.started_at <= c.started_at + interval '24 hours'
              and coalesce(a2.result_type, '') <> 'no_contact'
              and coalesce(c2.duration_sec, 0) >= 20
              and (
                (c.bitrix_deal_id is not null and c2.bitrix_deal_id = c.bitrix_deal_id)
                or (c.phone_number is not null
                    and right(regexp_replace(coalesce(c2.phone_number,''), '\\D', '', 'g'), 10)
                      = right(regexp_replace(c.phone_number, '\\D', '', 'g'), 10))
              )
          )
     ),
     ranked as (
       select nc.*, m.full_name as manager,
              row_number() over (
                partition by coalesce(nc.bitrix_deal_id, nc.phone10, nc.call_id)
                order by nc.started_at desc
              ) as rn
         from nc
         left join ai_managers m on m.bitrix_user_id = nc.bitrix_user_id
     )
     select call_id, bitrix_deal_id, phone_number, client_title, manager, started_at
       from ranked where rn = 1
      order by started_at desc
      limit 40`,
    params
  );
  return rows as Array<{
    call_id: string; bitrix_deal_id: string | null; phone_number: string | null;
    client_title: string | null; manager: string | null; started_at: Date | null;
  }>;
}

/**
 * Брошенные клиенты: из недозвонов без повторного дозвона отсеиваем те, где в
 * Bitrix после звонка была активность. Проверку Bitrix ограничиваем (латентность).
 */
export async function getAbandonedClients(
  managerBitrixId: string | null,
  opts: { days?: number; maxCheck?: number } = {}
): Promise<AbandonedClient[]> {
  const days = opts.days ?? 3;
  const maxCheck = opts.maxCheck ?? 12;
  const origin = bitrixPortalOrigin();

  const cands = await unresolvedNoContact(managerBitrixId, days);
  const limited = cands.slice(0, maxCheck);

  // Параллельно проверяем активность в Bitrix только у сделок (у номеров без
  // сделки проверить нечего — считаем брошенным, но помечаем отсутствие сделки).
  const checks = await Promise.all(
    limited.map(async (r) => {
      if (r.bitrix_deal_id && r.started_at) {
        const busy = await dealHasActivitySince(r.bitrix_deal_id, r.started_at.toISOString());
        return busy ? null : r;
      }
      return r; // нет сделки — Bitrix не проверить
    })
  );

  return checks
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((r) => ({
      callId: r.call_id,
      bitrixDealId: r.bitrix_deal_id,
      phone: r.phone_number,
      clientTitle: r.client_title,
      manager: r.manager,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
    }));
}
