'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Wallet } from 'lucide-react';
import { Modal } from '@/components/admin/ui/Modal';
import { LoadingBlock } from '@/components/admin/ui/Spinner';

/* «Финансы компании» — финансовая сводка главной админки: доход/план/контракты/расходы, динамика дохода,
   выполнение плана и вкладки по отделам (продажи, проекты, сервис). Данные — /api/finance/overview (сделки Bitrix);
   планы и затраты вводятся вручную (/api/finance/plans). Графики — чистый CSS, без внешних библиотек. */

type Period = 'week' | 'month' | 'half' | 'year';
type Dept = 'sales' | 'projects' | 'service';

interface Overview {
  period: Period; label: string;
  income: { fact: number; count: number; plan: number | null; pct: number | null; reserve: number | null };
  expenses: { amount: number | null; monthly: number | null };
  forecastRemainder: number;
  contractsInWork: { sum: number; count: number };
  series: Array<{ label: string; from: string; to: string; fact: number; plan: number | null }>;
  sales: { fact: number; count: number; plan: number | null; pct: number | null };
  projects: { waiting: { sum: number; count: number }; topContracts: Array<{ id: string; name: string; amount: number }> };
  service: { prolongations: { sum: number; count: number; days: number } };
  line: { date: string; callsToday: number; defaultPlanMin: number | null; managers: Array<{ id: string; name: string; minutes: number; calls: number; planMin: number | null; individualPlan: number | null }> };
  plans: { incomePlanMonthly: number | null; expensesMonthly: number | null; salesPlanMonthly: number | null; linePlanDefaultMin: number | null; linePlanByManager: Record<string, number> };
  closeDateKnownPct: number;
}

const PERIODS: Array<[Period, string]> = [['week', 'Неделя'], ['month', 'Месяц'], ['half', 'Полгода'], ['year', 'Год']];
const DEPTS: Array<[Dept, string]> = [['sales', 'Отдел продаж'], ['projects', 'Отдел управления проектами'], ['service', 'Отдел сервиса']];

const nf = new Intl.NumberFormat('ru-RU');
/** 5 500 000 → «5,5 млн ₽»; меньше миллиона — полностью. */
function rub(n: number | null | undefined, short = true): string {
  if (n == null) return '—';
  if (short && Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(/,0$/, '')} млн ₽`;
  return `${nf.format(Math.round(n))} ₽`;
}
const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many;
};
const timeHM = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

function Tile({ label, children, sub, dark = false, onClick }: { label: string; children: React.ReactNode; sub?: React.ReactNode; dark?: boolean; onClick?: () => void }) {
  const cls = `rounded-3xl p-5 min-h-[132px] flex flex-col justify-between text-left w-full ${dark ? 'bg-[var(--es-black)] text-white' : 'bg-[var(--es-tile)] text-[var(--es-ink)]'}${onClick ? ' transition hover:brightness-95 cursor-pointer' : ''}`;
  const inner = (
    <>
      <span className={`text-sm ${dark ? 'text-white/65' : 'text-[var(--es-ink-2)]'}`}>{label}</span>
      <div>
        <div className="text-2xl sm:text-[28px] leading-8 font-semibold tracking-tight">{children}</div>
        {sub != null && <div className={`text-xs mt-1 ${dark ? 'text-white/60' : 'text-[var(--es-ink-2)]'}`}>{sub}</div>}
      </div>
    </>
  );
  return onClick ? <button type="button" onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>;
}

function ProgressBar({ pct, tone }: { pct: number | null; tone: 'accent' | 'good' | 'warn' | 'bad' | 'none' }) {
  const color = { accent: 'bg-[var(--es-accent)]', good: 'bg-[var(--es-good)]', warn: 'bg-[var(--es-warn)]', bad: 'bg-[var(--es-bad)]', none: 'bg-transparent' }[tone];
  return (
    <div className="h-2 rounded-full bg-[var(--es-tile-2)] overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct ?? 0))}%` }} />
    </div>
  );
}

