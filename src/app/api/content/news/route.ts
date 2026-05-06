import { NextResponse } from 'next/server';
import { dbListNews } from '@/lib/contentDb';
import { serverListNews } from '@/lib/blogStoreServer';

export const revalidate = 120;

export async function GET() {
  try {
    const items = await dbListNews();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('GET /api/content/news from Postgres failed:', error);
    try {
      const fallbackItems = await serverListNews();
      return NextResponse.json({ items: fallbackItems, source: 'supabase-fallback' }, { status: 200 });
    } catch (fallbackError) {
      console.error('GET /api/content/news fallback failed:', fallbackError);
      return NextResponse.json({ items: [], error: 'NEWS_UNAVAILABLE' }, { status: 200 });
    }
  }
}
