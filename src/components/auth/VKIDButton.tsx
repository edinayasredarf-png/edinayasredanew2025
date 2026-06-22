'use client';

import { useEffect, useRef } from 'react';
import { authStore } from '@/lib/authStore';

interface VKIDButtonProps {
  onSuccess: () => void;
  onError?: (msg: string) => void;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

export default function VKIDButton({ onSuccess, onError }: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const appId = process.env.NEXT_PUBLIC_VK_CLIENT_ID;
    if (!appId) {
      onError?.('VK_CLIENT_ID не настроен');
      return;
    }

    const initSDK = () => {
      if (!window.VKIDSDK || !containerRef.current) return;
      initialized.current = true;

      const VKID = window.VKIDSDK;

      VKID.Config.init({
        app: Number(appId),
        redirectUrl: typeof window !== 'undefined' ? window.location.origin + '/auth/callback?provider=vk' : '',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'email',
      });

      const oneTap = new VKID.OneTap();
      oneTap
        .render({
          container: containerRef.current,
          showAlternativeLogin: false,
          styles: { borderRadius: 12 },
        })
        .on(VKID.WidgetEvents.ERROR, (err: any) => {
          onError?.(err?.message || 'Ошибка VK ID');
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          try {
            const data = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
            // data.user contains VK user info
            const user = data?.user;
            const res = await fetch('/api/auth/oauth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: 'vk',
                providerId: String(user?.id || payload.user_id || ''),
                email: user?.email || null,
                name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || null,
                avatarUrl: user?.avatar || null,
              }),
            });
            if (!res.ok) {
              const err = await res.json();
              onError?.(err.error || 'Ошибка входа');
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
      const script = document.querySelector('script[src*="vkid"]') ||
        document.querySelector('script[src*="@vkid"]');
      if (script) {
        script.addEventListener('load', initSDK);
      } else {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
        s.onload = initSDK;
        document.head.appendChild(s);
      }
    }
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
