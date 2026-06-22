'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken, getUserInfo } from '@/lib/oauth';
import { authStore } from '@/lib/authStore';
import Layout from '@/components/Layout';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handle = async () => {
      const provider = searchParams.get('provider') as 'yandex' | 'vk' | null;
      if (provider !== 'yandex' && provider !== 'vk') {
        router.push('/blog?error=Неизвестный провайдер');
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        router.push(`/blog?error=${encodeURIComponent(searchParams.get('error_description') || error)}`);
        return;
      }
      if (!code || !state) {
        router.push('/blog?error=Отсутствует код авторизации');
        return;
      }

      try {
        // Exchange code for token
        const tokenData = await exchangeCodeForToken(provider, code, state);
        // Get user info from provider
        const userInfo = await getUserInfo(provider, tokenData.access_token, tokenData);

        // Login / register via our API
        const res = await fetch('/api/auth/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            providerId: userInfo.provider_id,
            email: userInfo.email || tokenData.email || null,
            name: userInfo.name || null,
            avatarUrl: userInfo.avatar_url || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          router.push(`/blog?error=${encodeURIComponent(err.error || 'Ошибка авторизации')}`);
          return;
        }

        await authStore.refreshSession();
        router.push('/blog?success=Вы успешно вошли!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        router.push(`/blog?error=${encodeURIComponent(msg)}`);
      }
    };

    handle();
  }, [router, searchParams]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#029cda] mx-auto mb-4" />
          <p className="text-[#313131] font-[Raleway]">Выполняем вход...</p>
        </div>
      </div>
    </Layout>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#029cda] mx-auto" />
        </div>
      </Layout>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
