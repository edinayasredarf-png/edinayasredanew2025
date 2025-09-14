'use client';
import Link from 'next/link';
import React from 'react';
import { BlogPost, react } from '@/lib/blogStore';

export default function PostCard({ p }: { p: BlogPost }) {
  const rx = p.reactions || {heart:0,fire:0,smile:0};
  const total = rx.heart + rx.fire + rx.smile;

  const getKindBadge = (kind?: string) => {
    switch (kind) {
      case 'lesson': return { text: 'УРОК', color: 'bg-blue-100 text-blue-800' };
      case 'case': return { text: 'КЕЙС', color: 'bg-green-100 text-green-800' };
      case 'news': return { text: 'НОВОСТЬ', color: 'bg-orange-100 text-orange-800' };
      default: return null;
    }
  };

  const kindBadge = getKindBadge(p.kind);

  return (
    <article className="w-full max-w-[372px] bg-white rounded-3xl p-4 border">
      <Link href={`/blog/${p.slug}`} className="block">
        <div className="w-full aspect-[16/9] bg-[#f2f3f7] rounded-2xl overflow-hidden">
          <img src={p.cover || 'https://placehold.co/340x192'} alt={p.title} className="w-full h-full object-cover" />
        </div>
      </Link>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/blog/${p.slug}`} className="block flex-1">
            <h3 className="text-[20px] font-semibold text-[#111] leading-snug">{p.title}</h3>
          </Link>
          {kindBadge && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${kindBadge.color} flex-shrink-0`}>
              {kindBadge.text}
            </span>
          )}
        </div>
        {p.subtitle && <p className="mt-2 text-base text-[#52555a] line-clamp-2">{p.subtitle}</p>}
      </div>

      {!!(p.tags?.length) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.tags!.map(t => (
            <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="text-sm text-[#2777ff]">#{t}</Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-sm text-[#52555a]">
        <button onClick={()=>react('post', p.id, 'heart')} className="flex items-center gap-1 bg-[#f2f3f7] px-2 py-1 rounded-lg hover:bg-[#e9eefb]"><span>❤</span><span>{rx.heart}</span></button>
        <button onClick={()=>react('post', p.id, 'fire')} className="flex items-center gap-1 bg-[#f2f3f7] px-2 py-1 rounded-lg hover:bg-[#e9eefb]"><span>🔥</span><span>{rx.fire}</span></button>
        <button onClick={()=>react('post', p.id, 'smile')} className="flex items-center gap-1 bg-[#f2f3f7] px-2 py-1 rounded-lg hover:bg-[#e9eefb]"><span>🙂</span><span>{rx.smile}</span></button>
        <div className="ml-auto flex items-center gap-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" stroke="#a4a8b2" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3" fill="#a4a8b2"/></svg>
          <span>{p.views || 0}</span>
        </div>
        {!!total && <span className="ml-1 text-xs text-[#2777ff]">{total}</span>}
      </div>
    </article>
  );
}
