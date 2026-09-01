-- =============================================================================
-- SCHEMA_FILE_VERSION=v1-ai-deal-insights-2026-09-01
-- Оценка на уровне СДЕЛКИ (агрегат по всем звонкам сделки).
-- Bare-имена (текущая схема по search_path, как timeweb_ai_sales_schema.sql v2).
-- Применять ПОСЛЕ timeweb_ai_sales_schema.sql.
-- =============================================================================

SELECT 'SCHEMA_FILE_VERSION=v1-ai-deal-insights-2026-09-01' AS must_match;

CREATE TABLE IF NOT EXISTS ai_deal_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_deal_id text NOT NULL UNIQUE,
  calls_count   integer NOT NULL DEFAULT 0,
  scored_calls  integer NOT NULL DEFAULT 0,   -- показательных звонков (по ним оценка менеджера)
  deal_score    integer,                      -- 0..100 по совокупности сигналов
  deal_temperature text,                      -- HOT | WARM | COLD
  manager_score numeric,                      -- 0..10 по сделке целиком (не тянется короткими звонками)
  next_action   text,
  summary       text,
  provider      text,
  model         text,
  prompt_version text,
  input_hash    text,                         -- дайджест разборов звонков → кэш (не гоняем LLM зря)
  data          jsonb NOT NULL,               -- полный DealInsight (Zod)
  last_call_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_deal_insights_temp ON ai_deal_insights (deal_temperature);
CREATE INDEX IF NOT EXISTS idx_ai_deal_insights_updated ON ai_deal_insights (updated_at DESC);

SELECT 'ai_deal_insights ready' AS status;
