import { parseStatovPosts } from '../../../statov/telegram';

export async function GET() {
  try {
    const response = await fetch('https://t.me/s/statovlive', {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Telegram unavailable');
    const posts = parseStatovPosts(await response.text());
    if (!posts.length) throw new Error('Telegram feed unavailable');
    return Response.json(posts, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800' },
    });
  } catch {
    return Response.json([], { status: 503 });
  }
}
