'use client';

import type { Metadata } from "next";
import { dataFetch } from "./dataApi";
import { parseContentTimestamp } from "./contentDates";

export type Align = 'left' | 'center' | 'right';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;        // dataURL
  contentHtml: string;   // уже собранный HTML из блоков
  tags?: string[];
  kind?: 'post' | 'news' | 'lesson' | 'case';  // тип контента
  createdAt: number;
  updatedAt: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number };
};

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  cover?: string;
  contentHtml?: string;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number };
};

// -------- CASES (separate table) ----------
export const CASE_APPLICATION_OPTIONS = [
  'Единая Среда',
  'Инвентаризация зеленых насаждений',
  'Инвентаризация мест захоронений',
  'Лесоустройство',
  'Мелиорация',
  'Волонтерство',
] as const;

export type CaseItem = {
  id: string;            // uuid
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;
  contentHtml: string;
  tags?: string[] | any;
  application?: string;  // тип кейса из CASE_APPLICATION_OPTIONS
  location?: string;     // место проведения работ
  createdAt: number;
  updatedAt: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number } | any;
};

export type BlogDraft = {
  kind?: 'post' | 'news' | 'lesson' | 'case';
  title?: string;
  subtitle?: string;
  cover?: string;
  blocks?: any[];        // черновые блоки редактора
  tags?: string[];
  savedAt?: number;
  /** для кейсов: тип из CASE_APPLICATION_OPTIONS */
  caseApplication?: string;
  /** для кейсов: место проведения работ */
  caseLocation?: string;
};

const K_POSTS = 'BLOG_POSTS_V2';
const K_NEWS  = 'BLOG_NEWS_V2';
const K_CASES = 'BLOG_CASES_V1';
const K_TAGS  = 'BLOG_TAGS_V1';
const K_DRAFT = 'BLOG_DRAFT_V3';
const K_AUTH  = 'BLOG_AUTH_V1';
const K_RXMEM = 'BLOG_REACTIONS_USER_V1';

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); if (!raw) return fallback; return JSON.parse(raw) as T; }
  catch { return fallback; }
}
function write<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)); }

