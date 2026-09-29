# Content OS — план реализации по фазам

Синхронизировано с §47 исходного ТЗ, с поправками: email-фаза сдвинута в
конец и помечена отложенной, фазы группируются так, чтобы каждая
заканчивалась чем-то проверяемым (lint/typecheck/build), не абстрактной
подцелью.

Перед **каждой** фазой с кодом (начиная с Phase 2) — по §49 ТЗ показываю:
цель → текущая архитектура → изменения → файлы → миграции → env vars →
security-последствия → rollback-план. Затем реализация → tests/lint/
typecheck/build. Не начинаю следующую фазу молча.

**Обновление 2026-09-29:** владелец указал, что первый проход (Phase 2/4/5
упрощённым срезом) не соответствовал ИА и функциям ТЗ — переделано
с явной ориентацией на §14 (разделы админки) и добавлением того, чего не
хватало (Sources, QC-пайплайн, Content Calendar, промпт-версионирование).
Ниже — актуальный статус.

| Phase | Содержание | Требует | Статус |
|---|---|---|---|
| 0 | Аудит | — | ✅ Готово (`audit.md`) |
| 1 | Архитектура | — | ✅ Готово, обновлено под допущение «гибрид GigaChat+Claude» |
| 2 | База данных | — | ✅ Готово: `content_topics/clusters/briefs/items/versions/channel_profiles/brand_documents/qc_checks/seo/research_packs/research_sources/fact_checks/publications/ai_runs`, `radar_triggers` расширен под Sources. `cf_*` (старый контент-завод) — удалён (владелец подтвердил) |
| 3 | Инфраструктура нового VPS | VPS куплен, доступ есть | Ждёт покупки VPS + хостера/бюджета — GigaChat пока работает только через fallback на Claude |
| 4 | Content API (`/api/content-os/*`) | Phase 2 | ✅ Готово — 21 роут: topics/sources/clusters/brief/items/qc/seo/fact-checks/research/plan/publications/channels/brand/stats/settings |
| 5 | Admin UI — вся ИА по §14 | Phase 4 | ✅ Готово: Dashboard/Ideas/Sources/Content Plan/Articles/Social/Brand/SEO/Research/Publications/Analytics/Settings |
| 6 | Brand Knowledge Base | Phase 2 | ✅ CRUD готов (без чанк-эмбеддингов — простой RAG, см. database.md §5). Наполнение реальными брендбук-документами — от вас |
| 7 | Topic Hunter (расширение радара) | Phase 2 | Частично: сбор/дедуп/кластеризация — через радар как раньше; добавлена AI-классификация темы (topic_classification). Дедупликация по смыслу (embeddings) — не сделана |
| 8 | Research Engine | Phase 7 | Частично: синтез pack готов (research_synthesis), но без автопоиска — источники добавляются вручную (нет поискового провайдера, `integrations.md` §2) |
| 9 | AI Writer | Phase 6, 8 | ✅ Готово — writer.md + per-channel файлы (telegram/vk/dzen/max.md), версионируются в `/prompts` |
| 10 | Brand/SEO/Fact checks | Phase 9 | ✅ QC-пайплайн готов (brand_check/seo_check/fact_check через AI Gateway, ручной запуск на каждом материале) |
| 11 | Channel adapters (без публикации) | Phase 9 | ✅ Готово — writer/channel-адаптация разделены (§21/§24 ТЗ: базовая статья → адаптация под площадку из её текста) |
| 12 | Публикация | Phase 11, Phase 3 (для VPS-воркера) | Частично: `content_publications` + ручная отметка «опубликовано» готовы (§29 идемпотентность — уникальный индекс item+channel). Автопубликация — ждёт токенов Telegram/VK/MAX/Дзен |
| 13 | Аналитика | Phase 12 | ✅ Dashboard/Analytics готовы (AI local/cloud/fallback, статусы контента/кластеров/публикаций). Метрики охвата/CTR с площадок — только после реальной публикации |
| 14 | Оптимизация/бенчмарки | Phase 9-13 в проде | — |
| 15 | Email-движок | `[ОТЛОЖЕНО]` владельцем | Явное решение вернуться к этой фазе |

## Что можно делать прямо сейчас, не дожидаясь VPS

Phase 2 (БД), Phase 4 (Content API), Phase 5 (Content Hub UI), Phase 6
(Brand KB), Phase 7 (расширение радара) — всё это живёт в существующем
Next.js/Vercel/Timeweb Postgres, **не требует нового VPS**. Реалистичный
следующий шаг: Phase 2 → 4 → 5 → 6 → 7, в этом порядке, VPS (Phase 3)
параллельно готовится отдельно (покупка/настройка), но не блокирует
разработку внутри существующего приложения.

Phase 8+ (Research через веб-поиск), Phase 12 (публикация в соцсети) —
упрутся в решения из `integrations.md` (поисковый провайдер, токены) —
не блокирует более ранние фазы, решается по мере подхода к ним.

## Definition of Done — MVP (адаптация §51 ТЗ, без email)

- [ ] Существующая админка сохранена, речевая аналитика не затронута.
- [ ] Новый VPS создан под Content OS (или явно решено, что пока не нужен —
      см. «что можно делать прямо сейчас» выше).
- [ ] Content OS изолирован от остального `/admin`.
- [ ] PostgreSQL/Timeweb-интеграция работает (переиспользуется, не новая).
- [ ] Content Hub (`/admin/content`) работает.
- [ ] Source monitoring работает (расширенный радар).
- [ ] Topic Hunter работает (дедуп + кластеризация + scoring).
- [ ] Brand Knowledge Base + RAG (jsonb-косинус) работает.
- [ ] Research работает (после выбора поискового провайдера).
- [ ] AI Writer работает.
- [ ] Brand/SEO/Fact checkers работают.
- [ ] Channel adapters — минимум сайт публикует по-настоящему, остальные —
      минимум готовят текст к ручной публикации.
- [ ] Publication history работает.
- [ ] Analytics foundation работает.
- [ ] AI cost tracking работает (`content_ai_runs`).
- [ ] Security checklist (`security.md`) пройден.
- [ ] Email — сознательно вне MVP, отдельная фаза 15 по отдельному сигналу.

## Следующий шаг

Жду вашего подтверждения по `database.md` (в первую очередь — судьба
`cf_*`, см. допущение №2 в `architecture.md`) — после этого перехожу к
Phase 2: пишу реальные `create table if not exists` + первый кусок
Content API, по одному связному куску за раз, с ревью перед каждым
(§49 ТЗ), не всё скопом.
