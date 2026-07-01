'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import Image from 'next/image';
import { BlogPost } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';
import { authStore } from '@/lib/authStore';
import { sb_react, sb_getReactions, myReactions } from '@/lib/blogStore';
import CommentSection from './CommentSection';

type Rx = 'heart' | 'fire' | 'smile';

export default function PostCard({ p }: { p: BlogPost }) {
  const [myRx, setMyRx] = useState<Rx[]>(() => myReactions(p.id) as Rx[]);
  const [reactions, setReactions] = useState(p.reactions ?? { heart: 0, fire: 0, smile: 0 });
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shareRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    sb_getReactions('post', p.id).then(setReactions).catch(() => {});
  }, [p.id]);

  React.useEffect(() => {
    if (!shareOpen) return;
    const h = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [shareOpen]);

  const handleReact = async (type: Rx, e: React.MouseEvent) => {
    e.preventDefault();
    if (!authStore.isAuthenticated()) { window.dispatchEvent(new CustomEvent('openAuthModal')); return; }
    if (myRx.includes(type)) return;
    setMyRx(prev => [...prev, type]);
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    try { await sb_react('post', p.id, type); } catch {}
  };

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${p.slug}`;

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(postUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000); setShareOpen(false);
  };

  const shareVk = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://vk.com/share.php?url=${encodeURIComponent(postUrl)}`, '_blank');
    setShareOpen(false);
  };

  const shareTg = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}`, '_blank');
    setShareOpen(false);
  };

  const views = p.views || 0;

  return (
    <article className="bg-white rounded-2xl overflow-hidden font-[Raleway]">

      {/* ── Заголовок ── */}
      <div className="px-5 pt-5">
        <Link href={`/blog/${p.slug}`}>
          <h3 className="text-[20px] font-bold text-[#1a1a1a] leading-[1.25] hover:text-[#029cda] transition-colors">
            {p.title}
          </h3>
        </Link>
      </div>

      {/* ── Подзаголовок / превью ── */}
      {(p.subtitle || p.contentHtml) && (
        <div className="px-5 pt-2">
          <p className="text-[14px] text-[#52555a] leading-relaxed line-clamp-2">
            {p.subtitle || p.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)}
          </p>
        </div>
      )}

      {/* ── Теги ── */}
      {!!(p.tags?.length) && (
        <div className="px-5 pt-2.5 flex flex-wrap gap-1.5">
          {p.tags!.slice(0, 4).map(t => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              onClick={e => e.stopPropagation()}
              className="text-[12px] text-[#029cda] hover:text-[#0280b5] bg-[#f0faff] px-2.5 py-0.5 rounded-full transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* ── Обложка ── */}
      {p.cover && (
        <Link href={`/blog/${p.slug}`} className="block mt-3 mx-5">
          <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative bg-[#f2f3f7]">
            <Image
              src={p.cover}
              alt={p.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 660px"
            />
          </div>
        </Link>
      )}

      {/* ── Дата под обложкой, справа ── */}
      <div className="px-5 pt-2 flex justify-end">
        <span className="text-[12px] text-[#8c9099]">{formatContentDate(p.createdAt, p.updatedAt)}</span>
      </div>

      {/* ── Кнопка «Читать» ── */}
      <div className="px-5 pt-1 pb-1">
        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#029cda] hover:text-[#0280b5] transition-colors"
        >
          {expanded ? 'Свернуть' : 'Читать'}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── Развёрнутый контент ── */}
      {expanded && (
        <div className="px-5 pb-2">
          <div className="h-px bg-[#e8eaed] mb-4" />

          {/* Тело статьи */}
          <div
            className="article-content max-w-none text-[#313131] font-[Raleway]"
            dangerouslySetInnerHTML={{ __html: p.contentHtml }}
          />

          {/* Ссылка на полную статью */}
          <div className="mt-4 pt-4 border-t border-[#e8eaed]">
            <Link
              href={`/blog/${p.slug}`}
              className="text-[13px] font-semibold text-[#029cda] hover:text-[#0280b5] transition-colors"
            >
              Открыть полную версию →
            </Link>
          </div>

          {/* Комментарии */}
          <div className="mt-4 pt-4 border-t border-[#e8eaed]">
            <CommentSection postId={p.id} postType="post" />
          </div>
        </div>
      )}

      {/* ── Нижняя панель действий ── */}
      <div className="px-5 py-3 border-t border-[#f0f1f3] flex items-center gap-1">

        {/* Реакции */}
        {(['heart', 'fire', 'smile'] as Rx[]).map(type => {
          const emojis = { heart: '❤️', fire: '🔥', smile: '😊' };
          const count = reactions[type];
          const active = myRx.includes(type);
          return (
            <button
              key={type}
              onClick={e => handleReact(type, e)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
                ${active ? 'bg-[#e6f6fc] text-[#029cda]' : 'text-[#52555a] hover:bg-[#f5f6f8]'}`}
            >
              <span className="text-[15px] leading-none">{emojis[type]}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}

        {/* Просмотры */}
        <div className="flex items-center gap-1 px-2 py-1.5 text-[13px] text-[#8c9099]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {views > 0 && <span>{views}</span>}
        </div>

        <div className="flex-1" />

        {/* Комментировать */}
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium text-[#52555a] hover:bg-[#f5f6f8] transition-all"
          title="Комментарии"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

        {/* Поделиться */}
        <div ref={shareRef} className="relative">
          <button
            onClick={e => { e.preventDefault(); setShareOpen(v => !v); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
              ${shareOpen ? 'bg-[#f5f6f8] text-[#029cda]' : 'text-[#52555a] hover:bg-[#f5f6f8]'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className="hidden sm:inline">Поделиться</span>
          </button>

          {shareOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-[#e8eaed] p-1.5 flex flex-col min-w-[190px] z-50">
              <button onClick={shareTg} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#2AABEE"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.523c-.148.658-.537.818-1.09.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.447l-2.95-.924c-.641-.203-.654-.641.136-.953l11.527-4.443c.534-.194 1.001.13.609.12z"/></svg>
                Telegram
              </button>
              <button onClick={shareVk} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077FF"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.974 16.8h-1.91c-.724 0-.947-.577-2.247-1.877-1.137-1.1-1.637-.794-1.637.254V16.8c0 .474-.154.8-1.373.8-2.03 0-4.278-1.247-5.857-3.567C3.16 10.8 2.667 8 3.667 8h1.91c.713 0 .98.33 1.25 1.1.69 2.007 1.843 3.767 2.317 3.767.177 0 .257-.08.257-.517V10.4c-.053-1.013-.593-1.1-.593-1.46 0-.177.14-.357.363-.357h3.01c.4 0 .54.217.54.67v3.583c0 .4.173.543.293.543.177 0 .327-.143.653-.47 1.013-1.133 1.737-2.876 1.737-2.876.097-.197.267-.38.663-.38h1.91c.573 0 .697.3.573.67-.24.803-2.563 4.38-2.563 4.38-.2.32-.273.463 0 .82.2.273 1.193 1.18 1.8 1.897.813.95 1.437 1.747 1.603 2.3.16.553-.13.8-.73.8z"/></svg>
                ВКонтакте
              </button>
              <button onClick={copyLink} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                {copied
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                }
                {copied ? 'Скопировано!' : 'Копировать ссылку'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
