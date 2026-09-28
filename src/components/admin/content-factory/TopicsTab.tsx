"use client";

import React, { useMemo, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import {
  deleteRubric,
  deleteTopic,
  reorderRubric,
  reorderTopic,
  upsertRubric,
  upsertTopic,
} from "@/lib/contentFactoryStore";
import {
  CF_TOPIC_STATUSES,
  relevanceTone,
  rubricColor,
  rubricLabel,
  type CfRubric,
  type CfTopic,
  type CfTopicStatus,
} from "@/lib/contentFactoryTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const toneBg: Record<string, string> = { high: "#dcfce7", med: "#fef3c7", low: "#fee2e2" };
const toneFg: Record<string, string> = { high: "#16a34a", med: "#b45309", low: "#dc2626" };

const EMPTY_FORM = { id: "", title: "", rubric_id: "", source_name: "", source_url: "", thesis: "", relevance: 7, popularity: 60, status: "new" as CfTopicStatus };

export default function TopicsTab({
  rubrics, topics, reload, reloadRubrics, onOpenInEditor,
}: {
  rubrics: CfRubric[];
  topics: CfTopic[];
  reload: () => Promise<void>;
  reloadRubrics: () => Promise<void>;
  onOpenInEditor: (topicId: string) => void;
}) {
  const [sort, setSort] = useState<"manual" | "popularity" | "relevance">("popularity");
  const [statusFilter, setStatusFilter] = useState("");
  const [rubricFilter, setRubricFilter] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showRubrics, setShowRubrics] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    let list = topics.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (rubricFilter && t.rubric_id !== rubricFilter) return false;
      if (q.trim() && !t.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    list = [...list];
    if (sort === "popularity") list.sort((a, b) => b.popularity - a.popularity);
    else if (sort === "relevance") list.sort((a, b) => b.relevance - a.relevance);
    else list.sort((a, b) => a.sort_order - b.sort_order);
    return list;
  }, [topics, statusFilter, rubricFilter, q, sort]);

  const openNew = () => { setForm(EMPTY_FORM); setError(""); setShowForm(true); };
  const openEdit = (t: CfTopic) => {
    setForm({
      id: t.id, title: t.title, rubric_id: t.rubric_id ?? "", source_name: t.source_name,
      source_url: t.source_url, thesis: t.thesis, relevance: t.relevance, popularity: t.popularity, status: t.status,
    });
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setError("Укажите заголовок темы"); return; }
    setSaving(true); setError("");
    try {
      await upsertTopic({
        id: form.id || undefined,
        title: form.title.trim(),
        rubric_id: form.rubric_id || null,
        source_name: form.source_name.trim(),
        source_url: form.source_url.trim(),
        thesis: form.thesis.trim(),
        relevance: Number(form.relevance) || 5,
        popularity: Number(form.popularity) || 50,
        status: form.status,
      });
      await reload();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить тему?")) return;
    try { await deleteTopic(id); await reload(); } catch { alert("Ошибка удаления"); }
  };

  const move = async (id: string, dir: "up" | "down") => {
    await reorderTopic(id, dir);
    await reload();
  };

  const changeStatus = async (t: CfTopic, status: CfTopicStatus) => {
    await upsertTopic({ id: t.id, status });
    await reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Темы</h2>
          <p className="text-sm text-gray-500">Редакционный портфель: рубрики, релевантность, популярность, статус</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRubrics((v) => !v)} className="px-3 py-2 rounded-xl text-sm font-medium bg-[#F6F7F9] text-gray-700 hover:text-gray-900">
            🏷️ Рубрики
          </button>
          <button onClick={openNew} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] transition-colors">
            + Создать тему
          </button>
        </div>
      </div>

      {showRubrics && (
        <RubricsPanel rubrics={rubrics} reload={reloadRubrics} onClose={() => setShowRubrics(false)} />
      )}

      {showForm && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
          <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-5">{form.id ? "Редактировать тему" : "Новая тема"}</h3>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Заголовок темы *</label>
              <input className={inputClass()} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Напр.: Опыт Финляндии: цифровой реестр захоронений" />
            </div>
            <div>
              <label className={labelCls}>Рубрика</label>
              <Select value={form.rubric_id} onChange={(v) => setForm((f) => ({ ...f, rubric_id: v }))}
                options={[{ value: "", label: "Без рубрики" }, ...rubrics.map((r) => ({ value: r.id, label: `${r.icon} ${r.name}` }))]} />
            </div>
            <div>
              <label className={labelCls}>Статус</label>
              <Select value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v as CfTopicStatus }))}
                options={CF_TOPIC_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />
            </div>
            <div>
              <label className={labelCls}>Источник</label>
              <input className={inputClass()} value={form.source_name} onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))} placeholder="Название источника / вручную" />
            </div>
            <div>
              <label className={labelCls}>Ссылка на первоисточник</label>
              <input className={inputClass()} value={form.source_url} onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Релевантность (1–10)</label>
              <input type="number" min={1} max={10} className={inputClass()} value={form.relevance} onChange={(e) => setForm((f) => ({ ...f, relevance: Number(e.target.value) }))} />
            </div>
            <div>
              <label className={labelCls}>Популярность (1–100)</label>
              <input type="number" min={1} max={100} className={inputClass()} value={form.popularity} onChange={(e) => setForm((f) => ({ ...f, popularity: Number(e.target.value) }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Тезисы / заметки</label>
              <textarea className={inputClass()} rows={3} value={form.thesis} onChange={(e) => setForm((f) => ({ ...f, thesis: e.target.value }))} placeholder="Ключевые мысли, которые надо отразить..." />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Отмена</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Select value={sort} onChange={(v) => setSort(v as typeof sort)} className="w-52"
          options={[{ value: "popularity", label: "Сначала популярные" }, { value: "relevance", label: "По релевантности" }, { value: "manual", label: "Ручной порядок" }]} />
        <Select value={statusFilter} onChange={setStatusFilter} className="w-44"
          options={[{ value: "", label: "Все статусы" }, ...CF_TOPIC_STATUSES.map((s) => ({ value: s.key, label: s.label }))]} />
        <input className={`${inputClass()} w-56`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск темы..." />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button onClick={() => setRubricFilter("")} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${rubricFilter === "" ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-500"}`}>Все рубрики</button>
        {rubrics.map((r) => (
          <button key={r.id} onClick={() => setRubricFilter(r.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${rubricFilter === r.id ? "text-white border-transparent" : "border-gray-200 text-gray-500"}`}
            style={rubricFilter === r.id ? { background: r.color } : undefined}>
            {r.icon} {r.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">Тем не найдено.</p>}
        {visible.map((t, idx) => {
          const tone = relevanceTone(t.relevance);
          return (
            <div key={t.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
              {sort === "manual" && (
                <div className="flex flex-col gap-0.5 pt-1">
                  <button disabled={idx === 0} onClick={() => move(t.id, "up")} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▲</button>
                  <button disabled={idx === visible.length - 1} onClick={() => move(t.id, "down")} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▼</button>
                </div>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background: toneBg[tone], color: toneFg[tone] }}>
                {t.relevance}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {t.rubric_id && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: rubricColor(rubrics, t.rubric_id) }}>
                      {rubricLabel(rubrics, t.rubric_id)}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">Популярность {t.popularity}</span>
                  {t.source_url ? (
                    <a href={t.source_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#029cda] hover:underline">{t.source_name || "источник"}</a>
                  ) : t.source_name ? (
                    <span className="text-[11px] text-gray-400">{t.source_name}</span>
                  ) : null}
                  <Select value={t.status} onChange={(v) => changeStatus(t, v as CfTopicStatus)} className="w-36"
                    options={CF_TOPIC_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />
                </div>
                {t.thesis && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{t.thesis}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button onClick={() => onOpenInEditor(t.id)} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/15">✍️ В редактор</button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="px-2 py-1 rounded-lg text-[11px] text-gray-500 hover:text-gray-900">Изм.</button>
                  <button onClick={() => remove(t.id)} className="px-2 py-1 rounded-lg text-[11px] text-red-500 hover:text-red-700">Удал.</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RubricsPanel({ rubrics, reload, onClose }: { rubrics: CfRubric[]; reload: () => Promise<void>; onClose: () => void }) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🏷️");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try { await upsertRubric({ name: newName.trim(), icon: newIcon.trim() || "🏷️", color: "#029cda" }); setNewName(""); setNewIcon("🏷️"); await reload(); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить рубрику? Темы останутся, но без рубрики.")) return;
    await deleteRubric(id); await reload();
  };
  const move = async (id: string, dir: "up" | "down") => { await reorderRubric(id, dir); await reload(); };

  return (
    <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-[#1a1a1a]">🏷️ Управление рубриками</h3>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Закрыть</button>
      </div>
      <div className="space-y-2 mb-4">
        {rubrics.map((r, idx) => (
          <div key={r.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <button disabled={idx === 0} onClick={() => move(r.id, "up")} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-[10px]">▲</button>
              <button disabled={idx === rubrics.length - 1} onClick={() => move(r.id, "down")} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-[10px]">▼</button>
            </div>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: r.color }}>{r.icon}</span>
            <span className="flex-1 text-sm text-gray-800">{r.name}</span>
            <button onClick={() => remove(r.id)} className="text-[11px] text-red-500 hover:text-red-700">Удалить</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input className={`${inputClass()} w-14 text-center`} value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🏷️" />
        <input className={inputClass()} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название новой рубрики" onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <button disabled={busy} onClick={add} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60 whitespace-nowrap">+ Добавить</button>
      </div>
    </div>
  );
}
