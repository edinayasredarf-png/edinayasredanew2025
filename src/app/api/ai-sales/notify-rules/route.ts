import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { setSetting } from "@/lib/server/aiSales/settingsDb";
import { loadNotifyRules, previewRule } from "@/lib/server/aiSales/notifyService";
import { BLOCKS, type NotifyRule } from "@/lib/notifyBlocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function auth(request: NextRequest) {
  try {
    return await requireRopAccess(request);
  } catch (e) {
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status: (e as { status?: number }).status ?? 401 });
  }
}

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter((x) => /^\d+$/.test(x)) : []);
const numOrNull = (v: unknown): number | null => (v === null || v === "" || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

function clean(raw: unknown): NotifyRule | null {
  const r = raw as Partial<NotifyRule> & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!r || (r.source !== "call" && r.source !== "deal")) return null;
  const allowed = new Set(BLOCKS[r.source].map((b) => b.key));
  const c = r.conditions ?? ({} as NotifyRule["conditions"]);
  return {
    id: String(r.id || `rule-${Date.now().toString(36)}`).slice(0, 60),
    name: String(r.name || "Правило").slice(0, 120),
    enabled: r.enabled !== false,
    source: r.source,
    recipients: { owner: r.recipients?.owner !== false, managerIds: ids(r.recipients?.managerIds), rop: Boolean(r.recipients?.rop) },
    onlyManagers: Array.isArray(r.onlyManagers) && r.onlyManagers.length ? ids(r.onlyManagers) : null,
    blocks: (Array.isArray(r.blocks) ? r.blocks : []).map(String).filter((k) => allowed.has(k)),
    conditions: {
      maxAgeHours: Math.min(720, Math.max(1, Number(c.maxAgeHours) || 48)),
      temperatures: (Array.isArray(c.temperatures) ? c.temperatures : []).filter((t: string) => ["HOT", "WARM", "COLD"].includes(t)),
      managerScoreBelow: numOrNull(c.managerScoreBelow),
      dealScoreAtLeast: numOrNull(c.dealScoreAtLeast),
      onlyConnected: c.onlyConnected !== false,
      skipTechnical: c.skipTechnical !== false,
    },
  };
}

export async function GET(request: NextRequest) {
  const a = await auth(request);
  if (a instanceof NextResponse) return a;
  try {
    return NextResponse.json({ rules: await loadNotifyRules() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 500 });
  }
}

/** Сохранить правила целиком: { rules: [...] }. Либо предпросмотр текста: { preview: rule }. */
export async function PUT(request: NextRequest) {
  const a = await auth(request);
  if (a instanceof NextResponse) return a;
  let body: { rules?: unknown[]; preview?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Некорректное тело" }, { status: 400 }); }
  try {
    if (body.preview) {
      const rule = clean(body.preview);
      if (!rule) return NextResponse.json({ error: "Некорректное правило" }, { status: 400 });
      return NextResponse.json(await previewRule(rule));
    }
    const rules = (body.rules ?? []).map(clean).filter((r): r is NotifyRule => Boolean(r)).slice(0, 30);
    await setSetting("notify.rules", rules, a.id);
    return NextResponse.json({ ok: true, rules });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 500 });
  }
}
