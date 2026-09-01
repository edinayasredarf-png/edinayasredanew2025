import "server-only";

import { getAiProvider } from "@/lib/ai";
import { RoleSplitSchema } from "@/lib/ai/schemas/roleSplit";
import {
  ROLE_SPLIT_SYSTEM,
  buildRoleSplitUser,
} from "@/lib/ai/prompts/roleSplit";
import { getTranscript, updateSegmentRoles } from "@/lib/server/aiSales/callsDb";

/**
 * Разметка ролей Менеджер/Клиент по репликам транскрипта через LLM (§43 ТЗ).
 * Обновляет ai_transcript_segments.role. Идёт между транскрипцией и анализом,
 * поэтому анализ уже получает диалог с ролями (точнее оценивает менеджера).
 */
export async function runRoleSplit(callId: string): Promise<unknown> {
  const t = await getTranscript(callId);
  if (!t || !t.segments.length) return { skipped: "no transcript" };

  const provider = getAiProvider();
  const { data } = await provider.generateStructured({
    schema: RoleSplitSchema,
    system: ROLE_SPLIT_SYSTEM,
    user: buildRoleSplitUser(t.segments.map((s) => ({ idx: s.idx, text: s.text }))),
    maxTokens: 4000,
  });

  // Применяем только валидные и определённые роли (MANAGER/CLIENT).
  const valid = new Set(t.segments.map((s) => s.idx));
  const roles = data.roles
    .filter((r) => valid.has(r.idx) && (r.role === "MANAGER" || r.role === "CLIENT"))
    .map((r) => ({ idx: r.idx, role: r.role }));

  await updateSegmentRoles(t.id, roles);
  return { updated: roles.length, ofSegments: t.segments.length };
}
