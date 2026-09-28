// zod/v4 — совместимо с zodOutputFormat (Claude) и safeParse (YandexGPT).
import * as z from "zod/v4";

/** Генерация одной платформенной версии поста контент-завода. */
export const CONTENT_FACTORY_GENERATION_VERSION = "content-factory-gen-v1";

export const ContentFactoryGenerationSchema = z.object({
  body: z.string().catch(""),
  hashtags: z.array(z.string()).catch([]),
});

export type ContentFactoryGeneration = z.infer<typeof ContentFactoryGenerationSchema>;
