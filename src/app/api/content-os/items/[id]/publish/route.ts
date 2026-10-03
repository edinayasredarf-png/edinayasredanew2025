import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { publishContentItem } from "@/lib/server/contentOsPublish";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import type { ContentOsChannel } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const status = msg.includes("не найден") ? 404 : fallback;
  return NextResponse.json({ error: msg }, { status });
}

/** Реальная публикация материала в VK/Telegram (§29 ТЗ). См. contentOsPublish.ts. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const channel = body?.channel as ContentOsChannel | undefined;
  if (!channel) return NextResponse.json({ error: "channel обязателен" }, { status: 400 });

  try {
    const result = await publishContentItem(id, channel, getActiveCompanyId(request));
    return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
  } catch (e) {
    return jsonErr(e);
  }
}
