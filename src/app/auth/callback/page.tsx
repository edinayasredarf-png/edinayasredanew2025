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
      const providerParam = searchParams.get('provider');
      const providerStored = typeof window !== 'undefined' ? localStorage.getItem('oauth_provider') : null;
      const provider = (providerParam || providerStored) as 'yandex' | 'vk' | null;
      if (typeof window !== 'undefined') localStorage.removeItem('oauth_provider');
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
      if (!code) {
        router.push('/blog?error=Отсутствует код авторизации');
        return;
      }
      if (!state && provider !== 'vk') {
        router.push('/blog?error=Отсутствует state');
        return;
      }

      try {
        // For VK SDK, exchange code using codeVerifier from localStorage
        if (provider === 'vk') {
          const codeVerifier = localStorage.getItem('vk_code_verifier') || '';
          localStorage.removeItem('vk_state');
          localStorage.removeItem('vk_code_verifier');
          // Use VK SDK to exchange code
          const { Auth } = await import('@vkid/sdk');
          const data = await Auth.exchangeCode(code, codeVerifier) as { user?: { id?: number; first_name?: string; last_name?: string; email?: string; avatar?: string } };
          const user = data?.user;
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
            router.push(`/blog?error=${encodeURIComponent(err.error || 'Ошибка авторизации')}`);
            return;
          }
          await authStore.refreshSession();
          router.push('/blog?success=Вы успешно вошли!');
          return;
        }

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
