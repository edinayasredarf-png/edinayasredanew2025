import { parse } from 'node-html-parser';

export type StatovPhoto = { id: string; postId: string; src: string; label: string };

export function parseStatovFeed(html: string) {
  const entries = parse(html).querySelectorAll('.tgme_widget_message[data-post]').flatMap((message) => {
    const id = message.getAttribute('data-post')?.match(/^statovlive\/(\d+)$/i)?.[1];
    const date = message.querySelector('time[datetime]')?.getAttribute('datetime');
    if (!id || !date || !Number.isFinite(Date.parse(date))) return [];

    const body = message.querySelector('.tgme_widget_message_text')?.structuredText.trim() ?? '';
    const lines = body.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const firstSentence = firstLine.match(/^.+?[.!?](?=\s|$)/u)?.[0] ?? firstLine;
    const lead = firstLine.length <= 100 ? firstLine : firstSentence;
    const title = lead.length <= 100 ? lead : lead.slice(0, 97).replace(/\s+\S*$/, '') + '…';
    const excerpt = body.slice(lead.length <= 100 ? lead.length : title.length - 1).trim();
    const place = body.match(/Ростов[ауе]?|Камчатк[ауе]|Домба[йя]|Дамхурц|Дагестан|Зеленоградск/iu)?.[0];
    const label = place?.match(/^ростов/iu) ? 'Ростов' : (place || 'StatovLIVE');
    const photos = message.querySelectorAll('.tgme_widget_message_photo_wrap').flatMap((photo, index) => {
      const src = photo.getAttribute('style')?.match(/background-image:url\(['"]?(https:\/\/cdn\d*\.telesco\.pe\/file\/[\w-]+\.(?:jpe?g|webp|png))['"]?\)/i)?.[1];
      return src ? [{ id: id + '-' + index, postId: id, src, label }] : [];
    }).slice(0, 3);
    return [{
      id,
      date,
      photos,
      title: title || 'Публикация в Telegram',
      text: excerpt.length > 340 ? excerpt.slice(0, 337).replace(/\s+\S*$/, '') + '…' : excerpt,
    }];
  }).sort((a, b) => Number(b.id) - Number(a.id));

  return {
    posts: entries.slice(0, 3).map(({ id, date, title, text }) => ({ id, date, title, text })),
    photos: entries.flatMap(({ photos }) => photos).slice(0, 12),
  };
}