/** Столбчатая диаграмма «факт / план» на CSS. */
function BarChart({ series }: { series: Overview['series'] }) {
  const max = Math.max(1, ...series.map((s) => Math.max(s.fact, s.plan ?? 0)));
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="relative">
      <div className="relative h-[220px] flex items-end gap-1.5 sm:gap-3 pt-2">
        {[0.33, 0.66, 1].map((g) => (
          <div key={g} className="absolute left-0 right-0 border-t border-dashed border-[var(--es-line)] pointer-events-none" style={{ bottom: `${g * 100 * 0.9}%` }} />
        ))}
        {series.map((s, i) => (
          <div key={s.from} className="relative flex-1 h-full flex items-end justify-center gap-1" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            {s.plan != null && <div className="w-2 sm:w-3 rounded-t-md bg-[var(--es-tile-2)]" style={{ height: `${Math.max(1.5, (s.plan / max) * 90)}%` }} />}
            <div className="w-5 sm:w-9 rounded-t-lg bg-[var(--es-accent)] transition-opacity hover:opacity-85" style={{ height: `${Math.max(s.fact > 0 ? 1.5 : 0.6, (s.fact / max) * 90)}%` }} />
            {hover === i && (
              <div className="absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[var(--es-black)] text-white text-xs px-3 py-2 shadow-lg">
                <div className="font-semibold">{s.label}</div>
                <div>Факт: {rub(s.fact, false)}</div>
                {s.plan != null && <div className="text-white/70">План: {rub(s.plan, false)}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 sm:gap-3 mt-2">
        {series.map((s) => <div key={s.from} className="flex-1 text-center text-[11px] text-[var(--es-ink-2)]">{s.label}</div>)}
      </div>
    </div>
  );
}

/* ───────────── модальные окна планов ───────────── */

function MoneyModal({ title, text, label, initial, onClose, onSave }: { title: string; text: string; label: string; initial: number | null; onClose: () => void; onSave: (v: number | null) => Promise<void> }) {
  const [v, setV] = useState(initial ? String(initial) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    setBusy(true); setErr('');
    try { await onSave(v.trim() ? Number(v.replace(/\s/g, '').replace(',', '.')) : null); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-md">
      <p className="text-sm text-[var(--es-ink-2)]">{text}</p>
      <label className="block text-sm font-medium text-[var(--es-ink)]">{label}
        <input autoFocus type="number" min={0} inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          className="mt-2 w-full px-4 py-3 rounded-2xl border border-[var(--es-line)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--es-accent)]/40" placeholder="например 25000000" />
      </label>
      {err && <p className="text-sm text-[var(--es-bad)]">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--es-line)] text-sm hover:bg-[var(--es-tile)]">Отмена</button>
        <button type="button" onClick={save} disabled={busy} className="px-4 py-2.5 rounded-xl bg-[var(--es-black)] text-white text-sm disabled:opacity-50">{busy ? 'Сохраняю…' : 'Сохранить'}</button>
      </div>
    </Modal>
  );
}

const splitHM = (min: number | null) => ({ h: min ? String(Math.floor(min / 60)) : '', m: min ? String(min % 60) : '' });
const joinHM = (h: string, m: string) => Math.max(0, Math.round((Number(h) || 0) * 60 + (Number(m) || 0)));

function HMInput({ h, m, onChange, placeholder }: { h: string; m: string; onChange: (h: string, m: string) => void; placeholder?: boolean }) {
  const cls = 'w-16 px-3 py-2 rounded-xl border border-[var(--es-line)] bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--es-accent)]/40';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--es-ink-2)]">
      <input type="number" min={0} max={24} value={h} placeholder={placeholder ? '0' : undefined} onChange={(e) => onChange(e.target.value, m)} className={cls} /> ч
      <input type="number" min={0} max={59} value={m} placeholder={placeholder ? '0' : undefined} onChange={(e) => onChange(h, e.target.value)} className={cls} /> мин
    </span>
  );
}

function LinePlanModal({ data, only, onClose, onSave }: { data: Overview; only?: string; onClose: () => void; onSave: (def: number | null, byMgr: Record<string, number>) => Promise<void> }) {
  const [def, setDef] = useState(splitHM(data.plans.linePlanDefaultMin));
  const [mgr, setMgr] = useState<Record<string, { h: string; m: string }>>(() => Object.fromEntries(data.line.managers.map((m) => [m.id, splitHM(data.plans.linePlanByManager[m.id] ?? null)])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const list = only ? data.line.managers.filter((m) => m.id === only) : data.line.managers;
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const byMgr: Record<string, number> = {};
      for (const m of data.line.managers) { const v = joinHM(mgr[m.id]?.h ?? '', mgr[m.id]?.m ?? ''); if (v > 0) byMgr[m.id] = v; }
      await onSave(joinHM(def.h, def.m) || null, byMgr); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); setBusy(false); }
  };
  return (
    <Modal title="Дневной план времени на линии" onClose={onClose} maxWidth="max-w-xl">
      <p className="text-sm text-[var(--es-ink-2)]">Общий план применяется ко всем. Индивидуальный план сотрудника имеет приоритет; оставьте его пустым, чтобы использовать общий.</p>
      {!only && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--es-accent-soft)] p-4">
          <div><div className="text-sm font-semibold text-[var(--es-ink)]">Общий план для всех</div><div className="text-xs text-[var(--es-ink-2)]">Время на линии за один день</div></div>
          <HMInput h={def.h} m={def.m} onChange={(h, m) => setDef({ h, m })} placeholder />
        </div>
      )}
      <div className="space-y-3">
        {list.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0"><div className="text-sm font-semibold text-[var(--es-ink)] truncate">{m.name}</div><div className="text-xs text-[var(--es-ink-2)]">Менеджер по продажам · пусто = общий план</div></div>
            <HMInput h={mgr[m.id]?.h ?? ''} m={mgr[m.id]?.m ?? ''} onChange={(h, mm) => setMgr((p) => ({ ...p, [m.id]: { h, m: mm } }))} placeholder />
          </div>
        ))}
        {!list.length && <p className="text-sm text-[var(--es-ink-3)]">Сотрудники отдела продаж не найдены. Заведите отдел «Отдел продаж» и назначьте менеджеров в Речевой аналитике → Настройка → Отделы.</p>}
      </div>
      <p className="text-xs text-[var(--es-ink-3)]">Зелёный — 100% и выше, жёлтый — от 80% до 99%, красный — ниже 80%. План сохраняется, пока вы его не измените.</p>
      {err && <p className="text-sm text-[var(--es-bad)]">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--es-line)] text-sm hover:bg-[var(--es-tile)]">Отмена</button>
        <button type="button" onClick={save} disabled={busy} className="px-4 py-2.5 rounded-xl bg-[var(--es-black)] text-white text-sm disabled:opacity-50">{busy ? 'Сохраняю…' : 'Сохранить'}</button>
      </div>
    </Modal>
  );
}

