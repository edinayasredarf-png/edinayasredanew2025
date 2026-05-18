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
