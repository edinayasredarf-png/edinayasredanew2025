'use client';

import React, { useCallback, useEffect, useState } from 'react';

/* ── Типы ответов API ── */
interface MetrikaSummary {
  visits: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgVisitDurationSeconds: number;
}
interface MetrikaTimePoint { date: string; visits: number; users: number }
interface MetrikaNamedValue { name: string; visits: number; share: number }
interface MetrikaResponse {
  configured: boolean;
  error?: string;
  summary?: MetrikaSummary;
  timeline?: MetrikaTimePoint[];
  sources?: MetrikaNamedValue[];
  topPages?: MetrikaNamedValue[];
}

interface EmailSummary { total: number; sent: number; received: number }
interface EmailPoint { date: string; sent: number; received: number }
interface EmailRecent { id: string; subject: string; date: string | null; direction: 'in' | 'out' }
interface EmailResponse {
  configured: boolean;
  error?: string;
  summary?: EmailSummary;
  timeline?: EmailPoint[];
  recent?: EmailRecent[];
  truncated?: boolean;
}

const PERIODS = [
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
] as const;

/* ── Форматирование ── */
const nf = new Intl.NumberFormat('ru-RU');
const fmt = (n: number) => nf.format(Math.round(n));
const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtDate = (d: string) => {
  if (!d) return '—';
  const p = new Date(d);
  return Number.isNaN(p.getTime()) ? d : p.toLocaleDateString('ru-RU');
};

