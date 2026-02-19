'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState, CSSProperties, Suspense } from 'react';
import Link from 'next/link';
import CoverPicker from '@/components/blog/CoverPicker';

// ⚠️ Важно: импортируем dynamic под другим именем, чтобы не конфликтовало с export const dynamic
import nextDynamic from 'next/dynamic';
const TipTapEditor = nextDynamic(() => import('@/components/blog/TipTapEditor'), { ssr: false });

import {
  BlogDraft, BlogPost, NewsItem, auth, clearDraft, fileToDataURL,
  genSlug, loadDraft, saveDraft, upsertNews, upsertPost,
  getPostBySlug, getNewsBySlug, deletePostById, deleteNewsById,
  listAllTags, addTag, listScheduledPosts, listScheduledNews,
  publishScheduledPost, publishScheduledNews,
  sb_getPostBySlug, sb_getNewsBySlug, sb_upsertPost, sb_upsertNews,
  sb_getCaseBySlug, sb_upsertCase, sb_deleteCaseById,
  sb_deletePostById, sb_deleteNewsById,
  CASE_APPLICATION_OPTIONS
} from '@/lib/blogStore';

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
      // ⬇️ ТЕКСТОВЫЙ БЛОК ТЕПЕРЬ СЧИТАЕМ ГОТОВЫМ HTML (из TipTap).
      // НИЧЕГО НЕ ЭКРАНИРУЕМ, так как TipTap уже отдал очищенный HTML (у нас DOMPurify в компоненте).
      case 'text':  return `<div dir="ltr"${align((b as TextBlock).align)}>${(b as TextBlock).text || ''}</div>`;

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
  const [editType, setEditType] = useState<'post'|'news'|'lesson'|'case'|null>(null);

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
  const [caseApplication, setCaseApplication] = useState<string>('');
  const [caseLocation, setCaseLocation] = useState<string>('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<BlogPost[]>([]);
  const [scheduledNews, setScheduledNews] = useState<NewsItem[]>([]);
  const [showScheduled, setShowScheduled] = useState(false);

  useEffect(() => { setAuthed(auth.isAuthed()); }, []);

  // читать query-параметры из URL на клиенте
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    setEditSlug(sp.get('edit') || '');
    const t = sp.get('type');
    setEditType(
      t === 'post' || t === 'news' || t === 'lesson' || t === 'case'
        ? (t as 'post'|'news'|'lesson'|'case')
        : null
    );
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
      setCaseApplication(d.caseApplication || '');
      setCaseLocation(d.caseLocation || '');
    }
  }, [editSlug]);

  // автосейв
  useEffect(() => {
    const draft: BlogDraft = {
      kind, title, subtitle, cover, blocks, tags, savedAt: Date.now(),
      ...(kind === 'case' ? { caseApplication, caseLocation } : {}),
    };
    const t = setTimeout(()=>saveDraft(draft), 250);
    return ()=>clearTimeout(t);
  }, [kind, title, subtitle, cover, blocks, tags, caseApplication, caseLocation]);

  // режим редактирования
  useEffect(() => {
    if (!editSlug || !editType) return;
    setLoadingEdit(true);
    (async () => {
      try {
        if (editType === 'post' || editType === 'lesson') {
          const p = await sb_getPostBySlug(editSlug).catch(() => undefined) || getPostBySlug(editSlug);
          if (p) {
            setKind((p.kind as any) || 'post'); setTitle(p.title); setSubtitle(p.subtitle||'');
            setCover(p.cover); setTags(p.tags||[]);
            setBlocks([{ id: uid(), type:'text', align:'left', text: p.contentHtml } as TextBlock]);
            setStep(2);
          }
        } else if (editType === 'case') {
          const c = await sb_getCaseBySlug(editSlug);
          if (c) {
            setKind('case'); setTitle(c.title); setSubtitle(c.subtitle||'');
            setCover(c.cover); setTags((c.tags as any) || []);
            setCaseApplication(c.application || '');
            setCaseLocation(c.location || '');
            setBlocks([{ id: uid(), type:'text', align:'left', text: c.contentHtml } as TextBlock]);
            setStep(2);
          }
        } else {
          const n = await sb_getNewsBySlug(editSlug).catch(() => undefined) || getNewsBySlug(editSlug);
          if (n) {
            setKind('news'); setTitle(n.title); setSubtitle('');
            setCover(n.cover); setTags(n.tags||[]);
            setBlocks([{ id: uid(), type:'text', align:'left', text: n.contentHtml || '' } as TextBlock]);
            setStep(2);
          }
        }
      } finally {
        setLoadingEdit(false);
      }
    })();
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

  // помощники по блокам (часть может быть не использована, но оставим для совместимости)
  const addBlock = (b: Block) => setBlocks(v => [...v, b]);
  const moveUp = (i:number) => setBlocks(v => (i<=0? v : [ ...v.slice(0,i-1), v[i], v[i-1], ...v.slice(i+1) ]));
  const moveDown = (i:number) => setBlocks(v => (i>=v.length-1? v : [ ...v.slice(0,i), v[i+1], v[i], ...v.slice(i+2) ]));
  const removeAt = (i:number) => setBlocks(v => v.filter((_,idx)=>idx!==i));
  const updateAt = (i:number, b:Partial<Block>) => setBlocks(v => v.map((x,idx)=> idx===i ? ({...x, ...b} as Block) : x));

  // медиа (оставлено для совместимости со старыми блоками, сейчас не используется)
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

  const formatError = (err: unknown) => {
    try {
      if (!err) return 'unknown';
      if (typeof err === 'string') return err;
      if (err instanceof Error) {
        const anyErr: any = err as any;
        return JSON.stringify({
          name: anyErr.name,
          message: anyErr.message,
          code: anyErr.code,
          details: anyErr.details,
          hint: anyErr.hint,
          status: anyErr.status,
        });
      }
      const anyErr: any = err as any;
      return JSON.stringify({
        name: anyErr?.name,
        message: anyErr?.message,
        code: anyErr?.code,
        details: anyErr?.details,
        hint: anyErr?.hint,
        status: anyErr?.status,
      });
    } catch {
      return 'unserializable error';
    }
  };

  const publish = async () => {
    if (!canPublish) return;
    const now = Date.now();
    // Если редактируем — сохраняем исходный slug
    const prevPost = editSlug && editType==='post' ?
      (await sb_getPostBySlug(editSlug).catch(() => undefined)) || getPostBySlug(editSlug) : undefined;
    const prevNews = editSlug && editType==='news' ?
      (await sb_getNewsBySlug(editSlug).catch(() => undefined)) || getNewsBySlug(editSlug) : undefined;
    const slug = (prevPost?.slug || prevNews?.slug) || genSlug(title);

    // CORE: получаем HTML из единственного текстового блока (TipTap)
    const html =
      blocks.length && (blocks[0] as TextBlock).type === 'text'
        ? (blocks[0] as TextBlock).text
        : renderBlocks(blocks);

    // Check if scheduled publishing
    const publishTime = scheduledDate ? new Date(scheduledDate).getTime() : now;
    const isScheduled = publishTime > now;

    try {
      if (kind === 'post' || kind === 'lesson') {
        const prev = prevPost;
        const p: BlogPost = {
          id: prev?.id || crypto.randomUUID(),
          slug, title, subtitle: (kind==='post'?subtitle:undefined),
          cover, contentHtml: html, tags, kind,
          createdAt: prev?.createdAt || publishTime, updatedAt: now,
          views: prev?.views || 0, reactions: prev?.reactions || {heart:0,fire:0,smile:0}
        };

        // Пытаемся сохранить в Supabase
        try {
          await sb_upsertPost(p);
          console.log('Post saved to Supabase successfully');
        } catch (error) {
          console.error('Supabase save failed, using local fallback:', error);
          upsertPost(p);
        }

        clearDraft();

        const typeName = kind === 'post' ? 'статья' : 'урок';
        if (isScheduled) {
          showNotificationToast(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} запланирована на ${new Date(publishTime).toLocaleString('ru-RU')}`);
        } else {
          showNotificationToast(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} опубликована!`);
          // Force refresh blog pages
          window.dispatchEvent(new CustomEvent('blogUpdated'));
          window.location.href = `/blog/${p.slug}`;
        }
      } else if (kind === 'case') {
        // Сохраняем кейс в отдельную таблицу cases
        const prevCase = editSlug && editType === 'case' ? await sb_getCaseBySlug(editSlug) : undefined;
        const caseSlug = prevCase?.slug || slug;
        
        try {
          await sb_upsertCase({
            id: prevCase?.id || crypto.randomUUID(),
            slug: caseSlug,
            title,
            subtitle,
            cover,
            contentHtml: html,
            tags,
            application: caseApplication || undefined,
            location: caseLocation || undefined,
            createdAt: prevCase?.createdAt || now,
            updatedAt: now,
            views: prevCase?.views || 0,
            reactions: prevCase?.reactions || { heart:0, fire:0, smile:0 }
          });
          console.log('Case saved to Supabase successfully');
        } catch (error) {
          console.error('Supabase save failed:', error, formatError(error));
          // Если ошибка связана с отсутствием колонок application/location, попробуем сохранить без них
          const errorMsg = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
          if (errorMsg.includes('application') || errorMsg.includes('location') || errorMsg.includes('column')) {
            console.warn('Retrying without application/location fields...');
            try {
              await sb_upsertCase({
                id: prevCase?.id || crypto.randomUUID(),
                slug: caseSlug,
                title,
                subtitle,
                cover,
                contentHtml: html,
                tags,
                createdAt: prevCase?.createdAt || now,
                updatedAt: now,
                views: prevCase?.views || 0,
                reactions: prevCase?.reactions || { heart:0, fire:0, smile:0 }
              });
              console.log('Case saved without application/location fields');
              showNotificationToast('Кейс сохранён, но поля "Тип" и "Место" не сохранены. Добавьте колонки application и location в таблицу cases в Supabase.');
            } catch (retryError) {
              console.error('Retry also failed:', retryError);
              showNotificationToast('Ошибка при сохранении. Проверьте консоль.');
              return; // Не продолжаем, если повторная попытка тоже не удалась
            }
          } else {
            // Важное: sb_upsertCase уже сохранил локально как fallback (см. blogStore),
            // поэтому показываем понятное сообщение, что Supabase отказал (RLS/права/схема).
            showNotificationToast('Supabase отклонил сохранение, но кейс сохранён локально (в этом браузере). Проверьте права/RLS таблицы cases в Supabase.');
            return; // Не продолжаем при других ошибках
          }
        }
        
        clearDraft();
        if (isScheduled) {
          showNotificationToast(`Кейс запланирован на ${new Date(publishTime).toLocaleString('ru-RU')}`);
        } else {
          showNotificationToast('Кейс опубликован!');
          window.location.href = `/cases2/${caseSlug}`;
        }
      } else {
        const prev = prevNews;
        const n: NewsItem = {
          id: prev?.id || crypto.randomUUID(),
          slug, title, cover, contentHtml: html || undefined, tags,
          createdAt: prev?.createdAt || publishTime, updatedAt: now,
          views: prev?.views || 0, reactions: prev?.reactions || {heart:0,fire:0,smile:0}
        };

        // Пытаемся сохранить в Supabase
        try {
          await sb_upsertNews(n);
          console.log('News saved to Supabase successfully');
        } catch (error) {
          console.error('Supabase save failed, using local fallback:', error);
          upsertNews(n);
        }

        clearDraft();

        if (isScheduled) {
          showNotificationToast(`Новость запланирована на ${new Date(publishTime).toLocaleString('ru-RU')}`);
        } else {
          showNotificationToast('Новость опубликована!');
          // Обновляем страницы новостей
          window.dispatchEvent(new CustomEvent('newsUpdated'));
          window.location.href = `/news/${n.slug}`;
        }
      }
    } catch (error) {
      console.error('Publish failed:', error);
      showNotificationToast('Ошибка при сохранении. Проверьте консоль.');
    }
  };

  const doDelete = async () => {
    if (!editSlug || !editType) return;
    if (!confirm('Точно удалить?')) return;

    try {
      if (editType==='post' || editType==='lesson') {
        const p = await sb_getPostBySlug(editSlug).catch(() => undefined) || getPostBySlug(editSlug);
        if (p) {
          try {
            await sb_deletePostById(p.id);
            console.log('Post deleted from Supabase successfully');
          } catch (error) {
            console.error('Supabase delete failed, using local fallback:', error);
            deletePostById(p.id);
          }
        }
        window.location.href = '/blog';
      } else if (editType==='case') {
        // удаляем по slug из таблицы cases
        const c = await sb_getCaseBySlug(editSlug);
        if (c) await sb_deleteCaseById(c.id);
        window.location.href = '/cases2';
      } else {
        const n = await sb_getNewsBySlug(editSlug).catch(() => undefined) || getNewsBySlug(editSlug);
        if (n) {
          try {
            await sb_deleteNewsById(n.id);
            console.log('News deleted from Supabase successfully');
          } catch (error) {
            console.error('Supabase delete failed, using local fallback:', error);
            deleteNewsById(n.id);
          }
        }
        window.location.href = '/news';
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Ошибка при удалении. Проверьте консоль.');
    }
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

  if (!authed) {
    return (
      <div className="bg-[#f2f3f7] min-h-screen font-[Raleway]">
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
            <div className="flex items-center gap-2">
              <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Назад
              </Link>
              <Link href="/blog/stories" className="rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]">Сторисы</Link>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {editSlug && editType && (
                <button onClick={doDelete} className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-[#111]">Удалить</button>
              )}
              <button
                onClick={() => setShowScheduled(!showScheduled)}
                className="px-4 py-2 rounded-lg border border-yellow-300 text-yellow-600 hover:bg-yellow-50"
              >
                {showScheduled ? 'Скрыть' : 'Показать'} отложенные ({scheduledPosts.length + scheduledNews.length})
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
            {showScheduled && (scheduledPosts.length > 0 || scheduledNews.length > 0) && (
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
                  placeholder={
                    kind==='news' ? 'Заголовок новости' :
                    kind==='case' ? 'Заголовок кейса' :
                    kind==='lesson' ? 'Заголовок урока' : 'Заголовок статьи'
                  }
                  value={title} onChange={e=>setTitle(e.target.value)}
                />
                {(kind==='post' || kind==='case') && (
                  <input
                    className="w-full border rounded-xl px-4 py-3 text-[#111]"
                    placeholder="Подзаголовок (необязательно)"
                    value={subtitle} onChange={e=>setSubtitle(e.target.value)}
                  />
                )}
                {kind==='case' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-2">Тип кейса</label>
                      <select
                        className="w-full border rounded-xl px-4 py-3 text-[#111] bg-white"
                        value={caseApplication}
                        onChange={e=>setCaseApplication(e.target.value)}
                      >
                        <option value="">— Выберите тип —</option>
                        {CASE_APPLICATION_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-2">Место проведения работ</label>
                      <input
                        className="w-full border rounded-xl px-4 py-3 text-[#111]"
                        placeholder="Например: Ростов-на-Дону, Красноярский край"
                        value={caseLocation}
                        onChange={e=>setCaseLocation(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2 — контент (TipTap) */}
            {step===2 && (
              <div className="space-y-8">
                <StepTitle>Контент</StepTitle>

                <TipTapEditor
                  initialHtml={
                    // Если уже есть один текстовый блок — берём из него
                    (blocks.length && (blocks[0] as TextBlock).type === 'text')
                      ? (blocks[0] as TextBlock).text
                      : ''
                  }
                  onChange={(html: string) => {
                    // Храним весь контент как один «text»-блок с готовым HTML
                    setBlocks([{ id: uid(), type:'text', align:'left', text: html } as TextBlock]);
                  }}
                />
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
