import "server-only";

import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

export async function dbListPosts() {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from posts order by createdat desc"
  );
  return rows;
}

export async function dbGetPostBySlug(slug: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from posts where slug = $1", [
    slug,
  ]);
  return rows[0] ?? null;
}

export async function dbUpsertPost(payload: Record<string, unknown>) {
  const pool = getTimewebPool();
  await pool.query(
    `insert into posts (id, slug, title, subtitle, cover, contenthtml, tags, kind, createdat, updatedat, views, reactions)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb)
     on conflict (id) do update set
       slug = excluded.slug,
       title = excluded.title,
       subtitle = excluded.subtitle,
       cover = excluded.cover,
       contenthtml = excluded.contenthtml,
       tags = excluded.tags,
       kind = excluded.kind,
       createdat = excluded.createdat,
       updatedat = excluded.updatedat,
       views = excluded.views,
       reactions = excluded.reactions`,
    [
      payload.id,
      payload.slug,
      payload.title,
      payload.subtitle,
      payload.cover,
      payload.contenthtml,
      JSON.stringify(payload.tags ?? []),
      payload.kind ?? "post",
      payload.createdat,
      payload.updatedat,
      payload.views ?? 0,
      JSON.stringify(
        payload.reactions ?? { heart: 0, fire: 0, smile: 0 }
      ),
    ]
  );
}

export async function dbDeletePost(id: string) {
  const pool = getTimewebPool();
  await pool.query("delete from posts where id = $1", [id]);
}

export async function dbListNews() {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from news order by createdat desc"
  );
  return rows;
}

export async function dbGetNewsBySlug(slug: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from news where slug = $1", [
    slug,
  ]);
  return rows[0] ?? null;
}

export async function dbUpsertNews(payload: Record<string, unknown>) {
  const pool = getTimewebPool();
  await pool.query(
    `insert into news (id, slug, title, cover, contenthtml, tags, createdat, updatedat, views, reactions)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10::jsonb)
     on conflict (id) do update set
       slug = excluded.slug,
       title = excluded.title,
       cover = excluded.cover,
       contenthtml = excluded.contenthtml,
       tags = excluded.tags,
       createdat = excluded.createdat,
       updatedat = excluded.updatedat,
       views = excluded.views,
       reactions = excluded.reactions`,
    [
      payload.id,
      payload.slug,
      payload.title,
      payload.cover,
      payload.contenthtml,
      JSON.stringify(payload.tags ?? []),
      payload.createdat,
      payload.updatedat ?? payload.createdat,
      payload.views ?? 0,
      JSON.stringify(
        payload.reactions ?? { heart: 0, fire: 0, smile: 0 }
      ),
    ]
  );
}

export async function dbDeleteNews(id: string) {
  const pool = getTimewebPool();
  await pool.query("delete from news where id = $1", [id]);
}

export async function dbClearTestNews(): Promise<number> {
  const titles = [
    "Релиз новой версии АИС «Единая Среда»",
    "Конкурс айдентики для городского фестиваля",
  ];
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    "delete from news where title = any($1::text[])",
    [titles]
  );
  return rowCount ?? 0;
}

export async function dbListCases() {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from cases order by createdat desc"
  );
  return rows;
}

export async function dbGetCaseBySlug(slug: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from cases where slug = $1", [
    slug,
  ]);
  return rows[0] ?? null;
}

export async function dbUpsertCase(payload: Record<string, unknown>) {
  const pool = getTimewebPool();
  await pool.query(
    `insert into cases (id, slug, title, subtitle, cover, contenthtml, tags, application, location, createdat, updatedat, views, reactions)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb)
     on conflict (id) do update set
       slug = excluded.slug,
       title = excluded.title,
       subtitle = excluded.subtitle,
       cover = excluded.cover,
       contenthtml = excluded.contenthtml,
       tags = excluded.tags,
       application = excluded.application,
       location = excluded.location,
       createdat = excluded.createdat,
       updatedat = excluded.updatedat,
       views = excluded.views,
       reactions = excluded.reactions`,
    [
      payload.id,
      payload.slug,
      payload.title,
      payload.subtitle,
      payload.cover,
      payload.contenthtml,
      JSON.stringify(payload.tags ?? []),
      payload.application,
      payload.location,
      payload.createdat,
      payload.updatedat,
      payload.views ?? 0,
      JSON.stringify(
        payload.reactions ?? { heart: 0, fire: 0, smile: 0 }
      ),
    ]
  );
}

