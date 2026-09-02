'use client';

import React, { useEffect, useState } from 'react';
import { authStore } from '@/lib/authStore';
import { sb_listPosts } from '@/lib/blogStore';
import { sb_listAllComments } from '@/lib/commentsStore';
import UtmGenerator from './UtmGenerator';
import PressAdmin from './PressAdmin';
import AnalyticsDashboard from '@/components/profile/AnalyticsDashboard';
import LettersAdmin from './LettersAdmin';
import NewsRadar from './NewsRadar';
import CitizenFeedback from './CitizenFeedback';
import AiSalesSection from './ai-sales/AiSalesSection';

interface AdminStats {
  totalPosts: number;
  totalComments: number;
  pendingApplications: number;
  recentPosts: any[];
  recentComments: any[];
}

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats>({
    totalPosts: 0,
    totalComments: 0,
    pendingApplications: 0,
    recentPosts: [],
    recentComments: []
  });
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'metrika' | 'email' | 'leads' | 'social' | 'utm' | 'press' | 'letters' | 'radar' | 'feedback'
    | 'ai-dashboard' | 'ai-calls' | 'ai-deals' | 'ai-reco'
  >('dashboard');
  const [salesTemp, setSalesTemp] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkAuth = () => {
      const initialized = authStore.isInitialized();
      const isAdmin = authStore.isAdmin();
      if (initialized) {
        setAuthChecked(true);
        setIsAuthorized(isAdmin);
        if (isAdmin) loadAdminData();
      }
    };

    checkAuth();
    const unsubscribe = authStore.subscribe(checkAuth);
    return unsubscribe;
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      console.log('Loading admin data...');
      
      // Загружаем посты
      console.log('Loading posts...');
      const posts = await sb_listPosts();
      console.log('Posts loaded:', posts.length);
      
      // Загружаем комментарии
      console.log('Loading comments...');
      const comments = await sb_listAllComments();
      console.log('Comments loaded:', comments.length);
      
      // Сортируем посты по дате создания
      const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt);
      
      // Сортируем комментарии по дате создания
      const sortedComments = comments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log('Setting stats:', {
        totalPosts: posts.length,
        totalComments: comments.length,
        recentPosts: sortedPosts.slice(0, 5),
        recentComments: sortedComments.slice(0, 5)
      });
      
      setStats({
        totalPosts: posts.length,
        totalComments: comments.length,
        pendingApplications: 0, // Пока нет таблицы заявок
        recentPosts: sortedPosts.slice(0, 5),
        recentComments: sortedComments.slice(0, 5)
      });
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      setStatus(`Ошибка загрузки данных: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#029cda]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
            <p>У вас нет прав для доступа к админ-панели.</p>
            <p className="text-sm mt-2">Только администраторы могут просматривать эту страницу.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка админ-панели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
        {/* Левое меню */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-[#F6F7F9] rounded-2xl p-3 lg:sticky lg:top-6">
            <h1 className="px-3 pt-2 pb-3 text-lg font-bold text-gray-900">Админ-панель</h1>
            {([
              { group: 'Контент', items: [
                { id: 'dashboard', label: 'Дашборд' },
                { id: 'press', label: 'СМИ о нас' },
                { id: 'utm', label: 'UTM-метки' },
                { id: 'letters', label: 'Письма' },
                { id: 'feedback', label: 'Обратная связь' },
              ] },
              { group: 'AI Продажи', items: [
                { id: 'ai-reco', label: 'AI рекомендует' },
                { id: 'ai-dashboard', label: 'Дашборд AI' },
                { id: 'ai-deals', label: 'Сделки' },
                { id: 'ai-calls', label: 'Звонки' },
              ] },
              { group: 'Мониторинг', items: [
                { id: 'radar', label: 'Новостной радар' },
              ] },
              { group: 'Аналитика', items: [
                { id: 'metrika', label: 'Посещаемость' },
                { id: 'email', label: 'Email-активность' },
                { id: 'leads', label: 'Лиды' },
                { id: 'social', label: 'Соцсети' },
              ] },
            ] as const).map((section) => (
              <div key={section.group} className="mb-2">
                <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[#9AA6B2]">
                  {section.group}
                </div>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setActiveTab(item.id); setSalesTemp(undefined); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === item.id ? 'bg-[#029cda]/10 text-[#029cda] font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          {status && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800">{status}</p>
            </div>
          )}

          {activeTab === 'ai-reco' && <AiSalesSection view="reco" />}
          {activeTab === 'ai-dashboard' && (
            <AiSalesSection view="dashboard" onNavigate={(t) => { setSalesTemp(t.temperature); setActiveTab(t.tab); }} />
          )}
          {activeTab === 'ai-deals' && <AiSalesSection view="deals" initialTemperature={salesTemp} />}
          {activeTab === 'ai-calls' && <AiSalesSection view="calls" initialTemperature={salesTemp} />}
          {activeTab === 'utm' && <UtmGenerator />}
          {activeTab === 'press' && <PressAdmin />}
          {activeTab === 'letters' && <LettersAdmin />}
          {activeTab === 'radar' && <NewsRadar />}
          {activeTab === 'feedback' && <CitizenFeedback />}
          {(activeTab === 'metrika' || activeTab === 'email' || activeTab === 'leads' || activeTab === 'social') && (
            <AnalyticsDashboard only={activeTab} />
          )}

          {activeTab === 'dashboard' && (<>
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#F6F7F9] rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего статей</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#F6F7F9] rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Комментарии</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalComments}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#F6F7F9] rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Заявки на редактора</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Последние статьи */}
        <div className="bg-[#F6F7F9] rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Последние статьи</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentPosts.map((post, index) => (
              <div key={post.id || index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-500">{post.subtitle}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Последние комментарии */}
        <div className="bg-[#F6F7F9] rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Последние комментарии</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentComments.map((comment, index) => (
              <div key={comment.id || index} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.author_name || 'Аноним'} • {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>)}
        </div>
      </div>
    </div>
  );
}
