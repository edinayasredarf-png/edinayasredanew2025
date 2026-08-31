-- =============================================================================
-- SCHEMA_FILE_VERSION=v2-ai-sales-2026-08-31
-- AI Sales / Conversation Intelligence — слой поверх Bitrix24.
--
-- БЕЗ хардкода схемы: таблицы создаются в ТЕКУЩЕЙ схеме (search_path), как в
-- timeweb_public_schema.sql (v6). Имена — БАРЕ (без es_app./public.), FK на
-- user_profiles — тоже без префикса. Работает и для public, и для es_app —
-- в зависимости от того, куда указывает search_path/база (важно: приложение
-- ходит в таблицы без префикса, так что миграция обязана лечь в ту же схему).
--
-- Применять ПОСЛЕ основной схемы (нужна таблица user_profiles).
--   • public-развёртывание: сначала timeweb_public_schema.sql, DATABASE_SEARCH_PATH=public
--   • es_app-развёртывание:  сначала timeweb_es_app_schema.sql, DATABASE_SEARCH_PATH=es_app,public
--
-- Adminer: выберите правильную базу, вставьте весь файл в SQL-запрос.
-- Если ранее выполнялась v1 (с es_app.-префиксом) — сначала прогоните
-- timeweb_ai_sales_cleanup_esapp.sql, чтобы убрать таблицы в es_app.
-- =============================================================================

SELECT 'SCHEMA_FILE_VERSION=v2-ai-sales-2026-08-31' AS must_match;

-- PostgreSQL 15+: попытка вернуть CREATE в текущую схему (как в public-варианте).
GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;

-- ============================ ОЧЕРЕДЬ ЗАДАЧ =================================
-- Тяжёлые операции (sync, транскрипция, анализ) не выполняются в HTTP-запросе.
-- Producer кладёт задачу; Vercel Cron дренирует пачками через SKIP LOCKED.
CREATE TABLE IF NOT EXISTS ai_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL,            -- bitrix.sync | call.ingest | call.transcribe | call.analyze | deal.analyze | manager.analyze | ai.report | followup.check
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED','RETRY_PENDING')),
  priority      integer NOT NULL DEFAULT 100,   -- меньше = раньше
  attempts      integer NOT NULL DEFAULT 0,
  max_attempts  integer NOT NULL DEFAULT 3,
  idempotency_key text UNIQUE,            -- повторная постановка не создаёт дубль
  run_after     timestamptz NOT NULL DEFAULT now(),
  locked_at     timestamptz,
  last_error    text,
  result        jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_pick
  ON ai_jobs (status, run_after, priority)
  WHERE status IN ('PENDING','RETRY_PENDING');

-- ============================ ЗЕРКАЛА BITRIX ================================
-- Минимальные зеркала для аналитики. Полноценная карточка — в Bitrix24.
CREATE TABLE IF NOT EXISTS ai_managers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_user_id text NOT NULL UNIQUE,
  user_profile_id uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
  full_name     text,
  email         text,
  active        boolean NOT NULL DEFAULT true,
  raw           jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_company_id text NOT NULL UNIQUE,
  title         text,
  organization_type text,          -- municipality | commercial | management_company | ...
  region        text,
  industry      text,
  raw           jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_contact_id text NOT NULL UNIQUE,
  bitrix_company_id text,
  full_name     text,
  position      text,
  phones        jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw           jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_deals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_deal_id text NOT NULL UNIQUE,
  title         text,
  bitrix_company_id text,
  bitrix_contact_id text,
  bitrix_user_id text,             -- ответственный менеджер
  stage_id      text,              -- сырой STAGE_ID Bitrix
  internal_stage text,             -- маппинг (NEW|QUALIFICATION|DEMO|...) — из настроек
  opportunity   numeric,           -- сумма из Bitrix
  currency      text,
  is_closed     boolean NOT NULL DEFAULT false,
  is_won        boolean,
  bitrix_created_at timestamptz,
  bitrix_updated_at timestamptz,
  raw           jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_deals_manager ON ai_deals (bitrix_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_deals_stage ON ai_deals (internal_stage);

-- ============================ ЗВОНКИ ========================================
CREATE TABLE IF NOT EXISTS ai_calls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_call_id text UNIQUE,          -- CALL_ID телефонии (если есть)
  bitrix_activity_id text UNIQUE,      -- идемпотентность ingestion из crm.activity
  bitrix_deal_id text,
  bitrix_lead_id text,
  bitrix_contact_id text,
  bitrix_company_id text,
  bitrix_user_id text,             -- менеджер
  direction     text,              -- in | out
  phone_number  text,
  started_at    timestamptz,
  duration_sec  integer,
  recording_url text,
  recording_hash text,             -- хэш записи — не транскрибируем дважды
  product       text,              -- определённый AI/правилами продукт
  status        text NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','DOWNLOADING','TRANSCRIBING','TRANSCRIBED','ANALYZING','COMPLETED','FAILED','RETRY_PENDING','NO_RECORDING')),
  raw           jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_calls_started ON ai_calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calls_manager ON ai_calls (bitrix_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_deal ON ai_calls (bitrix_deal_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_status ON ai_calls (status);

CREATE TABLE IF NOT EXISTS ai_call_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       uuid NOT NULL REFERENCES ai_calls (id) ON DELETE CASCADE,
  role          text NOT NULL,     -- MANAGER | CLIENT | UNKNOWN
  speaker_label text,
  name          text,
  position      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_call_participants_call ON ai_call_participants (call_id);

-- ============================ ТРАНСКРИПЦИЯ ==================================
CREATE TABLE IF NOT EXISTS ai_transcripts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       uuid NOT NULL UNIQUE REFERENCES ai_calls (id) ON DELETE CASCADE,
  provider      text NOT NULL,     -- yandex_speechkit | whisper | ...
  language      text,
  full_text     text,
  duration_sec  numeric,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_transcript_segments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES ai_transcripts (id) ON DELETE CASCADE,
  idx           integer NOT NULL,
  speaker_label text,
  role          text,              -- MANAGER | CLIENT | UNKNOWN (после разметки)
  start_ms      integer,           -- таймкод (клик по реплике → аудио)
  end_ms        integer,
  text          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transcript_id, idx)
);

CREATE INDEX IF NOT EXISTS idx_ai_segments_transcript ON ai_transcript_segments (transcript_id, idx);

-- ============================ AI-АНАЛИЗ ЗВОНКА ==============================
-- Кэш по (call_id, input_hash): один транскрипт с той же версией промпта не гоняем.
CREATE TABLE IF NOT EXISTS ai_call_analysis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       uuid NOT NULL REFERENCES ai_calls (id) ON DELETE CASCADE,
  provider      text NOT NULL,
  model         text NOT NULL,
  prompt_version text NOT NULL,
  analysis_version text NOT NULL,
  input_hash    text NOT NULL,
  summary       text,
  result_type   text,
  deal_score    integer,           -- 0..100
  deal_temperature text,           -- HOT | WARM | COLD
  manager_score numeric,           -- 0..10
  next_step     text,
  data          jsonb NOT NULL,    -- полный валидированный JSON (Zod callAnalysis)
  confidence    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_id, input_hash)
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_call ON ai_call_analysis (call_id, created_at DESC);

