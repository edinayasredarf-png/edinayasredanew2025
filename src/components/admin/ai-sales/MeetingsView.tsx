'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, ExternalLink, RefreshCw, Search as SearchIcon, Video } from 'lucide-react';
import { Modal } from '@/components/admin/ui/Modal';
import { LoadingBlock } from '@/components/admin/ui/Spinner';

/* Встречи (ВКС, МТС Линк): список записей с саммари и карточка встречи — саммари, решения, задачи, скрипт, расшифровка. */

export interface MeetingType { id: string; name: string; isDefault: boolean }
interface Speaker { label: string; role: string; name: string | null }
interface Analysis {
  summary?: string; topics?: string[]; decisions?: string[]; needs?: string[]; risks?: string[]; nextSteps?: string[];
  actionItems?: Array<{ who: string | null; what: string; due: string | null }>;
  objections?: Array<{ text: string; handled: boolean | null }>;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  employeeFeedback?: { didWell?: string[]; improve?: string[] };
  script?: { steps?: Array<{ key: string; completed: boolean | null; evidence: string | null }> };
  scriptSteps?: Array<{ key: string; title: string }>;
  participants?: Array<{ label: string; name: string | null; role: string; talkSharePct: number }>;
}
interface Meeting {
  id: string; externalRecordId: string; title: string | null; link: string | null; startedAt: string | null; durationSec: number | null;
  status: string; typeId: string | null; typeName: string | null; typeSource: string | null; speakers: Speaker[];
  summary: string | null; scriptScore: number | null; analysis: Analysis | null; error: string | null; analyzedAt: string | null;
}
interface Segment { idx: number; speakerLabel: string | null; role: string | null; startMs: number | null; endMs: number | null; text: string }

const STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: 'Ожидает', tone: 'bg-gray-100 text-gray-600' },
  CONVERTING: { label: 'Конвертация записи', tone: 'bg-sky-100 text-sky-700' },
  TRANSCRIBING: { label: 'Распознавание', tone: 'bg-sky-100 text-sky-700' },
  TRANSCRIBED: { label: 'Расшифровано', tone: 'bg-sky-100 text-sky-700' },
  ANALYZING: { label: 'Анализ', tone: 'bg-violet-100 text-violet-700' },
  COMPLETED: { label: 'Готово', tone: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Ошибка', tone: 'bg-red-100 text-red-700' },
  SKIPPED: { label: 'Пропущена (короткая)', tone: 'bg-gray-100 text-gray-500' },
};
const ROLE_RU: Record<string, string> = { EMPLOYEE: 'сотрудник', CLIENT: 'клиент', UNKNOWN: '' };
const SENTIMENT_RU: Record<string, string> = { positive: 'Позитивный', neutral: 'Нейтральный', negative: 'Негативный' };

