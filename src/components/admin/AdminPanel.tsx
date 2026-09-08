'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { authStore } from '@/lib/authStore';
import AdminDashboard from './AdminDashboard';
import UtmGenerator from './UtmGenerator';
import PressAdmin from './PressAdmin';
import AdsAdmin from './AdsAdmin';
import AnalyticsDashboard from '@/components/profile/AnalyticsDashboard';
import LettersAdmin from './LettersAdmin';
import NewsRadar from './NewsRadar';
import CitizenFeedback from './CitizenFeedback';
import AiSalesSection from './ai-sales/AiSalesSection';

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
const IconPencil = mkIcon('M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z');
const IconAds = mkIcon('M4 5h16v14H4Z M4 9h16 M8 13h4 M8 16h6');
const IconStar = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9z" />
  </svg>
);


/* ─────────── Форма входа в админку ─────────── */
function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true); setError('');
    try {
      await authStore.signInWithEmail(email.trim(), password);
      // Успех: authStore уведомит подписчиков, AdminPanel перерисуется сам.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти. Проверьте email и пароль.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex justify-center mb-6">
          <Image src="/img/es_logo_blue.svg" alt="Единая среда" width={160} height={40} priority />
        </div>
        <h1 className="text-lg font-bold text-gray-900 text-center mb-1">Вход в админ-панель</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Войдите под учётной записью администратора</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]"
          placeholder="you@example.com" required />

        <label className="block text-sm text-gray-600 mb-1">Пароль</label>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]"
          placeholder="••••••••" required />

        <button type="submit" disabled={submitting || !email.trim() || !password}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#029cda] text-white disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
          {submitting ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

type TabId = 'dashboard' | 'metrika' | 'email' | 'leads' | 'social' | 'utm' | 'press' | 'ads' | 'letters' | 'radar' | 'feedback' | 'ai-analytics' | 'write';
const NAV: Array<{ group: string; items: Array<{ id: TabId; label: string; icon: (p: IconProps) => React.ReactElement }> }> = [
  { group: 'Контент', items: [
    { id: 'dashboard', label: 'Дашборд', icon: IconGrid },
    { id: 'write', label: 'Написать', icon: IconPencil },
    { id: 'press', label: 'СМИ о нас', icon: IconNews },
    { id: 'ads', label: 'Реклама', icon: IconAds },
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
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [favorites, setFavorites] = useState<TabId[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('es_admin_favs');
      if (s) setFavorites(JSON.parse(s));
    } catch { /* нет localStorage */ }
    setAvatarUrl(authStore.getCurrentProfile()?.avatar_url);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!profileRef.current?.contains(e.target as Node)) setShowProfileMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleFav = (id: TabId) => setFavorites((prev) => {
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    try { localStorage.setItem('es_admin_favs', JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });

  useEffect(() => {
    const checkAuth = () => {
      const initialized = authStore.isInitialized();
      const isAdmin = authStore.isAdmin();
      if (initialized) {
        setAuthChecked(true);
        setIsAuthorized(isAdmin);
        if (isAdmin) setLoading(false);
      }
    };

    checkAuth();
    const unsubscribe = authStore.subscribe(checkAuth);
    return unsubscribe;
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#029cda]" />
      </div>
    );
  }

  if (!isAuthorized) {
    // Не залогинен — показываем форму входа вместо голой ошибки.
    if (!authStore.isAuthenticated()) {
      return <AdminLogin />;
    }
    // Залогинен, но без прав администратора.
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Доступ запрещён</h2>
          <p className="text-sm text-gray-600">У этого аккаунта нет прав администратора.</p>
          <button onClick={() => authStore.signOut()}
            className="mt-5 px-4 py-2 rounded-lg text-sm bg-[#029cda] text-white">
            Войти под другим аккаунтом
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#029cda] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка админ-панели...</p>
        </div>
      </div>
    );
  }

  const menuRow = (item: { id: TabId; label: string; icon: (p: IconProps) => React.ReactElement }) => {
    const Ic = item.icon;
    const active = activeTab === item.id;
    const fav = favorites.includes(item.id);
    return (
      <div key={item.id} className="group relative">
        <button type="button" onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 pl-3 pr-8 py-2 rounded-xl text-sm transition ${active ? 'text-[#029cda] font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
          <Ic className="w-5 h-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </button>
        <button type="button" title={fav ? 'Убрать из избранного' : 'В избранное'}
          onClick={(e) => { e.stopPropagation(); toggleFav(item.id); }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 transition hover:text-amber-400 ${fav ? 'text-amber-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}>
          <IconStar className="w-4 h-4" filled={fav} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[1900px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6 flex gap-4 lg:gap-6">
        {/* Боковое меню — серые карточки-группы (Timeweb-стиль) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-6 h-[calc(100vh-48px)]">
          <div className="px-2 mb-4">
            <Image src="/img/es_logo_blue.svg" alt="Единая среда" width={140} height={38} className="h-9 w-auto" priority />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* Избранное */}
            {favorites.length > 0 && (
              <div className="bg-[#F6F7F9] rounded-2xl p-2">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#9AA6B2]">
                  <IconStar className="w-4 h-4" filled /> Избранное
                </div>
                {favorites.map((id) => {
                  const item = NAV_FLAT.find((i) => i.id === id);
                  return item ? menuRow(item) : null;
                })}
              </div>
            )}

            {/* Группы навигации */}
            {NAV.map((section) => (
              <div key={section.group} className="bg-[#F6F7F9] rounded-2xl p-2">
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#9AA6B2]">{section.group}</div>
                {section.items.map((item) => menuRow(item))}
              </div>
            ))}
          </div>

          {/* Профиль — внизу меню (перенесён из хедера, с меню) */}
          <div ref={profileRef} className="mt-3 relative">
            <button type="button" onClick={() => setShowProfileMenu((v) => !v)}
              className="w-full bg-[#F6F7F9] rounded-2xl p-2 flex items-center gap-3 hover:bg-gray-100 transition text-left">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#029cda]/10 text-[#029cda] font-semibold flex items-center justify-center shrink-0">
                {avatarUrl ? <Image src={avatarUrl} alt="Профиль" width={36} height={36} className="w-full h-full object-cover" /> : 'ЕС'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate">Профиль</div>
                <div className="text-xs text-gray-400">Администратор</div>
              </div>
              <span className="text-gray-400 text-xs">{showProfileMenu ? '▾' : '▸'}</span>
            </button>
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-gray-200 py-1 z-40">
                <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-gray-800 text-sm">
                  <Image src="/icons/profile.svg" alt="" width={16} height={16} /> Профиль
                </a>
                <button type="button" onClick={async () => { await authStore.signOut(); window.location.reload(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-red-500 text-sm">
                  <Image src="/icons/sign_out.svg" alt="" width={16} height={16} /> Выход
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          {/* Мобильная навигация */}
          <div className="lg:hidden -mx-3 px-3 mb-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {NAV_FLAT.map((item) => (
                <button key={item.id} type="button" onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${activeTab === item.id ? 'bg-[#029cda] text-white' : 'bg-[#F6F7F9] text-gray-600'}`}>
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

          {activeTab === 'write' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Написать</h1>
              <p className="text-sm text-gray-500 mb-6">Выберите, что создать — откроется редактор с этой категорией.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                {([
                  { kind: 'post', label: 'Статья', desc: 'Материал для блога' },
                  { kind: 'news', label: 'Новость', desc: 'Короткая новость' },
                  { kind: 'case', label: 'Кейс', desc: 'История внедрения / проект' },
                  { kind: 'lesson', label: 'Обучение', desc: 'Урок / обучающий материал' },
                ] as const).map((w) => (
                  <a key={w.kind} href={`/blog/new?kind=${w.kind}`}
                    className="bg-[#F6F7F9] rounded-2xl p-5 hover:bg-gray-100 transition flex items-center gap-4">
                    <span className="w-11 h-11 rounded-xl bg-[#029cda]/10 text-[#029cda] flex items-center justify-center shrink-0"><IconPencil className="w-5 h-5" /></span>
                    <div>
                      <div className="font-semibold text-gray-900">{w.label}</div>
                      <div className="text-xs text-gray-500">{w.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'ai-analytics' && <AiSalesSection />}
          {activeTab === 'utm' && <UtmGenerator />}
          {activeTab === 'press' && <PressAdmin />}
          {activeTab === 'ads' && <AdsAdmin />}
          {activeTab === 'letters' && <LettersAdmin />}
          {activeTab === 'radar' && <NewsRadar />}
          {activeTab === 'feedback' && <CitizenFeedback />}
          {(activeTab === 'metrika' || activeTab === 'email' || activeTab === 'leads' || activeTab === 'social') && (
            <AnalyticsDashboard only={activeTab} />
          )}

          {activeTab === 'dashboard' && <AdminDashboard />}
        </div>
      </div>
    </div>
  );
}
