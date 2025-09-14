'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState, CSSProperties, Suspense } from 'react';
import Link from 'next/link';
import CoverPicker from '@/components/blog/CoverPicker';
import {
  BlogDraft, BlogPost, NewsItem, auth, clearDraft, fileToDataURL,
  genSlug, loadDraft, saveDraft, upsertNews, upsertPost,
  getPostBySlug, getNewsBySlug, deletePostById, deleteNewsById,
  listAllTags, addTag, listScheduledPosts, listScheduledNews,
  publishScheduledPost, publishScheduledNews, clearTestNews
} from '@/lib/blogStore';
import { sb_upsertPost, sb_upsertNews } from '@/lib/blogStore';
// removed useSearchParams to avoid CSR bailout during prerender

// ---------- типы блоков ----------
type Align = 'left'|'center'|'right';

type TextBlock  = { id: string; type: 'text';   align: Align; text: string };
type HBlock     = { id: string; type: 'h2'|'h3';align: Align; text: string };
type ImageBlock = { id: string; type: 'image';  align: Align; src?: string; caption?: string };
type VideoBlock = { id: string; type: 'video';  align: Align; src?: string; embedHtml?: string };
type ListBlock  = { id: string; type: 'ul'|'ol'; items: string[] };
type QuoteBlock = { id: string; type: 'quote';  text: string };
type PollBlock  = { id: string; type: 'poll';   question: string; options: string[] };
type HrBlock    = { id: string; type: 'hr' };
// новая галерея
type GalleryBlock = { id: string; type: 'gallery'; align: Align; images: string[] };

type Block =
  | TextBlock | HBlock | ImageBlock | VideoBlock | ListBlock | QuoteBlock | PollBlock | HrBlock | GalleryBlock;

const uid = () => crypto.randomUUID();

// ---------- сборка HTML из блоков ----------
function renderBlocks(blocks: Block[]): string {
  const esc = (s:string)=>s.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const align = (a:Align)=> a==='center' ? ' style="text-align:center"' : a==='right' ? ' style="text-align:right"' : '';
  return blocks.map(b=>{
    switch(b.type){
      case 'text':  return `<p dir="ltr"${align((b as TextBlock).align)}>${esc((b as TextBlock).text||'')}</p>`;
      case 'h2':    return `<h2${align((b as HBlock).align)}>${esc((b as HBlock).text||'')}</h2>`;
      case 'h3':    return `<h3${align((b as HBlock).align)}>${esc((b as HBlock).text||'')}</h3>`;
      case 'image': {
        const ib = b as ImageBlock;
        return `<figure${align(ib.align)}><img src="${ib.src||''}" alt="" style="width:100%;height:auto;border-radius:16px" />${ib.caption?`<figcaption>${esc(ib.caption)}</figcaption>`:''}</figure>`;
      }
      case 'video': {
        const vb = b as VideoBlock;
        return vb.embedHtml
          ? `<div class="my-4"${align(vb.align)}>${vb.embedHtml}</div>`
          : vb.src ? `<video src="${vb.src}" controls style="width:100%;border-radius:16px"></video>` : '';
      }
      case 'gallery': {
        const gb = b as GalleryBlock;
        const imgs = gb.images.map(src=>`<img src="${src}" alt="" loading="lazy" />`).join('');
        // js-gallery — хук для лайтбокса на странице статьи
        return `<div class="js-gallery" data-align="${gb.align||'left'}">${imgs}</div>`;
      }
      case 'ul':    return `<ul>${(b as ListBlock).items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`;
      case 'ol':    return `<ol>${(b as ListBlock).items.map(i=>`<li>${esc(i)}</li>`).join('')}</ol>`;
      case 'quote': return `<blockquote>${esc((b as QuoteBlock).text||'')}</blockquote>`;
      case 'poll':  {
        const pb = b as PollBlock;
        return `<div class="poll"><div class="poll-q">${esc(pb.question)}</div><ul class="poll-list">${pb.options.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></div>`;
      }
      case 'hr':    return `<hr />`;
      default: return '';
    }
  }).join('\n');
}

// ---------- заголовок шага ----------
function StepTitle({children}:{children:React.ReactNode}) {
  return <h2 className="text-xl font-semibold text-[#111]">{children}</h2>;
}

