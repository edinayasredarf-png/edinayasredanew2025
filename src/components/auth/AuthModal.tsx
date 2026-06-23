'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { authStore } from '@/lib/authStore';
import { initiateOAuth } from '@/lib/oauth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mapAuthError = (err: unknown): string => {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : String(err ?? 'Произошла ошибка');

    if (/Invalid login credentials|Неверный email или пароль/i.test(msg)) {
      return 'Неверный email или пароль.';
    }
    if (/уже существует/i.test(msg)) {
      return msg;
    }
    if (/User already registered|already registered/i.test(msg)) {
      return 'Этот email уже зарегистрирован. Войдите или восстановите пароль.';
    }
    if (/Supabase not initialized/i.test(msg)) {
      return 'Сайт открыт со старой версии. Перезапустите npm run dev (остановите все процессы на порту 3000) и обновите страницу.';
    }
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
      return 'Не удалось связаться с сервером. Проверьте, что сайт запущен, и попробуйте снова.';
    }
    if (/self-signed certificate|certificate in certificate chain|UNABLE_TO_VERIFY/i.test(msg)) {
      return 'Ошибка SSL к базе Timeweb на сервере. На Vercel задайте DATABASE_SSL_CA_PEM и DATABASE_SSL_SERVERNAME (*.twc1.net), затем Redeploy.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await authStore.signInWithEmail(email, password);
      } else {
        await authStore.signUpWithEmail(email, password, fullName);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAuth = (provider: 'yandex' | 'vk'): void => {
    setError('');
    try {
      initiateOAuth(provider);
    } catch (err: unknown) {
      setError(mapAuthError(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-[Raleway] font-medium lining-nums">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-[#313131]">
            {mode === 'signin' ? 'Вход' : 'Регистрация'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
         <Image
          src="/icons/close.svg"
          alt="Закрыть"
          width={20}
          height={20}
          className="object-contain"
        />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
                Полное имя
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-[#D6D7DB] rounded-lg focus:ring-1 focus:ring-[#029cda] text-[#7C8A9A] "
                placeholder="Иван Иванов"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D7DB] rounded-lg focus:ring-1 focus:ring-[#029cda] text-[#7C8A9A] "
              placeholder="ваша_почта@email.ru"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#D6D7DB] rounded-lg focus:ring-1 focus:ring-[#029cda] text-[#7C8A9A]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#029cda] text-white py-2 px-4 rounded-lg hover:bg-[#1f66de] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Загрузка...' : (mode === 'signin' ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Или войдите через</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {/* Яндекс ID — официальный дизайн: чёрная кнопка */}
            <button
              onClick={() => handleProviderAuth('yandex')}
              className="flex items-center justify-center gap-3 px-4 py-[13px] bg-[#000] text-white rounded-xl hover:bg-[#222] transition-colors font-involve font-medium text-[15px]"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="22" height="22" rx="4" fill="white"/>
                <path d="M13.012 18H11.18V8.252H10.3C8.748 8.252 7.932 9.02 7.932 10.22C7.932 11.588 8.54 12.224 9.748 13.048L10.724 13.712L7.86 18H5.9L8.508 13.964C7.044 12.96 6.212 11.988 6.212 10.316C6.212 8.22 7.668 6.8 10.292 6.8H13.012V18Z" fill="#FC3F1D"/>
              </svg>
              Войти с Яндекс ID
            </button>

            {/* ВКонтакте */}
            <button
              onClick={() => handleProviderAuth('vk')}
              className="flex items-center justify-center gap-3 px-4 py-[13px] bg-[#0077FF] text-white rounded-xl hover:bg-[#0066dd] transition-colors font-involve font-medium text-[15px]"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="22" height="22" rx="4" fill="white"/>
                <path d="M11.5 4C7.358 4 4 7.358 4 11.5C4 15.642 7.358 19 11.5 19C15.642 19 19 15.642 19 11.5C19 7.358 15.642 4 11.5 4ZM15.274 13.854H14.13C13.706 13.854 13.578 13.522 12.842 12.778C12.202 12.146 11.922 12.066 11.762 12.066C11.538 12.066 11.474 12.13 11.474 12.442V13.474C11.474 13.742 11.39 13.854 10.67 13.854C9.45 13.854 8.098 13.09 7.138 11.674C5.706 9.63 5.314 8.106 5.314 7.794C5.314 7.634 5.378 7.482 5.69 7.482H6.834C7.114 7.482 7.218 7.61 7.33 7.906C7.906 9.518 8.87 10.93 9.25 10.93C9.394 10.93 9.458 10.866 9.458 10.514V8.69C9.41 7.834 8.946 7.762 8.946 7.498C8.946 7.37 9.05 7.242 9.218 7.242H11.026C11.258 7.242 11.338 7.37 11.338 7.65V10.13C11.338 10.362 11.434 10.442 11.506 10.442C11.65 10.442 11.762 10.362 12.026 10.098C12.842 9.19 13.434 7.794 13.434 7.794C13.514 7.634 13.642 7.482 13.922 7.482H15.066C15.41 7.482 15.482 7.658 15.41 7.906C15.258 8.578 13.61 10.938 13.61 10.938C13.482 11.138 13.434 11.226 13.61 11.442C13.738 11.61 14.162 11.97 14.45 12.306C14.97 12.906 15.378 13.41 15.49 13.57C15.602 13.73 15.554 13.854 15.274 13.854Z" fill="#0077FF"/>
              </svg>
              Войти через ВКонтакте
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-[#029cda] hover:text-[#1f66de] text-sm"
          >
            {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}
