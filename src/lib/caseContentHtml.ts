/** Нормализация HTML кейса: символ «×» в тексте → <ul> с круглыми маркерами (CSS) */

const CROSS_IN_HTML_RE = /(?:&#215;|&times;|[×✕])/i;
const CROSS_PREFIX_HTML_RE =
  /^\s*(?:&#215;|&times;|[×✕])[\s\u00A0]*/i;

function stripCrossFromHtmlFragment(fragment: string): string {
  return fragment.replace(CROSS_PREFIX_HTML_RE, '').trim();
}

function stripCrossFromPlainText(text: string): string {
  return text
    .replace(/^\s*(?:×|✕)\s*/u, '')
    .replace(CROSS_PREFIX_HTML_RE, '')
    .trim();
}

function buildBulletList(items: string[]): string {
  if (!items.length) return '';
  return `<ul class="case-bullet-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

const BLOCK_TAG_RE = /p|div/i;

/** Несколько подряд <p>× ...</p> или <div>× ...</div> */
function replaceCrossParagraphGroups(html: string): string {
  return html.replace(
    /(?:<(p|div)[^>]*>\s*(?:&#215;|&times;|[×✕])[\s\u00A0]+[\s\S]*?<\/\1>\s*)+/gi,
    (block) => {
      const items = [...block.matchAll(/<(p|div)[^>]*>([\s\S]*?)<\/\1>/gi)]
        .map((m) => stripCrossFromHtmlFragment(m[2]))
        .filter(Boolean);
      return items.length ? buildBulletList(items) : block;
    },
  );
}

/** Один блок <p>/<div> с переносами <br> и «×» в каждой строке */
function replaceCrossParagraphsWithBr(html: string): string {
  return html.replace(/<(p|div)([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, _attrs, inner) => {
    if (!BLOCK_TAG_RE.test(tag)) return full;
    if (!/<br\s*\/?>/i.test(inner) || !CROSS_IN_HTML_RE.test(inner)) return full;

    const parts = inner.split(/<br\s*\/?>/gi);
    const items: string[] = [];

    for (const part of parts) {
      const plain = part.replace(/<[^>]+>/g, '').trim();
      if (!plain) continue;
      if (!CROSS_PREFIX_HTML_RE.test(part) && !/^[×✕]/.test(plain)) {
        return full;
      }
      const cleaned = stripCrossFromHtmlFragment(part);
      if (cleaned) items.push(cleaned);
    }

    return items.length >= 2 ? buildBulletList(items) : full;
  });
}

/** Убрать «×» в начале уже существующих <li> */
function stripCrossFromListItems(html: string): string {
  return html.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (_m, attrs, inner) => {
    const cleaned = inner.replace(
      /^(<p[^>]*>)?\s*(?:&#215;|&times;|[×✕])[\s\u00A0]+/i,
      '$1',
    );
    return `<li${attrs}>${cleaned}</li>`;
  });
}

/** Текст с «×» в начале строки без тегов списка (редкий случай) */
function replacePlainCrossLines(html: string): string {
  if (/<ul[\s>]/i.test(html)) return html;
  const lines = html.split(/<br\s*\/?>/gi);
  if (lines.length < 2) return html;

  const items: string[] = [];
  for (const line of lines) {
    const plain = line.replace(/<[^>]+>/g, '').trim();
    if (!plain) continue;
    if (!/^[×✕]/.test(plain) && !CROSS_PREFIX_HTML_RE.test(line)) return html;
    const cleaned = stripCrossFromPlainText(plain);
    if (cleaned) items.push(cleaned);
  }

  return items.length >= 2 ? buildBulletList(items) : html;
}

export function normalizeCaseContentHtml(html: string): string {
  if (!html?.trim()) return html;
  if (!CROSS_IN_HTML_RE.test(html)) return html;

  let out = html;
  out = replaceCrossParagraphGroups(out);
  out = replaceCrossParagraphsWithBr(out);
  out = stripCrossFromListItems(out);
  out = replacePlainCrossLines(out);
  return out;
}
