import { NextRequest, NextResponse } from 'next/server';
import { dbDeleteById, dbGetPostBySlug, dbListPosts, dbUpsertPost } from '@/lib/contentDb';
import { serverListPosts } from '@/lib/blogStoreServer';

export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    if (slug) {
      const item = await dbGetPostBySlug(slug);
      return NextResponse.json({ item: item ?? null }, { status: 200 });
    }
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

export async function POST(request: NextRequest) {
  try {
    const item = await request.json();
    await dbUpsertPost(item);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/content/posts failed:', error);
    return NextResponse.json({ ok: false, error: 'POST_SAVE_FAILED' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });
    await dbDeleteById('posts', id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/content/posts failed:', error);
    return NextResponse.json({ ok: false, error: 'POST_DELETE_FAILED' }, { status: 500 });
  }
}
