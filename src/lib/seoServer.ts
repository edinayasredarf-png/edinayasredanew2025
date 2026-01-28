import 'server-only';

import { getSupabaseServer } from '@/lib/supabaseServer';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getPostSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const sb = getSupabaseServer();
  const { data, error } = await sb.from('posts').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) return {};

  const title = (data.title as string | null) ?? undefined;
  const subtitle = (data.subtitle as string | null) ?? undefined;
  const html = (data.contenthtml ?? data.contentHtml ?? '') as string;
  const cover = (data.cover as string | null) ?? undefined;
  const description = subtitle?.trim() || stripHtml(html).slice(0, 180) || undefined;

  return { title, description, image: cover };
}

export async function getNewsSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const sb = getSupabaseServer();
  const { data, error } = await sb.from('news').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) return {};

  const title = (data.title as string | null) ?? undefined;
  const html = (data.contenthtml ?? data.contentHtml ?? '') as string;
  const cover = (data.cover as string | null) ?? undefined;
  const description = stripHtml(html).slice(0, 180) || undefined;

  return { title, description, image: cover };
}

export async function getCaseSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const sb = getSupabaseServer();
  const { data, error } = await sb.from('cases').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) return {};

  const title = (data.title as string | null) ?? undefined;
  const subtitle = (data.subtitle as string | null) ?? undefined;
  const cover = (data.cover as string | null) ?? undefined;
  const description = subtitle?.trim() || undefined;

  return { title, description, image: cover };
}

