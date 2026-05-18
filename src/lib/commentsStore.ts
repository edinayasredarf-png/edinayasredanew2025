"use client";

import { dataFetch } from "./dataApi";

export type Comment = {
  id: string;
  post_id: string;
  post_type: "post" | "news";
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
  post_type: "post" | "news";
  created_at: string;
};

export async function sb_listAllComments(): Promise<Comment[]> {
  return (await dataFetch("/comments?all=1")) as Comment[];
}

export async function sb_listComments(
  postId: string,
  postType: "post" | "news"
): Promise<Comment[]> {
  const q =
    "/comments?postId=" +
    encodeURIComponent(postId) +
    "&postType=" +
    encodeURIComponent(postType);
  return (await dataFetch(q)) as Comment[];
}

export async function sb_createComment(
  postId: string,
  postType: "post" | "news",
  content: string,
  parentId?: string
): Promise<Comment> {
  return (await dataFetch("/comments", {
    method: "POST",
    body: JSON.stringify({ postId, postType, content, parentId }),
  })) as Comment;
}

export async function sb_deleteComment(commentId: string): Promise<void> {
  await dataFetch("/comments", {
    method: "PATCH",
    body: JSON.stringify({ id: commentId }),
  });
}

export async function sb_isFavorite(
  postId: string,
  postType: "post" | "news"
): Promise<boolean> {
  try {
    const r = (await dataFetch(
      "/favorites?checkPostId=" +
        encodeURIComponent(postId) +
        "&checkPostType=" +
        encodeURIComponent(postType)
    )) as { isFavorite?: boolean };
    return !!r?.isFavorite;
  } catch {
    return false;
  }
}

export async function sb_toggleFavorite(
  postId: string,
  postType: "post" | "news"
): Promise<boolean> {
  const r = (await dataFetch("/favorites", {
    method: "POST",
    body: JSON.stringify({ postId, postType }),
  })) as { isFavorite: boolean };
  return r.isFavorite;
}

export async function sb_getUserFavorites(): Promise<Favorite[]> {
  return (await dataFetch("/favorites")) as Favorite[];
}
