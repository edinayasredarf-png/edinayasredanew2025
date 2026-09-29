// zod/v4 — совместимо с zodOutputFormat (Claude) и JSON-промптом (self-hosted).
import * as z from "zod/v4";

export const CONTENT_OS_DRAFT_VERSION = "content-os-draft-v1";

export const ContentOsDraftSchema = z.object({
  title: z.string().catch(""),
  body: z.string().catch(""),
});
export type ContentOsDraft = z.infer<typeof ContentOsDraftSchema>;

export const QcResultSchema = z.object({
  status: z.enum(["PASS", "REVIEW", "FAIL"]).catch("REVIEW"),
  notes: z.string().catch(""),
});
export type QcResult = z.infer<typeof QcResultSchema>;

export const TopicAnalysisSchema = z.object({
  relevance: z.number().int().min(1).max(10).catch(5),
  popularity: z.number().int().min(1).max(100).catch(50),
  angle: z.string().catch(""),
});
export type TopicAnalysis = z.infer<typeof TopicAnalysisSchema>;

export const ResearchSummarySchema = z.object({
  summary: z.string().catch(""),
});
export type ResearchSummary = z.infer<typeof ResearchSummarySchema>;
