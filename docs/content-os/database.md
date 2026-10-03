# Content OS — PHASE 1: схема БД

Дизайн, не миграция. Ничего из этого не применяется к БД в Phase 1 — SQL
здесь для ревью, реальные `create table if not exists` пишутся в Phase 2
(тем же паттерном, что весь остальной проект — лениво в коде, без
миграционного фреймворка, см. audit.md §2). Схема — Timeweb PostgreSQL,
`public`, без pgvector (см. допущения в architecture.md).

Префикс `content_*` — отдельно от `cf_*` (мой прежний контент-завод),
`radar_*` (расширяется, не заменяется) и `ai_*` (AI Sales, не трогаем).

## Реконсиляция с уже существующим

| Существует сейчас | Судьба в Content OS |
|---|---|
| `radar_triggers`/`radar_items` | **Пересмотрено 2026-10-03: не трогаем вообще.** Изначально планировалось расширить — отменено владельцем, у Content OS теперь свои `content_sources`/`content_source_items` (см. §2) |
| `cf_rubrics` | Функция закрывается тегами/ключевыми словами на кластере (§4), отдельной таблицы рубрик в Content OS нет |
| `cf_topics` | Заменяется `content_topics`. Если решат мигрировать (открытый вопрос №2 в architecture.md) — 1:1 перенос полей, `radar_item_id` сохраняется |
| `cf_platforms` | Форма почти идеальна для `content_channel_profiles` (§5) — переносится с переименованием, не переписывается с нуля |
| `cf_plan_items`/`cf_plan_versions` | Заменяется `content_clusters`/`content_items` (§1, §3) |
| `cf_brand_settings` | Переносится как одна запись в `content_brand_documents` (`category='brand-quick-rules'`), полноценная база знаний строится рядом |
| `ai_kb_documents`/`ai_kb_chunks` | **Не трогаем** — свой домен (AI Sales). Content OS получает параллельные `content_brand_documents`/`_chunks` по той же структуре |

## 1. Content Cluster / Content Item

```sql
create table if not exists content_clusters (
  id text primary key,
  title text not null,
  primary_topic_id text references content_topics(id),
  status text not null default 'new',        -- new|briefed|in_production|review|done|archived
  created_by text,                            -- user id или 'ai'
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists content_briefs (
  id text primary key,
  cluster_id text not null references content_clusters(id) on delete cascade,
  audience text not null default '',
  angle text not null default '',             -- ракурс/угол подачи
  requirements text not null default '',
  channels jsonb not null default '[]',        -- ['article','telegram','vk',...]
  created_by text,
  created_at bigint not null
);

create table if not exists content_items (
  id text primary key,
  cluster_id text not null references content_clusters(id) on delete cascade,
  channel text not null,                       -- article|telegram|vk|dzen|max|email[отложено]
  status text not null default 'draft',        -- draft|review|approved|scheduled|published|failed
  title text not null default '',
  body text not null default '',               -- markdown/plain — не blocks-JSON (blocks только для email, отложено)
  meta jsonb not null default '{}',             -- канал-специфичные поля (для article — см. content_seo)
  approved_by text,
  approved_at bigint,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists content_item_versions (
  id text primary key,
  content_item_id text not null references content_items(id) on delete cascade,
  body text not null,
  edited_by text,                              -- user id или 'ai'
  note text not null default '',                -- что изменилось / почему (ручная правка vs regen)
  created_at bigint not null
);
create index if not exists content_item_versions_item_idx on content_item_versions (content_item_id, created_at desc);
```

**Почему `body text`, а не blocks-JSON, как для email в исходном ТЗ:**
для ARTICLE/TELEGRAM/VK/DZEN/MAX детерминированный рендер из блоков не
нужен — это не HTML с ограничениями почтовых клиентов, это обычный
текст/markdown, который редактор правит напрямую (как уже сделано в
`EditorTab.tsx` контент-завода). Blocks-модель — специфика email-движка
(§6 ТЗ) и появится вместе с ним, когда до него дойдёт очередь.

## 2. Темы и источники — своя лента, не радар

**Пересмотрено 2026-10-03 (отменяет решение ниже в §10.2 и в audit.md §7):**
владелец явно указал, что Content OS не должен зависеть от «Новостного
радара» — это отдельная функция админки, её таблицы (`radar_triggers`/
`radar_items`) и пайплайн (`radarFetch.ts`) трогать нельзя. Вместо
«расширения радара» сделаны собственные таблицы: `content_sources` (реестр
источников, замена `radar_triggers`) и `content_source_items` (собранная
лента, замена `radar_items`), свой парсер RSS/Google News/Telegram —
`src/lib/server/contentOsFetch.ts` (независимая копия логики, не импорт
`radarFetch.ts`), своя оркестрация опроса — `contentOsSourcePoll.ts`.
`content_topics.radar_item_id` оставлен как есть (legacy, уже мог быть
заполнен), новый код пишет `source_item_id` → `content_source_items(id)`.

