import { parseStatovFeed } from '../../../statov/telegram';

const refreshInterval = 300_000;
const sources = ['https://t.me/s/statovlive', 'https://telegram.me/s/statovlive'];

let lastSuccess: { feed: ReturnType<typeof parseStatovFeed>; expires: number } | undefined;
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
      const feed = parseStatovFeed(await response.text());
      if (!feed.posts.length) continue;
      lastSuccess = { feed, expires: Date.now() + refreshInterval };
      return;
    } catch {
      // The alternate public Telegram URL can be reachable during a network failure.
    }
  }
  console.warn('Statov feed: Telegram preview unavailable');
}

export async function GET(request: Request) {
  if (!lastSuccess || lastSuccess.expires <= Date.now()) {
    refresh ??= updateFeed().finally(() => { refresh = undefined; });
    await refresh;
  }
  if (!lastSuccess) return Response.json([], { status: 503 });

  const fresh = lastSuccess.expires > Date.now();
  return Response.json(new URL(request.url).searchParams.has('photos') ? lastSuccess.feed : lastSuccess.feed.posts, {
    headers: { 'Cache-Control': fresh ? 'public, s-maxage=300, stale-while-revalidate=1800' : 'no-store' },
  });
}
