'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type DeliveryStatus = 'accepted' | 'delivered' | 'bounced' | 'rejected' | 'error';

interface SendRow {
  id: string;
  template_name: string;
  fio: string;
  email: string;
  phone: string;
  subject: string;
  error: string;
  smtp_response: string;
  delivery_status: DeliveryStatus;
  bounced_at: string | null;
  bounce_reason: string;
  opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  called: boolean;
  call_comment: string;
  called_at: string | null;
  created_at: string;
}

type Period = 'today' | 'week' | 'month' | 'range' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'range', label: 'Период' },
  { key: 'all', label: 'Всё' },
];

/** Подписи статусов намеренно осторожные — см. пояснение под фильтрами. */
const STATUS: Record<DeliveryStatus, { label: string; cls: string; hint: string }> = {
  delivered: {
    label: 'Доставлено',
    cls: 'bg-green-50 text-green-700 border-green-200',
    hint: 'Сервер принял письмо, и за отведённое время не пришёл отказ',
  },
  accepted: {
    label: 'Принято сервером',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    hint: 'SMTP принял письмо. Отказ может прийти позже — статус обновится',
  },
  bounced: {
    label: 'Не доставлено',
    cls: 'bg-red-50 text-red-700 border-red-200',
    hint: 'Пришёл возврат от почтового сервера',
  },
  rejected: {
    label: 'Адрес отклонён',
    cls: 'bg-red-50 text-red-700 border-red-200',
    hint: 'SMTP-сервер отклонил адрес при отправке',
  },
  error: {
    label: 'Ошибка',
    cls: 'bg-red-50 text-red-700 border-red-200',
    hint: 'Письмо не удалось отправить',
  },
};

const fmt = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
};

