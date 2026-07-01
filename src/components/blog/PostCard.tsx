'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BlogPost } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';
import { authStore } from '@/lib/authStore';
import { sb_react, sb_getReactions, myReactions } from '@/lib/blogStore';
import { sb_isFavorite, sb_toggleFavorite } from '@/lib/commentsStore';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function PostCard({ p }: { p: BlogPost }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(p.reactions?.heart ?? 0);
  const [isFav, setIsFav] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiked((myReactions(p.id) as string[]).includes('heart'));
    sb_getReactions('post', p.id).then(r => setLikeCount(r.heart ?? 0)).catch(() => {});
    if (authStore.isAuthenticated()) {
      sb_isFavorite(p.id, 'post').then(setIsFav).catch(() => {});
    }
  }, [p.id]);

  useEffect(() => {
    if (!shareOpen) return;
    const h = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [shareOpen]);

  const handleLike = async () => {
    if (!authStore.isAuthenticated()) { window.dispatchEvent(new CustomEvent('openAuthModal')); return; }
    if (liked) return;
    setLiked(true);
    setLikeCount(c => c + 1);
    try { await sb_react('post', p.id, 'heart'); } catch {}
  };

  const handleFav = async () => {
    if (!authStore.isAuthenticated()) { window.dispatchEvent(new CustomEvent('openAuthModal')); return; }
    try {
      const next = await sb_toggleFavorite(p.id, 'post');
      setIsFav(next);
    } catch {}
  };

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${p.slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000); setShareOpen(false);
  };

  const preview = p.subtitle || (p.contentHtml ? stripHtml(p.contentHtml) : '');
  const views = p.views || 0;

  return (
    <article className="bg-white rounded-2xl overflow-hidden font-[Raleway]">

      {/* Заголовок */}
      <div className="px-5 pt-5">
        <Link href={`/blog/${p.slug}`}>
          <h3 className="text-[20px] font-bold text-[#1a1a1a] leading-[1.25] hover:text-[#029cda] transition-colors">
            {p.title}
          </h3>
        </Link>
      </div>

      {/* Превью */}
      {preview && (
        <Link href={`/blog/${p.slug}`} className="block px-5 pt-2">
          <p className="text-[15px] text-[#52555a] leading-relaxed font-normal">
            {preview.length > 200 ? preview.slice(0, 200) + '…' : preview}
          </p>
        </Link>
      )}

      {/* Теги */}
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

      {/* Обложка */}
      {p.cover && (
        <Link href={`/blog/${p.slug}`} className="block mt-3 mx-5">
          <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative bg-[#f2f3f7]">
            <Image src={p.cover} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 660px" />
          </div>
        </Link>
      )}

      {/* Нижняя панель */}
      <div className="px-5 py-3 border-t border-[#f0f1f3] mt-3 flex items-center gap-1">

        {/* Лайк */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
            ${liked ? 'bg-red-50 text-red-500' : 'text-[#52555a] hover:bg-[#f5f6f8]'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Комментарии */}
        <Link
          href={`/blog/${p.slug}#comments`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium text-[#52555a] hover:bg-[#f5f6f8] transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </Link>

        {/* Избранное */}
        <button
          onClick={handleFav}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
            ${isFav ? 'bg-[#e0f2fd] text-[#029cda]' : 'text-[#52555a] hover:bg-[#f5f6f8]'}`}
          title={isFav ? 'Убрать из избранного' : 'В избранное'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

        {/* Поделиться */}
        <div ref={shareRef} className="relative">
          <button
            onClick={() => setShareOpen(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
              ${shareOpen ? 'bg-[#f5f6f8] text-[#029cda]' : 'text-[#52555a] hover:bg-[#f5f6f8]'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>

          {shareOpen && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-[#e8eaed] p-1.5 flex flex-col min-w-[210px] z-50">
              <button onClick={copyLink} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                {copied
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                }
                {copied ? 'Скопировано!' : 'Копировать ссылку'}
              </button>
              <button onClick={() => { window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}`, '_blank'); setShareOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                <Image src="/icons/tg.svg" alt="Telegram" width={18} height={18} />
                Поделиться в Telegram
              </button>
              <button onClick={() => { window.open(`https://vk.com/share.php?url=${encodeURIComponent(postUrl)}`, '_blank'); setShareOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                <Image src="/icons/vk.svg" alt="ВКонтакте" width={18} height={18} />
                ВКонтакте
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Дата и просмотры */}
        <div className="flex items-center gap-3 text-[12px] text-[#8c9099]">
          <span>{formatContentDate(p.createdAt, p.updatedAt)}</span>
          {views > 0 && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {views}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
