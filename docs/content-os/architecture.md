# Content OS — PHASE 1: архитектура

Основано на `docs/content-os/audit.md` (Phase 0). Email как канал —
**отложен** по решению владельца (2026-09-29); везде ниже помечен
`[ОТЛОЖЕНО]`, место под него оставлено, но не проектируется в деталях.

**Обновление 2026-09-29:** допущение №1 (Local LLM) закрыто явным решением
владельца — см. таблицу ниже. Остальные допущения (2, 4-10) пока в силе.

## Допущения по открытым вопросам аудита

Не все 10 пунктов REQUIRED INPUT получили явный ответ. Чтобы не блокировать
Phase 1 целиком, беру дефолт по каждому — везде самый дешёвый/обратимый
вариант, который не мешает потом перейти на более тяжёлый:

| # | Вопрос | Решение | Комментарий |
|---|---|---|---|
| 1 | Local LLM обязателен? | **Решено (2026-09-29): гибрид.** Локально — GigaChat-20B-A3B-instruct-v1.5 (self-hosted, новый VPS, `OpenAiCompatProvider`, уже есть в коде). Облако — Claude (уже работает) для задач, где локальной модели не хватит качества, и как fallback | Router (§2 ниже) решает какую задачу куда — не new-adapter «на будущее», а рабочая схема с первого дня |
| 2 | Судьба `cf_*` | **Не трогаю до Phase 2** | Чтение/запись через него не меняются, пока не спроектирована новая схема |
| 3 | Email-провайдер | `[ОТЛОЖЕНО]` целиком | — |
| 4 | Статус speech/pdf-service | Считаю «где-то развёрнуты, детали неизвестны» — новый VPS проектирую независимо от них | Полная изоляция и так была требованием (§1 ТЗ) |
| 5 | Хостер нового VPS | Timeweb (тот же, что БД — меньше задержки, единый биллинг) как рабочее предположение | Смена хостера не меняет архитектуру, только IP/DNS |
| 6 | Токены каналов | Отсутствуют — адаптеры пишутся как интерфейс + мок | §50 ТЗ прямо это разрешает |
| 7 | Firewall Timeweb DB под новый IP | Уточняется в Phase 3 (когда есть реальный IP) | Не блокирует проектирование |
| 8 | Толкование §13 (публичный доступ) | «Закрыт для неаутентифицированных запросов», не «недостижим из интернета» — иначе Vercel физически не достучится | Обосновано в audit.md §17 |
| 9 | n8n больше нигде не запущен | Считаю подтверждённым (нашёл только неразвёрнутую заготовку) | — |
| 10 | Судьба Telethon-заготовки | **Переиспользовать** `telegram_monitor.py` как референс для реального Telegram-мониторинга на новом VPS (не веб-скрейпинг) — детали в `integrations.md` | Код только читается как образец, не копируется вслепую |

Если что-то из этого неверно — поправьте, пересмотрю соответствующий раздел
точечно, не весь документ.

## 1. Общий принцип

Content OS **не новое приложение**, а новый раздел существующей админки
(`/admin/content`) плюс новый VPS для того, что физически не может жить в
Vercel serverless (долгие процессы, очередь, краулинг, n8n). Данные — та же
Timeweb Postgres, что и у всего остального сайта. Никакой отдельной CMS,
отдельного фронтенда, отдельной системы авторизации.

```
Next.js (Vercel)                         Новый VPS (Timeweb, Docker Compose)
├── /admin/content/*        ─┐           ├── reverse-proxy (Caddy/nginx)
│    (существующий admin,    │  HTTPS    ├── n8n            (webhook-триггеры)
│     та же авторизация)     │◄─────────►├── content-worker (Python/Node)
├── /api/content-os/*        │  Bearer   ├── crawler         (источники)
│    (Content API)          ─┘  token    ├── publishing-worker
└── src/lib/ai (AI Gateway,                └── monitoring (health-check)
     расширение существующего                        │
     LLMProvider)                                     │ DATABASE_URL (тот же CA,
        │                                              │  отдельный пул, см. database.md)
        └──────────────────────────────────────────────┘
                              │
                    Timeweb PostgreSQL
                (существующая БД сайта, новые таблицы content_*)
```

Vercel не имеет приватной сети до VPS — весь обмен идёт по публичному
HTTPS с Bearer-токеном, **тем же паттерном**, что уже проверен в проде для
`speech-service`/`pdf-service` (см. audit.md §17). Это не компромисс, а
единственный физически возможный вариант при текущем хостинге Next.js.

## 2. AI Gateway

