-- Контроль качества LLM (§33 ТЗ): эталонные оценки руководителя по звонкам.
-- Сравниваем оценку модели с оценкой человека, считаем корреляцию/расхождение,
-- отслеживаем по версиям промта/модели. Одна оценка на (звонок, ревьюер).

CREATE TABLE IF NOT EXISTS ai_call_reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id        uuid NOT NULL REFERENCES ai_calls (id) ON DELETE CASCADE,
  reviewer_id    text NOT NULL,          -- SalesUser.id (или 'editor')
  reviewer_email text,
  deal_score     int,                    -- эталон качества сделки 0..100
  manager_score  numeric,                -- эталон работы менеджера 0..10
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_call_reviews_call ON ai_call_reviews (call_id);