```sql
create table if not exists content_sources (
  id text primary key,
  company_id text not null references content_companies(id),
  name text not null,
  type text not null default 'keyword',          -- keyword|rss|telegram|website
  query text not null default '',                 -- URL / ключевые слова / @канал
  priority int not null default 5,                -- 1..10, вес доверия
  active boolean not null default true,
  poll_interval int not null default 60,          -- минуты
  categories jsonb not null default '[]',
  tags jsonb not null default '[]',
  external_id text,
  last_polled_at bigint,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists content_source_items (
  id text primary key,                             -- sha1(link) — идемпотентно при повторном опросе
  source_id text not null references content_sources(id) on delete cascade,
  company_id text not null references content_companies(id),
  category text not null default 'other',
  title text not null default '',
  link text not null default '',
  source_name text not null default '',
  snippet text not null default '',
  published_at bigint not null default 0,
  status text not null default 'new',              -- new|used|dismissed
  created_at bigint not null
);
```

```sql
create table if not exists content_topics (
  id text primary key,
  title text not null,
  radar_item_id text,                               -- legacy, больше не пишется
  source_item_id text references content_source_items(id),  -- откуда пришла, если не создана вручную
  thesis text not null default '',
  relevance int not null default 5,             -- 1..10, ручная/AI-оценка
  popularity int not null default 50,           -- 1..100
  score numeric,                                 -- итоговый скоринг: relevance+popularity+свежесть+доверие+фокус (формула — Phase 4)
  status text not null default 'new',            -- new|clustered|briefed|done|dismissed
  created_by text,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists content_topic_dedup (
  id text primary key,
  topic_id text not null references content_topics(id) on delete cascade,
  duplicate_of_topic_id text not null references content_topics(id) on delete cascade,
  similarity numeric not null,                   -- косинус, 0..1
  decided_by text,                                -- 'ai' | user id — кто подтвердил дубликат
  created_at bigint not null
);
```

## 3. Research

```sql
create table if not exists content_research_packs (
  id text primary key,
  cluster_id text not null references content_clusters(id) on delete cascade,
  summary text not null default '',
  created_at bigint not null
);

create table if not exists content_research_sources (
  id text primary key,
  pack_id text not null references content_research_packs(id) on delete cascade,
  url text not null,
  title text not null default '',
  extracted_text text not null default '',
  verified boolean not null default false,
  created_at bigint not null
);
```

## 4. SEO и факт-чек

```sql
create table if not exists content_seo (
  content_item_id text primary key references content_items(id) on delete cascade,
  intent text,
  primary_keyword text,
  secondary_keywords jsonb not null default '[]',
  meta_title text,
  meta_description text,
  h1 text,
  faq jsonb not null default '[]',
  internal_links jsonb not null default '[]',
  schema_json jsonb,
  slug text
);

create table if not exists content_fact_checks (
  id text primary key,
  content_item_id text not null references content_items(id) on delete cascade,
  claim text not null,
  verdict text not null default 'unverified',   -- verified|unverified|false
  source_url text,
  checked_at bigint not null
);
```

## 5. Бренд, платформы

```sql
create table if not exists content_brand_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,                        -- brand|products|company|editorial|seo|research|legal|brand-quick-rules
  content text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists content_brand_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references content_brand_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding jsonb,
  created_at timestamptz not null default now()
);
create index if not exists content_brand_chunks_doc_idx on content_brand_chunks (document_id);

create table if not exists content_brand_feedback (
  id text primary key,
  content_item_id text references content_items(id) on delete set null,
  note text not null,
  created_by text,
  created_at bigint not null
);

-- Прямой перенос формы cf_platforms, другое имя:
create table if not exists content_channel_profiles (
  id text primary key,                            -- 'telegram' | 'vk' | 'dzen' | 'max' | 'article'
  name text not null,
  status text not null default 'setup',           -- connected|setup|manual|planned
  char_limit int not null default 4096,
  formality int not null default 50,
  emoji_level int not null default 1,
  hashtags boolean not null default false,
  hashtag_count int not null default 0,
  cta text not null default '',
  ai_prompt text not null default '',
  qa_notes text not null default '',
  sort_order int not null default 0
);
```

## 6. Публикация и аналитика

