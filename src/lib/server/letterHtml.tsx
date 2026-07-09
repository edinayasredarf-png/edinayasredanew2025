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
  };
}

function colorFromStyle(el: HTMLElement): string | undefined {
  const style = el.getAttribute("style") || "";
  const m = /(?:^|;)\s*color:\s*([^;]+)/i.exec(style);
  return m ? m[1].trim() : undefined;
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
        inh.bold || inh.italic || inh.underline || inh.strike || Boolean(inh.bg) || Boolean(inh.color);
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

function renderBlock(node: Node, key: string): React.ReactNode | null {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const txt = decode((node as unknown as { rawText: string }).rawText || "").trim();
    return txt ? <Text key={key} style={st.para}>{txt}</Text> : null;
  }
  const el = node as HTMLElement;
  const tag = (el.rawTagName || "").toLowerCase();
  switch (tag) {
    case "p":
    case "div":
      if (!el.text.trim() && !el.querySelector("br")) return null;
      return <Text key={key} style={paraStyle(el, st.para)}>{inlineSpans(el, {}, key)}</Text>;
    case "h1":
      return <Text key={key} style={paraStyle(el, st.h1)}>{inlineSpans(el, {}, key)}</Text>;
    case "h2":
      return <Text key={key} style={paraStyle(el, st.h2)}>{inlineSpans(el, {}, key)}</Text>;
    case "h3":
    case "h4":
      return <Text key={key} style={paraStyle(el, st.h3)}>{inlineSpans(el, {}, key)}</Text>;
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
