-- Скрипты продаж теперь можно привязать к ЭТАПУ воронки (не только к
-- отделу), см. src/lib/ai/dealStages.ts / stage-analysis-and-triggers.md.
-- Раньше один и тот же чек-лист (представиться/узнать бюджет/сроки/...)
-- применялся ко ВСЕМ звонкам отдела независимо от этапа сделки — из-за
-- этого, например, звонок по просроченной задолженности штрафовался за
-- "не узнал бюджет". Теперь scriptScoreService выбирает чек-лист по
-- (department_id, stage_key): сначала точное совпадение отдел+этап, затем
-- отдел без этапа, затем общий+этап, затем общий без этапа (как раньше).
--
-- stage_key = '' (пустая строка, НЕ NULL) — «применяется вне зависимости
-- от этапа», это поведение по умолчанию для уже существующих скриптов.
-- Пустая строка вместо NULL — чтобы уникальный индекс единственного
-- активного скрипта на комбинацию действительно работал (NULL в
-- уникальном индексе Postgres не считается равным другому NULL).
--
-- Применить вручную на Timeweb PostgreSQL (как и остальные файлы в
-- supabase/migrations/ — раннера миграций в проекте нет).

ALTER TABLE ai_sales_scripts ADD COLUMN IF NOT EXISTS stage_key text NOT NULL DEFAULT '';

DROP INDEX IF EXISTS uq_ai_scripts_active_dept;
DROP INDEX IF EXISTS uq_ai_scripts_active_global;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_scripts_active_dept_stage
  ON ai_sales_scripts (department_id, stage_key) WHERE is_active AND department_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_scripts_active_global_stage
  ON ai_sales_scripts (stage_key) WHERE is_active AND department_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_scripts_stage ON ai_sales_scripts (stage_key);

-- Стартовые чек-листы по этапам воронки «Отдел продаж» (только для
-- показательных/звонковых этапов — на технических/финальных этапах
-- полноценный разбор скрипта не нужен). Общие (department_id IS NULL),
-- идемпотентно: только если для этого этапа ещё нет активного общего.
-- Составлены по чек-листам из промптов анализа (src/lib/ai/prompts/
-- dealStagePrompts.ts) — можно донастроить в разделе «Скрипт» админки.

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_application_received', 'Заявка получена', 1, true, '[
  {"key":"greeting","title":"Установить контакт, поприветствовать"},
  {"key":"org_position","title":"Узнать организацию и должность звонящего"},
  {"key":"trigger","title":"Выяснить, что подтолкнуло обратиться именно сейчас"},
  {"key":"service","title":"Определить нужную услугу (насаждения/кладбища/лесоустройство/Единая среда)"},
  {"key":"source","title":"Узнать, откуда узнали о компании"},
  {"key":"prior_work","title":"Уточнить, проводилась ли аналогичная работа раньше"},
  {"key":"volume","title":"Узнать примерный объём (площадь/кол-во объектов)"},
  {"key":"budget","title":"Обсудить бюджет или источник финансирования"},
  {"key":"decision_maker","title":"Выяснить, кто принимает финальное решение"},
  {"key":"next_step","title":"Зафиксировать конкретный следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_application_received' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_clarification', 'Уточняющий диалог', 1, true, '[
  {"key":"explain_need","title":"Объяснить, какие данные нужны и зачем"},
  {"key":"get_list","title":"Получить точный список запрашиваемых данных"},
  {"key":"commitment","title":"Зафиксировать, кто и к какому сроку предоставит данные"},
  {"key":"blockers","title":"Уточнить препятствия к получению данных"},
  {"key":"next_step","title":"Зафиксировать следующий контакт/шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_clarification' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_quote_sent', 'КП отправлено / прочитано', 1, true, '[
  {"key":"received","title":"Уточнить, получил ли клиент КП (все части, если отправляли несколько)"},
  {"key":"price_clear","title":"Убедиться, что стоимость понятна"},
  {"key":"questions","title":"Выяснить вопросы и возражения"},
  {"key":"upsell","title":"Предложить дополнительные услуги"},
  {"key":"decision_process","title":"Уточнить, кто рассматривает КП и кто принимает решение"},
  {"key":"reach_dm","title":"Если исполнитель не ЛПР — выйти на ЛПР или предложить ВКС"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_quote_sent' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_quote_read', 'КП отправлено / прочитано', 1, true, '[
  {"key":"received","title":"Уточнить, получил ли клиент КП (все части, если отправляли несколько)"},
  {"key":"price_clear","title":"Убедиться, что стоимость понятна"},
  {"key":"questions","title":"Выяснить вопросы и возражения"},
  {"key":"upsell","title":"Предложить дополнительные услуги"},
  {"key":"decision_process","title":"Уточнить, кто рассматривает КП и кто принимает решение"},
  {"key":"reach_dm","title":"Если исполнитель не ЛПР — выйти на ЛПР или предложить ВКС"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_quote_read' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_deferred_demand', 'Отложенный спрос', 1, true, '[
  {"key":"reason","title":"Уточнить текущую причину отсрочки (из 18 причин)"},
  {"key":"what_changed","title":"Выяснить, что изменилось с прошлого контакта"},
  {"key":"trigger","title":"Спросить про новый триггер (закон/прокуратура/смена руководства/бюджет)"},
  {"key":"decision","title":"Уточнить, кто принимает решение и что должно произойти"},
  {"key":"next_contact","title":"Зафиксировать дату следующего контакта"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_deferred_demand' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_contract_sent', 'Договор отправлен', 1, true, '[
  {"key":"received","title":"Уточнить, получил ли клиент договор"},
  {"key":"reviewer","title":"Выяснить, кто согласовывает договор (юристы клиента)"},
  {"key":"remarks","title":"Узнать про замечания/вопросы по договору"},
  {"key":"blockers","title":"Уточнить, что мешает подписанию прямо сейчас"},
  {"key":"sign_date","title":"Зафиксировать дату/условие подписания"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_contract_sent' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_vcs_decision_maker', 'ВКС / выход на ЛПР', 1, true, '[
  {"key":"dm_present","title":"Убедиться, что на встрече присутствует ЛПР"},
  {"key":"link_pains","title":"Связать демонстрацию с конкретными задачами/болями клиента"},
  {"key":"budget_terms","title":"Обсудить стоимость, бюджет, сроки"},
  {"key":"objections","title":"Отработать возражения"},
  {"key":"next_step","title":"Зафиксировать дату следующего контакта и договорённости"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_vcs_decision_maker' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'sales_competitor_probe', 'Потенциальный партнёр / конкурент', 1, true, '[
  {"key":"which_tender","title":"Уточнить, по какой закупке интересуется"},
  {"key":"terms","title":"Озвучить условия/цену для подрядчика"},
  {"key":"contact","title":"Зафиксировать контакт для дальнейшей связи"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'sales_competitor_probe' AND is_active);