const fmtDur = (sec: number | null) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h} ч ${String(m).padStart(2, '0')} мин` : `${m} мин`;
};
const fmtWhen = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtTs = (ms: number | null) => { if (ms == null) return ''; const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#1b2a4a] mb-1.5">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

/* ───────────── карточка встречи ───────────── */

function MeetingDetail({ id, types, onClose, onChanged }: { id: string; types: MeetingType[]; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<{ meeting: Meeting; segments: Segment[] } | null>(null);
  const [tab, setTab] = useState<'summary' | 'script' | 'transcript'>('summary');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/ai-sales/meetings/${id}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setData(j); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (body: { action: string } | { typeId: string | null }, text: string) => {
    setBusy(true); setMsg('');
    try {
      const isPatch = 'typeId' in body;
      const r = await fetch(`/api/ai-sales/meetings/${id}`, { method: isPatch ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      setMsg(r.ok ? text : (j.error || 'Ошибка'));
      if (r.ok) { onChanged(); load(); }
    } finally { setBusy(false); }
  };

  const m = data?.meeting;
  const a = m?.analysis ?? null;
  const steps = a?.scriptSteps ?? [];
  const stepRes = new Map((a?.script?.steps ?? []).map((s) => [s.key, s]));
  const nameOf = (label: string | null) => {
    const s = m?.speakers.find((x) => x.label === label);
    return s ? `${s.name || s.label}${ROLE_RU[s.role] ? ` · ${ROLE_RU[s.role]}` : ''}` : (label ?? 'Участник');
  };

  return (
    <Modal title={m?.title || 'Встреча'} onClose={onClose} maxWidth="max-w-4xl">
      {err && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{err}</div>}
      {!data && !err && <LoadingBlock />}
      {m && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS[m.status]?.tone ?? ''}`}>{STATUS[m.status]?.label ?? m.status}</span>
            <span>{fmtWhen(m.startedAt)}</span><span>· {fmtDur(m.durationSec)}</span>
            {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#029cda] hover:underline"><ExternalLink className="w-3.5 h-3.5" /> Запись в МТС Линк</a>}
          </div>
          {m.error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{m.error}</div>}

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-500">Тип встречи:</label>
            <select value={m.typeId ?? ''} disabled={busy} onChange={(e) => act({ typeId: e.target.value || null }, 'Тип изменён — анализ пересчитывается (1–2 минуты)')}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white">
              <option value="">Определить автоматически</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {m.typeSource === 'auto' && m.typeName && <span className="text-xs text-gray-400">определён автоматически: {m.typeName}</span>}
            <span className="ml-auto flex gap-2">
              <button type="button" disabled={busy} onClick={() => act({ action: 'reanalyze' }, 'Анализ поставлен в очередь')} className="px-3 py-2 rounded-xl text-sm border border-gray-300 text-gray-700 disabled:opacity-50">Пересчитать анализ</button>
              {(m.status === 'FAILED' || m.status === 'NEW') && <button type="button" disabled={busy} onClick={() => act({ action: 'retry' }, 'Обработка перезапущена')} className="px-3 py-2 rounded-xl text-sm bg-[#029cda] text-white disabled:opacity-50">Перезапустить</button>}
            </span>
          </div>
          {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-sm">{msg}</div>}

          <div className="flex gap-1 border-b border-gray-200">
            {([['summary', 'Саммари'], ['script', `Скрипт${m.scriptScore != null ? ` · ${m.scriptScore}%` : ''}`], ['transcript', 'Расшифровка']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 text-sm border-b-2 transition ${tab === k ? 'border-[#029cda] text-[#029cda] font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{l}</button>
            ))}
          </div>

          {tab === 'summary' && (
            a ? (
              <div className="space-y-4">
                {a.summary && <div className="whitespace-pre-wrap text-sm text-[#1b2a4a] leading-relaxed bg-[#F6F7F9] rounded-2xl p-4">{a.summary}</div>}
                {a.participants?.length ? (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1b2a4a] mb-1.5">Участники</h4>
                    <div className="flex flex-wrap gap-2">
                      {a.participants.map((p) => (
                        <span key={p.label} className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-sm text-gray-700">
                          {p.name || p.label}{ROLE_RU[p.role] ? ` · ${ROLE_RU[p.role]}` : ''} <b className="text-[#029cda]">{p.talkSharePct}%</b>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <List title="Темы" items={a.topics} />
                <List title="Принятые решения" items={a.decisions} />
                {a.actionItems?.filter((x) => x.what).length ? (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1b2a4a] mb-1.5">Задачи</h4>
                    <ul className="space-y-1.5">
                      {a.actionItems.filter((x) => x.what).map((x, i) => (
                        <li key={i} className="text-sm text-gray-700 rounded-xl border border-gray-100 px-3 py-2">
                          {x.what}{(x.who || x.due) && <span className="text-xs text-gray-400"> — {[x.who, x.due].filter(Boolean).join(', ')}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <List title="Потребности и боли клиента" items={a.needs} />
                {a.objections?.filter((x) => x.text).length ? (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1b2a4a] mb-1.5">Возражения</h4>
                    <ul className="space-y-1">{a.objections.filter((x) => x.text).map((x, i) => <li key={i} className="text-sm text-gray-700">{x.text}{x.handled != null && <span className={`ml-2 text-xs ${x.handled ? 'text-green-600' : 'text-red-600'}`}>{x.handled ? 'отработано' : 'не отработано'}</span>}</li>)}</ul>
                  </div>
                ) : null}
                <List title="Риски" items={a.risks} />
                <List title="Следующие шаги" items={a.nextSteps} />
                {(a.employeeFeedback?.didWell?.length || a.employeeFeedback?.improve?.length) ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <List title="Что получилось" items={a.employeeFeedback?.didWell} />
                    <List title="Что улучшить" items={a.employeeFeedback?.improve} />
                  </div>
                ) : null}
                {a.sentiment && <p className="text-xs text-gray-400">Тон встречи: {SENTIMENT_RU[a.sentiment]}</p>}
              </div>
            ) : <p className="text-sm text-gray-400 py-6 text-center">{m.status === 'COMPLETED' ? 'Анализа нет.' : 'Анализ появится после распознавания и обработки записи.'}</p>
          )}

          {tab === 'script' && (
            steps.length ? (
              <div className="space-y-2">
                {m.scriptScore != null && <p className="text-sm text-gray-600">Соблюдение скрипта: <b className="text-[#029cda]">{m.scriptScore}%</b></p>}
                {steps.map((s) => {
                  const r = stepRes.get(s.key);
                  return (
                    <div key={s.key} className="rounded-xl border border-gray-100 px-3 py-2.5 text-sm">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 size-5 shrink-0 rounded-full grid place-items-center text-[11px] text-white ${r?.completed === true ? 'bg-green-500' : r?.completed === false ? 'bg-red-500' : 'bg-gray-300'}`}>{r?.completed === true ? '✓' : r?.completed === false ? '✕' : '–'}</span>
                        <div className="min-w-0"><div className="text-[#1b2a4a]">{s.title}</div>{r?.evidence && <div className="text-xs text-gray-500 mt-0.5">{r.evidence}</div>}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-gray-400 py-6 text-center">Для этого типа встречи скрипт не задан (Настройка → Встречи).</p>
          )}

          {tab === 'transcript' && (
            data!.segments.length ? (
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {data!.segments.map((s) => (
                  <div key={s.idx} className="text-sm">
                    <span className="text-xs text-gray-400 mr-2">{fmtTs(s.startMs)}</span>
                    <span className={`font-medium mr-2 ${s.role === 'EMPLOYEE' ? 'text-[#029cda]' : 'text-[#1b2a4a]'}`}>{nameOf(s.speakerLabel)}:</span>
                    <span className="text-gray-700">{s.text}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400 py-6 text-center">Расшифровки пока нет.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ───────────── список ───────────── */

export default function MeetingsView() {
  const [items, setItems] = useState<Meeting[]>([]);
  const [types, setTypes] = useState<MeetingType[]>([]);
  const [total, setTotal] = useState(0);
  const [configured, setConfigured] = useState(true);
  const [status, setStatus] = useState('');
  const [typeId, setTypeId] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '100' });
      if (status) qs.set('status', status);
      if (typeId) qs.set('typeId', typeId);
      if (q.trim()) qs.set('q', q.trim());
      const r = await fetch(`/api/ai-sales/meetings?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setItems(j.items); setTotal(j.total); setTypes(j.types ?? []); setConfigured(j.configured !== false); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }, [status, typeId, q]);
  useEffect(() => { const t = setTimeout(() => load(), q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  // Пока есть встречи в обработке — обновляем список.
  const active = useMemo(() => items.some((m) => ['NEW', 'CONVERTING', 'TRANSCRIBING', 'TRANSCRIBED', 'ANALYZING'].includes(m.status)), [items]);
  useEffect(() => { if (!active) return; const t = setInterval(() => load(true), 20000); return () => clearInterval(t); }, [active, load]);

  const sync = async (days: number) => {
    setSyncing(true); setSyncMsg('');
    try {
      const r = await fetch('/api/ai-sales/meetings/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) });
      const j = await r.json();
      setSyncMsg(r.ok ? `Найдено записей: ${j.listed}, новых поставлено в обработку: ${j.added}` : (j.error || 'Ошибка'));
      if (r.ok) load(true);
    } finally { setSyncing(false); }
  };

  const chip = (on: boolean) => `px-3.5 py-1.5 rounded-full text-sm transition ${on ? 'bg-[#029cda] text-white' : 'bg-[#F6F7F9] text-gray-600 hover:bg-gray-100'}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button type="button" className={chip(!status)} onClick={() => setStatus('')}>Все</button>
        <button type="button" className={chip(status === 'COMPLETED')} onClick={() => setStatus(status === 'COMPLETED' ? '' : 'COMPLETED')}>Готовые</button>
        <button type="button" className={chip(status === 'FAILED')} onClick={() => setStatus(status === 'FAILED' ? '' : 'FAILED')}>С ошибкой</button>
        <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="px-3 py-1.5 rounded-full text-sm bg-[#F6F7F9] text-gray-600 border-0">
          <option value="">Все типы</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
          <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название или саммари" className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#F6F7F9] text-sm focus:outline-none focus:ring-2 focus:ring-[#029cda]/40" />
        </div>
        <button type="button" onClick={() => sync(14)} disabled={syncing || !configured} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-[#029cda] text-white hover:brightness-95 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Подтянуть из МТС Линк
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Записи ВКС из МТС Линк: звук распознаётся, участники делятся на сотрудников и клиентов, по каждой встрече — саммари, решения, задачи и соблюдение скрипта выбранного типа. Новые записи подтягиваются автоматически раз в 30 минут.</p>
      {syncMsg && <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-xl text-sm">{syncMsg}</div>}
      {!configured && (
        <div className="mb-4 p-4 bg-amber-50 text-amber-900 rounded-2xl text-sm">
          МТС Линк не подключён. Создайте ключ API в личном кабинете МТС Линк (раздел «API», тариф PRO и выше) и добавьте его на Vercel как <b>MTS_LINK_API_KEY</b>, затем перезапустите деплой.
        </div>
      )}
      {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{err}</div>}
      {loading ? <LoadingBlock /> : items.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Встреч пока нет. После подключения МТС Линк нажмите «Подтянуть из МТС Линк».</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setOpenId(m.id)} className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-white hover:border-[#029cda]/40 hover:bg-[#FAFDFF] transition text-left">
                  <span className="mt-0.5 shrink-0 size-9 rounded-xl bg-[#F6F7F9] grid place-items-center text-[#1b2a4a]"><Video className="w-4 h-4" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-[#1b2a4a] truncate">{m.title || `Встреча ${m.externalRecordId}`}</span>
                    <span className="block text-xs text-gray-400">{fmtWhen(m.startedAt)} · {fmtDur(m.durationSec)}{m.typeName ? ` · ${m.typeName}` : ''}</span>
                    {m.summary && <span className="block text-xs text-gray-500 mt-1 line-clamp-2">{m.summary}</span>}
                  </span>
                  {m.scriptScore != null && <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#029cda]/10 text-[#029cda] text-xs font-medium" title="Соблюдение скрипта">{m.scriptScore}%</span>}
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS[m.status]?.tone ?? ''}`}>{STATUS[m.status]?.label ?? m.status}</span>
                  <ChevronRight className="shrink-0 w-4 h-4 text-gray-300 mt-1" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 text-center mt-3">Показано: {items.length} из {total}</p>
        </>
      )}
      {openId && <MeetingDetail id={openId} types={types} onClose={() => setOpenId(null)} onChanged={() => load(true)} />}
    </div>
  );
}
