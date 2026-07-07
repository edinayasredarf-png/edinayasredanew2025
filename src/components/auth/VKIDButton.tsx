'use client';

import { useEffect, useRef } from 'react';
import { authStore } from '@/lib/authStore';

interface VKIDButtonProps {
  onSuccess: () => void;
  onError?: (msg: string) => void;
}

declare global {
  interface Window { VKIDSDK: any; }
}

export default function VKIDButton({ onSuccess, onError }: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const initSDK = () => {
      if (!window.VKIDSDK || !containerRef.current) return;
      initialized.current = true;

      const VKID = window.VKIDSDK;

      VKID.Config.init({
        app: 54647124,
        redirectUrl: `${window.location.origin}/auth/callback`,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      });

      const oneTap = new VKID.OneTap();

      oneTap
        .render({
          container: containerRef.current,
          showAlternativeLogin: true,
        })
        .on(VKID.WidgetEvents.ERROR, (error: any) => {
          console.error('VKID error:', error);
          onError?.(error?.message || `Ошибка VK ID (код ${error?.code ?? '?'})`);
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          try {
            const data: any = await VKID.Auth.exchangeCode(payload.code, payload.device_id);

            // VK ID 2.x: exchangeCode отдаёт токены (user_id), профиль — через userInfo.
            let user: any = data?.user || null;
            const accessToken = data?.access_token;
            if (!user && accessToken && typeof VKID.Auth.userInfo === 'function') {
              try {
                const info = await VKID.Auth.userInfo(accessToken);
                user = info?.user || info || null;
              } catch { /* профиль опционален */ }
            }

            const providerId = String(user?.id || data?.user_id || '');
            if (!providerId) throw new Error('ВК не вернул идентификатор пользователя');

            const res = await fetch('/api/auth/oauth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'vk',
                providerId,
                email: user?.email || null,
                name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || null,
                avatarUrl: user?.avatar || null,
              }),
            });

            if (!res.ok) {
              const err = await res.json();
              onError?.(err.error || 'Ошибка входа через ВК');
              return;
            }

            await authStore.refreshSession();
            onSuccess();
          } catch (e: any) {
            onError?.(e?.message || 'Ошибка входа через ВК');
          }
        });
    };

    if (window.VKIDSDK) {
      initSDK();
    } else {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@vkid/sdk@2.6.5/dist-sdk/umd/index.js';
      s.onload = initSDK;
      document.head.appendChild(s);
    }
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
