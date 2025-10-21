'use client';

import { getSupabase } from './supabase';

export type Comment = {
  id: string;
  post_id: string;
  post_type: 'post' | 'news';
  parent_id?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  updated_at: string;
  replies_count: number;
  is_deleted: boolean;
};

export type Favorite = {
  id: string;
  user_id: string;
  post_id: string;
  post_type: 'post' | 'news';
  created_at: string;
};

// Comments API
export async function sb_listComments(postId: string, postType: 'post' | 'news'): Promise<Comment[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data, error } = await sb
    .from('comments')
    .select(`
      *,
      author:user_profiles!comments_author_id_fkey(full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .eq('post_type', postType)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    post_type: row.post_type,
    parent_id: row.parent_id,
    author_id: row.author_id,
    author_name: row.author?.full_name || 'Аноним',
    author_avatar: row.author?.avatar_url,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    replies_count: row.replies_count || 0,
    is_deleted: row.is_deleted,
  }));
}

export async function sb_createComment(
  postId: string,
  postType: 'post' | 'news',
  content: string,
  parentId?: string
): Promise<Comment> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await sb
    .from('comments')
    .insert({
      post_id: postId,
      post_type: postType,
      parent_id: parentId,
      author_id: user.id,
      content,
    })
    .select(`
      *,
      author:user_profiles!comments_author_id_fkey(full_name, avatar_url)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    post_id: data.post_id,
    post_type: data.post_type,
    parent_id: data.parent_id,
    author_id: data.author_id,
    author_name: data.author?.full_name || 'Аноним',
    author_avatar: data.author?.avatar_url,
    content: data.content,
    created_at: data.created_at,
    updated_at: data.updated_at,
    replies_count: 0,
    is_deleted: false,
  };
}

export async function sb_deleteComment(commentId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await sb
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('author_id', user.id);

  if (error) throw error;
}

// Favorites API
export async function sb_isFavorite(postId: string, postType: 'post' | 'news'): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { data, error } = await sb
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .eq('post_type', postType)
    .single();

  return !error && !!data;
}

export async function sb_toggleFavorite(postId: string, postType: 'post' | 'news'): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const isFavorite = await sb_isFavorite(postId, postType);

  if (isFavorite) {
    // Remove from favorites
    const { error } = await sb
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .eq('post_type', postType);

    if (error) throw error;
    return false;
  } else {
    // Add to favorites
    const { error } = await sb
      .from('favorites')
      .insert({
        user_id: user.id,
        post_id: postId,
        post_type: postType,
      });

    if (error) throw error;
    return true;
  }
}

export async function sb_getUserFavorites(): Promise<Favorite[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
