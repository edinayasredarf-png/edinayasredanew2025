'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { LoadingBlock } from '@/components/admin/ui/Spinner';

/* Настройка встреч (МТС Линк): подключение, модель анализа и типы встреч — у каждого типа свой промт и свой скрипт (чек-лист). */

interface MType { id: string; name: string; description: string; keywords: string[]; prompt: string; steps: Array<{ key: string; title: string }>; isDefault: boolean }
interface Draft { id?: string; name: string; description: string; keywords: string; prompt: string; steps: string; isDefault: boolean }
const EMPTY: Draft = { name: '', description: '', keywords: '', prompt: '', steps: '', isDefault: false };

const input = 'px-3 py-2 rounded-xl border border-gray-300 text-sm w-full';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[#1b2a4a] mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

export default function MeetingTypesSettings() {
  const [types, setTypes] = useState<MType[] | null>(null);
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [conn, setConn] = useState<null | { ok: boolean; message?: string; found?: number; sample?: Array<{ id: string; name: string | null; startedAt: string | null; durationSec: number | null }> }>(null);
  const [connBusy, setConnBusy] = useState(false);
  const [days, setDays] = useState('30');
  const [syncMsg, setSyncMsg] = useState('');
  const [model, setModel] = useState('');
  const [minMin, setMinMin] = useState('2');
  const [autoSync, setAutoSync] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  const loadTypes = useCallback(async () => {
    try {
      const r = await fetch('/api/ai-sales/meetings/types');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setTypes(j.types); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, []);
  useEffect(() => { loadTypes(); }, [loadTypes]);
  useEffect(() => {
    fetch('/api/ai-sales/settings').then((r) => r.json()).then((j) => {
      const s = j.settings ?? {};
      setModel(String(s['ai.model.meeting'] ?? ''));
      if (s['meetings.minDurationSec'] != null) setMinMin(String(Math.round(Number(s['meetings.minDurationSec']) / 60)));
      setAutoSync(s['meetings.autoSync'] !== false);
    }).catch(() => {});
  }, []);

  const testConn = async () => {
    setConnBusy(true); setConn(null);
    try { const r = await fetch('/api/ai-sales/meetings/test'); setConn(await r.json()); }
    catch (e) { setConn({ ok: false, message: e instanceof Error ? e.message : 'Ошибка' }); }
    finally { setConnBusy(false); }
  };
  const syncNow = async () => {
    setConnBusy(true); setSyncMsg('');
    try {
      const r = await fetch('/api/ai-sales/meetings/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: Number(days) || 30 }) });
      const j = await r.json();
      setSyncMsg(r.ok ? `Найдено записей: ${j.listed}, новых поставлено в обработку: ${j.added}` : (j.error || 'Ошибка'));
    } finally { setConnBusy(false); }
  };
  const saveGeneral = async () => {
    setSaveMsg('');
    const r = await fetch('/api/ai-sales/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: { 'ai.model.meeting': model.trim(), 'meetings.minDurationSec': Math.max(0, Number(minMin) || 0) * 60, 'meetings.autoSync': autoSync } }) });
    const j = await r.json().catch(() => ({}));
    setSaveMsg(r.ok ? 'Сохранено' : (j.error || 'Ошибка'));
  };

  const edit = (t: MType) => setDraft({ id: t.id, name: t.name, description: t.description, keywords: t.keywords.join(', '), prompt: t.prompt, steps: t.steps.map((s) => s.title).join('\n'), isDefault: t.isDefault });
  const saveDraft = async () => {
    if (!draft) return;
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/ai-sales/meetings/types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, steps: draft.steps.split('\n') }) });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || 'Ошибка'); return; }
      setTypes(j.types); setDraft(null);
    } finally { setBusy(false); }
  };
  const remove = async (t: MType) => {
    if (!window.confirm(`Удалить тип «${t.name}»? Уже проанализированные встречи сохранят результат.`)) return;
    const r = await fetch(`/api/ai-sales/meetings/types?id=${t.id}`, { method: 'DELETE' });
    const j = await r.json();
    if (r.ok) setTypes(j.types);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Встречи (ВКС) из МТС Линк анализируются по типам: у каждого типа свой промт анализа и свой скрипт. Тип определяется автоматически (по названию встречи и содержанию) и меняется вручную в карточке встречи.</p>

      <section className="rounded-2xl bg-[#F6F7F9] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#1b2a4a]">Подключение к МТС Линк</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={testConn} disabled={connBusy} className="px-3 py-2 rounded-xl text-sm border border-gray-300 text-gray-700 hover:border-[#029cda] hover:text-[#029cda] disabled:opacity-50">Проверить подключение</button>
          <span className="text-sm text-gray-500">Подтянуть записи за</span>
          <input value={days} onChange={(e) => setDays(e.target.value)} type="number" min={1} max={365} className="w-20 px-3 py-2 rounded-xl border border-gray-300 text-sm" />
          <span className="text-sm text-gray-500">дн.</span>
          <button type="button" onClick={syncNow} disabled={connBusy} className="px-3 py-2 rounded-xl text-sm bg-[#029cda] text-white disabled:opacity-50">Подтянуть сейчас</button>
        </div>
        {conn && (
          <div className={`p-3 rounded-xl text-sm ${conn.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
            {conn.ok ? `Подключено. Найдено записей за 30 дней: ${conn.found}.` : (conn.message || 'Не удалось подключиться')}
            {conn.ok && conn.sample?.map((s) => <div key={s.id} className="text-xs mt-1">• {s.name || s.id}{s.durationSec ? ` · ${Math.round(s.durationSec / 60)} мин` : ''}</div>)}
          </div>
        )}
        {syncMsg && <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-sm">{syncMsg}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Модель анализа встреч" hint="Модель шлюза. Пусто — модель анализа звонков."><input value={model} onChange={(e) => setModel(e.target.value)} className={input} placeholder="(как модель анализа)" /></Field>
          <Field label="Не анализировать записи короче, мин" hint="Короткие тестовые и сорвавшиеся встречи пропускаются."><input value={minMin} onChange={(e) => setMinMin(e.target.value)} type="number" min={0} className={input} /></Field>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} /> подтягивать новые записи автоматически раз в 30 минут</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={saveGeneral} className="px-3 py-2 rounded-xl text-sm bg-[#1b2a4a] text-white">Сохранить</button>
          {saveMsg && <span className="text-sm text-gray-500">{saveMsg}</span>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1b2a4a]">Типы встреч, промты и скрипты</h3>
          <button type="button" onClick={() => setDraft({ ...EMPTY })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-[#029cda] text-white"><Plus className="w-4 h-4" /> Добавить тип</button>
        </div>
        {err && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{err}</div>}
        {!types ? <LoadingBlock /> : (
          <ul className="space-y-2">
            {types.map((t) => (
              <li key={t.id} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1b2a4a]">{t.name}{t.isDefault && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#029cda]/10 text-[#029cda] text-[11px]">по умолчанию</span>}</div>
                  <div className="text-xs text-gray-400">{t.description || '—'}</div>
                  <div className="text-xs text-gray-500 mt-1">Шагов скрипта: {t.steps.length}{t.keywords.length ? ` · ключевые слова: ${t.keywords.join(', ')}` : ''}</div>
                </div>
                <button type="button" onClick={() => edit(t)} title="Изменить" className="shrink-0 size-9 grid place-items-center rounded-xl border border-gray-200 text-gray-500 hover:text-[#029cda]"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => remove(t)} title="Удалить" className="shrink-0 size-9 grid place-items-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {draft && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={() => setDraft(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#1b2a4a]">{draft.id ? 'Тип встречи' : 'Новый тип встречи'}</h3>
            <Field label="Название"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} placeholder="например: Переговоры по пролонгации" /></Field>
            <Field label="Описание" hint="Подсказка модели при автоопределении типа."><input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={input} /></Field>
            <Field label="Ключевые слова названия (через запятую)" hint="Если встреча называется со словом из списка — тип выбирается сразу, без модели."><input value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} className={input} placeholder="демо, презентация, пролонгация" /></Field>
            <Field label="Промт анализа" hint="Что выделять и на что обращать внимание в этом типе встречи. Формат ответа (саммари, решения, задачи) добавляется автоматически."><textarea value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} rows={9} className={`${input} font-mono leading-relaxed`} /></Field>
            <Field label="Скрипт встречи (по шагу в строке)" hint="Чек-лист шагов: по каждому шагу ИИ отметит, выполнен ли он, и покажет подтверждение из расшифровки. Пусто — без оценки скрипта."><textarea value={draft.steps} onChange={(e) => setDraft({ ...draft, steps: e.target.value })} rows={6} className={input} placeholder={'Приветствие и повестка\nВыявление потребностей\nДемонстрация\nДоговорённость о следующем шаге'} /></Field>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} /> использовать по умолчанию, если тип определить не удалось</label>
            {msg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{msg}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm">Отмена</button>
              <button type="button" onClick={saveDraft} disabled={busy} className="px-4 py-2.5 rounded-xl bg-[#1b2a4a] text-white text-sm disabled:opacity-50">{busy ? 'Сохраняю…' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
