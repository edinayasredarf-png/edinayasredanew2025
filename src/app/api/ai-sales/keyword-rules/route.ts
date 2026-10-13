import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { setSetting } from "@/lib/server/aiSales/settingsDb";
import { loadKeywordRules, scanCallKeywords } from "@/lib/server/aiSales/keywordService";
import { getTimewebPool } from "@/lib/timewebPg";
import type { KeywordRule } from "@/lib/keywordRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function auth(request: NextRequest) {
  try {
    return await requireRopAccess(request);
  } catch (e) {
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status: (e as { status?: number }).status ?? 401 });
  }
}

function clean(raw: unknown): KeywordRule | null {
  const r = raw as Partial<KeywordRule>;
  if (!r || typeof r !== "object") return null;
  const phrases = (Array.isArray(r.phrases) ? r.phrases : []).map((p) => String(p).trim()).filter(Boolean).slice(0, 200);
  return {
    id: String(r.id || `kw-${Date.now().toString(36)}`).slice(0, 60),
    name: String(r.name || "Правило").slice(0, 120),
    enabled: r.enabled !== false,
    phrases,
    speaker: r.speaker === "client" ? "client" : "any",
    severity: r.severity === "risk" || r.severity === "opportunity" ? r.severity : "critical",
    notifyRop: r.notifyRop !== false,
    notifyOwner: r.notifyOwner !== false,
    maxAgeHours: Math.min(720, Math.max(1, Number(r.maxAgeHours) || 72)),
    action: String(r.action || "").slice(0, 400),
  };
}

export async function GET(request: NextRequest) {
  const a = await auth(request);
  if (a instanceof NextResponse) return a;
  return NextResponse.json({ rules: await loadKeywordRules() });
}

export async function PUT(request: NextRequest) {
  const a = await auth(request);
  if (a instanceof NextResponse) return a;
  let body: { rules?: unknown[] };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Некорректное тело" }, { status: 400 }); }
  const rules = (body.rules ?? []).map(clean).filter((r): r is KeywordRule => Boolean(r)).slice(0, 30);
  await setSetting("keywords.rules", rules, a.id);
  return NextResponse.json({ ok: true, rules });
}

/** Проверить уже расшифрованные звонки за N дней (совпадения попадут в «Сигналы»; рассылка — только по свежим). */
export async function POST(request: NextRequest) {
  const a = await auth(request);
  if (a instanceof NextResponse) return a;
  const body = (await request.json().catch(() => ({}))) as { days?: number };
  const days = Math.min(30, Math.max(1, Number(body.days) || 7));
  const { rows } = await getTimewebPool().query<{ id: string }>(
    `select c.id from ai_calls c where c.started_at >= now() - ($1 || ' days')::interval
        and exists (select 1 from ai_transcripts t where t.call_id = c.id) order by c.started_at desc limit 500`,
    [String(days)]
  );
  const t0 = Date.now();
  let scanned = 0, hits = 0;
  for (const r of rows) {
    if (Date.now() - t0 > 45_000) break;
    const res = await scanCallKeywords(r.id).catch(() => null);
    scanned++;
    if (Array.isArray(res)) hits += res.length;
  }
  return NextResponse.json({ ok: true, total: rows.length, scanned, hits });
}
