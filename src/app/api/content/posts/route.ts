import { NextResponse } from 'next/server';
import { dbListPosts } from '@/lib/contentDb';
import { serverListPosts } from '@/lib/blogStoreServer';

export const revalidate = 120;

export async function GET() {
  try {
    const items = await dbListPosts();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('GET /api/content/posts from Postgres failed:', error);
    try {
      const fallbackItems = await serverListPosts();
      return NextResponse.json({ items: fallbackItems, source: 'supabase-fallback' }, { status: 200 });
    } catch (fallbackError) {
      console.error('GET /api/content/posts fallback failed:', fallbackError);
      return NextResponse.json({ items: [], error: 'POSTS_UNAVAILABLE' }, { status: 200 });
    }
  }
}
