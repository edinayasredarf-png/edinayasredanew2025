// zod/v4 — совместимо с zodOutputFormat (Claude) и JSON-промптом (self-hosted).
import * as z from "zod/v4";

export const CONTENT_OS_DRAFT_VERSION = "content-os-draft-v1";

export const ContentOsDraftSchema = z.object({
  title: z.string().catch(""),
  body: z.string().catch(""),
});

export type ContentOsDraft = z.infer<typeof ContentOsDraftSchema>;
