'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, listPosts, listNews, incViews, sb_clearTestNews } from '@/lib/blogStore';

interface AnalyticsData {
  totalPosts: number;
  totalNews: number;
  totalViews: number;
  totalReactions: number;
  mostViewedPost: { title: string; views: number } | null;
  mostReactedPost: { title: string; reactions: number } | null;
  recentPosts: Array<{ title: string; views: number; createdAt: number }>;
  postsByType: { [key: string]: number };
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    setIsAuthed(auth.isAuthed());
  }, []);

  useEffect(() => {
    if (isAuthed) {
      calculateAnalytics();
    }
  }, [isAuthed]);

  const calculateAnalytics = () => {
    const posts = listPosts();
    const news = listNews();
    
    const totalViews = [...posts, ...news].reduce((sum, item) => sum + (item.views || 0), 0);
    const totalReactions = [...posts, ...news].reduce((sum, item) => {
      const reactions = item.reactions || { heart: 0, fire: 0, smile: 0 };
      return sum + reactions.heart + reactions.fire + reactions.smile;
    }, 0);

    const mostViewedPost = [...posts, ...news]
      .filter(item => item.views && item.views > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))[0];

    const mostReactedPost = [...posts, ...news]
      .map(item => ({
        ...item,
        totalReactions: (item.reactions?.heart || 0) + (item.reactions?.fire || 0) + (item.reactions?.smile || 0)
      }))
      .filter(item => item.totalReactions > 0)
      .sort((a, b) => b.totalReactions - a.totalReactions)[0];

    const recentPosts = [...posts, ...news]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(item => ({
        title: item.title,
        views: item.views || 0,
        createdAt: item.createdAt
      }));

    const postsByType = posts.reduce((acc, post) => {
      const type = post.kind || 'post';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    setAnalytics({
      totalPosts: posts.length,
      totalNews: news.length,
      totalViews,
      totalReactions,
      mostViewedPost: mostViewedPost ? { title: mostViewedPost.title, views: mostViewedPost.views || 0 } : null,
      mostReactedPost: mostReactedPost ? { title: mostReactedPost.title, reactions: mostReactedPost.totalReactions } : null,
      recentPosts,
      postsByType
    });
  };

  const showNotificationToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const clearTestNews = async () => {
    if (!confirm('Удалить тестовые новости?')) return;
    try {
      const deleted = await sb_clearTestNews();
      showNotificationToast(`Удалено ${deleted} тестовых новостей`);
      calculateAnalytics(); // Обновляем аналитику
    } catch (error) {
      showNotificationToast('Ошибка при удалении тестовых новостей');
    }
  };

  const doLogin = () => {
    if (auth.login(login, pass)) {
      setIsAuthed(true);
    } else {
      alert('Неверный логин/пароль');
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#111]">Админ панель</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-[#111]"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-[#111]"
            />
            <button
              onClick={doLogin}
              className="w-full bg-[#2777ff] text-white py-3 rounded-lg hover:bg-[#1e5bb8]"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">
        <div className="text-[#111]">Загрузка аналитики...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f3f7]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#111]">Админ панель</h1>
          <div className="flex gap-4">
            <Link
              href="/blog/new"
              className="px-4 py-2 bg-[#2777ff] text-white rounded-lg hover:bg-[#1e5bb8]"
            >
              Создать материал
            </Link>
            <button
              onClick={clearTestNews}
              className="px-4 py-2 border border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50"
            >
              Удалить тестовые новости
            </button>
            <button
              onClick={() => { auth.logout(); setIsAuthed(false); }}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Всего статей</h3>
            <p className="text-3xl font-bold text-[#111]">{analytics.totalPosts}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Всего новостей</h3>
            <p className="text-3xl font-bold text-[#111]">{analytics.totalNews}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Всего просмотров</h3>
            <p className="text-3xl font-bold text-[#111]">{analytics.totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Всего реакций</h3>
            <p className="text-3xl font-bold text-[#111]">{analytics.totalReactions}</p>
          </div>
        </div>

        {/* Content Types */}
        <div className="bg-white rounded-xl p-6 border mb-8">
          <h2 className="text-xl font-semibold text-[#111] mb-4">Типы контента</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.postsByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-[#111]">{count}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {type === 'post' ? 'Статьи' : 
                   type === 'news' ? 'Новости' :
                   type === 'lesson' ? 'Уроки' :
                   type === 'case' ? 'Кейсы' : type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Most Viewed */}
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-xl font-semibold text-[#111] mb-4">Самая популярная статья</h2>
            {analytics.mostViewedPost ? (
              <div>
                <h3 className="font-medium text-[#111] mb-2">{analytics.mostViewedPost.title}</h3>
                <p className="text-2xl font-bold text-[#2777ff]">{analytics.mostViewedPost.views} просмотров</p>
              </div>
            ) : (
              <p className="text-gray-500">Нет данных о просмотрах</p>
            )}
          </div>

          {/* Most Reacted */}
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="text-xl font-semibold text-[#111] mb-4">Самая обсуждаемая статья</h2>
            {analytics.mostReactedPost ? (
              <div>
                <h3 className="font-medium text-[#111] mb-2">{analytics.mostReactedPost.title}</h3>
                <p className="text-2xl font-bold text-[#2777ff]">{analytics.mostReactedPost.reactions} реакций</p>
              </div>
            ) : (
              <p className="text-gray-500">Нет данных о реакциях</p>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-xl font-semibold text-[#111] mb-4">Последние публикации</h2>
          <div className="space-y-3">
            {analytics.recentPosts.map((post, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <h3 className="font-medium text-[#111]">{post.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#111]">{post.views} просмотров</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notificationMessage}
        </div>
      )}
    </div>
  );
}
