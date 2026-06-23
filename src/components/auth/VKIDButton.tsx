'use client';

import { useEffect, useRef } from 'react';
import * as VKID from '@vkid/sdk';

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

export default function VKIDButton({ onSuccess: _onSuccess, onError }: VKIDButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    // Сохраняем для callback страницы
    localStorage.setItem('oauth_provider', 'vk');
    localStorage.setItem('vk_state', state);
    localStorage.setItem('vk_code_verifier', codeVerifier);

    VKID.Config.init({
      app: 54647124,
      redirectUrl: 'https://единаясреда.рф/auth/callback',
      state,
      codeVerifier,
      scope: '',
    });

    const oneTap = new VKID.OneTap();

    oneTap
      .render({ container: containerRef.current })
      .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
        console.error('VKID error:', error);
        const e = error as { message?: string; code?: number };
        onError?.(e?.message || `Ошибка VK ID (код ${e?.code ?? '?'})`);
      });
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
