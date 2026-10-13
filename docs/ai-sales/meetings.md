# Встречи ВКС (МТС Линк): запись → расшифровка → роли → анализ

**Поток** (`src/lib/server/aiSales/meetingService.ts`):
1. `meeting.sync` (каждые 30 мин из `scheduleBriefScan`, либо кнопкой): `GET /records` → новые записи в `ai_meetings` (короче `meetings.minDurationSec` — SKIPPED).
2. `meeting.process` (конвейер на одной задаче с самоповтором): `POST /records/{id}/conversions` (MP4, 720) → опрос `GET /records/conversions/{id}` → `GET /fileSystem/file/{id}` (`downloadUrl`) → распознавание через `TRANSCRIPTION_PROVIDER` (self-hosted STT получает ссылку на MP4 и сам достаёт звук через ffmpeg) → сегменты в `ai_meeting_segments`.
   Звонки в приоритете: распознавание встречи стартует, только когда нет `call.transcribe/call.diarize` в очереди.
3. `meeting.analyze`: роли участников (Сотрудник/Клиент, по первым репликам), тип встречи (ручной → ключевые слова названия → ИИ → «по умолчанию»), анализ по промту и скрипту типа. Длинные встречи (>60 тыс. символов) — по частям.

**Типы встреч** (`ai_meeting_types`): название, описание, ключевые слова, промт анализа, скрипт (шаги чек-листа), «по умолчанию».
Стандартные 4 типа засеваются при первом обращении (`src/lib/ai/prompts/meetingPrompts.ts`); правятся в Речевая аналитика → Настройка → Встречи.

**Нужно в окружении:** `MTS_LINK_API_KEY` (ЛК МТС Линк → «API», тариф PRO/Enterprise/Total; заголовок `x-auth-token`);
необязательно `MTS_LINK_API_BASE` (по умолчанию `https://userapi.mts-link.ru/v3`). Модель анализа: настройка `ai.model.meeting`
(пусто — модель анализа звонков).

**Доступ:** РОП и админ. **API:** `/api/ai-sales/meetings` (+ `[id]`, `types`, `sync`, `test`).
