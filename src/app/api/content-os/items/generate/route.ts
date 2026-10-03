import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { generateChannelDraft } from "@/lib/server/contentOsGenerate";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import type { ContentOsChannel } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface GenerateBody {
  clusterId?: string;
  channel?: ContentOsChannel;
  topicTitle?: string;
  thesis?: string;
  audience?: string;
  angle?: string;
  requirements?: string;
  contentItemId?: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!body.topicTitle?.trim()) return NextResponse.json({ error: "Укажите тему" }, { status: 400 });
  if (!body.channel) return NextResponse.json({ error: "Укажите канал" }, { status: 400 });
  if (!body.clusterId) return NextResponse.json({ error: "Укажите кластер" }, { status: 400 });

  try {
    const result = await generateChannelDraft({
      companyId: getActiveCompanyId(request),
      clusterId: body.clusterId,
      channel: body.channel,
      topicTitle: body.topicTitle,
      thesis: body.thesis,
      audience: body.audience,
      angle: body.angle,
      requirements: body.requirements,
      contentItemId: body.contentItemId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    const isConfig = e instanceof Error && e.name === "AiProviderNotConfiguredError";
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
