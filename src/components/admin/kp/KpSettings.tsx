'use client';

import React, { useState } from 'react';
import type { Organization, Tier, Executor } from './types';

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
  orgs, tiers, executors, serviceTypes, onChanged, setStatus,
}: {
  orgs: Organization[];
  tiers: Tier[];
  executors: Executor[];
  serviceTypes: string[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
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
