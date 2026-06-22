-- OAuth providers table for Yandex/VK login
-- Run in Timeweb Adminer (same DB as user_profiles)

CREATE TABLE IF NOT EXISTS user_oauth_providers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider    text NOT NULL,          -- 'yandex' | 'vk'
  provider_id text NOT NULL,          -- user id from provider
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON user_oauth_providers (user_id);
