'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Spinner, LoadingBlock } from '@/components/admin/ui/Spinner';

/* Раздел «AI Продажи» админ-панели: дашборд, звонки, карточка звонка.
   Данные — из /api/ai-sales/*. Стиль — фирменный (#029cda), Tailwind. */

type View = 'dashboard' | 'calls' | 'search' | 'deals' | 'reco' | 'insights' | 'followups' | 'managers' | 'rop' | 'tags' | 'settings' | 'lost' | 'departments' | 'prompts' | 'scripts' | 'qc' | 'kb' | 'assistant';
export type NavTarget = { tab: 'ai-deals' | 'ai-calls' | 'ai-reco'; temperature?: string; tag?: string };

const fmtDur = (sec: number | null) => {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const pluralCalls = (n: number) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'звонок';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'звонка';
  return 'звонков';
};

const TEMP_BADGE: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700',
  WARM: 'bg-amber-100 text-amber-700',
  COLD: 'bg-sky-100 text-sky-700',
};

const TEMP_LABEL: Record<string, string> = {
  HOT: 'Горячий', WARM: 'Тёплый', COLD: 'Холодный',
};
/** Русская подпись температуры (для бейджей вместо HOT/WARM/COLD). */
const tempRu = (t: string | null | undefined) => (t ? (TEMP_LABEL[t] || t) : '');

const TEMP_RANK: Record<string, number> = { HOT: 3, WARM: 2, COLD: 1 };
/** «Общая» температура группы — самая горячая из присутствующих. */
function hottestTemp(temps: Array<string | null>): string | null {
  let best: string | null = null; let bestRank = 0;
  for (const t of temps) {
    const r = t ? (TEMP_RANK[t] || 0) : 0;
    if (r > bestRank) { bestRank = r; best = t; }
  }
  return best;
}
const sumNums = (ns: Array<number | null>) => {
  let s = 0, has = false;
  for (const n of ns) if (typeof n === 'number') { s += n; has = true; }
  return has ? s : null;
};
const maxNum = (ns: Array<number | null>) => {
  let m: number | null = null;
  for (const n of ns) if (typeof n === 'number') m = m === null ? n : Math.max(m, n);
  return m;
};

const CALL_TYPE_LABEL: Record<string, string> = {
  first_contact: 'Первичный контакт', discovery: 'Выявление потребности',
  presentation: 'Презентация', demo: 'Демонстрация', negotiation: 'Переговоры',
  follow_up: 'Перезвон/дожим', clarification: 'Уточнение', closing: 'Закрытие',
  support: 'Поддержка', other: 'Другое',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'В очереди', DOWNLOADING: 'Скачивание', TRANSCRIBING: 'Транскрибация',
  TRANSCRIBED: 'Расшифрован', ANALYZING: 'Анализ', COMPLETED: 'Готово',
  FAILED: 'Ошибка', RETRY_PENDING: 'Повтор', NO_RECORDING: 'Нет записи',
};

function Kpi({ label, value, sub, onClick }: { label: string; value: React.ReactNode; sub?: string; onClick?: () => void }) {
  const cls = "bg-[#F6F7F9] rounded-xl p-5 text-left w-full" + (onClick ? " hover:bg-[#029cda]/10 transition cursor-pointer" : "");
  const inner = (
    <>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </>
  );
  return onClick ? <button type="button" onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>;
}

/* ─────────── Фильтр периода (общий для всех вкладок) ─────────── */
interface Period { from: string | null; to: string | null }
const NO_PERIOD: Period = { from: null, to: null };

function dayStr(offset = 0): string {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function presetRange(key: string): Period {
  if (key === 'today') return { from: dayStr(0), to: dayStr(0) };
  if (key === 'week') return { from: dayStr(-6), to: dayStr(0) };
  if (key === 'month') return { from: dayStr(-29), to: dayStr(0) };
  return NO_PERIOD;
}
const periodQS = (p: Period) => {
  const qs = new URLSearchParams();
  if (p.from) qs.set('from', p.from);
  if (p.to) qs.set('to', p.to);
  return qs;
};

/** Ключ пресета, соответствующий текущему периоду (для подсветки кнопки). */
function keyForPeriod(p: Period): string {
  if (!p.from && !p.to) return 'all';
  for (const k of ['today', 'week', 'month']) {
    const r = presetRange(k);
    if (r.from === p.from && r.to === p.to) return k;
  }
  return 'custom';
}

/* Период по умолчанию — «Сегодня», общий для всех вкладок и сохраняется
   при переходах туда-обратно (модульная переменная переживает размонтирование). */
let sharedPeriod: Period = presetRange('today');
function usePersistentPeriod(): [Period, (p: Period) => void] {
  const [period, setState] = useState<Period>(() => sharedPeriod);
  const setPeriod = useCallback((p: Period) => { sharedPeriod = p; setState(p); }, []);
  return [period, setPeriod];
}

function PeriodBar({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const active = keyForPeriod(value);
  const presets = [['today', 'Сегодня'], ['week', 'Неделя'], ['month', 'Месяц']];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {presets.map(([key, label]) => (
        <button key={key} onClick={() => onChange(presetRange(key))}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${active === key ? 'bg-[#029cda] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          {label}
        </button>
      ))}
      <span className="text-gray-300 mx-1">|</span>
      <input type="date" value={value.from || ''} max={value.to || undefined}
        onChange={(e) => onChange({ from: e.target.value || null, to: value.to })}
        className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700" />
      <span className="text-gray-400 text-sm">—</span>
      <input type="date" value={value.to || ''} min={value.from || undefined}
        onChange={(e) => onChange({ from: value.from, to: e.target.value || null })}
        className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700" />
      <button onClick={() => onChange(NO_PERIOD)}
        className={`px-3 py-1.5 rounded-lg text-sm transition ${active === 'all' ? 'bg-[#029cda] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
        Всё
      </button>
    </div>
  );
}

/* ─────────── Дашборд ─────────── */
interface Dash {
  calls: { total: number; analyzed: number; avgDurationSec: number | null; avgDealScore: number | null; avgManagerScore: number | null };
  temperature: { hot: number; warm: number; cold: number };
  attention: { withoutNextStep: number; failed: number };
  queue: { pending: number; running: number; failed: number; retry: number };
}

function Dashboard({ onNavigate }: { onNavigate?: (t: NavTarget) => void }) {
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [queueTick, setQueueTick] = useState(0);
  const [period, setPeriod] = usePersistentPeriod();

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await fetch(`/api/ai-sales/dashboard?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/ai-sales/sync?entity=all', { method: 'POST' });
      const j = await r.json();
      setMsg(r.ok ? 'Синхронизация поставлена в очередь' : (j.error || 'Ошибка'));
      setQueueTick((t) => t + 1);
    } finally { setBusy(false); }
  };

  const drain = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/ai-sales/jobs/drain', { method: 'POST' });
      const j = await r.json();
      const rep = j.report || {};
      setMsg(r.ok
        ? `Взято ${rep.claimed ?? 0}, выполнено ${rep.completed ?? 0}, ошибок ${rep.failed ?? 0}${rep.reaped ? `, восстановлено ${rep.reaped}` : ''}`
        : (j.error || 'Ошибка'));
      load();
      setQueueTick((t) => t + 1);
    } finally { setBusy(false); }
  };

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;
  if (!data) return <LoadingBlock />;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">AI Продажи — дашборд</h2>
        <div className="flex gap-2">
          <button onClick={sync} disabled={busy}
            className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">
            Синхронизировать Bitrix
          </button>
          <button onClick={drain} disabled={busy}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 disabled:opacity-50">
            Обработать очередь
          </button>
        </div>
      </div>
      {msg && <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{msg}</div>}

      <PeriodBar value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Kpi label="Звонки" value={data.calls.total} sub={`Проанализировано: ${data.calls.analyzed}`} onClick={onNavigate ? () => onNavigate({ tab: 'ai-calls' }) : undefined} />
        <Kpi label="Средняя длит." value={fmtDur(data.calls.avgDurationSec)} />
        <Kpi label="Средний Deal Score" value={data.calls.avgDealScore ?? '—'} sub="0–100" />
        <Kpi label="Средняя оценка менеджера" value={data.calls.avgManagerScore ?? '—'} sub="0–10 · по сделкам" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Kpi label="🔥 Горячие" value={data.temperature.hot} onClick={onNavigate ? () => onNavigate({ tab: 'ai-deals', temperature: 'HOT' }) : undefined} />
        <Kpi label="Тёплые" value={data.temperature.warm} onClick={onNavigate ? () => onNavigate({ tab: 'ai-deals', temperature: 'WARM' }) : undefined} />
        <Kpi label="Холодные" value={data.temperature.cold} onClick={onNavigate ? () => onNavigate({ tab: 'ai-deals', temperature: 'COLD' }) : undefined} />
        <Kpi label="Кому звонить сегодня" value={data.attention.withoutNextStep} sub="AI рекомендует →" onClick={onNavigate ? () => onNavigate({ tab: 'ai-reco' }) : undefined} />
      </div>

      <QueuePanel refreshSignal={queueTick} />
    </div>
  );
}

/* ─────────── Панель очереди обработки ─────────── */
const JOB_TYPE_LABELS: Record<string, string> = {
  'bitrix.sync': 'Синхронизация Bitrix',
  'call.ingest': 'Загрузка звонка',
  'call.transcribe': 'Транскрибация',
  'call.diarize': 'Диаризация',
  'call.roles': 'Разметка ролей',
  'call.analyze': 'AI-анализ звонка',
  'deal.analyze': 'Анализ сделки',
  'manager.analyze': 'Анализ менеджера',
  'ai.report': 'Формирование отчёта',
  'followup.check': 'Проверка follow-up',
};
const jobLabel = (t: string) => JOB_TYPE_LABELS[t] || t;

function jobRef(payload: Record<string, unknown>): string {
  const p = payload || {};
  if (p.callId) return `звонок ${String(p.callId).slice(0, 8)}`;
  if (p.dealId) return `сделка ${p.dealId}`;
  if (p.managerId) return `менеджер ${p.managerId}`;
  if (p.entity) return String(p.entity);
  return '';
}

