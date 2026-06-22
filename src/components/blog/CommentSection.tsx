'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Comment, sb_listComments, sb_createComment, sb_deleteComment } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';
import AuthModal from '@/components/auth/AuthModal';

interface CommentSectionProps {
  postId: string;
  postType: 'post' | 'news';
  onCountChange?: (n: number) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн. назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function Avatar({ name, avatar, size = 36 }: { name: string; avatar?: string; size?: number }) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#029cda', '#0288bd', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-involve font-bold shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initials || '?'}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  currentUserId?: string;
  isAdmin: boolean;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

function CommentItem({ comment, allComments, currentUserId, isAdmin, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const replies = allComments.filter(c => c.parent_id === comment.id);

  if (comment.is_deleted && replies.length === 0) return null;

  return (
    <div className={depth > 0 ? 'ml-10 mt-3' : 'mt-0'}>
      <div className="flex gap-3">
        <Avatar name={comment.author_name} avatar={comment.author_avatar} size={36} />
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-involve font-medium text-[#313131] text-sm">{comment.author_name}</span>
              <span className="text-[#a0aec0] text-xs">{timeAgo(comment.created_at)}</span>
            </div>
            {comment.is_deleted ? (
              <p className="text-[#a0aec0] text-sm italic">Комментарий удалён</p>
            ) : (
              <p className="text-[#313131] text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
          {!comment.is_deleted && (
            <div className="flex items-center gap-3 mt-1.5 px-1">
              <button
                onClick={() => onReply(comment.id, comment.author_name)}
                className="text-xs text-[#a0aec0] hover:text-[#029cda] transition-colors font-involve font-medium"
              >
                Ответить
              </button>
              {(currentUserId === comment.author_id || isAdmin) && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-xs text-[#a0aec0] hover:text-red-500 transition-colors font-involve font-medium"
                >
                  Удалить
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div className="border-l-2 border-[#e4e7ec] ml-[18px] pl-1">
          {replies.map(r => (
            <CommentItem
              key={r.id}
              comment={r}
              allComments={allComments}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, postType, onCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [profile, setProfile] = useState(authStore.getCurrentProfile());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setIsAuth(authStore.isAuthenticated());
      setProfile(authStore.getCurrentProfile());
    });
    setIsAuth(authStore.isAuthenticated());
    setProfile(authStore.getCurrentProfile());
    return unsub;
  }, []);

  useEffect(() => {
    sb_listComments(postId, postType)
      .then(data => {
        setComments(data);
        const top = data.filter(c => !c.parent_id && !c.is_deleted).length;
        onCountChange?.(top);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, postType]);

  const handleReply = (id: string, name: string) => {
    if (!isAuth) { setShowAuth(true); return; }
    setReplyTo({ id, name });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить комментарий?')) return;
    try {
      await sb_deleteComment(id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, is_deleted: true } : c));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!isAuth) { setShowAuth(true); return; }
    setSubmitting(true);
    try {
      const c = await sb_createComment(postId, postType, text.trim(), replyTo?.id);
      setComments(prev => {
        const next = [...prev, c];
        const top = next.filter(x => !x.parent_id && !x.is_deleted).length;
        onCountChange?.(top);
        return next;
      });
      setText('');
      setReplyTo(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/401|авторизац|войдите/i.test(msg)) setShowAuth(true);
      else alert('Ошибка: ' + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter(c => !c.parent_id);

  return (
    <div id="comments" className="mt-10">
      <h3 className="font-involve font-bold text-[#313131] text-2xl mb-6">
        Комментарии{comments.filter(c => !c.is_deleted).length > 0 && ` · ${comments.filter(c => !c.is_deleted).length}`}
      </h3>

      {/* Форма */}
      <div className="bg-white rounded-2xl p-4 mb-6">
        {isAuth ? (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <Avatar
                name={profile?.full_name || profile?.email || 'Вы'}
                avatar={profile?.avatar_url}
                size={36}
              />
              <div className="flex-1">
                {replyTo && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-[#029cda] font-involve">
                    <span>↩ Ответ для {replyTo.name}</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-[#a0aec0] hover:text-[#313131]">✕</button>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Напишите комментарий..."
                  rows={3}
                  className="w-full resize-none text-sm text-[#313131] placeholder-[#a0aec0] border-none outline-none bg-transparent font-[Raleway] leading-relaxed"
                />
                <div className="flex justify-end mt-2 pt-2 border-t border-[#f6f7f9]">
                  <button
                    type="submit"
                    disabled={submitting || !text.trim()}
                    className="px-5 py-2 bg-[#029cda] text-white text-sm font-involve font-medium rounded-xl hover:bg-[#0288bd] disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="w-full flex items-center gap-3 text-[#a0aec0] hover:text-[#313131] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#f6f7f9] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span className="text-sm font-involve font-medium">Войдите, чтобы оставить комментарий</span>
            <span className="ml-auto text-xs px-3 py-1.5 bg-[#029cda] text-white rounded-xl font-involve font-medium">Войти</span>
          </button>
        )}
      </div>

      {/* Список комментариев */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#029cda] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-center text-[#a0aec0] text-sm py-8 font-[Raleway]">Пока нет комментариев. Будьте первым!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {topLevel.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              allComments={comments}
              currentUserId={authStore.getCurrentUser()?.id}
              isAdmin={authStore.isAdmin()}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />
    </div>
  );
}
