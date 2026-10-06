-- AI-брифы по лидам и сделкам («Отложенный спрос»): данные CRM + поиск в интернете.
-- Таблица создаётся и автоматически при первом обращении (briefsDb.ensureBriefsSchema),
-- файл — для ручного применения/истории, как остальные в supabase/migrations/.

CREATE TABLE IF NOT EXISTS ai_briefs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      text NOT NULL CHECK (entity_type IN ('lead', 'deal')),
  bitrix_entity_id text NOT NULL,
  title            text,
  company_title    text,
  bitrix_user_id   text,              -- ответственный менеджер
  brief_text       text,              -- итоговый бриф (читаемый текст)
  triggers         jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{title,date,url,source,kind,isNew}]
  new_triggers     integer NOT NULL DEFAULT 0,          -- сколько триггеров новее предыдущего брифа
  status           text NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'FAILED')),
  error            text,
  pushed_at        timestamptz,       -- записан в поле Bitrix
  notified_at      timestamptz,       -- отправлено уведомление
  seen_at          timestamptz,       -- открыт в админке (снимает подсветку)
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_briefs_entity ON ai_briefs (entity_type, bitrix_entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_briefs_new ON ai_briefs (created_at DESC) WHERE new_triggers > 0 AND seen_at IS NULL;
