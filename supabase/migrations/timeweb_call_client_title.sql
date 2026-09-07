-- Название клиента для звонков по ЛИДУ (лиды отдельно не синхронизируем,
-- поэтому подтягиваем название лида из Bitrix при заведении звонка).
alter table ai_calls add column if not exists client_title text;
