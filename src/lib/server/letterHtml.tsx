import "server-only";
import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { parse, HTMLElement, Node, NodeType } from "node-html-parser";

/**
 * Рендер HTML из TipTap-редактора в элементы @react-pdf:
 * абзацы (с выравниванием), жирный/курсив/подчёркивание/зачёркивание,
 * заливка (mark), маркированные и нумерованные списки, заголовки.
 */

const st = StyleSheet.create({
  para: { textAlign: "justify", textIndent: 32, marginBottom: 6 },
  h1: { fontSize: 17, fontWeight: "bold", marginTop: 4, marginBottom: 8 },
  h2: { fontSize: 15, fontWeight: "bold", marginTop: 4, marginBottom: 6 },
  h3: { fontSize: 14, fontWeight: "bold", marginTop: 4, marginBottom: 5 },
  liList: { marginLeft: 22, marginTop: 2, marginBottom: 6 },
  liRow: { flexDirection: "row", marginBottom: 4 },
  liMarker: { width: 18 },
  liBody: { flex: 1, textAlign: "justify" },
});

interface Inline {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  bg?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  laquo: "«", raquo: "»", mdash: "—", ndash: "–", hellip: "…", middot: "·",
};
function decode(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

function spanStyle(inh: Inline) {
  const deco: string[] = [];
  if (inh.underline) deco.push("underline");
  if (inh.strike) deco.push("line-through");
  return {
    fontWeight: (inh.bold ? "bold" : "normal") as "bold" | "normal",
    fontStyle: (inh.italic ? "italic" : "normal") as "italic" | "normal",
    textDecoration: (deco.join(" ") || "none") as "underline" | "line-through" | "none",
    backgroundColor: inh.bg,
    color: inh.color,
    // размер и семейство шрифта из редактора (TipTap FontSize / FontFamily)
    ...(inh.fontSize ? { fontSize: inh.fontSize } : {}),
    ...(inh.fontFamily ? { fontFamily: inh.fontFamily } : {}),
  };
}

/**
 * Размер шрифта из style. Значение из редактора трактуем предсказуемо для
 * пользователя: px (или без единиц) масштабируем к базовым 14pt письма
 * (редакторный дефолт ~16px ≈ 14pt), pt — как есть, em/rem — от базовых 14.
 */
function fontSizeFromStyle(el: HTMLElement): number | undefined {
  const style = el.getAttribute("style") || "";
  const m = /font-size:\s*([\d.]+)\s*(px|pt|em|rem)?/i.exec(style);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const unit = (m[2] || "px").toLowerCase();
  const pt = unit === "pt" ? n : unit === "em" || unit === "rem" ? n * 14 : n * 0.875;
  return Math.max(6, Math.min(48, Math.round(pt * 10) / 10));
}

// В PDF реально зарегистрированы два семейства: серифное «Letter» (Tinos ≈ Times,
// по умолчанию) и «LetterSans» (Involve). Любой sans/mono из редактора
// отображаем шрифтом без засечек, серифные/по умолчанию — базовым.
function fontFamilyFromStyle(el: HTMLElement): string | undefined {
  const style = el.getAttribute("style") || "";
  const m = /font-family:\s*([^;]+)/i.exec(style);
  if (!m) return undefined;
  const v = m[1].toLowerCase();
  if (/serif|times|tinos|georgia|roman/.test(v) && !/sans/.test(v)) return undefined;
  if (/sans|arial|helvetica|verdana|tahoma|roboto|inter|gilroy|involve|segoe|calibri|mono|courier|consolas|menlo/.test(v)) {
    return "LetterSans";
  }
  return undefined;
}

// чёрный/дефолтный цвет игнорируем — иначе редактор оборачивает весь текст в
// цветной span, из-за чего ломается textIndent (красная строка).
function normColor(c?: string): string | undefined {
  if (!c) return undefined;
  const v = c.trim().toLowerCase().replace(/\s+/g, "");
  if (["#000", "#000000", "black", "rgb(0,0,0)", "rgba(0,0,0,1)"].includes(v)) return undefined;
  return c.trim();
}

function colorFromStyle(el: HTMLElement): string | undefined {
  const style = el.getAttribute("style") || "";
  const m = /(?:^|;)\s*color:\s*([^;]+)/i.exec(style);
  return normColor(m ? m[1] : undefined);
}

function bgFromStyle(el: HTMLElement): string | undefined {
  const style = el.getAttribute("style") || "";
  const m = /background(?:-color)?:\s*([^;]+)/i.exec(style);
  return m ? m[1].trim() : "#fff3a3";
}

function alignFromStyle(el: HTMLElement): "left" | "center" | "right" | "justify" | undefined {
  const style = el.getAttribute("style") || "";
  const m = /text-align:\s*(left|center|right|justify)/i.exec(style);
  return (m?.[1]?.toLowerCase() as "left" | "center" | "right" | "justify") || undefined;
}

/** Инлайн-содержимое элемента → массив <Text> со стилями. */
function inlineSpans(node: Node, inh: Inline, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const kids = node.childNodes || [];
  kids.forEach((child, i) => {
    if (child.nodeType === NodeType.TEXT_NODE) {
      const txt = decode((child as unknown as { rawText: string }).rawText || "");
      if (!txt) return;
      // без форматирования — отдаём строкой (иначе textIndent/красная строка не работает)
      const styled =
        inh.bold || inh.italic || inh.underline || inh.strike ||
        Boolean(inh.bg) || Boolean(inh.color) ||
        Boolean(inh.fontSize) || Boolean(inh.fontFamily);
      out.push(styled ? <Text key={`${key}-t${i}`} style={spanStyle(inh)}>{txt}</Text> : txt);
      return;
    }
    const el = child as HTMLElement;
    const tag = (el.rawTagName || "").toLowerCase();
    if (tag === "br") { out.push(<Text key={`${key}-br${i}`}>{"\n"}</Text>); return; }
    const next: Inline = { ...inh };
    if (tag === "strong" || tag === "b") next.bold = true;
    if (tag === "em" || tag === "i") next.italic = true;
    if (tag === "u") next.underline = true;
    if (tag === "s" || tag === "strike" || tag === "del") next.strike = true;
    if (tag === "mark") next.bg = bgFromStyle(el);
    if (tag === "a") {
      next.underline = true;
      next.color = colorFromStyle(el) || "#0645ad";
    }
    if (tag === "span") {
      const style = el.getAttribute("style") || "";
      if (/font-weight:\s*(bold|[6-9]00)/i.test(style)) next.bold = true;
      if (/font-style:\s*italic/i.test(style)) next.italic = true;
      if (/text-decoration:[^;]*underline/i.test(style)) next.underline = true;
      if (/background(?:-color)?:/i.test(style)) next.bg = bgFromStyle(el);
      const c = colorFromStyle(el);
      if (c) next.color = c;
      const fs = fontSizeFromStyle(el);
      if (fs) next.fontSize = fs;
      const ff = fontFamilyFromStyle(el);
      if (ff) next.fontFamily = ff;
    }
    out.push(...inlineSpans(el, next, `${key}-${i}`));
  });
  return out;
}

type ParaBase = typeof st.para | typeof st.h1 | typeof st.h2 | typeof st.h3;

function paraStyle(el: HTMLElement, base: ParaBase): ParaBase {
  const align = alignFromStyle(el);
  // по центру/справа — без красной строки
  if (align === "center" || align === "right") {
    return { ...base, textAlign: align, textIndent: 0 } as unknown as ParaBase;
  }
  // left/justify — сохраняем красную строку (textIndent из base)
  if (align === "left") {
    return { ...base, textAlign: "left" } as unknown as ParaBase;
  }
  return base;
}

function renderList(el: HTMLElement, ordered: boolean, key: string): React.ReactNode {
  const items = (el.childNodes.filter(
    (n) => n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).rawTagName?.toLowerCase() === "li"
  ) as HTMLElement[]).filter((li) => li.text.trim());
  return (
    <View key={key} style={st.liList}>
      {items.map((li, i) => (
        <View key={`${key}-li${i}`} style={st.liRow} wrap={false}>
          <Text style={st.liMarker}>{ordered ? `${i + 1}.` : "•"}</Text>
          <Text style={st.liBody}>{inlineSpans(li, {}, `${key}-li${i}`)}</Text>
        </View>
      ))}
    </View>
  );
}

