import { NextRequest, NextResponse } from 'next/server';

type VkVideoGetResponse =
  | {
      response: {
        items: Array<{
          player?: string;
          image?: Array<{ url: string; width: number; height: number }>;
        }>;
      };
    }
  | {
      error: { error_code: number; error_msg: string };
    };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get('owner_id');
  const videoId = searchParams.get('video_id');

  if (!ownerId || !videoId) {
    return NextResponse.json({ error: 'Missing owner_id or video_id' }, { status: 400 });
  }

  const accessToken = process.env.VK_SERVICE_TOKEN || process.env.VK_VIDEO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          'VK token not configured. Set VK_SERVICE_TOKEN (preferred) or VK_VIDEO_ACCESS_TOKEN to fetch embed player URL.',
      },
      { status: 500 },
    );
  }

  const apiUrl = new URL('https://api.vk.com/method/video.get');
  apiUrl.searchParams.set('videos', `${ownerId}_${videoId}`);
  apiUrl.searchParams.set('access_token', accessToken);
  apiUrl.searchParams.set('v', '5.131');

  try {
    const r = await fetch(apiUrl.toString(), { method: 'GET', cache: 'no-store' });
    const data = (await r.json()) as VkVideoGetResponse;

    if ('error' in data) {
      return NextResponse.json({ error: data.error.error_msg }, { status: 502 });
    }

    const item = data.response.items?.[0];
    const player = item?.player;
    const poster =
      item?.image?.slice().sort((a, b) => b.width - a.width)[0]?.url || null;

    if (!player) {
      return NextResponse.json({ error: 'VK API did not return player URL' }, { status: 502 });
    }

    return NextResponse.json({ player, poster });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

