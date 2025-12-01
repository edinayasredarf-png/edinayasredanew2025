import { NextRequest, NextResponse } from 'next/server';

/**
 * API route для обмена authorization code на access token
 * Это должно быть на сервере, так как требует client_secret
 */
export async function POST(request: NextRequest) {
  try {
    const { provider, code, redirectUri } = await request.json();

    if (!provider || !code || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let tokenResponse: Response;
    let tokenData: any;

    if (provider === 'yandex') {
      const clientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
      const clientSecret = process.env.YANDEX_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: 'Yandex OAuth not configured. Set NEXT_PUBLIC_YANDEX_CLIENT_ID and YANDEX_CLIENT_SECRET' },
          { status: 500 }
        );
      }

      // Обмен кода на токен для Яндекс
      tokenResponse = await fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return NextResponse.json(
          { error: `Yandex token exchange failed: ${error}` },
          { status: tokenResponse.status }
        );
      }

      tokenData = await tokenResponse.json();
    } else if (provider === 'vk') {
      const clientId = process.env.NEXT_PUBLIC_VK_CLIENT_ID;
      const clientSecret = process.env.VK_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: 'VK OAuth not configured. Set NEXT_PUBLIC_VK_CLIENT_ID and VK_CLIENT_SECRET' },
          { status: 500 }
        );
      }

      // Обмен кода на токен для ВК
      const tokenUrl = new URL('https://oauth.vk.com/access_token');
      tokenUrl.searchParams.append('client_id', clientId);
      tokenUrl.searchParams.append('client_secret', clientSecret);
      tokenUrl.searchParams.append('redirect_uri', redirectUri);
      tokenUrl.searchParams.append('code', code);

      tokenResponse = await fetch(tokenUrl.toString(), {
        method: 'GET',
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return NextResponse.json(
          { error: `VK token exchange failed: ${error}` },
          { status: tokenResponse.status }
        );
      }

      tokenData = await tokenResponse.json();

      // ВК возвращает ошибку в JSON, если что-то не так
      if (tokenData.error) {
        return NextResponse.json(
          { error: `VK error: ${tokenData.error_description || tokenData.error}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    // Возвращаем токен и дополнительную информацию
    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      // Для ВК email может быть в ответе
      email: tokenData.email || undefined,
      // Для ВК user_id в ответе
      user_id: tokenData.user_id || undefined,
    });
  } catch (error: any) {
    console.error('OAuth token exchange error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

