import "server-only";

import type { SalesUser } from "@/lib/server/authFromBearer";

/**
 * Фильтр «менеджер видит только свои звонки» (§57-58 ТЗ).
 * admin/rop/analyst → null (весь отдел). manager → его bitrixUserId; если связка
 * user_profile ↔ ai_managers ещё не установлена (bitrixUserId нет) — возвращаем
 * '__none__', чтобы менеджер НЕ видел чужие данные, пока связка не настроена.
 *
 * TODO (Этап 2): установить ai_managers.user_profile_id и заполнять
 * SalesUser.bitrixUserId, чтобы менеджеры видели свои звонки.
 */
export function managerFilterFor(user: SalesUser): string | null {
  if (user.role === "manager") return user.bitrixUserId ?? "__none__";
  return null;
}