export default function LetterNotifications() {
  const [rows, setRows] = useState<SendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [scanning, setScanning] = useState(false);

  const [period, setPeriod] = useState<Period>('week');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [onlyUncalled, setOnlyUncalled] = useState(false);

  // Горизонтальная прокрутка таблицы кнопками — тянуть мышкой до крайних колонок
  // (телефон, комментарий) неудобно.
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ period });
      if (period === 'range') {
        if (!from || !to) {
          setRows([]);
          setError('Укажите обе даты диапазона');
          setLoading(false);
          return;
        }
        qs.set('from', from);
        qs.set('to', to);
      }
      const res = await fetch(`/api/letters/sends?${qs}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setRows(data.sends || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [period, from, to]);

  useEffect(() => {
    // для «Периода» ждём, пока заполнят обе даты
    if (period === 'range' && (!from || !to)) return;
    load();
  }, [load, period, from, to]);

  /** Локально обновляет строку и шлёт патч на сервер. */
  const patchRow = async (id: string, patch: Partial<SendRow>) => {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    try {
      const res = await fetch(`/api/letters/sends/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      setRows((rs) => rs.map((r) => (r.id === id ? (data.send as SendRow) : r)));
    } catch (e) {
      setRows(prev); // откат — не показываем то, что не сохранилось
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    }
  };

  const scanBounces = async () => {
    setScanning(true);
    setError('');
    setStatus('');
    try {
      const res = await fetch('/api/letters/bounces/scan', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления');
      setStatus(
        `Проверено писем: ${data.scanned}, возвратов: ${data.bounces}, ` +
          `сопоставлено: ${data.matched}, помечено доставленными: ${data.promoted}`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обновления');
    } finally {
      setScanning(false);
    }
  };

  const visible = useMemo(
    () => (onlyUncalled ? rows.filter((r) => !r.called) : rows),
    [rows, onlyUncalled]
  );

  const stats = useMemo(() => {
    const opened = rows.filter((r) => r.opened_at).length;
    const bad = rows.filter((r) =>
      ['bounced', 'rejected', 'error'].includes(r.delivery_status)
    ).length;
    const called = rows.filter((r) => r.called).length;
    return { total: rows.length, opened, bad, called };
  }, [rows]);

  const btn = (active: boolean) =>
    `px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      active
        ? 'bg-[#029cda] text-white border-[#029cda]'
        : 'bg-white text-[#313131] border-gray-200 hover:bg-gray-50'
    }`;
  const inputCls =
    'px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-[#313131] focus:ring-2 focus:ring-[#029cda] focus:border-transparent';

  return (
    <div className="space-y-4 font-[Raleway]">
      <div>
        <h3 className="font-semibold text-[#313131]">Уведомления по письмам</h3>
        <p className="text-sm text-[#7C8A9A]">
          Статусы доставки, открытия и работа по обзвону
        </p>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={btn(period === p.key)}>
            {p.label}
          </button>
        ))}

        {period === 'range' && (
          <span className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputCls}
              aria-label="Дата с"
            />
            <span className="text-[#9AA6B2]">—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputCls}
              aria-label="Дата по"
            />
          </span>
        )}

        <label className="flex items-center gap-2 text-sm text-[#313131] ml-2">
          <input
            type="checkbox"
            checked={onlyUncalled}
            onChange={(e) => setOnlyUncalled(e.target.checked)}
            className="w-4 h-4 accent-[#029cda]"
          />
          Только непрозвоненные
        </label>

        <button
          onClick={scanBounces}
          disabled={scanning}
          className="ml-auto px-4 py-1.5 text-sm rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 disabled:opacity-40"
          title="Прочитать почтовый ящик и обновить статусы доставки"
        >
          {scanning ? 'Обновление…' : 'Обновить статусы'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      {status && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
          {status}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="text-sm text-[#7C8A9A]">
          Писем: <b className="text-[#313131]">{stats.total}</b> · открытий:{' '}
          <b className="text-[#313131]">{stats.opened}</b> · проблемных:{' '}
          <b className="text-[#313131]">{stats.bad}</b> · прозвонено:{' '}
          <b className="text-[#313131]">{stats.called}</b>
        </div>

        {/* Стрелки прокрутки таблицы по горизонтали */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Прокрутить таблицу влево"
            title="Влево"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Прокрутить таблицу вправо (к комментарию)"
            title="Вправо — к телефону и комментарию"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      </div>

      {/* Таблица */}
      <div ref={scrollRef} className="overflow-x-auto -mx-5 px-5 scroll-smooth">
        <table className="w-full text-sm min-w-[1180px]">
          <thead>
            <tr className="text-left text-[#7C8A9A] border-b border-gray-100">
              <th className="py-2 pr-2 font-medium w-28">Отправлено</th>
              <th className="py-2 pr-2 font-medium">Получатель</th>
              <th className="py-2 pr-2 font-medium w-40">Доставка</th>
              <th className="py-2 pr-2 font-medium w-32">Открыто</th>
              <th className="py-2 pr-2 font-medium w-40">Телефон</th>
              <th className="py-2 pr-2 font-medium w-24">Прозвонил</th>
              <th className="py-2 pr-2 font-medium w-64">Комментарий по звонку</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((r) => {
              const s = STATUS[r.delivery_status] || STATUS.error;
              const problem = r.bounce_reason || r.error || r.smtp_response;
              return (
                <tr key={r.id} className="align-top">
                  <td className="py-2 pr-2 text-[#7C8A9A] whitespace-nowrap">
                    {fmt(r.created_at)}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="text-[#313131]">{r.fio || '—'}</div>
                    <div className="text-[#9AA6B2] text-xs">{r.email}</div>
                    {r.subject && (
                      <div className="text-[#9AA6B2] text-xs truncate max-w-[280px]" title={r.subject}>
                        {r.subject}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md border text-xs ${s.cls}`}
                      title={s.hint}
                    >
                      {s.label}
                    </span>
                    {problem && (
                      <div
                        className="text-xs text-[#9AA6B2] mt-1 line-clamp-2"
                        title={problem}
                      >
                        {problem}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    {r.opened_at ? (
                      <span className="text-green-700" title={`Последнее: ${fmt(r.last_opened_at)}`}>
                        {fmt(r.opened_at)}
                        {r.open_count > 1 && (
                          <span className="text-[#9AA6B2]"> ×{r.open_count}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#9AA6B2]">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      value={r.phone}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((x) => (x.id === r.id ? { ...x, phone: e.target.value } : x))
                        )
                      }
                      onBlur={(e) => patchRow(r.id, { phone: e.target.value })}
                      placeholder="+7 900 000-00-00"
                      className={`${inputCls} w-full`}
                    />
                    {r.phone.trim() && (
                      <a
                        href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}
                        className="text-xs text-[#029cda] hover:underline"
                      >
                        Позвонить
                      </a>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={r.called}
                        onChange={(e) => patchRow(r.id, { called: e.target.checked })}
                        className="w-4 h-4 accent-[#029cda]"
                      />
                      <span className="text-xs text-[#9AA6B2]">
                        {r.called ? fmt(r.called_at) : 'нет'}
                      </span>
                    </label>
                  </td>
                  <td className="py-2 pr-2">
                    <textarea
                      value={r.call_comment}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((x) =>
                            x.id === r.id ? { ...x, call_comment: e.target.value } : x
                          )
                        )
                      }
                      onBlur={(e) => patchRow(r.id, { call_comment: e.target.value })}
                      rows={2}
                      placeholder="Итог разговора…"
                      className={`${inputCls} w-full resize-y`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-sm text-[#9AA6B2] py-4">Загрузка…</div>}
      {!loading && !visible.length && !error && (
        <div className="text-sm text-[#9AA6B2] py-8 text-center">
          За выбранный период писем нет
        </div>
      )}
    </div>
  );
}
