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
| `radar_triggers`/`radar_items` | **Расширяется**, не заменяется — источник для `content_topics` (см. §2) |
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

## 2. Темы — расширение радара

```sql
-- Новые поля в radar_items (alter, не пересоздание — данные не теряются):
alter table radar_items add column if not exists popularity int;          -- 1..100, если известно
alter table radar_items add column if not exists trust_weight int;        -- наследуется от триггера/источника
alter table radar_items add column if not exists embedding jsonb;         -- для дедупликации по смыслу (§4 architecture.md)
alter table radar_items add column if not exists cluster_id text;         -- если объединена в тему

create table if not exists content_topics (
  id text primary key,
  title text not null,
  radar_item_id text references radar_items(id),  -- откуда пришла, если не создана вручную
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

## 9. Definition of Done — раздел database.md

- [x] Схема покрывает все сущности §16 ТЗ, кроме email (отложено осознанно).
- [x] Явная реконсиляция со всем, что уже есть в БД — ничего не дублируется
      без причины.
- [x] AI observability (§33/§70) заложена с первой таблицы, не добавляется
      задним числом.
- [ ] Реальные `create table` — только в Phase 2, после подтверждения этого
      документа.
