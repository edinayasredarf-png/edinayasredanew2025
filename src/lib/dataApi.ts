"use client";

async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api${path}`, {
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

/** Запросы к `/api/data/*` (контент в Timeweb). */
export function dataFetch(path: string, init: RequestInit = {}) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return apiFetch(`/data${p}`, init);
}

/** Запросы к `/api/auth/*` (вход / регистрация). */
export function authFetch(path: string, init: RequestInit = {}) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return apiFetch(`/auth${p}`, init);
}
