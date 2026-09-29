-- Удаление таблиц старого модуля «Контент-завод» (cf_*), выпиленного из
-- кода 2026-09-29 — заменяется на Content OS (см. docs/content-os/).
-- Код, который их читал/писал, уже удалён — таблицы инертны, но лучше
-- убрать явно, а не оставлять мёртвыми. Выполнить вручную через SQL-консоль
-- Timeweb (нет DATABASE_URL в этой среде, чтобы прогнать автоматически).

drop table if exists cf_plan_versions;
drop table if exists cf_plan_items;
drop table if exists cf_topics;
drop table if exists cf_platforms;
drop table if exists cf_rubrics;
drop table if exists cf_brand_settings;
