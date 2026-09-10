'use client';

import React, { useState } from 'react';
import type { Organization, Tier, Executor, ServiceType, HeaderLayout, Alias, CalcTableDef, CalcColumn, ColKind } from './types';

const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';
const label = 'block text-xs font-medium text-gray-500 mb-1';
const num = 'w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda]';

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/uploads/image', { method: 'POST', body: fd, credentials: 'include' });
  const d = await res.json();
  if (!res.ok || !d.url) throw new Error(d.error || 'Ошибка загрузки картинки');
  return d.url as string;
}

function emptyOrg(sort: number): Organization {
  return {
    key: '', name: '', shortName: '', directorRole: 'Директор', directorFio: '',
    requisites: '', phone: '', email: '', headerImage: '', headerText: '',
    stampImage: '', signatureImage: '', writeKpNumber: true, mailAccountId: null,
    isActive: true, sortOrder: sort,
  };
}

export default function KpSettings({
  orgs, tiers, executors, serviceTypes, services, headerLayout, aliases, calcTables, onChanged, setStatus,
}: {
  orgs: Organization[];
  tiers: Tier[];
  executors: Executor[];
  serviceTypes: string[];
  services: ServiceType[];
  headerLayout: HeaderLayout;
  aliases: Alias[];
  calcTables: CalcTableDef[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      {/* Таблицы расчёта */}
      <TablesManager calcTables={calcTables} onChanged={onChanged} setStatus={setStatus} />

      {/* Шапка документа */}
      <HeaderLayoutEditor layout={headerLayout} onChanged={onChanged} setStatus={setStatus} />

      {/* Алиасы */}
      <AliasesManager aliases={aliases} onChanged={onChanged} setStatus={setStatus} />

      {/* Услуги */}
      <ServicesManager services={services} calcTables={calcTables} onChanged={onChanged} setStatus={setStatus} />
      {/* Компании */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#313131]">🏢 Компании (от кого КП)</h3>
          <button
            onClick={() => { setCreating(true); setEditKey(null); }}
            className="text-sm px-3 py-1.5 rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]"
          >
            + Добавить компанию
          </button>
        </div>

        {creating && (
          <OrgEditor
            org={emptyOrg(orgs.length + 1)}
            tiers={[]}
            serviceTypes={serviceTypes}
            isNew
            onClose={() => setCreating(false)}
            onSaved={() => { setCreating(false); onChanged(); }}
            setStatus={setStatus}
          />
        )}

        <div className="space-y-2">
          {orgs.map((o) => (
            <div key={o.key} className="bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-sm text-[#313131]">
                    {o.name} {!o.isActive && <span className="text-xs text-gray-400">(скрыта)</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    подписант: {o.directorRole} {o.directorFio || '—'} · номер письма: {o.writeKpNumber ? 'да' : 'нет'}
                  </div>
                </div>
                <button
                  onClick={() => { setEditKey(editKey === o.key ? null : o.key); setCreating(false); }}
                  className="text-sm text-[#029cda] hover:text-[#0280b5]"
                >
                  {editKey === o.key ? 'Свернуть' : 'Настроить'}
                </button>
              </div>
              {editKey === o.key && (
                <div className="border-t border-gray-100 p-4">
                  <OrgEditor
                    org={o}
                    tiers={tiers.filter((t) => t.orgKey === o.key)}
                    serviceTypes={serviceTypes}
                    onClose={() => setEditKey(null)}
                    onSaved={() => { setEditKey(null); onChanged(); }}
                    setStatus={setStatus}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Исполнители */}
      <ExecutorsManager executors={executors} onChanged={onChanged} setStatus={setStatus} />
    </div>
  );
}

/* ─────────── Редактор компании ─────────── */
function OrgEditor({
  org, tiers, serviceTypes, isNew, onClose, onSaved, setStatus,
}: {
  org: Organization;
  tiers: Tier[];
  serviceTypes: string[];
  isNew?: boolean;
  onClose: () => void;
  onSaved: () => void;
  setStatus: (s: string) => void;
}) {
  const [d, setD] = useState<Organization>(org);
  const [priceMap, setPriceMap] = useState<Record<string, Tier>>(() => {
    const m: Record<string, Tier> = {};
    for (const s of serviceTypes) {
      const t = tiers.find((x) => x.serviceType === s);
      m[s] = t || { orgKey: org.key, serviceType: s, pricePerHaDirect: 0, pricePerHaTender: 0, aisPrice: 0, renewalPerYear: 0, minHectares: 1 };
    }
    return m;
  });
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Organization>) => setD((x) => ({ ...x, ...patch }));
  const setPrice = (svc: string, patch: Partial<Tier>) =>
    setPriceMap((m) => ({ ...m, [svc]: { ...m[svc], ...patch } }));

  const pickImage = async (field: 'headerImage' | 'signatureImage' | 'stampImage', file?: File) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      set({ [field]: url } as Partial<Organization>);
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  const save = async () => {
    if (!d.key.trim() || !d.name.trim()) return setStatus('Укажите ключ и название компании');
    setBusy(true);
    try {
      const tiersArr = serviceTypes
        .map((s) => priceMap[s])
        .filter((t) => t.pricePerHaDirect || t.pricePerHaTender || t.aisPrice || t.renewalPerYear);
      const res = await fetch('/api/kp/organizations', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: d, tiers: tiersArr }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Ошибка сохранения');
      setStatus('Компания сохранена');
      onSaved();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm(`Удалить компанию «${d.name}»?`)) return;
    await fetch(`/api/kp/organizations?key=${encodeURIComponent(d.key)}`, { method: 'DELETE', credentials: 'include' });
    setStatus('Компания удалена');
    onSaved();
  };

  const imgRow = (field: 'headerImage' | 'signatureImage' | 'stampImage', title: string) => (
    <div>
      <div className={label}>{title}</div>
      <div className="flex items-center gap-2">
        {d[field] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d[field]} alt={title} className="h-12 object-contain border border-gray-200 rounded bg-[#F6F7F9]" />
        ) : (
          <span className="text-xs text-gray-400">не задано</span>
        )}
        <label className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 cursor-pointer">
          Загрузить
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(field, e.target.files?.[0])} />
        </label>
        {d[field] && (
          <button onClick={() => set({ [field]: '' } as Partial<Organization>)} className="text-xs text-red-500">убрать</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 bg-[#F6F7F9] rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className={label}>Ключ (латиница, уникальный) *</div>
          <input value={d.key} onChange={(e) => set({ key: e.target.value })} className={input} disabled={!isNew} placeholder="ekostroy" />
        </div>
        <div>
          <div className={label}>Короткое название *</div>
          <input value={d.shortName} onChange={(e) => set({ shortName: e.target.value })} className={input} placeholder="Экострой" />
        </div>
      </div>
      <div>
        <div className={label}>Полное название *</div>
        <input value={d.name} onChange={(e) => set({ name: e.target.value })} className={input} placeholder='ООО "Экострой"' />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className={label}>Должность подписанта</div>
          <input value={d.directorRole} onChange={(e) => set({ directorRole: e.target.value })} className={input} placeholder="Директор" />
        </div>
        <div>
          <div className={label}>ФИО подписанта</div>
          <input value={d.directorFio} onChange={(e) => set({ directorFio: e.target.value })} className={input} placeholder="Петров Пётр Петрович" />
        </div>
      </div>

      <div>
        <div className={label}>Текстовая шапка (алиас {'{{company_header}}'}, многострочно)</div>
        <textarea value={d.headerText} onChange={(e) => set({ headerText: e.target.value })} className={`${input} h-20`} placeholder={'ООО "Экострой"\nИНН 0000000000 · ОГРН …\nг. …, ул. …'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {imgRow('headerImage', 'Шапка-картинка {{company_header_image}}')}
        {imgRow('signatureImage', 'Подпись {{signature}}')}
        {imgRow('stampImage', 'Печать {{stamp}}')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className={label}>Телефон</div>
          <input value={d.phone} onChange={(e) => set({ phone: e.target.value })} className={input} />
        </div>
        <div>
          <div className={label}>E-mail</div>
          <input value={d.email} onChange={(e) => set({ email: e.target.value })} className={input} />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
            <input type="checkbox" checked={d.writeKpNumber} onChange={(e) => set({ writeKpNumber: e.target.checked })} />
            Писать номер КП/письма
          </label>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
        <input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
        Активна (показывать в выборе)
      </label>

      {/* Цены по услугам */}
      <div>
        <div className="text-sm font-semibold text-[#313131] mb-2">💰 Цены по услугам</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-1">Услуга</th>
                <th className="pb-1">₽/га прямой</th>
                <th className="pb-1">₽/га торги</th>
                <th className="pb-1">АИС, ₽</th>
                <th className="pb-1">Пролонг./год, ₽</th>
              </tr>
            </thead>
            <tbody>
              {serviceTypes.map((s) => (
                <tr key={s}>
                  <td className="py-1 pr-2 text-[#313131]">{s}</td>
                  <td className="py-1 pr-1"><input className={num} inputMode="decimal" value={priceMap[s]?.pricePerHaDirect || ''} onChange={(e) => setPrice(s, { pricePerHaDirect: Number(e.target.value) || 0 })} /></td>
                  <td className="py-1 pr-1"><input className={num} inputMode="decimal" value={priceMap[s]?.pricePerHaTender || ''} onChange={(e) => setPrice(s, { pricePerHaTender: Number(e.target.value) || 0 })} /></td>
                  <td className="py-1 pr-1"><input className={num} inputMode="decimal" value={priceMap[s]?.aisPrice || ''} onChange={(e) => setPrice(s, { aisPrice: Number(e.target.value) || 0 })} /></td>
                  <td className="py-1 pr-1"><input className={num} inputMode="decimal" value={priceMap[s]?.renewalPerYear || ''} onChange={(e) => setPrice(s, { renewalPerYear: Number(e.target.value) || 0 })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50">
          {busy ? 'Сохранение…' : 'Сохранить компанию'}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">Отмена</button>
        {!isNew && <button onClick={del} className="ml-auto px-4 py-2 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Удалить</button>}
      </div>
    </div>
  );
}

/* ─────────── Шапка документа ─────────── */
function HeaderLayoutEditor({
  layout, onChanged, setStatus,
}: {
  layout: HeaderLayout;
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [left, setLeft] = useState((layout.left || []).join('\n'));
  const [center, setCenter] = useState((layout.center || []).join('\n'));
  const [right, setRight] = useState((layout.right || []).join('\n'));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const toLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
      const res = await fetch('/api/kp/header', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: { left: toLines(left), center: toLines(center), right: toLines(right) } }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Ошибка');
      setStatus('Шапка сохранена');
      onChanged();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const ta = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda] h-24 font-mono';

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#313131] mb-2">🧷 Шапка документа (общая для всех шаблонов)</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="text-xs text-gray-500">
          По одной строке — один элемент. Можно использовать алиасы, напр. <code>{'№ {{kp_number}}'}</code>.
          Левый блок печатается слева, правый — справа, по центру — над ними.
          Добавляется автоматически ко всем шаблонам (кроме отмеченных «уже содержит шапку»).
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className={label}>Слева</div>
            <textarea value={left} onChange={(e) => setLeft(e.target.value)} className={ta} placeholder={'№ {{kp_number}}\nот {{kp_date}}'} />
          </div>
          <div>
            <div className={label}>По центру</div>
            <textarea value={center} onChange={(e) => setCenter(e.target.value)} className={ta} placeholder={'(например, {{company_header}})'} />
          </div>
          <div>
            <div className={label}>Справа</div>
            <textarea value={right} onChange={(e) => setRight(e.target.value)} className={ta} placeholder={'{{client_org_full}}\n{{client_fio_short}}'} />
          </div>
        </div>
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50">
          {busy ? 'Сохранение…' : 'Сохранить шапку'}
        </button>
      </div>
    </div>
  );
}

/* ─────────── Алиасы ─────────── */
function AliasesManager({
  aliases, onChanged, setStatus,
}: {
  aliases: Alias[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabelText] = useState('');
  const [value, setValue] = useState('');

  const builtins = aliases.filter((a) => !a.isCustom);
  const customs = aliases.filter((a) => a.isCustom);

  const add = async () => {
    if (!key.trim()) return setStatus('Укажите ключ алиаса');
    const res = await fetch('/api/kp/aliases', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, label, value }),
    });
    const j = await res.json();
    if (!res.ok) return setStatus(j.error || 'Ошибка');
    setKey(''); setLabelText(''); setValue('');
    setStatus('Алиас сохранён');
    onChanged();
  };

  const del = async (k: string) => {
    await fetch(`/api/kp/aliases?key=${encodeURIComponent(k)}`, { method: 'DELETE', credentials: 'include' });
    onChanged();
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#313131] mb-2">🏷 Алиасы (плейсхолдеры)</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input className={input} placeholder="ключ (латиница): my_note" value={key} onChange={(e) => setKey(e.target.value)} />
          <input className={input} placeholder="описание" value={label} onChange={(e) => setLabelText(e.target.value)} />
          <input className={input} placeholder="значение (текст)" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <button onClick={add} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">+ Создать алиас</button>

        {customs.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Свои алиасы</div>
            {customs.map((a) => (
              <div key={a.key} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="text-sm text-[#313131]"><code className="font-mono">{`{{${a.key}}}`}</code> — {a.label || '—'} <span className="text-gray-400">= «{a.value}»</span></div>
                <button onClick={() => del(a.key)} className="text-sm text-red-500">Удалить</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setOpen((v) => !v)} className="text-sm text-[#029cda]">
          {open ? 'Скрыть' : 'Показать'} встроенные алиасы ({builtins.length})
        </button>
        {open && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
            {builtins.map((a) => (
              <div key={a.key} className="flex justify-between gap-2">
                <code className="font-mono">{`{{${a.key}}}`}</code>
                <span className="text-gray-400 text-right">{a.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Таблицы расчёта ─────────── */
const KIND_LABELS: Record<ColKind, string> = {
  index: '№', text: 'Текст', number: 'Число', const: 'Константа', formula: 'Формула',
};

function slugKeyClient(s: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return s.toLowerCase().split('').map((c) => (c in map ? map[c] : c)).join('')
    .replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
}

function TablesManager({
  calcTables, onChanged, setStatus,
}: {
  calcTables: CalcTableDef[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const emptyTable = (): CalcTableDef => ({
    key: '', name: '', isActive: true, sortOrder: calcTables.length + 1,
    columns: [
      { key: 'idx', label: '№', kind: 'index', align: 'center' },
      { key: 'name', label: 'Наименование', kind: 'text', align: 'left' },
    ],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#313131]">📊 Таблицы расчёта (шаблоны)</h3>
        <button onClick={() => { setCreating(true); setEditKey(null); }} className="text-sm px-3 py-1.5 rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">+ Новая таблица</button>
      </div>

      {creating && (
        <TableEditor table={emptyTable()} isNew onClose={() => setCreating(false)} onSaved={() => { setCreating(false); onChanged(); }} setStatus={setStatus} />
      )}

      <div className="space-y-2">
        {calcTables.map((t) => (
          <div key={t.key} className="bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-sm text-[#313131]">{t.name} <code className="font-mono text-xs text-gray-400">{`{{${t.key}}}`}</code></div>
                <div className="text-xs text-gray-400">{t.columns.length} колонок: {t.columns.map((c) => c.label).join(', ')}</div>
              </div>
              <button onClick={() => { setEditKey(editKey === t.key ? null : t.key); setCreating(false); }} className="text-sm text-[#029cda]">{editKey === t.key ? 'Свернуть' : 'Настроить'}</button>
            </div>
            {editKey === t.key && (
              <div className="border-t border-gray-100 p-4">
                <TableEditor table={t} onClose={() => setEditKey(null)} onSaved={() => { setEditKey(null); onChanged(); }} setStatus={setStatus} />
              </div>
            )}
          </div>
        ))}
        {calcTables.length === 0 && <div className="text-sm text-gray-400">Таблиц пока нет.</div>}
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Каждая таблица имеет алиас <code className="font-mono">{'{{ключ}}'}</code> — вставьте его в Word-шаблон, туда подставится таблица.
        В формулах колонок доступны: значения числовых колонок (по их ключу), <code>price</code>, <code>price_direct</code>, <code>price_tender</code>, <code>min_ha</code>, <code>row_index</code>.
      </div>
    </div>
  );
}

function TableEditor({
  table, isNew, onClose, onSaved, setStatus,
}: {
  table: CalcTableDef;
  isNew?: boolean;
  onClose: () => void;
  onSaved: () => void;
  setStatus: (s: string) => void;
}) {
  const [name, setName] = useState(table.name);
  const [key, setKey] = useState(table.key);
  const [cols, setCols] = useState<CalcColumn[]>(table.columns);
  const [busy, setBusy] = useState(false);

  const upd = (i: number, patch: Partial<CalcColumn>) => setCols((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cols.length) return;
    setCols((cs) => { const a = [...cs]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  };
  const del = (i: number) => setCols((cs) => cs.filter((_, j) => j !== i));
  const addCol = () => setCols((cs) => [...cs, { key: '', label: '', kind: 'text', align: 'left' }]);

  const save = async () => {
    const k = (key || slugKeyClient(name)).trim();
    if (!k || !name.trim()) return setStatus('Укажите название и ключ таблицы');
    // проставим ключи колонок
    const used = new Set<string>();
    const finalCols = cols.map((c) => {
      let ck = c.key?.trim() || slugKeyClient(c.label) || 'col';
      while (used.has(ck)) ck = ck + '_2';
      used.add(ck);
      return { ...c, key: ck };
    });
    setBusy(true);
    try {
      const res = await fetch('/api/kp/tables', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: k, name, columns: finalCols }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Ошибка');
      setStatus('Таблица сохранена');
      onSaved();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Удалить таблицу «${table.name}»?`)) return;
    await fetch(`/api/kp/tables?key=${encodeURIComponent(table.key)}`, { method: 'DELETE', credentials: 'include' });
    setStatus('Таблица удалена');
    onSaved();
  };

  const inp = 'px-2 py-1.5 rounded-md border border-gray-200 text-sm outline-none focus:border-[#029cda] bg-white';

  return (
    <div className="space-y-3 bg-[#F6F7F9] rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className={label}>Название таблицы *</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${input}`} placeholder="Расчёт по территориям" />
        </div>
        <div>
          <div className={label}>Ключ-алиас (латиница) {isNew ? '' : '— не меняется'}</div>
          <input value={key} onChange={(e) => setKey(e.target.value)} className={`${input}`} disabled={!isNew} placeholder="raschet" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="pb-1 pr-2">Заголовок</th>
              <th className="pb-1 pr-2">Тип</th>
              <th className="pb-1 pr-2">Ключ/переменная</th>
              <th className="pb-1 pr-2">Формула / константа</th>
              <th className="pb-1 pr-2">Σ</th>
              <th className="pb-1 pr-2">Стоим.</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {cols.map((c, i) => (
              <tr key={i}>
                <td className="py-0.5 pr-2"><input value={c.label} onChange={(e) => upd(i, { label: e.target.value })} className={`${inp} w-40`} /></td>
                <td className="py-0.5 pr-2">
                  <select value={c.kind} onChange={(e) => upd(i, { kind: e.target.value as ColKind })} className={inp}>
                    {(Object.keys(KIND_LABELS) as ColKind[]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
                  </select>
                </td>
                <td className="py-0.5 pr-2"><input value={c.key} onChange={(e) => upd(i, { key: e.target.value })} className={`${inp} w-28 font-mono text-xs`} placeholder="auto" /></td>
                <td className="py-0.5 pr-2">
                  {c.kind === 'formula' ? (
                    <input value={c.formula || ''} onChange={(e) => upd(i, { formula: e.target.value })} className={`${inp} w-64 font-mono text-xs`} placeholder="max(area_sqm/10000, min_ha) * price" />
                  ) : c.kind === 'const' ? (
                    <input value={c.constValue || ''} onChange={(e) => upd(i, { constValue: e.target.value })} className={`${inp} w-40`} placeholder="напр. шт." />
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="py-0.5 pr-2 text-center"><input type="checkbox" checked={!!c.sum} onChange={(e) => upd(i, { sum: e.target.checked })} /></td>
                <td className="py-0.5 pr-2 text-center"><input type="checkbox" checked={!!c.isCost} onChange={(e) => upd(i, { isCost: e.target.checked, money: e.target.checked || c.money })} title="колонка стоимости услуги" /></td>
                <td className="py-0.5 whitespace-nowrap text-gray-400">
                  <button onClick={() => move(i, -1)} className="hover:text-[#029cda] px-1">↑</button>
                  <button onClick={() => move(i, 1)} className="hover:text-[#029cda] px-1">↓</button>
                  <button onClick={() => del(i)} className="hover:text-red-500 px-1">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addCol} className="text-sm text-[#029cda]">+ Колонка</button>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50">{busy ? 'Сохранение…' : 'Сохранить таблицу'}</button>
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50">Отмена</button>
        {!isNew && <button onClick={remove} className="ml-auto px-4 py-2 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Удалить</button>}
      </div>
      <div className="text-xs text-gray-400">«Σ» — суммировать колонку в строке ИТОГО. «Стоим.» — это колонка стоимости услуги (её сумма идёт в итог КП и в матрицу организаций).</div>
    </div>
  );
}

/* ─────────── Услуги ─────────── */
function ServicesManager({
  services, calcTables, onChanged, setStatus,
}: {
  services: ServiceType[];
  calcTables: CalcTableDef[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});

  const setDefaultTable = async (name: string, defaultTable: string) => {
    await fetch('/api/kp/services', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, defaultTable }),
    });
    setStatus('Таблица услуги обновлена');
    onChanged();
  };

  const add = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/kp/services', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const j = await res.json();
    if (!res.ok) return setStatus(j.error || 'Ошибка');
    setNewName('');
    setStatus('Услуга добавлена');
    onChanged();
  };

  const rename = async (oldName: string) => {
    const nn = (edits[oldName] ?? '').trim();
    if (!nn || nn === oldName) return;
    await fetch('/api/kp/services', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName: nn }),
    });
    setEdits((m) => { const c = { ...m }; delete c[oldName]; return c; });
    setStatus('Услуга переименована');
    onChanged();
  };

  const toggle = async (name: string, isActive: boolean) => {
    await fetch('/api/kp/services', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isActive }),
    });
    onChanged();
  };

  const del = async (name: string) => {
    if (!confirm(`Удалить услугу «${name}»? Цены компаний по ней останутся, но услуга скроется.`)) return;
    await fetch(`/api/kp/services?name=${encodeURIComponent(name)}`, { method: 'DELETE', credentials: 'include' });
    setStatus('Услуга удалена');
    onChanged();
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#313131] mb-2">🧾 Услуги</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input className={input} placeholder="Новая услуга (например, ОКС)" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button onClick={add} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5] whitespace-nowrap">+ Добавить</button>
        </div>
        <div className="space-y-1">
          {services.map((s) => (
            <div key={s.name} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <input
                className={`${input} flex-1`}
                value={edits[s.name] ?? s.name}
                onChange={(e) => setEdits((m) => ({ ...m, [s.name]: e.target.value }))}
              />
              {(edits[s.name] ?? s.name) !== s.name && (
                <button onClick={() => rename(s.name)} className="text-sm text-[#16a34a] whitespace-nowrap">Сохранить</button>
              )}
              <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                таблица:
                <select
                  value={s.defaultTable}
                  onChange={(e) => setDefaultTable(s.name, e.target.value)}
                  className="px-2 py-1 rounded border border-gray-200 text-xs bg-white"
                >
                  <option value="">— без таблицы —</option>
                  {calcTables.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={s.isActive} onChange={(e) => toggle(s.name, e.target.checked)} />
                активна
              </label>
              <button onClick={() => del(s.name)} className="text-sm text-red-500 whitespace-nowrap">Удалить</button>
            </div>
          ))}
          {services.length === 0 && <div className="text-sm text-gray-400">Услуг пока нет.</div>}
        </div>
        <div className="text-xs text-gray-400">Список услуг общий; цены по каждой услуге — в карточке компании; формула стоимости — в колонке таблицы расчёта (см. «Таблицы расчёта» выше).</div>
      </div>
    </div>
  );
}

/* ─────────── Исполнители ─────────── */
function ExecutorsManager({
  executors, onChanged, setStatus,
}: {
  executors: Executor[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [draft, setDraft] = useState<Partial<Executor>>({ fio: '', phone: '', email: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const save = async () => {
    if (!draft.fio?.trim()) return setStatus('Укажите ФИО исполнителя');
    const res = await fetch('/api/kp/executors', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, id: editId || undefined }),
    });
    const j = await res.json();
    if (!res.ok) return setStatus(j.error || 'Ошибка');
    setDraft({ fio: '', phone: '', email: '' });
    setEditId(null);
    setStatus('Исполнитель сохранён');
    onChanged();
  };

  const del = async (id: number) => {
    if (!confirm('Удалить исполнителя?')) return;
    await fetch(`/api/kp/executors?id=${id}`, { method: 'DELETE', credentials: 'include' });
    onChanged();
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#313131] mb-2">👥 Исполнители (менеджеры)</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input className={input} placeholder="ФИО *" value={draft.fio || ''} onChange={(e) => setDraft({ ...draft, fio: e.target.value })} />
          <input className={input} placeholder="Телефон" value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <input className={input} placeholder="E-mail" value={draft.email || ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">{editId ? 'Сохранить' : 'Добавить'}</button>
          {editId && <button onClick={() => { setEditId(null); setDraft({ fio: '', phone: '', email: '' }); }} className="px-4 py-2 text-sm rounded-lg border border-gray-200">Отмена</button>}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {executors.map((e) => (
          <div key={e.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
            <div className="text-sm text-[#313131]">{e.fio} <span className="text-xs text-gray-400">{e.phone} {e.email}</span></div>
            <div className="flex gap-3">
              <button onClick={() => { setEditId(e.id); setDraft(e); }} className="text-sm text-[#029cda]">Изменить</button>
              <button onClick={() => del(e.id)} className="text-sm text-red-500">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
