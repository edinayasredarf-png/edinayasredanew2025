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

/* ─────────── Иконки навигации (line-стиль, currentColor) ─────────── */
type IconProps = { className?: string };
const mkIcon = (d: string) => function Icon({ className }: IconProps) {
  return (
    <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};
const IconGrid = mkIcon('M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h6v6h-6Z');
const IconNews = mkIcon('M4 5h16v14H4Z M8 9h8 M8 13h8 M8 17h4');
const IconLink = mkIcon('M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1 M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1');
const IconMail = mkIcon('M4 6h16v12H4Z M4 7l8 6 8-6');
const IconChat = mkIcon('M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12Z');
const IconWave = mkIcon('M6 9v6 M10 5v14 M14 8v8 M18 10v4 M2 11v2 M22 11v2');
const IconRadar = mkIcon('M5 19a1 1 0 100-2 1 1 0 000 2 M4 11a9 9 0 019 9 M4 5a15 15 0 0115 15');
const IconChart = mkIcon('M4 20V10 M10 20V4 M16 20v-8 M22 20H2');
const IconMailOpen = mkIcon('M4 9l8-5 8 5v9H4Z M4 9l8 5 8-5');
const IconUsers = mkIcon('M16 20v-2a4 4 0 00-8 0v2 M12 12a4 4 0 100-8 4 4 0 000 8 M22 20v-2a4 4 0 00-3-3.8');
const IconShare = mkIcon('M8 12a3 3 0 10-3-3 3 3 0 003 3 M16 6a3 3 0 10-3-3 3 3 0 003 3 M16 21a3 3 0 10-3-3 3 3 0 003 3 M9 11l6-4 M9 13l6 4');
const IconBell = mkIcon('M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 01-3.4 0');

type TabId = 'dashboard' | 'metrika' | 'email' | 'leads' | 'social' | 'utm' | 'press' | 'letters' | 'radar' | 'feedback' | 'ai-analytics';
const NAV: Array<{ group: string; items: Array<{ id: TabId; label: string; icon: (p: IconProps) => React.ReactElement }> }> = [
  { group: 'Контент', items: [
    { id: 'dashboard', label: 'Дашборд', icon: IconGrid },
    { id: 'press', label: 'СМИ о нас', icon: IconNews },
    { id: 'utm', label: 'UTM-метки', icon: IconLink },
    { id: 'letters', label: 'Письма', icon: IconMail },
    { id: 'feedback', label: 'Обратная связь', icon: IconChat },
  ] },
  { group: 'AI', items: [
    { id: 'ai-analytics', label: 'Речевая аналитика', icon: IconWave },
  ] },
  { group: 'Мониторинг', items: [
    { id: 'radar', label: 'Новостной радар', icon: IconRadar },
  ] },
  { group: 'Аналитика', items: [
    { id: 'metrika', label: 'Посещаемость', icon: IconChart },
    { id: 'email', label: 'Email-активность', icon: IconMailOpen },
    { id: 'leads', label: 'Лиды', icon: IconUsers },
    { id: 'social', label: 'Соцсети', icon: IconShare },
  ] },
];
const NAV_FLAT = NAV.flatMap((s) => s.items);

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
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

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

  const activeItem = NAV_FLAT.find((i) => i.id === activeTab);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef4fb] to-[#f7fafd]">
      <div className="w-full max-w-[1900px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6 flex gap-4 lg:gap-6">
        {/* Иконочный рельс (десктоп) */}
        <aside className="hidden lg:flex flex-col items-center w-[76px] shrink-0 bg-[#029cda] rounded-[28px] py-5 sticky top-6 h-[calc(100vh-48px)] shadow-lg shadow-[#029cda]/20">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center mb-5 text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5l6 6 6-6 M6 12l6 6 6-6" /></svg>
          </div>
          <nav className="flex flex-col items-center gap-1 w-full">
            {NAV.map((section, gi) => (
              <React.Fragment key={section.group}>
                {gi > 0 && <div className="my-2 h-px w-8 bg-white/25" />}
                {section.items.map((item) => {
                  const Ic = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button key={item.id} type="button" title={item.label} onClick={() => setActiveTab(item.id)}
                      className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center transition ${active ? 'bg-white text-[#029cda] shadow' : 'text-white/85 hover:bg-white/15'}`}>
                      <Ic className="w-5 h-5" />
                      <span className="pointer-events-none absolute left-[54px] z-30 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">{item.label}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        </aside>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          {/* Верхний бар */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              {activeItem && (
                <span className="hidden sm:flex w-10 h-10 rounded-xl bg-white items-center justify-center text-[#029cda] shadow-sm">
                  {React.createElement(activeItem.icon, { className: 'w-5 h-5' })}
                </span>
              )}
              <div>
                <p className="text-xs text-gray-400 leading-none mb-1">Админ-панель</p>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-none">{activeItem?.label ?? 'Дашборд'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="relative w-10 h-10 rounded-xl bg-white text-gray-500 hover:text-[#029cda] shadow-sm flex items-center justify-center">
                <IconBell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#029cda]/10 text-[#029cda] font-semibold flex items-center justify-center">ЕС</div>
            </div>
          </div>

          {/* Мобильная навигация */}
          <div className="lg:hidden -mx-3 px-3 mb-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {NAV_FLAT.map((item) => (
                <button key={item.id} type="button" onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${activeTab === item.id ? 'bg-[#029cda] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {status && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800">{status}</p>
            </div>
          )}

          {activeTab === 'ai-analytics' && <AiSalesSection />}
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
