'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Comment, sb_listComments, sb_createComment, sb_deleteComment } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';
import AuthModal from '@/components/auth/AuthModal';

interface CommentSectionProps {
  postId: string;
  postType: 'post' | 'news';
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  level: number;
}

function CommentItem({ comment, onReply, onDelete, level }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReplies = async () => {
    if (replies.length > 0) return;
    setLoading(true);
    try {
      // In a real app, you'd have a separate API for replies
      // For now, we'll just show the replies_count
      setReplies([]);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = () => {
    onReply(comment.id);
  };

  const handleDelete = async () => {
    if (confirm('Удалить комментарий?')) {
      try {
        await sb_deleteComment(comment.id);
        onDelete(comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Ошибка при удалении комментария');
      }
    }
  };

  const isAuthor = authStore.getCurrentUser()?.id === comment.author_id;
  const canDelete = isAuthor || authStore.isAdmin();

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 mb-3 font-raleway">
        <div className="flex items-start gap-3">
          {comment.author_avatar ? (
            <Image
              src={comment.author_avatar}
              alt={comment.author_name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {comment.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{comment.author_name}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handleReply}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Ответить
              </button>

              {comment.replies_count > 0 && (
                <button
                  onClick={() => {
                    setShowReplies(!showReplies);
                    if (!showReplies) loadReplies();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  {showReplies ? 'Скрыть' : 'Показать'} ответы ({comment.replies_count})
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReplies && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Загрузка...</div>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                level={level + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, postType }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
    setIsAuthenticated(authStore.isAuthenticated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadComments();
  }, [postId, postType]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await sb_listComments(postId, postType);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const comment = await sb_createComment(
        postId,
        postType,
        newComment,
        replyingTo || undefined
      );

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Ошибка при создании комментария');
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    document.getElementById('comment-input')?.focus();
  };

  const handleDelete = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <div id="comments" className="mt-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Комментарии ({topLevelComments.length})</h3>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <textarea
            id="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "Написать комментарий..." : "Войдите, чтобы оставить комментарий"}
            className="w-full h-24 resize-none border-none bg-transparent focus:outline-none"
            disabled={!isAuthenticated}
          />

          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-500">
              {replyingTo && (
                <span>
                  Ответ на комментарий •
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    Отменить
                  </button>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!newComment.trim() || !isAuthenticated}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticated ? 'Отправить' : 'Войти'}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Загрузка комментариев...</div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Пока нет комментариев. Будьте первым!
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              level={0}
            />
          ))}
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Optionally reload comments or show success message
        }}
      />
    </div>
  );
}
