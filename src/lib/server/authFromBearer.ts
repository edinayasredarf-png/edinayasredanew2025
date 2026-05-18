import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import {
  getEditorFromRequest,
  isAllowedEditorEmail,
} from "@/lib/server/editorSession";

/** Проверка JWT сессии Supabase (anon key + Bearer). Данные в Timeweb, идентификация — Supabase Auth. */
export async function getUserFromBearer(
  request: Request
): Promise<User | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7).trim();
  if (!jwt) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser(request: Request): Promise<User> {
  const user = await getUserFromBearer(request);
  if (!user) {
    const e = new Error("Unauthorized");
    (e as Error & { status?: number }).status = 401;
    throw e;
  }
  return user;
}

export async function assertCanWriteArticles(user: User): Promise<void> {
  if (user.email === "proeco09@yandex.ru") return;

  const { getTimewebPool } = await import("@/lib/timewebPg");
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ role: string }>(
    "select role from user_profiles where id = $1",
    [user.id]
  );
  const role = rows[0]?.role;
  if (role !== "admin" && role !== "author") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
}

export async function assertAdmin(user: User): Promise<void> {
  if (user.email === "proeco09@yandex.ru") return;

  const { getTimewebPool } = await import("@/lib/timewebPg");
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ role: string }>(
    "select role from user_profiles where id = $1",
    [user.id]
  );
  if (rows[0]?.role !== "admin") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
}

/** Редактор (cookie) или Supabase-пользователь с правом публикации. */
export async function requireContentWriter(request: Request): Promise<void> {
  const editor = getEditorFromRequest(request);
  if (editor && isAllowedEditorEmail(editor.email)) return;

  const user = await requireUser(request);
  await assertCanWriteArticles(user);
}

/** Админ-панель: редактор по cookie или Supabase admin. */
export async function requireAdminAccess(request: Request): Promise<void> {
  const editor = getEditorFromRequest(request);
  if (editor && isAllowedEditorEmail(editor.email)) return;

  const user = await requireUser(request);
  await assertAdmin(user);
}