// -------- AUTH (редактор → cookie для записи в Timeweb) ----------
export const auth = {
  async login(user: string, pass: string): Promise<boolean> {
    try {
      const res = await fetch("/api/editor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user, password: pass }),
        credentials: "include",
      });
      if (!res.ok) {
        write(K_AUTH, { authed: false });
        return false;
      }
      write(K_AUTH, { authed: true });
      return true;
    } catch {
      write(K_AUTH, { authed: false });
      return false;
    }
  },
  async logout(): Promise<void> {
    try {
      await fetch("/api/editor/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    write(K_AUTH, { authed: false });
  },
  isAuthed() {
    return !!read(K_AUTH, { authed: false }).authed;
  },
};

// -------- TAGS ----------
export function listAllTags(): string[] { return read<string[]>(K_TAGS, []); }
export function addTag(tag: string) {
  const t = tag.trim(); if (!t) return;
  const all = listAllTags();
  if (!all.find(x=>x.toLowerCase()===t.toLowerCase())) {
    write(K_TAGS, [...all, t].sort((a,b)=>a.localeCompare(b)));
  }
}

// -------- POSTS ----------
export function loadPosts(): BlogPost[] { return read<BlogPost[]>(K_POSTS, []); }
export function savePosts(list: BlogPost[]) { write(K_POSTS, list); }
export function listPosts(): BlogPost[] { return [...loadPosts()].sort((a,b)=>b.createdAt - a.createdAt); }
export function listScheduledPosts(): BlogPost[] { 
  const now = Date.now();
  return loadPosts().filter(p => p.createdAt > now).sort((a,b)=>a.createdAt - b.createdAt); 
}
export function getPostBySlug(slug: string) { return loadPosts().find(p => p.slug === slug); }
export function upsertPost(p: BlogPost) {
  const list = loadPosts();
  const idx = list.findIndex(x => x.id === p.id || x.slug === p.slug);
  if (idx >= 0) list[idx] = p; else list.unshift(p);
  savePosts(list);
}
export function deletePostById(id: string) { savePosts(loadPosts().filter(p => p.id !== id)); }
export function publishScheduledPost(id: string) {
  const list = loadPosts();
  const post = list.find(p => p.id === id);
  if (post) {
    post.createdAt = Date.now();
    savePosts(list);
  }
}

// -------- NEWS ----------
export function loadNews(): NewsItem[] { return read<NewsItem[]>(K_NEWS, []); }
export function saveNews(list: NewsItem[]) { write(K_NEWS, list); }
export function listNews(): NewsItem[] { return [...loadNews()].sort((a,b)=>b.createdAt - a.createdAt); }
export function listScheduledNews(): NewsItem[] { 
  const now = Date.now();
  return loadNews().filter(n => n.createdAt > now).sort((a,b)=>a.createdAt - b.createdAt); 
}
export function getNewsBySlug(slug: string) { return loadNews().find(n => n.slug === slug); }
export function upsertNews(n: NewsItem) {
  const list = loadNews();
  const idx = list.findIndex(x => x.id === n.id || x.slug === n.slug);
  if (idx >= 0) list[idx] = n; else list.unshift(n);
  saveNews(list);
}
export function deleteNewsById(id: string) { saveNews(loadNews().filter(n => n.id !== id)); }
export function publishScheduledNews(id: string) {
  const list = loadNews();
  const news = list.find(n => n.id === id);
  if (news) {
    news.createdAt = Date.now();
    saveNews(list);
  }
}

// -------- CASES (local fallback) ----------
export function loadCases(): CaseItem[] { return read<CaseItem[]>(K_CASES, []); }
export function saveCases(list: CaseItem[]) { write(K_CASES, list); }
export function listCases(): CaseItem[] { return [...loadCases()].sort((a,b)=>b.createdAt - a.createdAt); }
export function getCaseBySlug(slug: string) { return loadCases().find(c => c.slug === slug); }
export function upsertCase(c: CaseItem) {
  const list = loadCases();
  const idx = list.findIndex(x => x.id === c.id || x.slug === c.slug);
  if (idx >= 0) list[idx] = c; else list.unshift(c);
  saveCases(list);
}
export function deleteCaseById(id: string) { saveCases(loadCases().filter(c => c.id !== id)); }

// функция для удаления тестовых новостей
export function clearTestNews() {
  const list = loadNews();
  const testTitles = [
    'Релиз новой версии АИС «Единая Среда»',
    'Конкурс айдентики для городского фестиваля'
  ];
  const filtered = list.filter(n => !testTitles.includes(n.title));
  saveNews(filtered);
  return list.length - filtered.length; // возвращаем количество удаленных
}

export async function sb_clearTestNews(): Promise<number> {
  try {
    const r = (await dataFetch("/news", {
      method: "POST",
      body: JSON.stringify({ clearTestNews: true }),
    })) as { deleted?: number };
    return r?.deleted ?? 0;
  } catch (error) {
    console.log("clear test news (API) failed:", error);
    return clearTestNews();
  }
}

// -------- VIEWS ----------
export function incViews(kind: 'post'|'news', slug: string) {
  if (kind === 'post') {
    const list = loadPosts(); const i = list.findIndex(p => p.slug === slug);
    if (i >= 0) { list[i].views = (list[i].views || 0) + 1; savePosts(list); }
  } else {
    const list = loadNews(); const i = list.findIndex(n => n.slug === slug);
    if (i >= 0) { list[i].views = (list[i].views || 0) + 1; saveNews(list); }
  }
}

// -------- REACTIONS ----------
type Rx = 'heart'|'fire'|'smile';
export function react(kind:'post'|'news', id: string, type: Rx) {
  const mem = read<Record<string, Rx[]>>(K_RXMEM, {});
  const mine = new Set(mem[id] || []);
  if (mine.has(type)) return;
  mine.add(type); mem[id] = [...mine]; write(K_RXMEM, mem);

  if (kind === 'post') {
    const list = loadPosts(); const i = list.findIndex(p => p.id === id);
    if (i>=0) { list[i].reactions = list[i].reactions || {heart:0,fire:0,smile:0}; (list[i].reactions as any)[type]++; savePosts(list); }
  } else {
    const list = loadNews(); const i = list.findIndex(n => n.id === id);
    if (i>=0) { list[i].reactions = list[i].reactions || {heart:0,fire:0,smile:0}; (list[i].reactions as any)[type]++; saveNews(list); }
  }
}
export function myReactions(id: string): Rx[] { return read<Record<string,Rx[]>>(K_RXMEM, {})[id] || []; }

// -------- DRAFT ----------
export function saveDraft(d: BlogDraft) { write(K_DRAFT, d); }
export function loadDraft(): BlogDraft | undefined { return read<BlogDraft | undefined>(K_DRAFT, undefined); }
export function clearDraft() { localStorage.removeItem(K_DRAFT); }

export { fileToDataURL } from "@/lib/imageCompress";

export function genSlug(title: string): string {
  const map: Record<string,string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
    ' ':'-','—':'-','–':'-','_':'-'
  };
  const s = title.toLowerCase().split('').map(ch => map[ch] ?? ch).join('');
  return s.replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'') || 'post';
}

