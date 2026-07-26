'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface FileMeta {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
}
interface Row {
  id: string;
  type: 'info' | 'access';
  fio: string;
  phone: string;
  email: string;
  region: string;
  message: string;
  source: string;
  handled: boolean;
  created_at: string;
  files: FileMeta[];
}

function humanSize(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(b / 1024))} КБ`;
}

function Attachments({ files }: { files: FileMeta[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {files.map((f) => {
        const isImg = (f.mime || '').startsWith('image/');
        const src = `/api/feedback/file/${f.id}`;
        return (
          <div key={f.id} className="flex flex-col items-center gap-1">
            <a href={src} target="_blank" rel="noopener noreferrer" title={f.filename}>
              {isImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={f.filename} className="w-16 h-16 object-cover rounded-lg border border-[#e8eaed]" />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-[#e8eaed] bg-[#F6F7F9] flex items-center justify-center text-2xl">🎬</div>
              )}
            </a>
            <a href={`${src}?download=1`} className="text-[10px] text-[#029cda] hover:underline">скачать</a>
            <span className="text-[10px] text-[#9AA6B2]">{humanSize(f.size_bytes)}</span>
          </div>
        );
      })}
    </div>
  );
}

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  info: { label: 'Информация', cls: 'bg-[#029cda]/10 text-[#029cda]' },
  access: { label: 'Доступ к системе', cls: 'bg-[#16a34a]/10 text-[#16a34a]' },
};

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function CitizenFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [type, setType] = useState<'all' | 'info' | 'access'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = type === 'all' ? '' : `?type=${type}`;
      const res = await fetch(`/api/feedback${qs}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally { setLoading(false); }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const toggleHandled = async (r: Row) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, handled: !x.handled } : x)));
    try {
      await fetch('/api/feedback', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, handled: !r.handled }),
      });
    } catch { load(); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить обращение?')) return;
    setRows((prev) => prev.filter((x) => x.id !== id));
    try {
      await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    } catch { load(); }
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#029cda] text-white' : 'bg-[#F6F7F9] text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="font-[Raleway]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#313131]">Обратная связь от граждан</h2>
          <p className="text-sm text-[#7C8A9A]">Заявки с кампейн-страниц (помощь городу и т.п.)</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={chip(type === 'all')} onClick={() => setType('all')}>Все</button>
          <button className={chip(type === 'info')} onClick={() => setType('info')}>Информация</button>
          <button className={chip(type === 'access')} onClick={() => setType('access')}>Доступ</button>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

      {loading ? (
        <div className="py-16 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#029cda] mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-[#F6F7F9] rounded-xl p-10 text-center text-gray-500 text-sm">Обращений пока нет.</div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-[#7C8A9A] border-b border-gray-100">
                <th className="py-2 pr-2 font-medium w-32">Дата</th>
                <th className="py-2 pr-2 font-medium w-40">Тип</th>
                <th className="py-2 pr-2 font-medium">Контакт</th>
                <th className="py-2 pr-2 font-medium">Район / сообщение</th>
                <th className="py-2 pr-2 font-medium w-28">Статус</th>
                <th className="py-2 pr-2 font-medium w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => {
                const t = TYPE_LABEL[r.type] || TYPE_LABEL.info;
                return (
                  <tr key={r.id} className="align-top">
                    <td className="py-2 pr-2 text-[#7C8A9A] whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="py-2 pr-2">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${t.cls}`}>{t.label}</span>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="text-[#313131] font-medium break-all">{r.email || '—'}</div>
                      {r.fio && <div className="text-[#7C8A9A] text-xs">{r.fio}</div>}
                      {r.phone && <div className="text-[#7C8A9A] text-xs">{r.phone}</div>}
                    </td>
                    <td className="py-2 pr-2 text-[#313131]">
                      {r.region && <div className="text-xs text-[#029cda]">{r.region}</div>}
                      {r.message && <div className="text-xs whitespace-pre-wrap">{r.message}</div>}
                      {!r.region && !r.message && !r.files?.length && <span className="text-[#9AA6B2]">—</span>}
                      <Attachments files={r.files} />
                    </td>
                    <td className="py-2 pr-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                        <input type="checkbox" checked={r.handled} onChange={() => toggleHandled(r)} />
                        <span className={r.handled ? 'text-[#16a34a]' : 'text-[#9AA6B2]'}>{r.handled ? 'обработано' : 'новое'}</span>
                      </label>
                    </td>
                    <td className="py-2 pr-2">
                      <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600 text-xs">Удалить</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
