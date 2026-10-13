'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LoadingBlock } from '@/components/admin/ui/Spinner';
import type { KeywordRule } from '@/lib/keywordRules';

/* Ключевые слова в разговорах: клиент вышел на торги и т.п. — сигнал в ленте и личное сообщение РОПу в Bitrix. */

const input = 'px-3 py-2 rounded-xl border border-gray-300 text-sm w-full';

function newRule(): KeywordRule {
  return { id: `kw-${Date.now().toString(36)}`, name: 'Новое правило', enabled: true, phrases: [], speaker: 'any', severity: 'critical', notifyRop: true, notifyOwner: true, maxAgeHours: 72, action: '' };
}

export default function KeywordRulesSettings() {
  const [rules, setRules] = useState<KeywordRule[] | null>(null);
  const [text, setText] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState('7');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/ai-sales/keyword-rules');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setRules(j.rules);
      setText(Object.fromEntries((j.rules as KeywordRule[]).map((x) => [x.id, x.phrases.join('\n')])));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const payload = () => (rules ?? []).map((r) => ({ ...r, phrases: (text[r.id] ?? '').split('\n').map((x) => x.trim()).filter(Boolean) }));

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/ai-sales/keyword-rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: payload() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setMsg('Сохранено');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setBusy(false); }
  };

  const rescan = async () => {
    setBusy(true); setMsg('');
    try {
      const put = await fetch('/api/ai-sales/keyword-rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: payload() }) });
      if (!put.ok) throw new Error('Не удалось сохранить правила');
      const r = await fetch('/api/ai-sales/keyword-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: Number(days) || 7 }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setMsg(`Проверено разговоров: ${j.scanned} из ${j.total}, совпадений: ${j.hits}. Найденное — в «Сигналах».`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setBusy(false); }
  };

  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!rules) return <LoadingBlock />;
  const upd = (i: number, p: Partial<KeywordRule>) => setRules(rules.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        После расшифровки каждого разговора ищем заданные фразы. Найденное попадает в «Сигналы» и уходит личным сообщением в Bitrix РОПу (его ID — в «Настройках») и ответственному менеджеру.
        Слова пишите началом: «готов выход торг» найдёт «готовимся выходить на торги»; между словами допустимы 1–3 лишних слова. Одна фраза — одна строка.
      </p>
      {rules.map((r, i) => (
        <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input value={r.name} onChange={(e) => upd(i, { name: e.target.value })} className={`${input} font-medium`} />
            <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap"><input type="checkbox" checked={r.enabled} onChange={(e) => upd(i, { enabled: e.target.checked })} /> включено</label>
            <button type="button" onClick={() => setRules(rules.filter((_, j) => j !== i))} title="Удалить" className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
          <label className="block"><span className="block text-xs text-gray-500 mb-1">Фразы (по одной на строку)</span>
            <textarea rows={8} value={text[r.id] ?? ''} onChange={(e) => setText({ ...text, [r.id]: e.target.value })} className={`${input} font-mono`} /></label>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <label className="block"><span className="block text-xs text-gray-500 mb-1">Чьи слова</span>
              <select value={r.speaker} onChange={(e) => upd(i, { speaker: e.target.value as KeywordRule['speaker'] })} className={input}><option value="any">клиента и менеджера</option><option value="client">только клиента</option></select></label>
            <label className="block"><span className="block text-xs text-gray-500 mb-1">Важность сигнала</span>
              <select value={r.severity} onChange={(e) => upd(i, { severity: e.target.value as KeywordRule['severity'] })} className={input}><option value="critical">Критично</option><option value="risk">Риск</option><option value="opportunity">Возможность</option></select></label>
            <label className="block"><span className="block text-xs text-gray-500 mb-1">Сообщение, если звонок не старше (ч)</span>
              <input type="number" min={1} value={r.maxAgeHours} onChange={(e) => upd(i, { maxAgeHours: Number(e.target.value) || 72 })} className={input} /></label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={r.notifyRop} onChange={(e) => upd(i, { notifyRop: e.target.checked })} /> сообщение РОПу</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={r.notifyOwner} onChange={(e) => upd(i, { notifyOwner: e.target.checked })} /> сообщение ответственному менеджеру</label>
          </div>
          <label className="block"><span className="block text-xs text-gray-500 mb-1">Что сделать (текст в сообщении и в сигнале)</span>
            <input value={r.action} onChange={(e) => upd(i, { action: e.target.value })} className={input} /></label>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRules([...rules, newRule()])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"><Plus className="w-4 h-4" /> Правило</button>
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">Проверить прошлые разговоры за <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(e.target.value)} className="w-16 px-2 py-1.5 rounded-lg border border-gray-300 text-sm" /> дн.
          <button type="button" onClick={rescan} disabled={busy} className="px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50">Проверить</button></span>
        <button type="button" onClick={save} disabled={busy} className="ml-auto px-4 py-2 rounded-xl bg-[#1b2a4a] text-white text-sm disabled:opacity-50">Сохранить</button>
      </div>
      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </div>
  );
}
