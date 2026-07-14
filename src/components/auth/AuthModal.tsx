'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { authStore } from '@/lib/authStore';
import { initiateOAuth } from '@/lib/oauth';
import YandexIDButton from './YandexIDButton';
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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="bg-[#F6F7F9] rounded-2xl p-6 w-full max-w-md">
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-[#D6D7DB] rounded-lg focus:ring-1 focus:ring-[#029cda] text-[#7C8A9A]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7C8A9A] hover:text-[#029cda] transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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
              <span className="px-2 bg-[#F6F7F9] text-gray-500">Или войдите через</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {/* Яндекс ID — официальный SDK виджет */}
            <YandexIDButton
              onSuccess={() => { onSuccess?.(); onClose(); }}
              onError={(msg) => setError(msg)}
            />

            {/* ВКонтакте — официальный SDK */}
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
