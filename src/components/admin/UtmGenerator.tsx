'use client';

import React, { useState, useCallback } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

function buildUrl(base: string, params: Record<string, string>): string {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v.trim()));
  if (!Object.keys(filtered).length) return base.trim();
  const q = new URLSearchParams(filtered).toString();
  const sep = base.includes('?') ? '&' : '?';
  return base.trim() + sep + q;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  label: string;
  icon: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  enabled: boolean;
}

const DEFAULT_CHANNELS: Omit<Channel, 'campaign' | 'content'>[] = [
  { id: 'vk',        label: 'ВКонтакте',      icon: '🅱',  url: '', source: 'vk',        medium: 'social',     enabled: true },
  { id: 'telegram',  label: 'Телеграм',        icon: '✈️',  url: '', source: 'telegram',  medium: 'messenger',  enabled: true },
  { id: 'dzen',      label: 'Яндекс Дзен',    icon: '🟡',  url: '', source: 'dzen',      medium: 'social',     enabled: true },
  { id: 'email',     label: 'Email рассылка',  icon: '📧',  url: '', source: 'email',     medium: 'email',      enabled: true },
  { id: 'max',       label: 'Max (VK мессенджер)', icon: '🟣', url: '', source: 'max',      medium: 'messenger',  enabled: true  },
  { id: 'whatsapp',  label: 'WhatsApp',        icon: '💬',  url: '', source: 'whatsapp',  medium: 'messenger',  enabled: false },
  { id: 'website',   label: 'Сайт / баннер',  icon: '🌐',  url: '', source: 'website',   medium: 'banner',     enabled: false },
];

interface Result {
  id: string;
  label: string;
  icon: string;
  url: string;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function UtmGenerator() {
  const [baseUrl, setBaseUrl] = useState('https://единаясреда.рф/blog/');
  const [articleTitle, setArticleTitle] = useState('');
  const [campaignOverride, setCampaignOverride] = useState('');
  const [channels, setChannels] = useState<Channel[]>(
    DEFAULT_CHANNELS.map((c) => ({ ...c, campaign: '', content: '' }))
  );
  const [results, setResults] = useState<Result[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const campaignSlug = campaignOverride.trim() || slugify(articleTitle);

  const updateChannel = useCallback(<K extends keyof Channel>(id: string, key: K, value: Channel[K]) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  }, []);

  const generate = () => {
    const generated: Result[] = channels
      .filter((c) => c.enabled)
      .map((c) => {
        const url = buildUrl(c.url || baseUrl, {
          utm_source:   c.source,
          utm_medium:   c.medium,
          utm_campaign: c.campaign || campaignSlug,
          utm_content:  c.content,
        });
        return { id: c.id, label: c.label, icon: c.icon, url };
      });
    setResults(generated);
  };

  const copyOne = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const copyAll = async () => {
    const text = results.map((r) => `${r.label}:\n${r.url}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Генератор UTM-меток</h2>
        <p className="text-sm text-gray-500 mt-1">
          Вбейте название статьи и базовый URL — получите готовые ссылки для всех каналов одним кликом.
        </p>
      </div>

      {/* Основные поля */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Статья / кампания</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Базовый URL статьи</label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://единаясреда.рф/blog/slug-stati"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
          />
          <p className="text-xs text-gray-400 mt-1">Можно переопределить для каждого канала ниже.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название статьи</label>
          <input
            type="text"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="Как работает цифровое управление лесами"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            utm_campaign{' '}
            <span className="font-normal text-gray-400">(авто из названия)</span>
          </label>
          <input
            type="text"
            value={campaignOverride || campaignSlug}
            onChange={(e) => setCampaignOverride(e.target.value)}
            placeholder={campaignSlug || 'название_кампании'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
          />
        </div>
      </div>

      {/* Каналы */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Каналы</h3>
          <span className="text-xs text-gray-400">{channels.filter((c) => c.enabled).length} активных</span>
        </div>

        <div className="divide-y divide-gray-50">
          {channels.map((ch) => (
            <div key={ch.id} className={`px-6 py-4 transition-colors ${ch.enabled ? '' : 'opacity-40'}`}>
              {/* Заголовок канала + toggle */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => updateChannel(ch.id, 'enabled', !ch.enabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                    ch.enabled ? 'bg-[#029cda]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      ch.enabled ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
                <span className="text-base">{ch.icon}</span>
                <span className="font-medium text-sm text-gray-800">{ch.label}</span>
              </div>

              {ch.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ml-12">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">URL (необяз.)</label>
                    <input
                      type="url"
                      value={ch.url}
                      onChange={(e) => updateChannel(ch.id, 'url', e.target.value)}
                      placeholder={baseUrl}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">utm_source</label>
                    <input
                      type="text"
                      value={ch.source}
                      onChange={(e) => updateChannel(ch.id, 'source', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">utm_medium</label>
                    <input
                      type="text"
                      value={ch.medium}
                      onChange={(e) => updateChannel(ch.id, 'medium', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">utm_content (необяз.)</label>
                    <input
                      type="text"
                      value={ch.content}
                      onChange={(e) => updateChannel(ch.id, 'content', e.target.value)}
                      placeholder="версия_поста"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка генерации */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={generate}
          disabled={!baseUrl.trim() && !channels.some((c) => c.enabled && c.url)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#029cda] text-white text-sm font-medium hover:bg-[#0287be] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Сгенерировать UTM-ссылки
        </button>
      </div>

      {/* Результаты */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Готовые ссылки</h3>
            <button
              type="button"
              onClick={copyAll}
              className="text-xs text-[#029cda] hover:underline font-medium"
            >
              {copied === 'all' ? '✓ Скопировано' : 'Скопировать все'}
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {results.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-start gap-3">
                <span className="text-lg mt-0.5 flex-shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 mb-1">{r.label}</div>
                  <div className="text-xs font-mono text-gray-500 break-all bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                    {r.url}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyOne(r.url, r.id)}
                  className="flex-shrink-0 mt-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#029cda] hover:text-[#029cda] transition-colors"
                >
                  {copied === r.id ? '✓' : 'Копировать'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
