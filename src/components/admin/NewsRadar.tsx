'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteItem,
  deleteTrigger,
  listItems,
  listTriggers,
  refreshRadar,
  seedDefaultFeeds,
  setItemStatus,
  upsertTrigger,
  type RadarRefreshResult,
} from '@/lib/radarStore';
import {
  DEFAULT_RADAR_FEEDS,
  RADAR_CATEGORIES,
  RADAR_STATUSES,
  radarCategoryColor,
  radarCategoryLabel,
  type RadarCategory,
  type RadarItem,
  type RadarStatus,
  type RadarTrigger,
} from '@/lib/radarTypes';

const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors';

function timeAgo(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d} дн. назад`;
  const h = Math.floor(diff / 3_600_000);
  if (h > 0) return `${h} ч. назад`;
  const m = Math.floor(diff / 60_000);
  if (m > 0) return `${m} мин. назад`;
  return 'только что';
}

export default function NewsRadar() {
  const [view, setView] = useState<'feed' | 'triggers'>('feed');

  const [items, setItems] = useState<RadarItem[]>([]);
  const [triggers, setTriggers] = useState<RadarTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listItems({ category, status, q });
      setItems(rows);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Ошибка загрузки' });
    } finally {
      setLoading(false);
    }
  }, [category, status, q]);

  const loadTriggers = useCallback(async () => {
    try {
      setTriggers(await listTriggers());
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Ошибка загрузки триггеров' });
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadTriggers(); }, [loadTriggers]);

  const onRefresh = async () => {
    setRefreshing(true);
    setMsg(null);
    try {
      const res: RadarRefreshResult = await refreshRadar();
      const errNote = res.errors.length ? `, ошибок: ${res.errors.length}` : '';
      setMsg({
        kind: 'ok',
        text: `Обновлено: ${res.triggers} триггеров, найдено ${res.fetched}, сохранено ${res.saved}${errNote}`,
      });
      await loadItems();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Ошибка обновления' });
    } finally {
      setRefreshing(false);
    }
  };

  const changeStatus = async (id: string, s: RadarStatus) => {
    setItems((prev) =>
      status === 'all'
        ? prev.map((it) => (it.id === id ? { ...it, status: s } : it))
        : prev.filter((it) => it.id !== id)
    );
    try {
      await setItemStatus(id, s);
    } catch {
      loadItems();
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await deleteItem(id);
    } catch {
      loadItems();
    }
  };

  const createArticle = (it: RadarItem) => {
    changeStatus(it.id, 'used');
    try {
      navigator.clipboard?.writeText(`${it.title}\n\nИсточник: ${it.link}`);
    } catch { /* ignore */ }
    window.open('/blog/new', '_blank');
  };

  const applySearch = () => setQ(qInput.trim());

  return (
    <div>
      {/* Заголовок + управление */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Новостной радар</h2>
          <p className="text-sm text-gray-500">
            Мониторинг новостей по ключевым темам для статей и лидогенерации
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-[#F6F7F9] p-1">
            <button
              className={`${btn} ${view === 'feed' ? 'bg-white shadow text-[#029cda]' : 'text-gray-600'}`}
              onClick={() => setView('feed')}
            >
              Лента
            </button>
            <button
              className={`${btn} ${view === 'triggers' ? 'bg-white shadow text-[#029cda]' : 'text-gray-600'}`}
              onClick={() => setView('triggers')}
            >
              Триггеры
            </button>
          </div>
          <button
            className={`${btn} bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-60`}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Обновляю…' : 'Обновить'}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
            msg.kind === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      {view === 'feed' ? (
        <FeedView
          items={items}
          loading={loading}
          category={category}
          status={status}
          qInput={qInput}
          setCategory={setCategory}
          setStatus={setStatus}
          setQInput={setQInput}
          applySearch={applySearch}
          changeStatus={changeStatus}
          removeItem={removeItem}
          createArticle={createArticle}
        />
      ) : (
        <TriggersView
          triggers={triggers}
          reload={loadTriggers}
          notify={setMsg}
        />
      )}
    </div>
  );
}

/* ---------------------------------- Лента --------------------------------- */

function FeedView(props: {
  items: RadarItem[];
  loading: boolean;
  category: string;
  status: string;
  qInput: string;
  setCategory: (v: string) => void;
  setStatus: (v: string) => void;
  setQInput: (v: string) => void;
  applySearch: () => void;
  changeStatus: (id: string, s: RadarStatus) => void;
  removeItem: (id: string) => void;
  createArticle: (it: RadarItem) => void;
}) {
  const {
    items, loading, category, status, qInput,
    setCategory, setStatus, setQInput, applySearch,
    changeStatus, removeItem, createArticle,
  } = props;

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-[13px] border transition-colors ${
      active ? 'bg-[#029cda] text-white border-[#029cda]' : 'bg-white text-gray-600 border-[#e8eaed] hover:border-[#029cda]'
    }`;

  return (
    <div>
      {/* Фильтры */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          <button className={chip(category === 'all')} onClick={() => setCategory('all')}>
            Все темы
          </button>
          {RADAR_CATEGORIES.map((c) => (
            <button key={c.key} className={chip(category === c.key)} onClick={() => setCategory(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={chip(status === 'all')} onClick={() => setStatus('all')}>
            Все статусы
          </button>
          {RADAR_STATUSES.map((s) => (
            <button key={s.key} className={chip(status === s.key)} onClick={() => setStatus(s.key)}>
              {s.label}
            </button>
          ))}
          <div className="flex-1" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="Поиск по заголовку…"
            className="h-9 px-3 rounded-lg border border-[#e8eaed] text-sm w-56 focus:outline-none focus:border-[#029cda]"
          />
          <button className={`${btn} bg-[#F6F7F9] text-gray-700`} onClick={applySearch}>
            Найти
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#029cda] mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#F6F7F9] rounded-xl p-10 text-center text-gray-500 text-sm">
          Пока пусто. Нажмите «Обновить», чтобы собрать свежие новости по триггерам.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <ItemCard
              key={it.id}
              it={it}
              onStatus={changeStatus}
              onRemove={removeItem}
              onCreateArticle={createArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard(props: {
  it: RadarItem;
  onStatus: (id: string, s: RadarStatus) => void;
  onRemove: (id: string) => void;
  onCreateArticle: (it: RadarItem) => void;
}) {
  const { it, onStatus, onRemove, onCreateArticle } = props;
  const statusLabel = RADAR_STATUSES.find((s) => s.key === it.status)?.label ?? it.status;

  return (
    <div className="bg-white border border-[#e8eaed] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span
          className="mt-1 shrink-0 w-2 h-2 rounded-full"
          style={{ background: radarCategoryColor(it.category) }}
          title={radarCategoryLabel(it.category)}
        />
        <div className="min-w-0 flex-1">
          <a
            href={it.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] font-semibold text-gray-900 hover:text-[#029cda] leading-snug"
          >
            {it.title}
          </a>
          {it.snippet && (
            <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{it.snippet}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[12px] text-gray-400">
            <span
              className="px-2 py-0.5 rounded-full text-white text-[11px]"
              style={{ background: radarCategoryColor(it.category) }}
            >
              {radarCategoryLabel(it.category)}
            </span>
            {it.source_name && <span className="text-gray-500">{it.source_name}</span>}
            <span>{timeAgo(it.published_at)}</span>
            {it.status !== 'new' && (
              <span className="text-[#029cda] font-medium">• {statusLabel}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#f0f1f3]">
        <button className={`${btn} bg-[#F6F7F9] text-gray-700 hover:bg-gray-200`} onClick={() => onStatus(it.id, 'interesting')}>
          ★ Интересно
        </button>
        <button className={`${btn} bg-red-50 text-red-600 hover:bg-red-100`} onClick={() => onStatus(it.id, 'lead')}>
          Лид
        </button>
        <button className={`${btn} bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/20`} onClick={() => onCreateArticle(it)}>
          Создать статью
        </button>
        <a href={it.link} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#F6F7F9] text-gray-700 hover:bg-gray-200`}>
          Источник ↗
        </a>
        <div className="flex-1" />
        <button className={`${btn} text-gray-400 hover:text-gray-600`} onClick={() => onStatus(it.id, 'dismissed')}>
          Скрыть
        </button>
        <button className={`${btn} text-red-400 hover:text-red-600`} onClick={() => onRemove(it.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Триггеры -------------------------------- */

function TriggersView(props: {
  triggers: RadarTrigger[];
  reload: () => void;
  notify: (m: { kind: 'ok' | 'err'; text: string }) => void;
}) {
  const { triggers, reload, notify } = props;
  const empty = { label: '', category: 'other' as RadarCategory, kind: 'keyword' as 'keyword' | 'rss', query: '', enabled: true };
  const [draft, setDraft] = useState<Partial<RadarTrigger>>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, RadarTrigger[]>();
    for (const t of triggers) {
      const arr = m.get(t.category) ?? [];
      arr.push(t);
      m.set(t.category, arr);
    }
    return m;
  }, [triggers]);

  const save = async () => {
    if (!draft.query?.trim() || !draft.label?.trim()) {
      notify({ kind: 'err', text: 'Укажите название и запрос/ссылку' });
      return;
    }
    try {
      await upsertTrigger({ ...draft, id: editing ?? undefined });
      setDraft(empty);
      setEditing(null);
      reload();
      notify({ kind: 'ok', text: 'Триггер сохранён' });
    } catch (e) {
      notify({ kind: 'err', text: e instanceof Error ? e.message : 'Ошибка сохранения' });
    }
  };

  const edit = (t: RadarTrigger) => {
    setEditing(t.id);
    setDraft({ label: t.label, category: t.category, kind: t.kind, query: t.query, enabled: t.enabled });
  };

  const toggle = async (t: RadarTrigger) => {
    try {
      await upsertTrigger({ ...t, enabled: !t.enabled });
      reload();
    } catch { /* ignore */ }
  };

  const remove = async (id: string) => {
    try {
      await deleteTrigger(id);
      reload();
    } catch { /* ignore */ }
  };

  const [seeding, setSeeding] = useState(false);
  const connectFeeds = async () => {
    setSeeding(true);
    try {
      const res = await seedDefaultFeeds();
      reload();
      notify({
        kind: 'ok',
        text: res.added > 0
          ? `Подключено лент СМИ: ${res.added}. Нажмите «Обновить» на вкладке «Лента».`
          : 'Ленты СМИ уже подключены.',
      });
    } catch (e) {
      notify({ kind: 'err', text: e instanceof Error ? e.message : 'Ошибка подключения лент' });
    } finally {
      setSeeding(false);
    }
  };

  const feedsConnected = triggers.filter((t) => t.kind === 'rss').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Список триггеров */}
      <div className="lg:col-span-2 space-y-4">
        {/* Пул российских СМИ */}
        <div className="bg-[#029cda]/5 border border-[#029cda]/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[#313131]">
            <div className="font-medium">Российские СМИ ({DEFAULT_RADAR_FEEDS.length} лент)</div>
            <div className="text-xs text-gray-500">
              ТАСС, РИА, Интерфакс, Коммерсантъ, РГ и др. — фильтруются по вашим темам.
              {feedsConnected > 0 && ` Сейчас подключено RSS-лент: ${feedsConnected}.`}
            </div>
          </div>
          <button
            className={`${btn} bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-60`}
            onClick={connectFeeds}
            disabled={seeding}
          >
            {seeding ? 'Подключаю…' : 'Подключить СМИ'}
          </button>
        </div>

        {triggers.length === 0 && (
          <div className="bg-[#F6F7F9] rounded-xl p-8 text-center text-gray-500 text-sm">
            Триггеров пока нет — добавьте первый справа.
          </div>
        )}
        {RADAR_CATEGORIES.filter((c) => grouped.has(c.key)).map((c) => (
          <div key={c.key}>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#9AA6B2] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              {c.label}
            </div>
            <div className="space-y-2">
              {(grouped.get(c.key) ?? []).map((t) => (
                <div key={t.id} className="bg-white border border-[#e8eaed] rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                        {t.label}
                        <span className="text-[11px] text-gray-400 font-normal">
                          {t.kind === 'rss' ? 'RSS' : 'ключевые слова'}
                        </span>
                      </div>
                      <div className="text-[12px] text-gray-500 mt-0.5 break-words">{t.query}</div>
                    </div>
                    <label className="shrink-0 inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={t.enabled} onChange={() => toggle(t)} />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#029cda] relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button className={`${btn} bg-[#F6F7F9] text-gray-700 text-xs`} onClick={() => edit(t)}>
                      Изменить
                    </button>
                    <button className={`${btn} text-red-500 text-xs hover:bg-red-50`} onClick={() => remove(t.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Форма добавления/редактирования */}
      <div className="bg-[#F6F7F9] rounded-xl p-4 h-fit lg:sticky lg:top-6">
        <div className="font-semibold text-gray-900 mb-3">
          {editing ? 'Изменить триггер' : 'Новый триггер'}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Название</label>
            <input
              value={draft.label ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#e8eaed] text-sm focus:outline-none focus:border-[#029cda]"
              placeholder="Например: Субсидии на озеленение"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Тема</label>
            <select
              value={draft.category ?? 'other'}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as RadarCategory }))}
              className="w-full h-9 px-2 rounded-lg border border-[#e8eaed] text-sm bg-white focus:outline-none focus:border-[#029cda]"
            >
              {RADAR_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Тип</label>
            <select
              value={draft.kind ?? 'keyword'}
              onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as 'keyword' | 'rss' }))}
              className="w-full h-9 px-2 rounded-lg border border-[#e8eaed] text-sm bg-white focus:outline-none focus:border-[#029cda]"
            >
              <option value="keyword">Ключевые слова (Google News)</option>
              <option value="rss">RSS-лента (URL)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {draft.kind === 'rss' ? 'URL RSS-ленты' : 'Ключевые слова / фраза'}
            </label>
            <textarea
              value={draft.query ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#e8eaed] text-sm focus:outline-none focus:border-[#029cda] resize-y"
              placeholder={
                draft.kind === 'rss'
                  ? 'https://example.ru/rss'
                  : '"инвентаризация захоронений" OR "реестр кладбищ"'
              }
            />
            {draft.kind !== 'rss' && (
              <p className="text-[11px] text-gray-400 mt-1">
                Поддерживаются кавычки для точных фраз и OR между вариантами.
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button className={`${btn} bg-[#029cda] text-white hover:bg-[#0280b5] flex-1`} onClick={save}>
              {editing ? 'Сохранить' : 'Добавить'}
            </button>
            {editing && (
              <button
                className={`${btn} bg-white border border-[#e8eaed] text-gray-600`}
                onClick={() => { setEditing(null); setDraft(empty); }}
              >
                Отмена
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
