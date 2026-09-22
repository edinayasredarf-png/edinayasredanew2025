import "server-only";
import type { OcrPage, OcrLine } from "./ocr";

/*
 * Эвристики восстановления вёрстки из геометрии OCR (координаты строк):
 *  - выравнивание: строка по центру страницы и не на всю ширину → center;
 *  - красная строка: первая строка абзаца сдвинута вправо → text-indent;
 *  - заголовки: буквы заметно выше медианы → жирный (bold точно из скана не
 *    восстановить, поэтому эвристика: крупные и/или ЗАГЛАВНЫЕ центрированные).
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const median = (a: number[]): number => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const quantile = (a: number[], q: number): number => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
/** Строка «в основном заглавными» (кандидат в жирный заголовок). */
const isUpperish = (t: string): boolean => {
  const letters = t.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, "").length;
  return upper / letters.length > 0.8;
};

type Align = "left" | "center" | "right" | "justify";
interface Cls { align: Align; heading: boolean; indent: boolean; bold: boolean }

export function ocrPagesToHtml(pages: OcrPage[]): string {
  const html: string[] = [];

  for (const page of pages) {
    const lines = page.lines;
    if (!lines.length) continue;
    const medH = median(lines.map((l) => l.height)) || 1;
    // Границы текстовой колонки (устойчивее к полям, чем ширина страницы).
    const leftBase = quantile(lines.map((l) => l.x0), 0.1);
    const rightBase = quantile(lines.map((l) => l.x1), 0.9);
    const colW = Math.max(1, rightBase - leftBase);
    const colCenter = (leftBase + rightBase) / 2;

    const classify = (l: OcrLine): Cls => {
      const cx = (l.x0 + l.x1) / 2;
      const lw = l.x1 - l.x0;
      const nearLeft = l.x0 - leftBase < 0.06 * colW;
      const nearRight = rightBase - l.x1 < 0.06 * colW;
      let align: Align;
      if (nearRight && !nearLeft && lw < 0.6 * colW) align = "right";
      else if (!nearLeft && !nearRight && Math.abs(cx - colCenter) < 0.1 * colW && lw < 0.85 * colW) align = "center";
      else if (nearLeft && nearRight) align = "justify"; // строка на всю ширину — выключка
      else align = "left";
      const heading = l.height > medH * 1.22;
      const indent = align === "left" && l.x0 - leftBase > 0.03 * colW;
      const bold = heading || ((align === "center" || align === "right") && isUpperish(l.text));
      // Красная строка => это выключенный по ширине абзац с отступом первой строки.
      const finalAlign: Align = indent ? "justify" : align;
      return { align: finalAlign, heading, indent, bold };
    };

    type Para = { cls: Cls; lines: OcrLine[] };
    const paras: Para[] = [];
    let prev: OcrLine | null = null;
    for (const l of lines) {
      const c = classify(l);
      const last = paras[paras.length - 1];
      const gap = prev ? l.top - (prev.top + prev.height) : 0;
      const centeredKinds = c.align === "center" || c.align === "right";
      const lastCentered = last ? last.cls.align === "center" || last.cls.align === "right" : false;
      const newPara =
        !last ||
        gap > medH * 0.8 ||
        centeredKinds !== lastCentered ||
        c.align !== last.cls.align ||
        c.heading !== last.cls.heading ||
        c.indent; // красная строка = новый абзац
      if (newPara) paras.push({ cls: c, lines: [l] });
      else last.lines.push(l);
      prev = l;
    }

    for (const p of paras) {
      const centered = p.cls.align === "center" || p.cls.align === "right";
      const indent = p.cls.indent ? "text-indent:1.25cm;" : "";
      const joiner = centered ? "<br/>" : " ";
      let inner = p.lines.map((l) => esc(l.text)).join(joiner);
      if (p.cls.bold) inner = `<b>${inner}</b>`;
      html.push(`<p style="text-align:${p.cls.align};${indent}">${inner}</p>`);
    }
  }

  return html.join("") || "<p></p>";
}
