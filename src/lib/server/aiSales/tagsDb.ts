import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import type { CallAnalysis } from "@/lib/ai/schemas/callAnalysis";

/**
 * AI-теги (§25 ТЗ). Анализ выдаёт tags вида "category:value" (sales:hot_lead,
 * product:greenery, risk:no_budget). Сохраняем в ai_tags (справочник) + ai_call_tags
 * (связь со звонком). Категория — префикс до двоеточия.
 */

const CATEGORY_LABEL: Record<string, string> = {
  client: "Клиент", product: "Продукт", sales: "Продажи", risk: "Риск", custom: "Свои",
};

function parseSlug(slug: string): { category: string; label: string } | null {
  const idx = slug.indexOf(":");
  if (idx <= 0) return null;
  const category = slug.slice(0, idx).trim().toLowerCase();
  const value = slug.slice(idx + 1).trim();
  if (!value) return null;
  return { category, label: value.replace(/_/g, " ") };
}

/** Сохранить теги звонка (заменяя прежние). Апсертит справочник ai_tags. */
export async function saveCallTags(callId: string, data: CallAnalysis): Promise<number> {
  const tags = (data.tags || []).filter((t) => typeof t.slug === "string" && t.slug.includes(":"));
  const pool = getTimewebPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`delete from ai_call_tags where call_id = $1`, [callId]);
    let n = 0;
    for (const t of tags) {
      const parsed = parseSlug(t.slug);
      if (!parsed) continue;
      const { rows } = await client.query<{ id: string }>(
        `insert into ai_tags (slug, category, label, is_system)
         values ($1,$2,$3,true)
         on conflict (slug) do update set label = excluded.label
         returning id`,
        [t.slug, parsed.category, parsed.label]
      );
      await client.query(
        `insert into ai_call_tags (call_id, tag_id, source, confidence)
         values ($1,$2,'ai',$3)
         on conflict (call_id, tag_id) do update set confidence = excluded.confidence`,
        [callId, rows[0].id, t.confidence ?? null]
      );
      n++;
    }
    await client.query("commit");
    return n;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export interface TagStat {
  slug: string;
  category: string;
  categoryLabel: string;
  label: string;
  count: number;
}

export async function listTags(f: {
  managerBitrixId?: string | null;
  from?: string | null;
  to?: string | null;
}): Promise<{ groups: Array<{ category: string; categoryLabel: string; tags: TagStat[] }>; total: number }> {
  const pool = getTimewebPool();
  const where: string[] = ["true"];
  const params: unknown[] = [];
  let i = 1;
  if (f.managerBitrixId) { where.push(`c.bitrix_user_id = $${i++}`); params.push(f.managerBitrixId); }
  if (f.from) { where.push(`c.started_at >= $${i++}::date`); params.push(f.from); }
  if (f.to) { where.push(`c.started_at < ($${i++}::date + interval '1 day')`); params.push(f.to); }

  const { rows } = await pool.query<{ slug: string; category: string; label: string; n: string }>(
    `select t.slug, t.category, t.label, count(*)::text n
       from ai_call_tags ct
       join ai_tags t on t.id = ct.tag_id
       join ai_calls c on c.id = ct.call_id
      where ${where.join(" and ")}
      group by t.slug, t.category, t.label
      order by count(*) desc`,
    params
  );

  const byCat = new Map<string, TagStat[]>();
  let total = 0;
  for (const r of rows) {
    const stat: TagStat = {
      slug: r.slug,
      category: r.category,
      categoryLabel: CATEGORY_LABEL[r.category] || r.category,
      label: r.label,
      count: Number(r.n),
    };
    total += stat.count;
    const arr = byCat.get(r.category) ?? [];
    arr.push(stat);
    byCat.set(r.category, arr);
  }

  const order = ["sales", "product", "risk", "client", "custom"];
  const groups = [...byCat.entries()]
    .sort((a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99))
    .map(([category, tags]) => ({ category, categoryLabel: CATEGORY_LABEL[category] || category, tags }));

  return { groups, total };
}

export { CATEGORY_LABEL };
