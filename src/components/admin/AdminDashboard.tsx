'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowRightLeft, Archive, Briefcase, ChevronDown, ChevronRight,
  ClipboardList, FileEdit, FileText, Flame, FolderOpen, History, LayoutTemplate,
  Newspaper, Phone, Radar, ScrollText, Sparkles, Swords, Tags, UserPlus,
} from 'lucide-react';
import { sb_listPosts } from '@/lib/blogStore';
import { DatePicker } from '@/components/admin/ui/DatePicker';
import type { TabId } from '@/components/admin/AdminPanel';

/* «Главная» — обзорная страница админки: KPI за период, быстрый переход к
   написанию материала и плитки-ссылки на разделы отдела продаж/базы знаний.
   Плитки не хранят данные сами — просто переключают вкладку через onNavigate
   (тот же механизм, что у поиска в AdminPanel: ?tab=&asv=). */

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
const fmtRangeLabel = (from: string, to: string) => {
  const f = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return from === to ? f(from) : `${f(from)} — ${f(to)}`;
};

interface Post { id: string; title: string; createdAt: number }

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="w-32 h-32 shrink-0 rounded-3xl bg-[var(--es-tile)] p-4 flex flex-col justify-between">
      <span className="text-xs font-medium text-[var(--es-ink)] leading-4">{label}</span>
      <span className="text-2xl font-medium text-[var(--es-ink)]">{value}</span>
    </div>
  );
}

/** Иконка-плитка раздела (80×80) — переход по клику через onNavigate. */
function LinkTile({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-1.5 w-20 text-center">
      <span className="size-20 rounded-3xl bg-[var(--es-tile)] grid place-items-center transition group-hover:bg-[var(--es-tile-hover)]">
        <Icon className="w-7 h-7 text-[var(--es-ink)]" />
      </span>
      <span className="text-xs font-medium text-[var(--es-ink)] leading-4">{label}</span>
    </button>
  );
}

function SectionHeading({ title, onClick }: { title: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="text-xl font-semibold text-[var(--es-ink)]">{title}</span>
      {onClick && <ChevronRight className="w-4 h-4 text-[var(--es-ink)]" />}
    </>
  );
  if (!onClick) return <div className="flex items-center gap-1 mb-4">{content}</div>;
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 mb-4 hover:opacity-70 transition">
      {content}
    </button>
  );
}

const WRITE_KINDS = [
  { kind: 'post', label: 'Статья', icon: FileText },
  { kind: 'news', label: 'Новость', icon: Newspaper },
  { kind: 'case', label: 'Кейс', icon: Briefcase },
] as const;

