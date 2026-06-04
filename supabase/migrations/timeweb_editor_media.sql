-- Картинки из редактора (кейсы, статьи, новости): байты в БД, в HTML только /api/media/{uuid}
-- Выполнить в Adminer после основной схемы (public или es_app — как у posts).

CREATE TABLE IF NOT EXISTS editor_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime_type text NOT NULL,
  data bytea NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editor_media_created ON editor_media (created_at DESC);

-- Если используете схему es_app (DATABASE_SEARCH_PATH=es_app,public):
-- CREATE TABLE IF NOT EXISTS es_app.editor_media (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   mime_type text NOT NULL,
--   data bytea NOT NULL,
--   size_bytes integer NOT NULL,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS idx_editor_media_created ON es_app.editor_media (created_at DESC);
