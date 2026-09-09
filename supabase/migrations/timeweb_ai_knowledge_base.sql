-- База знаний для RAG (§31, §37 ТЗ): продукты, цены, FAQ, скрипты, регламенты,
-- возражения, примеры хороших/плохих звонков. Документы бьются на чанки, к каждому
-- чанку — эмбеддинг Yandex (256-мерный) в jsonb. Косинус считаем в коде (без pgvector).

CREATE TABLE IF NOT EXISTS ai_kb_documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  category   text,                    -- product | price | faq | script | regulation | objection | example | other
  content    text NOT NULL DEFAULT '',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_kb_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ai_kb_documents (id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content     text NOT NULL,
  embedding   jsonb,                  -- массив чисел (256), null если не проиндексирован
  tokens      int,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_kb_chunks_doc ON ai_kb_chunks (document_id);
