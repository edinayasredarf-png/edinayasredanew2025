/** Обложка кейса: поле cover или первое изображение в HTML редактора */

export function extractFirstImageSrc(html: string): string | undefined {
  if (!html) return undefined;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];
  const bgMatch = html.match(/url\(["']?([^"')]+)["']?\)/i);
  return bgMatch?.[1];
}

export function resolveCaseCover(cover?: string, contentHtml?: string): string {
  return cover || extractFirstImageSrc(contentHtml || '') || '/img/cases/case1.png';
}

function normalizeSrc(src: string): string {
  try {
    const u = new URL(src, 'https://placeholder.local');
    return u.pathname;
  } catch {
    return src.split('?')[0] || src;
  }
}

/** Убираем первое медиа из тела — оно показывается в hero как обложка */
export function stripLeadingCoverMedia(html: string, coverSrc: string): string {
  if (!html?.trim()) return html;
  const coverPath = normalizeSrc(coverSrc);
  let out = html.trim();

  const stripIfMatchesCover = (chunk: string): boolean => {
    const src = extractFirstImageSrc(chunk);
    if (!src) return false;
    return normalizeSrc(src) === coverPath;
  };

  const patterns: RegExp[] = [
    /^(\s*)<figure[\s\S]*?<\/figure>/i,
    /^(\s*)<div[^>]*class="[^"]*image-view[^"]*"[^>]*>[\s\S]*?<\/div>/i,
    /^(\s*)<p[^>]*>\s*<img[\s\S]*?<\/p>/i,
    /^(\s*)<img[^>]*\/?>(\s*)/i,
  ];

  for (const pattern of patterns) {
    const m = out.match(pattern);
    if (m) {
      const chunk = m[0];
      if (stripIfMatchesCover(chunk) || !coverPath) {
        out = out.slice(chunk.length).trim();
        break;
      }
    }
  }

  return out;
}

export function estimateReadingMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
