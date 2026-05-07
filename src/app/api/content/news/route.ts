import { NextRequest, NextResponse } from 'next/server';
import { dbDeleteById, dbGetNewsBySlug, dbListNews, dbUpsertNews } from '@/lib/contentDb';
import { serverListNews } from '@/lib/blogStoreServer';

export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    if (slug) {
      const item = await dbGetNewsBySlug(slug);
      return NextResponse.json({ item: item ?? null }, { status: 200 });
    }
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

export async function POST(request: NextRequest) {
  try {
    const item = await request.json();
    await dbUpsertNews(item);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/content/news failed:', error);
    return NextResponse.json({ ok: false, error: 'NEWS_SAVE_FAILED' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });
    await dbDeleteById('news', id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/content/news failed:', error);
    return NextResponse.json({ ok: false, error: 'NEWS_DELETE_FAILED' }, { status: 500 });
  }
}
