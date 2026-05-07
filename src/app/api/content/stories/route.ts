import { NextRequest, NextResponse } from 'next/server';
import { dbDeleteById, dbGetStoryById, dbListStories, dbUpsertStory } from '@/lib/contentDb';

export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (id) {
      const item = await dbGetStoryById(id);
      return NextResponse.json({ item: item ?? null }, { status: 200 });
    }
    const items = await dbListStories();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('GET /api/content/stories failed:', error);
    return NextResponse.json({ items: [], error: 'STORIES_UNAVAILABLE' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const item = await request.json();
    await dbUpsertStory(item);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/content/stories failed:', error);
    return NextResponse.json({ ok: false, error: 'STORY_SAVE_FAILED' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });
    await dbDeleteById('stories', id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/content/stories failed:', error);
    return NextResponse.json({ ok: false, error: 'STORY_DELETE_FAILED' }, { status: 500 });
  }
}