export default function NewPostPage() {
  const [editSlug, setEditSlug] = useState('');
  const [editType, setEditType] = useState<'post'|'news'|null>(null);

  const [authed, setAuthed] = useState(false);
  const [login, setLogin] = useState(''); const [pass, setPass] = useState('');

  // шаги: 0 тип, 1 заголовок, 2 контент, 3 обложка+теги
  const [step, setStep] = useState(0);

  const [kind, setKind] = useState<'post'|'news'|'lesson'|'case'>('post');
  const [title, setTitle] = useState(''); const [subtitle, setSubtitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [cover, setCover] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<BlogPost[]>([]);
  const [scheduledNews, setScheduledNews] = useState<NewsItem[]>([]);

  useEffect(() => { setAuthed(auth.isAuthed()); }, []);

  // читать query-параметры из URL на клиенте
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    setEditSlug(sp.get('edit') || '');
    const t = sp.get('type');
    setEditType(t === 'post' || t === 'news' ? (t as 'post'|'news') : null);
  }, []);

  // загрузка черновика
  useEffect(() => {
    setAllTags(listAllTags());
    const d = loadDraft();
    if (d && !editSlug) {
      setKind((d.kind as any) || 'post');
      setTitle(d.title || ''); setSubtitle(d.subtitle || '');
      setCover(d.cover); setBlocks((d.blocks as Block[]) || []);
      setTags(d.tags || []);
    }
  }, [editSlug]);

  // автосейв
  useEffect(() => {
    const draft: BlogDraft = { kind, title, subtitle, cover, blocks, tags, savedAt: Date.now() };
    const t = setTimeout(()=>saveDraft(draft), 250);
    return ()=>clearTimeout(t);
  }, [kind, title, subtitle, cover, blocks, tags]);

  // режим редактирования
  useEffect(() => {
    if (!editSlug || !editType) return;
    setLoadingEdit(true);
    if (editType === 'post') {
      const p = getPostBySlug(editSlug);
      if (p) {
        setKind('post'); setTitle(p.title); setSubtitle(p.subtitle||'');
        setCover(p.cover); setTags(p.tags||[]);
        setBlocks([{ id: uid(), type:'text', align:'left', html: p.contentHtml } as TextBlock]);
        setStep(2);
      }
    } else {
      const n = getNewsBySlug(editSlug);
      if (n) {
        setKind('news'); setTitle(n.title); setSubtitle('');
        setCover(n.cover); setTags(n.tags||[]);
        setBlocks([{ id: uid(), type:'text', align:'left', html: n.contentHtml || '' } as TextBlock]);
        setStep(2);
      }
    }
    setLoadingEdit(false);
  }, [editSlug, editType]);

  // загрузка отложенных статей
  useEffect(() => {
    if (authed) {
      setScheduledPosts(listScheduledPosts());
      setScheduledNews(listScheduledNews());
    }
  }, [authed]);

  const doLogin = () => {
    if (auth.login(login, pass)) setAuthed(true);
    else alert('Неверный логин/пароль');
  };

  // помощники по блокам
  const addBlock = (b: Block) => setBlocks(v => [...v, b]);
  const moveUp = (i:number) => setBlocks(v => (i<=0? v : [ ...v.slice(0,i-1), v[i], v[i-1], ...v.slice(i+1) ]));
  const moveDown = (i:number) => setBlocks(v => (i>=v.length-1? v : [ ...v.slice(0,i), v[i+1], v[i], ...v.slice(i+2) ]));
  const removeAt = (i:number) => setBlocks(v => v.filter((_,idx)=>idx!==i));
  const updateAt = (i:number, b:Partial<Block>) => setBlocks(v => v.map((x,idx)=> idx===i ? ({...x, ...b} as Block) : x));

  // медиа
  const pickImageFile = async (i:number, multiple=false) => {
    const input = document.createElement('input');
    input.type='file'; input.accept='image/*'; if (multiple) input.multiple = true;
    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      if (!files.length) return;

      // одиночное
      if (!multiple) {
        const f = files[0]; const data = await fileToDataURL(f);
        updateAt(i,{ src:data } as Partial<ImageBlock>);
        return;
      }

      // множественное — галерея
      const arr: string[] = [];
      for (const f of files) {
        const data = await fileToDataURL(f);
        arr.push(data);
      }
      updateAt(i,{ images: [ ...(blocks[i] as GalleryBlock).images, ...arr ] } as Partial<GalleryBlock>);
    };
    input.click();
  };

  const pickVideoFile = async (i:number) => {
    const input = document.createElement('input'); input.type='file'; input.accept='video/*';
    input.onchange = async () => {
      const f = input.files?.[0]; if(!f) return;
      const data = await fileToDataURL(f);
      updateAt(i,{ src:data, embedHtml: undefined } as Partial<VideoBlock>);
    };
    input.click();
  };

  const fromVideoUrl = (url: string): string | undefined => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/i);
    if (m) return `<div class="aspect-video"><iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen style="width:100%;height:100%;border:0;border-radius:16px"></iframe></div>`;
    const vk = url.match(/vk\.com\/video(-?\d+)_([\d]+)/i);
    if (vk) {
      const oid = vk[1], id = vk[2];
      return `<div class="aspect-video"><iframe src="https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=0&hd=2" style="width:100%;height:100%;border:0;border-radius:16px" allowfullscreen></iframe></div>`;
    }
    return undefined;
  };

  // публикация
  const canPublish = useMemo(() => title.trim().length > 2 && (kind === 'news' ? true : blocks.length>0), [title, blocks, kind]);

  const showNotificationToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const publish = () => {
    if (!canPublish) return;
    const now = Date.now();
    const slug = genSlug(title);
    const html = renderBlocks(blocks);

    // Check if scheduled publishing
    const publishTime = scheduledDate ? new Date(scheduledDate).getTime() : now;
    const isScheduled = publishTime > now;

    if (kind === 'post' || kind === 'lesson' || kind === 'case') {
      const prev = editSlug && editType==='post' ? getPostBySlug(editSlug) : undefined;
      const p: BlogPost = {
        id: prev?.id || crypto.randomUUID(),
        slug, title, subtitle: (kind==='post'?subtitle:undefined),
        cover, contentHtml: html, tags, kind,
        createdAt: prev?.createdAt || publishTime, updatedAt: now,
        views: prev?.views || 0, reactions: prev?.reactions || {heart:0,fire:0,smile:0}
      };
      // Пишем в Supabase, при ошибке — локально
      sb_upsertPost(p).catch(()=>upsertPost(p));
      clearDraft();
      
      const typeName = kind === 'post' ? 'статья' : kind === 'lesson' ? 'урок' : 'кейс';
      if (isScheduled) {
        showNotificationToast(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} запланирована на ${new Date(publishTime).toLocaleString('ru-RU')}`);
      } else {
        showNotificationToast(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} опубликована!`);
        window.location.href = `/blog/${p.slug}`;
      }
    } else {
      const prev = editSlug && editType==='news' ? getNewsBySlug(editSlug) : undefined;
      const n: NewsItem = {
        id: prev?.id || crypto.randomUUID(),
        slug, title, cover, contentHtml: html || undefined, tags,
        createdAt: prev?.createdAt || publishTime, updatedAt: now,
        views: prev?.views || 0, reactions: prev?.reactions || {heart:0,fire:0,smile:0}
      };
      sb_upsertNews(n).catch(()=>upsertNews(n));
      clearDraft();
      
      if (isScheduled) {
        showNotificationToast(`Новость запланирована на ${new Date(publishTime).toLocaleString('ru-RU')}`);
      } else {
        showNotificationToast('Новость опубликована!');
        window.location.href = `/news/${n.slug}`;
      }
    }
  };

  const doDelete = () => {
    if (!editSlug || !editType) return;
    if (!confirm('Точно удалить?')) return;
    if (editType==='post') { const p = getPostBySlug(editSlug); if (p) deletePostById(p.id); window.location.href = '/blog'; }
    else { const n = getNewsBySlug(editSlug); if (n) deleteNewsById(n.id); window.location.href = '/news'; }
  };

  const publishScheduled = (id: string, type: 'post' | 'news') => {
    if (type === 'post') {
      publishScheduledPost(id);
      setScheduledPosts(listScheduledPosts());
      showNotificationToast('Статья опубликована!');
    } else {
      publishScheduledNews(id);
      setScheduledNews(listScheduledNews());
      showNotificationToast('Новость опубликована!');
    }
  };

  const clearTestData = () => {
    if (!confirm('Удалить тестовые новости?')) return;
    const deleted = clearTestNews();
    showNotificationToast(`Удалено ${deleted} тестовых новостей`);
    // Обновляем списки
    setScheduledPosts(listScheduledPosts());
    setScheduledNews(listScheduledNews());
  };

  if (!authed) {
    return (
      <div className="bg-[#f2f3f7] min-h-screen">
        <div className="max-w-[640px] mx-auto px-4 md:px-8 py-8 md:py-16">
          <div className="bg-white rounded-2xl p-6 border">
            <h1 className="text-2xl font-semibold mb-4 text-[#111]">Авторизация редактора</h1>
            <input className="w-full border rounded-lg px-4 py-3 mb-3 text-[#111]" placeholder="Логин" value={login} onChange={e=>setLogin(e.target.value)} />
            <input className="w-full border rounded-lg px-4 py-3 mb-4 text-[#111]" placeholder="Пароль" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={doLogin} className="bg-[#2777ff] text-white px-5 py-2.5 rounded-lg">Войти</button>
              <Link href="/blog" className="px-5 py-2.5 rounded-lg border text-[#111]">Назад</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // общий стиль для LTR текстового редактора
  const editableStyle: CSSProperties = {
    direction: 'ltr',
    unicodeBidi: 'bidi-override',
    textAlign: 'left',
    lineHeight: 1.8,
  };

  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <div className="bg-[#f2f3f7] min-h-screen" dir="ltr">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Назад
            </Link>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {editSlug && editType && (
                <button onClick={doDelete} className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-[#111]">Удалить</button>
              )}
              <button
                onClick={clearTestData}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                Удалить тестовые новости
              </button>
              <button
                onClick={()=> setStep(s=> Math.min(s+1,3))}
                className="px-5 py-2 rounded-lg bg-[#2777ff] text-white">{step<3?'Далее':'Готово'}</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            {/* шаги */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm overflow-x-auto">
              {[0,1,2,3].map(i=>(
                <button key={i} onClick={()=>setStep(i)}
                  className={`h-8 px-3 rounded-lg border ${step===i?'bg-[#2777ff] text-white border-[#2777ff]':'bg-white text-[#111]'}`}>
                  {i===0?'Тип':i===1?'Заголовок':i===2?'Контент':'Обложка/теги'}
                </button>
              ))}
            </div>

            {/* Отложенные статьи */}
            {(scheduledPosts.length > 0 || scheduledNews.length > 0) && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">📅 Отложенные публикации</h3>
                <div className="space-y-2">
                  {scheduledPosts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <div className="font-medium text-[#111]">{post.title}</div>
                        <div className="text-sm text-gray-500">
                          Статья • {new Date(post.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => publishScheduled(post.id, 'post')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Опубликовать
                        </button>
                        <Link
                          href={`/blog/new?edit=${encodeURIComponent(post.slug)}&type=post`}
                          className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                          Редактировать
                        </Link>
                      </div>
                    </div>
                  ))}
                  {scheduledNews.map(news => (
                    <div key={news.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <div className="font-medium text-[#111]">{news.title}</div>
                        <div className="text-sm text-gray-500">
                          Новость • {new Date(news.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => publishScheduled(news.id, 'news')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Опубликовать
                        </button>
                        <Link
                          href={`/blog/new?edit=${encodeURIComponent(news.slug)}&type=news`}
                          className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                          Редактировать
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 0 */}
            {step===0 && (
              <div className="space-y-4">
                <StepTitle>Выберите тип материала</StepTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {k:'post', label:'Статья'}, {k:'news', label:'Новость'},
                    {k:'lesson', label:'Урок'},  {k:'case', label:'Кейс'}
                  ].map(x=>(
                    <button key={x.k}
                      onClick={()=>setKind(x.k as any)}
                      className={`h-12 rounded-xl border ${kind===x.k?'bg-[#2777ff] text-white border-[#2777ff]':'bg-white text-[#111]'}`}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 */}
            {step===1 && (
              <div className="space-y-4">
                <StepTitle>Заголовок</StepTitle>
                <input
                  className="w-full border rounded-xl px-4 py-3 text-xl text-[#111]"
                  placeholder={kind==='news' ? 'Заголовок новости' : 'Заголовок статьи'}
                  value={title} onChange={e=>setTitle(e.target.value)}
                />
                {kind==='post' && (
                  <input
                    className="w-full border rounded-xl px-4 py-3 text-[#111]"
                    placeholder="Подзаголовок (необязательно)"
                    value={subtitle} onChange={e=>setSubtitle(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* STEP 2 — блоки */}
            {step===2 && (
              <div className="space-y-8">
                <div className="sticky top-4 z-20 bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <StepTitle>Контент</StepTitle>
                    <div className="relative">
                      <details className="group">
                        <summary className="list-none cursor-pointer h-10 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm">+ Добавить блок</summary>
                        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 rounded-xl border bg-white p-2 shadow-lg z-10">
                        <button onClick={()=>addBlock({id:uid(),type:'text',align:'left',text:''} as TextBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Текст</button>
                        <button onClick={()=>addBlock({id:uid(),type:'h2',align:'left',text:''} as HBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Подзаголовок H2</button>
                        <button onClick={()=>addBlock({id:uid(),type:'h3',align:'left',text:''} as HBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Подзаголовок H3</button>
                        <button onClick={()=>addBlock({id:uid(),type:'image',align:'center',src:undefined,caption:''} as ImageBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Изображение</button>
                        <button onClick={()=>addBlock({id:uid(),type:'gallery',align:'center',images:[]} as GalleryBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Галерея (несколько фото)</button>
                        <button onClick={()=>addBlock({id:uid(),type:'video',align:'center'} as VideoBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Видео (YouTube/VK/файл)</button>
                        <button onClick={()=>addBlock({id:uid(),type:'ul',items:['Пункт']} as ListBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Маркированный список</button>
                        <button onClick={()=>addBlock({id:uid(),type:'ol',items:['Пункт']} as ListBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Нумерованный список</button>
                        <button onClick={()=>addBlock({id:uid(),type:'quote',text:''} as QuoteBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Цитата</button>
                        <button onClick={()=>addBlock({id:uid(),type:'poll',question:'Вопрос',options:['A','B']} as PollBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Опрос</button>
                        <button onClick={()=>addBlock({id:uid(),type:'hr'} as HrBlock)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-[#111]">Разделитель</button>
                      </div>
                    </details>
                  </div>
                </div>
                </div>

                {/* список блоков */}
                <div className="space-y-6">
                  {blocks.map((b, i)=>(
                    <div key={b.id} className="rounded-xl border p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <div className="text-sm text-[#52555a]">{b.type.toUpperCase()}</div>
                        <div className="ml-auto flex flex-wrap items-center gap-2">
                          {'align' in b && (
                            <div className="flex gap-1">
                              {(['left','center','right'] as Align[]).map(a=>(
                                <button key={a} onClick={()=>updateAt(i,{ align:a } as Partial<Block>)}
                                  className={`h-8 px-3 rounded-lg border ${ (b as any).align===a ? 'bg-[#2777ff] text-white border-[#2777ff]' : 'text-[#111]'}`}>{a==='left'?'Слева':a==='center'?'По центру':'Справа'}</button>
                              ))}
                            </div>
                          )}
                          <button onClick={()=>moveUp(i)} className="h-8 px-3 rounded-lg border text-[#111]">↑</button>
                          <button onClick={()=>moveDown(i)} className="h-8 px-3 rounded-lg border text-[#111]">↓</button>
                          <button onClick={()=>removeAt(i)} className="h-8 px-3 rounded-lg border text-[#111]">Удалить</button>
                        </div>
                      </div>

                      {/* Текст */}
                      {b.type==='text' && (
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-[#111] text-lg"
                          value={(b as TextBlock).text || ''}
                          onChange={e=>updateAt(i,{ text: e.target.value } as Partial<TextBlock>)}
                          placeholder="Введите текст"
                        />
                      )}

                      {/* H2/H3 */}
                      {(b.type==='h2'||b.type==='h3') && (
                        <input
                          className={`w-full border rounded-lg px-3 py-2 text-[#111] ${b.type==='h2'?'text-2xl':'text-xl'}`}
                          value={(b as HBlock).text || ''}
                          onChange={e=>updateAt(i,{ text: e.target.value } as Partial<HBlock>)}
                          placeholder={b.type==='h2'?'Подзаголовок H2':'Подзаголовок H3'}
                        />
                      )}

                      {/* Изображение */}
                      {b.type==='image' && (
                        <div className="space-y-3">
                          {(b as ImageBlock).src ? (
                            <img src={(b as ImageBlock).src} className="rounded-xl w-full max-h-[560px] object-contain" />
                          ) : (
                            <div className="h-40 rounded-lg bg-[#f6f7f9] flex items-center justify-center text-[#111]">Нет изображения</div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={()=>pickImageFile(i)} className="px-3 py-2 rounded-lg border text-[#111]">Загрузить</button>
                            {(b as ImageBlock).src && (
                              <button onClick={()=>updateAt(i,{ src:undefined } as Partial<ImageBlock>)} className="px-3 py-2 rounded-lg border text-[#111]">Удалить</button>
                            )}
                          </div>
                          <input
                            className="w-full border rounded-lg px-3 py-2 text-[#111]"
                            placeholder="Подпись к изображению"
                            value={(b as ImageBlock).caption || ''}
                            onChange={e=>updateAt(i,{ caption: e.target.value } as Partial<ImageBlock>)}
                          />
                        </div>
                      )}

                      {/* Галерея */}
                      {b.type==='gallery' && (
                        <div className="space-y-3">
                          {(b as GalleryBlock).images.length ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(b as GalleryBlock).images.map((src,idx)=>(
                                <div key={idx} className="relative">
                                  <img src={src} className="w-full rounded-xl object-cover" />
                                  <button
                                    onClick={()=>{
                                      const images=[...(b as GalleryBlock).images];
                                      images.splice(idx,1);
                                      updateAt(i,{ images } as Partial<GalleryBlock>);
                                    }}
                                    className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md border text-xs">Удалить</button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-40 rounded-lg bg-[#f6f7f9] flex items-center justify-center text-[#111]">Добавьте изображения</div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={()=>pickImageFile(i,true)} className="px-3 py-2 rounded-lg border text-[#111]">Добавить изображения</button>
                            {(b as GalleryBlock).images.length>1 && <div className="text-sm text-[#52555a]">На странице будет сетка + лайтбокс</div>}
                          </div>
                        </div>
                      )}

                      {/* Видео */}
                      {b.type==='video' && (
                        <div className="space-y-3">
                          {(b as VideoBlock).embedHtml ? (
                            <div className="aspect-video rounded-lg overflow-hidden" dangerouslySetInnerHTML={{__html:(b as VideoBlock).embedHtml!}} />
                          ) : (b as VideoBlock).src ? (
                            <video src={(b as VideoBlock).src} controls className="w-full rounded-lg" />
                          ) : (
                            <div className="h-40 rounded-lg bg-[#f6f7f9] flex items-center justify-center text-[#111]">Нет видео</div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button onClick={()=>pickVideoFile(i)} className="px-3 py-2 rounded-lg border text-[#111]">Загрузить файл</button>
                            <button onClick={()=>{
                              const url = prompt('Вставьте ссылку на YouTube или VK (например https://vk.com/video-123_456)');
                              if (!url) return;
                              const html = fromVideoUrl(url);
                              if (!html) return alert('Не похоже на ссылку YouTube или VK');
                              updateAt(i,{ embedHtml: html, src: undefined } as Partial<VideoBlock>);
                            }} className="px-3 py-2 rounded-lg border text-[#111]">Вставить ссылку</button>
                            {(b as VideoBlock).embedHtml && <button onClick={()=>updateAt(i,{ embedHtml: undefined } as Partial<VideoBlock>)} className="px-3 py-2 rounded-lg border text-[#111]">Убрать ссылку</button>}
                          </div>
                        </div>
                      )}

                      {/* Списки */}
                      {(b.type==='ul'||b.type==='ol') && (
                        <div className="space-y-2">
                          {(b as ListBlock).items.map((it: string, idx: number)=>(
                            <div key={idx} className="flex gap-2">
                              <input className="flex-1 border rounded-lg px-3 py-2 text-[#111]" value={it}
                                onChange={e=>{
                                  const items = [...(b as ListBlock).items]; items[idx]=e.target.value; updateAt(i,{ items } as Partial<ListBlock>);
                                }} />
                              <button onClick={()=>{
                                const items = [...(b as ListBlock).items]; items.splice(idx,1); updateAt(i,{ items } as Partial<ListBlock>);
                              }} className="px-3 py-2 rounded-lg border text-[#111]">–</button>
                            </div>
                          ))}
                          <button onClick={()=>{
                            const items = [...(b as ListBlock).items, 'Новый пункт']; updateAt(i,{ items } as Partial<ListBlock>);
                          }} className="px-3 py-2 rounded-lg border text-[#111]">+ Пункт</button>
                        </div>
                      )}

                      {/* Цитата */}
                      {b.type==='quote' && (
                        <textarea className="w-full border rounded-lg px-3 py-2 text-[#111]" rows={3}
                          value={(b as QuoteBlock).text||''} onChange={e=>updateAt(i,{ text:e.target.value } as Partial<QuoteBlock>)} placeholder="Текст цитаты"/>
                      )}

                      {/* Опрос (визуальный) */}
                      {b.type==='poll' && (
                        <div className="space-y-2">
                          <input className="w-full border rounded-lg px-3 py-2 text-[#111]" value={(b as PollBlock).question}
                            onChange={e=>updateAt(i,{ question:e.target.value } as Partial<PollBlock>)} placeholder="Вопрос"/>
                          {(b as PollBlock).options.map((op:string,idx:number)=>(
                            <div key={idx} className="flex gap-2">
                              <input className="flex-1 border rounded-lg px-3 py-2 text-[#111]" value={op}
                                onChange={e=>{
                                  const options=[...(b as PollBlock).options]; options[idx]=e.target.value; updateAt(i,{ options } as Partial<PollBlock>);
                                }}/>
                              <button onClick={()=>{
                                const options=[...(b as PollBlock).options]; options.splice(idx,1); updateAt(i,{ options } as Partial<PollBlock>);
                              }} className="px-3 py-2 rounded-lg border text-[#111]">–</button>
                            </div>
                          ))}
                          <button onClick={()=>{
                            const options=[...(b as PollBlock).options,'Вариант']; updateAt(i,{ options } as Partial<PollBlock>);
                          }} className="px-3 py-2 rounded-lg border text-[#111]">+ Вариант</button>
                        </div>
                      )}

                      {/* Разделитель */}
                      {b.type==='hr' && <div className="text-center text-[#52555a]">Разделитель</div>}
                    </div>
                  ))}
                  {blocks.length===0 && (
                    <div className="rounded-xl border p-6 text-center text-[#111]">Добавьте первый блок</div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3 — обложка и теги */}
            {step===3 && (
              <div className="space-y-6">
                <StepTitle>Обложка и теги</StepTitle>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <CoverPicker value={cover} onChange={setCover} />
                    <div className="text-sm text-[#52555a] mt-2">Рекомендованный размер: 1280×720, формат JPG/PNG/WebP.</div>
                  </div>
                  <div>
                    <div className="mb-2 font-medium text-[#111]">Теги</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map(t=>(
                        <button key={t} onClick={()=>setTags(tags.filter(x=>x!==t))}
                          className="px-3 py-1.5 rounded-lg bg-[#e9eefb] text-[#111]">#{t} ×</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input id="newtag" className="flex-1 border rounded-lg px-3 py-2 text-[#111]" placeholder="Создать новый тег" />
                      <button onClick={()=>{
                        const el = document.getElementById('newtag') as HTMLInputElement;
                        const t = (el?.value||'').trim(); if (!t) return;
                        addTag(t); setAllTags(listAllTags()); if(!tags.includes(t)) setTags([...tags,t]); el.value='';
                      }} className="px-3 py-2 rounded-lg border text-[#111]">Добавить</button>
                    </div>
                    {!!allTags.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allTags.map(t=>(
                          <button key={t} onClick={()=>{ if(!tags.includes(t)) setTags([...tags,t]); }}
                            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-[#111]">#{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduled Publishing */}
                <div className="space-y-4">
                  <StepTitle>Отложенная публикация</StepTitle>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[#111] mb-2">
                        Дата и время публикации (необязательно)
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full border rounded-lg px-3 py-2 text-[#111]"
                      />
                      <div className="text-sm text-[#52555a] mt-1">
                        Оставьте пустым для немедленной публикации
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button onClick={publish} disabled={!canPublish}
                    className={`px-6 py-3 rounded-xl text-white ${canPublish ? 'bg-[#2777ff] hover:bg-[#1f66de]' : 'bg-gray-300 cursor-not-allowed'} transition-colors`}>
                    Опубликовать
                  </button>
                  <button onClick={()=>{ clearDraft(); setTitle(''); setSubtitle(''); setCover(undefined); setBlocks([]); setTags([]); setStep(0); }}
                    className="px-6 py-3 rounded-xl border hover:bg-gray-50 text-[#111]">Очистить черновик</button>
                </div>
              </div>
            )}
          </div>

          {loadingEdit && <div className="mt-4 text-sm text-[#52555a]">Загрузка…</div>}
        </div>
      </div>
      
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {notificationMessage}
        </div>
      )}
    </Suspense>
  );
}
