import { parse } from 'node-html-parser';

export function parseStatovPosts(html: string) {
  return parse(html).querySelectorAll('.tgme_widget_message[data-post]').flatMap((message) => {
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
    return [{
      id,
      date,
      title: title || 'Публикация в Telegram',
      text: excerpt.length > 340 ? excerpt.slice(0, 337).replace(/\s+\S*$/, '') + '…' : excerpt,
    }];
  }).sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 3);
}
