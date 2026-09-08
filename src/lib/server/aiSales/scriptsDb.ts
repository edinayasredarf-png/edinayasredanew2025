import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Скрипты продаж (§18 ТЗ): хранятся в БД, версионируются, у каждого отдела свой
 * (department_id=NULL — общий скрипт по умолчанию). Оценка соблюдения скрипта по
 * звонку — отдельным анализатором (scriptScoreService), результат в ai_call_script_scores.
 */

export interface ScriptStep {
  key: string;
  title: string;
}

export interface SalesScript {
  id: string;
  departmentId: string | null;
  departmentName: string | null;
  name: string;
  version: number;
  steps: ScriptStep[];
  isActive: boolean;
}

function normSteps(raw: unknown): ScriptStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s, i) => {
      const o = (s || {}) as { key?: string; title?: string };
      const title = (o.title || "").trim();
      const key = (o.key || "").trim() || slugifyStep(title, i);
      return title ? { key, title } : null;
    })
    .filter((s): s is ScriptStep => !!s);
}

function slugifyStep(title: string, i: number): string {
  const base = title.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  return base || `step_${i + 1}`;
}

/** Все скрипты (для раздела «Скрипт»), с названием отдела. */
export async function listScripts(): Promise<SalesScript[]> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    id: string; department_id: string | null; department_name: string | null;
    name: string; version: number; steps: unknown; is_active: boolean;
  }>(
    `select s.id, s.department_id, d.name as department_name, s.name, s.version, s.steps, s.is_active
       from ai_sales_scripts s
       left join ai_departments d on d.id = s.department_id
      where s.is_active
      order by (s.department_id is null) desc, d.sort asc nulls first, d.name asc`
  );
  return rows.map((r) => ({
    id: r.id,
    departmentId: r.department_id,
    departmentName: r.department_name,
    name: r.name,
    version: r.version,
    steps: normSteps(r.steps),
    isActive: r.is_active,
  }));
}

/** Активный скрипт для отдела (или общий, если у отдела своего нет). */
export async function getActiveScriptForDepartment(
  departmentId: string | null
): Promise<SalesScript | null> {
  const pool = getTimewebPool();
  try {
    const { rows } = await pool.query<{
      id: string; department_id: string | null; name: string; version: number; steps: unknown;
    }>(
      `select id, department_id, name, version, steps
         from ai_sales_scripts
        where is_active and (department_id = $1 or department_id is null)
        order by (department_id = $1) desc nulls last
        limit 1`,
      [departmentId]
    );
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id, departmentId: r.department_id, departmentName: null,
      name: r.name, version: r.version, steps: normSteps(r.steps), isActive: true,
    };
  } catch {
    // Миграция ещё не применена — скоринг скрипта просто пропускаем.
    return null;
  }
}

/** Создать скрипт для отдела (или общий, departmentId=null). */
export async function createScript(departmentId: string | null, name: string): Promise<string> {
  const pool = getTimewebPool();
  // Существующий активный для этого scope — деактивируем (частичный uniq-индекс).
  await pool.query(
    `update ai_sales_scripts set is_active = false, updated_at = now()
      where is_active and department_id is not distinct from $1`,
    [departmentId]
  );
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_sales_scripts (department_id, name, version, is_active, steps)
     values ($1, $2, 1, true, '[]'::jsonb) returning id`,
    [departmentId, name.trim() || "Скрипт продаж"]
  );
  return rows[0].id;
}

/** Обновить скрипт: имя и/или шаги. Изменение шагов повышает версию. */
export async function updateScript(
  id: string,
  patch: { name?: string; steps?: ScriptStep[] }
): Promise<void> {
  const pool = getTimewebPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (typeof patch.name === "string") { sets.push(`name = $${i++}`); params.push(patch.name.trim() || "Скрипт продаж"); }
  if (Array.isArray(patch.steps)) {
    sets.push(`steps = $${i++}::jsonb`);
    params.push(JSON.stringify(normSteps(patch.steps)));
    sets.push(`version = version + 1`);
  }
  if (!sets.length) return;
  params.push(id);
  await pool.query(
    `update ai_sales_scripts set ${sets.join(", ")}, updated_at = now() where id = $${i}`,
    params
  );
}

/** Сохранить результат оценки соблюдения скрипта по звонку. */
export async function saveScriptScore(input: {
  callId: string;
  scriptId: string | null;
  scriptVersion: number | null;
  score: number | null;
  steps: Array<{ key: string; title: string; completed: boolean; reason: string | null }>;
  model: string;
  promptVersion: string;
  inputHash: string;
}): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `insert into ai_call_script_scores
       (call_id, script_id, script_version, score, steps, model, prompt_version, input_hash)
     values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
     on conflict (call_id, input_hash) do nothing`,
    [
      input.callId, input.scriptId, input.scriptVersion, input.score,
      JSON.stringify(input.steps), input.model, input.promptVersion, input.inputHash,
    ]
  );
}

export interface CallScriptScore {
  scriptVersion: number | null;
  score: number | null;
  steps: Array<{ key: string; title: string; completed: boolean; reason: string | null }>;
}

/** Последняя оценка скрипта по звонку (для карточки). */
export async function getScriptScore(callId: string): Promise<CallScriptScore | null> {
  const pool = getTimewebPool();
  try {
    const { rows } = await pool.query<{ script_version: number | null; score: number | null; steps: unknown }>(
      `select script_version, score, steps from ai_call_script_scores
        where call_id = $1 order by created_at desc limit 1`,
      [callId]
    );
    const r = rows[0];
    if (!r) return null;
    const steps = Array.isArray(r.steps)
      ? (r.steps as Array<{ key?: string; title?: string; completed?: boolean; reason?: string | null }>).map((s) => ({
          key: s.key || "",
          title: s.title || "",
          completed: !!s.completed,
          reason: s.reason ?? null,
        }))
      : [];
    return { scriptVersion: r.script_version, score: r.score, steps };
  } catch {
    return null;
  }
}

/** Проверка, что таблица есть (для script-scoring без падений). */
export async function scriptScoreExists(callId: string, inputHash: string): Promise<boolean> {
  const pool = getTimewebPool();
  try {
    const { rowCount } = await pool.query(
      `select 1 from ai_call_script_scores where call_id = $1 and input_hash = $2`,
      [callId, inputHash]
    );
    return (rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}