export async function dbDeleteCase(id: string) {
  const pool = getTimewebPool();
  await pool.query("delete from cases where id = $1", [id]);
}

export async function dbIncViews(kind: "post" | "news", slug: string) {
  const pool = getTimewebPool();
  const table = kind === "post" ? "posts" : "news";
  await pool.query("select inc_views($1, $2)", [table, slug]);
}

export async function dbIncReaction(
  kind: "post" | "news",
  id: string,
  type: string
) {
  const pool = getTimewebPool();
  const table = kind === "post" ? "posts" : "news";
  try {
    await pool.query("select inc_reaction($1, $2::uuid, $3)", [
      table,
      id,
      type,
    ]);
  } catch {
    const pool = getTimewebPool();
    if (kind === "post") {
      const { rows } = await pool.query(
        "select reactions from posts where id = $1",
        [id]
      );
      const cur = (rows[0]?.reactions as Record<string, number>) || {
        heart: 0,
        fire: 0,
        smile: 0,
      };
      const next = {
        ...cur,
        [type]: (cur[type as keyof typeof cur] || 0) + 1,
      };
      await pool.query(
        "update posts set reactions = $1::jsonb where id = $2",
        [JSON.stringify(next), id]
      );
    } else {
      const { rows } = await pool.query(
        "select reactions from news where id = $1",
        [id]
      );
      const cur = (rows[0]?.reactions as Record<string, number>) || {
        heart: 0,
        fire: 0,
        smile: 0,
      };
      const next = {
        ...cur,
        [type]: (cur[type as keyof typeof cur] || 0) + 1,
      };
      await pool.query(
        "update news set reactions = $1::jsonb where id = $2",
        [JSON.stringify(next), id]
      );
    }
  }
}

export async function dbGetReactions(kind: "post" | "news", id: string) {
  const pool = getTimewebPool();
  const table = kind === "post" ? "posts" : "news";
  const { rows } = await pool.query(
    `select reactions from ${table} where id = $1`,
    [id]
  );
  return (
    (rows[0]?.reactions as { heart: number; fire: number; smile: number }) || {
      heart: 0,
      fire: 0,
      smile: 0,
    }
  );
}

export async function dbListStories() {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from stories order by updated_at desc"
  );
  return rows;
}

export async function dbGetStoryById(id: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from stories where id = $1", [
    id,
  ]);
  return rows[0] ?? null;
}

export async function dbUpsertStory(payload: Record<string, unknown>) {
  const pool = getTimewebPool();
  await pool.query(
    `insert into stories (id, title, thumbnail, slides, created_at, updated_at, view_count)
     values ($1,$2,$3,$4::jsonb,$5,$6,$7)
     on conflict (id) do update set
       title = excluded.title,
       thumbnail = excluded.thumbnail,
       slides = excluded.slides,
       created_at = excluded.created_at,
       updated_at = excluded.updated_at,
       view_count = excluded.view_count`,
    [
      payload.id,
      payload.title,
      payload.thumbnail,
      JSON.stringify(payload.slides ?? []),
      payload.created_at,
      payload.updated_at,
      payload.view_count ?? 0,
    ]
  );
}

export async function dbDeleteStory(id: string) {
  const pool = getTimewebPool();
  await pool.query("delete from stories where id = $1", [id]);
}

export async function dbIncStoryViews(id: string) {
  const pool = getTimewebPool();
  await pool.query(
    "update stories set view_count = coalesce(view_count,0) + 1, updated_at = $2 where id = $1",
    [id, Date.now()]
  );
}

