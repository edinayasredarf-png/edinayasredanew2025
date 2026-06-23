'use client';

import { useEffect, useRef } from 'react';
import * as VKID from '@vkid/sdk';
import { authStore } from '@/lib/authStore';

interface VKIDButtonProps {
  onSuccess: () => void;
  onError?: (msg: string) => void;
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export default function VKIDButton({ onSuccess, onError }: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    VKID.Config.init({
      app: 54647124,
      redirectUrl: 'https://единаясреда.рф/',
      state: generateState(),
      codeVerifier: generateCodeVerifier(),
      scope: '',
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
    });

    const oneTap = new VKID.OneTap();

    oneTap
      .render({ container: containerRef.current })
      .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
        console.error('VKID error:', error);
        const e = error as { message?: string; code?: number };
        onError?.(e?.message || `Ошибка VK ID (код ${e?.code ?? '?'})`);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
        try {
          const data = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
          const user = (data as { user?: { id?: number; first_name?: string; last_name?: string; email?: string; avatar?: string } })?.user;

          const res = await fetch('/api/auth/oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'vk',
              providerId: String(user?.id || ''),
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
        } catch (e: unknown) {
          const err = e as { message?: string };
          onError?.(err?.message || 'Ошибка входа через ВК');
        }
      });
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
