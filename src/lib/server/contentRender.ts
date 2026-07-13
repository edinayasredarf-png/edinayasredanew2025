import "server-only";

// Серверная выборка полной статьи/новости/кейса для передачи в клиентский
// компонент как initial-проп. Благодаря этому тело статьи попадает в исходный
// HTML (SSR) — важно для индексации (особенно Яндексом), а не подгружается в
// useEffect. Клиентские store-функции (blogStore) серверу недоступны ('use client'),
// поэтому читаем напрямую из БД через dbGet*BySlug и приводим к camelCase-форме,
// которую ждут компоненты.

import { dbGetPostBySlug, dbGetNewsBySlug, dbGetCaseBySlug } from "@/lib/server/dataDb";
import type { BlogPost, NewsItem, CaseItem } from "@/lib/blogStore";

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const DEFAULT_REACTIONS = { heart: 0, fire: 0, smile: 0 };

export async function getPostForRender(slug: string): Promise<BlogPost | undefined> {
  try {
    const r = await dbGetPostBySlug(slug);
    if (!r) return undefined;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle ?? undefined,
      cover: r.cover ?? undefined,
      contentHtml: r.contenthtml ?? "",
      tags: r.tags ?? [],
      kind: r.kind ?? undefined,
      createdAt: num(r.createdat),
      updatedAt: num(r.updatedat),
      views: r.views ?? 0,
      reactions: r.reactions ?? DEFAULT_REACTIONS,
    };
  } catch (e) {
    console.error("getPostForRender failed", e);
    return undefined;
  }
}

export async function getNewsForRender(slug: string): Promise<NewsItem | undefined> {
  try {
    const r = await dbGetNewsBySlug(slug);
    if (!r) return undefined;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      cover: r.cover ?? undefined,
      contentHtml: r.contenthtml ?? "",
      tags: r.tags ?? [],
      createdAt: num(r.createdat),
      updatedAt: num(r.updatedat),
      views: r.views ?? 0,
      reactions: r.reactions ?? DEFAULT_REACTIONS,
    };
  } catch (e) {
    console.error("getNewsForRender failed", e);
    return undefined;
  }
}

export async function getCaseForRender(slug: string): Promise<CaseItem | undefined> {
  try {
    const r = await dbGetCaseBySlug(slug);
    if (!r) return undefined;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle ?? undefined,
      cover: r.cover ?? undefined,
      contentHtml: r.contenthtml ?? "",
      tags: r.tags ?? [],
      application: r.application ?? undefined,
      location: r.location ?? undefined,
      createdAt: num(r.createdat),
      updatedAt: num(r.updatedat),
      views: r.views ?? 0,
      reactions: r.reactions ?? DEFAULT_REACTIONS,
    };
  } catch (e) {
    console.error("getCaseForRender failed", e);
    return undefined;
  }
}
