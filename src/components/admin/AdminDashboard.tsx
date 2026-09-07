'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { sb_listPosts } from '@/lib/blogStore';
import { sb_listAllComments } from '@/lib/commentsStore';

/* Главный дашборд админки: виджеты из разных разделов (визиты, лиды, письма,
   статьи, комментарии) с общим фильтром периода. Фон — единый серый, без теней. */

type Mode = 'today' | 'week' | 'month' | 'custom';
const dayStr = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

function rangeFor(mode: Mode, from: string, to: string): { from: string; to: string } {
  if (mode === 'today') return { from: dayStr(0), to: dayStr(0) };
  if (mode === 'week') return { from: dayStr(-6), to: dayStr(0) };
  if (mode === 'month') return { from: dayStr(-29), to: dayStr(0) };
  return { from, to };
}
const inRange = (ms: number, from: string, to: string) => {
  const t = new Date(ms).getTime();
  return t >= new Date(from + 'T00:00:00').getTime() && t < new Date(to + 'T23:59:59').getTime();
};

interface Post { id: string; title: string; createdAt: number }
interface CommentRow { id: string; content: string; author_name?: string | null; created_at: string }

function Kpi({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: string }) {
  return (
    <div className="bg-[#F6F7F9] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent || '#029cda' }} />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [mode, setMode] = useState<Mode>('today');
  const [from, setFrom] = useState(dayStr(-6));
  const [to, setTo] = useState(dayStr(0));
  const range = useMemo(() => rangeFor(mode, from, to), [mode, from, to]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [visits, setVisits] = useState<number | null>(null);
  const [leads, setLeads] = useState<number | null>(null);
  const [emails, setEmails] = useState<number | null>(null);

  // Контент (Supabase) — грузим один раз, фильтруем по периоду на клиенте.
  useEffect(() => {
    sb_listPosts().then((p) => setPosts(p as unknown as Post[])).catch(() => {});
    sb_listAllComments().then((c) => setComments(c as unknown as CommentRow[])).catch(() => {});
  }, []);

  // Аналитика (визиты/лиды/письма) — по выбранному периоду.
  const loadAnalytics = useCallback(async () => {
    const { from: f, to: t } = range;
    const get = async (url: string) => { try { const r = await fetch(url, { credentials: 'include' }); return r.ok ? await r.json() : null; } catch { return null; } };
    const [m, l, e] = await Promise.all([
      get(`/api/analytics/metrika?from=${f}&to=${t}`),
      get(`/api/analytics/leads?from=${f}&to=${t}`),
      get(`/api/analytics/email-activity?from=${f}&to=${t}`),
    ]);
    setVisits(m?.summary?.visits ?? null);
    setLeads(l?.total ?? null);
    setEmails(e?.summary?.total ?? null);
  }, [range]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const postsInRange = useMemo(() => posts.filter((p) => inRange(p.createdAt, range.from, range.to)), [posts, range]);
  const commentsInRange = useMemo(() => comments.filter((c) => inRange(new Date(c.created_at).getTime(), range.from, range.to)), [comments, range]);

  const fmt = (v: number | null) => (v == null ? '—' : new Intl.NumberFormat('ru-RU').format(v));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Обзор</h1>

      {/* Фильтр периода */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {([['today', 'Сегодня'], ['week', 'Неделя'], ['month', 'Месяц']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${mode === k ? 'bg-[#029cda] text-white' : 'bg-[#F6F7F9] text-gray-600 hover:text-gray-900'}`}>
            {l}
          </button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        <input type="date" value={mode === 'custom' ? from : range.from} max={to}
          onChange={(e) => { setMode('custom'); setFrom(e.target.value); }}
          className="px-2 py-1.5 rounded-lg bg-[#F6F7F9] text-sm text-gray-700" />
        <span className="text-gray-400 text-sm">—</span>
        <input type="date" value={mode === 'custom' ? to : range.to} min={from}
          onChange={(e) => { setMode('custom'); setTo(e.target.value); }}
          className="px-2 py-1.5 rounded-lg bg-[#F6F7F9] text-sm text-gray-700" />
      </div>

      {/* Виджеты-KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <Kpi label="Визиты на сайт" value={fmt(visits)} accent="#029cda" />
        <Kpi label="Лиды" value={fmt(leads)} accent="#22c55e" />
        <Kpi label="Письма" value={fmt(emails)} accent="#f59e0b" />
        <Kpi label="Статьи за период" value={postsInRange.length} accent="#8b5cf6" />
        <Kpi label="Комментарии за период" value={commentsInRange.length} accent="#ec4899" />
      </div>

      {/* Списки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#F6F7F9] rounded-2xl p-5">
          <p className="font-semibold text-gray-800 mb-3">Статьи за период ({postsInRange.length})</p>
          <div className="divide-y divide-gray-200/70">
            {postsInRange.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-800 truncate pr-3">{p.title}</span>
                <span className="text-gray-400 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            ))}
            {postsInRange.length === 0 && <p className="text-gray-400 text-sm py-2">Нет статей за период.</p>}
          </div>
        </div>

        <div className="bg-[#F6F7F9] rounded-2xl p-5">
          <p className="font-semibold text-gray-800 mb-3">Комментарии за период ({commentsInRange.length})</p>
          <div className="divide-y divide-gray-200/70">
            {commentsInRange.slice(0, 8).map((c) => (
              <div key={c.id} className="py-2 text-sm">
                <p className="text-gray-800 line-clamp-2">{c.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.author_name || 'Аноним'} · {new Date(c.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
            ))}
            {commentsInRange.length === 0 && <p className="text-gray-400 text-sm py-2">Нет комментариев за период.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