**Обновлено 2026-10-03** — две вещи поменялись относительно первоначального
решения ниже:
1. VPS с self-hosted GigaChat удалена (см. `e67b9841` в AI Sales) — «local»
   провайдер в коде остался тем же классом (`OpenAiCompatProvider`, любой
   OpenAI-совместимый endpoint), но физически это теперь ожидается облачный
   шлюз (Timeweb AI Gateway и т.п.), не CPU-сервер. UI называет это «Шлюз»,
   не «локальная модель» — см. `SettingsTab.tsx`/`AiRoutingPanel.tsx`.
2. Маршрутизация задач → провайдер/модель больше не только хардкод в
   `TASK_ROUTES` (`router.ts`) — админ может переопределить на уровне
   компании через Settings → «Какая модель что пишет» (новая таблица
   `content_ai_task_routes`, читается в `resolveRoute()` до обращения к
   дефолту из кода). Список моделей шлюза — динамический, через
   `GET /api/content-os/settings/gateway-models` (тот же паттерн, что уже
   работал для AI Sales).

Не новая система с нуля — **расширение** `src/lib/ai` (`AiProvider`
интерфейс, `AnthropicProvider`/`YandexGptProvider`/`OpenAiCompatProvider`
уже существуют и уже используются в AI Sales и в контент-заводе, который
я строил в этой же сессии).

```ts
// src/lib/ai/interfaces.ts — уже есть generateStructured(), добавить:
interface AiProvider {
  generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>>;
  generateText(req: TextRequest): Promise<TextResult>;      // новое: свободный текст без схемы
  embed(req: EmbedRequest): Promise<EmbedResult>;           // новое
  classify<T extends string>(req: ClassifyRequest<T>): Promise<T>; // новое — через generateStructured с enum-схемой, тонкая обёртка
}
```

**Model Router** (§55 ТЗ) — реальный local/external router с первого дня
(допущение №1 закрыто 2026-09-29: гибрид). `local` — уже существующий
`OpenAiCompatProvider` (`SELFHOSTED_LLM_URL` → GigaChat-20B-A3B-instruct-v1.5
на новом VPS), не новый класс. Задачи распределены по сложности: дешёвые/
массовые — на local, задачи, где важно качество или нет уверенности в
локальной модели — на Claude:

```ts
// src/lib/ai/router.ts (новый файл)
type Provider = 'anthropic' | 'local';
const TASK_MODEL: Record<ContentOsTask, { provider: Provider; model?: string; fallback?: Provider }> = {
  topic_classification: { provider: 'local', fallback: 'anthropic' },       // дешёвая, массовая — GigaChat
  duplicate_detection:  { provider: 'local', fallback: 'anthropic' },       // + embed(), тоже массовая
  brand_check:          { provider: 'local', fallback: 'anthropic' },       // проверка правил — не творческая задача
  first_draft:          { provider: 'local', fallback: 'anthropic' },      // ЧЕРНОВИК статьи/поста — local, но обязательно AI Writer QA-этап на выходе (§9 architecture)
  channel_adaptation:   { provider: 'local', fallback: 'anthropic' },       // адаптация под платформу — тоже пробуем local первым
  research_synthesis:   { provider: 'anthropic', model: 'claude-opus-5' },  // сложный синтез — сразу облако, не тестируем local
  final_editorial:      { provider: 'anthropic', model: 'claude-opus-5' },  // финальная правка перед публикацией — облако
  seo_check:            { provider: 'local', fallback: 'anthropic' },
  fact_check:           { provider: 'anthropic', model: 'claude-sonnet-5' }, // + web research pack, см. §7 — требует точности
};
```

`fallback` — обязательное поле, не опция: если `local` недоступен
(`SELFHOSTED_LLM_URL` не настроен, таймаут, невалидный JSON, VPS лежит) —
автоматически уходим на `anthropic`, событие логируется в `content_ai_runs`
(`status='fallback'`, database.md §7) — ровно требование §60 исходного
ТЗ про Local LLM (fallback configurable/logged/observable). Пока GigaChat
физически не развёрнут (VPS ещё не куплен) — **все** задачи фактически
идут через fallback на Claude, и это нормально: код с первого дня пишется
под гибрид, переключение произойдёт само, когда появится `SELFHOSTED_LLM_URL`,
без правок бизнес-логики.

**Какие задачи не пробуем на local и почему:** `research_synthesis`,
`final_editorial`, `fact_check` — сразу на Claude. Это осознанное решение,
не временное: 20B/3.3B-активных модель в кванте — не тот класс, где стоит
рисковать качеством на задачах, где ошибка (неверный факт, слабая финальная
редактура) публикуется от имени компании. Для `first_draft`/
`channel_adaptation`/`brand_check`/классификации риск ниже — есть
человеческое утверждение (Human Approval, §7) после AI в любом случае.

