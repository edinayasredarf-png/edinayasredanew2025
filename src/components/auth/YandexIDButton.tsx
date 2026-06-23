'use client';

import { useEffect, useRef } from 'react';

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
  onSuccess: (data: unknown) => void;
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
        .then((data) => onSuccess(data))
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
