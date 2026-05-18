-- Добавить пароли для входа через Timeweb (выполнить в Adminer, база public)
SELECT 'SCHEMA_FILE_VERSION=timeweb-auth-password-2026-05-18' AS must_match;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Уникальный email (если дубликаты — удалите вручную перед индексом)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique
  ON user_profiles (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';
