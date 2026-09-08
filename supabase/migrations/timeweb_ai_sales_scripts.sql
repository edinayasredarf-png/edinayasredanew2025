-- Скрипты продаж (§18 ТЗ): хранятся в БД, версионируются, у каждого отдела свой
-- (department_id = NULL — общий скрипт по умолчанию). Для каждого звонка LLM
-- отдельно оценивает соблюдение скрипта по шагам.

CREATE TABLE IF NOT EXISTS ai_sales_scripts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES ai_departments (id) ON DELETE CASCADE,  -- NULL = общий
  name          text NOT NULL DEFAULT 'Скрипт продаж',
  version       int  NOT NULL DEFAULT 1,
  steps         jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ "key": "...", "title": "..." }]
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_scripts_department ON ai_sales_scripts (department_id);
-- Один активный скрипт на отдел (и один общий, где department_id IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_scripts_active_dept
  ON ai_sales_scripts (department_id) WHERE is_active AND department_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_scripts_active_global
  ON ai_sales_scripts ((1)) WHERE is_active AND department_id IS NULL;

-- Результат оценки соблюдения скрипта по конкретному звонку.
CREATE TABLE IF NOT EXISTS ai_call_script_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id        uuid NOT NULL REFERENCES ai_calls (id) ON DELETE CASCADE,
  script_id      uuid REFERENCES ai_sales_scripts (id) ON DELETE SET NULL,
  script_version int,
  score          int,                                  -- 0..100 (взвешенно по шагам)
  steps          jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ key,title,completed,reason }]
  model          text,
  prompt_version text,
  input_hash     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_id, input_hash)
);
CREATE INDEX IF NOT EXISTS idx_call_script_scores_call ON ai_call_script_scores (call_id, created_at DESC);

-- Стартовый общий скрипт (как в §18 ТЗ). Идемпотентно: только если активного общего ещё нет.
INSERT INTO ai_sales_scripts (department_id, name, version, is_active, steps)
SELECT NULL, 'Скрипт продаж', 1, true, '[
  {"key":"greeting","title":"Представиться"},
  {"key":"client_name","title":"Узнать имя клиента"},
  {"key":"task","title":"Определить задачу"},
  {"key":"current_process","title":"Определить текущий процесс"},
  {"key":"budget","title":"Узнать бюджет"},
  {"key":"timeline","title":"Узнать сроки"},
  {"key":"presentation","title":"Презентовать решение"},
  {"key":"objections","title":"Отработать возражения"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND is_active);
