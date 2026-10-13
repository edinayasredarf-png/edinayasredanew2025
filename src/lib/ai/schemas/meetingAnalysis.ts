// zod/v4 — совместимо с zodOutputFormat (Claude) и safeParse (шлюз/YandexGPT). Схемы толерантные: битые поля не роняют результат.
import * as z from "zod/v4";

const str = z.string().catch("");
const strArr = z.array(z.string()).catch([]);

export const MeetingSpeakersSchema = z.object({
  speakers: z.array(z.object({
    label: str,
    role: z.enum(["EMPLOYEE", "CLIENT", "UNKNOWN"]).catch("UNKNOWN"),
    name: z.string().nullable().catch(null),
  }).catch({ label: "", role: "UNKNOWN", name: null })).catch([]),
});

export const MeetingTypePickSchema = z.object({ typeId: z.string().nullable().catch(null) });

export const MeetingChunkSchema = z.object({
  summary: str,
  decisions: strArr,
  actionItems: z.array(z.object({ who: z.string().nullable().catch(null), what: str, due: z.string().nullable().catch(null) }).catch({ who: null, what: "", due: null })).catch([]),
  notes: strArr,
});

export const MeetingAnalysisSchema = z.object({
  summary: str,
  topics: strArr,
  decisions: strArr,
  actionItems: z.array(z.object({ who: z.string().nullable().catch(null), what: str, due: z.string().nullable().catch(null) }).catch({ who: null, what: "", due: null })).catch([]),
  needs: strArr,
  objections: z.array(z.object({ text: str, handled: z.boolean().nullable().catch(null) }).catch({ text: "", handled: null })).catch([]),
  risks: strArr,
  nextSteps: strArr,
  sentiment: z.enum(["positive", "neutral", "negative"]).nullable().catch(null),
  employeeFeedback: z.object({ didWell: strArr, improve: strArr }).catch({ didWell: [], improve: [] }),
  script: z.object({
    steps: z.array(z.object({ key: str, completed: z.boolean().nullable().catch(null), evidence: z.string().nullable().catch(null) }).catch({ key: "", completed: null, evidence: null })).catch([]),
  }).catch({ steps: [] }),
});

export type MeetingAnalysis = z.infer<typeof MeetingAnalysisSchema>;
export type MeetingChunk = z.infer<typeof MeetingChunkSchema>;
