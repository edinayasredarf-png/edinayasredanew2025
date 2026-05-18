-- =============================================================================
-- SCHEMA_FILE_VERSION=v6-public-genuser-2026-05-17
-- Timeweb gen_user: таблицы в схеме public (БЕЗ CREATE SCHEMA es_app).
-- =============================================================================
--
-- Используйте ЭТОТ файл, если timeweb_es_app_schema.sql падает на:
--   ERROR: permission denied for database public  (на CREATE SCHEMA es_app)
--
-- Adminer: база данных = public (как в панели Timeweb), SQL-запрос → вставить весь файл.
--
-- После успеха в .env.local:
--   DATABASE_URL=postgresql://gen_user:...@host:5432/public?sslmode=verify-full
--   DATABASE_SEARCH_PATH=public
--
-- Если и здесь «permission denied for schema public» — только поддержка Timeweb
-- (шаблон текста в конце файла timeweb_genuser_probe.sql / в инструкции на сайте).
--
-- =============================================================================

SELECT 'SCHEMA_FILE_VERSION=v6-public-genuser-2026-05-17' AS must_match;

-- PostgreSQL 15+: попытка вернуть CREATE в public (может не сработать у gen_user)
GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;

-- ---------- user_profiles ----------
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL DEFAULT '',
  full_name text,
  avatar_url text,
  organization text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (lower(email));

-- ---------- posts ----------
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  cover text,
  contenthtml text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  kind text NOT NULL DEFAULT 'post',
  createdat bigint NOT NULL,
  updatedat bigint NOT NULL,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_posts_createdat ON posts (createdat DESC);

-- ---------- news ----------
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  cover text,
  contenthtml text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  createdat bigint NOT NULL,
  updatedat bigint,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_news_createdat ON news (createdat DESC);

-- ---------- cases ----------
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  cover text,
  contenthtml text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  application text,
  location text,
  createdat bigint NOT NULL,
  updatedat bigint NOT NULL,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cases_createdat ON cases (createdat DESC);

-- ---------- comments ----------
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('post', 'news')),
  parent_id uuid REFERENCES comments (id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  replies_count integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, post_type) WHERE NOT is_deleted;

-- ---------- favorites ----------
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
  post_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('post', 'news')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id, post_type)
);

-- ---------- stories ----------
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  thumbnail text NOT NULL DEFAULT '',
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  view_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories (updated_at DESC);

-- ---------- RPC: просмотры ----------
CREATE OR REPLACE FUNCTION inc_views(t_name text, p_slug text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF t_name = 'posts' THEN
    UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE slug = p_slug;
  ELSIF t_name = 'news' THEN
    UPDATE news SET views = COALESCE(views, 0) + 1 WHERE slug = p_slug;
  ELSE
    RAISE EXCEPTION 'invalid table %', t_name;
  END IF;
END;
$$;

-- ---------- RPC: реакции ----------
CREATE OR REPLACE FUNCTION inc_reaction(t_name text, p_id uuid, p_type text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cur jsonb;
  h int;
  f int;
  s int;
BEGIN
  IF t_name NOT IN ('posts', 'news') THEN
    RAISE EXCEPTION 'invalid table %', t_name;
  END IF;
  IF p_type NOT IN ('heart', 'fire', 'smile') THEN
    RAISE EXCEPTION 'invalid reaction %', p_type;
  END IF;

  IF t_name = 'posts' THEN
    SELECT reactions INTO cur FROM posts WHERE id = p_id FOR UPDATE;
  ELSE
    SELECT reactions INTO cur FROM news WHERE id = p_id FOR UPDATE;
  END IF;

  IF cur IS NULL THEN
    cur := '{"heart":0,"fire":0,"smile":0}'::jsonb;
  END IF;

  h := COALESCE((cur->>'heart')::int, 0);
  f := COALESCE((cur->>'fire')::int, 0);
  s := COALESCE((cur->>'smile')::int, 0);

  IF p_type = 'heart' THEN h := h + 1; END IF;
  IF p_type = 'fire' THEN f := f + 1; END IF;
  IF p_type = 'smile' THEN s := s + 1; END IF;

  cur := jsonb_build_object('heart', h, 'fire', f, 'smile', s);

  IF t_name = 'posts' THEN
    UPDATE posts SET reactions = cur WHERE id = p_id;
  ELSE
    UPDATE news SET reactions = cur WHERE id = p_id;
  END IF;
END;
$$;
