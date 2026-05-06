import 'server-only';

import { Pool } from 'pg';
import type { ServerBlogPost, ServerNewsItem } from '@/lib/blogStoreServer';

let pool: Pool | undefined;

function getPool(): Pool | undefined {
  const connectionString = process.env.TIMEWEB_POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) return undefined;

  if (pool) return pool;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  return pool;
}

function mapPostRow(row: any): ServerBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? '',
    tags: row.tags ?? [],
    kind: row.kind ?? 'post',
    createdAt: Number(row.createdat ?? Date.now()),
    updatedAt: Number(row.updatedat ?? row.createdat ?? Date.now()),
    views: Number(row.views ?? 0),
    reactions: row.reactions ?? { heart: 0, fire: 0, smile: 0 },
  };
}

function mapNewsRow(row: any): ServerNewsItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? undefined,
    tags: row.tags ?? [],
    createdAt: Number(row.createdat ?? Date.now()),
    updatedAt: row.updatedat ? Number(row.updatedat) : undefined,
    views: Number(row.views ?? 0),
    reactions: row.reactions ?? { heart: 0, fire: 0, smile: 0 },
  };
}

export async function dbListPosts(): Promise<ServerBlogPost[]> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');

  const { rows } = await db.query(
    `SELECT id, slug, title, subtitle, cover, contenthtml, tags, kind, createdat, updatedat, views, reactions
     FROM posts
     ORDER BY createdat DESC`
  );
  return rows.map(mapPostRow);
}

export async function dbListNews(): Promise<ServerNewsItem[]> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');

  const { rows } = await db.query(
    `SELECT id, slug, title, cover, contenthtml, tags, createdat, updatedat, views, reactions
     FROM news
     ORDER BY createdat DESC`
  );
  return rows.map(mapNewsRow);
}
