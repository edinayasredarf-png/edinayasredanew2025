'use client';

import { useEffect } from 'react';

const NBSP = '\u00A0';

const DEFAULT_WORDS = [
  // 1–2 буквы
  'и',
  'а',
  'но',
  'да',
  'в',
  'во',
  'к',
  'ко',
  'с',
  'со',
  'у',
  'о',
  'об',
  'обо',
  'от',
  'до',
  'из',
  'за',
  'на',
  'по',
  // 3–5 букв (частые предлоги/союзы)
  'для',
  'без',
  'при',
  'над',
  'под',
  'про',
  'как',
  'что',
  'или',
  'либо',
  'меж',
  'перед',
  'через',
  'между',
  // частицы (часто «висят»)
  'ли',
  'же',
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(words: readonly string[]) {
  const alternatives = words
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');

  // Префикс оставляем (пробел/пунктуация), чтобы не ломать текст.
  // Применяем только если дальше идёт обычный пробел/таб/перевод строки,
  // и НЕ если уже стоит NBSP.
  return new RegExp(
    `(^|[\\s\\(\\[\\{«„“"'—–-])(${alternatives})(?=\\s)(?!${NBSP})\\s+`,
    'giu',
  );
}

function fixWidowsInText(text: string, wordRegex: RegExp) {
  if (!text) return text;
  return text.replace(wordRegex, (_m, prefix, word) => `${prefix}${word}${NBSP}`);
}

function isExcludedElement(el: Element | null) {
  if (!el) return false;
  return Boolean(
    el.closest(
      'script,style,noscript,textarea,input,select,option,code,pre,kbd,samp,svg,math',
    ),
  );
}

function processRoot(root: ParentNode, wordRegex: RegExp) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const toUpdate: Text[] = [];

  // Сначала собираем, потом обновляем — безопаснее при обходе.
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.nodeValue) continue;
    const parent = node.parentElement;
    if (isExcludedElement(parent)) continue;
    if (node.nodeValue.indexOf(' ') === -1 && node.nodeValue.indexOf('\n') === -1) continue;
    toUpdate.push(node);
  }

  for (const node of toUpdate) {
    const before = node.nodeValue ?? '';
    const after = fixWidowsInText(before, wordRegex);
    if (after !== before) node.nodeValue = after;
  }
}

export function TypographyNoWidows({
  enabled = true,
  words = DEFAULT_WORDS,
}: {
  enabled?: boolean;
  words?: readonly string[];
}) {
  useEffect(() => {
    if (!enabled) return;

    const wordRegex = buildRegex(words);
    const root = document.body;
    if (!root) return;

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        processRoot(root, wordRegex);
      });
    };

    // Первичная обработка
    schedule();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') {
          schedule();
          return;
        }
        if (m.addedNodes && m.addedNodes.length) {
          schedule();
          return;
        }
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [enabled, words]);

  return null;
}

