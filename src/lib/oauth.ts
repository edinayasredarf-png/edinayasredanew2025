'use client';

/**
 * OAuth 2.0 конфигурация для провайдеров
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret?: string; // Не используется на клиенте, только для сервера
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string;
}

/**
 * Конфигурация OAuth провайдеров
 * ВАЖНО: Client ID должны быть установлены в переменных окружения
 */
export const oauthProviders: Record<'yandex' | 'vk', OAuthConfig> = {
  yandex: {
    clientId: process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID || '',
    authUrl: 'https://oauth.yandex.ru/authorize',
    tokenUrl: 'https://oauth.yandex.ru/token',
    redirectUri: typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback?provider=yandex`
      : '',
    scope: 'login:email login:info',
  },
  vk: {
    clientId: process.env.NEXT_PUBLIC_VK_CLIENT_ID || '',
    authUrl: 'https://oauth.vk.com/authorize',
    tokenUrl: 'https://oauth.vk.com/access_token',
    redirectUri: typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?provider=vk`
      : '',
    scope: 'email',
  },
};

/**
 * Генерирует случайную строку для state параметра (защита от CSRF)
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Сохраняет state в localStorage для проверки при callback
 */
function saveState(state: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('oauth_state', state);
  }
}

/**
 * Проверяет state из localStorage
 */
function verifyState(state: string): boolean {
  if (typeof window === 'undefined') return false;
  const savedState = localStorage.getItem('oauth_state');
  if (!savedState) return false;
  localStorage.removeItem('oauth_state');
  return savedState === state;
}

/**
 * Инициирует OAuth авторизацию через Яндекс или ВК
 */
export function initiateOAuth(provider: 'yandex' | 'vk'): void {
  const config = oauthProviders[provider];
  
  if (!config.clientId) {
    throw new Error(`OAuth client ID для ${provider} не настроен. Установите NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID в переменных окружения.`);
  }

  const state = generateState();
  saveState(state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: state,
  });

  // Для ВК нужен display=page
  if (provider === 'vk') {
    params.append('display', 'page');
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Обменивает authorization code на access token
 */
export async function exchangeCodeForToken(
  provider: 'yandex' | 'vk',
  code: string,
  state: string
): Promise<{ access_token: string; expires_in?: number; refresh_token?: string; email?: string }> {
  // Проверяем state
  if (!verifyState(state)) {
    throw new Error('Invalid state parameter. Possible CSRF attack.');
  }

  const config = oauthProviders[provider];
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback?provider=${provider}`
    : '';

  // Для обмена кода на токен нужен серверный endpoint
  // Создадим API route для этого
  const response = await fetch('/api/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      code,
      redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange code for token');
  }

  return await response.json();
}

/**
 * Получает информацию о пользователе из провайдера
 */
export async function getUserInfo(
  provider: 'yandex' | 'vk',
  accessToken: string,
  tokenData?: { email?: string; user_id?: string }
): Promise<{ email: string; name?: string; avatar_url?: string; provider_id: string }> {
  if (provider === 'yandex') {
    const response = await fetch('https://login.yandex.ru/info', {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info from Yandex');
    }

    const data = await response.json();
    return {
      email: data.default_email || data.emails?.[0] || '',
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.display_name || '',
      avatar_url: data.default_avatar_id 
        ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
        : undefined,
      provider_id: data.id?.toString() || '',
    };
  } else if (provider === 'vk') {
    // Для ВК нужно получить user_id из токена или через API
    // Сначала получим user_id из токена (если он был возвращен)
    // Или используем API для получения информации
    const response = await fetch(
      `https://api.vk.com/method/users.get?fields=photo_200&access_token=${accessToken}&v=5.131`
    );

    if (!response.ok) {
      throw new Error('Failed to get user info from VK');
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.error_msg || 'VK API error');
    }

    const user = data.response?.[0];
    if (!user) {
      throw new Error('User not found in VK response');
    }

    // Для ВК email может быть в токене (если был запрошен scope 'email')
    // Или нужно запрашивать отдельно
    let email = tokenData?.email || '';
    
    // Если email не в токене, пытаемся получить через API
    if (!email) {
      try {
        const emailResponse = await fetch(
          `https://api.vk.com/method/account.getProfileInfo?access_token=${accessToken}&v=5.131`
        );
        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          email = emailData.response?.email || '';
        }
      } catch (e) {
        // Игнорируем ошибку
      }
    }

    // Если email все еще не получен, используем формат на основе user_id
    // Это временное решение - в реальном приложении нужно обязательно получать email
    if (!email) {
      email = `vk_${user.id}@oauth.local`;
    }

    return {
      email: email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      avatar_url: user.photo_200 || undefined,
      provider_id: user.id?.toString() || '',
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