/** span только со шрифтом/размером (без иного форматирования) — можно «поднять» на абзац. */
function spanIsPureFont(el: HTMLElement): boolean {
  const style = el.getAttribute("style") || "";
  if (!/font-family|font-size/i.test(style)) return false;
  if (/font-weight:\s*(bold|[6-9]00)/i.test(style)) return false;
  if (/font-style:\s*italic/i.test(style)) return false;
  if (/text-decoration:[^;]*underline/i.test(style)) return false;
  if (/background(?:-color)?:/i.test(style)) return false;
  if (colorFromStyle(el)) return false;
  return true;
}

function meaningfulChildren(node: Node): Node[] {
  return (node.childNodes || []).filter(
    (n) =>
      !(
        n.nodeType === NodeType.TEXT_NODE &&
        !((n as unknown as { rawText?: string }).rawText || "").trim()
      )
  );
}

/**
 * Редактор часто оборачивает весь абзац в <span> со шрифтом/размером. Если это
 * так — «снимаем» шрифт/размер на уровень абзаца: текст остаётся простыми
 * строками и сохраняется textIndent (красная строка), а шрифт всё равно
 * применяется (наследуется дочерними Text).
 */
function peelParagraphFont(el: HTMLElement): { fontFamily?: string; fontSize?: number; node: Node } {
  let fontFamily: string | undefined;
  let fontSize: number | undefined;
  let node: HTMLElement = el;
  for (let depth = 0; depth < 4; depth++) {
    const kids = meaningfulChildren(node);
    if (kids.length !== 1 || kids[0].nodeType !== NodeType.ELEMENT_NODE) break;
    const span = kids[0] as HTMLElement;
    if ((span.rawTagName || "").toLowerCase() !== "span" || !spanIsPureFont(span)) break;
    const ff = fontFamilyFromStyle(span);
    const fs = fontSizeFromStyle(span);
    if (ff) fontFamily = ff;
    if (fs) fontSize = fs;
    node = span;
  }
  return { fontFamily, fontSize, node };
}

