"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import {
  addFactCheck,
  generateDraft,
  getBrief,
  getCluster,
  getResearchPack,
  getSeo,
  listClusterItems,
  listFactChecks,
  listItemVersions,
  listQcChecks,
  runQcCheck,
  publishItem,
  saveBrief,
  saveSeo,
  synthesizeResearch,
  upsertItem,
  upsertPublication,
} from "@/lib/contentOsStore";
import {
  CONTENT_ITEM_STATUSES,
  CONTENT_OS_CHANNELS,
  QC_CHECK_LABELS,
  type ContentChannelProfile,
  type ContentCluster,
  type ContentFactCheck,
  type ContentItem,
  type ContentItemVersion,
  type ContentOsChannel,
  type ContentQcCheck,
  type ContentSeo,
  type QcCheckType,
} from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const AUDIENCES = ["Руководители МСУ", "Сотрудники МСУ (ЖКХ, благоустройство)", "Депутаты", "Широкая аудитория"];

interface VersionState { body: string; title: string; generating: boolean; error: string; model?: string }
const emptyVersion = (): VersionState => ({ body: "", title: "", generating: false, error: "" });

export default function ClusterDetail({ clusterId, channels, onClose, onChanged }: {
  clusterId: string;
  channels: ContentChannelProfile[];
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [cluster, setCluster] = useState<ContentCluster | null>(null);
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [angle, setAngle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<ContentOsChannel[]>([]);
  const [briefSaving, setBriefSaving] = useState(false);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [activeChannel, setActiveChannel] = useState<ContentOsChannel | "">("");
  const [drafts, setDrafts] = useState<Record<string, VersionState>>({});

  const loadAll = useCallback(async () => {
    const [c, brief, itemRows] = await Promise.all([getCluster(clusterId), getBrief(clusterId), listClusterItems(clusterId)]);
    setCluster(c);
    if (brief) {
      setAudience(brief.audience || AUDIENCES[0]);
      setAngle(brief.angle || "");
      setRequirements(brief.requirements || "");
      setSelectedChannels(brief.channels || []);
    }
    setItems(itemRows);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const it of itemRows) if (!next[it.channel]) next[it.channel] = { body: it.body, title: it.title, generating: false, error: "" };
      return next;
    });
  }, [clusterId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!activeChannel && selectedChannels.length > 0) setActiveChannel(selectedChannels[0]);
    if (activeChannel && !selectedChannels.includes(activeChannel)) setActiveChannel(selectedChannels[0] || "");
  }, [selectedChannels, activeChannel]);

  const toggleChannel = (id: ContentOsChannel) => setSelectedChannels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saveBriefNow = async () => {
    setBriefSaving(true);
    try { await saveBrief(clusterId, { audience, angle, requirements, channels: selectedChannels }); onChanged?.(); }
    finally { setBriefSaving(false); }
  };

  const itemFor = (channel: ContentOsChannel) => items.find((i) => i.channel === channel) || null;

  const generate = async (channel: ContentOsChannel) => {
    if (!cluster) return;
    setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || emptyVersion()), generating: true, error: "" } }));
    try {
      const existing = itemFor(channel);
      const res = await generateDraft({ clusterId, channel, topicTitle: cluster.title, audience, angle, requirements, contentItemId: existing?.id });
      setDrafts((prev) => ({ ...prev, [channel]: { title: res.title, body: res.body, generating: false, error: "", model: res.model } }));
    } catch (e) {
      setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || emptyVersion()), generating: false, error: e instanceof Error ? e.message : "Ошибка генерации" } }));
    }
  };

  const saveItem = async (channel: ContentOsChannel, status?: ContentItem["status"]) => {
    const draft = drafts[channel] || emptyVersion();
    const existing = itemFor(channel);
    await upsertItem({ id: existing?.id, cluster_id: clusterId, channel, title: draft.title || cluster?.title || "", body: draft.body, status: status ?? existing?.status ?? "draft" });
    await loadAll();
    onChanged?.();
  };

  const active = activeChannel ? channels.find((c) => c.id === activeChannel) : null;
  const activeDraft = activeChannel ? drafts[activeChannel] || emptyVersion() : null;
  const activeItem = activeChannel ? itemFor(activeChannel) : null;

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{cluster?.title || "Загрузка..."}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm">✕ Закрыть</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-[#F6F7F9] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 Бриф</h3>
              <label className={labelCls}>Аудитория</label>
              <Select value={audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a, label: a }))} className="mb-2" />
              <label className={labelCls}>Ракурс подачи</label>
              <input className={`${inputClass()} mb-2`} value={angle} onChange={(e) => setAngle(e.target.value)} />
              <label className={labelCls}>Требования</label>
              <textarea className={`${inputClass()} mb-2`} rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
              <label className={labelCls}>Каналы</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {CONTENT_OS_CHANNELS.map((c) => (
                  <button key={c.key} onClick={() => toggleChannel(c.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${selectedChannels.includes(c.key) ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-600"}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              <button onClick={saveBriefNow} disabled={briefSaving} className="w-full px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
                {briefSaving ? "Сохранение..." : "Сохранить бриф"}
              </button>
            </div>

            <ResearchPanel clusterId={clusterId} />
          </div>

          <div className="max-h-[75vh] overflow-y-auto pr-1">
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
                      <span className="text-xs text-gray-400">
                        Лимит: {active.char_limit} символов
                        {activeDraft.model && <> · написано моделью <span className="font-medium text-gray-600">{activeDraft.model}</span></>}
                      </span>
                      <button onClick={() => generate(active.id)} disabled={activeDraft.generating} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/15 disabled:opacity-50">
                        {activeDraft.generating ? "Генерация..." : "🤖 Сгенерировать"}
                      </button>
                    </div>
                    {activeDraft.error && <div className="mb-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs">{activeDraft.error}</div>}
                    <input className={`${inputClass()} mb-2 font-medium`} value={activeDraft.title} onChange={(e) => setDrafts((prev) => ({ ...prev, [active.id]: { ...prev[active.id], title: e.target.value } }))} placeholder="Заголовок" />
                    <textarea className={inputClass()} rows={10} value={activeDraft.body} onChange={(e) => setDrafts((prev) => ({ ...prev, [active.id]: { ...prev[active.id], body: e.target.value } }))} placeholder="Текст появится здесь после генерации — или введите вручную." />
                    <p className={`text-xs mt-1 text-right ${activeDraft.body.length > active.char_limit ? "text-red-500" : "text-gray-400"}`}>{activeDraft.body.length} / {active.char_limit}</p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button onClick={() => saveItem(active.id, "draft")} className="px-4 py-2 bg-[#F6F7F9] text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-100">Сохранить черновик</button>
                      <button onClick={() => saveItem(active.id, "review")} className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100">На проверку</button>
                      <button onClick={() => saveItem(active.id, "approved")} className="px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-xl hover:bg-green-100">✅ Утвердить</button>
                    </div>

                    {activeItem && (
                      <>
                        <QcPanel itemId={activeItem.id} />
                        {active.id === "article" && <SeoPanel itemId={activeItem.id} />}
                        <FactCheckPanel itemId={activeItem.id} />
                        <PublishPanel item={activeItem} onChanged={loadAll} />
                        <VersionHistory itemId={activeItem.id} />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearchPanel({ clusterId }: { clusterId: string }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string; extracted_text: string }[]>([{ title: "", url: "", extracted_text: "" }]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!loaded) {
      const pack = await getResearchPack(clusterId);
      if (pack) setSummary(pack.summary);
      setLoaded(true);
    }
    setOpen((v) => !v);
  };

  const addRow = () => setSources((prev) => [...prev, { title: "", url: "", extracted_text: "" }]);
  const setRow = (i: number, key: "title" | "url" | "extracted_text", value: string) =>
    setSources((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));

  const synthesize = async () => {
    const valid = sources.filter((s) => s.extracted_text.trim());
    if (valid.length === 0) return;
    setBusy(true);
    try { const res = await synthesizeResearch(clusterId, valid); setSummary(res.summary); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-[#F6F7F9] rounded-2xl p-4">
      <button onClick={load} className="text-sm font-semibold text-gray-800 w-full text-left">🔎 Исследования {open ? "▲" : "▼"}</button>
      {open && (
        <div className="mt-3">
          {summary && <div className="text-xs text-gray-600 bg-white rounded-xl p-3 mb-3 whitespace-pre-wrap">{summary}</div>}
          {!summary && <p className="text-xs text-gray-400 mb-2">Подборка исследований ещё не собрана.</p>}
          <p className="text-[11px] text-gray-500 mb-2">Добавьте источники (заголовок + текст) — синтез только по ним, без поиска в интернете (см. integrations.md).</p>
          {sources.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-2 mb-2 space-y-1">
              <input className={inputClass()} placeholder="Заголовок источника" value={s.title} onChange={(e) => setRow(i, "title", e.target.value)} />
              <input className={inputClass()} placeholder="URL" value={s.url} onChange={(e) => setRow(i, "url", e.target.value)} />
              <textarea className={inputClass()} rows={2} placeholder="Текст источника" value={s.extracted_text} onChange={(e) => setRow(i, "extracted_text", e.target.value)} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={addRow} className="text-xs text-gray-500 hover:text-gray-800">+ Источник</button>
            <button onClick={synthesize} disabled={busy} className="ml-auto px-3 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg disabled:opacity-60">
              {busy ? "Синтез..." : "🤖 Собрать research pack"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QcPanel({ itemId }: { itemId: string }) {
  const [checks, setChecks] = useState<ContentQcCheck[]>([]);
  const [running, setRunning] = useState<QcCheckType | null>(null);

  const load = useCallback(async () => setChecks(await listQcChecks(itemId)), [itemId]);
  useEffect(() => { load(); }, [load]);

  const run = async (type: QcCheckType) => {
    setRunning(type);
    try { await runQcCheck(itemId, type); await load(); }
    catch { /* показывать статус ошибки не критично здесь — просто не обновится */ }
    finally { setRunning(null); }
  };

  const statusColor: Record<string, string> = { pass: "bg-green-50 text-green-700", review: "bg-amber-50 text-amber-700", fail: "bg-red-50 text-red-700" };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-700 mb-2">🛡️ Проверка качества</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(["brand", "seo", "fact"] as QcCheckType[]).map((type) => {
          const check = checks.find((c) => c.check_type === type);
          return (
            <div key={type} className="bg-[#F6F7F9] rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{QC_CHECK_LABELS[type]}</span>
                {check && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[check.status]}`}>{check.status}</span>}
              </div>
              {check?.notes && <p className="text-[11px] text-gray-500 mb-1 line-clamp-2">{check.notes}</p>}
              <button onClick={() => run(type)} disabled={running === type} className="text-[11px] text-[#029cda] hover:underline disabled:opacity-50">
                {running === type ? "Проверка..." : check ? "Перепроверить" : "Проверить"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeoPanel({ itemId }: { itemId: string }) {
  const [seo, setSeo] = useState<Partial<ContentSeo>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSeo(itemId).then((s) => setSeo(s || {})); }, [itemId]);

  const save = async () => {
    setSaving(true);
    try { await saveSeo(itemId, seo); } finally { setSaving(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-700 mb-2">🔍 SEO</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input className={inputClass()} placeholder="Основной keyword" value={seo.primary_keyword || ""} onChange={(e) => setSeo((s) => ({ ...s, primary_keyword: e.target.value }))} />
        <input className={inputClass()} placeholder="URL (слаг)" value={seo.slug || ""} onChange={(e) => setSeo((s) => ({ ...s, slug: e.target.value }))} />
      </div>
      <input className={`${inputClass()} mb-2`} placeholder="Meta-заголовок" value={seo.meta_title || ""} onChange={(e) => setSeo((s) => ({ ...s, meta_title: e.target.value }))} />
      <textarea className={`${inputClass()} mb-2`} rows={2} placeholder="Meta-описание" value={seo.meta_description || ""} onChange={(e) => setSeo((s) => ({ ...s, meta_description: e.target.value }))} />
      <input className={`${inputClass()} mb-2`} placeholder="H1" value={seo.h1 || ""} onChange={(e) => setSeo((s) => ({ ...s, h1: e.target.value }))} />
      <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg disabled:opacity-60">{saving ? "Сохранение..." : "Сохранить SEO"}</button>
    </div>
  );
}

function FactCheckPanel({ itemId }: { itemId: string }) {
  const [checks, setChecks] = useState<ContentFactCheck[]>([]);
  const [claim, setClaim] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => setChecks(await listFactChecks(itemId)), [itemId]);
  useEffect(() => { if (open) load(); }, [open, load]);

  const add = async () => {
    if (!claim.trim()) return;
    await addFactCheck(itemId, { claim: claim.trim(), verdict: "verified", source_url: sourceUrl.trim() });
    setClaim(""); setSourceUrl(""); await load();
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-gray-700">📌 Проверенные факты {open ? "▲" : "▼"}</button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {checks.map((c) => (
            <div key={c.id} className="text-[11px] bg-[#F6F7F9] rounded-lg p-2">
              <span className={c.verdict === "verified" ? "text-green-600" : c.verdict === "false" ? "text-red-600" : "text-amber-600"}>{c.verdict}</span> — {c.claim}
              {c.source_url && <a href={c.source_url} target="_blank" rel="noreferrer" className="text-[#029cda] ml-1">источник</a>}
            </div>
          ))}
          <div className="flex gap-1.5">
            <input className={`${inputClass()} text-xs`} placeholder="Утверждение" value={claim} onChange={(e) => setClaim(e.target.value)} />
            <input className={`${inputClass()} text-xs w-32`} placeholder="URL источника" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            <button onClick={add} className="px-2.5 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg whitespace-nowrap">+</button>
          </div>
        </div>
      )}
    </div>
  );
}

const AUTO_PUBLISH_CHANNELS: ContentItem["channel"][] = ["vk", "telegram"];

function PublishPanel({ item, onChanged }: { item: ContentItem; onChanged: () => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);

  const markPublished = async () => {
    setBusy(true);
    try {
      await upsertPublication({ content_item_id: item.id, channel: item.channel, status: "published", url: url || undefined, published_at: Date.now() });
      await upsertItem({ id: item.id, cluster_id: item.cluster_id, channel: item.channel, status: "published" });
      onChanged();
    } finally { setBusy(false); }
  };

  const canAutoPublish = AUTO_PUBLISH_CHANNELS.includes(item.channel);

  const autoPublish = async () => {
    setBusy(true);
    setAutoError(null);
    try {
      const result = await publishItem(item.id, item.channel);
      if (result.status === "failed") { setAutoError(result.error ?? "Ошибка публикации"); return; }
      onChanged();
    } catch (e) {
      setAutoError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  if (item.status !== "approved" && item.status !== "published") return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-700 mb-2">🚀 Публикация</p>
      {item.status === "published" ? (
        <p className="text-xs text-green-600">Опубликовано.</p>
      ) : (
        <div className="space-y-2">
          {canAutoPublish && (
            <button onClick={autoPublish} disabled={busy} className="w-full px-3 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg disabled:opacity-60">
              {busy ? "Публикуем..." : `🚀 Опубликовать в ${item.channel === "vk" ? "ВКонтакте" : "Telegram"}`}
            </button>
          )}
          {autoError && <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2 py-1">{autoError}</p>}
          <div className="flex gap-2">
            <input className={inputClass()} placeholder="Ссылка на публикацию (если опубликовали вручную)" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button onClick={markPublished} disabled={busy} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg whitespace-nowrap disabled:opacity-60">
              {busy ? "..." : "Отметить вручную"}
            </button>
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-1">
        {canAutoPublish
          ? "Автопубликация использует токен из вкладки «Каналы». Если он не настроен или истёк — используйте ручную отметку."
          : "Для этого канала автопубликация пока не поддерживается (нет официального API — см. integrations.md) — опубликуйте вручную и отметьте здесь."}
      </p>
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
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button onClick={load} className="text-xs text-gray-400 hover:text-gray-700">{open ? "Скрыть историю версий" : "Показать историю версий"}</button>
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
