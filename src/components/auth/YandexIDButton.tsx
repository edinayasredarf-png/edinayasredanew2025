'use client';

import { useEffect, useRef } from 'react';
import { authStore } from '@/lib/authStore';

declare global {
  interface Window {
    YaAuthSuggest: {
      init: (
        params: object,
        origin: string,
        options: object
      ) => Promise<{ handler: () => Promise<unknown> }>;
    };
  }
}

interface YandexIDButtonProps {
  onSuccess: () => void;
  onError?: (msg: string) => void;
}

export default function YandexIDButton({ onSuccess, onError }: YandexIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
    if (!clientId) {
      onError?.('NEXT_PUBLIC_YANDEX_CLIENT_ID не настроен');
      return;
    }

    const containerId = 'ya-auth-suggest-container';
    if (containerRef.current) containerRef.current.id = containerId;

    const initSDK = () => {
      if (!window.YaAuthSuggest || !containerRef.current) return;
      initialized.current = true;

      window.YaAuthSuggest.init(
        {
          client_id: clientId,
          response_type: 'token',
          redirect_uri: `${window.location.origin}/auth/callback?provider=yandex`,
        },
        window.location.origin,
        {
          view: 'button',
          parentId: containerId,
          buttonView: 'main',
          buttonTheme: 'light',
          buttonSize: 'm',
          buttonBorderRadius: 12,
        }
      )
        .then(({ handler }) => handler())
        .then(async (data: any) => {
          try {
            const accessToken = data?.access_token || data?.token;
            if (!accessToken) throw new Error('Не удалось получить токен Яндекс');

            // Получаем профиль пользователя через Яндекс API
            const infoRes = await fetch('https://login.yandex.ru/info?format=json', {
              headers: { Authorization: `OAuth ${accessToken}` },
            });
            if (!infoRes.ok) throw new Error('Ошибка получения профиля Яндекс');
            const info = await infoRes.json();

            // Создаём/обновляем сессию на сервере
            const authRes = await fetch('/api/auth/oauth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'yandex',
                providerId: String(info.id || ''),
                email: info.default_email || info.emails?.[0] || null,
                name: `${info.first_name || ''} ${info.last_name || ''}`.trim() || info.display_name || null,
                avatarUrl: info.default_avatar_id
                  ? `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`
                  : null,
              }),
            });

            if (!authRes.ok) {
              const err = await authRes.json();
              throw new Error(err.error || 'Ошибка входа через Яндекс');
            }

            await authStore.refreshSession();
            onSuccess();
          } catch (e: any) {
            onError?.(e?.message || 'Ошибка входа через Яндекс');
          }
        })
        .catch((err: Error) => onError?.(err?.message || 'Ошибка Яндекс ID'));
    };

    if (window.YaAuthSuggest) {
      initSDK();
    } else {
      const s = document.createElement('script');
      s.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js';
      s.onload = initSDK;
      document.head.appendChild(s);
    }
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
