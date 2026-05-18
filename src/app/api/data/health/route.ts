import { NextResponse } from "next/server";
import { timewebDbPing } from "@/lib/timewebPg";

/** Проверка: Next.js → PostgreSQL Timeweb (для деплоя, без прямого доступа клиента к БД). */
export async function GET() {
  const ping = await timewebDbPing();
  if (!ping.ok) {
    return NextResponse.json(
      { ok: false, error: ping.message },
      { status: 503 }
    );
  }

  try {
    const { getTimewebPool } = await import("@/lib/timewebPg");
    const pool = getTimewebPool();
    const { rows } = await pool.query(
      `select
        (select count(*)::int from posts) as posts,
        (select count(*)::int from cases) as cases,
        (select count(*)::int from news) as news`
    );
    return NextResponse.json({ ok: true, tables: rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        hint: "Выполните supabase/migrations/timeweb_es_app_schema.sql и задайте DATABASE_SEARCH_PATH=es_app,public",
      },
      { status: 503 }
    );
  }
}
