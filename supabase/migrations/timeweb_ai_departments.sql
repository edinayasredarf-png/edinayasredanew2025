-- Отделы компании для речевой аналитики: у каждого отдела свой промт анализа
-- звонка (YandexGPT анализирует по-разному) и свой состав сотрудников.
-- Схема public (как остальные ai_* таблицы).

CREATE TABLE IF NOT EXISTS ai_departments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE,           -- стабильный ключ для сидов (можно NULL для пользовательских)
  analysis_prompt text,                  -- кастомный системный промт анализа; NULL → дефолтный
  sort            int  NOT NULL DEFAULT 100,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Привязка менеджера к отделу.
ALTER TABLE ai_managers
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES ai_departments (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_managers_department ON ai_managers (department_id);

-- Стартовые отделы (идемпотентно по slug).
INSERT INTO ai_departments (name, slug, sort) VALUES
  ('Отдел продаж',      'sales',      10),
  ('Отдел производства','production', 20),
  ('Юридический отдел', 'legal',      30),
  ('Отдел сервиса',     'service',    40)
ON CONFLICT (slug) DO NOTHING;
