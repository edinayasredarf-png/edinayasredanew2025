'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import { LoadingBlock } from '@/components/admin/ui/Spinner';
import { BLOCKS, type NotifyRule, type NotifySource } from '@/lib/notifyBlocks';

/* Настройка личных сообщений в Bitrix: правила «кому, по каким менеджерам, когда и какие блоки разбора присылать». */

interface Mgr { bitrixUserId: string; name: string | null }

const input = 'px-3 py-2 rounded-xl border border-gray-300 text-sm w-full';
const SOURCE_LABEL: Record<NotifySource, string> = { call: 'Разбор звонка', deal: 'Анализ сделки' };

function newRule(source: NotifySource): NotifyRule {
  return {
    id: `rule-${Date.now().toString(36)}`, name: source === 'call' ? 'Новое правило по звонкам' : 'Новое правило по сделкам', enabled: true, source,
    recipients: { owner: true, managerIds: [], rop: false }, onlyManagers: null,
    blocks: source === 'call' ? ['summary', 'improve'] : ['dealSummary', 'nextBestAction'],
    conditions: { maxAgeHours: 48, temperatures: [], managerScoreBelow: null, dealScoreAtLeast: null, onlyConnected: true, skipTechnical: true },
  };
}

function MgrPicker({ mgrs, value, onChange }: { mgrs: Mgr[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {mgrs.map((m) => {
        const on = value.includes(m.bitrixUserId);
        return (
          <button key={m.bitrixUserId} type="button" onClick={() => onChange(on ? value.filter((x) => x !== m.bitrixUserId) : [...value, m.bitrixUserId])}
            className={`px-2.5 py-1 rounded-full text-xs border ${on ? 'bg-[#1b2a4a] text-white border-[#1b2a4a]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
            {m.name || `ID ${m.bitrixUserId}`}
          </button>
        );
      })}
      {!mgrs.length && <span className="text-xs text-gray-400">Список менеджеров пуст</span>}
    </div>
  );
}

function BlocksChecklist({ source, value, onChange }: { source: NotifySource; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
      {BLOCKS[source].map((b) => (
        <label key={b.key} className="flex items-start gap-1.5 text-sm text-gray-700" title={b.hint}>
          <input type="checkbox" className="mt-1" checked={value.includes(b.key)}
            onChange={(e) => onChange(e.target.checked ? [...value, b.key] : value.filter((k) => k !== b.key))} />
          <span>{b.title}<span className="block text-xs text-gray-400">{b.hint}</span></span>
        </label>
      ))}
    </div>
  );
}

function RuleCard({ rule, mgrs, onChange, onRemove }: { rule: NotifyRule; mgrs: Mgr[]; onChange: (r: NotifyRule) => void; onRemove: () => void }) {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const c = rule.conditions;
  const setC = (p: Partial<NotifyRule['conditions']>) => onChange({ ...rule, conditions: { ...c, ...p } });
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  // Для кого можно задать свой набор: менеджеры правила (или все, если «по всем») и дополнительные получатели.
  const personalIds = new Set<string>([...(rule.onlyManagers ?? mgrs.map((m) => m.bitrixUserId)), ...rule.recipients.managerIds, ...Object.keys(rule.managerBlocks ?? {})]);
  const personal = mgrs.filter((m) => personalIds.has(m.bitrixUserId));
  const setPersonal = (id: string, blocks: string[] | null) => {
    const next = { ...(rule.managerBlocks ?? {}) };
    if (blocks) next[id] = blocks; else delete next[id];
    onChange({ ...rule, managerBlocks: next });
  };

  const showPreview = async (target: NotifyRule = rule) => {
    setBusy(true); setPreview('');
    try {
      const r = await fetch('/api/ai-sales/notify-rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preview: target }) });
      const j = await r.json();
      setPreview(j.text || j.error || 'Нет данных');
    } finally { setBusy(false); }
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        <input value={rule.name} onChange={(e) => onChange({ ...rule, name: e.target.value })} className={`${input} font-medium`} />
        <span className="text-xs text-gray-500 whitespace-nowrap px-2 py-1 rounded-full bg-gray-100">{SOURCE_LABEL[rule.source]}</span>
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap">
          <input type="checkbox" checked={rule.enabled} onChange={(e) => onChange({ ...rule, enabled: e.target.checked })} /> включено
        </label>
        <button type="button" onClick={onRemove} title="Удалить правило" className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>

      <div>
        <div className="text-sm font-medium text-[#1b2a4a] mb-1">Кому отправлять</div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
          <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={rule.recipients.owner} onChange={(e) => onChange({ ...rule, recipients: { ...rule.recipients, owner: e.target.checked } })} /> ответственному менеджеру</label>
          <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={rule.recipients.rop} onChange={(e) => onChange({ ...rule, recipients: { ...rule.recipients, rop: e.target.checked } })} /> РОПу (из «Настроек»)</label>
        </div>
        <div className="text-xs text-gray-500 mb-1">Дополнительно этим сотрудникам:</div>
        <MgrPicker mgrs={mgrs} value={rule.recipients.managerIds} onChange={(v) => onChange({ ...rule, recipients: { ...rule.recipients, managerIds: v } })} />
      </div>

      <div>
        <div className="text-sm font-medium text-[#1b2a4a] mb-1">По каким менеджерам</div>
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 mb-2">
          <input type="checkbox" checked={rule.onlyManagers === null} onChange={(e) => onChange({ ...rule, onlyManagers: e.target.checked ? null : [] })} /> по всем менеджерам
        </label>
        {rule.onlyManagers !== null && <MgrPicker mgrs={mgrs} value={rule.onlyManagers} onChange={(v) => onChange({ ...rule, onlyManagers: v })} />}
      </div>

      <div>
        <div className="text-sm font-medium text-[#1b2a4a] mb-1">Что включить в сообщение — общий набор</div>
        <div className="text-xs text-gray-500 mb-2">Получают все, у кого ниже не задан свой набор.</div>
        <BlocksChecklist source={rule.source} value={rule.blocks} onChange={(v) => onChange({ ...rule, blocks: v })} />
      </div>

      <div>
        <div className="text-sm font-medium text-[#1b2a4a] mb-1">Индивидуально для сотрудников</div>
        <div className="text-xs text-gray-500 mb-2">Включите «свой набор» — этому человеку будут приходить только отмеченные блоки, остальным — общий набор.</div>
        <div className="space-y-2">
          {personal.map((m) => {
            const own = rule.managerBlocks?.[m.bitrixUserId];
            return (
              <div key={m.bitrixUserId} className={`rounded-xl border px-3 py-2 ${own ? 'border-[#1b2a4a]/40 bg-gray-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800 flex-1">{m.name || `ID ${m.bitrixUserId}`}</span>
                  <span className="text-xs text-gray-400">{own ? `свой набор: ${own.length}` : 'общий набор'}</span>
                  <label className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                    <input type="checkbox" checked={Boolean(own)} onChange={(e) => setPersonal(m.bitrixUserId, e.target.checked ? [...rule.blocks] : null)} /> свой набор
                  </label>
                </div>
                {own && (
                  <div className="mt-2 space-y-2">
                    <BlocksChecklist source={rule.source} value={own} onChange={(v) => setPersonal(m.bitrixUserId, v)} />
                    <button type="button" onClick={() => showPreview({ ...rule, blocks: own })} disabled={busy} className="inline-flex items-center gap-1.5 text-xs text-[#1b2a4a] hover:underline disabled:opacity-50">
                      <Eye className="w-3.5 h-3.5" /> Пример для этого сотрудника
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {!personal.length && <div className="text-xs text-gray-400">Выберите менеджеров выше — здесь появятся их индивидуальные наборы.</div>}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-[#1b2a4a] mb-1">Когда отправлять</div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <label className="block"><span className="block text-xs text-gray-500 mb-1">{rule.source === 'call' ? 'Звонок не старше (часов)' : 'Последний звонок не старше (часов)'}</span>
            <input type="number" min={1} value={c.maxAgeHours} onChange={(e) => setC({ maxAgeHours: Number(e.target.value) || 48 })} className={input} /></label>
          <label className="block"><span className="block text-xs text-gray-500 mb-1">Оценка менеджера не выше (0–10)</span>
            <input type="number" min={0} max={10} value={c.managerScoreBelow ?? ''} placeholder="не важно" onChange={(e) => setC({ managerScoreBelow: num(e.target.value) })} className={input} /></label>
          <label className="block"><span className="block text-xs text-gray-500 mb-1">Готовность к покупке не ниже (0–100)</span>
            <input type="number" min={0} max={100} value={c.dealScoreAtLeast ?? ''} placeholder="не важно" onChange={(e) => setC({ dealScoreAtLeast: num(e.target.value) })} className={input} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-700">
          <span className="text-xs text-gray-500">Температура:</span>
          {(['HOT', 'WARM', 'COLD'] as const).map((t) => (
            <label key={t} className="inline-flex items-center gap-1.5">
              <input type="checkbox" checked={c.temperatures.includes(t)} onChange={(e) => setC({ temperatures: e.target.checked ? [...c.temperatures, t] : c.temperatures.filter((x) => x !== t) })} />
              {t === 'HOT' ? 'горячая' : t === 'WARM' ? 'тёплая' : 'холодная'}
            </label>
          ))}
          <span className="text-xs text-gray-400">(ничего не отмечено — любая)</span>
        </div>
        {rule.source === 'call' && (
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={c.onlyConnected} onChange={(e) => setC({ onlyConnected: e.target.checked })} /> только состоявшиеся разговоры</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={c.skipTechnical} onChange={(e) => setC({ skipTechnical: e.target.checked })} /> пропускать технические звонки</label>
          </div>
        )}
      </div>

      <div>
        <button type="button" onClick={() => showPreview()} disabled={busy} className="inline-flex items-center gap-1.5 text-sm text-[#1b2a4a] hover:underline disabled:opacity-50">
          <Eye className="w-4 h-4" /> {busy ? 'Собираю…' : 'Посмотреть пример сообщения'}
        </button>
        {preview && <pre className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap font-sans">{preview}</pre>}
      </div>
    </div>
  );
}

export default function NotifyRulesSettings() {
  const [rules, setRules] = useState<NotifyRule[] | null>(null);
  const [mgrs, setMgrs] = useState<Mgr[]>([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([fetch('/api/ai-sales/notify-rules'), fetch('/api/ai-sales/managers/options')]);
      const ja = await a.json();
      if (!a.ok) throw new Error(ja.error || 'Ошибка');
      setRules(ja.rules);
      const jb = await b.json().catch(() => ({}));
      setMgrs(jb.items ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Ошибка'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!rules) return;
    setSaving(true); setMsg('');
    try {
      const r = await fetch('/api/ai-sales/notify-rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Ошибка');
      setRules(j.rules); setMsg('Сохранено');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!rules) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Личные сообщения в Bitrix24 с разбором звонков и сделок. Каждое правило отвечает на вопросы: кому, по каким менеджерам, при каких условиях и какие блоки анализа включить.
        Одно и то же сообщение одному человеку повторно не отправляется.
      </p>
      {rules.map((r, i) => (
        <RuleCard key={r.id} rule={r} mgrs={mgrs} onChange={(nr) => setRules(rules.map((x, j) => (j === i ? nr : x)))} onRemove={() => setRules(rules.filter((_, j) => j !== i))} />
      ))}
      {!rules.length && <div className="text-sm text-gray-400">Правил нет — личные сообщения не отправляются.</div>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRules([...rules, newRule('call')])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"><Plus className="w-4 h-4" /> Правило по звонкам</button>
        <button type="button" onClick={() => setRules([...rules, newRule('deal')])} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"><Plus className="w-4 h-4" /> Правило по сделкам</button>
        <button type="button" onClick={save} disabled={saving} className="ml-auto px-4 py-2 rounded-xl bg-[#1b2a4a] text-white text-sm disabled:opacity-50">{saving ? 'Сохраняю…' : 'Сохранить'}</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}
