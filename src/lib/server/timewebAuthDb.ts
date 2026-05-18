import "server-only";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getTimewebPool } from "@/lib/timewebPg";

const BCRYPT_ROUNDS = 12;

export type DbUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  role: string;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
};

export function sanitizeProfile(row: DbUserRow | Record<string, unknown>) {
  const r = row as DbUserRow;
  return {
    id: r.id,
    email: r.email,
    full_name: r.full_name ?? undefined,
    avatar_url: r.avatar_url ?? undefined,
    organization: r.organization ?? undefined,
    role: r.role,
    created_at:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
    updated_at:
      r.updated_at instanceof Date
        ? r.updated_at.toISOString()
        : String(r.updated_at),
  };
}

export async function dbGetUserByEmail(
  email: string
): Promise<DbUserRow | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<DbUserRow>(
    "select * from user_profiles where lower(trim(email)) = lower(trim($1)) limit 1",
    [email]
  );
  return rows[0] ?? null;
}

export async function dbGetUserById(id: string): Promise<DbUserRow | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<DbUserRow>(
    "select * from user_profiles where id = $1",
    [id]
  );
  return rows[0] ?? null;
}

function editorEmail(): string {
  return (process.env.EDITOR_EMAIL || "proeco09@yandex.ru").trim().toLowerCase();
}

export async function dbRegisterUser(input: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<DbUserRow> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw Object.assign(new Error("Некорректный email"), { status: 400 });
  }
  if (input.password.length < 6) {
    throw Object.assign(new Error("Пароль не менее 6 символов"), {
      status: 400,
    });
  }

  const existing = await dbGetUserByEmail(email);
  if (existing) {
    throw Object.assign(new Error("Пользователь с таким email уже существует"), {
      status: 409,
    });
  }

  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const id = randomUUID();
  const role = email === editorEmail() ? "admin" : "user";
  const fullName =
    input.fullName?.trim() || email.split("@")[0] || "Пользователь";

  const pool = getTimewebPool();
  await pool.query(
    `insert into user_profiles (
      id, email, full_name, avatar_url, organization, role, password_hash, created_at, updated_at
    ) values ($1,$2,$3,null,null,$4,$5, now(), now())`,
    [id, email, fullName, role, hash]
  );

  const row = await dbGetUserById(id);
  if (!row) throw new Error("Не удалось создать пользователя");
  return row;
}

export async function dbLoginUser(
  email: string,
  password: string
): Promise<DbUserRow> {
  const normalized = email.trim().toLowerCase();
  const row = await dbGetUserByEmail(normalized);
  if (!row || !row.password_hash) {
    throw Object.assign(new Error("Неверный email или пароль"), { status: 401 });
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    throw Object.assign(new Error("Неверный email или пароль"), { status: 401 });
  }
  return row;
}