```sql
create table if not exists content_publications (
  id text primary key,
  content_item_id text not null references content_items(id) on delete cascade,
  channel text not null,
  external_id text,                               -- id поста на площадке, если известен
  url text,
  status text not null default 'pending',          -- pending|scheduled|published|failed
  scheduled_at bigint,
  published_at bigint,
  error text,
  retry_count int not null default 0,
  created_at bigint not null,
  updated_at bigint not null
);
-- Идемпотентность публикации (§29 ТЗ): один content_item в один channel — одна попытка публикации активной записи.
create unique index if not exists content_publications_item_channel_idx
  on content_publications (content_item_id, channel) where status <> 'failed';

create table if not exists content_analytics (
  id text primary key,
  publication_id text not null references content_publications(id) on delete cascade,
  period text not null,                            -- 'YYYY-MM-DD' срез на дату сбора
  views int, reach int, likes int, comments int, shares int, clicks int,
  ctr numeric,
  collected_at bigint not null
);
```

## 7. AI-наблюдаемость (§33, §70 ТЗ)

```sql
create table if not exists content_prompt_versions (
  id text primary key,
  task text not null,                              -- topic_classification|first_draft|seo_check|...
  version int not null,
  system_prompt text not null,
  user_template text not null,
  active boolean not null default true,
  created_at bigint not null
);

create table if not exists content_ai_runs (
  id text primary key,
  task text not null,
  prompt_version int,
  model text not null,
  provider text not null default 'anthropic',
  content_item_id text references content_items(id) on delete set null,
  data_classification text not null default 'INTERNAL',  -- PUBLIC|INTERNAL|CONFIDENTIAL, §61-62 ТЗ
  input_tokens int, output_tokens int,
  latency_ms int,
  cost numeric,
  status text not null default 'ok',                -- ok|error|fallback
  error text,
  created_at bigint not null
);
create index if not exists content_ai_runs_task_idx on content_ai_runs (task, created_at desc);
```

Это же — основа для дашборда стоимости (§35 ТЗ: cost this month / cost per
article / cost per cluster / cost per channel) — считается агрегацией по
`content_ai_runs`, отдельной таблицы под метрики стоимости не нужно.

## 8. Email `[ОТЛОЖЕНО]`

Не проектирую сейчас: `email_templates`, `email_campaigns`,
`email_content_blocks` (design-system компоненты §6 ТЗ), `email_analytics`.
Когда вернёмся к email — эти таблицы естественно встают рядом с
`content_items` (channel='email' сюда не пойдёт, у email будет собственная
модель данных из-за blocks-JSON/HTML-рендера, не text-body).

## 10. Мультикомпанийность (добавлено 2026-10-03)

Владелец подтвердил: нужна поддержка нескольких брендов/клиентов. Уточнена
модель — **внутреннее разделение**, не агентский SaaS с внешними логинами:
всеми компаниями управляет одна и та же команда через существующую админку,
у клиентов **нет** собственного входа. Это сильно упрощает задачу — не
нужна отдельная система организаций/ролей/прав-на-организацию (как у
Postmill/Postiz), достаточно **измерения `company_id`** поверх уже
спроектированных таблиц, доступ остаётся как есть (`requireAdminAccess`
видит все компании, без нового слоя авторизации).

**Поправка (была ошибка выше):** в момент написания этого раздела
предполагалось, что таблицы `content_*` ещё нигде не созданы — это
оказалось неверно: `src/lib/server/contentOsDb.ts` уже содержит реальные
`create table if not exists` для всех таблиц из §1-8 (тот же ленивый
паттерн, что у `radar_*`/`letters_*`), и `implementation-plan.md` отмечает
Phase 2 как «✅ Готово». То есть таблицы, вероятно, уже существуют на
Timeweb Postgres. Добавление `company_id` поэтому делается как настоящая
миграция с безопасным дефолтом (`alter table ... add column company_id
... default 'edinaya-sreda'`, затем снять default после бэкфилла), а не
«чистый лист» — на случай, если в них уже есть реальные строки.

### 10.1 Новая таблица

```sql
create table if not exists content_companies (
  id text primary key,
  name text not null,
  slug text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at bigint not null,
  updated_at bigint not null
);
create unique index if not exists content_companies_slug_idx on content_companies (slug);
```

Первая строка — сама ЕдинаяСреда (дефолтная компания, на неё переносится
всё, что уже есть в радаре/AI Sales при будущей интеграции).

### 10.2 Какие таблицы получают `company_id`, какие — нет

**Получают `company_id not null references content_companies(id)`** —
данные, которые принципиально различаются между брендами:

