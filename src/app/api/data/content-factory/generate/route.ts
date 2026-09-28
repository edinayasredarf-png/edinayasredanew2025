import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetBrandSettings, dbListPlatforms } from "@/lib/server/contentFactoryDb";
import { getAiProvider } from "@/lib/ai";
import { ContentFactoryGenerationSchema } from "@/lib/ai/schemas/contentFactory";
import { buildContentFactorySystemPrompt, buildContentFactoryUserPrompt } from "@/lib/ai/prompts/contentFactory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface GenerateBody {
  topicTitle?: string;
  thesis?: string;
  sourceName?: string;
  sourceUrl?: string;
  useSource?: boolean;
  type?: "post" | "article" | "reel" | "digest";
  audience?: string;
  requirements?: string;
  emoji?: "auto" | "0" | "1" | "2" | "3";
  platformId?: string;
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

  if (!body.topicTitle?.trim()) {
    return NextResponse.json({ error: "Укажите тему" }, { status: 400 });
  }
  if (!body.platformId) {
    return NextResponse.json({ error: "Укажите платформу" }, { status: 400 });
  }

  const platforms = await dbListPlatforms();
  const platform = platforms.find((p) => p.id === body.platformId);
  if (!platform) {
    return NextResponse.json({ error: "Платформа не найдена" }, { status: 404 });
  }

  const brand = await dbGetBrandSettings();

  try {
    const provider = await getAiProvider();
    const system = buildContentFactorySystemPrompt(platform, brand);
    const user = buildContentFactoryUserPrompt({
      topicTitle: body.topicTitle,
      thesis: body.thesis,
      sourceName: body.sourceName,
      sourceUrl: body.sourceUrl,
      useSource: body.useSource ?? false,
      type: body.type ?? "post",
      audience: body.audience ?? "Руководители МСУ",
      requirements: body.requirements,
      emoji: body.emoji ?? "auto",
    });

    const result = await provider.generateStructured({
      schema: ContentFactoryGenerationSchema,
      system,
      user,
      maxTokens: 4000,
    });

    return NextResponse.json({ body: result.data.body, hashtags: result.data.hashtags, model: result.model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    const isConfig = e instanceof Error && e.name === "AiProviderNotConfiguredError";
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
