import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dbUpsertUserProfile } from "@/lib/server/dataDb";

async function syncProfileToTimeweb(row: {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string;
}) {
  try {
    await dbUpsertUserProfile({
      id: row.id,
      email: row.email,
      full_name: row.full_name ?? null,
      avatar_url: row.avatar_url ?? null,
      organization: null,
      role: row.role ?? "user",
    });
  } catch (e) {
    console.warn("Timeweb user_profiles sync:", e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const { email, name, avatar_url, provider, provider_id } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Проверяем, существует ли пользователь с таким email
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      // Продолжаем, даже если не удалось получить список
    }

    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // Пользователь существует, возвращаем его данные
      // Обновляем метаданные
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            full_name: name || existingUser.user_metadata?.full_name,
            avatar_url: avatar_url || existingUser.user_metadata?.avatar_url,
            provider: provider,
            provider_id: provider_id,
          },
        }
      );

      if (updateError) {
        console.error('Error updating user:', updateError);
      }

      await syncProfileToTimeweb({
        id: existingUser.id,
        email,
        full_name: name || existingUser.user_metadata?.full_name,
        avatar_url: avatar_url || existingUser.user_metadata?.avatar_url,
      });

      return NextResponse.json({
        user: updateData?.user || existingUser,
        isNew: false,
      });
    }

    // Создаем нового пользователя
    // Генерируем случайный пароль (пользователь не будет его использовать)
    const randomPassword = `oauth_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: randomPassword,
      email_confirm: true, // Автоматически подтверждаем email
      user_metadata: {
        full_name: name,
        avatar_url: avatar_url,
        provider: provider,
        provider_id: provider_id,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    await syncProfileToTimeweb({
      id: newUser.user.id,
      email,
      full_name: name,
      avatar_url: avatar_url,
      role: email === "proeco09@yandex.ru" ? "admin" : "user",
    });

    return NextResponse.json({
      user: newUser.user,
      isNew: true,
    });
  } catch (error: any) {
    console.error('OAuth create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