- `content_clusters` (и транзитивно — `content_briefs`, `content_items`,
  `content_item_versions`, `content_seo`, `content_fact_checks`,
  `content_research_packs`/`_sources` живут через `cluster_id`, отдельного
  `company_id` на них не нужно — не дублируем то, что выводится join'ом)
- `content_topics` (и `content_topic_dedup` — через `topic_id`)
- `content_brand_documents` (и `content_brand_chunks` — через `document_id`)
  — **ключевое**: Brand Voice RAG должен быть изолирован по компании, иначе
  AI подмешает тон/правила чужого бренда
- `content_brand_feedback`
- `content_channel_profiles` — у каждой компании свои каналы/токены
  (уникальность теперь `(company_id, id)`, не глобальный `id`, т.к. у двух
  компаний может быть свой `telegram`)
- `content_publications` (через `content_item_id` → `cluster_id` → компания,
  явного столбца не нужно)
- `content_analytics` (через `publication_id`, аналогично)
- `content_ai_runs` — **добавить `company_id`** явно (не через join), чтобы
  считать стоимость AI по каждой компании отдельно (нужно для внутренней
  экономики по клиентам)
- `content_sources`/`content_source_items` (свой Topic Hunter, см. §2 —
  больше не радар) — источники мониторинга тоже свои на компанию (у разных
  брендов разные ниши/конкуренты); уже реализовано с `company_id` сразу,
  не отдельной миграцией

**НЕ получают `company_id`** — остаются общими на всю систему:

- `content_prompt_versions` — это промпты уровня задачи (`first_draft`,
  `seo_check` и т.п.), не бренда. Стиль конкретной компании приходит через
  RAG-контекст (`content_brand_documents`), который подмешивается в тот же
  промпт — не плодим копии одного и того же промпта на каждую компанию.

### 10.3 Последствия для уже спроектированного API/UI

- Все 21 роут `/api/content-os/*` — добавить обязательный параметр/фильтр
  `companyId` (query или часть пути, напр. `/api/content-os/companies/:id/topics`).
  Авторизация не меняется (`requireAdminAccess` достаточно — клиентского
  доступа нет).
- В админке — переключатель компании (как workspace-свитчер) в шапке
  `ContentOs.tsx`, все 13 вкладок фильтруются по выбранной компании.
  `BrandTab.tsx`/`ChannelsTab.tsx` — редактируются в контексте одной
  компании, не общие на всех.
- Новая вкладка **«Компании»** в Settings — CRUD над `content_companies`.
- Дашборд (`DashboardTab.tsx`) — имеет смысл дать два режима: по выбранной
  компании и сводный по всем (агрегация `content_ai_runs`/`content_analytics`
  по `company_id`) — полезно для внутренней экономики, не только для
  клиентского отчёта.

### 10.4 Definition of Done — мультикомпанийность

- [x] `content_companies` создана, дефолтная запись = ЕдинаяСреда.
- [x] Таблицы из §10.2 получили `company_id` (включая `content_channel_profiles`
      — потребовался composite PK `(company_id, id)`, см. код).
- [x] API получает активную компанию из cookie (`content_os_company`,
      `getActiveCompanyId`), не угадывает из сессии/домена — но и не из
      явного параметра в каждом запросе (осознанный выбор ради не-переписывания
      всех ~25 функций `contentOsStore.ts`, см. комментарий в
      `contentOsCompany.ts`).
- [x] UI: свитчер компании в шапке `ContentOs.tsx` + вкладка управления
      компаниями (`CompaniesPanel.tsx` в Settings).
- [x] Изоляция RAG: `content_brand_documents` фильтруется по `company_id`
      в `dbListBrandDocuments` — бренд-войс одной компании не попадает в
      выборку для другой.
- [x] `dbLogAiRun` получает `companyId` от всех 4 роутов генерации
      (`items/generate`, `items/:id/qc`, `topics/:id/classify`,
      `clusters/:id/research`) через `generateForTask({ companyId })` →
      `src/lib/ai/router.ts`. Заодно исправлено: `items/generate` и
      `items/:id/qc` до этого читали `dbListChannelProfiles()`/
      `dbListBrandDocuments()` без компании вообще — генерация для второй
      компании молча использовала профили/бренд-войс компании по умолчанию.

## 11. Definition of Done — раздел database.md (сводная, п.1-10)

- [x] Схема покрывает все сущности §16 ТЗ, кроме email (отложено осознанно).
- [x] Явная реконсиляция со всем, что уже есть в БД — ничего не дублируется
      без причины.
- [x] AI observability (§33/§70) заложена с первой таблицы, не добавляется
      задним числом.
- [x] Мультикомпанийность учтена в схеме до первого реального `create table`
      (см. §10).
- [ ] Реальные `create table` — только в Phase 2, после подтверждения этого
      документа.
