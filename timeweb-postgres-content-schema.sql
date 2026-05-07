-- Полная схема Timeweb для контента (posts/news/cases/stories) и пользовательских данных.
-- Важно: UUID делаем без default gen_random_uuid(), потому что при импорт-операциях расширения могут быть недоступны.

-- =========================
-- posts / news
-- =========================

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  cover text,
  contenthtml text NOT NULL,
  -- В Supabase tags приводятся к JSONB, поэтому и здесь держим JSONB
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  kind text NOT NULL DEFAULT 'post',
  createdat bigint NOT NULL,
  updatedat bigint NOT NULL,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_posts_createdat ON posts(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  cover text,
  contenthtml text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  createdat bigint NOT NULL,
  updatedat bigint,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_news_createdat ON news(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);

-- =========================
-- cases
-- =========================

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  cover text,
  contenthtml text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  application text,
  location text,
  createdat bigint NOT NULL,
  updatedat bigint NOT NULL,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cases_createdat ON cases(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_cases_slug ON cases(slug);

-- =========================
-- stories
-- (snake_case: created_at / updated_at / view_count)
-- =========================

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  thumbnail text NOT NULL DEFAULT '',
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL,
  view_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories(updated_at DESC);

-- =========================
-- user_profiles / comments / favorites
-- =========================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  organization text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'author', 'admin')),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY,
  post_id text NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('post', 'news')),
  parent_id uuid,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  is_deleted boolean DEFAULT FALSE,
  replies_count integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id text NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('post', 'news')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, post_id, post_type)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_post ON favorites(post_id, post_type);
