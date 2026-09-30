# AI Sales VPS-воркер

Отдельный Node-процесс на VPS (не Vercel), который обрабатывает
`call.roles` / `call.analyze` / `deal.analyze`, **только если** в
`ai_settings.ai.provider` выбран self-hosted LLM (GigaChat на llama.cpp).
На Vercel Hobby у функций жёсткий `maxDuration = 60` секунд, а CPU-
инференс на VPS занимает минуты — поэтому при self-hosted эти типы не
идут через Vercel-дренаж. При **YandexGPT / Claude** провайдер
облачный: те же задачи дренирует Vercel (ключи в env Vercel), VPS-
воркер простаивает — не нужно дублировать Yandex-ключи в
`/opt/ai-worker/.env`.

Использует тот же код обработчиков, что и Vercel
(`src/lib/server/aiSales/*`), просто выполняется через `tsx` напрямую
на VPS, а не как часть Next.js-приложения.

## Деплой на VPS (текущее состояние: 201.51.31.67)

```
/opt/ai-worker/
  worker.ts          — этот файл
  package.json        — этот файл (минимальный набор реально импортируемых пакетов)
  tsconfig.json        — этот файл (paths: "@/*" → "./src/*")
  src/lib/              — rsync-копия src/lib из основного репозитория
  node_modules/          — npm install по package.json
  .env                     — DATABASE_URL, SELFHOSTED_LLM_URL и т.п. (не в репозитории)
```

Обновление кода при изменениях в `src/lib/server/aiSales/*` или
`src/lib/ai/*`:

```bash
rsync -az -e "ssh -i <key>" src/lib/ root@201.51.31.67:/opt/ai-worker/src/lib/
ssh -i <key> root@201.51.31.67 systemctl restart ai-worker
```

(`worker.ts`/`package.json`/`tsconfig.json` меняются редко — при
изменении синхронизировать так же, из этой папки.)

## systemd-юниты (на VPS, не в репозитории)

- `ai-worker.service` — сам воркер. `WorkingDirectory=/opt/ai-worker`,
  `EnvironmentFile=/opt/ai-worker/.env`, `ExecStart=/usr/bin/npx tsx worker.ts`,
  `Restart=on-failure`.
- `llama-server.service` — `llama.cpp` `llama-server` с моделью
  GigaChat-20B-A3B-instruct-v1.5 (Q3_K_M, `/data/models/...gguf`),
  `--ctx-size 4096 --parallel 1 --threads 8 -ngl 0` (CPU-only). Без
  `MemoryMax` — cgroup-лимит душил page cache модели при генерации и
  проседал throughput на порядок (было выявлено на практике).
- `llama-server-restart.timer` / `.service` — перезапуск `llama-server`
  каждые 2 часа: RSS-память процесса заметно растёт за время работы
  (~4.6 → ~6.8GB за час на практике), причина не выяснена (похоже на
  накопление в самом llama.cpp), перезапуск — рабочее обходное решение.

## Известные особенности / грабли

- **Один слот генерации** (`--parallel 1`). Задачи обрабатываются
  строго последовательно — так и задумано, несколько параллельных
  запросов на этом железе только делят ресурсы и роняют друг друга в
  таймаут.
- **Не убивайте процесс через `pkill -f "tsx worker.ts"`** — реальная
  командная строка процесса (`node --require .../tsx/... worker.ts`)
  не содержит буквальной подстроки "tsx worker.ts" подряд, паттерн не
  матчит. Используйте `systemctl restart ai-worker` или `pkill -f worker.ts`.
- **Мягкий рестарт зависает.** `SIGTERM` не может прервать fetch,
  ожидающий ответ от `llama-server` — процесс висит в
  `deactivating (final-sigterm)` до `TimeoutStopSec` (systemd-дефолт),
  затем `SIGKILL`. Это нормально, просто рестарт занимает до ~90с.
- **При старте воркер сам реапит свои зависшие RUNNING-строки** (порог
  1 минута, только свои типы) — то, что осталось RUNNING на момент
  запуска, это гарантированно чужой (убитый) процесс, не наша текущая
  работа. Без этого такая строка «висела» бы в админке как
  «выполняется» до `REAP_MAX_MINUTES` (30 минут).
- **`SELFHOSTED_LLM_TIMEOUT_MS`** (опционально, по умолчанию 20 минут)
  — таймаут fetch на один запрос к LLM. Дефолтный таймаут Node/undici
  (~300с) слишком мал для CPU-инференса при retry-цепочках.
- Модель (Q3_K_M, сильно квантованная) иногда не выдаёт валидный JSON
  с первой попытки — либо дописывает "поправленную" версию после
  валидного JSON, либо в редких случаях вместо разметки продолжает
  диалог как транскрипт. Ретраи (3 попытки на уровне провайдера + 3 на
  уровне задачи) в норме вытягивают успешный результат за 1-2 попытки.
