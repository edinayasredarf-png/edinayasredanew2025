import "server-only";
import JSZip from "jszip";
import { parse, type HTMLElement, type Node } from "node-html-parser";

/*
 * Превращает HTML (из редактора админки) в валидный .docx-буфер. Дальше буфер
 * проходит обычный конвейер fillDocxTemplate (плейсхолдеры, таблица, шапка,
 * подпись). Поддержка: p/div/h1-6/li/ul/ol/br, жирный/курсив/подчёркнутый,
 * выравнивание. Плейсхолдеры {{...}} остаются текстом и заменяются позже.
 */

interface Ctx {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right" | "both";
  size?: number; // half-points
}

interface Run {
  text?: string;
  br?: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  size?: number;
}

const BLOCK = new Set([
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol", "blockquote", "section", "article",
]);

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function isEl(n: Node): n is HTMLElement {
  return (n as HTMLElement).nodeType === 1;
}

function alignOf(el: HTMLElement, fallback: Ctx["align"]): Ctx["align"] {
  const style = (el.getAttribute("style") || "").toLowerCase();
  const attr = (el.getAttribute("align") || "").toLowerCase();
  const m = style.match(/text-align\s*:\s*(left|center|right|justify)/);
  const v = m?.[1] || attr;
  if (v === "center") return "center";
  if (v === "right") return "right";
  if (v === "justify") return "both";
  if (v === "left") return "left";
  return fallback;
}

function runsFrom(node: Node, ctx: Ctx): Run[] {
  if (!isEl(node)) {
    const t = (node as Node & { rawText?: string }).rawText ?? (node as unknown as { text: string }).text ?? "";
    // node-html-parser decodes entities in .text; use it
    const text = (node as unknown as { text: string }).text || "";
    void t;
    if (!text) return [];
    return [{ text, bold: ctx.bold, italic: ctx.italic, underline: ctx.underline, size: ctx.size }];
  }
  const el = node as HTMLElement;
  const tag = el.rawTagName?.toLowerCase() || "";
  if (tag === "br") return [{ br: true, bold: ctx.bold, italic: ctx.italic, underline: ctx.underline }];
  const next: Ctx = {
    ...ctx,
    bold: ctx.bold || tag === "b" || tag === "strong",
    italic: ctx.italic || tag === "i" || tag === "em",
    underline: ctx.underline || tag === "u",
  };
  const out: Run[] = [];
  for (const ch of el.childNodes) out.push(...runsFrom(ch, next));
  return out;
}

function runXml(r: Run): string {
  if (r.br) return "<w:r><w:br/></w:r>";
  const rpr =
    (r.bold ? "<w:b/>" : "") +
    (r.italic ? "<w:i/>" : "") +
    (r.underline ? '<w:u w:val="single"/>' : "") +
    (r.size ? `<w:sz w:val="${r.size}"/><w:szCs w:val="${r.size}"/>` : "");
  const rprXml = rpr ? `<w:rPr>${rpr}</w:rPr>` : "";
  return `<w:r>${rprXml}<w:t xml:space="preserve">${xmlEscape(r.text || "")}</w:t></w:r>`;
}

function paragraph(runs: Run[], align: Ctx["align"], prefix?: string): string {
  const jc = align && align !== "left" ? `<w:jc w:val="${align}"/>` : "";
  const pPr = jc ? `<w:pPr>${jc}</w:pPr>` : "";
  const pre = prefix ? `<w:r><w:t xml:space="preserve">${xmlEscape(prefix)}</w:t></w:r>` : "";
  const body = runs.map(runXml).join("");
  return `<w:p>${pPr}${pre}${body || '<w:t xml:space="preserve"></w:t>'}</w:p>`.replace(
    '<w:t xml:space="preserve"></w:t>',
    ""
  );
}

function headingSize(tag: string): number | undefined {
  switch (tag) {
    case "h1": return 36;
    case "h2": return 32;
    case "h3": return 28;
    case "h4": case "h5": case "h6": return 26;
    default: return undefined;
  }
}

function paragraphsFrom(node: HTMLElement, ctx: Ctx, listPrefix?: string): string[] {
  const out: string[] = [];
  let inline: Run[] = [];
  const flush = () => {
    if (inline.length) {
      out.push(paragraph(inline, ctx.align, listPrefix));
      inline = [];
    }
  };
  let liIndex = 0;
  for (const ch of node.childNodes) {
    if (isEl(ch) && BLOCK.has((ch.rawTagName || "").toLowerCase())) {
      flush();
      const tag = (ch.rawTagName || "").toLowerCase();
      const childCtx: Ctx = {
        ...ctx,
        align: alignOf(ch, ctx.align),
        bold: ctx.bold || tag.startsWith("h"),
        size: headingSize(tag) ?? ctx.size,
      };
      let prefix: string | undefined;
      if (tag === "li") {
        const parentTag = (node.rawTagName || "").toLowerCase();
        prefix = parentTag === "ol" ? `${++liIndex}. ` : "•  ";
      }
      out.push(...paragraphsFrom(ch, childCtx, prefix));
    } else {
      inline.push(...runsFrom(ch, ctx));
    }
  }
  flush();
  return out;
}

const DOC_NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  "</Types>";

const RELS_ROOT =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  "</Relationships>";

const RELS_DOC =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  "</Relationships>";

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  "<w:docDefaults><w:rPrDefault><w:rPr>" +
  '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' +
  '<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="ru-RU"/>' +
  "</w:rPr></w:rPrDefault></w:docDefaults></w:styles>";

const SECT_PR =
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
  '<w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>' +
  "</w:sectPr>";

/** HTML → .docx-буфер. */
export async function buildDocxFromHtml(html: string): Promise<Buffer> {
  const root = parse(html || "", { blockTextElements: {} });
  const ctx: Ctx = { bold: false, italic: false, underline: false, align: "left" };
  let paras = paragraphsFrom(root, ctx).join("");
  if (!paras) paras = "<w:p/>";
  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:document ${DOC_NS}><w:body>${paras}${SECT_PR}</w:body></w:document>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS_ROOT);
  zip.file("word/document.xml", documentXml);
  zip.file("word/_rels/document.xml.rels", RELS_DOC);
  zip.file("word/styles.xml", STYLES);
  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return out as Buffer;
}

/** Извлекает {{плейсхолдеры}} из HTML-тела шаблона. */
export function extractPlaceholdersFromHtml(html: string): string[] {
  const found = new Set<string>();
  for (const m of (html || "").match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []) {
    found.add(m.replace(/[{}\s]/g, ""));
  }
  return [...found].sort();
}
