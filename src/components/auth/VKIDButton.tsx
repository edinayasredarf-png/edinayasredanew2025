'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem('oauth_provider', 'vk');
    localStorage.setItem('vk_code_verifier', codeVerifier);

    VKID.Config.init({
      app: 54647124,
      redirectUrl: 'https://единаясреда.рф/auth/callback',
      state,
      codeVerifier,
      scope: '',
    });
  }, []);

  const handleLogin = () => {
    try {
      VKID.Auth.login();
    } catch (e: unknown) {
      const err = e as { message?: string };
      onError?.(err?.message || 'Ошибка запуска VK ID');
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 px-4 py-[13px] bg-[#0077FF] text-white rounded-xl hover:bg-[#0066dd] transition-colors font-involve font-medium text-[15px]"
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="22" height="22" rx="4" fill="white"/>
        <path d="M14.87 12.738c-.328-.418-.234-.604 0-.977.004-.004 2.787-3.92 3.073-5.252l.001-.001c.148-.498 0-.864-.713-.864h-2.356c-.6 0-.876.318-1.024.669 0 0-1.198 2.919-2.896 4.815-.549.55-.799.727-1.098.727-.149 0-.367-.177-.367-.675V6.505c0-.6-.173-.864-.673-.864H5.928c-.378 0-.605.281-.605.549 0 .574.858.708.948 2.329v3.519c0 .761-.137.899-.436.899-.799 0-2.743-2.931-3.898-6.286C1.71 5.903 1.477 5.48.872 5.48H-1.484c-.673 0-.808.318-.808.669 0 .625.799 3.729 3.72 7.833 1.948 2.796 4.69 4.309 7.186 4.309 1.417 0 1.591-.318 1.591-.867v-2.108c0-.673.141-.808.617-.808.349 0 .948.174 2.346 1.525 1.597 1.597 1.861 2.258 2.758 2.258h2.356c.673 0 1.014-.318.818-.948-.213-.627-.975-1.538-1.995-2.617-.55-.65-1.372-1.347-1.571-1.658-.185-.29-.148-.421 0-.568z" fill="#0077FF"/>
      </svg>
      Войти через ВКонтакте
    </button>
  );
}