-- ============================ ТЕГИ =========================================
CREATE TABLE IF NOT EXISTS ai_tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  category      text NOT NULL,            -- client | product | sales | risk | custom
  label         text NOT NULL,
  color         text,
  ai_instruction text,
  is_system     boolean NOT NULL DEFAULT false,
  created_by    uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_call_tags (
  call_id       uuid NOT NULL REFERENCES ai_calls (id) ON DELETE CASCADE,
  tag_id        uuid NOT NULL REFERENCES ai_tags (id) ON DELETE CASCADE,
  source        text NOT NULL DEFAULT 'ai',   -- ai | manual | rule
  confidence    numeric,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (call_id, tag_id)
);

-- ============================ РЕКОМЕНДАЦИИ (HUMAN-IN-THE-LOOP) ==============
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope         text NOT NULL,            -- deal | call | manager | department
  bitrix_deal_id text,
  call_id       uuid REFERENCES ai_calls (id) ON DELETE SET NULL,
  bitrix_user_id text,
  kind          text NOT NULL,            -- next_action | create_task | add_comment | change_stage | ...
  action_level  text NOT NULL DEFAULT 'RECOMMEND'
                CHECK (action_level IN ('RECOMMEND','WRITE','CRITICAL_WRITE')),
  title         text NOT NULL,
  detail        text,
  payload       jsonb,
  status        text NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','APPROVED','REJECTED','APPLIED','FAILED')),
  severity      text,                     -- critical | risk | opportunity
  applied_at    timestamptz,
  applied_by    uuid REFERENCES user_profiles (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_reco_status ON ai_recommendations (status, severity);
CREATE INDEX IF NOT EXISTS idx_ai_reco_deal ON ai_recommendations (bitrix_deal_id);

-- ============================ FOLLOW-UPS ====================================
CREATE TABLE IF NOT EXISTS ai_followups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id       uuid REFERENCES ai_calls (id) ON DELETE SET NULL,
  bitrix_deal_id text,
  bitrix_user_id text,
  action        text NOT NULL,
  deadline      timestamptz,
  status        text NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','DONE','OVERDUE','CANCELLED')),
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_followups_status ON ai_followups (status, deadline);

-- ============================ СИНХРОНИЗАЦИЯ =================================
CREATE TABLE IF NOT EXISTS ai_bitrix_sync_state (
  entity        text PRIMARY KEY,         -- deals | contacts | companies | users | calls | activities
  last_synced_at timestamptz,
  last_cursor   text,
  last_bitrix_modified timestamptz,
  full_sync_done boolean NOT NULL DEFAULT false,
  stats         jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_bitrix_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id text UNIQUE,
  event         text NOT NULL,
  entity_id     text,
  payload       jsonb,
  processed     boolean NOT NULL DEFAULT false,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ai_events_unprocessed ON ai_bitrix_events (received_at) WHERE NOT processed;

-- ============================ НАСТРОЙКИ =====================================
CREATE TABLE IF NOT EXISTS ai_settings (
  key           text PRIMARY KEY,
  value         jsonb NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES user_profiles (id) ON DELETE SET NULL
);

INSERT INTO ai_settings (key, value) VALUES
  ('ai.provider',            '"anthropic"'::jsonb),
  ('ai.model.analysis',      '"claude-opus-5"'::jsonb),
  ('ai.model.classify',      '"claude-haiku-4-5"'::jsonb),
  ('ai.analysis_enabled',    'true'::jsonb),
  ('ai.confidence_threshold','0.5'::jsonb),
  ('bitrix.auto_write',      'false'::jsonb),
  ('bitrix.auto_create_tasks','false'::jsonb),
  ('bitrix.stage_mapping',   '{}'::jsonb),
  ('retention.transcript_days','365'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Готово. Таблицы созданы в текущей схеме (для вас — public).
-- =============================================================================
