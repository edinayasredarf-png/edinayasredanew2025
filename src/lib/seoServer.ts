import 'server-only';

import { dbGetCaseBySlug, dbGetNewsBySlug, dbGetPostBySlug } from '@/lib/contentDb';

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
  const data = await dbGetPostBySlug(slug);
  if (!data) return {};

  const title = data.title ?? undefined;
  const subtitle = data.subtitle ?? undefined;
  const html = data.contentHtml ?? '';
  const cover = data.cover ?? undefined;
  const description = subtitle?.trim() || stripHtml(html).slice(0, 180) || undefined;

  return { title, description, image: cover };
}

export async function getNewsSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const data = await dbGetNewsBySlug(slug);
  if (!data) return {};

  const title = data.title ?? undefined;
  const html = data.contentHtml ?? '';
  const cover = data.cover ?? undefined;
  const description = stripHtml(html).slice(0, 180) || undefined;

  return { title, description, image: cover };
}

export async function getCaseSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const data = await dbGetCaseBySlug(slug);
  if (!data) return {};

  const title = data.title ?? undefined;
  const subtitle = data.subtitle ?? undefined;
  const cover = data.cover ?? undefined;
  const description = subtitle?.trim() || undefined;

  return { title, description, image: cover };
}