**Бенчмарк перед боевым использованием (§67 исходного ТЗ):** прежде чем
переключить `first_draft` на `local` по умолчанию в проде — прогнать
реальные темы через GigaChat и Claude параллельно, сравнить вручную.
Router технически готов сразу, но дефолт для `first_draft` первое время
может стоять на `anthropic` с `local` только по явному флагу — переключение
дефолта на `local` после того, как качество подтверждено, а не наоборот.

**Privacy routing (§61–62 ТЗ)** — поле `dataClassification: 'PUBLIC' |
'INTERNAL' | 'CONFIDENTIAL'` на каждом AI-вызове с первого дня. Пока не
влияет на маршрут (все каналы контента — не конфиденциальные данные), но
задел готов на будущее (например, если сюда же когда-то подключат анализ
внутренних документов).

## 3. Content Cluster — центральная сущность

```
Topic (из Topic Hunter ИЛИ создана вручную)
   │
   ▼
Content Cluster (cluster_id)
   ├── ARTICLE   (content_item, свой content_id, свой статус)
   ├── TELEGRAM  (content_item)
   ├── VK        (content_item)
   ├── DZEN      (content_item)
   ├── MAX       (content_item)
   └── EMAIL     (content_item)  [ОТЛОЖЕНО]
```

Не каждая тема обязана порождать все каналы — выбор каналов на этапе
Content Brief (см. §7). Подробная схема — `database.md`.

## 4. Topic Hunter — не с нуля

Радар (`radar_triggers`/`radar_items`, `src/lib/server/radarFetch.ts`) уже
закрывает часть §19 ТЗ: source → source_item → категоризация → статус.
Чего не хватает относительно полного Topic Hunter:
- **дедупликация** (сейчас дедуп только по точному совпадению `link`, не по
  смыслу) — добавить через `embed()` + косинус (паттерн уже есть в AI Sales
  KB, см. audit.md §6);
- **кластеризация** тем в Content Cluster (сейчас каждый `radar_item` —
  независимая запись, у Content OS темы должны группироваться);
- **scoring по нескольким критериям** (сейчас только `relevance`/`popularity`
  вручную у топика в `cf_topics`, у радара вообще нет popularity) —
  собрать формулу: релевантность + популярность + свежесть + доверие
  источника + соответствие фокусной теме, как в требованиях исходного
  контент-завода (`ТРЕБОВАНИЯ-V2.md`, п.1).

Решение: **расширять радар**, не строить Topic Hunter параллельно с нуля —
он уже на проде, уже собирает RSS/Google News/Telegram (см. audit §7).
Добавляемые поля — в `database.md`.

## 5. Brand Knowledge Base

Переиспользовать паттерн `ai_kb_documents`/`ai_kb_chunks` (jsonb-эмбеддинги,
косинус в коде, без pgvector) — уже в проде для AI Sales, тот же масштаб
задачи (бренд-документы, примеры, правила). Отдельная таблица под Content
OS (`content_brand_documents`/`content_brand_chunks`) **с той же структурой**,
не общая с AI Sales (разные домены знаний, разный контроль доступа).
Коллекции по §65 ТЗ (`brand/products/company/editorial/seo/research/legal`)
— поле `category` на документе, как уже сделано в `ai_kb_documents.category`.

pgvector — не блокирует старт (см. audit §6). Пересмотреть, если объём
базы вырастет настолько, что косинус в коде станет заметно медленным
(измерить, не гадать).

## 6. Очередь и оркестрация

**Не Redis+BullMQ по умолчанию.** У проекта уже работает Postgres-очередь
(`ai_jobs`, `FOR UPDATE SKIP LOCKED`, дренаж кнопкой или внешним
планировщиком — см. audit §14, `docs/ai-sales/architecture.md`) — ровно та
же проблема (Vercel Hobby, 2 крона заняты), то же решение. Для Content OS:

- **Внутри Vercel** (быстрые, короткие операции — CRUD тем, ручная генерация
  одной версии контента по кнопке): прямой API route, без очереди.
- **На новом VPS** (n8n + Redis + workers) — для того, что реально долгое/
  массовое: краулинг источников, пакетная классификация, batch-генерация,
  email-рендер `[ОТЛОЖЕНО]`. Здесь Redis оправдан именно потому, что это
  постоянный процесс на VPS, не serverless — ограничение Vercel-очереди тут
  не действует.

n8n workflows (§31 ТЗ, список из 20) — реализовывать **по мере надобности**,
не все 20 сразу: MVP реально нужны `01_source_monitoring`,
`02_topic_extraction`, `06_research`, `08_article_generation`,
`12_channel_adaptation`, `17_publishing`. Остальные — когда до них дойдёт
очередь по `implementation-plan.md`.

