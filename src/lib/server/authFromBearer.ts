import "server-only";

import {
  getEditorFromRequest,
  isAllowedEditorEmail,
} from "@/lib/server/editorSession";
import { getUserSessionFromRequest } from "@/lib/server/userSession";
import { dbGetUserById } from "@/lib/server/timewebAuthDb";

/** Пользователь сайта (Timeweb PostgreSQL). */
export interface TimewebAuthUser {
  id: string;
  email: string;
}

export async function getUserFromRequest(
  request: Request
): Promise<TimewebAuthUser | null> {
  const session = getUserSessionFromRequest(request);
  if (!session) return null;

  const row = await dbGetUserById(session.userId);
  if (!row) return null;
  if (row.email.toLowerCase() !== session.email.toLowerCase()) return null;

  return { id: row.id, email: row.email };
}

export async function requireUser(request: Request): Promise<TimewebAuthUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    const e = new Error("Unauthorized");
    (e as Error & { status?: number }).status = 401;
    throw e;
  }
  return user;
}

export async function assertCanWriteArticles(
  user: TimewebAuthUser
): Promise<void> {
  if (user.email.toLowerCase() === (process.env.EDITOR_EMAIL || "proeco09@yandex.ru").trim().toLowerCase()) {
    return;
  }

  const row = await dbGetUserById(user.id);
  const role = row?.role;
  if (role !== "admin" && role !== "author") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
}

export async function assertAdmin(user: TimewebAuthUser): Promise<void> {
  if (user.email.toLowerCase() === (process.env.EDITOR_EMAIL || "proeco09@yandex.ru").trim().toLowerCase()) {
    return;
  }

  const row = await dbGetUserById(user.id);
  if (row?.role !== "admin") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
}

/** Редактор (cookie) или пользователь с правом публикации. */
export async function requireContentWriter(request: Request): Promise<void> {
  const editor = getEditorFromRequest(request);
  if (editor && isAllowedEditorEmail(editor.email)) return;

  const user = await requireUser(request);
  await assertCanWriteArticles(user);
}

/** Админ-панель: редактор по cookie или admin в БД. */
export async function requireAdminAccess(request: Request): Promise<void> {
  const editor = getEditorFromRequest(request);
  if (editor && isAllowedEditorEmail(editor.email)) return;

  const user = await requireUser(request);
  await assertAdmin(user);
}

/* ───────────────── AI Sales RBAC (§57 ТЗ) ─────────────────
 * Роли отдела продаж поверх существующего user_profiles.role:
 *   admin   — всё; rop — весь отдел; manager — только свои звонки/сделки;
 *   analyst — аналитика без записи в CRM.
 * Не создаём вторую систему авторизации — расширяем существующую.
 */
export type SalesRole = "admin" | "rop" | "manager" | "analyst" | "user";

export interface SalesUser extends TimewebAuthUser {
  role: SalesRole;
  bitrixUserId: string | null;
}

/** Пользователь с его ролью продаж (для фильтрации доступа). */
export async function getSalesUser(request: Request): Promise<SalesUser | null> {
  const editor = getEditorFromRequest(request);
  if (editor && isAllowedEditorEmail(editor.email)) {
    return { id: "editor", email: editor.email, role: "admin", bitrixUserId: null };
  }
  const base = await getUserFromRequest(request);
  if (!base) return null;
  const row = await dbGetUserById(base.id);
  const role = (row?.role as SalesRole) || "user";
  return { ...base, role, bitrixUserId: null };
}

export async function requireSalesUser(request: Request): Promise<SalesUser> {
  const user = await getSalesUser(request);
  if (!user) {
    const e = new Error("Unauthorized");
    (e as Error & { status?: number }).status = 401;
    throw e;
  }
  return user;
}

/** РОП или админ — доступ ко всему отделу. */
export async function requireRopAccess(request: Request): Promise<SalesUser> {
  const user = await requireSalesUser(request);
  if (user.role !== "admin" && user.role !== "rop") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
  return user;
}

/** Доступ к разделу AI Sales (любая роль отдела, не обычный user). */
export async function requireSalesAccess(request: Request): Promise<SalesUser> {
  const user = await requireSalesUser(request);
  if (user.role === "user") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
  return user;
}

/** Может ли пользователь писать в Bitrix (не analyst). */
export function canWriteToCrm(user: SalesUser): boolean {
  return user.role === "admin" || user.role === "rop" || user.role === "manager";
}
