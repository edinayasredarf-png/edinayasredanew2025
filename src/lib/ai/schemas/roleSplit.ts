// zod/v4 — совместимо с zodOutputFormat (Claude) и safeParse (YandexGPT).
import * as z from "zod/v4";

/**
 * Разметка ролей реплик транскрипта (§43 ТЗ). Толерантная схема: битые записи
 * не роняют результат. LLM возвращает роль на каждый idx сегмента.
 */
export const ROLE_SPLIT_VERSION = "role-split-v1";

export const RoleSplitSchema = z.object({
  roles: z
    .array(
      z
        .object({
          idx: z.number().int().catch(-1),
          role: z.enum(["MANAGER", "CLIENT", "UNKNOWN"]).catch("UNKNOWN"),
        })
        .catch({ idx: -1, role: "UNKNOWN" })
    )
    .catch([]),
});

export type RoleSplit = z.infer<typeof RoleSplitSchema>;
