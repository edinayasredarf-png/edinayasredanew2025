-- Стартовые чек-листы по показательным этапам воронки «Управление
-- проектами» — дополняет timeweb_ai_scripts_stage*.sql. Это уже не
-- продажа: контракт подписан, звонки — про исполнение, сдачу и оплату.
-- Не заведены для технических/финальных этапов: project_new,
-- project_successful, project_closed_not_realized (см. StageInfo.callable
-- в dealStages.ts). Общие (department_id IS NULL), идемпотентно.
--
-- Применить вручную на Timeweb PostgreSQL (после timeweb_ai_scripts_stage.sql
-- — использует ту же колонку stage_key).

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'project_in_progress', 'В работе', 1, true, '[
  {"key":"done_so_far","title":"Уточнить, что уже сделано"},
  {"key":"client_blockers","title":"Выяснить сложности на стороне клиента (доступ к объектам, данные, согласования)"},
  {"key":"deadline_risk","title":"Оценить риск срыва сроков"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'project_in_progress' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'project_contracts_es_2025', 'Контракты по ЕС 2025', 1, true, '[
  {"key":"done_so_far","title":"Уточнить, что уже сделано"},
  {"key":"client_blockers","title":"Выяснить сложности на стороне клиента (доступ к объектам, данные, согласования)"},
  {"key":"deadline_risk","title":"Оценить риск срыва сроков"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'project_contracts_es_2025' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'project_contracts_es_2026', 'Контракты по ЕС 2026', 1, true, '[
  {"key":"done_so_far","title":"Уточнить, что уже сделано"},
  {"key":"client_blockers","title":"Выяснить сложности на стороне клиента (доступ к объектам, данные, согласования)"},
  {"key":"deadline_risk","title":"Оценить риск срыва сроков"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'project_contracts_es_2026' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'project_prolongations_2026', 'Пролонгации 2026', 1, true, '[
  {"key":"terms_agreed","title":"Уточнить, согласованы ли условия продления"},
  {"key":"timing","title":"Уточнить сроки продления"},
  {"key":"price_objections","title":"Выяснить возражения по цене"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'project_prolongations_2026' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'project_delivered_unpaid', 'Сданные, но неоплаченные', 1, true, '[
  {"key":"payment_status","title":"Уточнить статус оплаты (не оплачено/частично)"},
  {"key":"invoice_date","title":"Узнать дату отправки счёта"},
  {"key":"blockers","title":"Выяснить, что мешает оплате (акт, бюджетирование, документооборот)"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'project_delivered_unpaid' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'project_overdue_debt', 'Просроченная задолженность', 1, true, '[
  {"key":"reason","title":"Уточнить причину просрочки"},
  {"key":"overdue_days","title":"Узнать количество дней просрочки"},
  {"key":"payment_commitment","title":"Зафиксировать конкретную договорённость по оплате"},
  {"key":"tone","title":"Сохранить мягкий, но настойчивый тон (не звонок-продажа)"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'project_overdue_debt' AND is_active);
