'use client';

import type { Metadata } from "next";
import { getSupabase } from './supabase';

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

export type BlogDraft = {
  kind?: 'post' | 'news' | 'lesson' | 'case';
  title?: string;
  subtitle?: string;
  cover?: string;
  blocks?: any[];        // черновые блоки редактора
  tags?: string[];
  savedAt?: number;
};

const K_POSTS = 'BLOG_POSTS_V2';
const K_NEWS  = 'BLOG_NEWS_V2';
const K_TAGS  = 'BLOG_TAGS_V1';
const K_DRAFT = 'BLOG_DRAFT_V3';
const K_AUTH  = 'BLOG_AUTH_V1';
const K_RXMEM = 'BLOG_REACTIONS_USER_V1';

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); if (!raw) return fallback; return JSON.parse(raw) as T; }
  catch { return fallback; }
}
function write<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)); }

// -------- AUTH ----------
export const auth = {
  login(user: string, pass: string) {
    const ok = user === 'proeco' && pass === 'ecostroy2013';
    if (ok) write(K_AUTH, { authed: true });
    return ok;
  },
  logout() { write(K_AUTH, { authed: false }); },
  isAuthed() { return !!read(K_AUTH, { authed: false }).authed; },
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

// -------- HELPERS (сжатие изображений) ----------
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(fr.error);
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(file);
  });
}

async function compressImageDataURL(
  inputDataUrl: string,
  mimeOut: 'image/webp'|'image/jpeg' = 'image/webp',
  quality = 0.85,
  maxSide = 1600
): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  const p = new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const { width, height } = img;
      const k = Math.min(1, maxSide / Math.max(width, height));
      const w = Math.max(1, Math.round(width * k));
      const h = Math.max(1, Math.round(height * k));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL(mimeOut, quality);
      resolve(out);
    };
    img.onerror = () => reject(new Error('Image decode failed'));
  });
  img.src = inputDataUrl;
  return p;
}

/**
 * «Умная» конвертация файла в dataURL:
 * - если файл изображение — сжимает (max 1600px, WEBP/JPEG ~0.85)
 * - иначе — просто читает как base64
 */
export async function fileToDataURL(file: File): Promise<string> {
  const raw = await readFileAsDataURL(file);
  if (file.type.startsWith('image/')) {
    try {
      return await compressImageDataURL(raw, 'image/webp', 0.85, 1600);
    } catch {
      return await compressImageDataURL(raw, 'image/jpeg', 0.85, 1600);
    }
  }
  return raw;
}

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
      subtitle: 'Лента + новости + редактор. Авторизация: proeco / ecostroy2013',
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
    createdAt: row.createdat ?? row.createdAt,
    updatedAt: row.updatedat ?? row.updatedAt,
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
    createdAt: row.createdat ?? row.createdAt,
    updatedAt: row.updatedat ?? row.updatedAt,
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

// -------- SUPABASE ASYNC API (optional) ----------
export async function sb_listPosts(): Promise<BlogPost[]> {
  const sb = getSupabase(); if (!sb) return listPosts();
  const { data, error } = await sb.from('posts').select('*').order('createdat', { ascending: false });
  if (error) return listPosts();
  return (data || []).map(mapPostRow);
}
export async function sb_getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const sb = getSupabase(); if (!sb) return getPostBySlug(slug);
  const { data } = await sb.from('posts').select('*').eq('slug', slug).maybeSingle();
  return data ? mapPostRow(data) : undefined;
}
export async function sb_upsertPost(p: BlogPost): Promise<void> {
  const sb = getSupabase(); if (!sb) return upsertPost(p);
  await sb.from('posts').upsert(postToPayload(p), { onConflict: 'id' });
}
export async function sb_deletePostById(id: string): Promise<void> {
  const sb = getSupabase(); if (!sb) return deletePostById(id);
  await sb.from('posts').delete().eq('id', id);
}

export async function sb_listNews(): Promise<NewsItem[]> {
  const sb = getSupabase(); if (!sb) return listNews();
  const { data, error } = await sb.from('news').select('*').order('createdat', { ascending: false });
  if (error) return listNews();
  return (data || []).map(mapNewsRow);
}
export async function sb_getNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  const sb = getSupabase(); if (!sb) return getNewsBySlug(slug);
  const { data } = await sb.from('news').select('*').eq('slug', slug).maybeSingle();
  return data ? mapNewsRow(data) : undefined;
}
export async function sb_upsertNews(n: NewsItem): Promise<void> {
  const sb = getSupabase(); if (!sb) return upsertNews(n);
  await sb.from('news').upsert(newsToPayload(n), { onConflict: 'id' });
}
export async function sb_deleteNewsById(id: string): Promise<void> {
  const sb = getSupabase(); if (!sb) return deleteNewsById(id);
  await sb.from('news').delete().eq('id', id);
}

export async function sb_incViews(kind: 'post'|'news', slug: string): Promise<void> {
  const sb = getSupabase(); if (!sb) return incViews(kind, slug);
  const table = kind === 'post' ? 'posts' : 'news';
  try { await sb.rpc('inc_views', { t_name: table, p_slug: slug }); } catch {}
}