## 7. Пайплайн производства контента (без email)

```
Source (RSS/Telegram/RSS — уже есть через радар)
  → Topic (расширенный радар, см. §4)
  → Content Brief (человек или AI-черновик брифа: аудитория, угол, каналы)
  → Research Pack (§22 ТЗ: search → sources → extract → verify → structure;
     для search — см. интеграции ниже)
  → AI Writer (генерирует ARTICLE)
  → Channel Adapter (по каждому выбранному каналу — TELEGRAM/VK/DZEN/MAX;
     переиспользует бренд-правила + платформенные настройки, почти то же,
     что я уже сделал в EditorTab.tsx контент-завода — логика адаптации
     под платформу останется, меняется модель данных вокруг неё)
  → Quality Control: Brand Check → SEO Check → Fact Check
  → Human Approval
  → Publication Engine → Channel (см. integrations.md — не всё сразу умеет
     публиковать автоматически, для каналов без токена — экспорт готового
     текста для ручной публикации, чтобы MVP не блокировался токенами)
  → Analytics
```

**Research Engine и веб-поиск (§22, §77 ТЗ)** — нужен источник поиска.
В проекте такого сейчас нет (не «придумывать API», §50 ТЗ) — открытый
вопрос для `integrations.md`: использовать веб-поиск через Anthropic-
инструмент (если доступен на используемом тарифе API) или отдельный
провайдер (Brave Search API, Google Custom Search и т.п.) — решить в
Phase 4, не блокирует Phase 1.

### 7.1 Автоматический режим (добавлено 2026-10-04)

Весь пайплайн §7 выше теперь может идти **без участия человека вплоть до
Human Approval** — `src/lib/server/contentOsAutoPipeline.ts`
(`autoProcessCompany`/`autoProcessAllCompanies`):

```
Источники → собрать (refreshContentOsSources)
  → для каждой новой записи: ИИ оценивает relevance 1-10
    (topic_classification, buildTopicAnalysisUserPrompt)
    → relevance < CONTENT_OS_AUTO_RELEVANCE_THRESHOLD (деф. 7): отклонить,
      source_item.status = 'dismissed', дальше не идёт
    → relevance >= порога: тема + кластер + бриф (аудитория по умолчанию
      «Широкая аудитория», каналы = все content_channel_profiles со
      статусом 'connected' у компании, иначе только 'article') создаются
      автоматически, черновик генерируется на каждый канал
      (generateChannelDraft — общая функция с ручной кнопкой
      «Сгенерировать», не дублирует промпты)
  → content_item.status = 'review' — специально НЕ 'approved'/'published'
```

**Явная граница (§18 исходного ТЗ, не отменено):** автоматика
останавливается на «готово к проверке». Публикация и финальное
утверждение остаются действием человека, пока владелец явно не попросит
убрать и этот барьер — решение принято 2026-10-04 как безопасный дефолт,
не как техническое ограничение (технически автопубликация в VK/Telegram
уже есть, см. `contentOsPublish.ts` — просто не вызывается из конвейера).

Запуск: `POST /api/content-os/cron/auto-process` с
`Authorization: Bearer $CRON_SECRET` (внешний планировщик, т.к. у Vercel
Hobby оба cron-слота заняты) — обрабатывает все компании; без заголовка
(обычная admin-сессия) — только активную компанию, для ручной проверки
(кнопка «🤖 Собрать и написать автоматически» в Sources).

## 8. Что происходит с уже построенным `/admin` → «Контент-завод»

Не удаляю сейчас (допущение №2 в таблице выше). Практически: новый раздел
Content OS будет жить по адресу `/admin/content` (§14 ТЗ), старый —
`/admin` → «Контент-завод» (то, что я построил ранее в этой сессии)
временно остаётся доступен параллельно. Когда база данных Phase 2 будет
готова и новый Content Hub (Phase 5) заработает — предложу конкретный план
переноса/удаления `cf_*`, не раньше.

## 9. Definition of Done — Phase 1

- [x] Архитектурная схема (этот документ).
- [x] AI Gateway/Model Router спроектированы поверх существующего `src/lib/ai`.
- [x] Content Cluster модель определена.
- [x] Явно зафиксированы допущения по нерешённым вопросам аудита.
- [ ] `database.md` — детальная схема (следующий документ).
- [ ] `infrastructure.md` — конфигурация VPS.
- [ ] `integrations.md` — адаптеры каналов + LLM.
- [ ] `security.md`.
- [ ] `implementation-plan.md` — и явный стоп перед Phase 2 (первые миграции).
