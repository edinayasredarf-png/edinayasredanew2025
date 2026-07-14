'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Проверка...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        const sb = getSupabase();
        if (!sb) {
          setStatus('❌ Supabase не инициализирован');
          return;
        }

        setStatus('✅ Supabase инициализирован');

        // Проверяем подключение к базе данных
        const { data, error } = await sb.from('user_profiles').select('count').limit(1);
        
        if (error) {
          setStatus(`❌ Ошибка подключения к БД: ${error.message}`);
          setDetails(error);
        } else {
          setStatus('✅ Подключение к БД работает');
          setDetails({ data });
        }

        // Проверяем авторизацию
        const { data: { user }, error: authError } = await sb.auth.getUser();
        if (authError) {
          setStatus(prev => prev + ` | ❌ Ошибка авторизации: ${authError.message}`);
        } else if (user) {
          setStatus(prev => prev + ` | ✅ Пользователь авторизован: ${user.email}`);
        } else {
          setStatus(prev => prev + ' | ⚠️ Пользователь не авторизован');
        }

      } catch (error: any) {
        setStatus(`❌ Критическая ошибка: ${error.message}`);
        setDetails(error);
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Тест Supabase</h1>
        
        <div className="bg-[#F6F7F9] rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Статус подключения</h2>
          <p className="text-lg">{status}</p>
        </div>

        {details && (
          <div className="bg-[#F6F7F9] rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Детали</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6">
          <a href="/blog" className="text-blue-600 hover:underline">
            ← Вернуться к блогу
          </a>
        </div>
      </div>
    </div>
  );
}