export async function dbListComments(postId: string, postType: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select c.*, p.full_name as author_full_name, p.avatar_url as author_avatar_url
     from comments c
     left join user_profiles p on p.id = c.author_id
     where c.post_id = $1 and c.post_type = $2 and c.is_deleted = false
     order by c.created_at asc`,
    [postId, postType]
  );
  return rows;
}

export async function dbListAllComments(limit = 50) {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `select c.*, p.full_name as author_full_name, p.avatar_url as author_avatar_url
     from comments c
     left join user_profiles p on p.id = c.author_id
     order by c.created_at desc
     limit $1`,
    [limit]
  );
  return rows;
}

export async function dbInsertComment(
  postId: string,
  postType: string,
  authorId: string,
  content: string,
  parentId?: string | null
) {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    `insert into comments (post_id, post_type, parent_id, author_id, content)
     values ($1,$2,$3,$4,$5)
     returning *`,
    [postId, postType, parentId ?? null, authorId, content]
  );
  return rows[0];
}

export async function dbSoftDeleteComment(commentId: string, authorId: string) {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    "update comments set is_deleted = true, updated_at = now() where id = $1 and author_id = $2",
    [commentId, authorId]
  );
  return (rowCount ?? 0) > 0;
}

export async function dbGetUserProfile(id: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query("select * from user_profiles where id = $1", [
    id,
  ]);
  return rows[0] ?? null;
}

export async function dbUpsertUserProfile(row: Record<string, unknown>) {
  const pool = getTimewebPool();
  await pool.query(
    `insert into user_profiles (id, email, full_name, avatar_url, organization, role, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6, now(), now())
     on conflict (id) do update set
       email = excluded.email,
       full_name = excluded.full_name,
       avatar_url = excluded.avatar_url,
       organization = excluded.organization,
       role = excluded.role,
       updated_at = now()`,
    [
      row.id,
      row.email,
      row.full_name,
      row.avatar_url,
      row.organization ?? null,
      row.role ?? "user",
    ]
  );
}

/** Профиль по id сессии (если строка пропала). */
export async function dbEnsureUserProfile(user: {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}) {
  const existing = await dbGetUserProfile(user.id);
  if (existing) return existing;
  const email = (user.email || "").trim().toLowerCase();
  const editorEmail = (process.env.EDITOR_EMAIL || "proeco09@yandex.ru")
    .trim()
    .toLowerCase();
  await dbUpsertUserProfile({
    id: user.id,
    email,
    full_name: user.full_name || (email ? email.split("@")[0] : "Пользователь"),
    avatar_url: user.avatar_url ?? null,
    organization: null,
    role: email === editorEmail ? "admin" : "user",
  });
  return dbGetUserProfile(user.id);
}

export async function dbIsFavorite(
  userId: string,
  postId: string,
  postType: string
) {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select id from favorites where user_id = $1 and post_id = $2 and post_type = $3",
    [userId, postId, postType]
  );
  return !!rows[0];
}

export async function dbRemoveFavorite(
  userId: string,
  postId: string,
  postType: string
) {
  const pool = getTimewebPool();
  await pool.query(
    "delete from favorites where user_id = $1 and post_id = $2 and post_type = $3",
    [userId, postId, postType]
  );
}

export async function dbAddFavorite(
  userId: string,
  postId: string,
  postType: string
) {
  const pool = getTimewebPool();
  await pool.query(
    "insert into favorites (user_id, post_id, post_type) values ($1,$2,$3) on conflict (user_id, post_id, post_type) do nothing",
    [userId, postId, postType]
  );
}

export async function dbListFavorites(userId: string) {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select * from favorites where user_id = $1 order by created_at desc",
    [userId]
  );
  return rows;
}

/** Изображения редактора (bytea), в контенте ссылка /api/media/{id} */
export async function dbInsertEditorMedia(
  id: string,
  mimeType: string,
  data: Buffer
) {
  const pool = getTimewebPool();
  await pool.query(
    "insert into editor_media (id, mime_type, data, size_bytes) values ($1,$2,$3,$4)",
    [id, mimeType, data, data.length]
  );
}

export async function dbGetEditorMedia(id: string): Promise<{
  mimeType: string;
  data: Buffer;
  sizeBytes: number;
} | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query(
    "select mime_type, data, size_bytes from editor_media where id = $1",
    [id]
  );
  const row = rows[0] as
    | { mime_type: string; data: Buffer; size_bytes: number }
    | undefined;
  if (!row) return null;
  return {
    mimeType: row.mime_type,
    data: row.data,
    sizeBytes: row.size_bytes,
  };
}
