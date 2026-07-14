'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { sb_createComment, sb_listComments } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';

export default function TestCommentsPage() {
  const [status, setStatus] = useState<string>('Готов к тестированию');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const testSupabaseConnection = async () => {
    try {
      setStatus('Проверяем подключение к Supabase...');
      const sb = getSupabase();
      if (!sb) {
        setStatus('❌ Supabase не инициализирован');
        return;
      }

      // Проверяем таблицы
      const { data: profiles, error: profilesError } = await sb.from('user_profiles').select('count').limit(1);
      if (profilesError) {
        setStatus(`❌ Ошибка таблицы user_profiles: ${profilesError.message}`);
        return;
      }

      const { data: commentsData, error: commentsError } = await sb.from('comments').select('count').limit(1);
      if (commentsError) {
        setStatus(`❌ Ошибка таблицы comments: ${commentsError.message}`);
        return;
      }

      setStatus('✅ Подключение к Supabase работает');
    } catch (error: any) {
      setStatus(`❌ Ошибка: ${error.message}`);
    }
  };

  const testAuth = async () => {
    try {
      setStatus('Проверяем авторизацию...');
      const isAuth = authStore.isAuthenticated();
      const profile = authStore.getCurrentProfile();
      
      if (!isAuth || !profile) {
        setStatus('❌ Пользователь не авторизован');
        return;
      }

      setStatus(`✅ Пользователь авторизован: ${profile.email} (${profile.role})`);
    } catch (error: any) {
      setStatus(`❌ Ошибка авторизации: ${error.message}`);
    }
  };

  const loadComments = async () => {
    try {
      setStatus('Загружаем комментарии...');
      const commentsData = await sb_listComments('test-post', 'post');
      setComments(commentsData);
      setStatus(`✅ Загружено ${commentsData.length} комментариев`);
    } catch (error: any) {
      setStatus(`❌ Ошибка загрузки комментариев: ${error.message}`);
    }
  };

  const createComment = async () => {
    if (!newComment.trim()) {
      setStatus('❌ Введите текст комментария');
      return;
    }

    try {
      setLoading(true);
      setStatus('Создаем комментарий...');
      
      const comment = await sb_createComment('test-post', 'post', newComment);
      setStatus('✅ Комментарий создан успешно');
      setNewComment('');
      
      // Перезагружаем комментарии
      await loadComments();
    } catch (error: any) {
      setStatus(`❌ Ошибка создания комментария: ${error.message}`);
      console.error('Comment creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Тест комментариев</h1>
        
        <div className="bg-[#F6F7F9] rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Статус</h2>
          <p className="text-lg">{status}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={testSupabaseConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Тест Supabase
          </button>
          
          <button
            onClick={testAuth}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Тест авторизации
          </button>
          
          <button
            onClick={loadComments}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Загрузить комментарии
          </button>
        </div>

        <div className="bg-[#F6F7F9] rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Создать комментарий</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Введите комментарий"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={createComment}
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>

        <div className="bg-[#F6F7F9] rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Комментарии ({comments.length})</h2>
          {comments.length === 0 ? (
            <p className="text-gray-500">Нет комментариев</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment, index) => (
                <div key={comment.id || index} className="border p-3 rounded">
                  <p className="font-medium">{comment.author_name || 'Аноним'}</p>
                  <p className="text-gray-600">{comment.content}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <a href="/blog" className="text-blue-600 hover:underline">
            ← Вернуться к блогу
          </a>
        </div>
      </div>
    </div>
  );
}
