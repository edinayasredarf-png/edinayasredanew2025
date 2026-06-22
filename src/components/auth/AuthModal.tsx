'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { authStore } from '@/lib/authStore';
import { initiateOAuth } from '@/lib/oauth';
import VKIDButton from './VKIDButton';

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

  const handleProviderAuth = (provider: 'yandex' | 'vk') => {
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
            <button
              onClick={() => handleProviderAuth('yandex')}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-[#FC3F1D] text-white rounded-xl hover:bg-[#e83516] transition-colors font-involve font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm10.927-4.5H12c-1.38 0-2.25.81-2.25 2.047 0 1.13.6 1.77 1.687 2.483l.938.614-2.766 4.356H11.4l2.494-3.937.938.614c1.322.864 2.018 1.77 2.018 3.323H18.3c0-2.11-1.01-3.323-2.766-4.5C16.758 9.3 16.1 8.16 16.1 6.932 16.1 5.108 14.813 4 12.927 4H9.9v10h1.688V7.5h1.34z"/>
              </svg>
              Войти через Яндекс
            </button>
            <VKIDButton
              onSuccess={() => { onSuccess?.(); onClose(); }}
              onError={(msg) => setError(msg)}
            />
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
