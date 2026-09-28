-- Стартовые чек-листы по показательным этапам воронки «Обслуживание
-- сервиса» — дополняет timeweb_ai_scripts_stage.sql /
-- timeweb_ai_scripts_stage_lead.sql. Составлены по смыслу названия стадии
-- (как и промпты для этой воронки в dealStagePrompts.ts) — стоит уточнить
-- и доработать с руководителем сервиса/сопровождения.
-- Не заведены для технических/финальных этапов: service_data_loading,
-- service_prolonged, service_closed_unrealized, service_application_fulfilled,
-- service_closed_not_realized (см. StageInfo.callable в dealStages.ts).
-- Общие (department_id IS NULL), идемпотентно.
--
-- Применить вручную на Timeweb PostgreSQL (после timeweb_ai_scripts_stage.sql
-- — использует ту же колонку stage_key).

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_demo_access', 'Демо-доступ', 1, true, '[
  {"key":"can_login","title":"Убедиться, что клиент понимает, как войти в систему"},
  {"key":"start_with","title":"Уточнить, с чего клиент хочет начать / какие функции попробовать"},
  {"key":"explain_demo","title":"Объяснить возможности демо-доступа"},
  {"key":"decision_date","title":"Узнать, когда планирует принять решение о полноценном использовании"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_demo_access' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_application_accepted', 'Заявка принята', 1, true, '[
  {"key":"confirm_contacts","title":"Подтвердить контактные данные клиента"},
  {"key":"access_timeline","title":"Уточнить сроки выдачи доступа"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_application_accepted' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_access_granted', 'Выдан доступ', 1, true, '[
  {"key":"can_login","title":"Убедиться, что клиент смог зайти в систему"},
  {"key":"explain_next","title":"Объяснить дальнейший шаг (обучение / загрузка данных)"},
  {"key":"tech_issues","title":"Уточнить технические сложности с доступом"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_access_granted' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_training_assigned', 'Назначено обучение', 1, true, '[
  {"key":"agree_date","title":"Согласовать дату и формат обучения"},
  {"key":"participants","title":"Уточнить, кто от клиента будет участвовать"},
  {"key":"goals","title":"Узнать, какие задачи клиент хочет закрыть после обучения"},
  {"key":"confirm_date","title":"Зафиксировать дату обучения"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_training_assigned' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_working_with_client', 'Работа с клиентом', 1, true, '[
  {"key":"progress","title":"Узнать, что уже получилось у клиента"},
  {"key":"difficulties","title":"Выяснить возникшие сложности"},
  {"key":"expectations","title":"Уточнить, что клиент ждёт от сервиса дальше"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_working_with_client' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_ip_access', 'Доступ ИП', 1, true, '[
  {"key":"what_needed","title":"Уточнить, что именно требуется настроить"},
  {"key":"blockers","title":"Выяснить препятствия к настройке доступа"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_ip_access' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_confirmed_user', 'Подтверждённый пользователь', 1, true, '[
  {"key":"frequency","title":"Уточнить, как часто клиент пользуется системой"},
  {"key":"features_used","title":"Узнать, какие функции задействованы"},
  {"key":"questions","title":"Выяснить вопросы/сложности"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_confirmed_user' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_active_user', 'Активный пользователь', 1, true, '[
  {"key":"satisfaction","title":"Уточнить, доволен ли клиент работой системы"},
  {"key":"extra_needs","title":"Выяснить потребность в доп. функциях/обучении"},
  {"key":"prolongation_readiness","title":"Оценить готовность к разговору о пролонгации/допродаже"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_active_user' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_needs_prolongation', 'Нужна пролонгация', 1, true, '[
  {"key":"interest","title":"Уточнить интерес к пролонгации (да/нет/не определился)"},
  {"key":"terms","title":"Обсудить условия продления"},
  {"key":"doubts","title":"Выяснить причину сомнений, если есть"},
  {"key":"next_step","title":"Зафиксировать следующий шаг по продлению"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_needs_prolongation' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_volunteers', 'Волонтёры', 1, true, '[
  {"key":"need","title":"Уточнить задачу/потребность"},
  {"key":"action","title":"Определить дальнейшие действия"},
  {"key":"next_step","title":"Зафиксировать следующий шаг"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_volunteers' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_switched_other_software', 'Перешли на др. ПО', 1, true, '[
  {"key":"reason","title":"Выяснить причину перехода на другое ПО"},
  {"key":"which","title":"Уточнить, на какое именно решение перешли"},
  {"key":"note","title":"Зафиксировать причину в итоге разговора"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_switched_other_software' AND is_active);

INSERT INTO ai_sales_scripts (department_id, stage_key, name, version, is_active, steps)
SELECT NULL, 'service_no_prolongation', 'Без пролонгации', 1, true, '[
  {"key":"reason","title":"Уточнить причину отказа от продления"},
  {"key":"what_would_change","title":"Выяснить, что могло бы изменить решение"},
  {"key":"note","title":"Зафиксировать причину отказа"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ai_sales_scripts WHERE department_id IS NULL AND stage_key = 'service_no_prolongation' AND is_active);
