-- Полнотекстовый поиск по репликам транскриптов (§32 ТЗ): «дорого», «конкурент»,
-- «подумаю», «отправьте КП» и т.п. — с переходом к звонку и моменту (start_ms).
-- Генерируемая tsvector-колонка (russian) + GIN-индекс. to_tsvector с явным
-- regconfig IMMUTABLE, поэтому STORED generated column допустим.

ALTER TABLE ai_transcript_segments
  ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('russian', coalesce(text, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_ai_segments_tsv ON ai_transcript_segments USING GIN (tsv);

-- Триграммный индекс для подстрочного поиска коротких/редких фраз (напр. «КП»),
-- которые FTS-лексемы могут пропустить. Расширение обычно доступно на managed PG.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_ai_segments_text_trgm
    ON ai_transcript_segments USING GIN (lower(text) gin_trgm_ops);
EXCEPTION WHEN insufficient_privilege OR undefined_file THEN
  RAISE NOTICE 'pg_trgm недоступен — поиск будет только FTS';
END $$;
