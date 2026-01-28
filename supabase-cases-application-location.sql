-- Добавить колонки application и location в таблицу cases (для типа кейса и места проведения работ)
-- Выполнить в Supabase SQL Editor, если таблица cases уже создана

ALTER TABLE cases ADD COLUMN IF NOT EXISTS application TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS location TEXT;

-- Рекомендуется: обеспечить уникальность slug (иначе sb_getCaseBySlug может падать на duplicate rows)
CREATE UNIQUE INDEX IF NOT EXISTS cases_slug_unique_idx ON cases (slug);
