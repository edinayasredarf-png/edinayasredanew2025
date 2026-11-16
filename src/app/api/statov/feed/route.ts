import { parseStatovPosts } from '../../../statov/telegram';

const refreshInterval = 300_000;
const sources = ['https://t.me/s/statovlive', 'https://telegram.me/s/statovlive'];

let lastSuccess: { posts: ReturnType<typeof parseStatovPosts>; expires: number } | undefined;
let refresh: Promise<void> | undefined;

async function updateFeed() {
  for (const url of sources) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(4500),
      });
      if (!response.ok) continue;
      const posts = parseStatovPosts(await response.text());
      if (!posts.length) continue;
      lastSuccess = { posts, expires: Date.now() + refreshInterval };
      return;
    } catch {
      // The alternate public Telegram URL can be reachable during a network failure.
    }
  }
  console.warn('Statov feed: Telegram preview unavailable');
}

export async function GET() {
  if (!lastSuccess || lastSuccess.expires <= Date.now()) {
    refresh ??= updateFeed().finally(() => { refresh = undefined; });
    await refresh;
  }
  if (!lastSuccess) return Response.json([], { status: 503 });

  const fresh = lastSuccess.expires > Date.now();
  return Response.json(lastSuccess.posts, {
    headers: { 'Cache-Control': fresh ? 'public, s-maxage=300, stale-while-revalidate=1800' : 'no-store' },
  });
}
