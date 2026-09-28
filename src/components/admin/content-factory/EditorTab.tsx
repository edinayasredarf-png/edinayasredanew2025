"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { ToggleRow } from "@/components/admin/ui/Toggle";
import {
  generateContent,
  getPlanItem,
  listPlanVersions,
  upsertPlanItem,
  upsertPlanVersion,
  upsertTopic,
} from "@/lib/contentFactoryStore";
import {
  CF_PLAN_TYPES,
  EMPTY_QA,
  type CfPlanType,
  type CfPlatform,
  type CfQaChecklist,
  type CfTopic,
} from "@/lib/contentFactoryTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const AUDIENCES = ["Руководители МСУ", "Сотрудники МСУ (ЖКХ, благоустройство)", "Депутаты", "Широкая аудитория"];

interface VersionState { body: string; qa: CfQaChecklist; generating: boolean; error: string }
const emptyVersion = (): VersionState => ({ body: "", qa: { ...EMPTY_QA }, generating: false, error: "" });

function toDateInput(ms: number): string { return new Date(ms).toISOString().slice(0, 10); }
function toTimeInput(ms: number): string { return new Date(ms).toISOString().slice(11, 16); }
function combineDateTime(date: string, time: string): number {
  const t = new Date(`${date}T${time || "12:00"}:00`).getTime();
  return Number.isFinite(t) ? t : Date.now();
}
function tomorrowNoon(): number { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); return d.getTime(); }

