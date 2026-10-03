import "server-only";

import type { NextRequest } from "next/server";
import { DEFAULT_COMPANY_ID } from "@/lib/contentOsTypes";

/**
 * Активная компания — передаётся не параметром в каждом fetch (это
 * потребовало бы менять сигнатуру всех ~20 функций contentOsStore.ts и
 * каждый вызов в 13 вкладках), а cookie, которую ставит свитчер в шапке
 * ContentOs.tsx. apiFetch() уже шлёт credentials: "include" — cookie едет
 * автоматически на каждый запрос. Если cookie нет/невалидна — дефолтная
 * компания, не ошибка (чтобы старые вкладки без выбора компании не падали).
 */
export const CONTENT_OS_COMPANY_COOKIE = "content_os_company";

export function getActiveCompanyId(request: NextRequest): string {
  return request.cookies.get(CONTENT_OS_COMPANY_COOKIE)?.value || DEFAULT_COMPANY_ID;
}
