# Единая среда — AI Sales / Conversation Intelligence

AI-слой поверх Bitrix24: транскрипция и анализ звонков, оценка сделок и
менеджеров, рекомендации, AI-РОП. Встроен в существующую админку Next.js.

## Принципы

1. **Bitrix24 — источник истины по CRM.** Вторую CRM не создаём. Наша БД хранит
   только AI-данные и минимальные зеркала сущностей Bitrix для аналитики.
   Связь — через `bitrix_*_id`.
2. **Не ломаем существующее.** Переиспользуем стек: Next.js App Router, Timeweb
   PostgreSQL (`pg`, raw SQL, схема `es_app`), собственную auth/RBAC
   (`authFromBearer.ts`), паттерн route handlers, Vercel Cron, дизайн админки.
3. **Идемпотентность везде.** `bitrix_*_id UNIQUE`, `external_event_id`,
   `recording_hash`, `ai_call_analysis.input_hash`, `ai_jobs.idempotency_key`.
4. **Human-in-the-loop.** По умолчанию AI имеет READ + ANALYZE + RECOMMEND.
   Запись в Bitrix (WRITE/CRITICAL_WRITE) — только после подтверждения (или
   явной настройки `bitrix.auto_write`).
5. **Контроль стоимости.** Роутинг моделей (классификация → Haiku, глубокий
   анализ → Opus), кэш анализа по `input_hash`, версионирование промптов.

## Поток данных

```
Bitrix24 (REST webhook + telephony API)
   │  webhook-приёмник (быстрый ответ) → ai_bitrix_events → enqueue(ai_jobs)
   ▼
es_app.ai_*  (Timeweb PostgreSQL, raw SQL)
   │
   ├─ Очередь ai_jobs (FOR UPDATE SKIP LOCKED)
   │     дренаж: Vercel Cron → POST /api/ai-sales/jobs/drain (Bearer CRON_SECRET)
   │     jobs: bitrix.sync · call.ingest · call.transcribe · call.analyze ·
   │           deal.analyze · manager.analyze · ai.report · followup.check
   │
   ├─ lib/ai/           — провайдер Claude + Zod-схемы + версии промптов
   ├─ lib/transcription/— TranscriptionProvider (Whisper + TODO RU-STT)
   └─ lib/server/bitrix — BitrixService (read/sync/write)
   │
   ▼
/admin → раздел «AI Продажи» (вкладки AdminPanel), RBAC: admin/rop/manager/analyst
   │
   ▼
AI recommendations → подтверждение человеком → write-back в Bitrix24
```

## Ключевое решение: очередь на Postgres, а не BullMQ+Redis

Проект на **Vercel serverless** — постоянного воркер-процесса нет. Поэтому очередь
реализована на PostgreSQL (таблица `ai_jobs`, `FOR UPDATE SKIP LOCKED`) и
дренируется по расписанию **Vercel Cron** — тем же паттерном, что уже используют
`radar/refresh` и `bounces/scan`. Абстракция (`jobsDb.ts` + `jobRunner.ts`)
позволяет позже вынести дренаж в отдельный **Timeweb-воркер** (тот же `claimBatch`)
без переписывания продюсеров.

> ⚠️ **Деплой:** дренаж настроен на `* * * * *` (раз в минуту). Ежеминутный cron и
> 3-я cron-задача требуют тарифа Vercel **Pro** (на Hobby — максимум суточные
> крон-задачи). Альтернатива на Hobby — внешний планировщик, дергающий
> `/api/ai-sales/jobs/drain` с `Authorization: Bearer $CRON_SECRET`.

## Роли (RBAC)

Поверх `user_profiles.role`: `admin` (всё), `rop` (весь отдел), `manager`
(только свои звонки/сделки), `analyst` (аналитика без записи в CRM).
Хелперы — в `authFromBearer.ts` (`requireSalesAccess`, `requireRopAccess`,
`canWriteToCrm`).

## Статусная машина звонка

`PENDING → DOWNLOADING → TRANSCRIBING → TRANSCRIBED → ANALYZING → COMPLETED`
(+ `FAILED` / `RETRY_PENDING` / `NO_RECORDING`).

## Схема БД

`supabase/migrations/timeweb_ai_sales_schema.sql` — очередь, зеркала Bitrix
(`ai_managers/ai_companies/ai_contacts/ai_deals`), звонки и транскрипты
(`ai_calls/ai_call_participants/ai_transcripts/ai_transcript_segments`), анализ
(`ai_call_analysis`), теги (`ai_tags/ai_call_tags`), рекомендации
(`ai_recommendations`), follow-ups (`ai_followups`), синхронизация
(`ai_bitrix_sync_state/ai_bitrix_events`), настройки (`ai_settings`).

## Этапы

- **Этап 0 (готов):** миграция схемы, очередь, абстракции AI/STT, RBAC-роли,
  cron-дренаж, `.env.example`, этот документ.
- **Этап 1 (готов):** BitrixService (users/companies/contacts/deals + звонки из
  crm.activity), sync + webhook-приёмник, ingestion звонков, транскрипция
  (Yandex SpeechKit / Whisper), Claude-анализ, дашборд + список звонков +
  карточка звонка (аудио, транскрипт с таймкодами, AI-анализ).

  **Пайплайн звонка (по рабочему n8n-пайплайну клиента):**
  `ONCRMACTIVITYADD → webhook → call.ingest → crm.activity.get → FILES[0] →`
  `disk.file.get(DOWNLOAD_URL) → скачать mp3 → (Yandex) put в Object Storage →`
  `SpeechKit longRunningRecognize (start/poll) → сегменты → call.analyze (Claude) →`
  `deal/manager score, риски, next step → COMPLETED`.

  **STT:** по умолчанию Yandex SpeechKit v2 longRunning (async: start отдаёт
  operationId, poll драйвится очередью с runAfter — не блокируем serverless).
  Требует аудио в Yandex Object Storage — загрузка через минимальный SigV4-PUT
  (`lib/storage/objectStorage.ts`, без новых зависимостей). Альтернатива —
  Whisper (sync, буфер напрямую, без Object Storage).
- **Этап 2:** deal/manager score, чек-листы, теги, рекомендации.
- **Этап 3:** AI-РОП, follow-up engine, product intelligence, lost-deal.
- **Этап 4:** база знаний + RAG, AI-коуч, pre-call briefing.
- **Этап 5:** голосовой робот (пока только интерфейсы/схемы).

## Необходимые внешние credentials (для боевого запуска)

- `ANTHROPIC_API_KEY` — анализ Claude.
- `YANDEX_STT_API_KEY` + `YANDEX_FOLDER_ID` — Yandex SpeechKit (STT). Уже есть в
  рабочем n8n — можно переиспользовать те же значения.
- `YANDEX_S3_BUCKET` + `YANDEX_S3_ACCESS_KEY` + `YANDEX_S3_SECRET_KEY` — Object
  Storage для SpeechKit longRunning (аудио должно быть в бакете).
- `BITRIX24_WEBHOOK_URL` со scope `crm` **и `disk`** (запись звонка берётся из
  `crm.activity` FILES → `disk.file.get`). Плюс исходящий вебхук Bitrix на
  `/api/integrations/bitrix/webhook` с событием `ONCRMACTIVITYADD` и
  `BITRIX24_EVENT_TOKEN`.
- Тариф Vercel Pro (или внешний планировщик) — для ежеминутного дренажа.

> ℹ️ Альтернатива STT без Yandex: `TRANSCRIPTION_PROVIDER=whisper` + Whisper-
> совместимый endpoint — тогда Object Storage не нужен (аудио шлётся буфером).
