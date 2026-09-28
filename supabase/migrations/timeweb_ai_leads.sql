-- Зеркало сущности Bitrix CRM "Лид" (crm.lead.*) — до конвертации в сделку
-- звонки часто привязаны к лиду (ai_calls.bitrix_lead_id), а не к сделке.
-- Нужно для речевой аналитики по этапам воронки ЛИДА (см.
-- docs/ai-sales/stage-analysis-and-triggers.md) — отдельно от воронки сделок
-- «Отдел продаж»/«Обслуживание сервиса».
--
-- Применить вручную на Timeweb PostgreSQL (той же командой/способом, что и
-- остальные файлы в supabase/migrations/ — раннера миграций в проекте нет).

CREATE TABLE IF NOT EXISTS ai_leads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_lead_id text NOT NULL UNIQUE,
  title          text,
  bitrix_company_id text,
  bitrix_contact_id text,
  bitrix_user_id text,             -- ответственный менеджер
  status_id      text,             -- сырой STATUS_ID Bitrix (воронка лида)
  is_converted   boolean,          -- STATUS_ID = 'CONVERTED' (лид стал сделкой)
  bitrix_created_at timestamptz,
  bitrix_updated_at timestamptz,
  raw            jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_leads_manager ON ai_leads (bitrix_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_leads_status ON ai_leads (status_id);