interface QueueJobT {
  id: string; type: string; status: string; attempts: number; maxAttempts: number;
  payload: Record<string, unknown>; lastError: string | null; runAfter: string; updatedAt: string;
}
interface QueueDetailsT {
  stats: { pending: number; running: number; failed: number; retry: number };
  running: QueueJobT[]; pending: QueueJobT[]; failed: QueueJobT[];
  byType: { type: string; count: number }[];
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: 'run' | 'wait' | 'err' }) {
  const cls = tone === 'err'
    ? (value > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-400 border-gray-200')
    : tone === 'run'
      ? (value > 0 ? 'bg-[#029cda]/10 text-[#029cda] border-[#029cda]/20' : 'bg-white text-gray-400 border-gray-200')
      : (value > 0 ? 'bg-white text-gray-700 border-gray-200' : 'bg-white text-gray-400 border-gray-200');
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${cls}`}>
      {label}: <b>{value}</b>
    </span>
  );
}

function QueuePanel({ refreshSignal }: { refreshSignal?: number }) {
  const [q, setQ] = useState<QueueDetailsT | null>(null);
  const [err, setErr] = useState('');
  const [openErrors, setOpenErrors] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/ai-sales/jobs/queue');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setQ(j); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, []);

  useEffect(() => { load(); }, [load, refreshSignal]);

  // Автообновление, пока есть активность в очереди.
  useEffect(() => {
    if (!q) return;
    const active = q.stats.running > 0 || q.stats.pending > 0 || q.stats.retry > 0;
    if (!active) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [q, load]);

  return (
    <div className="bg-[#F6F7F9] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Очередь обработки</p>
        <button onClick={load} className="text-xs text-[#029cda] hover:underline">Обновить</button>
      </div>

      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
      {!q ? <LoadingBlock /> : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <StatChip label="Выполняется" value={q.stats.running} tone="run" />
            <StatChip label="В очереди" value={q.stats.pending} tone="wait" />
            <StatChip label="Повтор" value={q.stats.retry} tone="wait" />
            <StatChip label="Ошибки" value={q.stats.failed} tone="err" />
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Сейчас обрабатывается</p>
            {q.running.length === 0 ? (
              <p className="text-sm text-gray-400">— нет активных задач</p>
            ) : (
              <ul className="space-y-1.5">
                {q.running.map((j) => (
                  <li key={j.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <Spinner size={14} />
                    <span className="font-medium">{jobLabel(j.type)}</span>
                    {jobRef(j.payload) && <span className="text-gray-500">· {jobRef(j.payload)}</span>}
                    {j.attempts > 1 && <span className="text-xs text-gray-400">попытка {j.attempts}/{j.maxAttempts}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">В очереди</p>
            {q.byType.length === 0 ? (
              <p className="text-sm text-gray-400">— очередь пуста</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {q.byType.map((t) => (
                  <span key={t.type} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-sm text-gray-700">
                    {jobLabel(t.type)} <b className="text-[#029cda]">{t.count}</b>
                  </span>
                ))}
              </div>
            )}
          </div>

          {q.failed.length > 0 && (
            <div>
              <button onClick={() => setOpenErrors((v) => !v)} className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
                Ошибки ({q.failed.length}) <span className="text-[10px]">{openErrors ? '▲' : '▼'}</span>
              </button>
              {openErrors && (
                <ul className="space-y-2">
                  {q.failed.map((j) => (
                    <li key={j.id} className="text-sm bg-white border border-red-100 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">{jobLabel(j.type)}</span>
                        {jobRef(j.payload) && <span className="text-gray-500">· {jobRef(j.payload)}</span>}
                        <span className="text-xs text-gray-400 ml-auto">{new Date(j.updatedAt).toLocaleString('ru-RU')}</span>
                      </div>
                      {j.lastError && <p className="text-xs text-red-600 mt-1 break-words">{j.lastError}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────── Список звонков ─────────── */
interface CallItem {
  id: string; startedAt: string | null; managerName: string | null; companyTitle: string | null;
  phone: string | null;
  bitrixDealId: string | null; dealUrl: string | null; durationSec: number | null; product: string | null;
  dealScore: number | null; managerScore: number | null; temperature: string | null;
  resultType: string | null; nextStep: string | null; status: string;
}

function Calls({ initialTemperature, initialTag }: { initialTemperature?: string; initialTag?: string }) {
  const [items, setItems] = useState<CallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [temp, setTemp] = useState(initialTemperature || '');
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState(initialTag || '');
  const [manager, setManager] = useState('');
  const [managerOptions, setManagerOptions] = useState<Array<{ bitrixUserId: string; name: string | null }>>([]);
  const [department, setDepartment] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [period, setPeriod] = usePersistentPeriod();
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai-sales/managers/options')
      .then((r) => r.json())
      .then((j) => { if (Array.isArray(j.items)) setManagerOptions(j.items); })
      .catch(() => {});
    fetch('/api/ai-sales/departments')
      .then((r) => r.json())
      .then((j) => { if (Array.isArray(j.departments)) setDepartmentOptions(j.departments.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = periodQS(period);
      if (temp) qs.set('temperature', temp);
      if (status) qs.set('status', status);
      if (tag) qs.set('tag', tag);
      if (manager) qs.set('manager', manager);
      if (department) qs.set('department', department);
      qs.set('sort', sort);
      qs.set('limit', '200');
      const r = await fetch(`/api/ai-sales/calls?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setItems(j.items); setTotal(j.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    } finally { setLoading(false); }
  }, [temp, status, tag, manager, department, period, sort]);

  useEffect(() => { load(); }, [load]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const toggleGroup = (key: string) => setExpandedGroups((prev) => {
    const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n;
  });
  const toggleCall = (id: string) => setExpandedCall((prev) => (prev === id ? null : id));

  // Группировка по сделке (иначе по номеру) — все звонки одного клиента вместе,
  // со счётчиком за выбранный период.
  const groups = useMemo(() => {
    const map = new Map<string, CallItem[]>();
    for (const c of items) {
      const key = c.bitrixDealId ? `deal:${c.bitrixDealId}` : c.phone ? `phone:${c.phone}` : `call:${c.id}`;
      const arr = map.get(key); if (arr) arr.push(c); else map.set(key, [c]);
    }
    const byDateDesc = (a: CallItem, b: CallItem) => (b.startedAt || '').localeCompare(a.startedAt || '');
    const out = [...map.entries()].map(([key, calls]) => {
      const sorted = [...calls].sort(byDateDesc);
      return {
        key, calls: sorted, count: sorted.length,
        client: sorted.find((c) => c.companyTitle)?.companyTitle ?? null,
        phone: sorted.find((c) => c.phone)?.phone ?? null,
        manager: sorted.find((c) => c.managerName)?.managerName ?? null,
        // Агрегаты по группе:
        temp: hottestTemp(sorted.map((c) => c.temperature)),                    // самая горячая
        latest: sorted[0]?.startedAt ?? null,                                    // дата последнего
        status: sorted[0]?.status ?? null,                                       // статус последнего
        duration: sumNums(sorted.map((c) => c.durationSec)),                     // сумма длительностей
        product: sorted.find((c) => c.product && c.product.trim())?.product ?? null, // первый заполненный
        dealScore: maxNum(sorted.map((c) => c.dealScore)),                       // максимальный score
        managerScore: maxNum(sorted.map((c) => c.managerScore)),                 // максимальные баллы
      };
    });
    out.sort((a, b) => sort === 'desc'
      ? (b.latest || '').localeCompare(a.latest || '')
      : (a.latest || '').localeCompare(b.latest || ''));
    return out;
  }, [items, sort]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Звонки <span className="text-gray-400 text-base font-normal">({total})</span></h2>
        <div className="flex gap-2 flex-wrap">
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm max-w-[180px]">
            <option value="">Все отделы</option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select value={manager} onChange={(e) => setManager(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm max-w-[180px]">
            <option value="">Все менеджеры</option>
            {managerOptions.map((m) => (
              <option key={m.bitrixUserId} value={m.bitrixUserId}>{m.name || `ID ${m.bitrixUserId}`}</option>
            ))}
          </select>
          <select value={temp} onChange={(e) => setTemp(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="">Все температуры</option>
            <option value="HOT">🔥 Горячие</option>
            <option value="WARM">Тёплые</option>
            <option value="COLD">Холодные</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="">Все статусы</option>
            <option value="COMPLETED">Готово</option>
            <option value="TRANSCRIBING">Транскрибация</option>
            <option value="FAILED">Ошибка</option>
            <option value="NO_RECORDING">Нет записи</option>
          </select>
        </div>
      </div>

      {tag && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[#029cda]/10 text-[#029cda]">
            тег: {tag}
            <button onClick={() => setTag('')} className="text-[#029cda] hover:text-red-500">✕</button>
          </span>
        </div>
      )}
      <PeriodBar value={period} onChange={setPeriod} />
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}
      {loading ? <LoadingBlock /> : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F6F7F9] text-gray-600">
              <tr>
                <th className="text-left font-medium px-3 py-2 whitespace-nowrap cursor-pointer select-none hover:text-[#029cda]"
                    onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}>
                  Дата {sort === 'desc' ? '↓' : '↑'}
                </th>
                {['Менеджер', 'Клиент', 'Длит.', 'Продукт', 'Score', 'Оценка', 'Темп.', 'Статус'].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            {groups.length === 0 ? (
              <tbody><tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">Звонков нет за выбранный период.</td></tr></tbody>
            ) : groups.map((g) => {
              const single = g.count === 1;
              const one = g.calls[0];
              const groupOpen = single ? expandedCall === one.id : expandedGroups.has(g.key);
              const tempBadge = (t: string | null) => t
                ? <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[t] || ''}`}>{tempRu(t)}</span> : '—';
              return (
                <tbody key={g.key} className="border-t border-gray-100">
                  {/* Строка-группа */}
                  <tr onClick={() => single ? toggleCall(one.id) : toggleGroup(g.key)}
                    className="hover:bg-sky-50/60 cursor-pointer">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-gray-400 mr-1">{groupOpen ? '▾' : '▸'}</span>
                      {single
                        ? (one.startedAt ? new Date(one.startedAt).toLocaleString('ru-RU') : '—')
                        : <span className="font-medium text-[#029cda]">{g.count} {pluralCalls(g.count)}</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{g.manager || '—'}</td>
                    <td className="px-3 py-2">
                      <div>{g.client || '—'}</div>
                      {g.phone && <div className="text-xs text-gray-400">{g.phone}</div>}
                    </td>
                    <td className="px-3 py-2">{fmtDur(single ? one.durationSec : g.duration)}</td>
                    <td className="px-3 py-2">{(single ? one.product : g.product) || '—'}</td>
                    <td className="px-3 py-2 font-medium">{(single ? one.dealScore : g.dealScore) ?? '—'}</td>
                    <td className="px-3 py-2">{(single ? one.managerScore : g.managerScore) ?? '—'}</td>
                    <td className="px-3 py-2">{tempBadge(single ? one.temperature : g.temp)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {single ? (STATUS_LABEL[one.status] || one.status) : (
                        <div>
                          <div>{g.status ? (STATUS_LABEL[g.status] || g.status) : '—'}</div>
                          {g.latest && <div className="text-xs text-gray-400">{new Date(g.latest).toLocaleDateString('ru-RU')}</div>}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Один звонок — раскрытие карточки прямо тут */}
                  {single && groupOpen && (
                    <tr><td colSpan={9} className="p-4 bg-[#FAFBFC] border-t border-gray-100">
                      <CallDetail id={one.id} onBack={() => setExpandedCall(null)} backLabel="▲ Свернуть" />
                    </td></tr>
                  )}

                  {/* Несколько звонков — строки по каждому + раскрытие карточки */}
                  {!single && groupOpen && g.calls.map((c) => (
                    <React.Fragment key={c.id}>
                      <tr onClick={() => toggleCall(c.id)} className="bg-gray-50/40 hover:bg-sky-50/60 cursor-pointer">
                        <td className="px-3 py-2 whitespace-nowrap pl-8">
                          <span className="text-gray-400 mr-1">{expandedCall === c.id ? '▾' : '▸'}</span>
                          {c.startedAt ? new Date(c.startedAt).toLocaleString('ru-RU') : '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{c.managerName || '—'}</td>
                        <td className="px-3 py-2">{c.companyTitle || '—'}</td>
                        <td className="px-3 py-2">{fmtDur(c.durationSec)}</td>
                        <td className="px-3 py-2">{c.product || '—'}</td>
                        <td className="px-3 py-2 font-medium">{c.dealScore ?? '—'}</td>
                        <td className="px-3 py-2">{c.managerScore ?? '—'}</td>
                        <td className="px-3 py-2">{tempBadge(c.temperature)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600">{STATUS_LABEL[c.status] || c.status}</td>
                      </tr>
                      {expandedCall === c.id && (
                        <tr><td colSpan={9} className="p-4 bg-[#FAFBFC] border-t border-gray-100">
                          <CallDetail id={c.id} onBack={() => setExpandedCall(null)} backLabel="▲ Свернуть" />
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────── Карточка звонка ─────────── */
interface DetailData {
  call: {
    id: string; startedAt: string | null; durationSec: number | null; direction: string | null;
    status: string; product: string | null; recordingUrl: string | null;
    managerName: string | null; companyTitle: string | null; bitrixDealId: string | null; dealUrl: string | null; bitrixLeadId?: string | null; leadUrl?: string | null;
  };
  transcript: { provider: string; language: string | null; segments: Array<{ idx: number; role: string | null; speakerLabel: string | null; startMs: number | null; text: string }> } | null;
  analysis: Record<string, unknown> | null;
  metrics: null | {
    managerWords: number; clientWords: number; talkRatioManager: number | null;
    managerUtterances: number; clientUtterances: number;
    avgManagerUtteranceWords: number | null; avgClientUtteranceWords: number | null;
    longestMonologueWords: number; durationSec: number | null;
    talkRatioManagerTime: number | null; wpmManager: number | null; wpmClient: number | null;
    longestPauseSec: number | null; pausesOver3s: number | null; hasTimestamps: boolean;
  };
  scriptScore?: null | {
    scriptVersion: number | null;
    score: number | null;
    steps: Array<{ key: string; title: string; completed: boolean; reason: string | null }>;
  };
}

const roleLabel = (role: string | null, speaker: string | null) =>
  role === 'MANAGER' ? 'Менеджер' : role === 'CLIENT' ? 'Клиент' : (speaker || 'Реплика');

const ms2tc = (ms: number | null) => {
  if (ms == null) return '';
  const t = Math.floor(ms / 1000);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/* Эталонная оценка звонка (контроль качества LLM, §33 ТЗ). */
function ReviewWidget({ callId, llmDeal, llmManager }: { callId: string; llmDeal: number | null; llmManager: number | null }) {
  const [deal, setDeal] = useState('');
  const [mgr, setMgr] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [has, setHas] = useState(false);

  useEffect(() => {
    fetch(`/api/ai-sales/calls/${callId}/review`)
      .then((r) => r.json())
      .then((j) => {
        if (j.review) {
          setDeal(j.review.dealScore != null ? String(j.review.dealScore) : '');
          setMgr(j.review.managerScore != null ? String(j.review.managerScore) : '');
          setNote(j.review.note || '');
          setHas(j.review.dealScore != null || j.review.managerScore != null);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, [callId]);

  const save = async () => {
    setBusy(true);
    try {
      await fetch(`/api/ai-sales/calls/${callId}/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealScore: deal === '' ? null : Number(deal), managerScore: mgr === '' ? null : Number(mgr), note }),
      });
      setSaved(true); setHas(deal !== '' || mgr !== ''); setTimeout(() => setSaved(false), 2500);
    } finally { setBusy(false); }
  };

  const delta = (h: string, l: number | null) => (h !== '' && l != null ? Number(h) - l : null);
  const dDeal = delta(deal, llmDeal);
  const dMgr = delta(mgr, llmManager);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 text-sm text-[#029cda] hover:underline">
        + Поставить эталонную оценку (контроль качества)
      </button>
    );
  }

  return (
    <div className="bg-[#F6F7F9] rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Эталонная оценка (контроль качества) {has && <span className="text-xs text-emerald-600 font-normal">✓ оценено</span>}</p>
      </div>
      <div className="flex flex-wrap items-end gap-5">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Качество сделки (0–100)</label>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={100} value={deal} onChange={(e) => setDeal(e.target.value)}
              className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]" />
            <span className="text-xs text-gray-400">LLM: {llmDeal ?? '—'}{dDeal != null && <span className={Math.abs(dDeal) <= 10 ? 'text-emerald-600' : 'text-red-600'}> (Δ {dDeal > 0 ? '+' : ''}{dDeal})</span>}</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Работа менеджера (0–10)</label>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={10} step={0.5} value={mgr} onChange={(e) => setMgr(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]" />
            <span className="text-xs text-gray-400">LLM: {llmManager ?? '—'}{dMgr != null && <span className={Math.abs(dMgr) <= 2 ? 'text-emerald-600' : 'text-red-600'}> (Δ {dMgr > 0 ? '+' : ''}{dMgr})</span>}</span>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-gray-500 mb-1">Комментарий</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="почему такая оценка…"
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]" />
        </div>
        <button onClick={save} disabled={busy}
          className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Сохранить</button>
        {saved && <span className="text-sm text-green-600">✓</span>}
      </div>
    </div>
  );
}

