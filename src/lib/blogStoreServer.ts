import 'server-only';

import { getSupabaseServer } from '@/lib/supabaseServer';

export type ServerBlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;
  contentHtml: string;
  tags?: string[];
  kind?: 'post' | 'news' | 'lesson' | 'case';
  createdAt: number;
  updatedAt: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number };
};

export type ServerNewsItem = {
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

function mapPostRow(row: any): ServerBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? row.contentHtml,
    tags: row.tags ?? [],
    kind: row.kind ?? undefined,
    createdAt: row.createdat ?? row.createdAt,
    updatedAt: row.updatedat ?? row.updatedAt,
    views: row.views ?? 0,
    reactions: row.reactions ?? { heart: 0, fire: 0, smile: 0 },
  };
}

function mapNewsRow(row: any): ServerNewsItem {
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
    reactions: row.reactions ?? { heart: 0, fire: 0, smile: 0 },
  };
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

export async function serverListPosts(): Promise<ServerBlogPost[]> {
  try {
    const sb = getSupabaseServer();
    const result = await withTimeout<any>(4500, (signal) =>
      sb.from('posts').select('*').order('createdat', { ascending: false }).abortSignal(signal)
    );
    const { data, error } = result;
    if (error) throw error;
    return (data || []).map(mapPostRow);
  } catch (error) {
    console.error('serverListPosts failed:', error);
    return [];
  }
}

export async function serverListNews(): Promise<ServerNewsItem[]> {
  try {
    const sb = getSupabaseServer();
    const result = await withTimeout<any>(4500, (signal) =>
      sb.from('news').select('*').order('createdat', { ascending: false }).abortSignal(signal)
    );
    const { data, error } = result;
    if (error) throw error;
    return (data || []).map(mapNewsRow);
  } catch (error) {
    console.error('serverListNews failed:', error);
    return [];
  }
}

export async function serverGetPostBySlug(slug: string): Promise<ServerBlogPost | undefined> {
  try {
    const sb = getSupabaseServer();
    const result = await withTimeout<any>(4500, (signal) =>
      sb.from('posts').select('*').eq('slug', slug).maybeSingle().abortSignal(signal)
    );
    const { data, error } = result;
    if (error) throw error;
    return data ? mapPostRow(data) : undefined;
  } catch (error) {
    console.error('serverGetPostBySlug failed:', error);
    return undefined;
  }
}
