'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  auth,
  fileToDataURL,
} from '@/lib/blogStore';
import {
  type Story,
  type StorySlide,
  type StoryTextPosition,
  listStories,
  getStoryById,
  upsertStory,
  deleteStory,
  genSlideId,
} from '@/lib/storiesStore';

export default function BlogStoriesPage() {
  const [authed, setAuthed] = useState(false);
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formSlides, setFormSlides] = useState<StorySlide[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setAuthed(auth.isAuthed());
  }, []);

  const loadStoriesList = () => {
    listStories().then(setStories);
  };

  useEffect(() => {
    loadStoriesList();
  }, [editingId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const startCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormThumbnail('');
    setFormSlides([{ id: genSlideId(), type: 'image', url: '', text: '', textPosition: 'bottom', duration: 5000 }]);
  };

  const startEdit = async (s: Story) => {
    setEditingId(s.id);
    const fresh = await getStoryById(s.id);
    const st = fresh ?? s;
    setFormTitle(st.title);
    setFormThumbnail(st.thumbnail);
    setFormSlides(st.slides.length ? [...st.slides] : [{ id: genSlideId(), type: 'image', url: '', text: '', textPosition: 'bottom', duration: 5000 }]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот сторис?')) return;
    await deleteStory(id);
    setEditingId(null);
    loadStoriesList();
    showToast('Сторис удалён');
  };

  const addSlide = () => {
    setFormSlides((prev) => [...prev, { id: genSlideId(), type: 'image', url: '', text: '', textPosition: 'bottom', duration: 5000 }]);
  };

  const removeSlide = (index: number) => {
    setFormSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, patch: Partial<StorySlide>) => {
    setFormSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5 MB — Supabase, для больших файлов используйте прямую ссылку

  const uploadImage = (index: number, field: 'url' | 'thumbnail') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const isVideo = file.type.startsWith('video/');
      if (isVideo && field !== 'thumbnail' && file.size > MAX_VIDEO_BYTES) {
        showToast(`Видео до 5 МБ. Для больших — загрузите на хостинг и вставьте прямую ссылку (.mp4)`);
        return;
      }
      try {
        const dataUrl = await fileToDataURL(file);
        if (field === 'thumbnail') setFormThumbnail(dataUrl);
        else updateSlide(index, { url: dataUrl, type: isVideo ? 'video' : 'image' });
      } catch (e) {
        showToast('Ошибка загрузки файла');
      }
    };
    input.click();
  };

  const addAttachment = (slideIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await readFileAsDataURL(file);
        const slide = formSlides[slideIndex];
        const attachments = [...(slide.attachments || []), { name: file.name, url }];
        updateSlide(slideIndex, { attachments });
      } catch {
        showToast('Ошибка загрузки файла');
      }
    };
    input.click();
  };

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(fr.error);
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(file);
    });
  }

  const saveStory = async () => {
    if (!formTitle.trim()) {
      showToast('Введите заголовок сториса');
      return;
    }
    const thumbnail = formThumbnail || (formSlides[0]?.type !== 'text' ? formSlides[0]?.url : '') || '';
    const slideList = formSlides.filter((s) => s.type === 'text' ? !!s.text?.trim() : !!s.url?.trim());
    if (!slideList.length) {
      showToast('Добавьте хотя бы один слайд с контентом');
      return;
    }
    const now = Date.now();
    const existing = editingId ? await getStoryById(editingId) : undefined;
    const story: Story = {
      id: editingId || crypto.randomUUID(),
      title: formTitle.trim(),
      thumbnail: thumbnail || '/img/blog1.svg',
      slides: slideList,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      viewCount: existing?.viewCount ?? 0,
    };
    await upsertStory(story);
    loadStoriesList();
    showToast(editingId ? 'Сторис сохранён' : 'Сторис создан');
    setEditingId(null);
  };

  if (!authed) {
    return (
      <div className="bg-[#f2f3f7] min-h-screen font-[Raleway]">
        <div className="max-w-[640px] mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-6 border">
            <h1 className="text-2xl font-semibold mb-4 text-[#111]">Редактор сторис</h1>
            <p className="text-gray-600 mb-4">Войдите под учётной записью редактора блога.</p>
            <input className="w-full border rounded-lg px-4 py-3 mb-3 text-[#111]" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} />
            <input className="w-full border rounded-lg px-4 py-3 mb-4 text-[#111]" placeholder="Пароль" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => auth.login(login, pass) && setAuthed(true)} className="bg-[#2777ff] text-white px-5 py-2.5 rounded-lg">Войти</button>
              <Link href="/blog" className="px-5 py-2.5 rounded-lg border text-[#111]">В блог</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f3f7] min-h-screen font-[Raleway]">
      <div className="max-w-[900px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            В блог
          </Link>
          <button onClick={startCreate} className="px-5 py-2.5 rounded-lg bg-[#2777ff] text-white">
            + Новый сторис
          </button>
        </div>

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] bg-[#111] text-white px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Список сторис + статистика */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#111] mb-4">Сторисы и статистика</h2>
          {stories.length === 0 && !editingId && (
            <p className="text-gray-500">Пока нет сторис. Нажмите «Новый сторис».</p>
          )}
          <ul className="space-y-3">
            {stories.map((s) => (
              <li key={s.id} className="flex items-center gap-4 p-3 rounded-xl border bg-gray-50/50">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                  {s.thumbnail ? <Image src={s.thumbnail} alt="" width={56} height={56} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#111] truncate">{s.title}</div>
                  <div className="text-sm text-gray-500">Просмотры: {s.viewCount ?? 0}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(s)} className="px-3 py-1.5 rounded-lg bg-[#2777ff] text-white text-sm">Редактировать</button>
                  <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50">Удалить</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Форма создания/редактирования */}
        {(editingId !== null || formSlides.length > 0) && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold text-[#111] mb-4">{editingId ? 'Редактирование сториса' : 'Новый сторис'}</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#111] mb-1">Заголовок (в квадрате)</label>
              <input
                className="w-full border rounded-lg px-4 py-2 text-[#111]"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Например: Обновление платформы"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#111] mb-1">Превью (квадрат)</label>
              <div className="flex items-center gap-3">
                {formThumbnail ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border">
                    <Image src={formThumbnail} alt="" width={80} height={80} className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <button type="button" onClick={() => uploadImage(0, 'thumbnail')} className="px-4 py-2 rounded-lg border text-[#111] text-sm">Загрузить картинку</button>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#111]">Слайды</label>
              <button type="button" onClick={addSlide} className="px-3 py-1.5 rounded-lg bg-[#2777ff] text-white text-sm">+ Слайд</button>
            </div>

            <div className="space-y-6">
              {formSlides.map((slide, idx) => (
                <div key={slide.id} className="p-4 rounded-xl border bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-[#111]">Слайд {idx + 1}</span>
                    <button type="button" onClick={() => removeSlide(idx)} className="text-red-600 text-sm">Удалить</button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <span className="text-sm text-gray-600">Тип: </span>
                      <select
                        value={slide.type}
                        onChange={(e) => updateSlide(idx, { type: e.target.value as 'image' | 'video' | 'text' })}
                        className="ml-2 border rounded px-2 py-1 text-[#111]"
                      >
                        <option value="image">Картинка</option>
                        <option value="video">Видео</option>
                        <option value="text">Только текст</option>
                      </select>
                    </div>

                    {(slide.type === 'image' || slide.type === 'video') && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Медиа</label>
                        <div className="flex flex-col gap-2">
                          {slide.url ? (
                            slide.type === 'video' ? (
                              <video src={slide.url} className="max-h-24 rounded border" controls />
                            ) : (
                              <div className="w-24 h-24 rounded border overflow-hidden">
                                <Image src={slide.url} alt="" width={96} height={96} className="w-full h-full object-cover" />
                              </div>
                            )
                          ) : null}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button type="button" onClick={() => uploadImage(idx, 'url')} className="px-3 py-1.5 rounded border text-sm text-[#111]">Загрузить</button>
                            {slide.type === 'video' && (
                              <input
                                type="url"
                                placeholder="Или прямая ссылка .mp4"
                                className="flex-1 min-w-[180px] border rounded px-2 py-1.5 text-sm text-[#111]"
                                value={slide.url?.startsWith('http') ? slide.url : ''}
                                onChange={(e) => updateSlide(idx, { url: e.target.value.trim() || undefined })}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Текст в слайде</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 text-[#111] text-sm min-h-[60px]"
                        value={slide.text || ''}
                        onChange={(e) => updateSlide(idx, { text: e.target.value })}
                        placeholder="Текст поверх картинки или содержимое текстового слайда"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Расположение текста</label>
                      <select
                        value={slide.textPosition || 'bottom'}
                        onChange={(e) => updateSlide(idx, { textPosition: e.target.value as StoryTextPosition })}
                        className="border rounded px-2 py-1 text-[#111]"
                      >
                        <option value="top">Сверху</option>
                        <option value="center">По центру</option>
                        <option value="bottom">Снизу</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Кнопка (необязательно)</label>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          className="border rounded px-2 py-1 text-[#111] flex-1 min-w-[100px]"
                          placeholder="Текст кнопки"
                          value={slide.button?.label || ''}
                          onChange={(e) => updateSlide(idx, { button: { ...slide.button!, label: e.target.value, url: slide.button?.url || '' } })}
                        />
                        <input
                          className="border rounded px-2 py-1 text-[#111] flex-1 min-w-[100px]"
                          placeholder="Ссылка"
                          value={slide.button?.url || ''}
                          onChange={(e) => updateSlide(idx, { button: { ...slide.button!, url: e.target.value, label: slide.button?.label || '' } })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Опрос (необязательно)</label>
                      <input
                        className="w-full border rounded px-2 py-1 text-[#111] mb-2"
                        placeholder="Вопрос"
                        value={slide.poll?.question || ''}
                        onChange={(e) => updateSlide(idx, { poll: { ...slide.poll!, question: e.target.value, options: slide.poll?.options || [] } })}
                      />
                      <div className="space-y-2">
                        {(slide.poll?.options || ['', '']).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              className="border rounded px-2 py-1 text-[#111] flex-1 min-w-[120px]"
                              placeholder={`Вариант ${oi + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const opts = [...(slide.poll?.options || ['', ''])];
                                opts[oi] = e.target.value;
                                updateSlide(idx, { poll: { ...slide.poll!, question: slide.poll?.question || '', options: opts } });
                              }}
                            />
                            <span className="text-sm text-gray-500 w-16">
                              {(() => {
                                const total = slide.poll?.results?.reduce((a, b) => a + b, 0) ?? 0;
                                const val = slide.poll?.results?.[oi] ?? 0;
                                return total > 0 ? `${Math.round((val / total) * 100)}%` : '—';
                              })()}
                            </span>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const opts = [...(slide.poll?.options || ['', '']), ''];
                              const prevResults = slide.poll?.results ?? opts.slice(0, -1).map(() => 0);
                              const res = [...prevResults, 0];
                              updateSlide(idx, { poll: { ...slide.poll!, question: slide.poll?.question || '', options: opts, results: res } });
                            }}
                            className="px-3 py-1.5 rounded border text-sm text-[#111]"
                          >
                            + Вариант
                          </button>
                          {(slide.poll?.options?.length ?? 0) > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const opts = slide.poll?.options || ['', ''];
                                if (opts.length > 2) {
                                  const newOpts = opts.slice(0, -1);
                                  const newResults = slide.poll?.results?.slice(0, -1);
                                  updateSlide(idx, { poll: { ...slide.poll!, question: slide.poll?.question || '', options: newOpts, results: newResults } });
                                }
                              }}
                              className="px-3 py-1.5 rounded border border-red-200 text-red-600 text-sm"
                            >
                              − Вариант
                            </button>
                          )}
                        </div>
                      </div>
                      {slide.poll?.results && slide.poll.results.some((r) => r > 0) && (
                        <div className="mt-2 p-2 rounded bg-gray-100 text-sm text-gray-700">
                          <strong>Результаты опроса:</strong>
                          <ul className="mt-1 space-y-0.5">
                            {(slide.poll?.options || []).map((opt, oi) => (
                              <li key={oi}>
                                {opt}: {slide.poll?.results?.[oi] ?? 0} голосов
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Файлы (необязательно)</label>
                      <button type="button" onClick={() => addAttachment(idx)} className="px-3 py-1.5 rounded border text-sm text-[#111]">+ Прикрепить файл</button>
                      {slide.attachments?.length ? (
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          {slide.attachments.map((a, ai) => (
                            <li key={ai}>{a.name}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Длительность (мс)</label>
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-[#111] w-24"
                        value={slide.duration ?? 5000}
                        onChange={(e) => updateSlide(idx, { duration: Number(e.target.value) || 5000 })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={saveStory} className="px-5 py-2.5 rounded-lg bg-[#2777ff] text-white">Сохранить сторис</button>
              <button onClick={() => { setEditingId(null); setFormSlides([]); }} className="px-5 py-2.5 rounded-lg border text-[#111]">Отмена</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
