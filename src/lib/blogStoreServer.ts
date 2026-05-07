import 'server-only';

import { dbGetPostBySlug, dbListNews, dbListPosts } from '@/lib/contentDb';

export type ServerBlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;
  contentHtml: string;
  tags?: string[];
  kind?: 'post' | 'news' | 'lesson' | 'case';
  createdAt: number;
  updatedAt: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number };
};

export type ServerNewsItem = {
  id: string;
  slug: string;
  title: string;
  cover?: string;
  contentHtml?: string;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
  views?: number;
  reactions?: { heart: number; fire: number; smile: number };
};

export async function serverListPosts(): Promise<ServerBlogPost[]> {
  try {
    return await dbListPosts();
  } catch (error) {
    console.error('serverListPosts failed:', error);
    return [];
  }
}

export async function serverListNews(): Promise<ServerNewsItem[]> {
  try {
    return await dbListNews();
  } catch (error) {
    console.error('serverListNews failed:', error);
    return [];
  }
}

export async function serverGetPostBySlug(slug: string): Promise<ServerBlogPost | undefined> {
  try {
    return await dbGetPostBySlug(slug);
  } catch (error) {
    console.error('serverGetPostBySlug failed:', error);
    return undefined;
  }
}
