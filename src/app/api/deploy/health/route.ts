import { NextResponse } from "next/server";
import { getTimewebPool } from "@/lib/timewebPg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only readiness check: no schema initialization or customer data.
export async function GET() {
  try {
    await getTimewebPool().query("SELECT 1");
    return NextResponse.json(
      { ok: true, revision: process.env.RELEASE_SHA || "unknown" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
