import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getPostSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select title, subtitle, contenthtml, cover from posts where slug = $1 limit 1",
    [slug]
  );
  const data = rows[0] as
    | {
        title?: string | null;
        subtitle?: string | null;
        contenthtml?: string | null;
        cover?: string | null;
      }
    | undefined;
  if (!data) return {};

  const title = data.title ?? undefined;
  const subtitle = data.subtitle ?? undefined;
  const html = (data.contenthtml ?? "") as string;
  const cover = data.cover ?? undefined;
  const description =
    subtitle?.trim() || stripHtml(html).slice(0, 180) || undefined;

  return { title, description, image: cover };
}

export async function getNewsSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select title, contenthtml, cover from news where slug = $1 limit 1",
    [slug]
  );
  const data = rows[0] as
    | {
        title?: string | null;
        contenthtml?: string | null;
        cover?: string | null;
      }
    | undefined;
  if (!data) return {};

  const title = data.title ?? undefined;
  const html = (data.contenthtml ?? "") as string;
  const cover = data.cover ?? undefined;
  const description = stripHtml(html).slice(0, 180) || undefined;

  return { title, description, image: cover };
}

export async function getCaseSeoBySlug(slug: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select title, subtitle, cover from cases where slug = $1 limit 1",
    [slug]
  );
  const data = rows[0] as
    | {
        title?: string | null;
        subtitle?: string | null;
        cover?: string | null;
      }
    | undefined;
  if (!data) return {};

  const title = data.title ?? undefined;
  const subtitle = data.subtitle ?? undefined;
  const cover = data.cover ?? undefined;
  const description = subtitle?.trim() || undefined;

  return { title, description, image: cover };
}
