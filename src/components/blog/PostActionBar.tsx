'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sb_react, sb_getReactions, myReactions } from '@/lib/blogStore';
import { sb_isFavorite, sb_toggleFavorite } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';

type Rx = 'heart' | 'fire' | 'smile';

interface PostActionBarProps {
  postId: string;
  postType: 'post' | 'news';
  commentsCount: number;
  initialReactions?: { heart: number; fire: number; smile: number };
  onCommentClick: () => void;
  onAuthRequired: () => void;
}

const REACTIONS: { type: Rx; emoji: string; label: string }[] = [
  { type: 'heart', emoji: '❤️', label: 'Нравится' },
  { type: 'fire', emoji: '🔥', label: 'Огонь' },
  { type: 'smile', emoji: '😊', label: 'Круто' },
];

export default function PostActionBar({
  postId,
  postType,
  commentsCount,
  initialReactions,
  onCommentClick,
  onAuthRequired,
}: PostActionBarProps) {
  const [reactions, setReactions] = useState(
    initialReactions ?? { heart: 0, fire: 0, smile: 0 }
  );
  const [myRx, setMyRx] = useState<Rx[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMyRx(myReactions(postId) as Rx[]);
    if (authStore.isAuthenticated()) {
      sb_isFavorite(postId, postType).then(setIsFav).catch(() => {});
    }
    sb_getReactions(postType, postId).then(setReactions).catch(() => {});
  }, [postId, postType]);

  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node))
        setShareOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const handleReact = async (type: Rx) => {
    if (!authStore.isAuthenticated()) { onAuthRequired(); return; }
    if (myRx.includes(type)) return;
    setMyRx(prev => [...prev, type]);
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    try { await sb_react(postType, postId, type); } catch {}
  };

  const handleFav = async () => {
    if (!authStore.isAuthenticated()) { onAuthRequired(); return; }
    try {
      const next = await sb_toggleFavorite(postId, postType);
      setIsFav(next);
    } catch {}
  };

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShareOpen(false);
  };

  const shareVk = () => {
    window.open(`https://vk.com/share.php?url=${encodeURIComponent(pageUrl)}`, '_blank');
    setShareOpen(false);
  };

  const shareTg = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}`, '_blank');
    setShareOpen(false);
  };

  return (
    <div className="sticky bottom-4 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 bg-white rounded-2xl shadow-xl border border-[#e4e7ec] px-3 py-2">

        {/* Реакции */}
        {REACTIONS.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => handleReact(type)}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-involve font-medium transition-all
              ${myRx.includes(type)
                ? 'bg-[#e6f6fc] text-[#029cda]'
                : 'text-[#52555a] hover:bg-[#f6f7f9]'
              }`}
          >
            <span className="text-base leading-none">{emoji}</span>
            {reactions[type] > 0 && <span>{reactions[type]}</span>}
          </button>
        ))}

        <div className="w-px h-5 bg-[#e4e7ec] mx-1" />

        {/* Комментарии */}
        <button
          onClick={onCommentClick}
          title="Комментарии"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-involve font-medium text-[#52555a] hover:bg-[#f6f7f9] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentsCount > 0 && <span>{commentsCount}</span>}
        </button>

        <div className="w-px h-5 bg-[#e4e7ec] mx-1" />

        {/* Поделиться */}
        <div ref={shareRef} className="relative">
          <button
            onClick={() => setShareOpen(v => !v)}
            title="Поделиться"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-involve font-medium transition-all
              ${shareOpen ? 'bg-[#f6f7f9] text-[#029cda]' : 'text-[#52555a] hover:bg-[#f6f7f9]'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Поделиться</span>
          </button>
          {shareOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-[#e4e7ec] p-2 flex flex-col gap-1 min-w-[200px] z-50">
              <button onClick={shareTg} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[#f6f7f9] text-[#313131] font-involve font-medium text-sm text-left transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#2AABEE"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.523c-.148.658-.537.818-1.09.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.24 14.447l-2.95-.924c-.641-.203-.654-.641.136-.953l11.527-4.443c.534-.194 1.001.13.609.12z"/></svg>
                Telegram
              </button>
              <button onClick={shareVk} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[#f6f7f9] text-[#313131] font-involve font-medium text-sm text-left transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077FF"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.974 16.8h-1.91c-.724 0-.947-.577-2.247-1.877-1.137-1.1-1.637-.794-1.637.254V16.8c0 .474-.154.8-1.373.8-2.03 0-4.278-1.247-5.857-3.567C3.16 10.8 2.667 8 3.667 8h1.91c.713 0 .98.33 1.25 1.1.69 2.007 1.843 3.767 2.317 3.767.177 0 .257-.08.257-.517V10.4c-.053-1.013-.593-1.1-.593-1.46 0-.177.14-.357.363-.357h3.01c.4 0 .54.217.54.67v3.583c0 .4.173.543.293.543.177 0 .327-.143.653-.47 1.013-1.133 1.737-2.876 1.737-2.876.097-.197.267-.38.663-.38h1.91c.573 0 .697.3.573.67-.24.803-2.563 4.38-2.563 4.38-.2.32-.273.463 0 .82.2.273 1.193 1.18 1.8 1.897.813.95 1.437 1.747 1.603 2.3.16.553-.13.8-.73.8z"/></svg>
                ВКонтакте
              </button>
              <button onClick={copyLink} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[#f6f7f9] text-[#313131] font-involve font-medium text-sm text-left transition-colors">
                {copied ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                )}
                {copied ? 'Скопировано!' : 'Копировать ссылку'}
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#e4e7ec] mx-1" />

        {/* Избранное */}
        <button
          onClick={handleFav}
          title={isFav ? 'Убрать из избранного' : 'В избранное'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-involve font-medium transition-all
            ${isFav ? 'text-[#029cda] bg-[#e6f6fc]' : 'text-[#52555a] hover:bg-[#f6f7f9]'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

      </div>
    </div>
  );
}