/* ── Блоки ── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl p-6 ${className}`}>{children}</div>;
}
function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#F9FAFB] p-4">
      <div className="text-2xl font-bold text-[#313131]">{value}</div>
      <div className="text-sm text-[#7C8A9A] mt-1">{label}</div>
      {hint && <div className="text-xs text-[#9AA6B2] mt-0.5">{hint}</div>}
    </div>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">{children}</div>;
}
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#029cda]" />
    </div>
  );
}

/* ── График визитов (линия) ── */
function VisitsChart({ points }: { points: MetrikaTimePoint[] }) {
  if (!points.length) return null;
  const W = 720, H = 180, pad = 8;
  const max = Math.max(...points.map((p) => p.visits), 1);
  const stepX = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const x = (i: number) => pad + i * stepX;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.visits).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(points.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#029cda" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#029cda" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#visitsFill)" />
      <path d={line} fill="none" stroke="#029cda" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── График email по дням (столбцы: исходящие/входящие) ── */
function EmailChart({ points }: { points: EmailPoint[] }) {
  if (!points.length) return null;
  const W = 720, H = 160, pad = 6;
  const max = Math.max(...points.map((p) => p.sent + p.received), 1);
  const bw = (W - pad * 2) / points.length;
  const barW = Math.max(1, Math.min(bw * 0.7, 14));
  const h = (v: number) => (v / max) * (H - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      {points.map((p, i) => {
        const cx = pad + i * bw + bw / 2;
        const sentH = h(p.sent);
        const recvH = h(p.received);
        const baseY = H - pad;
        return (
          <g key={p.date}>
            <rect x={cx - barW / 2} y={baseY - sentH} width={barW} height={sentH} rx="1.5" fill="#029cda" />
            <rect x={cx - barW / 2} y={baseY - sentH - recvH} width={barW} height={recvH} rx="1.5" fill="#9AD8F0" />
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<number>(30);

  const [metrika, setMetrika] = useState<MetrikaResponse | null>(null);
  const [metrikaLoading, setMetrikaLoading] = useState(true);
  const [email, setEmail] = useState<EmailResponse | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);

  const loadMetrika = useCallback(async (p: number) => {
    setMetrikaLoading(true);
    try {
      const res = await fetch(`/api/analytics/metrika?period=${p}`, { credentials: 'include' });
      setMetrika(await res.json());
    } catch {
      setMetrika({ configured: true, error: 'Не удалось загрузить данные Метрики' });
    } finally { setMetrikaLoading(false); }
  }, []);

  const loadEmail = useCallback(async (p: number) => {
    setEmailLoading(true);
    try {
      const res = await fetch(`/api/analytics/email-activity?period=${p}`, { credentials: 'include' });
      setEmail(await res.json());
    } catch {
      setEmail({ configured: true, error: 'Не удалось загрузить данные Битрикс24' });
    } finally { setEmailLoading(false); }
  }, []);

  useEffect(() => { loadMetrika(period); loadEmail(period); }, [period, loadMetrika, loadEmail]);

  const s = metrika?.summary;
  const es = email?.summary;
  const recent = email?.recent ?? [];

  return (
    <div className="space-y-6 font-[Raleway]">
      {/* ── Заголовок + период ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#313131]">Аналитика</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p.value ? 'bg-white text-[#029cda] shadow-sm font-medium' : 'text-[#7C8A9A] hover:text-[#313131]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Посещаемость сайта ── */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#313131]">Посещаемость сайта</h3>
          <p className="text-sm text-[#7C8A9A]">Данные Яндекс.Метрики</p>
        </div>

        {metrikaLoading ? <Spinner /> : metrika?.configured === false ? (
          <Notice>Метрика не подключена. Задайте <code className="font-mono">YANDEX_METRIKA_TOKEN</code> — данные появятся автоматически.</Notice>
        ) : metrika?.error ? (
          <Notice>Ошибка Метрики: {metrika.error}</Notice>
        ) : s ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <Metric label="Визиты" value={fmt(s.visits)} />
              <Metric label="Посетители" value={fmt(s.users)} />
              <Metric label="Просмотры" value={fmt(s.pageviews)} />
              <Metric label="Отказы" value={`${s.bounceRate}%`} />
              <Metric label="Ср. время" value={fmtDuration(s.avgVisitDurationSeconds)} hint="мин:сек" />
            </div>

            {metrika?.timeline && metrika.timeline.length > 0 && (
              <div className="mb-2">
                <VisitsChart points={metrika.timeline} />
                <div className="flex justify-between text-xs text-[#9AA6B2] mt-1">
                  <span>{fmtDate(metrika.timeline[0].date)}</span>
                  <span>Визиты по дням</span>
                  <span>{fmtDate(metrika.timeline[metrika.timeline.length - 1].date)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="text-sm font-semibold text-[#313131] mb-3">Источники трафика</h4>
                <ShareList items={metrika?.sources ?? []} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#313131] mb-3">Популярные страницы</h4>
                <ShareList items={metrika?.topPages ?? []} />
              </div>
            </div>
          </>
        ) : null}
      </Card>

      {/* ── Email-активность (Битрикс24 CRM) ── */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#313131]">Email-активность</h3>
          <p className="text-sm text-[#7C8A9A]">Письма CRM Битрикс24 (отправка и получение)</p>
        </div>

        {emailLoading ? <Spinner /> : email?.configured === false ? (
          <Notice>Битрикс24 не подключён. Задайте <code className="font-mono">BITRIX24_WEBHOOK_URL</code> (права <code className="font-mono">crm</code>).</Notice>
        ) : email?.error ? (
          <Notice>Ошибка Битрикс24: {email.error}</Notice>
        ) : es ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Metric label="Всего писем" value={fmt(es.total)} />
              <Metric label="Исходящие" value={fmt(es.sent)} />
              <Metric label="Входящие" value={fmt(es.received)} />
            </div>

            {email?.timeline && email.timeline.length > 0 && (
              <div className="mb-6">
                <EmailChart points={email.timeline} />
                <div className="flex items-center justify-between text-xs text-[#9AA6B2] mt-1">
                  <span>{fmtDate(email.timeline[0].date)}</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#029cda]" />исходящие</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#9AD8F0]" />входящие</span>
                  </span>
                  <span>{fmtDate(email.timeline[email.timeline.length - 1].date)}</span>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-[#313131] mb-3">Последние письма</h4>
              {recent.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">За период писем нет.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                        r.direction === 'out' ? 'bg-[#e0f2fd] text-[#029cda]' : 'bg-gray-100 text-[#7C8A9A]'
                      }`}>
                        {r.direction === 'out' ? 'Исх.' : 'Вх.'}
                      </span>
                      <span className="flex-1 text-sm text-[#313131] truncate" title={r.subject}>{r.subject}</span>
                      <span className="shrink-0 text-xs text-[#9AA6B2] whitespace-nowrap">{fmtDate(r.date ?? '')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-[#9AA6B2] mt-4">
              Открытия и клики массовых рассылок Битрикс24 не выводит в REST — показана реальная email-переписка CRM.
            </p>
          </>
        ) : null}
      </Card>
    </div>
  );
}

/* ── Список с долевыми барами ── */
function ShareList({ items }: { items: MetrikaNamedValue[] }) {
  if (!items.length) return <p className="text-sm text-gray-400 py-4">Нет данных за период</p>;
  const max = Math.max(...items.map((i) => i.visits), 1);
  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={`${it.name}-${idx}`}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-sm text-[#313131] truncate" title={it.name}>{it.name}</span>
            <span className="text-sm text-[#7C8A9A] shrink-0">{fmt(it.visits)} · {it.share}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-[#029cda]" style={{ width: `${(it.visits / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
