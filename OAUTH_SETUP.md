# Настройка OAuth 2.0 для Яндекс и ВКонтакте

## Переменные окружения

Добавьте следующие переменные в ваш `.env.local` файл:

```env
# Яндекс OAuth
NEXT_PUBLIC_YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret

# ВКонтакте OAuth
NEXT_PUBLIC_VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret

# Supabase (уже должно быть настроено)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Настройка Яндекс OAuth

1. Перейдите на [Яндекс OAuth](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Укажите Redirect URI: `http://localhost:3000/auth/callback?provider=yandex` (для разработки)
4. Для продакшена: `https://yourdomain.com/auth/callback?provider=yandex`
5. Скопируйте Client ID и Client Secret
6. Добавьте их в `.env.local`

## Настройка ВКонтакте OAuth

1. Перейдите в [Настройки приложения ВКонтакте](https://vk.com/apps?act=manage)
2. Создайте новое приложение (тип: "Веб-сайт")
3. В настройках приложения укажите:
   - Redirect URI: `http://localhost:3000/auth/callback?provider=vk` (для разработки)
   - Для продакшена: `https://yourdomain.com/auth/callback?provider=vk`
4. Скопируйте Application ID (это Client ID)
5. Создайте Client Secret в настройках приложения
6. Добавьте их в `.env.local`

## Как это работает

1. Пользователь нажимает кнопку "Войти через Яндекс" или "Войти через ВКонтакте"
2. Происходит редирект на страницу авторизации провайдера
3. После успешной авторизации пользователь возвращается на `/auth/callback?provider=yandex` (или `vk`)
4. Сервер обменивает authorization code на access token
5. Получает информацию о пользователе (email, имя, аватар)
6. Создает или обновляет пользователя в Supabase через Admin API
7. Отправляет magic link на email для завершения входа

## Примечания

- Для работы требуется `SUPABASE_SERVICE_ROLE_KEY` для создания пользователей через Admin API
- После OAuth авторизации пользователю отправляется magic link на email для завершения входа
- Профиль пользователя создается автоматически через триггер `handle_new_user` в Supabase

