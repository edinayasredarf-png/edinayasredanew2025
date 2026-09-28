-- Стартовые чек-листы по этапам воронки ЛИДА (Bitrix Lead) — дополняет
-- timeweb_ai_scripts_stage.sql (там сделаны только этапы «Отдел продаж»).
-- Только показательные этапы (lead_no_answer/lead_spam/lead_qualified/
-- lead_unqualified — технические/финальные, чек-лист им не нужен).
-- Общие (department_id IS NULL), идемпотентно.
--
-- Применить вручную на Timeweb PostgreSQL (после timeweb_ai_scripts_stage.sql
-- — использует ту же колонку stage_key).

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'lead_new', 'Новый лид', 1, true, '[
  {"key":"greeting","title":"Установить контакт, поприветствовать"},
  {"key":"org_position","title":"Узнать организацию и должность звонящего"},
  {"key":"trigger","title":"Выяснить, что подтолкнуло обратиться именно сейчас"},
  {"key":"service","title":"Определить нужную услугу (насаждения/кладбища/лесоустройство/Единая среда)"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'lead_new' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'lead_first_contact', 'Первичный контакт', 1, true, '[
  {"key":"org_position","title":"Узнать организацию и должность"},
  {"key":"need","title":"Выяснить, что конкретно интересует"},
  {"key":"source","title":"Узнать, откуда узнали о компании"},
  {"key":"real_need","title":"Оценить, насколько реальна потребность и когда"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'lead_first_contact' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'lead_qualification', 'Квалификация', 1, true, '[
  {"key":"real_need","title":"Уточнить реальность потребности"},
  {"key":"profile","title":"Проверить профиль клиента (администрация/МО/госорганизация/УК/коммерция)"},
  {"key":"budget_signal","title":"Узнать минимальные признаки бюджета"},
  {"key":"timeline_signal","title":"Узнать ориентировочные сроки"},
  {"key":"dm_signal","title":"Выяснить, есть ли ЛПР на связи"},
  {"key":"qualify_decision","title":"Принять решение: качественный лид (конвертировать) или некачественный (закрыть)"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'lead_qualification' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'lead_deferred_demand', 'Отложенный спрос (лид)', 1, true, '[
  {"key":"reason","title":"Уточнить текущую причину отсрочки (из 18 причин)"},
  {"key":"what_changed","title":"Выяснить, что изменилось с прошлого контакта"},
  {"key":"trigger","title":"Спросить про новый триггер (закон/прокуратура/смена руководства/бюджет)"},
  {"key":"decision","title":"Уточнить, кто принимает решение и что должно произойти"},
  {"key":"next_contact","title":"Зафиксировать дату следующего контакта"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'lead_deferred_demand' AND is_active);
