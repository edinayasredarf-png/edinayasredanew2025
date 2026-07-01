'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
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
  const [liked, setLiked] = useState(() => (myReactions(p.id) as string[]).includes('heart'));
  const [likeCount, setLikeCount] = useState((p.reactions?.heart ?? 0));
  const [isFav, setIsFav] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    sb_getReactions('post', p.id).then(r => setLikeCount(r.heart ?? 0)).catch(() => {});
  }, [p.id]);

  useEffect(() => {
    if (!authStore.isAuthenticated()) return;
    sb_isFavorite(p.id, 'post').then(setIsFav).catch(() => {});
  }, [p.id]);

  useEffect(() => {
    if (!shareOpen) return;
    const h = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [shareOpen]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authStore.isAuthenticated()) { window.dispatchEvent(new CustomEvent('openAuthModal')); return; }
    if (liked) return;
    setLiked(true);
    setLikeCount(c => c + 1);
    try { await sb_react('post', p.id, 'heart'); } catch {}
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authStore.isAuthenticated()) { window.dispatchEvent(new CustomEvent('openAuthModal')); return; }
    try {
      const next = await sb_toggleFavorite(p.id, 'post');
      setIsFav(next);
    } catch {}
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
          <p className="text-[15px] text-[#52555a] leading-relaxed font-[Raleway] font-normal">
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

      {/* Дата */}
      <div className="px-5 pt-2 flex justify-end">
        <span className="text-[12px] text-[#8c9099]">{formatContentDate(p.createdAt, p.updatedAt)}</span>
      </div>

      {/* Нижняя панель */}
      <div className="px-5 py-3 border-t border-[#f0f1f3] flex items-center gap-1">

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

        {/* Комментарии → страница статьи */}
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
            onClick={e => { e.preventDefault(); setShareOpen(v => !v); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
              ${shareOpen ? 'bg-[#f5f6f8] text-[#029cda]' : 'text-[#52555a] hover:bg-[#f5f6f8]'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>

          {shareOpen && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-[#e8eaed] p-1.5 flex flex-col min-w-[200px] z-50">
              <button onClick={copyLink} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                {copied
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                }
                {copied ? 'Скопировано!' : 'Копировать ссылку'}
              </button>
              <button onClick={shareTg} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#2AABEE"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.523c-.148.658-.537.818-1.09.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.447l-2.95-.924c-.641-.203-.654-.641.136-.953l11.527-4.443c.534-.194 1.001.13.609.12z"/></svg>
                Поделиться в Telegram
              </button>
              <button onClick={shareVk} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f6f8] text-[#313131] text-[13px] font-medium text-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077FF"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.974 16.8h-1.91c-.724 0-.947-.577-2.247-1.877-1.137-1.1-1.637-.794-1.637.254V16.8c0 .474-.154.8-1.373.8-2.03 0-4.278-1.247-5.857-3.567C3.16 10.8 2.667 8 3.667 8h1.91c.713 0 .98.33 1.25 1.1.69 2.007 1.843 3.767 2.317 3.767.177 0 .257-.08.257-.517V10.4c-.053-1.013-.593-1.1-.593-1.46 0-.177.14-.357.363-.357h3.01c.4 0 .54.217.54.67v3.583c0 .4.173.543.293.543.177 0 .327-.143.653-.47 1.013-1.133 1.737-2.876 1.737-2.876.097-.197.267-.38.663-.38h1.91c.573 0 .697.3.573.67-.24.803-2.563 4.38-2.563 4.38-.2.32-.273.463 0 .82.2.273 1.193 1.18 1.8 1.897.813.95 1.437 1.747 1.603 2.3.16.553-.13.8-.73.8z"/></svg>
                ВКонтакте
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Просмотры */}
        <div className="flex items-center gap-1 text-[13px] text-[#8c9099]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {views > 0 && <span>{views}</span>}
        </div>
      </div>
    </article>
  );
}
