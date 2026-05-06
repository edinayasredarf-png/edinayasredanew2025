# Переезд контента на Timeweb PostgreSQL

Этот проект уже переключен на чтение новостей/статей через:
- `/api/content/posts`
- `/api/content/news`

API сначала читает из Timeweb PostgreSQL (`TIMEWEB_POSTGRES_URL`), а при ошибке временно использует Supabase как fallback.

## 1) Создайте БД в Timeweb Cloud

Создайте кластер PostgreSQL и получите строку подключения:

`postgres://USER:PASSWORD@HOST:PORT/DBNAME`

## 2) Создайте таблицы

Запустите SQL из файла:

- `timeweb-postgres-content-schema.sql`

## 3) Заполните таблицы данными

Минимум нужно перенести:
- таблицу `posts`
- таблицу `news`

Колонки должны совпадать со схемой в SQL-файле.

## 4) Добавьте env в Vercel

В Project Settings -> Environment Variables:

- `TIMEWEB_POSTGRES_URL` = ваша строка подключения к Timeweb PostgreSQL

Рекомендуется оставить текущие Supabase-переменные на этапе миграции, чтобы fallback продолжал работать.

## 5) Проверьте API

После деплоя откройте:

- `/api/content/posts`
- `/api/content/news`

Ожидаемый ответ: `{ "items": [...] }` без `source: "supabase-fallback"`.

## 6) После стабилизации (опционально)

Когда Timeweb станет основным источником:
- убрать fallback на Supabase в API-роутах;
- удалить неиспользуемый код Supabase для контента (поэтапно).
