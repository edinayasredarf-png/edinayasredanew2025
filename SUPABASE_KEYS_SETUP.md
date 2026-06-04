# 🔑 Настройка ключей Supabase — пошаговая инструкция

## 📍 Шаг 1: Где найти ключи в Supabase

1. **Откройте Supabase Dashboard:**
   - Перейдите на https://supabase.com/dashboard
   - Войдите в свой аккаунт
   - Выберите ваш проект

2. **Перейдите в настройки API:**
   - В левом меню нажмите **Settings** (⚙️)
   - Выберите **API** в подменю

3. **Найдите нужные ключи:**

   Вы увидите раздел **"Project API keys"** с тремя ключами:

   ```
   ┌─────────────────────────────────────────┐
   │ Project API keys                        │
   ├─────────────────────────────────────────┤
   │ anon public                             │
   │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ ← это NEXT_PUBLIC_SUPABASE_ANON_KEY
   │                                         │
   │ service_role                            │
   │ [Reveal]                                │ ← нажмите, чтобы показать
   │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ ← это SUPABASE_SERVICE_ROLE_KEY
   │                                         │
   │ Project URL                              │
   │ https://xxxxx.supabase.co               │ ← это NEXT_PUBLIC_SUPABASE_URL
   └─────────────────────────────────────────┘
   ```

   **Важно:**
   - `anon public` — это **публичный** ключ (безопасно показывать в браузере)
   - `service_role` — это **секретный** ключ (только для сервера, НЕ показывайте в браузере!)
   - Нажмите кнопку **"Reveal"** рядом с `service_role`, чтобы увидеть ключ

---

## 📝 Шаг 2: Добавить ключи локально (в .env.local)

1. **Откройте файл `.env.local`** в корне проекта:
   ```
   /Users/user/Desktop/Проекты сайтов/в разработке/единая среда обновленный/frontend cursor 2/.env.local
   ```

2. **Добавьте или обновите следующие строки:**

   ```bash
   # URL вашего Supabase проекта (из раздела "Project URL")
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

   # Публичный ключ (anon public) — для клиентской части
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Секретный ключ (service_role) — только для сервера, для SEO
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Пример реального файла:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://ytevoelicxcecwpetcqj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZXZvZWxpY3hjZWN3cGV0Y3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMH0.xxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZXZvZWxpY3hjZWN3cGV0Y3FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAwfQ.xxxxx
   ```

3. **Сохраните файл** (Cmd+S / Ctrl+S)

4. **Перезапустите dev-сервер:**
   ```bash
   # Остановите текущий сервер (Ctrl+C)
   # Запустите заново:
   npm run dev
   ```

---

## ☁️ Шаг 3: Добавить ключи в Vercel (для продакшена)

1. **Откройте Vercel Dashboard:**
   - Перейдите на https://vercel.com/dashboard
   - Войдите в свой аккаунт
   - Выберите ваш проект

2. **Перейдите в настройки проекта:**
   - Нажмите на название проекта
   - В верхнем меню выберите **Settings**
   - В левом меню выберите **Environment Variables**

3. **Добавьте переменные окружения:**

   Для каждой переменной:
   - Нажмите кнопку **"Add New"**
   - В поле **Key** введите название переменной
   - В поле **Value** вставьте значение (скопируйте из Supabase)
   - Выберите окружения: **Production**, **Preview**, **Development** (или все три)
   - Нажмите **Save**

   **Добавьте эти 3 переменные:**

   | Key | Value | Окружения |
   |-----|-------|-----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Все |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Все |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Все |

4. **После добавления переменных:**
   - Vercel автоматически пересоберёт проект при следующем деплое
   - Или нажмите **"Redeploy"** в разделе **Deployments**, чтобы пересобрать сразу

---

## ✅ Проверка, что всё работает

### Локально:
1. Откройте консоль браузера (F12)
2. Перейдите на страницу с кейсами: `http://localhost:3000/cases`
3. В консоли не должно быть ошибок типа `Missing NEXT_PUBLIC_SUPABASE_URL`

### На Vercel:
1. Откройте ваш сайт на Vercel
2. Откройте исходный код страницы (View Page Source / Ctrl+U)
3. Найдите `<title>` — там должен быть заголовок кейса, а не просто "Кейс | Единая Среда"

---

## ⚠️ Важные замечания

1. **`.env.local` не коммитится в Git** — это нормально, он в `.gitignore`
2. **`SUPABASE_SERVICE_ROLE_KEY` — секретный ключ:**
   - НЕ добавляйте его в код
   - НЕ показывайте в браузере
   - Используется только на сервере для SEO
3. **Если ключи не работают:**
   - Проверьте, что скопировали ключи полностью (они очень длинные)
   - Убедитесь, что нет лишних пробелов
   - Перезапустите dev-сервер после изменения `.env.local`

---

## 🆘 Если что-то не работает

1. **Проверьте формат файла `.env.local`:**
   - Каждая переменная на новой строке
   - Нет пробелов вокруг `=`
   - Нет кавычек вокруг значений (если не требуется)

2. **Проверьте консоль браузера:**
   - Откройте DevTools (F12)
   - Вкладка Console
   - Ищите ошибки с упоминанием Supabase

3. **Проверьте логи Vercel:**
   - В Vercel Dashboard → Deployments → выберите последний деплой → Logs
   - Ищите ошибки с упоминанием `SUPABASE_SERVICE_ROLE_KEY`
