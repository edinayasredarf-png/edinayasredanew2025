'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface Template {
  key: string;
  name: string;
  body: string;
  header_image: string;
  signer_role: string;
  signature_image: string;
  signer_name: string;
  executor: string;
  filename_pattern: string;
}
interface Recipient {
  fio: string;
  position: string;
  number: string;
  date: string;
}

const TAGS = [
  '<<НОМЕР ПИСЬМА>>', '<<ДАТА>>', '<<ДОЛЖНОСТЬ>>', '<<Должность сокр>>',
  '<<Дательный падеж ФИО>>', '<<ОБРАЩЕНИЕ>>', '<<ИО>>', '<<Инициалы>>', '<<ФИО>>',
];

const emptyRow = (): Recipient => ({ fio: '', position: '', number: '', date: '' });

export default function LettersAdmin() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');
  const [draft, setDraft] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [rows, setRows] = useState<Recipient[]>([emptyRow()]);
  const [pasteText, setPasteText] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/letters/templates', { credentials: 'include' });
      const data = await res.json();
      if (data.templates?.length) {
        setTemplates(data.templates);
        setActiveKey((k) => k || data.templates[0].key);
      } else {
        setError(data.error || 'Не удалось загрузить шаблоны');
      }
    } catch {
      setError('Не удалось загрузить шаблоны');
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  useEffect(() => {
    const t = templates.find((x) => x.key === activeKey);
    if (t) setDraft({ ...t });
  }, [activeKey, templates]);

  const saveTemplate = async () => {
    if (!draft) return;
    setSaving(true); setStatus(''); setError('');
    try {
      const res = await fetch('/api/letters/templates', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Ошибка'); }
      setTemplates((ts) => ts.map((t) => (t.key === draft.key ? draft : t)));
      setStatus('Шаблон сохранён');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  const uploadImage = async (field: 'header_image' | 'signature_image', file: File) => {
    if (!draft) return;
    setUploading(field); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/uploads/image', { method: 'POST', body: form, credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Ошибка загрузки');
      setDraft({ ...draft, [field]: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки изображения');
    } finally { setUploading(''); }
  };

  const setRow = (i: number, patch: Partial<Recipient>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const importPaste = () => {
    const parsed = pasteText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const c = l.split('\t').length > 1 ? l.split('\t') : l.split(/\s*[;|]\s*/);
        return { fio: c[0] || '', position: c[1] || '', number: c[2] || '', date: c[3] || '' };
      });
    if (parsed.length) {
      setRows((rs) => [...rs.filter((r) => r.fio || r.position), ...parsed]);
      setPasteText('');
    }
  };

  const generate = async () => {
    const recipients = rows.filter((r) => r.fio.trim());
    if (!activeKey || recipients.length === 0) { setError('Заполните хотя бы одного получателя'); return; }
    setGenerating(true); setError(''); setStatus('');
    try {
      const res = await fetch('/api/letters/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey: activeKey, recipients }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Ошибка генерации'); }
      const blob = await res.blob();
      const cdHeader = res.headers.get('Content-Disposition') || '';
      const m = /filename\*=UTF-8''([^;]+)/.exec(cdHeader);
      const fname = m ? decodeURIComponent(m[1]) : (recipients.length > 1 ? 'letters.zip' : 'letter.pdf');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      setStatus(`Готово: ${recipients.length} ${recipients.length === 1 ? 'письмо' : 'писем'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации');
    } finally { setGenerating(false); }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#313131] focus:ring-2 focus:ring-[#029cda] focus:border-transparent';

  return (
    <div className="space-y-6 font-[Raleway]">
      <div>
        <h2 className="text-xl font-bold text-[#313131]">Письма (именные рассылки)</h2>
        <p className="text-sm text-[#7C8A9A]">Шаблон + получатели → готовые PDF со склонением ФИО</p>
      </div>

      {(status || error) && (
        <div className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {error || status}
        </div>
      )}

      {/* Выбор шаблона */}
      <div className="flex gap-2">
        {templates.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveKey(t.key)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              activeKey === t.key ? 'bg-[#029cda] text-white border-[#029cda]' : 'bg-white text-[#313131] border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Редактор шаблона */}
      {draft && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#313131]">Шаблон «{draft.name}»</h3>
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-[#029cda] text-white hover:bg-[#0280b5] disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : 'Сохранить шаблон'}
            </button>
          </div>

          <div className="text-xs text-[#7C8A9A] space-y-1">
            <div>Реквизиты (№, дата), адресат (должность + ФИО в дат. падеже) и обращение формируются автоматически — их в тело писать не нужно.</div>
            <div>Теги для тела, исполнителя и имени файла: <span className="font-mono text-[#0a7bb0]">{TAGS.join('  ')}</span></div>
          </div>

          <div>
            <label className="block text-sm text-[#7C8A9A] mb-1">Тело письма</label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={14}
              className={`${inputCls} font-mono text-[13px] leading-relaxed`}
            />
          </div>

          {/* Шапка (верхний колонтитул) */}
          <div>
            <label className="block text-sm text-[#7C8A9A] mb-1">Шапка бланка (верхний колонтитул — на каждой странице)</label>
            <div className="flex items-center gap-3">
              {draft.header_image
                ? <img src={draft.header_image} alt="Шапка" className="h-12 object-contain border border-gray-200 rounded bg-white" />
                : <span className="text-xs text-[#9AA6B2]">не загружено</span>}
              <label className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 cursor-pointer">
                {uploading === 'header_image' ? 'Загрузка…' : 'Загрузить'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage('header_image', e.target.files[0])} />
              </label>
              {draft.header_image && <button onClick={() => setDraft({ ...draft, header_image: '' })} className="text-xs text-red-500 hover:underline">убрать</button>}
            </div>
          </div>

          {/* Подписант */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#7C8A9A] mb-1">Должность подписанта</label>
              <input value={draft.signer_role} onChange={(e) => setDraft({ ...draft, signer_role: e.target.value })} className={inputCls} placeholder="Директор ООО «Сфера»" />
            </div>
            <div>
              <label className="block text-sm text-[#7C8A9A] mb-1">ФИО подписанта</label>
              <input value={draft.signer_name} onChange={(e) => setDraft({ ...draft, signer_name: e.target.value })} className={inputCls} placeholder="А.В. Статов" />
            </div>
          </div>

          {/* Подпись-картинка */}
          <div>
            <label className="block text-sm text-[#7C8A9A] mb-1">Подпись руководителя (изображение)</label>
            <div className="flex items-center gap-3">
              {draft.signature_image
                ? <img src={draft.signature_image} alt="Подпись" className="h-12 object-contain border border-gray-200 rounded bg-white" />
                : <span className="text-xs text-[#9AA6B2]">не загружено</span>}
              <label className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 cursor-pointer">
                {uploading === 'signature_image' ? 'Загрузка…' : 'Загрузить'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage('signature_image', e.target.files[0])} />
              </label>
              {draft.signature_image && <button onClick={() => setDraft({ ...draft, signature_image: '' })} className="text-xs text-red-500 hover:underline">убрать</button>}
            </div>
          </div>

          {/* Исполнитель */}
          <div>
            <label className="block text-sm text-[#7C8A9A] mb-1">Исполнитель (нижний колонтитул — на каждой странице)</label>
            <textarea value={draft.executor} onChange={(e) => setDraft({ ...draft, executor: e.target.value })} rows={3} className={`${inputCls} font-mono text-[13px]`} />
          </div>

          {/* Имя файла */}
          <div>
            <label className="block text-sm text-[#7C8A9A] mb-1">Шаблон имени файла</label>
            <input value={draft.filename_pattern} onChange={(e) => setDraft({ ...draft, filename_pattern: e.target.value })} className={`${inputCls} font-mono`} />
            <p className="text-xs text-[#9AA6B2] mt-2">Пример: Сфера_&lt;&lt;Должность сокр&gt;&gt;_&lt;&lt;Дательный падеж ФИО&gt;&gt;_№&lt;&lt;Номер письма&gt;&gt;</p>
          </div>
        </div>
      )}

      {/* Получатели */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-[#313131]">Получатели</h3>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[#7C8A9A]">
                <th className="py-1 pr-2 font-medium">ФИО (Фамилия Имя Отчество)</th>
                <th className="py-1 pr-2 font-medium">Должность (в дат. падеже)</th>
                <th className="py-1 pr-2 font-medium w-20">Номер</th>
                <th className="py-1 pr-2 font-medium w-28">Дата</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2"><input value={r.fio} onChange={(e) => setRow(i, { fio: e.target.value })} placeholder="Боровлёв Павел Михайлович" className={inputCls} /></td>
                  <td className="py-1 pr-2"><input value={r.position} onChange={(e) => setRow(i, { position: e.target.value })} placeholder="Главе … муниципального района …" className={inputCls} /></td>
                  <td className="py-1 pr-2"><input value={r.number} onChange={(e) => setRow(i, { number: e.target.value })} placeholder="710" className={inputCls} /></td>
                  <td className="py-1 pr-2"><input value={r.date} onChange={(e) => setRow(i, { date: e.target.value })} placeholder="21.05.2026" className={inputCls} /></td>
                  <td className="py-1 text-center">
                    <button onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500" title="Удалить">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={() => setRows((rs) => [...rs, emptyRow()])} className="text-sm text-[#029cda] hover:text-[#0280b5]">+ Добавить строку</button>

        <div>
          <label className="block text-sm text-[#7C8A9A] mb-1">Вставить списком (из таблицы: ФИО ⇥ Должность ⇥ Номер ⇥ Дата, по строке на получателя)</label>
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} className={`${inputCls} font-mono text-[13px]`} placeholder={'Боровлёв Павел Михайлович\tГлаве … муниципального района …\t710\t21.05.2026'} />
          <button onClick={importPaste} disabled={!pasteText.trim()} className="mt-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-[#313131] hover:bg-gray-50 disabled:opacity-40">Добавить из вставки</button>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={generate}
            disabled={generating}
            className="px-6 py-2.5 rounded-lg bg-[#029cda] text-white font-medium hover:bg-[#0280b5] disabled:opacity-50"
          >
            {generating ? 'Генерация…' : 'Сгенерировать PDF'}
          </button>
          <span className="text-sm text-[#9AA6B2]">
            {rows.filter((r) => r.fio.trim()).length > 1 ? 'Несколько получателей → ZIP-архив' : 'Один получатель → PDF'}
          </span>
        </div>
      </div>
    </div>
  );
}
