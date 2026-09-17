'use client';

import React, { useState } from 'react';
import { Spinner } from '@/components/admin/ui/Spinner';
import type { Organization, Executor, ServiceType, ServiceLineItem, HeaderLayout, Alias, CalcTableDef, CalcColumn, ColKind } from './types';

const input = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#029cda] focus:ring-2 focus:ring-[#029cda]/15';
const label = 'block text-xs font-medium text-gray-500 mb-1';

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
    mailAccountKey: '', mailSubject: '', mailBody: '', isActive: true, sortOrder: sort,
  };
}

export default function KpSettings({
  orgs, executors, services, positions, headerLayout, aliases, calcTables, onChanged, setStatus,
}: {
  orgs: Organization[];
  executors: Executor[];
  services: ServiceType[];
  positions: string[];
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
      {/* Должности клиента */}
      <PositionsManager positions={positions} onChanged={onChanged} setStatus={setStatus} />
      {/* Компании */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#313131]">Компании (от кого КП)</h3>
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
      {/* Ящики для рассылки */}
      <MailAccountsManager setStatus={setStatus} />
      {/* Библиотека вложений */}
      <MailAttachmentsManager setStatus={setStatus} />
    </div>
  );
}

/* ─────────── Библиотека вложений для рассылки ─────────── */
interface AttachMeta { id: number; name: string; filename: string; mime: string; sizeBytes: number; createdAt: string }
function fmtBytes(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} КБ`;
  return `${(n / 1024 / 1024).toFixed(1)} МБ`;
}
function MailAttachmentsManager({ setStatus }: { setStatus: (s: string) => void }) {
  const [items, setItems] = useState<AttachMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/kp/attachments', { credentials: 'include' });
      const d = await res.json();
      if (res.ok) setItems(d.attachments || []);
    } catch { /* ignore */ }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        fd.append('name', f.name);
        const res = await fetch('/api/kp/attachments', { method: 'POST', credentials: 'include', body: fd });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Ошибка загрузки'); }
      }
      setStatus('Файлы добавлены в библиотеку');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e) { setStatus((e as Error).message); } finally { setBusy(false); }
  };
  const del = async (id: number) => {
    if (!confirm('Удалить файл из библиотеки?')) return;
    await fetch(`/api/kp/attachments?id=${id}`, { method: 'DELETE', credentials: 'include' });
    setStatus('Файл удалён');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#313131]">Библиотека вложений</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-sm text-[#029cda]">{open ? 'Свернуть' : 'Показать'}</button>
      </div>
      {open && (
        <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" multiple onChange={(e) => upload(e.target.files)} className="text-sm" />
            {busy && <Spinner size={16} />}
          </div>
          <div className="space-y-1">
            {items.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="text-sm text-[#313131] min-w-0">
                  <div className="truncate">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.filename} · {fmtBytes(a.sizeBytes)}</div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <a href={`/api/kp/attachments?id=${a.id}`} className="text-sm text-[#029cda]">Скачать</a>
                  <button onClick={() => del(a.id)} className="text-sm text-red-500">Удалить</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-gray-400">Библиотека пуста. Загрузите прайсы, презентации — их можно приложить к письму галочкой при рассылке.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Почтовые ящики для рассылки (общие с модулем «Письма») ─────────── */
interface MailAcc {
  id: string; label: string; from_name: string; from_email: string;
  smtp_host: string; smtp_port: number; smtp_secure: boolean; smtp_user: string;
  enabled: boolean; has_password: boolean;
}
function emptyMailAcc(): Partial<MailAcc> & { password?: string } {
  return { label: '', from_name: '', from_email: '', smtp_host: '', smtp_port: 465, smtp_secure: true, smtp_user: '', enabled: true, password: '' };
}
function MailAccountsManager({ setStatus }: { setStatus: (s: string) => void }) {
  const [accounts, setAccounts] = useState<MailAcc[]>([]);
  const [secretOk, setSecretOk] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<(Partial<MailAcc> & { password?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/letters/accounts', { credentials: 'include' });
      const d = await res.json();
      if (res.ok) { setAccounts(d.accounts || []); setSecretOk(Boolean(d.secretConfigured)); }
    } catch { /* ignore */ }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const test = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const res = await fetch('/api/letters/accounts', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, ...draft }),
      });
      const d = await res.json();
      setStatus(d.verified ? '✅ Подключение успешно' : `⚠️ ${d.error || 'Не удалось подключиться'}`);
    } catch (e) { setStatus((e as Error).message); } finally { setBusy(false); }
  };
  const save = async () => {
    if (!draft) return;
    if (!draft.from_email?.trim() || !draft.smtp_host?.trim() || !draft.smtp_user?.trim()) return setStatus('Заполните адрес, хост и логин');
    setBusy(true);
    try {
      const res = await fetch('/api/letters/accounts', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Ошибка');
      setStatus('Ящик сохранён');
      setDraft(null);
      load();
    } catch (e) { setStatus((e as Error).message); } finally { setBusy(false); }
  };
  const del = async (id: string) => {
    if (!confirm('Удалить ящик?')) return;
    await fetch(`/api/letters/accounts?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    setStatus('Ящик удалён');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#313131]">Ящики для рассылки</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-sm text-[#029cda]">{open ? 'Свернуть' : 'Показать'}</button>
      </div>
      {open && (
        <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
          {!secretOk && (
            <div className="text-xs bg-[#FFF7ED] border border-[#fed7aa] text-[#9a3412] rounded-lg px-3 py-2">
              Не задан ключ шифрования (MAIL_SECRET_KEY или AUTH_SESSION_SECRET) — сохранить пароль ящика не получится. Проверка соединения работает.
            </div>
          )}
          <div className="space-y-1">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="text-sm text-[#313131]">
                  {a.label || a.from_email} <span className="text-xs text-gray-400">{a.from_email} · {a.smtp_host}:{a.smtp_port}{a.has_password ? '' : ' · без пароля'}{a.enabled ? '' : ' · выкл'}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setDraft({ ...a, password: '' })} className="text-sm text-[#029cda]">Изменить</button>
                  <button onClick={() => del(a.id)} className="text-sm text-red-500">Удалить</button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && <div className="text-sm text-gray-400">Ящиков пока нет. Добавьте — и выбирайте в карточке компании и при рассылке.</div>}
          </div>
          {!draft ? (
            <button onClick={() => setDraft(emptyMailAcc())} className="text-sm px-4 py-2 rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">+ Добавить ящик</button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={input} placeholder="Название (напр. Экострой)" value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                <input className={input} placeholder="Имя отправителя" value={draft.from_name || ''} onChange={(e) => setDraft({ ...draft, from_name: e.target.value })} />
                <input className={input} placeholder="E-mail отправителя *" value={draft.from_email || ''} onChange={(e) => setDraft({ ...draft, from_email: e.target.value })} />
                <input className={input} placeholder="SMTP-хост * (напр. smtp.timeweb.ru)" value={draft.smtp_host || ''} onChange={(e) => setDraft({ ...draft, smtp_host: e.target.value })} />
                <input className={input} placeholder="Порт" inputMode="numeric" value={draft.smtp_port ?? 465} onChange={(e) => setDraft({ ...draft, smtp_port: Number(e.target.value) || 465 })} />
                <input className={input} placeholder="SMTP-логин *" value={draft.smtp_user || ''} onChange={(e) => setDraft({ ...draft, smtp_user: e.target.value })} />
                <input className={input} type="password" placeholder={draft.id && (draft as MailAcc).has_password ? 'Пароль (оставьте пустым — не менять)' : 'Пароль SMTP'} value={draft.password || ''} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
                <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer"><input type="checkbox" checked={draft.smtp_secure ?? true} onChange={(e) => setDraft({ ...draft, smtp_secure: e.target.checked })} /> SSL/TLS (порт 465)</label>
                <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer"><input type="checkbox" checked={draft.enabled ?? true} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Включён</label>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50 inline-flex items-center gap-2">{busy && <Spinner size={16} color="#fff" />}Сохранить</button>
                <button onClick={test} disabled={busy} className="px-4 py-2 text-sm rounded-lg border border-[#029cda] text-[#029cda] hover:bg-[#EAF6FC] disabled:opacity-50">Проверить соединение</button>
                <button onClick={() => setDraft(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200">Отмена</button>
              </div>
            </div>
          )}
          <div className="text-[11px] text-gray-400">Ящики общие с разделом «Письма». Выбираются в карточке компании (рассылка от организации) и при отправке КП.</div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Редактор компании ─────────── */
function OrgEditor({
  org, isNew, onClose, onSaved, setStatus,
}: {
  org: Organization;
  isNew?: boolean;
  onClose: () => void;
  onSaved: () => void;
  setStatus: (s: string) => void;
}) {
  const [d, setD] = useState<Organization>(org);
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; label: string; from_email: string }>>([]);
  const set = (patch: Partial<Organization>) => setD((x) => ({ ...x, ...patch }));

  React.useEffect(() => {
    fetch('/api/letters/accounts', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.accounts) setAccounts(j.accounts.filter((a: { enabled?: boolean }) => a.enabled)); })
      .catch(() => {});
  }, []);

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
      // Цены редактируются в отдельной вкладке «Цены»; здесь их не трогаем.
      const res = await fetch('/api/kp/organizations', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: d, tiers: [] }),
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

      <div>
        <div className={label}>Ящик для рассылки (от этой организации)</div>
        <select value={d.mailAccountKey || ''} onChange={(e) => set({ mailAccountKey: e.target.value })} className={input}>
          <option value="">Основной (по умолчанию)</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.label} ({a.from_email})</option>)}
        </select>
        <div className="text-[11px] text-gray-400 mt-1">Используется при рассылке «от каждой организации отдельно».</div>
      </div>

      <div>
        <div className={label}>Тема письма при рассылке (пусто = общая)</div>
        <input value={d.mailSubject || ''} onChange={(e) => set({ mailSubject: e.target.value })} className={input} placeholder="Коммерческое предложение — АИС «Единая среда»" />
      </div>
      <div>
        <div className={label}>Текст письма при рассылке (пусто = общий)</div>
        <textarea value={d.mailBody || ''} onChange={(e) => set({ mailBody: e.target.value })} className={`${input} h-24`} placeholder={'Здравствуйте!\n\nНаправляем коммерческое предложение во вложении…'} />
        <div className="text-[11px] text-gray-400 mt-1">Применяется при отправке «от каждой организации отдельно».</div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#313131] cursor-pointer">
        <input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
        Активна (показывать в выборе)
      </label>

      {/* Цены вынесены в отдельную вкладку «Цены» */}
      <div className="text-xs text-gray-500 bg-[#EAF6FC] border border-[#cbe8f5] rounded-lg px-3 py-2">
        Цены по услугам теперь задаются в отдельной вкладке <span className="font-medium text-[#0b5c7d]">«Цены»</span> (сводная таблица по всем компаниям).
      </div>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50 inline-flex items-center gap-2">
          {busy && <Spinner size={16} color="#fff" />}
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

  const ta = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#029cda] focus:ring-2 focus:ring-[#029cda]/15 h-24 font-mono';

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
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50 inline-flex items-center gap-2">
          {busy && <Spinner size={16} color="#fff" />}
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
      <h3 className="text-sm font-semibold text-[#313131] mb-2">Алиасы (плейсхолдеры)</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input className={input} placeholder="ключ (латиница): my_note" value={key} onChange={(e) => setKey(e.target.value)} />
          <input className={input} placeholder="описание" value={label} onChange={(e) => setLabelText(e.target.value)} />
          <input className={input} placeholder="значение (текст)" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <button onClick={add} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5]">+ Создать алиас</button>

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
        <h3 className="text-sm font-semibold text-[#313131]">Таблицы расчёта (шаблоны)</h3>
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
  const [defRows, setDefRows] = useState<Array<Record<string, string>>>(table.defaultRows || []);
  const [busy, setBusy] = useState(false);

  // Колонки, которые заполняются вручную (для строк по умолчанию).
  const inputCols = cols.filter((c) => c.kind === 'text' || c.kind === 'number' || c.kind === 'const');
  const setDefCell = (ri: number, key: string, v: string) =>
    setDefRows((rs) => rs.map((r, j) => (j === ri ? { ...r, [key]: v } : r)));

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
        body: JSON.stringify({ key: k, name, columns: finalCols, defaultRows: defRows }),
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

      {/* Строки по умолчанию (зашитые) */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-sm font-semibold text-[#313131] mb-1">Строки по умолчанию (подставляются в КП сразу)</div>
        <div className="text-xs text-gray-400 mb-2">Зафиксируйте неизменные строки (названия услуг, единицы). Менеджеру останется вписать только цены/значения.</div>
        {defRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  {inputCols.map((c) => <th key={c.key} className="pb-1 pr-2">{c.label || c.key}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {defRows.map((r, ri) => (
                  <tr key={ri}>
                    {inputCols.map((c) => (
                      <td key={c.key} className="py-0.5 pr-2">
                        <input value={r[c.key] ?? ''} onChange={(e) => setDefCell(ri, c.key, e.target.value)} className={`${input} min-w-[140px]`} />
                      </td>
                    ))}
                    <td><button onClick={() => setDefRows((rs) => rs.filter((_, j) => j !== ri))} className="text-red-500 px-1">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={() => setDefRows((rs) => [...rs, {}])} className="text-sm text-[#029cda] mt-1">+ Строка по умолчанию</button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50 inline-flex items-center gap-2">{busy && <Spinner size={16} color="#fff" />}{busy ? 'Сохранение…' : 'Сохранить таблицу'}</button>
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
  const [itemsFor, setItemsFor] = useState<string | null>(null);
  const [itemsDraft, setItemsDraft] = useState<ServiceLineItem[]>([]);

  const openItems = (s: ServiceType) => {
    setItemsFor(s.name);
    setItemsDraft((s.lineItems ?? []).map((it) => ({ ...it })));
  };
  const slug = (name: string) =>
    name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 40) || `line_${Date.now()}`;
  const saveItems = async () => {
    if (!itemsFor) return;
    const clean = itemsDraft
      .filter((it) => it.name.trim())
      .map((it, i) => ({ key: (it.key || slug(it.name) || `line_${i}`), name: it.name.trim(), unit: it.unit.trim() }));
    await fetch('/api/kp/services', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: itemsFor, lineItems: clean }),
    });
    setItemsFor(null);
    setStatus('Строки услуги сохранены');
    onChanged();
  };

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
      <h3 className="text-sm font-semibold text-[#313131] mb-2">Услуги</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input className={input} placeholder="Новая услуга (например, ОКС)" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button onClick={add} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5] whitespace-nowrap">+ Добавить</button>
        </div>
        <div className="space-y-1">
          {services.map((s) => {
            const combined = s.name.includes('+');
            return (
            <div key={s.name} className="bg-white border border-gray-200 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                <input
                  className={`${input} flex-1 min-w-[160px]`}
                  value={edits[s.name] ?? s.name}
                  onChange={(e) => setEdits((m) => ({ ...m, [s.name]: e.target.value }))}
                />
                {(edits[s.name] ?? s.name) !== s.name && (
                  <button onClick={() => rename(s.name)} className="text-sm text-[#16a34a] whitespace-nowrap">Сохранить</button>
                )}
                {!combined && (
                  <button
                    onClick={() => (itemsFor === s.name ? setItemsFor(null) : openItems(s))}
                    className="text-xs text-[#029cda] whitespace-nowrap"
                    title="Строки-услуги для авто-наполнения таблицы"
                  >
                    строки ({s.lineItems?.length ?? 0})
                  </button>
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

              {itemsFor === s.name && (
                <div className="border-t border-gray-100 p-3 space-y-2 bg-[#FAFBFC]">
                  <div className="text-xs text-gray-500">Строки-услуги — позиции, которые попадают в таблицу при выборе этой услуги. Цена по каждой позиции задаётся во вкладке «Цены».</div>
                  {itemsDraft.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className={`${input} flex-1`}
                        placeholder="Наименование позиции"
                        value={it.name}
                        onChange={(e) => setItemsDraft((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                      />
                      <input
                        className={`${input} w-28`}
                        placeholder="1 Га / 1 км / 1 шт"
                        value={it.unit}
                        onChange={(e) => setItemsDraft((arr) => arr.map((x, i) => i === idx ? { ...x, unit: e.target.value } : x))}
                      />
                      <button onClick={() => setItemsDraft((arr) => arr.filter((_, i) => i !== idx))} className="text-red-500 text-sm px-1">✕</button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setItemsDraft((arr) => [...arr, { key: '', name: '', unit: '' }])} className="text-sm text-[#029cda]">+ Позиция</button>
                    <button onClick={saveItems} className="ml-auto px-3 py-1.5 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5]">Сохранить строки</button>
                    <button onClick={() => setItemsFor(null)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200">Отмена</button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
          {services.length === 0 && <div className="text-sm text-gray-400">Услуг пока нет.</div>}
        </div>
        <div className="text-xs text-gray-400">Список услуг общий. «Строки» — позиции услуги, попадающие в таблицу при её выборе; цены позиций — во вкладке «Цены». Комбинированные услуги (с «+») собирают строки из компонентов.</div>
      </div>
    </div>
  );
}

/* ─────────── Должности клиента ─────────── */
function PositionsManager({
  positions, onChanged, setStatus,
}: {
  positions: string[];
  onChanged: () => void;
  setStatus: (s: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});

  const add = async () => {
    const n = newName.trim();
    if (!n) return;
    const res = await fetch('/api/kp/positions', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: n }),
    });
    const j = await res.json();
    if (!res.ok) return setStatus(j.error || 'Ошибка');
    setNewName('');
    setStatus('Должность добавлена');
    onChanged();
  };
  const rename = async (oldName: string) => {
    const nn = (edits[oldName] ?? '').trim();
    if (!nn || nn === oldName) return;
    await fetch('/api/kp/positions', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName: nn }),
    });
    setEdits((m) => { const c = { ...m }; delete c[oldName]; return c; });
    setStatus('Должность переименована');
    onChanged();
  };
  const del = async (name: string) => {
    if (!confirm(`Удалить должность «${name}»?`)) return;
    await fetch(`/api/kp/positions?name=${encodeURIComponent(name)}`, { method: 'DELETE', credentials: 'include' });
    setStatus('Должность удалена');
    onChanged();
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#313131] mb-2">Должности клиента</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input className={input} placeholder="Новая должность (например, Мэр)" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button onClick={add} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5] whitespace-nowrap">+ Добавить</button>
        </div>
        <div className="space-y-1">
          {positions.map((p) => (
            <div key={p} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <input className={`${input} flex-1`} value={edits[p] ?? p} onChange={(e) => setEdits((m) => ({ ...m, [p]: e.target.value }))} />
              {(edits[p] ?? p) !== p && <button onClick={() => rename(p)} className="text-sm text-[#16a34a] whitespace-nowrap">Сохранить</button>}
              <button onClick={() => del(p)} className="text-sm text-red-500 whitespace-nowrap">Удалить</button>
            </div>
          ))}
          {positions.length === 0 && <div className="text-sm text-gray-400">Должностей пока нет.</div>}
        </div>
        <div className="text-xs text-gray-400">Список используется при выборе должности клиента в форме «Создать КП» (подставляется с организацией в род. падеже).</div>
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
      <h3 className="text-sm font-semibold text-[#313131] mb-2">Исполнители (менеджеры)</h3>
      <div className="bg-[#F6F7F9] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input className={input} placeholder="ФИО *" value={draft.fio || ''} onChange={(e) => setDraft({ ...draft, fio: e.target.value })} />
          <input className={input} placeholder="Телефон" value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <input className={input} placeholder="E-mail" value={draft.email || ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 text-sm rounded-xl bg-[#029cda] text-white hover:bg-[#0280b5]">{editId ? 'Сохранить' : 'Добавить'}</button>
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
