"use client";

import { getSupabase } from "./supabase";

async function mergeAuthHeaders(headers: Headers) {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session?.access_token) {
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }
  }
}

/** Запросы к `/api/data/*` (PostgreSQL Timeweb). JWT Supabase передаётся в Authorization. */
export async function dataFetch(
  path: string,
  init: RequestInit = {}
): Promise<unknown> {
  const headers = new Headers(init.headers);
  await mergeAuthHeaders(headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api/data${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* raw text */
    }
    throw new Error(msg || res.statusText);
  }
  if (!text) return null;
  return JSON.parse(text) as unknown;
}
