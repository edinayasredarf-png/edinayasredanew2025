import "server-only";

import * as z from "zod/v4";
import { getAiProvider } from "@/lib/ai";
import { RoleSplitSchema } from "@/lib/ai/schemas/roleSplit";
import { ROLE_SPLIT_SYSTEM, buildRoleSplitUser } from "@/lib/ai/prompts/roleSplit";
import { getTranscript, updateSegmentRoles } from "@/lib/server/aiSales/callsDb";

/**
 * Разметка ролей Менеджер/Клиент (§43 ТЗ).
 *
 * ГЛАВНЫЙ путь — ПО ГОВОРЯЩЕМУ (когда есть диаризация speaker_label): один раз
 * определяем, кто из говорящих менеджер, и всю его речь помечаем MANAGER, другого —
 * CLIENT. Так роль не «скачет» по репликам и монологи не рвутся. Менеджера ищем
 * эвристикой (представляется: имя + «Единая среда»/«Экострой», предлагает услуги/
 * коммерческое), при неоднозначности — спрашиваем LLM один раз.
 *
 * ЗАПАСНОЙ путь (нет меток говорящих) — старая LLM-разметка по каждой реплике.
 */

// Маркеры менеджера «Единой среды»/«Экостроя».
const MANAGER_RE =
  /едина\p{L}*\s*сред|экострой|эко-строй|меня\s+зовут|коммерческ|предлага\p{L}*\s+услуг|по\s+поводу\s+инвентариз|инвентаризац|оцифров|цифров\p{L}*\s+двойник|отправля\p{L}*\s+коммерч|обсчит|по\s+вопросу\s+инвентар|зелён\p{L}*\s+насажд|зелен\p{L}*\s+насажд/iu;
// Маркеры клиента (принимающая сторона).
const CLIENT_RE =
  /кто\s+спрашивает|слушаю\s+вас|администрац|детский\s+сад|мбоу|мкоу|мбдоу|учреждени|земельн\p{L}*\s+отдел|отдел\s+закупок|поселени/iu;

const ManagerDecisionSchema = z.object({ manager: z.string().catch("") });

const MANAGER_DECIDE_SYSTEM = `Определи, кто из говорящих — МЕНЕДЖЕР компании «Единая среда» (она же «Экострой»): цифровизация территорий — инвентаризация зелёных насаждений, кладбищ, ЖКХ, цифровые двойники.
Менеджер ЗВОНИТ: представляется по имени и называет компанию «Единая среда»/«Экострой», предлагает услугу, отправлял коммерческое, спрашивает про бюджет/сроки/потребность.
Клиент — принимающая сторона (администрация, УК, детсад, отдел и т.п.): отвечает, уточняет цену/сроки, представляет свою организацию.
Тебе дадут реплики каждого говорящего с его меткой. Верни СТРОГО JSON {"manager":"<метка говорящего-менеджера>"} — ровно одну метку из предложенных.`;

/** Выбрать ключ с максимальным значением. */
function argMax(scores: Map<string, number>): string | null {
  let best: string | null = null;
  let bestV = -Infinity;
  for (const [k, v] of scores) if (v > bestV) { bestV = v; best = k; }
  return best;
}

export async function runRoleSplit(callId: string): Promise<unknown> {
  const t = await getTranscript(callId);
  if (!t || !t.segments.length) return { skipped: "no transcript" };

  const speakers = [...new Set(t.segments.map((s) => s.speakerLabel).filter(Boolean))] as string[];

  // Нет диаризации на 2+ говорящих — запасной путь (LLM по каждой реплике).
  if (speakers.length < 2) return legacyPerSegment(t);

  // Эвристика: скорим каждого говорящего на «менеджерские»/«клиентские» маркеры.
  const score = new Map<string, number>();
  for (const s of speakers) score.set(s, 0);
  for (const s of t.segments) {
    if (!s.speakerLabel) continue;
    const txt = s.text || "";
    let d = 0;
    if (MANAGER_RE.test(txt)) d += 2;
    if (CLIENT_RE.test(txt)) d -= 1;
    if (d) score.set(s.speakerLabel, (score.get(s.speakerLabel) ?? 0) + d);
  }

  let manager = argMax(score);
  const sorted = [...score.values()].sort((a, b) => b - a);
  const ambiguous = sorted.length < 2 || sorted[0] <= 0 || sorted[0] - sorted[1] < 2;

  // Неоднозначно — спрашиваем LLM один раз (простой вопрос, справляется и YandexGPT).
  if (ambiguous) {
    try {
      const samples = speakers
        .map((spk) => {
          const lines = t.segments.filter((s) => s.speakerLabel === spk).slice(0, 8).map((s) => s.text).join(" ");
          return `Говорящий ${spk}:\n${lines.slice(0, 900)}`;
        })
        .join("\n\n");
      const provider = await getAiProvider();
      const { data } = await provider.generateStructured({
        schema: ManagerDecisionSchema,
        system: MANAGER_DECIDE_SYSTEM,
        user: samples,
        maxTokens: 200,
      });
      if (data.manager && speakers.includes(data.manager)) manager = data.manager;
    } catch {
      /* остаётся эвристический выбор */
    }
  }

  if (!manager) return { skipped: "no manager decided" };

  const roles = t.segments
    .filter((s) => s.speakerLabel)
    .map((s) => ({ idx: s.idx, role: s.speakerLabel === manager ? "MANAGER" : "CLIENT" }));
  await updateSegmentRoles(t.id, roles);
  return { manager, updated: roles.length, method: ambiguous ? "llm" : "heuristic", speakers };
}

/** Запасной путь: разметка ролей LLM по каждой реплике (когда нет диаризации). */
async function legacyPerSegment(t: NonNullable<Awaited<ReturnType<typeof getTranscript>>>): Promise<unknown> {
  const provider = await getAiProvider();
  const { data } = await provider.generateStructured({
    schema: RoleSplitSchema,
    system: ROLE_SPLIT_SYSTEM,
    user: buildRoleSplitUser(t.segments.map((s) => ({ idx: s.idx, text: s.text }))),
    maxTokens: 4000,
  });
  const valid = new Set(t.segments.map((s) => s.idx));
  const roles = data.roles
    .filter((r) => valid.has(r.idx) && (r.role === "MANAGER" || r.role === "CLIENT"))
    .map((r) => ({ idx: r.idx, role: r.role }));
  await updateSegmentRoles(t.id, roles);
  return { updated: roles.length, ofSegments: t.segments.length, method: "per-segment" };
}
