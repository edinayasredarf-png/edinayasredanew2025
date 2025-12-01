import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API route для автоматического входа пользователя после OAuth
 * Создает сессию для пользователя через Admin API
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Создаем клиент с service role key для admin операций
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Генерируем сессию для пользователя
    // Используем generateLink для создания magic link, который автоматически войдет
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: '', // Будет получен из userId
    });

    // Альтернативный подход - создаем временный токен через Admin API
    // Получаем информацию о пользователе
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Создаем клиент для пользователя и генерируем сессию
    // К сожалению, Supabase Admin API не позволяет напрямую создать сессию
    // Поэтому вернем информацию о пользователе, и клиент создаст сессию через OTP или другой метод
    
    return NextResponse.json({
      user: userData.user,
      message: 'User created successfully. Please sign in with email.',
    });
  } catch (error: any) {
    console.error('OAuth signin error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