// -------- DEMO SEED ----------
export function ensureDemo() {
  if (!loadPosts().length) {
    const now = Date.now();
    upsertPost({
      id: crypto.randomUUID(),
      slug: 'dobro-pozhalovat',
      title: 'Добро пожаловать в блог',
      subtitle: 'Лента + новости + редактор. Авторизация: proeco09@yandex.ru / ecostroy2013',
      contentHtml: '<p>Это демо-пост. Добавьте свой материал через «Написать».</p>',
      cover: undefined, tags: ['Графический дизайн'],
      createdAt: now, updatedAt: now, views: 172, reactions: { heart:3, fire:1, smile:0 }
    });
  }
  if (!loadNews().length) {
    const t = Date.now();
    upsertNews({
      id: crypto.randomUUID(),
      slug: 'reliz-ais-ed-sreda',
      title: 'Релиз новой версии АИС «Единая Среда»',
      contentHtml: '<p>Добавили новые отчёты и улучшили производительность.</p>',
      createdAt: t - 86400000, tags: ['Продуктовый дизайн'], views: 220, reactions: {heart:1,fire:0,smile:0}
    });
    upsertNews({
      id: crypto.randomUUID(),
      slug: 'konkurs-dizaina',
      title: 'Конкурс айдентики для городского фестиваля',
      contentHtml: '<p>Приём работ открыт до конца месяца.</p>',
      createdAt: t - 2*86400000, tags: ['Брендинг'], views: 155, reactions:{heart:0,fire:1,smile:0}
    });
  }
}

function mapPostRow(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? row.contentHtml, // на случай уже правильного нейминга
    tags: row.tags ?? [],
    kind: row.kind ?? undefined,
    createdAt: parseContentTimestamp(row.createdat, row.createdAt, row.updatedat, row.updatedAt),
    updatedAt: parseContentTimestamp(row.updatedat, row.updatedAt, row.createdat, row.createdAt),
    views: row.views ?? 0,
    reactions: row.reactions ?? { heart:0, fire:0, smile:0 },
  };
}

function mapNewsRow(row: any): NewsItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? row.contentHtml,
    tags: row.tags ?? [],
    createdAt: parseContentTimestamp(row.createdat, row.createdAt, row.updatedat, row.updatedAt),
    updatedAt: parseContentTimestamp(row.updatedat, row.updatedAt, row.createdat, row.createdAt),
    views: row.views ?? 0,
    reactions: row.reactions ?? { heart:0, fire:0, smile:0 },
  };
}

function mapCaseRow(row: any): CaseItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? row.contentHtml,
    tags: row.tags ?? [],
    application: row.application ?? undefined,
    location: row.location ?? undefined,
    createdAt: parseContentTimestamp(row.createdat, row.createdAt, row.updatedat, row.updatedAt),
    updatedAt: parseContentTimestamp(row.updatedat, row.updatedAt, row.createdat, row.createdAt),
    views: row.views ?? 0,
    reactions: row.reactions ?? { heart:0, fire:0, smile:0 },
  };
}

function postToPayload(p: BlogPost): any {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? null,
    cover: p.cover ?? null,
    contenthtml: p.contentHtml,
    tags: p.tags ?? [],
    kind: p.kind ?? 'post',
    createdat: p.createdAt,
    updatedat: p.updatedAt,
    views: p.views ?? 0,
    reactions: p.reactions ?? { heart:0, fire:0, smile:0 },
  };
}

