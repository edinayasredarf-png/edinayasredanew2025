-- Таблица статей
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  cover text,
  contenthtml text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  kind text NOT NULL DEFAULT 'post',
  createdat bigint NOT NULL,
  updatedat bigint NOT NULL,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_posts_createdat ON posts(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- Таблица новостей
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  cover text,
  contenthtml text,
  tags text[] NOT NULL DEFAULT '{}',
  createdat bigint NOT NULL,
  updatedat bigint,
  views integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{"heart":0,"fire":0,"smile":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_news_createdat ON news(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