export default function EditorTab({
  topics, platforms, initialTopicId, initialPlanId, onConsumedInitial, reloadTopics,
}: {
  topics: CfTopic[];
  platforms: CfPlatform[];
  initialTopicId: string | null;
  initialPlanId: string | null;
  onConsumedInitial: () => void;
  reloadTopics: () => Promise<void>;
}) {
  const [topicId, setTopicId] = useState("");
  const [freeTitle, setFreeTitle] = useState("");
  const [type, setType] = useState<CfPlanType>("post");
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [emoji, setEmoji] = useState<"auto" | "0" | "1" | "2" | "3">("auto");
  const [requirements, setRequirements] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [useSource, setUseSource] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [activePlatform, setActivePlatform] = useState<string>("");
  const [date, setDate] = useState(toDateInput(tomorrowNoon()));
  const [time, setTime] = useState(toTimeInput(tomorrowNoon()));
  const [versions, setVersions] = useState<Record<string, VersionState>>({});
  const [planId, setPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const topic = useMemo(() => topics.find((t) => t.id === topicId) || null, [topics, topicId]);

  useEffect(() => {
    if (initialTopicId) {
      setTopicId(initialTopicId);
      onConsumedInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopicId]);

  useEffect(() => {
    if (!initialPlanId) return;
    onConsumedInitial();
    getPlanItem(initialPlanId).then((item) => {
      if (item.topic_id) setTopicId(item.topic_id); else setFreeTitle(item.title);
      setType(item.type);
      setDate(toDateInput(item.scheduled_at));
      setTime(toTimeInput(item.scheduled_at));
      setSelectedPlatforms(item.platforms);
      setPlanId(item.id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanId]);

  useEffect(() => {
    if (topic) setSourceUrl(topic.source_url || "");
  }, [topic]);

  useEffect(() => {
    if (!activePlatform && selectedPlatforms.length > 0) setActivePlatform(selectedPlatforms[0]);
    if (activePlatform && !selectedPlatforms.includes(activePlatform)) setActivePlatform(selectedPlatforms[0] || "");
  }, [selectedPlatforms, activePlatform]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setVersions((prev) => (prev[id] ? prev : { ...prev, [id]: emptyVersion() }));
  };

  const effectiveTitle = topic?.title || freeTitle;
  const thesis = topic?.thesis || "";

  const generateOne = async (platformId: string) => {
    if (!effectiveTitle.trim()) { setSaveMsg({ kind: "err", text: "Укажите тему" }); return; }
    setVersions((prev) => ({ ...prev, [platformId]: { ...(prev[platformId] || emptyVersion()), generating: true, error: "" } }));
    try {
      const res = await generateContent({
        topicTitle: effectiveTitle,
        thesis,
        sourceName: topic?.source_name,
        sourceUrl: useSource ? sourceUrl : undefined,
        useSource,
        type,
        audience,
        requirements,
        emoji,
        platformId,
      });
      setVersions((prev) => ({ ...prev, [platformId]: { body: res.body, qa: { ...EMPTY_QA }, generating: false, error: "" } }));
    } catch (e) {
      setVersions((prev) => ({ ...prev, [platformId]: { ...(prev[platformId] || emptyVersion()), generating: false, error: e instanceof Error ? e.message : "Ошибка генерации" } }));
    }
  };

  const generateAll = async () => {
    setSaveMsg(null);
    await Promise.all(selectedPlatforms.map((id) => generateOne(id)));
  };

  const setBody = (platformId: string, body: string) => {
    setVersions((prev) => ({ ...prev, [platformId]: { ...(prev[platformId] || emptyVersion()), body } }));
  };
  const setQa = (platformId: string, key: keyof CfQaChecklist, value: boolean) => {
    setVersions((prev) => ({ ...prev, [platformId]: { ...(prev[platformId] || emptyVersion()), qa: { ...(prev[platformId]?.qa || EMPTY_QA), [key]: value } } }));
  };

  const saveToPlan = async () => {
    if (!effectiveTitle.trim()) { setSaveMsg({ kind: "err", text: "Укажите тему" }); return; }
    if (selectedPlatforms.length === 0) { setSaveMsg({ kind: "err", text: "Выберите хотя бы одну платформу" }); return; }
    setSaving(true); setSaveMsg(null);
    try {
      const scheduled_at = combineDateTime(date, time);
      const { id } = await upsertPlanItem({
        id: planId || undefined,
        topic_id: topic?.id || null,
        title: effectiveTitle,
        type,
        scheduled_at,
        platforms: selectedPlatforms,
        status: "draft",
      });
      setPlanId(id);
      for (const pid of selectedPlatforms) {
        const v = versions[pid];
        await upsertPlanVersion({ plan_id: id, platform_id: pid, body: v?.body || "", qa: v?.qa });
      }
      if (topic && topic.status === "new") {
        // тема перешла в работу
        await upsertTopic({ id: topic.id, status: "in_progress" });
        await reloadTopics();
      }
      setSaveMsg({ kind: "ok", text: "Сохранено в контент-план." });
    } catch (e) {
      setSaveMsg({ kind: "err", text: e instanceof Error ? e.message : "Ошибка сохранения" });
    } finally {
      setSaving(false);
    }
  };

  // Восстановление версий при повторном открытии уже сохранённого плана (после сохранения planId известен).
  useEffect(() => {
    if (!planId) return;
    listPlanVersions(planId).then((rows) => {
      setVersions((prev) => {
        const next = { ...prev };
        for (const r of rows) next[r.platform_id] = { body: r.body, qa: r.qa, generating: false, error: "" };
        return next;
      });
    }).catch(() => {});
  }, [planId]);

  const active = activePlatform ? platforms.find((p) => p.id === activePlatform) : null;
  const activeVersion = activePlatform ? versions[activePlatform] || emptyVersion() : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Редактор контента</h2>
          <p className="text-sm text-gray-500">Один смысл — несколько нативных версий под правила каждой площадки.</p>
        </div>
        <button onClick={saveToPlan} disabled={saving} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
          {saving ? "Сохранение..." : "💾 Сохранить в план"}
        </button>
      </div>

      {saveMsg && <div className={`mb-4 p-3 rounded-xl text-sm ${saveMsg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{saveMsg.text}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <label className={labelCls}>Тема из базы</label>
            <Select value={topicId} onChange={setTopicId} className="mb-3"
              options={[{ value: "", label: "— выбрать тему —" }, ...topics.map((t) => ({ value: t.id, label: t.title }))]} />
            {!topicId && (
              <>
                <label className={labelCls}>Или введите свободно</label>
                <textarea className={inputClass()} rows={2} value={freeTitle} onChange={(e) => setFreeTitle(e.target.value)} placeholder="Введите тему..." />
              </>
            )}
            {topic?.thesis && <p className="text-xs text-gray-500 mt-2">📌 {topic.thesis}</p>}

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelCls}>Тип</label>
                <Select value={type} onChange={(v) => setType(v as CfPlanType)} options={CF_PLAN_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
              </div>
              <div>
                <label className={labelCls}>Эмодзи</label>
                <Select value={emoji} onChange={(v) => setEmoji(v as typeof emoji)}
                  options={[{ value: "auto", label: "По правилам площадки" }, { value: "0", label: "Без эмодзи" }, { value: "1", label: "Минимум" }, { value: "2", label: "Умеренно" }, { value: "3", label: "Активно" }]} />
              </div>
            </div>
            <label className={`${labelCls} mt-3`}>Целевая аудитория</label>
            <Select value={audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a, label: a }))} />

            <label className={`${labelCls} mt-3`}>Дополнительные требования</label>
            <textarea className={inputClass()} rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Тон, объём, ключевые тезисы, запреты, CTA..." />

            <label className={`${labelCls} mt-3`}>Первоисточник</label>
            <input className={inputClass()} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
            <div className="mt-2"><ToggleRow checked={useSource} onChange={setUseSource}>Добавить ссылку в публикации</ToggleRow></div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelCls}>Дата публикации</label>
                <input type="date" className={inputClass()} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Время</label>
                <input type="time" className={inputClass()} value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <label className={`${labelCls} mt-3`}>Каналы публикации</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${selectedPlatforms.includes(p.id) ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-600"}`}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>

            <button onClick={generateAll} disabled={selectedPlatforms.length === 0} className="w-full mt-4 px-4 py-2.5 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-40">
              🤖 Сгенерировать для выбранных
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {selectedPlatforms.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-sm text-gray-400">
              Выберите платформы слева, чтобы начать генерацию текста.
            </div>
          )}
          {selectedPlatforms.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPlatforms.map((id) => {
                  const p = platforms.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <button key={id} onClick={() => setActivePlatform(id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${activePlatform === id ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-500"}`}>
                      {p.icon} {p.name}
                    </button>
                  );
                })}
              </div>

              {active && activeVersion && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Лимит: {active.char_limit} символов</span>
                    <button onClick={() => generateOne(active.id)} disabled={activeVersion.generating} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/15 disabled:opacity-50">
                      {activeVersion.generating ? "Генерация..." : "🤖 Сгенерировать"}
                    </button>
                  </div>
                  {activeVersion.error && <div className="mb-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs">{activeVersion.error}</div>}
                  <textarea className={inputClass()} rows={12} value={activeVersion.body} onChange={(e) => setBody(active.id, e.target.value)} placeholder="Текст появится здесь после генерации — или введите вручную." />
                  <p className={`text-xs mt-1 text-right ${activeVersion.body.length > active.char_limit ? "text-red-500" : "text-gray-400"}`}>
                    {activeVersion.body.length} / {active.char_limit}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <QaCheck label="Факты проверены" checked={activeVersion.qa.facts} onChange={(v) => setQa(active.id, "facts", v)} />
                    <QaCheck label="Первоисточник указан" checked={activeVersion.qa.source} onChange={(v) => setQa(active.id, "source", v)} />
                    <QaCheck label="Лимит площадки соблюдён" checked={activeVersion.body.length > 0 && activeVersion.body.length <= active.char_limit} onChange={() => {}} disabled />
                    <QaCheck label="Запрещённые слова — ок" checked={activeVersion.qa.forbidden} onChange={(v) => setQa(active.id, "forbidden", v)} />
                  </div>
                  <div className="mt-2">
                    <ToggleRow checked={activeVersion.qa.approved} onChange={(v) => setQa(active.id, "approved", v)} bordered>✅ Согласовано человеком</ToggleRow>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QaCheck({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg bg-[#F6F7F9] ${disabled ? "opacity-70" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="accent-[#029cda]" />
      <span className="text-gray-600">{label}</span>
    </label>
  );
}