export default function AdminDashboard({ onNavigate }: { onNavigate?: (tab: TabId, view?: string) => void }) {
  const [mode, setMode] = useState<Mode>('month');
  const [from, setFrom] = useState(dayStr(-29));
  const [to, setTo] = useState(dayStr(0));
  const range = useMemo(() => rangeFor(mode, from, to), [mode, from, to]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [visits, setVisits] = useState<number | null>(null);
  const [leads, setLeads] = useState<number | null>(null);
  const [emails, setEmails] = useState<number | null>(null);

  // Статьи (Supabase) — грузим один раз, фильтруем по периоду на клиенте.
  useEffect(() => {
    sb_listPosts().then((p) => setPosts(p as unknown as Post[])).catch(() => {});
  }, []);

  // Аналитика (визиты/лиды/письма) — по выбранному периоду.
  useEffect(() => {
    let cancelled = false;
    const get = async (url: string) => { try { const r = await fetch(url, { credentials: 'include' }); return r.ok ? await r.json() : null; } catch { return null; } };
    (async () => {
      const { from: f, to: t } = range;
      const [m, l, e] = await Promise.all([
        get(`/api/analytics/metrika?from=${f}&to=${t}`),
        get(`/api/analytics/leads?from=${f}&to=${t}`),
        get(`/api/analytics/email-activity?from=${f}&to=${t}`),
      ]);
      if (cancelled) return;
      setVisits(m?.summary?.visits ?? null);
      setLeads(l?.total ?? null);
      setEmails(e?.summary?.total ?? null);
    })();
    return () => { cancelled = true; };
  }, [range]);

  // Отдел продаж: звонки сегодня + горячие сделки за период (/api/ai-sales/dashboard).
  const [callsToday, setCallsToday] = useState<number | null>(null);
  const [hotDeals, setHotDeals] = useState<number | null>(null);
  useEffect(() => {
    const get = async (f: string, t: string) => {
      try {
        const r = await fetch(`/api/ai-sales/dashboard?from=${f}&to=${t}`, { credentials: 'include' });
        return r.ok ? await r.json() : null;
      } catch { return null; }
    };
    get(dayStr(0), dayStr(0)).then((d) => setCallsToday(d?.calls?.total ?? null));
    get(range.from, range.to).then((d) => setHotDeals(d?.temperature?.hot ?? null));
  }, [range.from, range.to]);

  // Менеджеры отдела продаж (только для РОП/админа — при отказе просто не показываем).
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/ai-sales/managers?from=${dayStr(-29)}&to=${dayStr(0)}`, { credentials: 'include' });
        if (!r.ok) return;
        const d = await r.json();
        type Row = { bitrixUserId: string; name: string | null };
        const items: Row[] = d?.items ?? [];
        setManagers(items.slice(0, 4).map((m) => ({ id: m.bitrixUserId, name: m.name || 'Без имени' })));
      } catch { /* нет доступа — просто не показываем менеджеров */ }
    })();
  }, []);

  const postsInRange = useMemo(() => posts.filter((p) => inRange(p.createdAt, range.from, range.to)), [posts, range]);
  const fmt = (v: number | null) => (v == null ? '—' : new Intl.NumberFormat('ru-RU').format(v));
  const go = (tab: TabId, view?: string) => () => onNavigate?.(tab, view);

  const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Заголовок + фильтр периода */}
      <div className="flex flex-col items-center text-center gap-5 mb-10">
        <h1 className="text-xl font-semibold text-[var(--es-ink)]">Главная</h1>
        <p className="text-[var(--es-ink-2)] max-w-sm">Смотрите тут все виджеты и дела, которые происходят в отделах</p>
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--es-tile)]">
            {([['today', 'Сегодня'], ['week', 'Неделя'], ['month', 'Месяц']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setMode(k)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${mode === k ? 'bg-white text-[var(--es-ink)] shadow-[var(--es-shadow-sm)]' : 'text-[var(--es-ink-2)] hover:text-[var(--es-ink)]'}`}>
                {l}
              </button>
            ))}
            <button type="button" onClick={() => setMode('custom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${mode === 'custom' ? 'bg-white text-[var(--es-ink)] shadow-[var(--es-shadow-sm)]' : 'text-[var(--es-ink-2)] hover:text-[var(--es-ink)]'}`}>
              {fmtRangeLabel(range.from, range.to)}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {mode === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker value={from} max={to} placeholder="с даты" className="w-[150px]" onChange={setFrom} />
              <span className="text-[var(--es-ink-3)] text-sm">—</span>
              <DatePicker value={to} min={from} placeholder="по дату" className="w-[150px]" onChange={setTo} />
            </div>
          )}
        </div>
      </div>

      {/* KPI за период */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-1">
        <Kpi label="Визиты на сайт" value={fmt(visits)} />
        <Kpi label="Лиды" value={fmt(leads)} />
        <Kpi label="Письма" value={fmt(emails)} />
        <Kpi label="Статьи" value={postsInRange.length} />
        <button type="button" onClick={go('metrika')} title="Вся аналитика"
          className="shrink-0 size-12 rounded-full bg-white shadow-[var(--es-shadow-sm)] grid place-items-center hover:bg-[var(--es-tile)] transition">
          <ArrowRight className="w-5 h-5 text-[var(--es-ink)]" />
        </button>
      </div>

      {/* Написать */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-[var(--es-ink)] mb-1">Написать</h2>
        <p className="text-sm text-[var(--es-ink-2)] mb-4">Выберите, что создать — откроется редактор с этой категорией</p>
        <div className="flex gap-4">
          {WRITE_KINDS.map((w) => (
            <a key={w.kind} href={`/blog/new?kind=${w.kind}`}
              className="group flex-1 flex flex-col items-center gap-1.5">
              <span className="w-full h-20 rounded-3xl bg-[var(--es-tile)] grid place-items-center transition group-hover:bg-[var(--es-tile-hover)]">
                <w.icon className="w-7 h-7 text-[var(--es-ink)]" />
              </span>
              <span className="text-xs font-medium text-[var(--es-ink)]">{w.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Отдел продаж */}
      <div className="mb-10">
        <SectionHeading title="Отдел продаж" onClick={go('kp')} />
        <div className="flex gap-3 mb-4">
          <div className="flex-1 h-20 rounded-3xl bg-[var(--es-tile)] p-5 flex items-center gap-3">
            <Phone className="w-6 h-6 text-[var(--es-ink)] shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--es-ink)] leading-5">{fmt(callsToday)}</p>
              <p className="text-sm font-medium text-[var(--es-ink-2)] leading-4">Сегодня звонков</p>
            </div>
          </div>
          <div className="flex-1 h-20 rounded-3xl bg-[var(--es-tile)] p-5 flex items-center gap-3">
            <Flame className="w-6 h-6 text-[var(--es-ink)] shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--es-ink)] leading-5">{fmt(hotDeals)}</p>
              <p className="text-sm font-medium text-[var(--es-ink-2)] leading-4">Горячих сделок за период</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-4">
          <LinkTile icon={FileEdit} label="Генератор КП" onClick={go('kp')} />
          <LinkTile icon={ArrowRightLeft} label="PDF в Word" onClick={go('kp')} />
          <LinkTile icon={Radar} label="Сигналы по сделкам" onClick={go('ai-analytics', 'signals')} />
          <LinkTile icon={ClipboardList} label="Отчеты" onClick={go('ai-analytics', 'insights')} />
          <LinkTile icon={Archive} label="Реестр КП" onClick={go('kp')} />
          <LinkTile icon={History} label="История писем" onClick={go('letters')} />
        </div>
      </div>

      {/* База знаний */}
      <div className="mb-10">
        <SectionHeading title="База знаний" onClick={go('ai-analytics', 'kb')} />
        <div className="flex flex-wrap gap-x-4 gap-y-4">
          <LinkTile icon={ScrollText} label="Скрипты" onClick={go('ai-analytics', 'scripts')} />
          <LinkTile icon={FolderOpen} label="Все документы" onClick={go('ai-analytics', 'kb')} />
          <LinkTile icon={LayoutTemplate} label="Шаблоны КП" onClick={go('kp')} />
          <LinkTile icon={Sparkles} label="Промты" onClick={go('ai-analytics', 'prompts')} />
          <LinkTile icon={Swords} label="Конкуренты" onClick={go('ai-analytics', 'lost')} />
          <LinkTile icon={Tags} label="Услуги" onClick={go('kp')} />
        </div>
      </div>

      {/* Менеджеры */}
      {managers.length > 0 && (
        <div className="mb-10">
          <SectionHeading title="Менеджеры" onClick={go('ai-analytics', 'managers')} />
          <div className="flex flex-wrap gap-x-4 gap-y-4">
            {managers.map((m) => (
              <button key={m.id} type="button" onClick={go('ai-analytics', 'managers')}
                className="group flex flex-col items-center gap-1.5 w-20 text-center">
                <span className="size-20 rounded-3xl bg-[#029cda]/10 text-[#029cda] text-lg font-semibold grid place-items-center transition group-hover:bg-[#029cda]/15">
                  {initials(m.name)}
                </span>
                <span className="text-xs font-medium text-[var(--es-ink)] leading-4 line-clamp-2">{m.name}</span>
              </button>
            ))}
            <button type="button" onClick={go('ai-analytics', 'departments')}
              className="group flex flex-col items-center gap-1.5 w-20 text-center">
              <span className="size-20 rounded-3xl border-2 border-dashed border-[var(--es-line)] grid place-items-center text-[var(--es-ink-3)] transition group-hover:border-[var(--es-ink-3)]">
                <UserPlus className="w-6 h-6" />
              </span>
              <span className="text-xs font-medium text-[var(--es-ink-3)] leading-4">Добавить ещё</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
