"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import {
  deleteCluster,
  generateDraft,
  getBrief,
  listClusterItems,
  listItemVersions,
  saveBrief,
  upsertCluster,
  upsertItem,
} from "@/lib/contentOsStore";
import {
  CONTENT_CLUSTER_STATUSES,
  CONTENT_ITEM_STATUSES,
  CONTENT_OS_CHANNELS,
  type ContentChannelProfile,
  type ContentCluster,
  type ContentItem,
  type ContentItemVersion,
  type ContentOsChannel,
  type ContentTopic,
} from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const AUDIENCES = ["Руководители МСУ", "Сотрудники МСУ (ЖКХ, благоустройство)", "Депутаты", "Широкая аудитория"];

export default function ContentTab({
  clusters, channels, reloadClusters, initialTopic, onConsumedInitialTopic,
}: {
  clusters: ContentCluster[];
  channels: ContentChannelProfile[];
  reloadClusters: () => Promise<void>;
  initialTopic: ContentTopic | null;
  onConsumedInitialTopic: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (initialTopic) {
      setNewTitle(initialTopic.title);
      setShowNew(true);
      onConsumedInitialTopic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  const createCluster = async () => {
    if (!newTitle.trim()) return;
    const { id } = await upsertCluster({ title: newTitle.trim(), primary_topic_id: initialTopic?.id ?? null });
    setNewTitle("");
    setShowNew(false);
    await reloadClusters();
    setSelectedId(id);
  };

  const removeCluster = async (id: string) => {
    if (!confirm("Удалить кластер вместе со всеми материалами по нему?")) return;
    await deleteCluster(id);
    if (selectedId === id) setSelectedId(null);
    await reloadClusters();
  };

  const selected = clusters.find((c) => c.id === selectedId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Кластеры</h3>
          <button onClick={() => setShowNew((v) => !v)} className="text-xs font-semibold text-[#029cda]">+ Новый</button>
        </div>
        {showNew && (
          <div className="bg-[#F6F7F9] rounded-xl p-3 mb-3">
            <input className={inputClass()} placeholder="Заголовок темы кластера" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createCluster(); }} />
            <div className="flex gap-2 mt-2">
              <button onClick={createCluster} className="px-3 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg">Создать</button>
              <button onClick={() => setShowNew(false)} className="px-3 py-1.5 text-xs text-gray-500">Отмена</button>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          {clusters.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">Кластеров пока нет.</p>}
          {clusters.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedId === c.id ? "bg-[#029cda]/10 text-[#029cda] font-medium" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"}`}>
              <p className="truncate">{c.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{CONTENT_CLUSTER_STATUSES.find((s) => s.key === c.status)?.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        {!selected && (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-sm text-gray-400">
            Выберите кластер слева или создайте новый.
          </div>
        )}
        {selected && (
          <ClusterWorkspace cluster={selected} channels={channels} onDelete={() => removeCluster(selected.id)} onStatusChanged={reloadClusters} />
        )}
      </div>
    </div>
  );
}

interface VersionState { body: string; title: string; generating: boolean; error: string; dirty: boolean }
const emptyVersion = (): VersionState => ({ body: "", title: "", generating: false, error: "" , dirty: false });

function ClusterWorkspace({ cluster, channels, onDelete, onStatusChanged }: {
  cluster: ContentCluster;
  channels: ContentChannelProfile[];
  onDelete: () => void;
  onStatusChanged: () => Promise<void>;
}) {
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [angle, setAngle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<ContentOsChannel[]>([]);
  const [briefSaving, setBriefSaving] = useState(false);
  const [briefSaved, setBriefSaved] = useState(false);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [activeChannel, setActiveChannel] = useState<ContentOsChannel | "">("");
  const [drafts, setDrafts] = useState<Record<string, VersionState>>({});

  const loadAll = useCallback(async () => {
    const [brief, itemRows] = await Promise.all([getBrief(cluster.id), listClusterItems(cluster.id)]);
    if (brief) {
      setAudience(brief.audience || AUDIENCES[0]);
      setAngle(brief.angle || "");
      setRequirements(brief.requirements || "");
      setSelectedChannels(brief.channels || []);
    } else {
      setAudience(AUDIENCES[0]); setAngle(""); setRequirements(""); setSelectedChannels([]);
    }
    setItems(itemRows);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const it of itemRows) if (!next[it.channel]) next[it.channel] = { body: it.body, title: it.title, generating: false, error: "", dirty: false };
      return next;
    });
  }, [cluster.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!activeChannel && selectedChannels.length > 0) setActiveChannel(selectedChannels[0]);
    if (activeChannel && !selectedChannels.includes(activeChannel)) setActiveChannel(selectedChannels[0] || "");
  }, [selectedChannels, activeChannel]);

  const toggleChannel = (id: ContentOsChannel) => {
    setSelectedChannels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setBriefSaved(false);
  };

  const saveBriefNow = async () => {
    setBriefSaving(true);
    try {
      await saveBrief(cluster.id, { audience, angle, requirements, channels: selectedChannels });
      setBriefSaved(true);
      await onStatusChanged();
    } finally {
      setBriefSaving(false);
    }
  };

  const itemFor = (channel: ContentOsChannel) => items.find((i) => i.channel === channel) || null;

  const generate = async (channel: ContentOsChannel) => {
    setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || emptyVersion()), generating: true, error: "" } }));
    try {
      const existing = itemFor(channel);
      const res = await generateDraft({
        clusterId: cluster.id, channel, topicTitle: cluster.title, audience, angle, requirements,
        contentItemId: existing?.id,
      });
      setDrafts((prev) => ({ ...prev, [channel]: { title: res.title, body: res.body, generating: false, error: "", dirty: true } }));
    } catch (e) {
      setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || emptyVersion()), generating: false, error: e instanceof Error ? e.message : "Ошибка генерации" } }));
    }
  };

  const setBody = (channel: ContentOsChannel, body: string) => {
    setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || emptyVersion()), body, dirty: true } }));
  };

  const saveItem = async (channel: ContentOsChannel, status?: ContentItem["status"]) => {
    const draft = drafts[channel] || emptyVersion();
    const existing = itemFor(channel);
    await upsertItem({
      id: existing?.id, cluster_id: cluster.id, channel,
      title: draft.title || cluster.title, body: draft.body,
      status: status ?? existing?.status ?? "draft",
    });
    setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || emptyVersion()), dirty: false } }));
    await loadAll();
  };

  const active = activeChannel ? channels.find((c) => c.id === activeChannel) : null;
  const activeDraft = activeChannel ? drafts[activeChannel] || emptyVersion() : null;
  const activeItem = activeChannel ? itemFor(activeChannel) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{cluster.title}</h2>
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">Удалить кластер</button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 Бриф</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Аудитория</label>
            <Select value={audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a, label: a }))} />
          </div>
          <div>
            <label className={labelCls}>Ракурс подачи</label>
            <input className={inputClass()} value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="Например: через кейс клиента" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Требования</label>
            <textarea className={inputClass()} rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
          </div>
        </div>
        <label className={labelCls}>Каналы</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {CONTENT_OS_CHANNELS.map((c) => (
            <button key={c.key} onClick={() => toggleChannel(c.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${selectedChannels.includes(c.key) ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-600"}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <button onClick={saveBriefNow} disabled={briefSaving} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
          {briefSaving ? "Сохранение..." : briefSaved ? "Сохранено" : "Сохранить бриф"}
        </button>
      </div>

      {selectedChannels.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-400">
          Выберите каналы в брифе, чтобы начать генерацию контента.
        </div>
      )}

      {selectedChannels.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedChannels.map((ch) => {
              const p = channels.find((x) => x.id === ch);
              const meta = CONTENT_OS_CHANNELS.find((x) => x.key === ch);
              const it = itemFor(ch);
              return (
                <button key={ch} onClick={() => setActiveChannel(ch)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${activeChannel === ch ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-500"}`}>
                  {meta?.icon} {p?.name} {it && <span className="opacity-70">· {CONTENT_ITEM_STATUSES.find((s) => s.key === it.status)?.label}</span>}
                </button>
              );
            })}
          </div>

          {active && activeDraft && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Лимит: {active.char_limit} символов</span>
                <button onClick={() => generate(active.id)} disabled={activeDraft.generating} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/15 disabled:opacity-50">
                  {activeDraft.generating ? "Генерация..." : "🤖 Сгенерировать"}
                </button>
              </div>
              {activeDraft.error && <div className="mb-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs">{activeDraft.error}</div>}
              <input className={`${inputClass()} mb-2 font-medium`} value={activeDraft.title} onChange={(e) => setDrafts((prev) => ({ ...prev, [active.id]: { ...prev[active.id], title: e.target.value, dirty: true } }))} placeholder="Заголовок" />
              <textarea className={inputClass()} rows={12} value={activeDraft.body} onChange={(e) => setBody(active.id, e.target.value)} placeholder="Текст появится здесь после генерации — или введите вручную." />
              <p className={`text-xs mt-1 text-right ${activeDraft.body.length > active.char_limit ? "text-red-500" : "text-gray-400"}`}>
                {activeDraft.body.length} / {active.char_limit}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => saveItem(active.id, "draft")} className="px-4 py-2 bg-[#F6F7F9] text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-100">
                  Сохранить черновик
                </button>
                <button onClick={() => saveItem(active.id, "review")} className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100">
                  На проверку
                </button>
                <button onClick={() => saveItem(active.id, "approved")} className="px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-xl hover:bg-green-100">
                  ✅ Утвердить
                </button>
              </div>
              {activeItem && <VersionHistory itemId={activeItem.id} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VersionHistory({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ContentItemVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!loaded) { setVersions(await listItemVersions(itemId)); setLoaded(true); }
    setOpen((v) => !v);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button onClick={load} className="text-xs text-gray-400 hover:text-gray-700">
        {open ? "Скрыть историю версий" : "Показать историю версий"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {versions.length === 0 && <p className="text-xs text-gray-400">Изменений пока нет.</p>}
          {versions.map((v) => (
            <div key={v.id} className="text-xs bg-[#F6F7F9] rounded-lg p-2">
              <p className="text-gray-400">{new Date(v.created_at).toLocaleString("ru-RU")} · {v.edited_by || "—"}</p>
              <p className="text-gray-600 line-clamp-2 mt-0.5">{v.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