function newsToPayload(n: NewsItem): any {
  return {
    id: n.id,
    slug: n.slug,
    title: n.title,
    cover: n.cover ?? null,
    contenthtml: n.contentHtml ?? null,
    tags: n.tags ?? [],
    createdat: n.createdAt,
    updatedat: n.updatedAt ?? null,
    views: n.views ?? 0,
    reactions: n.reactions ?? { heart:0, fire:0, smile:0 },
  };
}

function caseToPayload(c: CaseItem): any {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle ?? null,
    cover: c.cover ?? null,
    contenthtml: c.contentHtml,
    tags: c.tags ?? [],
    application: c.application ?? null,
    location: c.location ?? null,
    createdat: c.createdAt,
    updatedat: c.updatedAt,
    views: c.views ?? 0,
    reactions: c.reactions ?? { heart:0, fire:0, smile:0 },
  };
}

// -------- API Timeweb (/api/data) ----------
export async function sb_listPosts(): Promise<BlogPost[]> {
  const rows = (await dataFetch("/posts")) as Record<string, unknown>[];
  return (rows || []).map(mapPostRow);
}
export async function sb_getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const row = (await dataFetch(
    "/posts?slug=" + encodeURIComponent(slug)
  )) as Record<string, unknown> | null;
  if (!row) return undefined;
  return mapPostRow(row);
}
export async function sb_upsertPost(p: BlogPost): Promise<void> {
  await dataFetch("/posts", {
    method: "POST",
    body: JSON.stringify(postToPayload(p)),
  });
}
export async function sb_deletePostById(id: string): Promise<void> {
  await dataFetch("/posts?id=" + encodeURIComponent(id), { method: "DELETE" });
}

export async function sb_listNews(): Promise<NewsItem[]> {
  const rows = (await dataFetch("/news")) as Record<string, unknown>[];
  return (rows || []).map(mapNewsRow);
}
export async function sb_getNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  const row = (await dataFetch(
    "/news?slug=" + encodeURIComponent(slug)
  )) as Record<string, unknown> | null;
  if (!row) return undefined;
  return mapNewsRow(row);
}
export async function sb_upsertNews(n: NewsItem): Promise<void> {
  await dataFetch("/news", {
    method: "POST",
    body: JSON.stringify(newsToPayload(n)),
  });
}
export async function sb_deleteNewsById(id: string): Promise<void> {
  await dataFetch("/news?id=" + encodeURIComponent(id), { method: "DELETE" });
}

export async function sb_listCases(): Promise<CaseItem[]> {
  const rows = (await dataFetch("/cases")) as Record<string, unknown>[];
  return (rows || []).map(mapCaseRow);
}

export async function sb_getCaseBySlug(slug: string): Promise<CaseItem | undefined> {
  const row = (await dataFetch(
    "/cases?slug=" + encodeURIComponent(slug)
  )) as Record<string, unknown> | null;
  if (!row) return undefined;
  return mapCaseRow(row);
}

export async function sb_upsertCase(c: CaseItem): Promise<void> {
  await dataFetch("/cases", {
    method: "POST",
    body: JSON.stringify(caseToPayload(c)),
  });
}

export async function sb_deleteCaseById(id: string): Promise<void> {
  await dataFetch("/cases?id=" + encodeURIComponent(id), { method: "DELETE" });
}

export async function sb_incViews(kind: "post" | "news", slug: string): Promise<void> {
  await dataFetch("/views", {
    method: "POST",
    body: JSON.stringify({ kind, slug }),
  });
}

// -------- REACTIONS (Timeweb) ----------
export async function sb_react(kind: "post" | "news", id: string, type: Rx): Promise<void> {
  await dataFetch("/reactions", {
    method: "POST",
    body: JSON.stringify({ kind, id, type }),
  });
  react(kind, id, type);
}

export async function sb_getReactions(
  kind: "post" | "news",
  id: string
): Promise<{ heart: number; fire: number; smile: number }> {
  return (await dataFetch(
    "/reactions?kind=" + encodeURIComponent(kind) + "&id=" + encodeURIComponent(id)
  )) as { heart: number; fire: number; smile: number };
}
