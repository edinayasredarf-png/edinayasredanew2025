'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStore } from '@/lib/authStore';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function TestAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      const authenticated = authStore.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setUser(authStore.getCurrentUser());
        setProfile(authStore.getCurrentProfile());
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    setIsAuthenticated(authStore.isAuthenticated());
    if (authStore.isAuthenticated()) {
      setUser(authStore.getCurrentUser());
      setProfile(authStore.getCurrentProfile());
    }

    // Обработка query параметров после OAuth редиректа
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Очищаем URL от параметров
      router.replace('/test-auth', { scroll: false });
    }
    if (successParam) {
      setSuccess(decodeURIComponent(successParam));
      // Очищаем URL от параметров
      router.replace('/test-auth', { scroll: false });
    }

    return unsubscribe;
  }, [router, searchParams]);

  // Регистрация по email
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authStore.signUpWithEmail(email, password, fullName);
      setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
    } catch (err: any) {
      setError(err.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  // Вход по email
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authStore.signInWithEmail(email, password);
      setSuccess('Вход выполнен успешно!');
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  // Регистрация/вход по телефону - отправка OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authStore.signUpWithPhone(phone);
      setPhoneStep('verify');
      setSuccess('Код подтверждения отправлен на ваш телефон');
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке кода');
    } finally {
      setLoading(false);
    }
  };

  // Подтверждение OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authStore.verifyPhoneOTP(phone, otp);
      setSuccess('Телефон подтвержден! Вход выполнен.');
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Неверный код подтверждения');
    } finally {
      setLoading(false);
    }
  };

  // OAuth провайдеры
  const handleProviderAuth = async (provider: 'google' | 'yandex' | 'vk') => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authStore.signInWithProvider(provider);
      setSuccess(`Перенаправление на ${provider}...`);
    } catch (err: any) {
      setError(err.message || `Ошибка при входе через ${provider}`);
      setLoading(false);
    }
  };

  // Выход
  const handleSignOut = async () => {
    try {
      await authStore.signOut();
      setSuccess('Выход выполнен');
    } catch (err: any) {
      setError(err.message || 'Ошибка при выходе');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F7FB] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold text-[#313131] mb-2 font-[Raleway]">
              Тестирование авторизации
            </h1>
            <p className="text-[#7c8a9a] mb-8">
              Страница для тестирования различных методов авторизации и регистрации
            </p>

            {/* Статус авторизации */}
            <div className="mb-8 p-4 rounded-xl bg-gray-50 border">
              <h2 className="text-lg font-semibold mb-4">Текущий статус</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Авторизован:</span>{' '}
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? 'Да' : 'Нет'}
                  </span>
                </div>
                {user && (
                  <>
                    <div>
                      <span className="font-medium">Email:</span> {user.email}
                    </div>
                    <div>
                      <span className="font-medium">ID:</span> {user.id}
                    </div>
                  </>
                )}
                {profile && (
                  <>
                    <div>
                      <span className="font-medium">Имя:</span> {profile.full_name || 'Не указано'}
                    </div>
                    <div>
                      <span className="font-medium">Роль:</span> {profile.role}
                    </div>
                  </>
                )}
              </div>
              {isAuthenticated && (
                <div className="mt-4 flex gap-4">
                  <Link
                    href="/profile"
                    className="px-4 py-2 bg-[#0077FF] text-white rounded-lg hover:bg-[#005fcc] transition-colors"
                  >
                    Перейти в личный кабинет
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>

            {/* Сообщения об ошибках и успехе */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* OAuth провайдеры */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#313131]">Вход через соцсети</h2>
                
                <button
                  onClick={() => handleProviderAuth('yandex')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FC3F1D] text-white rounded-xl hover:bg-[#e03616] transition-colors disabled:opacity-50 font-[Raleway] font-medium"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.894c-1.902 1.902-4.992 1.902-6.894 0l-1.789-1.789c-.391-.391-.391-1.023 0-1.414s1.023-.391 1.414 0l1.789 1.789c.781.781 2.047.781 2.828 0l3.789-3.789c.781-.781.781-2.047 0-2.828l-3.789-3.789c-.781-.781-2.047-.781-2.828 0l-1.789 1.789c-.391.391-1.023.391-1.414 0s-.391-1.023 0-1.414l1.789-1.789c1.902-1.902 4.992-1.902 6.894 0l3.789 3.789c1.902 1.902 1.902 4.992 0 6.894l-3.789 3.789z"/>
                  </svg>
                  Войти через Яндекс
                </button>

                <button
                  onClick={() => handleProviderAuth('vk')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0077FF] text-white rounded-xl hover:bg-[#005fcc] transition-colors disabled:opacity-50 font-[Raleway] font-medium"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.785 16.241s.287-.029.435-.18c.135-.137.131-.394.131-.394s-.019-1.123.515-1.288c.526-.17 1.201 1.136 1.916 1.64.552.384.97.3.97.3l1.914-.028s1.002-.066.526-.896c-.039-.066-.276-.577-1.418-1.633-1.198-1.115-1.03-.935.402-2.864.275-.375.385-.604.385-.604s.034-.268-.09-.378c-.124-.111-.329-.073-.329-.073l-2.449.015s-.357-.01-.467.074c-.109.083-.18.277-.18.277s-.32.856-.745 1.584c-.898 1.515-1.258 1.596-1.404 1.504-.343-.22-.258-.882-.258-1.354 0-1.472.22-2.084-.43-2.245-.215-.053-.373-.088-.924-.094-.705-.008-1.3.003-1.638.164-.225.107-.399.346-.293.36.131.018.428.08.585.293.201.274.194.89.194.89s.115 1.693-.268 1.904c-.262.145-.621-.15-1.393-1.504-.396-.697-.696-1.465-.696-1.465s-.058-.208-.161-.321c-.124-.137-.332-.18-.332-.18l-2.33.015s-.35.01-.479.16c-.115.132-.009.404-.009.404s1.816 4.27 3.87 6.427c1.886 1.976 4.04 1.846 4.04 1.846h.967z"/>
                  </svg>
                  Войти через ВКонтакте
                </button>

                <button
                  onClick={() => handleProviderAuth('google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-[Raleway] font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </button>
              </div>

              {/* Email авторизация */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#313131]">Регистрация по Email</h2>
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
                      Полное имя
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131]"
                      placeholder="Иван Иванов"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131]"
                      placeholder="example@email.com"
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
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131]"
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0077FF] text-white py-3 px-4 rounded-lg hover:bg-[#005fcc] disabled:opacity-50 disabled:cursor-not-allowed font-[Raleway] font-medium transition-colors"
                  >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </button>
                </form>

                <h2 className="text-xl font-semibold text-[#313131] mt-8">Вход по Email</h2>
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131]"
                      placeholder="example@email.com"
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
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131]"
                      placeholder="Введите пароль"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0077FF] text-white py-3 px-4 rounded-lg hover:bg-[#005fcc] disabled:opacity-50 disabled:cursor-not-allowed font-[Raleway] font-medium transition-colors"
                  >
                    {loading ? 'Вход...' : 'Войти'}
                  </button>
                </form>
              </div>
            </div>

            {/* Регистрация по телефону */}
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-[#313131] mb-4">Регистрация/Вход по телефону</h2>
              {phoneStep === 'input' ? (
                <form onSubmit={handlePhoneSubmit} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
                      Номер телефона
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131]"
                      placeholder="+7 (999) 123-45-67"
                      required
                    />
                    <p className="mt-1 text-xs text-[#7C8A9A]">
                      Введите номер в формате +7XXXXXXXXXX
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0077FF] text-white py-3 px-4 rounded-lg hover:bg-[#005fcc] disabled:opacity-50 disabled:cursor-not-allowed font-[Raleway] font-medium transition-colors"
                  >
                    {loading ? 'Отправка...' : 'Отправить код'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#7C8A9A] mb-1">
                      Код подтверждения
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D6D7DB] rounded-lg focus:ring-2 focus:ring-[#0077FF] text-[#313131] text-center text-2xl tracking-widest"
                      placeholder="000000"
                      required
                      maxLength={6}
                    />
                    <p className="mt-1 text-xs text-[#7C8A9A]">
                      Код отправлен на {phone}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#0077FF] text-white py-3 px-4 rounded-lg hover:bg-[#005fcc] disabled:opacity-50 disabled:cursor-not-allowed font-[Raleway] font-medium transition-colors"
                    >
                      {loading ? 'Проверка...' : 'Подтвердить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('input');
                        setOtp('');
                      }}
                      className="px-4 py-3 border border-[#D6D7DB] rounded-lg hover:bg-gray-50 font-[Raleway] font-medium transition-colors"
                    >
                      Назад
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

