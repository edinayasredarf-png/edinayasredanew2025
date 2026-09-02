'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/* Раздел «AI Продажи» админ-панели: дашборд, звонки, карточка звонка.
   Данные — из /api/ai-sales/*. Стиль — фирменный (#029cda), Tailwind. */

type View = 'dashboard' | 'calls' | 'deals' | 'reco';

const fmtDur = (sec: number | null) => {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const TEMP_BADGE: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700',
  WARM: 'bg-amber-100 text-amber-700',
  COLD: 'bg-sky-100 text-sky-700',
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

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-[#F6F7F9] rounded-xl p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
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

function PeriodBar({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [active, setActive] = useState('all');
  const pick = (key: string) => { setActive(key); onChange(presetRange(key)); };
  const presets = [['all', 'Всё'], ['today', 'Сегодня'], ['week', 'Неделя'], ['month', 'Месяц']];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {presets.map(([key, label]) => (
        <button key={key} onClick={() => pick(key)}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${active === key ? 'bg-[#029cda] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          {label}
        </button>
      ))}
      <span className="text-gray-300 mx-1">|</span>
      <input type="date" value={value.from || ''} max={value.to || undefined}
        onChange={(e) => { setActive('custom'); onChange({ from: e.target.value || null, to: value.to }); }}
        className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700" />
      <span className="text-gray-400 text-sm">—</span>
      <input type="date" value={value.to || ''} min={value.from || undefined}
        onChange={(e) => { setActive('custom'); onChange({ from: value.from, to: e.target.value || null }); }}
        className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700" />
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

function Dashboard() {
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [period, setPeriod] = useState<Period>(NO_PERIOD);

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
    } finally { setBusy(false); }
  };

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err}</div>;
  if (!data) return <div className="text-gray-500">Загрузка…</div>;

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
        <Kpi label="Звонки" value={data.calls.total} sub={`Проанализировано: ${data.calls.analyzed}`} />
        <Kpi label="Средняя длит." value={fmtDur(data.calls.avgDurationSec)} />
        <Kpi label="Средний Deal Score" value={data.calls.avgDealScore ?? '—'} sub="0–100" />
        <Kpi label="Средняя оценка менеджера" value={data.calls.avgManagerScore ?? '—'} sub="0–10" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Kpi label="🔥 Горячие" value={data.temperature.hot} />
        <Kpi label="Тёплые" value={data.temperature.warm} />
        <Kpi label="Холодные" value={data.temperature.cold} />
        <Kpi label="Без следующего шага" value={data.attention.withoutNextStep} />
      </div>

      <div className="bg-[#F6F7F9] rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-2">Очередь обработки</p>
        <div className="flex gap-6 text-sm text-gray-700">
          <span>В очереди: <b>{data.queue.pending}</b></span>
          <span>Выполняется: <b>{data.queue.running}</b></span>
          <span>Повтор: <b>{data.queue.retry}</b></span>
          <span className={data.queue.failed ? 'text-red-600' : ''}>Ошибки: <b>{data.queue.failed}</b></span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Список звонков ─────────── */
interface CallItem {
  id: string; startedAt: string | null; managerName: string | null; companyTitle: string | null;
  bitrixDealId: string | null; dealUrl: string | null; durationSec: number | null; product: string | null;
  dealScore: number | null; managerScore: number | null; temperature: string | null;
  resultType: string | null; nextStep: string | null; status: string;
}

function Calls({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<CallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [temp, setTemp] = useState('');
  const [status, setStatus] = useState('');
  const [period, setPeriod] = useState<Period>(NO_PERIOD);
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = periodQS(period);
      if (temp) qs.set('temperature', temp);
      if (status) qs.set('status', status);
      qs.set('sort', sort);
      qs.set('limit', '200');
      const r = await fetch(`/api/ai-sales/calls?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setItems(j.items); setTotal(j.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    } finally { setLoading(false); }
  }, [temp, status, period, sort]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Звонки <span className="text-gray-400 text-base font-normal">({total})</span></h2>
        <div className="flex gap-2">
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

      <PeriodBar value={period} onChange={setPeriod} />
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{err}</div>}
      {loading ? <div className="text-gray-500">Загрузка…</div> : (
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
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="hover:bg-sky-50/60 cursor-pointer">
                  <td className="px-3 py-2 whitespace-nowrap">{c.startedAt ? new Date(c.startedAt).toLocaleString('ru-RU') : '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{c.managerName || '—'}</td>
                  <td className="px-3 py-2">{c.companyTitle || '—'}</td>
                  <td className="px-3 py-2">{fmtDur(c.durationSec)}</td>
                  <td className="px-3 py-2">{c.product || '—'}</td>
                  <td className="px-3 py-2 font-medium">{c.dealScore ?? '—'}</td>
                  <td className="px-3 py-2">{c.managerScore ?? '—'}</td>
                  <td className="px-3 py-2">
                    {c.temperature ? <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[c.temperature] || ''}`}>{c.temperature}</span> : '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">{STATUS_LABEL[c.status] || c.status}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">Звонков нет. Запустите синхронизацию и обработку очереди.</td></tr>
              )}
            </tbody>
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
    managerName: string | null; companyTitle: string | null; bitrixDealId: string | null; dealUrl: string | null;
  };
  transcript: { provider: string; language: string | null; segments: Array<{ idx: number; role: string | null; speakerLabel: string | null; startMs: number | null; text: string }> } | null;
  analysis: Record<string, unknown> | null;
}

const roleLabel = (role: string | null, speaker: string | null) =>
  role === 'MANAGER' ? 'Менеджер' : role === 'CLIENT' ? 'Клиент' : (speaker || 'Реплика');

const ms2tc = (ms: number | null) => {
  if (ms == null) return '';
  const t = Math.floor(ms / 1000);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

function CallDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [data, setData] = useState<DetailData | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const seek = (startMs: number | null) => {
    if (startMs == null || !audioRef.current) return;
    audioRef.current.currentTime = startMs / 1000;
    audioRef.current.play().catch(() => {});
  };

  if (err) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{err} <button onClick={onBack} className="underline ml-2">Назад</button></div>;
  if (!data) return <div className="text-gray-500">Загрузка…</div>;

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
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-[#029cda]">← К списку</button>
        <div className="flex gap-2">
          {data.call.dealUrl && <a href={data.call.dealUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700">Сделка в Bitrix</a>}
          <button onClick={reanalyze} disabled={busy} className="px-3 py-2 rounded-lg text-sm bg-[#029cda] text-white disabled:opacity-50">Переанализировать</button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Транскрипт */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="font-semibold text-gray-800 mb-3">Транскрипция</p>
          {!data.transcript ? <p className="text-gray-400 text-sm">Пока нет транскрипта.</p> : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[a.dealScore.temperature || ''] || ''}`}>{a.dealScore.temperature}</span>
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

function Deals({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<DealItem[]>([]);
  const [total, setTotal] = useState(0);
  const [temp, setTemp] = useState('');
  const [period, setPeriod] = useState<Period>(NO_PERIOD);
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
      {loading ? <div className="text-gray-500">Загрузка…</div> : (
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
                  <td className="px-3 py-2">{d.temperature ? <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[d.temperature] || ''}`}>{d.temperature}</span> : '—'}</td>
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
  calls: Array<{ id: string; startedAt: string | null; callType: string | null; status: string; dealScore: number | null; managerScore: number | null; temperature: string | null }>;
}

function DealDetail({ id, onBack }: { id: string; onBack: () => void }) {
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
  if (!data) return <div className="text-gray-500">Загрузка…</div>;
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
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[ins.dealScore.temperature || ''] || ''}`}>{ins.dealScore.temperature}</span>
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
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {data.calls.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                <div>
                  <span className="text-gray-800">{c.startedAt ? new Date(c.startedAt).toLocaleString('ru-RU') : '—'}</span>
                  {c.callType && <span className="ml-2 text-xs text-gray-500">{CALL_TYPE_LABEL[c.callType] || c.callType}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {c.temperature && <span className={`px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[c.temperature] || ''}`}>{c.temperature}</span>}
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
        {it.temperature && <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${TEMP_BADGE[it.temperature] || ''}`}>{it.temperature}</span>}
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
  const [period, setPeriod] = useState<Period>(NO_PERIOD);
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
      {loading ? <div className="text-gray-500">Загрузка…</div> : !data ? null : (
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

/* ─────────── Обёртка раздела ─────────── */
export default function AiSalesSection({ view }: { view: View }) {
  const [openCall, setOpenCall] = useState<string | null>(null);
  const [openDeal, setOpenDeal] = useState<string | null>(null);

  if (view === 'dashboard') return <Dashboard />;
  if (view === 'reco') {
    return openDeal
      ? <DealDetail id={openDeal} onBack={() => setOpenDeal(null)} />
      : <Recommendations onOpen={setOpenDeal} />;
  }
  if (view === 'deals') {
    return openDeal
      ? <DealDetail id={openDeal} onBack={() => setOpenDeal(null)} />
      : <Deals onOpen={setOpenDeal} />;
  }
  return openCall
    ? <CallDetail id={openCall} onBack={() => setOpenCall(null)} />
    : <Calls onOpen={setOpenCall} />;
}
