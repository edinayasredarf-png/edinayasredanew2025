'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { exchangeCodeForToken, getUserInfo } from '@/lib/oauth';
import Layout from '@/components/Layout';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const sb = getSupabase();
      if (!sb) {
        router.push('/blog?error=supabase_not_initialized');
        return;
      }

      // Проверяем, какой провайдер используется
      const provider = searchParams.get('provider') as 'yandex' | 'vk' | null;
      
      // Если это Яндекс или ВК, обрабатываем OAuth 2.0 flow
      if (provider === 'yandex' || provider === 'vk') {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          router.push(`/blog?error=${encodeURIComponent(errorDescription || error)}`);
          return;
        }

        if (!code || !state) {
          router.push('/blog?error=Отсутствует код авторизации');
          return;
        }

        try {
          // Обмениваем код на токен
          const tokenData = await exchangeCodeForToken(provider, code, state);
          
          // Получаем информацию о пользователе
          const userInfo = await getUserInfo(provider, tokenData.access_token, tokenData);
          
          // Создаем или обновляем пользователя в Supabase
          // Используем email как идентификатор
          if (!userInfo.email && provider === 'vk') {
            // Для ВК email может быть в токене
            if (tokenData.email) {
              userInfo.email = tokenData.email;
            } else {
              router.push('/blog?error=Не удалось получить email от провайдера');
              return;
            }
          }

          if (!userInfo.email) {
            router.push('/blog?error=Не удалось получить email от провайдера');
            return;
          }

          // Создаем или обновляем пользователя через API
          const createUserResponse = await fetch('/api/oauth/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userInfo.email,
              name: userInfo.name,
              avatar_url: userInfo.avatar_url,
              provider: provider,
              provider_id: userInfo.provider_id,
            }),
          });

          if (!createUserResponse.ok) {
            const error = await createUserResponse.json();
            router.push(`/blog?error=${encodeURIComponent(error.error || 'Не удалось создать пользователя')}`);
            return;
          }

          const { user: createdUser } = await createUserResponse.json();

          // Пользователь создан, теперь нужно войти
          // Используем magic link для автоматического входа
          const { data: magicLinkData, error: magicLinkError } = await sb.auth.signInWithOtp({
            email: userInfo.email,
            options: {
              shouldCreateUser: false,
              emailRedirectTo: `${window.location.origin}/auth/callback?provider=${provider}&auto=true`,
            },
          });

          if (magicLinkError) {
            // Если magic link не работает, попробуем другой способ
            // Используем временный пароль для входа (если он был создан)
            router.push('/blog?error=Пожалуйста, проверьте почту для входа. Код отправлен на вашу почту.');
            return;
          }

          // Magic link отправлен, но мы хотим войти сразу
          // Попробуем использовать Admin API для создания сессии
          // Или просто перенаправим с сообщением
          router.push('/blog?success=Проверьте почту для завершения входа. Ссылка отправлена на вашу почту.');
        } catch (err: any) {
          console.error('OAuth callback error:', err);
          router.push(`/blog?error=${encodeURIComponent(err.message || 'Ошибка при обработке авторизации')}`);
        }
        return;
      }

      // Обработка для Google (через Supabase OAuth)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

      if (error) {
        router.push(`/blog?error=${encodeURIComponent(errorDescription || error)}`);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          const { data, error: sessionError } = await sb.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            router.push(`/blog?error=${encodeURIComponent(sessionError.message)}`);
            return;
          }

          if (data.session) {
            router.push('/blog?success=Авторизация успешна!');
          } else {
            router.push('/blog?error=Не удалось создать сессию');
          }
        } catch (err: any) {
          router.push(`/blog?error=${encodeURIComponent(err.message || 'Ошибка при обработке авторизации')}`);
        }
      } else {
        // Проверяем, может быть уже есть сессия
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
          router.push('/blog?success=Авторизация успешна!');
        } else {
          router.push('/blog?error=Токены не получены');
        }
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077FF] mx-auto mb-4"></div>
          <p className="text-[#313131] font-[Raleway]">Обработка авторизации...</p>
        </div>
      </div>
    </Layout>
  );
}