/* ───────────── основной компонент ───────────── */

export default function FinanceOverview({ onNavigate }: { onNavigate?: (tab: 'ai-analytics', view?: string) => void }) {
  const [period, setPeriod] = useState<Period>('month');
  const [dept, setDept] = useState<Dept>('sales');
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading');
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [modal, setModal] = useState<null | 'income' | 'expenses' | 'sales' | { line: string | 'all' }>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState('loading'); else setRefreshing(true);
    try {
      const r = await fetch(`/api/finance/overview?period=${period}`, { credentials: 'include' });
      if (r.status === 401 || r.status === 403) { setState('denied'); return; }
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j); setUpdatedAt(new Date()); setState('ok'); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); setState((s) => (s === 'ok' ? 'ok' : 'error')); }
    finally { setRefreshing(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const savePlans = async (body: Record<string, unknown>) => {
    const r = await fetch('/api/finance/plans', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Не удалось сохранить');
    await load(true);
  };

  const todayLabel = useMemo(() => new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }), []);

  if (state === 'denied') return null; // сводка только для РОП/админа
  if (state === 'loading' && !data) return <section className="mb-10"><LoadingBlock /></section>;
  if (state === 'error' && !data) return <section className="mb-10 p-4 rounded-2xl bg-[var(--es-bad-soft)] text-[var(--es-bad)] text-sm">Не удалось загрузить финансовую сводку: {err}</section>;
  if (!data) return null;

  const d = data;
  const lineTone = (min: number, plan: number | null) => (plan ? (min / plan >= 1 ? 'good' : min / plan >= 0.8 ? 'warn' : 'bad') : 'none') as 'good' | 'warn' | 'bad' | 'none';

  return (
    <section className="mb-12 w-full">
      {/* Шапка */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="size-11 rounded-2xl bg-[var(--es-accent)] text-white grid place-items-center shrink-0"><Wallet className="w-5 h-5" /></span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-[var(--es-ink)] leading-6">Финансы компании</h2>
            <p className="text-xs text-[var(--es-ink-2)]">Управленческий обзор · {d.label}{updatedAt ? ` · обновлено ${timeHM(updatedAt)}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(true)} title="Обновить" aria-label="Обновить" className="size-10 rounded-xl bg-[var(--es-tile)] grid place-items-center hover:bg-[var(--es-tile-hover)] transition">
            <RefreshCw className={`w-4 h-4 text-[var(--es-ink)] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => setModal('income')} className="px-4 py-2.5 rounded-xl bg-[var(--es-accent)] text-white text-sm font-medium hover:bg-[var(--es-accent-ink)] transition">Настроить план</button>
        </div>
      </div>
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--es-tile)] mb-5 max-w-full overflow-x-auto">
        {PERIODS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setPeriod(k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${period === k ? 'bg-white text-[var(--es-ink)] shadow-[var(--es-shadow-sm)]' : 'text-[var(--es-ink-2)] hover:text-[var(--es-ink)]'}`}>{l}</button>
        ))}
      </div>
      {d.closeDateKnownPct < 100 && (
        <p className="text-xs text-[var(--es-warn)] bg-[var(--es-warn-soft)] rounded-xl px-3 py-2 mb-4">
          Даты закрытия сделок подтягиваются из Bitrix ({d.closeDateKnownPct}% готово): пока доход считается по дате последнего изменения сделки. Запустите синхронизацию сделок (Речевая аналитика → «Синхронизировать Bitrix»).
        </p>
      )}

      {/* Показатели */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Tile dark label="Доход за период" sub={`${d.income.count} ${plural(d.income.count, 'успешная сделка', 'успешные сделки', 'успешных сделок')}`}>{rub(d.income.fact)}</Tile>
        <Tile label="План по доходу" onClick={() => setModal('income')} sub={d.income.plan != null ? `${d.income.pct ?? 0}% выполнено` : 'Нажмите «Настроить план»'}>
          {d.income.plan != null ? rub(d.income.plan) : 'Не задан'}
        </Tile>
        <Tile label="Контракты в работе" sub={`${nf.format(d.contractsInWork.count)} активных сделок`}>{rub(d.contractsInWork.sum)}</Tile>
        <Tile label="Плановые расходы" sub={
          <span className="flex flex-wrap items-center gap-2">
            <span>{d.expenses.monthly ? `Из ${rub(d.expenses.monthly)} в месяц` : 'Не заданы'}</span>
            <button type="button" onClick={() => setModal('expenses')} className="px-2.5 py-1 rounded-lg bg-[var(--es-black)] text-white text-[11px] font-medium">Настроить затраты</button>
          </span>}>
          {d.expenses.amount != null ? rub(d.expenses.amount) : '—'}
        </Tile>
      </div>

      {/* Динамика + выполнение плана */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-6">
        <div className="rounded-3xl border border-[var(--es-line)] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[var(--es-ink)]">Динамика дохода</h3>
            <div className="flex items-center gap-3 text-xs text-[var(--es-ink-2)]">
              <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[var(--es-accent)]" />Факт</span>
              <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[var(--es-tile-2)]" />План</span>
            </div>
          </div>
          <BarChart series={d.series} />
        </div>
        <div className="rounded-3xl bg-[var(--es-black)] text-white p-5 flex flex-col">
          <div className="flex items-center justify-between text-sm text-white/70 mb-3">
            <span>Выполнение плана</span>
            <span>{d.income.plan != null ? `${d.income.pct ?? 0}%` : 'Укажите план'}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/15 overflow-hidden mb-5">
            <div className="h-full rounded-full bg-[var(--es-accent)] transition-all" style={{ width: `${Math.min(100, d.income.pct ?? 0)}%` }} />
          </div>
          <div className="text-4xl font-semibold tracking-tight mb-5">{d.income.plan != null ? `${d.income.pct ?? 0}%` : '—'}</div>
          <div className="mt-auto border-t border-white/10 pt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-white/70">Запас до плана</span><span className="font-medium">{d.income.reserve != null ? (d.income.reserve > 0 ? rub(d.income.reserve) : 'выполнен') : '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-white/70">Прогнозный остаток</span><span className="font-semibold text-[#5fd0f3]">{rub(d.forecastRemainder)}</span></div>
          </div>
        </div>
      </div>

      {/* Отделы */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--es-tile)] mb-4 max-w-full overflow-x-auto">
        {DEPTS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setDept(k)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${dept === k ? 'bg-[var(--es-black)] text-white' : 'text-[var(--es-ink-2)] hover:text-[var(--es-ink)]'}`}>{l}</button>
        ))}
      </div>

      {dept === 'sales' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[var(--es-line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div><h3 className="font-semibold text-[var(--es-ink)]">Продажи ЕС · план / факт</h3><p className="text-xs text-[var(--es-ink-2)]">«Единая Среда» · успешно реализованные сделки отдела продаж</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onNavigate?.('ai-analytics', 'deals')} className="px-4 py-2 rounded-xl border border-[var(--es-line)] text-sm font-medium hover:bg-[var(--es-tile)] transition">Посмотреть детально</button>
                <button type="button" onClick={() => setModal('sales')} className="px-4 py-2 rounded-xl bg-[var(--es-black)] text-white text-sm font-medium">Задать план</button>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--es-tile)] p-4 grid sm:grid-cols-[220px_1fr] gap-4 items-center">
              <div><div className="text-xs text-[var(--es-ink-2)]">Факт за период</div><div className="text-2xl font-semibold text-[var(--es-ink)]">{rub(d.sales.fact, false)}</div><div className="text-xs text-[var(--es-ink-2)]">{d.sales.count} {plural(d.sales.count, 'сделка', 'сделки', 'сделок')}</div></div>
              <div>
                <ProgressBar pct={d.sales.pct} tone={d.sales.pct != null ? (d.sales.pct >= 100 ? 'good' : d.sales.pct >= 80 ? 'warn' : 'accent') : 'none'} />
                <div className="flex justify-between text-xs text-[var(--es-ink-2)] mt-2"><span>{d.sales.plan != null ? `План ${rub(d.sales.plan, false)}` : 'План не задан'}</span><span>{d.sales.pct != null ? `${d.sales.pct}%` : '—'}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--es-line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div><h3 className="font-semibold text-[var(--es-ink)]">Время на линии сегодня · план / факт</h3><p className="text-xs text-[var(--es-ink-2)]">{d.line.callsToday} {plural(d.line.callsToday, 'разговор', 'разговора', 'разговоров')} за сегодня, {todayLabel}</p></div>
              <button type="button" onClick={() => setModal({ line: 'all' })} className="px-4 py-2 rounded-xl bg-[var(--es-black)] text-white text-sm font-medium">Задать дневной план</button>
            </div>
            {d.line.managers.length ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {d.line.managers.map((m) => {
                  const pct = m.planMin ? Math.round((m.minutes / m.planMin) * 100) : null;
                  const tone = lineTone(m.minutes, m.planMin);
                  return (
                    <div key={m.id} className="rounded-2xl border border-[var(--es-line)] p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><div className="text-sm font-semibold text-[var(--es-ink)] truncate">{m.name}</div><div className="text-xs text-[var(--es-ink-2)]">Менеджер по продажам</div></div>
                        <span className="flex items-center gap-2 shrink-0">
                          <i className={`size-2 rounded-full ${tone === 'good' ? 'bg-[var(--es-good)]' : tone === 'warn' ? 'bg-[var(--es-warn)]' : tone === 'bad' ? 'bg-[var(--es-bad)]' : 'bg-[var(--es-ink-3)]'}`} />
                          <button type="button" onClick={() => setModal({ line: m.id })} className="px-2.5 py-1 rounded-lg border border-[var(--es-line)] text-[11px] font-medium hover:bg-[var(--es-tile)]">Изменить</button>
                        </span>
                      </div>
                      <div className="text-2xl font-semibold text-[var(--es-ink)] my-3">{m.minutes} мин</div>
                      <ProgressBar pct={pct} tone={tone} />
                      <div className="flex justify-between text-xs text-[var(--es-ink-2)] mt-2"><span>{m.planMin ? `План ${m.planMin} мин` : 'План не задан'}</span><span>{m.calls} {plural(m.calls, 'звонок', 'звонка', 'звонков')}</span></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--es-ink-3)]">Сотрудники отдела продаж не найдены. Заведите отдел «Отдел продаж» и назначьте менеджеров (Речевая аналитика → Настройка → Отделы).</p>
            )}
            <p className="text-[11px] text-[var(--es-ink-3)] mt-3">Время разговоров берётся из записей звонков и появляется после их расшифровки.</p>
          </div>
        </div>
      )}

      {dept === 'projects' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Tile label="В ожидании" sub={`${d.projects.waiting.count} ${plural(d.projects.waiting.count, 'сделка', 'сделки', 'сделок')} · сумма не зависит от периода`}>{rub(d.projects.waiting.sum)}</Tile>
          </div>
          <div className="rounded-3xl border border-[var(--es-line)] bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h3 className="font-semibold text-[var(--es-ink)]">Крупнейшие контракты в работе</h3>
              <span className="text-xs text-[var(--es-ink-2)]">Управление проектами · В работе · по сумме сделки</span>
            </div>
            {d.projects.topContracts.length ? (
              <table className="w-full text-sm">
                <thead><tr className="text-[11px] uppercase tracking-wide text-[var(--es-ink-3)]"><th className="text-left font-medium py-2">Сделка</th><th className="text-right font-medium py-2">Сумма</th></tr></thead>
                <tbody>
                  {d.projects.topContracts.map((t) => (
                    <tr key={t.id} className="border-t border-[var(--es-line)]"><td className="py-3 pr-3 text-[var(--es-ink)]">{t.name}</td><td className="py-3 text-right font-semibold whitespace-nowrap text-[var(--es-ink)]">{rub(t.amount, false)}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-sm text-[var(--es-ink-3)]">Нет контрактов на этапе «В работе».</p>}
          </div>
        </div>
      )}

      {dept === 'service' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Tile label="Пролонгации" sub={`${d.service.prolongations.count} ${plural(d.service.prolongations.count, 'пролонгация', 'пролонгации', 'пролонгаций')} за ${d.service.prolongations.days} дней`}>{rub(d.service.prolongations.sum, false)}</Tile>
        </div>
      )}

      {/* Модальные окна */}
      {modal === 'income' && (
        <MoneyModal title="План по доходу" text="Введите месячный план. Остальные периоды рассчитываются автоматически." label="Месячный план, ₽" initial={d.plans.incomePlanMonthly}
          onClose={() => setModal(null)} onSave={(v) => savePlans({ incomePlanMonthly: v })} />
      )}
      {modal === 'expenses' && (
        <MoneyModal title="Плановые расходы" text="Введите месячные затраты компании. На неделю, полгода и год они пересчитываются автоматически." label="Затраты в месяц, ₽" initial={d.plans.expensesMonthly}
          onClose={() => setModal(null)} onSave={(v) => savePlans({ expensesMonthly: v })} />
      )}
      {modal === 'sales' && (
        <MoneyModal title="План продаж ЕС" text="Введите месячный план продаж «Единой Среды» в рублях." label="Месячный план, ₽" initial={d.plans.salesPlanMonthly}
          onClose={() => setModal(null)} onSave={(v) => savePlans({ salesPlanMonthly: v })} />
      )}
      {modal && typeof modal === 'object' && (
        <LinePlanModal data={d} only={modal.line === 'all' ? undefined : modal.line} onClose={() => setModal(null)}
          onSave={(def, byMgr) => savePlans({ linePlanDefaultMin: def, linePlanByManager: byMgr })} />
      )}
    </section>
  );
}