function fontExtra(pf: { fontFamily?: string; fontSize?: number }) {
  const s: { fontFamily?: string; fontSize?: number } = {};
  if (pf.fontFamily) s.fontFamily = pf.fontFamily;
  if (pf.fontSize) s.fontSize = pf.fontSize;
  return s;
}

function renderBlock(node: Node, key: string): React.ReactNode | null {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const txt = decode((node as unknown as { rawText: string }).rawText || "").trim();
    return txt ? <Text key={key} style={st.para}>{txt}</Text> : null;
  }
  const el = node as HTMLElement;
  const tag = (el.rawTagName || "").toLowerCase();
  switch (tag) {
    case "p":
    case "div": {
      if (!el.text.trim() && !el.querySelector("br")) return null;
      const pf = peelParagraphFont(el);
      return <Text key={key} style={[paraStyle(el, st.para), fontExtra(pf)]}>{inlineSpans(pf.node, {}, key)}</Text>;
    }
    case "h1": {
      const pf = peelParagraphFont(el);
      return <Text key={key} style={[paraStyle(el, st.h1), fontExtra(pf)]}>{inlineSpans(pf.node, {}, key)}</Text>;
    }
    case "h2": {
      const pf = peelParagraphFont(el);
      return <Text key={key} style={[paraStyle(el, st.h2), fontExtra(pf)]}>{inlineSpans(pf.node, {}, key)}</Text>;
    }
    case "h3":
    case "h4": {
      const pf = peelParagraphFont(el);
      return <Text key={key} style={[paraStyle(el, st.h3), fontExtra(pf)]}>{inlineSpans(pf.node, {}, key)}</Text>;
    }
    case "ul":
      return renderList(el, false, key);
    case "ol":
      return renderList(el, true, key);
    case "br":
      return null;
    default:
      return el.text.trim() ? <Text key={key} style={st.para}>{inlineSpans(el, {}, key)}</Text> : null;
  }
}

export function renderHtmlBody(html: string): React.ReactNode[] {
  const src = (html || "").trim();
  if (!src) return [];
  // не HTML — на всякий случай как абзацы
  if (!/[<][a-z!/]/i.test(src)) {
    return src.split(/\n+/).filter(Boolean).map((l, i) => (
      <Text key={`pt${i}`} style={st.para}>{l}</Text>
    ));
  }
  const root = parse(src);
  const out: React.ReactNode[] = [];
  root.childNodes.forEach((n, i) => {
    const block = renderBlock(n, `blk${i}`);
    if (block) out.push(block);
  });
  return out;
}
