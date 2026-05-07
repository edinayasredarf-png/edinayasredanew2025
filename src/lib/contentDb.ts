import 'server-only';

import { Pool } from 'pg';
import type { ServerBlogPost, ServerNewsItem } from '@/lib/blogStoreServer';

export type ServerCaseItem = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;
  contentHtml: string;
  tags?: string[];
  application?: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number };
};

export type ServerStoryItem = {
  id: string;
  title: string;
  thumbnail: string;
  slides: any[];
  createdAt: number;
  updatedAt: number;
  viewCount: number;
};

let pool: Pool | undefined;

function parseJsonbArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((x: unknown) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
    tags: parseJsonbArray(row.tags),
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
    tags: parseJsonbArray(row.tags),
    createdAt: Number(row.createdat ?? Date.now()),
    updatedAt: row.updatedat ? Number(row.updatedat) : undefined,
    views: Number(row.views ?? 0),
    reactions: row.reactions ?? { heart: 0, fire: 0, smile: 0 },
  };
}

function mapCaseRow(row: any): ServerCaseItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    cover: row.cover ?? undefined,
    contentHtml: row.contenthtml ?? '',
    tags: parseJsonbArray(row.tags),
    application: row.application ?? undefined,
    location: row.location ?? undefined,
    createdAt: Number(row.createdat ?? Date.now()),
    updatedAt: Number(row.updatedat ?? row.createdat ?? Date.now()),
    views: Number(row.views ?? 0),
    reactions: row.reactions ?? { heart: 0, fire: 0, smile: 0 },
  };
}

function mapStoryRow(row: any): ServerStoryItem {
  return {
    id: row.id,
    title: row.title ?? '',
    thumbnail: row.thumbnail ?? '',
    slides: Array.isArray(row.slides) ? row.slides : [],
    createdAt: Number(row.created_at ?? Date.now()),
    updatedAt: Number(row.updated_at ?? Date.now()),
    viewCount: Number(row.view_count ?? 0),
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

export async function dbGetPostBySlug(slug: string): Promise<ServerBlogPost | undefined> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  const { rows } = await db.query(
    `SELECT id, slug, title, subtitle, cover, contenthtml, tags, kind, createdat, updatedat, views, reactions
     FROM posts WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapPostRow(rows[0]) : undefined;
}

export async function dbGetNewsBySlug(slug: string): Promise<ServerNewsItem | undefined> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  const { rows } = await db.query(
    `SELECT id, slug, title, cover, contenthtml, tags, createdat, updatedat, views, reactions
     FROM news WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapNewsRow(rows[0]) : undefined;
}

export async function dbListCases(): Promise<ServerCaseItem[]> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  const { rows } = await db.query(
    `SELECT id, slug, title, subtitle, cover, contenthtml, tags, application, location, createdat, updatedat, views, reactions
     FROM cases ORDER BY createdat DESC`
  );
  return rows.map(mapCaseRow);
}

export async function dbGetCaseBySlug(slug: string): Promise<ServerCaseItem | undefined> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  const { rows } = await db.query(
    `SELECT id, slug, title, subtitle, cover, contenthtml, tags, application, location, createdat, updatedat, views, reactions
     FROM cases WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapCaseRow(rows[0]) : undefined;
}

export async function dbListStories(): Promise<ServerStoryItem[]> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  const { rows } = await db.query(
    `SELECT id, title, thumbnail, slides, created_at, updated_at, view_count
     FROM stories ORDER BY updated_at DESC`
  );
  return rows.map(mapStoryRow);
}

export async function dbGetStoryById(id: string): Promise<ServerStoryItem | undefined> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  const { rows } = await db.query(
    `SELECT id, title, thumbnail, slides, created_at, updated_at, view_count
     FROM stories WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ? mapStoryRow(rows[0]) : undefined;
}

export async function dbUpsertPost(item: ServerBlogPost): Promise<void> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  await db.query(
    `INSERT INTO posts (id, slug, title, subtitle, cover, contenthtml, tags, kind, createdat, updatedat, views, reactions)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       slug=EXCLUDED.slug,title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,cover=EXCLUDED.cover,
       contenthtml=EXCLUDED.contenthtml,tags=EXCLUDED.tags,kind=EXCLUDED.kind,
       createdat=EXCLUDED.createdat,updatedat=EXCLUDED.updatedat,views=EXCLUDED.views,reactions=EXCLUDED.reactions`,
    [item.id, item.slug, item.title, item.subtitle ?? null, item.cover ?? null, item.contentHtml, JSON.stringify(item.tags ?? []), item.kind ?? 'post', item.createdAt, item.updatedAt, item.views ?? 0, JSON.stringify(item.reactions ?? { heart: 0, fire: 0, smile: 0 })]
  );
}

export async function dbUpsertNews(item: ServerNewsItem): Promise<void> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  await db.query(
    `INSERT INTO news (id, slug, title, cover, contenthtml, tags, createdat, updatedat, views, reactions)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       slug=EXCLUDED.slug,title=EXCLUDED.title,cover=EXCLUDED.cover,contenthtml=EXCLUDED.contenthtml,
       tags=EXCLUDED.tags,createdat=EXCLUDED.createdat,updatedat=EXCLUDED.updatedat,views=EXCLUDED.views,reactions=EXCLUDED.reactions`,
    [item.id, item.slug, item.title, item.cover ?? null, item.contentHtml ?? null, JSON.stringify(item.tags ?? []), item.createdAt, item.updatedAt ?? null, item.views ?? 0, JSON.stringify(item.reactions ?? { heart: 0, fire: 0, smile: 0 })]
  );
}

export async function dbUpsertCase(item: ServerCaseItem): Promise<void> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  await db.query(
    `INSERT INTO cases (id, slug, title, subtitle, cover, contenthtml, tags, application, location, createdat, updatedat, views, reactions)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       slug=EXCLUDED.slug,title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,cover=EXCLUDED.cover,contenthtml=EXCLUDED.contenthtml,
       tags=EXCLUDED.tags,application=EXCLUDED.application,location=EXCLUDED.location,
       createdat=EXCLUDED.createdat,updatedat=EXCLUDED.updatedat,views=EXCLUDED.views,reactions=EXCLUDED.reactions`,
    [item.id, item.slug, item.title, item.subtitle ?? null, item.cover ?? null, item.contentHtml, JSON.stringify(item.tags ?? []), item.application ?? null, item.location ?? null, item.createdAt, item.updatedAt, item.views ?? 0, JSON.stringify(item.reactions ?? { heart: 0, fire: 0, smile: 0 })]
  );
}

export async function dbUpsertStory(item: ServerStoryItem): Promise<void> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  await db.query(
    `INSERT INTO stories (id, title, thumbnail, slides, created_at, updated_at, view_count)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       title=EXCLUDED.title,thumbnail=EXCLUDED.thumbnail,slides=EXCLUDED.slides,
       created_at=EXCLUDED.created_at,updated_at=EXCLUDED.updated_at,view_count=EXCLUDED.view_count`,
    [item.id, item.title, item.thumbnail, JSON.stringify(item.slides ?? []), item.createdAt, item.updatedAt, item.viewCount ?? 0]
  );
}

export async function dbDeleteById(table: 'posts' | 'news' | 'cases' | 'stories', id: string): Promise<void> {
  const db = getPool();
  if (!db) throw new Error('TIMEWEB_POSTGRES_URL is not set');
  await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
}
