-- =============================================================================
-- ОЧИСТКА ошибочного прогона v1 миграции AI Sales (с префиксом es_app.).
--
-- Зачем: v1 создавала таблицы в схеме es_app, но приложение и user_profiles у вас
-- в схеме public. Часть таблиц ai_* успела создаться в es_app «не туда» — их надо
-- удалить, затем выполнить исправленный timeweb_ai_sales_schema.sql (v2, bare-имена).
--
-- БЕЗОПАСНО: удаляем ТОЛЬКО ai_*-таблицы в схеме es_app. Схему es_app и остальные
-- объекты не трогаем. Если es_app.ai_* нет — команды просто ничего не сделают.
--
-- Выполнить ПЕРЕД повторным прогоном timeweb_ai_sales_schema.sql.
-- =============================================================================

DROP TABLE IF EXISTS es_app.ai_call_tags CASCADE;
DROP TABLE IF EXISTS es_app.ai_call_analysis CASCADE;
DROP TABLE IF EXISTS es_app.ai_transcript_segments CASCADE;
DROP TABLE IF EXISTS es_app.ai_transcripts CASCADE;
DROP TABLE IF EXISTS es_app.ai_call_participants CASCADE;
DROP TABLE IF EXISTS es_app.ai_calls CASCADE;
DROP TABLE IF EXISTS es_app.ai_recommendations CASCADE;
DROP TABLE IF EXISTS es_app.ai_followups CASCADE;
DROP TABLE IF EXISTS es_app.ai_tags CASCADE;
DROP TABLE IF EXISTS es_app.ai_deals CASCADE;
DROP TABLE IF EXISTS es_app.ai_contacts CASCADE;
DROP TABLE IF EXISTS es_app.ai_companies CASCADE;
DROP TABLE IF EXISTS es_app.ai_managers CASCADE;
DROP TABLE IF EXISTS es_app.ai_jobs CASCADE;
DROP TABLE IF EXISTS es_app.ai_bitrix_sync_state CASCADE;
DROP TABLE IF EXISTS es_app.ai_bitrix_events CASCADE;
DROP TABLE IF EXISTS es_app.ai_settings CASCADE;

SELECT 'es_app ai_* cleanup done' AS status;
