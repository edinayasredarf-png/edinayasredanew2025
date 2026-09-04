-- Пословные таймкоды сегмента (Yandex v3) — нужны для пословного выравнивания
-- реплик со спикерами pyannote (гибридная диаризация, WhisperX-подход).
alter table ai_transcript_segments add column if not exists words jsonb;
