import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Отделы компании (продажи, производство, юридический, сервис …). У каждого —
 * свой промт анализа звонка для YandexGPT и свой состав менеджеров.
 * Схема public, таблицы ai_departments + ai_managers.department_id.
 */

export interface DepartmentRow {
  id: string;
  name: string;
  slug: string | null;
  analysisPrompt: string | null;
  sort: number;
  managerCount: number;
}

export interface DepartmentManager {
  bitrixUserId: string;
  name: string | null;
  departmentId: string | null;
  active: boolean;
}

/** Список отделов с числом сотрудников. */
export async function listDepartments(): Promise<DepartmentRow[]> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    id: string; name: string; slug: string | null; analysis_prompt: string | null; sort: number; n: string;
  }>(
    `select d.id, d.name, d.slug, d.analysis_prompt, d.sort,
            (select count(*) from ai_managers m where m.department_id = d.id)::text as n
       from ai_departments d
      order by d.sort asc, d.name asc`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    analysisPrompt: r.analysis_prompt,
    sort: r.sort,
    managerCount: Number(r.n),
  }));
}

/** Все известные менеджеры (для распределения по отделам). */
export async function listDepartmentManagers(): Promise<DepartmentManager[]> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    bitrix_user_id: string; full_name: string | null; department_id: string | null; active: boolean;
  }>(
    `select bitrix_user_id, full_name, department_id, active
       from ai_managers
      order by full_name asc nulls last`
  );
  return rows.map((r) => ({
    bitrixUserId: r.bitrix_user_id,
    name: r.full_name,
    departmentId: r.department_id,
    active: r.active,
  }));
}

/** Создать отдел. */
export async function createDepartment(name: string): Promise<string> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_departments (name, sort)
     values ($1, coalesce((select max(sort) + 10 from ai_departments), 100))
     returning id`,
    [name.trim()]
  );
  return rows[0].id;
}

/** Переименовать отдел и/или изменить порядок. */
export async function updateDepartment(
  id: string,
  patch: { name?: string; sort?: number }
): Promise<void> {
  const pool = getTimewebPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (typeof patch.name === "string") { sets.push(`name = $${i++}`); params.push(patch.name.trim()); }
  if (typeof patch.sort === "number") { sets.push(`sort = $${i++}`); params.push(patch.sort); }
  if (!sets.length) return;
  params.push(id);
  await pool.query(
    `update ai_departments set ${sets.join(", ")}, updated_at = now() where id = $${i}`,
    params
  );
}

/** Задать (или очистить) промт анализа для отдела. */
export async function setDepartmentPrompt(id: string, prompt: string | null): Promise<void> {
  const pool = getTimewebPool();
  const value = prompt && prompt.trim() ? prompt.trim() : null;
  await pool.query(
    `update ai_departments set analysis_prompt = $2, updated_at = now() where id = $1`,
    [id, value]
  );
}

/** Удалить отдел (сотрудники открепляются автоматически, FK ON DELETE SET NULL). */
export async function deleteDepartment(id: string): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`delete from ai_departments where id = $1`, [id]);
}

/** Привязать менеджера к отделу (departmentId=null — открепить). */
export async function setManagerDepartment(
  bitrixUserId: string,
  departmentId: string | null
): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `update ai_managers set department_id = $2, updated_at = now() where bitrix_user_id = $1`,
    [bitrixUserId, departmentId]
  );
}

/** Промт анализа для отдела менеджера (для analysisService). */
export async function getDepartmentPromptForManager(
  bitrixUserId: string | null
): Promise<{ departmentId: string; departmentName: string; analysisPrompt: string | null } | null> {
  if (!bitrixUserId) return null;
  const pool = getTimewebPool();
  try {
    const { rows } = await pool.query<{ id: string; name: string; analysis_prompt: string | null }>(
      `select d.id, d.name, d.analysis_prompt
         from ai_managers m
         join ai_departments d on d.id = m.department_id
        where m.bitrix_user_id = $1`,
      [bitrixUserId]
    );
    if (!rows[0]) return null;
    return {
      departmentId: rows[0].id,
      departmentName: rows[0].name,
      analysisPrompt: rows[0].analysis_prompt,
    };
  } catch {
    // Миграция ai_departments ещё не применена — работаем на дефолтном промте.
    return null;
  }
}

/** Лёгкий список отделов для выпадающего фильтра. */
export async function listDepartmentOptions(): Promise<Array<{ id: string; name: string }>> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ id: string; name: string }>(
    `select id, name from ai_departments order by sort asc, name asc`
  );
  return rows;
}