function CallDetail({ id, onBack, backLabel = '← К списку', initialSeekMs = null }: { id: string; onBack: () => void; backLabel?: string; initialSeekMs?: number | null }) {
  const [data, setData] = useState<DetailData | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekedRef = useRef(false);

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await fetch(`/api/ai-sales/calls/${id}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const reanalyze = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`/api/ai-sales/calls/${id}/analyze?force=1`, { method: 'POST' });
      const j = await r.json();
      setMsg(r.ok ? 'Анализ поставлен в очередь' : (j.error || 'Ошибка'));
    } finally { setBusy(false); }
  };

  const retranscribe = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`/api/ai-sales/calls/${id}/transcribe`, { method: 'POST' });
      const j = await r.json();
      setMsg(r.ok ? 'Перетранскрибация поставлена в очередь' : (j.error || 'Ошибка'));
    } finally { setBusy(false); }
  };

  const seek = useCallback((startMs: number | null) => {
    const el = audioRef.current;
    if (startMs == null || !el) return;
    const doSeek = () => { try { el.currentTime = startMs / 1000; } catch { /* not ready */ } el.play().catch(() => {}); };
    if (el.readyState >= 1) doSeek();
    else { el.addEventListener('loadedmetadata', doSeek, { once: true }); el.load(); }
  }, []);

  // Переход из поиска: автоперемотка на найденный момент (один раз).
  useEffect(() => {
    if (!data || initialSeekMs == null || seekedRef.current) return;
    seekedRef.current = true;
    seek(initialSeekMs);
  }, [data, initialSeekMs, seek]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err} <button onClick={onBack} className="underline ml-2">Назад</button></div>;
  if (!data) return <LoadingBlock />;

  const a = data.analysis as null | {
    summary?: string;
    connected?: boolean;
    noContactReason?: string | null;
    callType?: string;
    managerScoreApplicable?: boolean;
    dealScore?: { score?: number; temperature?: string; factors?: Array<{ factor: string; points: number; reason: string }> };
    nextStep?: { action?: string | null };
    risks?: Array<{ type: string; detail: string }>;
    managerPerformance?: { overall?: number | null; didWell?: string[]; mistakes?: string[]; improveNextTime?: string[] };
    products?: Array<{ name: string; confidence: number }>;
    objections?: Array<{ text?: string; quote?: string | null; raisedBy?: string; handled?: boolean; managerResponse?: string | null; responseQuality?: string | null; recommendation?: string | null; startMs?: number | null; endMs?: number | null }>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-[#029cda]">{backLabel}</button>
        <div className="flex gap-2 items-center">
          {data.call.dealUrl
            ? <a href={data.call.dealUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700">Сделка в Bitrix</a>
            : data.call.leadUrl
              ? <a href={data.call.leadUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700">Лид в Bitrix</a>
              : null}
          <button onClick={retranscribe} disabled={busy} title="Перетранскрибировать — заново распознать запись (текущим провайдером)"
            className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:text-[#029cda] hover:border-[#029cda] flex items-center justify-center disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a4 4 0 00-4 4v4a4 4 0 008 0V7a4 4 0 00-4-4z M5 11a7 7 0 0014 0 M12 18v3" /></svg>
          </button>
          <button onClick={reanalyze} disabled={busy} title="Переанализировать — заново прогнать AI-разбор звонка"
            className="w-9 h-9 rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5] flex items-center justify-center disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3 M12 18v3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M3 12h3 M18 12h3 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1" /></svg>
          </button>
        </div>
      </div>
      {msg && <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{msg}</div>}

      <div className="bg-[#F6F7F9] rounded-xl p-5 mb-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700">
          <span>Клиент: <b>{data.call.companyTitle || '—'}</b></span>
          <span>Менеджер: <b>{data.call.managerName || '—'}</b></span>
          <span>Дата: <b>{data.call.startedAt ? new Date(data.call.startedAt).toLocaleString('ru-RU') : '—'}</b></span>
          <span>Продукт: <b>{data.call.product || '—'}</b></span>
          <span>Статус: <b>{STATUS_LABEL[data.call.status] || data.call.status}</b></span>
        </div>
        {data.call.recordingUrl && (
          <audio ref={audioRef} controls preload="none" src={`/api/ai-sales/calls/${id}/audio`} className="w-full mt-4" />
        )}
      </div>

      <ReviewWidget callId={id} llmDeal={a?.dealScore?.score ?? null} llmManager={a?.managerPerformance?.overall ?? null} />

      <details className="bg-[#F6F7F9] rounded-xl p-4 mb-4">
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer">Спросить ассистента про этот звонок</summary>
        <div className="mt-3"><AssistantAsk callId={id} compact placeholder="Например: почему такая оценка? какие ошибки?" /></div>
      </details>

      {data.metrics && (data.metrics.managerWords + data.metrics.clientWords > 0) && (() => {
        const m = data.metrics!;
        const ratio = m.talkRatioManagerTime ?? m.talkRatioManager;
        const mgrPct = ratio != null ? Math.round(ratio * 100) : null;
        const fmtSec = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
        return (
          <div className="bg-[#F6F7F9] rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Метрики разговора {!m.hasTimestamps && <span className="text-xs text-gray-400 font-normal">(по словам — таймкодов нет)</span>}</p>
            {mgrPct != null && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Менеджер {mgrPct}%</span><span>Клиент {100 - mgrPct}%</span></div>
                <div className="h-2 rounded-full overflow-hidden bg-emerald-100 flex">
                  <div className="h-full bg-[#029cda]" style={{ width: `${mgrPct}%` }} />
                  <div className="h-full bg-emerald-400" style={{ width: `${100 - mgrPct}%` }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-x-6 gap-y-2 text-sm text-gray-700">
              <span>Длительность: <b>{fmtSec(m.durationSec)}</b></span>
              <span>Реплик: <b>{m.managerUtterances}</b> / {m.clientUtterances}</span>
              <span>Ср. реплика мен.: <b>{m.avgManagerUtteranceWords ?? '—'}</b> сл.</span>
              <span>Длинный монолог: <b>{m.longestMonologueWords}</b> сл.</span>
              {m.hasTimestamps && <span>Темп мен.: <b>{m.wpmManager ?? '—'}</b> сл/мин</span>}
              {m.hasTimestamps && <span>Пауз &gt;3с: <b>{m.pausesOver3s ?? '—'}</b></span>}
              {m.hasTimestamps && <span>Макс. пауза: <b>{fmtSec(m.longestPauseSec)}</b></span>}
            </div>
          </div>
        );
      })()}

      {data.scriptScore && data.scriptScore.steps.length > 0 && (() => {
        const ss = data.scriptScore!;
        const done = ss.steps.filter((s) => s.completed).length;
        const pct = ss.score ?? Math.round((done / ss.steps.length) * 100);
        const tone = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
        return (
          <div className="bg-[#F6F7F9] rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Соблюдение скрипта {ss.scriptVersion != null && <span className="text-xs text-gray-400 font-normal">(v{ss.scriptVersion})</span>}</p>
              <p className={`text-sm font-semibold ${tone}`}>{pct}% <span className="text-gray-400 font-normal">({done}/{ss.steps.length})</span></p>
            </div>
            <ul className="space-y-1.5">
              {ss.steps.map((s) => (
                <li key={s.key} className="flex items-start gap-2 text-sm">
                  <span className={s.completed ? 'text-emerald-600' : 'text-red-500'}>{s.completed ? '✓' : '✕'}</span>
                  <span className="text-gray-800">{s.title}</span>
                  {s.reason && <span className="text-gray-400">— {s.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Транскрипт */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="font-semibold text-gray-800 mb-3">Транскрипция</p>
          {!data.transcript ? <p className="text-gray-400 text-sm">Пока нет транскрипта.</p> : (
            <div className="space-y-3 max-h-[520px] xl:max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
              {data.transcript.segments.map((s) => (
                <div key={s.idx} className="text-sm">
                  <button onClick={() => seek(s.startMs)} disabled={s.startMs == null}
                    className={`text-xs mr-2 ${s.startMs != null ? 'text-[#029cda] hover:underline' : 'text-gray-300'}`}>
                    {s.startMs != null ? ms2tc(s.startMs) : '·'}
                  </button>
                  <span className={`font-medium ${s.role === 'CLIENT' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {roleLabel(s.role, s.speakerLabel)}:
                  </span>{' '}
                  <span className="text-gray-700">{s.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI-анализ */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="font-semibold text-gray-800 mb-3">AI-анализ</p>
          {!a ? <p className="text-gray-400 text-sm">Анализ ещё не выполнен.</p> : a.connected === false ? (
            <div className="text-sm">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 mb-3">
                📵 Разговор не состоялся{a.noContactReason ? `: ${a.noContactReason}` : ''}
              </div>
              <p className="text-gray-500">Менеджер не оценивается — звонок не дошёл до собеседника (автоответчик / голосовой помощник / недозвон).</p>
              {a.summary && <p className="text-gray-700 mt-2">{a.summary}</p>}
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {a.callType && a.callType !== 'other' && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{CALL_TYPE_LABEL[a.callType] || a.callType}</span>
              )}
              {a.dealScore && (
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[a.dealScore.temperature || ''] || ''}`}>{tempRu(a.dealScore.temperature)}</span>
                  <span className="text-2xl font-bold text-gray-900">{a.dealScore.score}<span className="text-sm text-gray-400">/100</span></span>
                  {a.managerPerformance?.overall != null
                    ? <span className="text-gray-600">Менеджер: <b>{a.managerPerformance.overall}/10</b></span>
                    : a.managerScoreApplicable === false
                      ? <span className="text-gray-400 text-xs">менеджер не оценивается — краткий/уточняющий звонок</span>
                      : null}
                </div>
              )}
              {a.summary && <p className="text-gray-700">{a.summary}</p>}
              {a.nextStep?.action && (
                <div><p className="text-xs uppercase tracking-wide text-gray-400">Следующий шаг</p><p className="text-gray-800">{a.nextStep.action}</p></div>
              )}
              {a.dealScore?.factors && a.dealScore.factors.filter((f) => f.reason?.trim()).length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Почему такой балл</p>
                  <ul className="space-y-0.5">
                    {a.dealScore.factors.filter((f) => f.reason?.trim()).map((f, i) => (
                      <li key={i} className={f.points >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                        {f.points >= 0 ? '+' : ''}{f.points} {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {a.risks && a.risks.filter((r) => r.detail?.trim()).length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Риски</p>
                  <ul className="list-disc pl-5 text-red-600">{a.risks.filter((r) => r.detail?.trim()).map((r, i) => <li key={i}>{r.detail}</li>)}</ul>
                </div>
              )}
              {a.managerPerformance && (
                <div className="grid grid-cols-1 gap-2">
                  {a.managerPerformance.didWell?.length ? <div><p className="text-xs uppercase tracking-wide text-emerald-600">Хорошо</p><ul className="list-disc pl-5 text-gray-700">{a.managerPerformance.didWell.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
                  {a.managerPerformance.mistakes?.length ? <div><p className="text-xs uppercase tracking-wide text-amber-600">Ошибки</p><ul className="list-disc pl-5 text-gray-700">{a.managerPerformance.mistakes.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
                  {a.managerPerformance.improveNextTime?.length ? <div><p className="text-xs uppercase tracking-wide text-sky-600">Улучшить</p><ul className="list-disc pl-5 text-gray-700">{a.managerPerformance.improveNextTime.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
                </div>
              )}
              {a.objections && a.objections.filter((o) => (o.text || o.quote)?.trim()).length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Возражения</p>
                  <ul className="space-y-2">
                    {a.objections.filter((o) => (o.text || o.quote)?.trim()).map((o, i) => (
                      <li key={i} className="rounded-lg bg-[#F6F7F9] p-2.5">
                        <div className="flex items-start gap-2">
                          {o.startMs != null ? (
                            <button onClick={() => seek(o.startMs ?? null)} title="Прослушать момент"
                              className="shrink-0 inline-flex items-center gap-1 text-xs text-[#029cda] hover:underline mt-0.5">
                              ▶ {ms2tc(o.startMs)}
                            </button>
                          ) : null}
                          <div className="flex-1">
                            <p className="text-gray-800">{o.text || o.quote}
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${o.handled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {o.handled ? 'отработано' : 'не отработано'}
                              </span>
                            </p>
                            {o.quote && o.quote !== o.text && <p className="text-xs text-gray-400 mt-0.5">«{o.quote}»</p>}
                            {o.recommendation && <p className="text-xs text-sky-600 mt-0.5">{o.recommendation}</p>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Список сделок ─────────── */
interface DealItem {
  bitrixDealId: string; title: string | null; companyTitle: string | null; managerName: string | null;
  dealUrl: string | null; callsCount: number; scoredCalls: number; dealScore: number | null;
  temperature: string | null; managerScore: number | null; nextAction: string | null; lastCallAt: string | null;
}

function Deals({ onOpen, initialTemperature }: { onOpen: (id: string) => void; initialTemperature?: string }) {
  const [items, setItems] = useState<DealItem[]>([]);
  const [total, setTotal] = useState(0);
  const [temp, setTemp] = useState(initialTemperature || '');
  const [period, setPeriod] = usePersistentPeriod();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = periodQS(period);
      if (temp) qs.set('temperature', temp);
      const r = await fetch(`/api/ai-sales/deals?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setItems(j.items); setTotal(j.total);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [temp, period]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Сделки <span className="text-gray-400 text-base font-normal">({total})</span></h2>
        <select value={temp} onChange={(e) => setTemp(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
          <option value="">Все температуры</option>
          <option value="HOT">🔥 Горячие</option>
          <option value="WARM">Тёплые</option>
          <option value="COLD">Холодные</option>
        </select>
      </div>
      <PeriodBar value={period} onChange={setPeriod} />
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}
      {loading ? <LoadingBlock /> : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F6F7F9] text-gray-600">
              <tr>{['Клиент / Сделка', 'Менеджер', 'Звонков', 'Темп.', 'Score', 'Оценка мен.', 'Следующий шаг'].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((d) => (
                <tr key={d.bitrixDealId} onClick={() => onOpen(d.bitrixDealId)} className="hover:bg-sky-50/60 cursor-pointer">
                  <td className="px-3 py-2">{d.companyTitle || d.title || `Сделка #${d.bitrixDealId}`}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{d.managerName || '—'}</td>
                  <td className="px-3 py-2">{d.callsCount}{d.scoredCalls < d.callsCount ? <span className="text-gray-400"> ({d.scoredCalls} показ.)</span> : null}</td>
                  <td className="px-3 py-2">{d.temperature ? <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[d.temperature] || ''}`}>{tempRu(d.temperature)}</span> : '—'}</td>
                  <td className="px-3 py-2 font-medium">{d.dealScore ?? '—'}</td>
                  <td className="px-3 py-2">{d.managerScore != null ? `${d.managerScore}/10` : '—'}</td>
                  <td className="px-3 py-2 max-w-[280px] truncate text-gray-600">{d.nextAction || '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">Сделок с разбором пока нет. Разбор появляется после анализа звонков сделки.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────── Карточка сделки ─────────── */
interface DealDetailData {
  deal: { bitrixDealId: string; title: string | null; companyTitle: string | null; managerName: string | null; dealUrl: string | null };
  insight: null | {
    summary?: string;
    dealScore?: { score?: number; temperature?: string; factors?: Array<{ factor: string; points: number; reason: string }> };
    managerAssessment?: { overall?: number | null; strengths?: string[]; weaknesses?: string[]; coaching?: string[] };
    nextBestAction?: string;
    risks?: Array<{ type: string; detail: string }>;
    keyFacts?: { budget?: string | null; timeline?: string | null; decisionMaker?: string | null; products?: string[]; currentSolution?: string | null };
    stageRecommendation?: string | null;
  };
  managerScore: number | null;
  calls: Array<{ id: string; startedAt: string | null; callType: string | null; status: string; phone: string | null; clientName: string | null; dealScore: number | null; managerScore: number | null; temperature: string | null }>;
}

function DealDetail({ id, onBack, onOpenCall }: { id: string; onBack: () => void; onOpenCall?: (id: string) => void }) {
  const [data, setData] = useState<DealDetailData | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await fetch(`/api/ai-sales/deals/${id}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const reanalyze = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`/api/ai-sales/deals/${id}/analyze?force=1`, { method: 'POST' });
      const j = await r.json();
      setMsg(r.ok ? 'Пересчёт сделки поставлен в очередь' : (j.error || 'Ошибка'));
    } finally { setBusy(false); }
  };

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err} <button onClick={onBack} className="underline ml-2">Назад</button></div>;
  if (!data) return <LoadingBlock />;
  const ins = data.insight;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-[#029cda]">← К сделкам</button>
        <div className="flex gap-2">
          {data.deal.dealUrl && <a href={data.deal.dealUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700">Сделка в Bitrix</a>}
          <button onClick={reanalyze} disabled={busy} className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Пересчитать</button>
        </div>
      </div>
      {msg && <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{msg}</div>}

      <div className="bg-[#F6F7F9] rounded-xl p-5 mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700">
        <span>Клиент: <b>{data.deal.companyTitle || '—'}</b></span>
        <span>Сделка: <b>{data.deal.title || `#${data.deal.bitrixDealId}`}</b></span>
        <span>Менеджер: <b>{data.deal.managerName || '—'}</b></span>
        <span>Звонков: <b>{data.calls.length}</b></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Холистический разбор сделки */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="font-semibold text-gray-800 mb-3">Разбор сделки</p>
          {!ins ? <p className="text-gray-400 text-sm">Разбор ещё не сформирован.</p> : (
            <div className="space-y-4 text-sm">
              {ins.dealScore && (
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[ins.dealScore.temperature || ''] || ''}`}>{tempRu(ins.dealScore.temperature)}</span>
                  <span className="text-2xl font-bold text-gray-900">{ins.dealScore.score}<span className="text-sm text-gray-400">/100</span></span>
                  {data.managerScore != null && <span className="text-gray-600">Менеджер по сделке: <b>{data.managerScore}/10</b></span>}
                </div>
              )}
              {ins.summary && <p className="text-gray-700">{ins.summary}</p>}
              {ins.nextBestAction && (<div><p className="text-xs uppercase tracking-wide text-gray-400">Следующее действие</p><p className="text-gray-800">{ins.nextBestAction}</p></div>)}
              {ins.stageRecommendation && (<div><p className="text-xs uppercase tracking-wide text-gray-400">Рекомендация по стадии</p><p className="text-gray-800">{ins.stageRecommendation}</p></div>)}
              {ins.risks && ins.risks.filter((r) => r.detail?.trim()).length > 0 && (
                <div><p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Риски</p>
                  <ul className="list-disc pl-5 text-red-600">{ins.risks.filter((r) => r.detail?.trim()).map((r, i) => <li key={i}>{r.detail}</li>)}</ul></div>
              )}
              {ins.keyFacts && (
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div><span className="text-gray-400">Бюджет:</span> {ins.keyFacts.budget || '—'}</div>
                  <div><span className="text-gray-400">Сроки:</span> {ins.keyFacts.timeline || '—'}</div>
                  <div><span className="text-gray-400">ЛПР:</span> {ins.keyFacts.decisionMaker || '—'}</div>
                  <div><span className="text-gray-400">Продукты:</span> {ins.keyFacts.products?.join(', ') || '—'}</div>
                </div>
              )}
              {ins.managerAssessment && (
                <div className="space-y-2">
                  {ins.managerAssessment.strengths?.length ? <div><p className="text-xs uppercase tracking-wide text-emerald-600">Сильные стороны</p><ul className="list-disc pl-5 text-gray-700">{ins.managerAssessment.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
                  {ins.managerAssessment.weaknesses?.length ? <div><p className="text-xs uppercase tracking-wide text-amber-600">Зоны роста</p><ul className="list-disc pl-5 text-gray-700">{ins.managerAssessment.weaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
                  {ins.managerAssessment.coaching?.length ? <div><p className="text-xs uppercase tracking-wide text-sky-600">Коучинг по сделке</p><ul className="list-disc pl-5 text-gray-700">{ins.managerAssessment.coaching.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Таймлайн звонков сделки */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="font-semibold text-gray-800 mb-3">Звонки по сделке ({data.calls.length})</p>
          <div className="space-y-2 max-h-[520px] xl:max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
            {data.calls.map((c) => (
              <div key={c.id} onClick={() => onOpenCall?.(c.id)}
                className={`flex items-center justify-between text-sm border-b border-gray-50 pb-2 ${onOpenCall ? 'cursor-pointer hover:bg-sky-50/60 -mx-1 px-1 rounded' : ''}`}>
                <div>
                  <span className="text-gray-800">{c.startedAt ? new Date(c.startedAt).toLocaleString('ru-RU') : '—'}</span>
                  {c.callType && <span className="ml-2 text-xs text-gray-500">{CALL_TYPE_LABEL[c.callType] || c.callType}</span>}
                  <div className="text-xs text-gray-400">
                    {(c.clientName || data.deal.companyTitle) || '—'}{c.phone ? ` · ${c.phone}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.temperature && <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[c.temperature] || ''}`}>{tempRu(c.temperature)}</span>}
                  <span className="text-gray-500">{c.dealScore ?? '—'}/100</span>
                  <span className="text-gray-400">{c.managerScore != null ? `${c.managerScore}/10` : '—'}</span>
                </div>
              </div>
            ))}
            {data.calls.length === 0 && <p className="text-gray-400">Звонков нет.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── AI рекомендует — кому звонить сегодня ─────────── */
interface RecoItem {
  bitrixDealId: string; title: string | null; company: string | null; manager: string | null;
  dealUrl: string | null; severity: string; reason: string; action: string | null;
  temperature: string | null; dealScore: number | null; daysSinceCall: number | null;
}
interface RecoData { critical: RecoItem[]; risk: RecoItem[]; opportunity: RecoItem[]; counts: { critical: number; risk: number; opportunity: number } }

const RECO_COL = {
  critical: { title: '🔴 Критично', hint: 'Требуют вмешательства', ring: 'border-red-200', head: 'text-red-700' },
  risk: { title: '🟠 Риск', hint: 'Высокая вероятность потери', ring: 'border-amber-200', head: 'text-amber-700' },
  opportunity: { title: '🟢 Возможность', hint: 'Сигналы к покупке', ring: 'border-emerald-200', head: 'text-emerald-700' },
} as const;

function RecoCard({ it, onOpen }: { it: RecoItem; onOpen: (id: string) => void }) {
  return (
    <button onClick={() => onOpen(it.bitrixDealId)} className="w-full text-left bg-white rounded-xl border border-gray-100 p-3 hover:border-[#029cda]/40 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-gray-900 text-sm leading-snug">{it.company || it.title || `Сделка #${it.bitrixDealId}`}</span>
        {it.temperature && <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[it.temperature] || ''}`}>{tempRu(it.temperature)}</span>}
      </div>
      <p className="text-sm text-gray-700 mt-1">{it.reason}</p>
      {it.action && <p className="text-xs text-[#029cda] mt-1">→ {it.action}</p>}
      <div className="flex gap-3 text-xs text-gray-400 mt-2">
        {it.manager && <span>{it.manager}</span>}
        {it.dealScore != null && <span>{it.dealScore}/100</span>}
        {it.daysSinceCall != null && <span>{it.daysSinceCall} дн. назад</span>}
      </div>
    </button>
  );
}

function Recommendations({ onOpen }: { onOpen: (id: string) => void }) {
  const [data, setData] = useState<RecoData | null>(null);
  const [period, setPeriod] = usePersistentPeriod();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/ai-sales/recommendations?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900">AI рекомендует — кому звонить сегодня</h2>
        <button onClick={load} className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700">Обновить</button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Приоритетные сделки по данным разборов звонков. Клик — открыть карточку сделки.</p>
      <PeriodBar value={period} onChange={setPeriod} />
      {loading ? <LoadingBlock /> : !data ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(['critical', 'risk', 'opportunity'] as const).map((key) => (
            <div key={key} className={`rounded-2xl border ${RECO_COL[key].ring} bg-[#F6F7F9]/60 p-3`}>
              <div className="flex items-baseline justify-between px-1 mb-3">
                <span className={`font-bold ${RECO_COL[key].head}`}>{RECO_COL[key].title}</span>
                <span className="text-sm text-gray-400">{data.counts[key]}</span>
              </div>
              <p className="text-xs text-gray-400 px-1 mb-3">{RECO_COL[key].hint}</p>
              <div className="space-y-2">
                {data[key].map((it) => <RecoCard key={it.bitrixDealId} it={it} onOpen={onOpen} />)}
                {data[key].length === 0 && <p className="text-sm text-gray-400 px-1 py-4">Пусто — здесь чисто 👌</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── AI Insights ─────────── */
interface InsightsData {
  totalAnalyzed: number;
  topProducts: Array<{ name: string; count: number }>;
  topPainPoints: Array<{ name: string; count: number }>;
  topObjections: Array<{ text: string; count: number; unhandled: number }>;
  topCompetitors: Array<{ name: string; count: number }>;
  budgetNotDiscussedRate: number | null;
  procurementMentions: number;
  resultDistribution: Array<{ type: string; count: number }>;
  managerWeakCriteria: Array<{ key: string; avg: number }>;
  headlines: string[];
}
const CRIT_LABEL: Record<string, string> = {
  opening: 'приветствие', discovery: 'выявление потребности', questions: 'вопросы',
  pain_identification: 'выявление проблем', current_situation: 'текущая ситуация',
  decision_maker: 'выявление ЛПР', budget: 'обсуждение бюджета', timeline: 'сроки',
  procurement: 'закупки', objections: 'работа с возражениями',
  product_presentation: 'презентация продукта', next_step: 'следующий шаг', follow_up: 'follow-up',
};
const RESULT_LABEL: Record<string, string> = {
  agreed: 'договорились', not_agreed: 'не договорились', callback: 'перезвонить',
  meeting_set: 'встреча назначена', send_quote: 'отправить КП', not_interested: 'неинтересно',
  no_contact: 'не дозвонились', other: 'другое',
};

function TopList({ title, rows, max }: { title: string; rows: Array<{ label: string; count: number; extra?: string }>; max: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="font-semibold text-gray-800 mb-3">{title}</p>
      {rows.length === 0 ? <p className="text-gray-400 text-sm">Нет данных.</p> : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-700 truncate">{r.label}{r.extra ? <span className="text-red-500 text-xs ml-1">{r.extra}</span> : null}</span>
                <span className="text-gray-500 shrink-0">{r.count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-[#029cda]" style={{ width: `${max ? Math.round((r.count / max) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [period, setPeriod] = usePersistentPeriod();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/ai-sales/insights?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;

  const maxOf = (arr: Array<{ count: number }>) => arr.reduce((m, x) => Math.max(m, x.count), 0);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">AI Insights</h2>
      <p className="text-sm text-gray-500 mb-4">Агрегаты по разборам звонков за период.</p>
      <PeriodBar value={period} onChange={setPeriod} />
      {loading ? <LoadingBlock /> : !data ? null : (
        <div className="space-y-4">
          {data.headlines.length > 0 && (
            <div className="bg-[#029cda]/5 border border-[#029cda]/20 rounded-xl p-4">
              <p className="font-semibold text-gray-800 mb-2">Главное ({data.totalAnalyzed} звонков)</p>
              <ul className="space-y-1 text-sm text-gray-700">{data.headlines.map((h, i) => <li key={i}>• {h}</li>)}</ul>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Проанализировано" value={data.totalAnalyzed} />
            <Kpi label="Без обсуждения бюджета" value={data.budgetNotDiscussedRate != null ? `${data.budgetNotDiscussedRate}%` : '—'} sub="в состоявшихся звонках" />
            <Kpi label="Упоминаний закупок" value={data.procurementMentions} sub="44-ФЗ/223-ФЗ/тендер" />
            <Kpi label="Возражений (типов)" value={data.topObjections.length} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopList title="Востребованные продукты" max={maxOf(data.topProducts)} rows={data.topProducts.map((p) => ({ label: p.name, count: p.count }))} />
            <TopList title="Боли клиентов" max={maxOf(data.topPainPoints)} rows={data.topPainPoints.map((p) => ({ label: p.name, count: p.count }))} />
            <TopList title="Частые возражения" max={maxOf(data.topObjections)} rows={data.topObjections.map((o) => ({ label: o.text, count: o.count, extra: o.unhandled ? `${o.unhandled} не отработано` : undefined }))} />
            <TopList title="Конкуренты" max={maxOf(data.topCompetitors)} rows={data.topCompetitors.map((c) => ({ label: c.name, count: c.count }))} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopList title="Слабые места менеджеров (ниже балл)" max={10} rows={data.managerWeakCriteria.map((c) => ({ label: CRIT_LABEL[c.key] || c.key, count: c.avg }))} />
            <TopList title="Результаты звонков" max={maxOf(data.resultDistribution)} rows={data.resultDistribution.map((r) => ({ label: RESULT_LABEL[r.type] || r.type, count: r.count }))} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Follow-up (обещания менеджеров) ─────────── */
interface FollowUpItem {
  id: string; action: string; deadline: string | null; status: string; overdue: boolean;
  bitrixDealId: string | null; dealUrl: string | null; company: string | null; manager: string | null; createdAt: string | null;
}

function FollowUps() {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [status, setStatus] = useState('active');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams();
      if (status === 'overdue') qs.set('status', 'overdue');
      else if (status === 'done') qs.set('status', 'done');
      const r = await fetch(`/api/ai-sales/followups?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setItems(j.items); setOpenCount(j.openCount); setOverdueCount(j.overdueCount);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const complete = async (id: string) => {
    await fetch(`/api/ai-sales/followups/${id}/complete`, { method: 'POST' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Follow-up <span className="text-gray-400 text-base font-normal">· активных {openCount}{overdueCount ? <span className="text-red-500">, просрочено {overdueCount}</span> : null}</span>
        </h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
          <option value="active">Активные</option>
          <option value="overdue">Просроченные</option>
          <option value="done">Выполненные</option>
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-4">Обещания менеджеров из звонков («отправить КП», «перезвонить»). Отметьте выполненные.</p>
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}
      {loading ? <LoadingBlock /> : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className={`flex items-center justify-between gap-3 bg-white rounded-xl border p-3 ${it.overdue ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="min-w-0">
                <p className="text-sm text-gray-900">{it.action}</p>
                <div className="flex gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                  <span>{it.company || (it.bitrixDealId ? `Сделка #${it.bitrixDealId}` : '—')}</span>
                  {it.manager && <span>{it.manager}</span>}
                  {it.deadline && <span className={it.overdue ? 'text-red-500' : ''}>срок: {new Date(it.deadline).toLocaleDateString('ru-RU')}</span>}
                  {it.overdue && <span className="text-red-500 font-medium">просрочено</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {it.dealUrl && <a href={it.dealUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 underline">Bitrix</a>}
                {it.status !== 'DONE' && <button onClick={() => complete(it.id)} className="px-3 py-1.5 rounded-lg text-sm bg-[#029cda] text-white">Выполнено</button>}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-400 py-8 text-center">Обещаний нет.</p>}
        </div>
      )}
    </div>
  );
}

/* ─────────── Lost-deal analytics ─────────── */
interface LostData {
  total: number;
  reasons: Array<{ reason: string; label: string; count: number }>;
  deals: Array<{ bitrixDealId: string; company: string | null; manager: string | null; dealUrl: string | null; reason: string; reasonLabel: string; summary: string | null; closedAt: string | null }>;
}

function LostDeals({ onOpen }: { onOpen: (id: string) => void }) {
  const [data, setData] = useState<LostData | null>(null);
  const [period, setPeriod] = usePersistentPeriod();
  const [reasonFilter, setReasonFilter] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/ai-sales/lost?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;
  const maxR = data ? data.reasons.reduce((m, r) => Math.max(m, r.count), 1) : 1;
  const deals = data ? (reasonFilter ? data.deals.filter((d) => d.reason === reasonFilter) : data.deals) : [];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Проигранные сделки</h2>
      <p className="text-sm text-gray-500 mb-4">Причины проигрыша по AI-разбору звонков (не только по полю Bitrix).</p>
      <PeriodBar value={period} onChange={setPeriod} />
      {loading ? <LoadingBlock /> : !data ? null : data.total === 0 ? (
        <p className="text-gray-400 py-8">Проигранных сделок с разбором за период нет. (Убедитесь, что синхронизация обновила статусы сделок.)</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="font-semibold text-gray-800 mb-3">Причины ({data.total})</p>
            <div className="space-y-2">
              {data.reasons.map((r) => (
                <button key={r.reason} onClick={() => setReasonFilter(reasonFilter === r.reason ? '' : r.reason)}
                  className={`w-full text-left text-sm ${reasonFilter === r.reason ? 'text-[#029cda] font-medium' : 'text-gray-700'}`}>
                  <div className="flex justify-between"><span>{r.label}</span><span className="text-gray-500">{r.count}</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-red-400" style={{ width: `${Math.round((r.count / maxR) * 100)}%` }} /></div>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4">
            <p className="font-semibold text-gray-800 mb-3">Сделки{reasonFilter ? ` · ${data.reasons.find((r) => r.reason === reasonFilter)?.label}` : ''}</p>
            <div className="space-y-2 max-h-[560px] overflow-y-auto">
              {deals.map((d) => (
                <button key={d.bitrixDealId} onClick={() => onOpen(d.bitrixDealId)} className="w-full text-left border-b border-gray-50 pb-2 hover:text-[#029cda]">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-gray-900">{d.company || `Сделка #${d.bitrixDealId}`}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">{d.reasonLabel}</span>
                  </div>
                  {d.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.summary}</p>}
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">{d.manager && <span>{d.manager}</span>}{d.closedAt && <span>{new Date(d.closedAt).toLocaleDateString('ru-RU')}</span>}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Настройки AI ─────────── */
function Settings() {
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/ai-sales/settings');
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Ошибка');
        setS(j.settings);
      } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    })();
  }, []);

  const set = (k: string, v: unknown) => setS((prev) => ({ ...(prev || {}), [k]: v }));
  const save = async () => {
    if (!s) return;
    setBusy(true); setMsg('');
    try {
      const updates = {
        'transcription.provider': s['transcription.provider'],
        'diarization.provider': s['diarization.provider'],
        'ai.provider': s['ai.provider'],
        'ai.model.analysis': s['ai.model.analysis'],
        'ai.analysis_enabled': s['ai.analysis_enabled'],
        'ai.confidence_threshold': Number(s['ai.confidence_threshold']),
        'bitrix.auto_write': s['bitrix.auto_write'],
        'bitrix.auto_create_tasks': s['bitrix.auto_create_tasks'],
        'retention.transcript_days': Number(s['retention.transcript_days']),
      };
      const r = await fetch('/api/ai-sales/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
      const j = await r.json();
      setMsg(r.ok ? 'Сохранено' : (j.error || 'Ошибка'));
    } finally { setBusy(false); }
  };

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;
  if (!s) return <LoadingBlock />;
  const str = (k: string, d = '') => (s[k] == null ? d : String(s[k]));
  const bool = (k: string) => s[k] === true;

  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="py-3 border-b border-gray-100">
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Настройки AI</h2>
      <p className="text-sm text-gray-500 mb-4">Влияют на следующий анализ. Ключи Yandex/Anthropic/STT задаются в переменных окружения (Vercel).</p>

      <div className="bg-white rounded-xl border border-gray-100 px-5">
        <Field label="Провайдер транскрибации" hint="yandex_v3 — облако Yandex со спикерами (моно); selfhosted — свой сервер faster-whisper + pyannote (диаризация как у Voicee); yandex — SpeechKit v2 без диаризации; whisper — свой Whisper-endpoint. Меняется на лету, применится к следующим звонкам.">
          <select value={str('transcription.provider', 'yandex_v3')} onChange={(e) => set('transcription.provider', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full">
            <option value="yandex_v3">Yandex SpeechKit v3 (спикеры, облако)</option>
            <option value="selfhosted">Свой сервер — Whisper (faster-whisper + pyannote)</option>
            <option value="gigaam">Свой сервер — GigaAM (Sber, русский) + pyannote</option>
            <option value="gigastt">Свой сервер — GigaSTT (быстрый, Rust) + pyannote</option>
            <option value="gigastt_native">Свой сервер — GigaSTT со своей диаризацией (без pyannote, самый быстрый)</option>
            <option value="yandex">Yandex SpeechKit v2 (без диаризации)</option>
            <option value="whisper">Whisper-endpoint</option>
          </select>
        </Field>
        <Field label="Диаризация (разделение спикеров)" hint="yandex — метки говорящих от самого SpeechKit (слабее на моно); pyannote — свой сервер точно режет по говорящим поверх текста Yandex (как Voicee). Для pyannote нужен SELFHOSTED_STT_URL.">
          <select value={str('diarization.provider', 'yandex')} onChange={(e) => set('diarization.provider', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full">
            <option value="yandex">Yandex (встроенная)</option>
            <option value="pyannote">pyannote (свой сервер, точнее)</option>
          </select>
        </Field>
        <Field label="AI-провайдер анализа" hint="anthropic (Claude) или yandex (YandexGPT)">
          <select value={str('ai.provider', 'yandex')} onChange={(e) => set('ai.provider', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full">
            <option value="yandex">YandexGPT</option>
            <option value="anthropic">Anthropic Claude</option>
          </select>
        </Field>
        <Field label="Модель анализа (для Claude)" hint="напр. claude-opus-5. Для YandexGPT задаётся в env YANDEX_GPT_MODEL.">
          <input value={str('ai.model.analysis')} onChange={(e) => set('ai.model.analysis', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full" />
        </Field>
        <Field label="Анализ включён">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={bool('ai.analysis_enabled')} onChange={(e) => set('ai.analysis_enabled', e.target.checked)} /> обрабатывать новые звонки</label>
        </Field>
        <Field label="Порог уверенности" hint="0..1 — ниже AI помечает «недостаточно данных»">
          <input type="number" step="0.05" min="0" max="1" value={str('ai.confidence_threshold', '0.5')} onChange={(e) => set('ai.confidence_threshold', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-32" />
        </Field>
        <Field label="Автозапись в Bitrix" hint="Пока не активно — запись в CRM (задачи/комментарии) будет с подтверждением человеком.">
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={bool('bitrix.auto_write')} onChange={(e) => set('bitrix.auto_write', e.target.checked)} /> авто-запись результатов</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={bool('bitrix.auto_create_tasks')} onChange={(e) => set('bitrix.auto_create_tasks', e.target.checked)} /> авто-создание задач</label>
          </div>
        </Field>
        <Field label="Хранение транскриптов, дней" hint="Retention (§56). Очистка — отдельным заданием (позже).">
          <input type="number" min="0" value={str('retention.transcript_days', '365')} onChange={(e) => set('retention.transcript_days', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-32" />
        </Field>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={save} disabled={busy} className="px-4 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Сохранить</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}

/* ─────────── AI-теги ─────────── */
interface TagStat { slug: string; category: string; categoryLabel: string; label: string; count: number }
interface TagsData { groups: Array<{ category: string; categoryLabel: string; tags: TagStat[] }>; total: number }
const TAG_CAT_COLOR: Record<string, string> = {
  sales: 'bg-emerald-100 text-emerald-700', product: 'bg-sky-100 text-sky-700',
  risk: 'bg-red-100 text-red-700', client: 'bg-violet-100 text-violet-700', custom: 'bg-gray-100 text-gray-700',
};

function Tags({ onNavigate }: { onNavigate?: (t: NavTarget) => void }) {
  const [data, setData] = useState<TagsData | null>(null);
  const [period, setPeriod] = usePersistentPeriod();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/ai-sales/tags?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;

  const maxCount = data ? data.groups.reduce((m, g) => Math.max(m, ...g.tags.map((t) => t.count)), 1) : 1;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">AI-теги</h2>
      <p className="text-sm text-gray-500 mb-4">Автотеги из разборов звонков. Клик по тегу — звонки с этим тегом.</p>
      <PeriodBar value={period} onChange={setPeriod} />
      {loading ? <LoadingBlock /> : !data ? null : data.groups.length === 0 ? (
        <p className="text-gray-400 py-8">Тегов пока нет — появятся после анализа звонков.</p>
      ) : (
        <div className="space-y-5">
          {data.groups.map((g) => (
            <div key={g.category}>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">{g.categoryLabel}</p>
              <div className="flex flex-wrap gap-2">
                {g.tags.map((t) => (
                  <button key={t.slug} onClick={() => onNavigate?.({ tab: 'ai-calls', tag: t.slug })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${TAG_CAT_COLOR[t.category] || 'bg-gray-100 text-gray-700'} hover:ring-2 hover:ring-[#029cda]/30`}
                    style={{ fontSize: `${0.8 + Math.min(0.5, (t.count / maxCount) * 0.5)}rem` }}>
                    {t.label}<span className="opacity-60">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── AI РОП (сводный отчёт) ─────────── */
interface RopData {
  dept: { calls: number; analyzed: number; avgDealScore: number | null; avgManagerScore: number | null; hot: number; warm: number; cold: number; withoutNextStep: number };
  headlines: string[];
  bestManager: { name: string | null; score: number } | null;
  needsCoaching: { name: string | null; score: number } | null;
  weakestArea: string | null;
  attention: { criticalCount: number; riskCount: number; opportunityCount: number; items: RecoItem[] };
  overdueFollowups: number;
}

function Rop({ onOpen }: { onOpen: (id: string) => void }) {
  const [data, setData] = useState<RopData | null>(null);
  const [period, setPeriod] = usePersistentPeriod();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/ai-sales/rop?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">AI РОП — сводка по отделу</h2>
      <p className="text-sm text-gray-500 mb-4">Ключевые цифры, кто в топе, где проблемы и что требует внимания.</p>
      <PeriodBar value={period} onChange={setPeriod} />
      {loading ? <LoadingBlock /> : !data ? null : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Звонки" value={data.dept.calls} sub={`Проанализировано: ${data.dept.analyzed}`} />
            <Kpi label="Ср. Deal Score" value={data.dept.avgDealScore ?? '—'} />
            <Kpi label="Ср. оценка менеджера" value={data.dept.avgManagerScore != null ? `${data.dept.avgManagerScore}/10` : '—'} />
            <Kpi label="Просрочено follow-up" value={data.overdueFollowups} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="🔥 Горячие" value={data.dept.hot} />
            <Kpi label="Тёплые" value={data.dept.warm} />
            <Kpi label="🔴 Критично" value={data.attention.criticalCount} />
            <Kpi label="🟠 Риск" value={data.attention.riskCount} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#029cda]/5 border border-[#029cda]/20 rounded-xl p-4">
              <p className="font-semibold text-gray-800 mb-2">Главное</p>
              {data.headlines.length ? <ul className="space-y-1 text-sm text-gray-700">{data.headlines.map((h, i) => <li key={i}>• {h}</li>)}</ul> : <p className="text-gray-400 text-sm">Недостаточно данных.</p>}
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                {data.bestManager && <p>🏆 Лучший менеджер: <b>{data.bestManager.name || '—'}</b> ({data.bestManager.score}/10)</p>}
                {data.needsCoaching && <p>📉 Нужен коучинг: <b>{data.needsCoaching.name || '—'}</b> ({data.needsCoaching.score}/10)</p>}
                {data.weakestArea && <p>⚠️ Слабый участок: <b>{data.weakestArea}</b></p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-gray-800 mb-3">Требует внимания сегодня</p>
              <div className="space-y-2">
                {data.attention.items.map((it) => (
                  <button key={it.bitrixDealId} onClick={() => it.bitrixDealId && onOpen(it.bitrixDealId)} className="w-full text-left border-b border-gray-50 pb-2 hover:text-[#029cda]">
                    <p className="text-sm text-gray-900">{it.company || `Сделка #${it.bitrixDealId}`}</p>
                    <p className="text-xs text-gray-500">{it.reason}</p>
                  </button>
                ))}
                {data.attention.items.length === 0 && <p className="text-gray-400 text-sm">Критичных сделок нет 👌</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Менеджеры ─────────── */
interface ManagerRow {
  bitrixUserId: string; name: string | null; calls: number; analyzed: number;
  deals: number; hotDeals: number; avgManagerScore: number | null; avgDealScore: number | null;
}

function Managers({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<ManagerRow[]>([]);
  const [period, setPeriod] = usePersistentPeriod();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`/api/ai-sales/managers?${periodQS(period)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setItems(j.items);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Менеджеры</h2>
      <PeriodBar value={period} onChange={setPeriod} />
      {loading ? <LoadingBlock /> : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F6F7F9] text-gray-600">
              <tr>{['Менеджер', 'Звонков', 'Сделок', '🔥 Горячих', 'Оценка', 'Deal Score'].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((m) => (
                <tr key={m.bitrixUserId} onClick={() => onOpen(m.bitrixUserId)} className="hover:bg-sky-50/60 cursor-pointer">
                  <td className="px-3 py-2 font-medium text-gray-900">{m.name || `#${m.bitrixUserId}`}</td>
                  <td className="px-3 py-2">{m.calls}<span className="text-gray-400"> ({m.analyzed})</span></td>
                  <td className="px-3 py-2">{m.deals}</td>
                  <td className="px-3 py-2">{m.hotDeals}</td>
                  <td className="px-3 py-2 font-medium">{m.avgManagerScore != null ? `${m.avgManagerScore}/10` : '—'}</td>
                  <td className="px-3 py-2">{m.avgDealScore ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Нет данных.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface ManagerDetailData {
  bitrixUserId: string; name: string | null; metrics: ManagerRow;
  criteria: Array<{ key: string; label: string; avg: number }>;
  strengths: string[]; weaknesses: string[];
  recentCalls: Array<{ id: string; startedAt: string | null; callType: string | null; managerScore: number | null; temperature: string | null }>;
}

function ManagerDetail({ id, onBack, onOpenCall }: { id: string; onBack: () => void; onOpenCall?: (id: string) => void }) {
  const [data, setData] = useState<ManagerDetailData | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/ai-sales/managers/${id}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Ошибка');
        setData(j);
      } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    })();
  }, [id]);

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err} <button onClick={onBack} className="underline ml-2">Назад</button></div>;
  if (!data) return <LoadingBlock />;
  const m = data.metrics;

  return (
    <div>
      <button onClick={onBack} className="text-sm text-[#029cda] mb-4">← К менеджерам</button>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{data.name || `#${data.bitrixUserId}`}</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
        <Kpi label="Оценка (по сделкам)" value={m.avgManagerScore != null ? `${m.avgManagerScore}/10` : '—'} />
        <Kpi label="Звонков" value={m.calls} sub={`Проанализировано: ${m.analyzed}`} />
        <Kpi label="Сделок" value={m.deals} />
        <Kpi label="🔥 Горячих" value={m.hotDeals} />
        <Kpi label="Ср. Deal Score" value={m.avgDealScore ?? '—'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList title="Навыки по критериям (0–10)" max={10} rows={data.criteria.map((c) => ({ label: c.label, count: c.avg }))} />
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          {data.strengths.length > 0 && (<div><p className="text-xs uppercase tracking-wide text-emerald-600 mb-1">Сильные стороны</p><ul className="list-disc pl-5 text-sm text-gray-700">{data.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
          {data.weaknesses.length > 0 && (<div><p className="text-xs uppercase tracking-wide text-amber-600 mb-1">Зоны роста</p><ul className="list-disc pl-5 text-sm text-gray-700">{data.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
          {data.strengths.length === 0 && data.weaknesses.length === 0 && <p className="text-gray-400 text-sm">Недостаточно данных по сильным/слабым сторонам.</p>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
        <p className="font-semibold text-gray-800 mb-3">Последние звонки</p>
        <div className="space-y-2">
          {data.recentCalls.map((c) => (
            <div key={c.id} onClick={() => onOpenCall?.(c.id)}
              className={`flex items-center justify-between text-sm border-b border-gray-50 pb-2 ${onOpenCall ? 'cursor-pointer hover:bg-sky-50/60 -mx-1 px-1 rounded' : ''}`}>
              <span className="text-gray-700">{c.startedAt ? new Date(c.startedAt).toLocaleString('ru-RU') : '—'}
                {c.callType && <span className="ml-2 text-xs text-gray-400">{CALL_TYPE_LABEL[c.callType] || c.callType}</span>}</span>
              <div className="flex items-center gap-2">
                {c.temperature && <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[c.temperature] || ''}`}>{tempRu(c.temperature)}</span>}
                <span className="text-gray-400">{c.managerScore != null ? `${c.managerScore}/10` : '—'}</span>
              </div>
            </div>
          ))}
          {data.recentCalls.length === 0 && <p className="text-gray-400 text-sm">Звонков нет.</p>}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Отделы (структура + распределение сотрудников) ─────────── */
interface DeptRow { id: string; name: string; slug: string | null; analysisPrompt: string | null; sort: number; managerCount: number }
interface DeptManager { bitrixUserId: string; name: string | null; departmentId: string | null; active: boolean }

const jsonPost = (url: string, body: unknown, method = 'POST') =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/* ─────────── Поиск по всем звонкам (полнотекстовый) ─────────── */
interface SearchMatchT {
  callId: string; segmentIdx: number; role: string | null; startMs: number | null;
  snippet: string; text: string; startedAt: string | null; managerName: string | null;
  clientTitle: string | null; phone: string | null; dealUrl: string | null; leadUrl: string | null;
}

/** Рендер сниппета ts_headline: [[…]] → жёлтая подсветка. */
function Snippet({ text }: { text: string }) {
  const parts = text.split(/\[\[|\]\]/);
  // Чётные индексы — обычный текст, нечётные — подсвеченное совпадение.
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1
        ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{p}</mark>
        : <span key={i}>{p}</span>))}
    </>
  );
}

function Search({ onOpen }: { onOpen: (callId: string, startMs: number | null) => void }) {
  const [q, setQ] = useState('');
  const [matches, setMatches] = useState<SearchMatchT[]>([]);
  const [total, setTotal] = useState(0);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [department, setDepartment] = useState('');
  const [period, setPeriod] = usePersistentPeriod();
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/ai-sales/departments')
      .then((r) => r.json())
      .then((j) => { if (Array.isArray(j.departments)) setDepartmentOptions(j.departments.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))); })
      .catch(() => {});
  }, []);

  const run = useCallback(async () => {
    if (!q.trim()) return;
    setLoading(true); setErr(''); setSearched(true);
    try {
      const qs = periodQS(period);
      qs.set('q', q.trim());
      if (department) qs.set('department', department);
      const r = await fetch(`/api/ai-sales/search?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setMatches(j.matches); setTotal(j.total);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [q, department, period]);

  const suggestions = ['дорого', 'подумаю', 'конкурент', 'отправьте КП', 'перезвоните', 'не интересно'];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Поиск по звонкам</h2>
      <p className="text-sm text-gray-500 mb-4">Полнотекстовый поиск по репликам всех расшифрованных звонков. Клик по результату — переход к звонку и моменту записи.</p>

      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          placeholder="Например: дорого, отправьте КП, конкурент…"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]" />
        <select value={department} onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
          <option value="">Все отделы</option>
          {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={run} disabled={loading || !q.trim()}
          className="px-4 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Искать</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestions.map((s) => (
          <button key={s} onClick={() => { setQ(s); setTimeout(run, 0); }}
            className="text-xs px-2.5 py-1 rounded-full bg-[#F6F7F9] text-gray-600 hover:text-[#029cda]">{s}</button>
        ))}
      </div>

      <PeriodBar value={period} onChange={setPeriod} />
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}

      {loading ? <LoadingBlock /> : searched && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Найдено реплик: <b>{total}</b>{total > matches.length ? ` (показаны первые ${matches.length})` : ''}</p>
          <ul className="space-y-2">
            {matches.map((m, i) => (
              <li key={`${m.callId}-${m.segmentIdx}-${i}`}
                onClick={() => onOpen(m.callId, m.startMs)}
                className="bg-white border border-gray-100 rounded-xl p-3 hover:bg-sky-50/60 cursor-pointer">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>{m.startedAt ? new Date(m.startedAt).toLocaleString('ru-RU') : '—'}</span>
                  {m.managerName && <span>· {m.managerName}</span>}
                  {m.clientTitle && <span>· {m.clientTitle}</span>}
                  {m.startMs != null && <span className="ml-auto text-[#029cda]">▶ {ms2tc(m.startMs)}</span>}
                </div>
                <p className="text-sm">
                  <span className={`font-medium mr-1 ${m.role === 'CLIENT' ? 'text-emerald-700' : m.role === 'MANAGER' ? 'text-gray-900' : 'text-gray-500'}`}>
                    {m.role === 'MANAGER' ? 'Менеджер:' : m.role === 'CLIENT' ? 'Клиент:' : ''}
                  </span>
                  <span className="text-gray-700"><Snippet text={m.snippet} /></span>
                </p>
              </li>
            ))}
            {matches.length === 0 && <li className="text-sm text-gray-400">Ничего не найдено.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────── Контроль качества LLM (эталон руководителя vs модель) ─────────── */
interface QcMetricT { count: number; mae: number | null; bias: number | null; pearson: number | null; within: number | null }
interface QcRowT {
  callId: string; startedAt: string | null; managerName: string | null; clientTitle: string | null;
  reviewerEmail: string | null; humanDeal: number | null; humanManager: number | null;
  llmDeal: number | null; llmManager: number | null; promptVersion: string | null; model: string | null;
}
interface QcDataT {
  summary: { count: number; deal: QcMetricT; manager: QcMetricT; byVersion: Array<{ promptVersion: string; count: number; dealMae: number | null; managerMae: number | null }> };
  rows: QcRowT[];
}

function Qc({ onOpen }: { onOpen: (callId: string) => void }) {
  const [data, setData] = useState<QcDataT | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/ai-sales/qc')
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Ошибка'); return j; })
      .then((j) => setData(j))
      .catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;
  if (!data) return null;

  const s = data.summary;
  const corrLabel = (p: number | null) => p == null ? '—' : p >= 0.7 ? `${p} (сильная)` : p >= 0.4 ? `${p} (средняя)` : `${p} (слабая)`;
  const dlt = (h: number | null, l: number | null, thr: number) => {
    if (h == null || l == null) return null;
    const d = h - l;
    return <span className={Math.abs(d) <= thr ? 'text-emerald-600' : 'text-red-600'}>{d > 0 ? '+' : ''}{Math.round(d * 10) / 10}</span>;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Контроль качества</h2>
      <p className="text-sm text-gray-500 mb-5">Эталонные оценки руководителя против оценок LLM. Главная цель — чтобы оценка модели <b>коррелировала</b> с оценкой человека. Эталон ставится в карточке звонка.</p>

      {s.count === 0 ? (
        <div className="bg-[#F6F7F9] rounded-xl p-6 text-sm text-gray-500">
          Пока нет эталонных оценок. Откройте звонок и поставьте оценку в блоке «Эталонная оценка (контроль качества)».
          Для надёжной корреляции ТЗ рекомендует набрать 100–300 оценённых звонков.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <Kpi label="Оценено звонков" value={s.count} />
            <Kpi label="Корреляция (сделка)" value={corrLabel(s.deal.pearson)} sub={`MAE ${s.deal.mae ?? '—'} · ±10: ${s.deal.within ?? '—'}%`} />
            <Kpi label="Корреляция (менеджер)" value={corrLabel(s.manager.pearson)} sub={`MAE ${s.manager.mae ?? '—'} · ±2: ${s.manager.within ?? '—'}%`} />
            <Kpi label="Смещение LLM" value={`${s.deal.bias != null ? (s.deal.bias > 0 ? '+' : '') + s.deal.bias : '—'} / ${s.manager.bias != null ? (s.manager.bias > 0 ? '+' : '') + s.manager.bias : '—'}`} sub="сделка / менеджер (человек − LLM)" />
          </div>

          {s.byVersion.length > 1 && (
            <div className="bg-[#F6F7F9] rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">По версиям промта (MAE — чем меньше, тем ближе к человеку)</p>
              <div className="flex flex-wrap gap-2">
                {s.byVersion.map((v) => (
                  <span key={v.promptVersion} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-700">
                    {v.promptVersion} <span className="text-gray-400">({v.count})</span>
                    <b>сделка {v.dealMae ?? '—'}</b> · <b>мен. {v.managerMae ?? '—'}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F6F7F9] text-gray-600">
                <tr>{['Дата', 'Менеджер', 'Клиент', 'Сделка: чел./LLM/Δ', 'Менеджер: чел./LLM/Δ', 'Ревьюер'].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.callId} onClick={() => onOpen(r.callId)} className="border-t border-gray-100 hover:bg-sky-50/60 cursor-pointer">
                    <td className="px-3 py-2 whitespace-nowrap">{r.startedAt ? new Date(r.startedAt).toLocaleDateString('ru-RU') : '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.managerName || '—'}</td>
                    <td className="px-3 py-2">{r.clientTitle || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.humanDeal ?? '—'} / {r.llmDeal ?? '—'} / {dlt(r.humanDeal, r.llmDeal, 10) ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.humanManager ?? '—'} / {r.llmManager ?? '—'} / {dlt(r.humanManager, r.llmManager, 2) ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-xs">{r.reviewerEmail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────── RAG-ассистент + база знаний (§31 ТЗ) ─────────── */
interface AssistantSource { title: string; category: string | null; score: number }

/** Общий блок вопрос→ответ. callId — для вопросов про конкретный звонок. */
function AssistantAsk({ callId, compact = false, placeholder }: { callId?: string; compact?: boolean; placeholder?: string }) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<AssistantSource[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const ask = async (question?: string) => {
    const text = (question ?? q).trim();
    if (!text) return;
    setBusy(true); setErr(''); setAnswer(''); setSources([]);
    try {
      const r = await fetch('/api/ai-sales/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, callId: callId ?? null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setAnswer(j.answer || ''); setSources(j.sources || []);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setBusy(false); }
  };

  const suggestions = callId
    ? ['Почему такая оценка менеджера?', 'Какие ошибки допустил менеджер?', 'Какие вопросы стоило задать?']
    : ['Как отвечать на возражение «дорого»?', 'Какие у нас продукты и цены?', 'Что делать при возражении «подумаю»?'];

  return (
    <div>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
          placeholder={placeholder || 'Задайте вопрос…'}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]" />
        <button onClick={() => ask()} disabled={busy || !q.trim()}
          className="px-4 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50 flex items-center gap-2">
          {busy && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}Спросить
        </button>
      </div>
      {!answer && !busy && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => { setQ(s); ask(s); }}
              className="text-xs px-2.5 py-1 rounded-full bg-[#F6F7F9] text-gray-600 hover:text-[#029cda]">{s}</button>
          ))}
        </div>
      )}
      {err && <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}
      {busy && <LoadingBlock />}
      {answer && (
        <div className={`mt-3 ${compact ? '' : 'bg-[#F6F7F9] rounded-xl p-4'}`}>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer}</p>
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-gray-400">Источники:</span>
              {sources.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{s.title}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Assistant() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Ассистент</h2>
      <p className="text-sm text-gray-500 mb-5">Задавайте вопросы — ассистент отвечает по вашей базе знаний (продукты, цены, скрипты, возражения, регламенты). Материалы добавляются во вкладке «База знаний».</p>
      <AssistantAsk placeholder="Например: как отвечать на «дорого»? какие продукты и цены?" />
    </div>
  );
}

interface KbDoc { id: string; title: string; category: string | null; content: string; isActive: boolean; chunks: number; indexed: number; updatedAt: string | null }

function KnowledgeBase() {
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [sel, setSel] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<{ title: string; category: string; content: string }>({ title: '', category: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/ai-sales/kb');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setDocs(j.documents); setCategories(j.categories || []);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const catLabel = (v: string | null) => categories.find((c) => c.value === v)?.label || v || '—';

  const openNew = () => { setSel('new'); setDraft({ title: '', category: '', content: '' }); };
  const openDoc = (d: KbDoc) => { setSel(d.id); setDraft({ title: d.title, category: d.category || '', content: d.content }); };

  const save = async () => {
    if (!draft.title.trim() && !draft.content.trim()) return;
    setBusy(true); setErr('');
    try {
      if (sel === 'new') {
        await jsonPost('/api/ai-sales/kb', { title: draft.title, category: draft.category || null, content: draft.content });
      } else if (sel) {
        await jsonPost(`/api/ai-sales/kb/${sel}`, { title: draft.title, category: draft.category || null, content: draft.content }, 'PATCH');
      }
      setSel(null); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Удалить документ из базы знаний?')) return;
    await fetch(`/api/ai-sales/kb/${id}`, { method: 'DELETE' });
    if (sel === id) setSel(null);
    await load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900">База знаний</h2>
        <button onClick={openNew} className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white">+ Документ</button>
      </div>
      <p className="text-sm text-gray-500 mb-5">Материалы для ассистента: продукты, цены, FAQ, скрипты, регламенты, возражения, примеры звонков. При сохранении текст индексируется (эмбеддинги Yandex).</p>
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}

      {sel && (
        <div className="bg-[#F6F7F9] rounded-xl p-4 mb-5">
          <div className="flex gap-2 mb-3">
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Заголовок" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#029cda]" />
            <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">Категория…</option>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <textarea value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            rows={10} placeholder="Текст материала…"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-[#029cda]" />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={save} disabled={busy}
              className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50 flex items-center gap-2">
              {busy && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}Сохранить и проиндексировать
            </button>
            <button onClick={() => setSel(null)} className="text-sm text-gray-500 hover:text-gray-800">Отмена</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F6F7F9] text-gray-600">
            <tr>{['Заголовок', 'Категория', 'Чанки', 'Обновлён', ''].map((h) => (
              <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-sky-50/60">
                <td className="px-3 py-2 cursor-pointer" onClick={() => openDoc(d)}><span className="text-[#029cda]">{d.title}</span></td>
                <td className="px-3 py-2 whitespace-nowrap">{catLabel(d.category)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {d.indexed}/{d.chunks}
                  {d.chunks > 0 && d.indexed < d.chunks && <span className="text-xs text-amber-600 ml-1">не всё проиндексировано</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-xs">{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('ru-RU') : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right"><button onClick={() => remove(d.id)} className="text-gray-300 hover:text-red-500">✕</button></td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">База знаний пуста — добавьте первый документ.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Departments() {
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [managers, setManagers] = useState<DeptManager[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/ai-sales/departments');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setDepts(j.departments); setManagers(j.managers);
      setNames(Object.fromEntries((j.departments as DeptRow[]).map((d) => [d.id, d.name])));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try { await jsonPost('/api/ai-sales/departments', { name: newName.trim() }); setNewName(''); await load(); }
    finally { setBusy(false); }
  };
  const rename = async (id: string) => {
    const name = (names[id] || '').trim(); if (!name) return;
    await jsonPost(`/api/ai-sales/departments/${id}`, { name }, 'PATCH'); await load();
  };
  const remove = async (id: string) => {
    if (!window.confirm('Удалить отдел? Сотрудники останутся без отдела.')) return;
    await fetch(`/api/ai-sales/departments/${id}`, { method: 'DELETE' }); await load();
  };
  const assign = async (bitrixUserId: string, departmentId: string) => {
    setManagers((prev) => prev.map((m) => m.bitrixUserId === bitrixUserId ? { ...m, departmentId: departmentId || null } : m));
    await jsonPost('/api/ai-sales/managers/assign', { bitrixUserId, departmentId: departmentId || null });
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Отделы</h2>
      <p className="text-sm text-gray-500 mb-5">Структура компании для речевой аналитики: у каждого отдела свой промт анализа и свой состав сотрудников.</p>
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Отделы */}
        <div>
          <div className="flex gap-2 mb-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
              placeholder="Новый отдел…"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            <button onClick={create} disabled={busy || !newName.trim()}
              className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Добавить</button>
          </div>
          <ul className="space-y-2">
            {depts.map((d) => (
              <li key={d.id} className="flex items-center gap-2 bg-[#F6F7F9] rounded-xl px-3 py-2">
                <input value={names[d.id] ?? ''} onChange={(e) => setNames((p) => ({ ...p, [d.id]: e.target.value }))}
                  onBlur={() => { if ((names[d.id] || '').trim() && names[d.id] !== d.name) rename(d.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="flex-1 bg-transparent px-2 py-1 rounded border border-transparent hover:border-gray-200 focus:border-[#029cda] focus:bg-white text-sm outline-none" />
                <span className="text-xs text-gray-400 whitespace-nowrap">{d.managerCount} сотр.</span>
                <button onClick={() => remove(d.id)} title="Удалить отдел"
                  className="text-gray-300 hover:text-red-500 px-1">✕</button>
              </li>
            ))}
            {depts.length === 0 && <li className="text-sm text-gray-400">Отделов пока нет.</li>}
          </ul>
        </div>

        {/* Сотрудники */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Сотрудники по отделам</p>
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F6F7F9] text-gray-600">
                <tr><th className="text-left font-medium px-3 py-2">Сотрудник</th><th className="text-left font-medium px-3 py-2">Отдел</th></tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <tr key={m.bitrixUserId} className="border-t border-gray-100">
                    <td className="px-3 py-2">{m.name || `ID ${m.bitrixUserId}`}{!m.active && <span className="text-xs text-gray-400"> (неактивен)</span>}</td>
                    <td className="px-3 py-2">
                      <select value={m.departmentId || ''} onChange={(e) => assign(m.bitrixUserId, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-gray-300 text-sm">
                        <option value="">— без отдела —</option>
                        {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {managers.length === 0 && <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">Сотрудники появятся после синхронизации Bitrix.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Промты анализа по отделам ─────────── */
function Prompts() {
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState('');
  const [showDefault, setShowDefault] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/ai-sales/departments');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setDepts(j.departments); setDefaultPrompt(j.defaultAnalysisPrompt || '');
      setDrafts(Object.fromEntries((j.departments as DeptRow[]).map((d) => [d.id, d.analysisPrompt || ''])));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (id: string) => {
    await jsonPost(`/api/ai-sales/departments/${id}`, { analysisPrompt: drafts[id] ?? '' }, 'PATCH');
    setSavedId(id); setTimeout(() => setSavedId(''), 2500);
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Промты анализа</h2>
      <p className="text-sm text-gray-500 mb-5">Свой системный промт для YandexGPT на каждый отдел — звонки разных отделов анализируются по-разному. Пусто — используется стандартный промт (отдел продаж).</p>
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}

      <div className="mb-4">
        <button onClick={() => setShowDefault((v) => !v)} className="text-sm text-[#029cda] hover:underline">
          {showDefault ? '▲ Скрыть' : '▼ Показать'} стандартный промт
        </button>
        {showDefault && (
          <pre className="mt-2 p-3 bg-[#F6F7F9] rounded-lg text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">{defaultPrompt}</pre>
        )}
      </div>

      <div className="space-y-6">
        {depts.map((d) => {
          const custom = (drafts[d.id] || '').trim().length > 0;
          return (
            <div key={d.id} className="bg-[#F6F7F9] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800">{d.name}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${custom ? 'bg-[#029cda]/10 text-[#029cda]' : 'bg-gray-200 text-gray-500'}`}>
                    {custom ? 'свой промт' : 'стандартный'}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDrafts((p) => ({ ...p, [d.id]: defaultPrompt }))}
                    className="text-xs text-gray-500 hover:text-[#029cda]">Вставить стандартный</button>
                  <button onClick={() => setDrafts((p) => ({ ...p, [d.id]: '' }))}
                    className="text-xs text-gray-500 hover:text-red-500">Очистить</button>
                </div>
              </div>
              <textarea value={drafts[d.id] ?? ''} onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: e.target.value }))}
                rows={8} placeholder="Пусто — используется стандартный промт отдела продаж"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono bg-white outline-none focus:border-[#029cda]" />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => save(d.id)}
                  className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white">Сохранить</button>
                {savedId === d.id && <span className="text-sm text-green-600">✓ Сохранено</span>}
              </div>
            </div>
          );
        })}
        {depts.length === 0 && <p className="text-sm text-gray-400">Сначала создайте отделы во вкладке «Отделы».</p>}
      </div>
    </div>
  );
}

/* ─────────── Скрипты продаж (редактор + версии) ─────────── */
interface ScriptStepT { key: string; title: string }
interface SalesScriptT { id: string; departmentId: string | null; departmentName: string | null; name: string; version: number; steps: ScriptStepT[] }

function Scripts() {
  const [scripts, setScripts] = useState<SalesScriptT[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [drafts, setDrafts] = useState<Record<string, { name: string; steps: ScriptStepT[] }>>({});
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState('');
  const [newScope, setNewScope] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/ai-sales/scripts');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setScripts(j.scripts); setDepartments(j.departments || []);
      setDrafts(Object.fromEntries((j.scripts as SalesScriptT[]).map((s) => [s.id, { name: s.name, steps: s.steps.map((st) => ({ ...st })) }])));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (id: string) => {
    const d = drafts[id]; if (!d) return;
    const steps = d.steps.filter((s) => s.title.trim());
    await jsonPost(`/api/ai-sales/scripts/${id}`, { name: d.name, steps }, 'PATCH');
    setSavedId(id); setTimeout(() => setSavedId(''), 2500);
    load();
  };
  const createFor = async () => {
    const departmentId = newScope === 'global' ? null : newScope || null;
    if (!newScope) return;
    await jsonPost('/api/ai-sales/scripts', { departmentId, name: 'Скрипт продаж' });
    setNewScope(''); load();
  };

  const setDraft = (id: string, patch: Partial<{ name: string; steps: ScriptStepT[] }>) =>
    setDrafts((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  if (loading) return <LoadingBlock />;

  // Scope'ы без активного скрипта (для кнопки создания).
  const usedDeptIds = new Set(scripts.map((s) => s.departmentId));
  const hasGlobal = scripts.some((s) => s.departmentId === null);
  const missingScopes = [
    ...(!hasGlobal ? [{ id: 'global', name: 'Общий (по умолчанию)' }] : []),
    ...departments.filter((d) => !usedDeptIds.has(d.id)),
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Скрипт продаж</h2>
      <p className="text-sm text-gray-500 mb-5">Чек-лист шагов, по которому LLM оценивает каждый звонок. Общий скрипт применяется, если у отдела нет своего. Изменение шагов повышает версию.</p>
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}

      {missingScopes.length > 0 && (
        <div className="flex gap-2 mb-5">
          <select value={newScope} onChange={(e) => setNewScope(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="">Добавить скрипт для…</option>
            {missingScopes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={createFor} disabled={!newScope}
            className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Создать</button>
        </div>
      )}

      <div className="space-y-6">
        {scripts.map((s) => {
          const d = drafts[s.id] || { name: s.name, steps: [] };
          return (
            <div key={s.id} className="bg-[#F6F7F9] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.departmentId ? 'bg-[#029cda]/10 text-[#029cda]' : 'bg-gray-200 text-gray-600'}`}>
                    {s.departmentName || 'Общий'}
                  </span>
                  <input value={d.name} onChange={(e) => setDraft(s.id, { name: e.target.value })}
                    className="flex-1 max-w-xs bg-white px-2 py-1 rounded border border-gray-200 focus:border-[#029cda] text-sm outline-none" />
                  <span className="text-xs text-gray-400">v{s.version}</span>
                </div>
              </div>

              <ol className="space-y-2 mb-3">
                {d.steps.map((st, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                    <input value={st.title}
                      onChange={(e) => setDraft(s.id, { steps: d.steps.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) })}
                      placeholder="Название шага…"
                      className="flex-1 bg-white px-2 py-1 rounded border border-gray-200 focus:border-[#029cda] text-sm outline-none" />
                    <button onClick={() => setDraft(s.id, { steps: d.steps.filter((_, i) => i !== idx) })}
                      title="Удалить шаг" className="text-gray-300 hover:text-red-500 px-1">✕</button>
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-3">
                <button onClick={() => setDraft(s.id, { steps: [...d.steps, { key: '', title: '' }] })}
                  className="text-sm text-[#029cda] hover:underline">+ Добавить шаг</button>
                <div className="flex-1" />
                {savedId === s.id && <span className="text-sm text-green-600">✓ Сохранено</span>}
                <button onClick={() => save(s.id)}
                  className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white">Сохранить</button>
              </div>
            </div>
          );
        })}
        {scripts.length === 0 && <p className="text-sm text-gray-400">Скриптов пока нет — создайте общий скрипт выше.</p>}
      </div>
    </div>
  );
}

/* ─────────── Раздел «Речевая аналитика» (единый, со своим навбаром) ─────────── */
const SECTIONS: Array<{ view: View; label: string }> = [
  { view: 'dashboard', label: 'Обзор' },
  { view: 'calls', label: 'Коммуникации' },
  { view: 'search', label: 'Поиск' },
  { view: 'assistant', label: 'Ассистент' },
  { view: 'rop', label: 'AI РОП' },
  { view: 'reco', label: 'Рекомендации' },
  { view: 'followups', label: 'Follow-up' },
  { view: 'deals', label: 'Сделки' },
  { view: 'managers', label: 'Менеджеры' },
  { view: 'lost', label: 'Проигрыши' },
  { view: 'insights', label: 'Отчёты' },
  { view: 'qc', label: 'Контроль качества' },
  { view: 'tags', label: 'Разметка' },
  { view: 'departments', label: 'Отделы' },
  { view: 'scripts', label: 'Скрипт' },
  { view: 'kb', label: 'База знаний' },
  { view: 'prompts', label: 'Промты' },
  { view: 'settings', label: 'Настройки' },
];

export default function AiSalesSection() {
  const [view, setView] = useState<View>('dashboard');
  const [openCall, setOpenCall] = useState<string | null>(null);
  const [openCallSeek, setOpenCallSeek] = useState<number | null>(null);
  const [openDeal, setOpenDeal] = useState<string | null>(null);
  const [initTemp, setInitTemp] = useState<string | undefined>(undefined);
  const [initTag, setInitTag] = useState<string | undefined>(undefined);

  const closeCall = () => { setOpenCall(null); setOpenCallSeek(null); };
  const go = (v: View) => { setView(v); closeCall(); setOpenDeal(null); setInitTemp(undefined); setInitTag(undefined); };
  const nav = (t: NavTarget) => {
    const map: Record<string, View> = { 'ai-deals': 'deals', 'ai-calls': 'calls', 'ai-reco': 'reco' };
    setInitTemp(t.temperature); setInitTag(t.tag);
    closeCall(); setOpenDeal(null);
    setView(map[t.tab] ?? 'dashboard');
  };
  const openCallAt = (id: string, startMs: number | null) => { setOpenCall(id); setOpenCallSeek(startMs); };

  const body = (() => {
    // Карточка звонка доступна из любого раздела (сделки, менеджеры, звонки, поиск).
    if (openCall) return <CallDetail id={openCall} initialSeekMs={openCallSeek} onBack={closeCall} />;
    if (view === 'dashboard') return <Dashboard onNavigate={nav} />;
    if (view === 'search') return <Search onOpen={openCallAt} />;
    if (view === 'qc') return <Qc onOpen={(cid) => openCallAt(cid, null)} />;
    if (view === 'assistant') return <Assistant />;
    if (view === 'kb') return <KnowledgeBase />;
    if (view === 'tags') return <Tags onNavigate={nav} />;
    if (view === 'departments') return <Departments />;
    if (view === 'scripts') return <Scripts />;
    if (view === 'prompts') return <Prompts />;
    if (view === 'settings') return <Settings />;
    if (view === 'insights') return <Insights />;
    if (view === 'followups') return <FollowUps />;
    if (view === 'lost') return openDeal ? <DealDetail id={openDeal} onBack={() => setOpenDeal(null)} onOpenCall={setOpenCall} /> : <LostDeals onOpen={setOpenDeal} />;
    if (view === 'rop') return openDeal ? <DealDetail id={openDeal} onBack={() => setOpenDeal(null)} onOpenCall={setOpenCall} /> : <Rop onOpen={setOpenDeal} />;
    if (view === 'managers') return openDeal ? <ManagerDetail id={openDeal} onBack={() => setOpenDeal(null)} onOpenCall={setOpenCall} /> : <Managers onOpen={setOpenDeal} />;
    if (view === 'reco') return openDeal ? <DealDetail id={openDeal} onBack={() => setOpenDeal(null)} onOpenCall={setOpenCall} /> : <Recommendations onOpen={setOpenDeal} />;
    if (view === 'deals') return openDeal ? <DealDetail id={openDeal} onBack={() => setOpenDeal(null)} onOpenCall={setOpenCall} /> : <Deals onOpen={setOpenDeal} initialTemperature={initTemp} />;
    return <Calls initialTemperature={initTemp} initialTag={initTag} />;
  })();

  return (
    <div>
      <div className="mb-5 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {SECTIONS.map((s) => (
            <button key={s.view} type="button" onClick={() => go(s.view)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition ${view === s.view ? 'border-[#029cda] text-[#029cda] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {body}
    </div>
  );
}
