import "server-only";
import JSZip from "jszip";
import { parse, type HTMLElement, type Node } from "node-html-parser";

/*
 * Правка текста в загруженном .docx-шаблоне БЕЗ потери оформления.
 *
 * Раньше шаблон превращался в HTML (mammoth), правился и собирался заново «с нуля» — шрифты, размеры и отступы терялись.
 * Теперь исходный .docx остаётся основой:
 *   docxToEditorHtml  — абзацы документа → HTML для редактора С оформлением (шрифт, размер, цвет, выравнивание, отступы,
 *                       красная строка, нумерация); у каждого абзаца data-kp-id — ссылка на абзац оригинала;
 *   patchDocxFromEditorHtml — правки из редактора переносятся обратно в document.xml: неизменённые абзацы остаются
 *                       байт-в-байт, у изменённых сохраняются свойства абзаца и оформление текста (для вставленного
 *                       текста берётся оформление соседних символов), таблицы/рисунки/колонтитулы не затрагиваются.
 */

// ───────────────────────── XML-утилиты ─────────────────────────

const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escHtml = (s: string) => esc(s).replace(/"/g, "&quot;");

/** Верхнеуровневые элементы XML-фрагмента (самозакрывающиеся и парные); текст между ними отбрасывается. */
function splitElements(inner: string): string[] {
  const out: string[] = [];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)\b[^>]*?(\/?)>/g;
  let depth = 0;
  let start = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const closing = m[1] === "/";
    const selfClosing = m[3] === "/";
    if (!closing && depth === 0) start = m.index;
    if (!closing && !selfClosing) depth++;
    else if (closing) depth--;
    if (depth === 0 && start >= 0) {
      out.push(inner.slice(start, re.lastIndex));
      start = -1;
    }
  }
  return out;
}

function innerOf(xml: string): string {
  const open = xml.match(/^<[^>]*>/);
  if (!open || /\/>$/.test(open[0])) return "";
  const close = xml.lastIndexOf("</");
  return xml.slice(open[0].length, close);
}

const tagName = (el: string) => (el.match(/^<([\w:.-]+)/) || [])[1] || "";
const attr = (el: string, name: string): string | null => {
  const m = el.match(new RegExp(`\\s${name.replace(":", "\\:")}="([^"]*)"`));
  return m ? m[1] : null;
};

// ───────────────────────── Стили документа ─────────────────────────

interface Mark {
  b: boolean;
  i: boolean;
  u: boolean;
  sz: number | null; // half-points
  font: string | null;
  color: string | null; // RRGGBB, null = авто/чёрный
}

const emptyMark = (): Mark => ({ b: false, i: false, u: false, sz: null, font: null, color: null });

interface StyleDef { basedOn: string | null; type: string; isDefault: boolean; rPr: string; pPr: string }
interface Styles { docRPr: string; docPPr: string; byId: Map<string, StyleDef>; defaultPara: string | null }

function parseStyles(xml: string | null): Styles {
  const st: Styles = { docRPr: "", docPPr: "", byId: new Map(), defaultPara: null };
  if (!xml) return st;
  const dd = xml.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/)?.[0] || "";
  st.docRPr = dd.match(/<w:rPrDefault>[\s\S]*?<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || "";
  st.docPPr = dd.match(/<w:pPrDefault>[\s\S]*?<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] || "";
  for (const m of xml.matchAll(/<w:style\b([^>]*)>([\s\S]*?)<\/w:style>/g)) {
    const id = attr(`<x${m[1]}>`, "w:styleId");
    if (!id) continue;
    const body = m[2];
    const def: StyleDef = {
      basedOn: body.match(/<w:basedOn\s+w:val="([^"]*)"/)?.[1] ?? null,
      type: attr(`<x${m[1]}>`, "w:type") || "paragraph",
      isDefault: attr(`<x${m[1]}>`, "w:default") === "1",
      rPr: body.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || "",
      pPr: body.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] || "",
    };
    st.byId.set(id, def);
    if (def.type === "paragraph" && def.isDefault) st.defaultPara = id;
  }
  return st;
}

/** Цепочка стиля от корня (basedOn) к самому стилю. */
function styleChain(st: Styles, id: string | null): StyleDef[] {
  const chain: StyleDef[] = [];
  const seen = new Set<string>();
  let cur = id;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const d = st.byId.get(cur);
    if (!d) break;
    chain.unshift(d);
    cur = d.basedOn;
  }
  return chain;
}

function boolProp(rPr: string, tag: string, prev: boolean): boolean {
  const m = rPr.match(new RegExp(`<w:${tag}(?:\\s[^>]*)?/?>`));
  if (!m) return prev;
  const v = attr(m[0], "w:val");
  return !(v === "0" || v === "false" || v === "off");
}

function applyRPr(m: Mark, rPr: string): Mark {
  const out = { ...m };
  out.b = boolProp(rPr, "b", out.b);
  out.i = boolProp(rPr, "i", out.i);
  const u = rPr.match(/<w:u(?:\s[^>]*)?\/?>/);
  if (u) out.u = (attr(u[0], "w:val") || "single") !== "none";
  const sz = rPr.match(/<w:sz\s+w:val="(\d+)"/);
  if (sz) out.sz = Number(sz[1]);
  const f = rPr.match(/<w:rFonts\b[^>]*?\sw:ascii="([^"]+)"/) || rPr.match(/<w:rFonts\b[^>]*?\sw:hAnsi="([^"]+)"/);
  if (f) out.font = unesc(f[1]);
  const c = rPr.match(/<w:color\s+w:val="([0-9A-Fa-f]{6}|auto)"/);
  if (c) out.color = c[1] === "auto" || c[1].toUpperCase() === "000000" ? null : c[1].toUpperCase();
  return out;
}

function baseMark(st: Styles, pStyle: string | null): Mark {
  let m = applyRPr(emptyMark(), st.docRPr);
  for (const s of styleChain(st, pStyle || st.defaultPara)) m = applyRPr(m, s.rPr);
  return m;
}

// ───────────────────────── Свойства абзаца ─────────────────────────

interface PProps {
  align: "left" | "center" | "right" | "justify";
  left: number; // twips
  first: number; // twips (hanging — отрицательный)
  right: number;
  before: number | null;
  after: number | null;
  line: number | null; // множитель (auto)
}

function applyPPr(p: PProps, pPr: string): PProps {
  const out = { ...p };
  const jc = pPr.match(/<w:jc\s+w:val="([^"]*)"/)?.[1];
  if (jc) out.align = jc === "center" ? "center" : jc === "right" || jc === "end" ? "right" : jc === "both" || jc === "distribute" ? "justify" : "left";
  const ind = pPr.match(/<w:ind\b[^>]*\/?>/)?.[0];
  if (ind) {
    const l = attr(ind, "w:left") ?? attr(ind, "w:start");
    if (l != null) out.left = Number(l) || 0;
    const r = attr(ind, "w:right") ?? attr(ind, "w:end");
    if (r != null) out.right = Number(r) || 0;
    const f = attr(ind, "w:firstLine");
    const h = attr(ind, "w:hanging");
    if (f != null) out.first = Number(f) || 0;
    else if (h != null) out.first = -(Number(h) || 0);
  }
  const sp = pPr.match(/<w:spacing\b[^>]*\/?>/)?.[0];
  if (sp) {
    const b = attr(sp, "w:before"); if (b != null) out.before = Number(b) || 0;
    const a = attr(sp, "w:after"); if (a != null) out.after = Number(a) || 0;
    const ln = attr(sp, "w:line");
    const rule = attr(sp, "w:lineRule");
    if (ln != null && (!rule || rule === "auto")) out.line = Number(ln) / 240;
  }
  return out;
}

function paraProps(st: Styles, pStyle: string | null, directPPr: string): PProps {
  let p: PProps = { align: "left", left: 0, first: 0, right: 0, before: null, after: null, line: null };
  p = applyPPr(p, st.docPPr);
  for (const s of styleChain(st, pStyle || st.defaultPara)) p = applyPPr(p, s.pPr);
  return applyPPr(p, directPPr);
}

// ───────────────────────── Нумерация ─────────────────────────

interface Numbering { numToAbs: Map<string, string>; abs: Map<string, Map<number, { fmt: string; text: string }>> }

function parseNumbering(xml: string | null): Numbering {
  const n: Numbering = { numToAbs: new Map(), abs: new Map() };
  if (!xml) return n;
  for (const m of xml.matchAll(/<w:abstractNum\b([^>]*)>([\s\S]*?)<\/w:abstractNum>/g)) {
    const id = attr(`<x${m[1]}>`, "w:abstractNumId");
    if (id == null) continue;
    const lv = new Map<number, { fmt: string; text: string }>();
    for (const l of m[2].matchAll(/<w:lvl\b([^>]*)>([\s\S]*?)<\/w:lvl>/g)) {
      const il = Number(attr(`<x${l[1]}>`, "w:ilvl") || 0);
      lv.set(il, { fmt: l[2].match(/<w:numFmt\s+w:val="([^"]*)"/)?.[1] || "decimal", text: l[2].match(/<w:lvlText\s+w:val="([^"]*)"/)?.[1] || "%1." });
    }
    n.abs.set(id, lv);
  }
  for (const m of xml.matchAll(/<w:num\b([^>]*)>([\s\S]*?)<\/w:num>/g)) {
    const id = attr(`<x${m[1]}>`, "w:numId");
    const a = m[2].match(/<w:abstractNumId\s+w:val="([^"]*)"/)?.[1];
    if (id && a) n.numToAbs.set(id, a);
  }
  return n;
}

function fmtNum(n: number, fmt: string): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  if (fmt === "lowerLetter") return letters[(n - 1) % 26];
  if (fmt === "upperLetter") return letters[(n - 1) % 26].toUpperCase();
  if (fmt === "lowerRoman" || fmt === "upperRoman") {
    const map: Array<[number, string]> = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
    let r = "", x = n;
    for (const [v, s] of map) while (x >= v) { r += s; x -= v; }
    return fmt === "upperRoman" ? r.toUpperCase() : r;
  }
  return String(n);
}

// ───────────────────────── Разбор абзаца ─────────────────────────

const TAB = " "; // в редакторе табуляция = длинный пробел (обратно превращается в <w:tab/>)

interface Ch { c: string; m: Mark; run: number }
interface RunInfo { rPr: string; m: Mark }
interface PInfo {
  xml: string;
  pPr: string;
  pStyle: string | null;
  others: string[]; // закладки и т.п. — переносим как есть
  runs: RunInfo[];
  chars: Ch[];
  props: PProps;
  base: Mark;
  editable: boolean;
  num: string | null;
}

const SIMPLE_RUN_CHILD = new Set(["w:rPr", "w:t", "w:tab", "w:br", "w:lastRenderedPageBreak", "w:softHyphen"]);

function parseParagraph(xml: string, st: Styles, numbering: Numbering, counters: Map<string, number[]>): PInfo {
  const kids = splitElements(innerOf(xml));
  let pPr = "";
  const runsXml: string[] = [];
  const others: string[] = [];
  let editable = true;
  for (const k of kids) {
    const t = tagName(k);
    if (t === "w:pPr") pPr = k;
    else if (t === "w:r") runsXml.push(k);
    else if (t === "w:proofErr") continue;
    else if (t === "w:bookmarkStart" || t === "w:bookmarkEnd") others.push(k);
    else editable = false; // гиперссылки, поля, рисунки вне w:r и т.д.
  }
  const pPrInner = pPr ? innerOf(pPr) : "";
  const pStyle = pPrInner.match(/<w:pStyle\s+w:val="([^"]*)"/)?.[1] ?? null;
  const base = baseMark(st, pStyle);
  const runs: RunInfo[] = [];
  const chars: Ch[] = [];
  for (const r of runsXml) {
    const rk = splitElements(innerOf(r));
    const rPr = rk.find((x) => tagName(x) === "w:rPr") || "";
    let m = base;
    const rStyle = rPr.match(/<w:rStyle\s+w:val="([^"]*)"/)?.[1];
    if (rStyle) for (const s of styleChain(st, rStyle)) m = applyRPr(m, s.rPr);
    m = applyRPr(m, rPr ? innerOf(rPr) : "");
    const idx = runs.length;
    runs.push({ rPr, m });
    for (const c of rk) {
      const t = tagName(c);
      if (!SIMPLE_RUN_CHILD.has(t)) { editable = false; continue; }
      if (t === "w:t") for (const ch of unesc(innerOf(c))) chars.push({ c: ch, m, run: idx });
      else if (t === "w:tab") chars.push({ c: TAB, m, run: idx });
      else if (t === "w:br") {
        if ((attr(c, "w:type") || "textWrapping") === "textWrapping") chars.push({ c: "\n", m, run: idx });
        else editable = false; // разрыв страницы/колонки — не трогаем
      }
    }
  }
  // Нумерация (для подписи в редакторе).
  let num: string | null = null;
  // numPr бывает и у стиля абзаца («Список с номерами» и т.п.) — смотрим прямые свойства, затем стили.
  const numSource = /<w:numId\b/.test(pPrInner)
    ? pPrInner
    : [...styleChain(st, pStyle || st.defaultPara)].reverse().map((s) => s.pPr).find((x) => /<w:numId\b/.test(x)) || "";
  const numId = numSource.match(/<w:numId\s+w:val="([^"]*)"/)?.[1];
  if (numId && numId !== "0") {
    const ilvl = Number(numSource.match(/<w:ilvl\s+w:val="([^"]*)"/)?.[1] || 0);
    const absId = numbering.numToAbs.get(numId);
    const lvl = absId != null ? numbering.abs.get(absId)?.get(ilvl) : undefined;
    const arr = counters.get(numId) ?? [];
    arr[ilvl] = (arr[ilvl] ?? 0) + 1;
    for (let d = ilvl + 1; d < arr.length; d++) arr[d] = 0;
    counters.set(numId, arr);
    if (lvl) {
      if (lvl.fmt === "bullet") num = "•";
      else {
        const absLv = absId != null ? numbering.abs.get(absId) : undefined;
        num = lvl.text.replace(/%(\d)/g, (_, d) => {
          const li = Number(d) - 1;
          return fmtNum(arr[li] ?? 1, absLv?.get(li)?.fmt || "decimal");
        });
      }
    }
  }
  return { xml, pPr, pStyle, others, runs, chars, props: paraProps(st, pStyle, pPrInner), base, editable, num };
}

// ───────────────────────── Верхний уровень документа ─────────────────────────

interface Block { kind: "p" | "tbl" | "other"; xml: string; info?: PInfo }
interface Loaded {
  zip: JSZip; docXml: string; head: string; tail: string; sect: string; blocks: Block[]; st: Styles;
}

async function loadDoc(buf: Buffer): Promise<Loaded> {
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("В .docx нет word/document.xml");
  const st = parseStyles((await zip.file("word/styles.xml")?.async("string")) ?? null);
  const numbering = parseNumbering((await zip.file("word/numbering.xml")?.async("string")) ?? null);
  const bodyOpen = docXml.match(/<w:body\b[^>]*>/);
  const bodyClose = docXml.lastIndexOf("</w:body>");
  if (!bodyOpen || bodyClose < 0) throw new Error("Некорректный document.xml");
  const head = docXml.slice(0, bodyOpen.index! + bodyOpen[0].length);
  const inner = docXml.slice(head.length, bodyClose);
  const tail = docXml.slice(bodyClose);
  const els = splitElements(inner);
  let sect = "";
  const blocks: Block[] = [];
  const counters = new Map<string, number[]>();
  for (const e of els) {
    const t = tagName(e);
    if (t === "w:sectPr") { sect = e; continue; }
    if (t === "w:p") blocks.push({ kind: "p", xml: e, info: parseParagraph(e, st, numbering, counters) });
    else if (t === "w:tbl") blocks.push({ kind: "tbl", xml: e });
    else blocks.push({ kind: "other", xml: e });
  }
  return { zip, docXml, head, tail, sect, blocks, st };
}

// ───────────────────────── DOCX → HTML для редактора ─────────────────────────

const PT = (tw: number) => `${Math.round((tw / 20) * 100) / 100}pt`;

function runHtml(text: string, m: Mark): string {
  let h = escHtml(text).replace(/\n/g, "<br>");
  const css: string[] = [];
  if (m.font) css.push(`font-family: ${m.font}`);
  if (m.sz) css.push(`font-size: ${m.sz / 2}pt`);
  if (m.color) css.push(`color: #${m.color}`);
  if (css.length) h = `<span style="${escHtml(css.join("; "))}">${h}</span>`;
  if (m.u) h = `<u>${h}</u>`;
  if (m.i) h = `<em>${h}</em>`;
  if (m.b) h = `<strong>${h}</strong>`;
  return h;
}

const sameMark = (a: Mark, b: Mark) => a.b === b.b && a.i === b.i && a.u === b.u && a.sz === b.sz && (a.font || "").toLowerCase() === (b.font || "").toLowerCase() && a.color === b.color;

export async function docxToEditorHtml(buf: Buffer): Promise<string> {
  const { blocks } = await loadDoc(buf);
  const out: string[] = [];
  blocks.forEach((b, idx) => {
    if (b.kind === "other") return;
    if (b.kind === "tbl") {
      const rows = (b.xml.match(/<w:tr\b/g) || []).length;
      out.push(`<p data-kp-id="${idx}" data-kp-num="⟦таблица, строк: ${rows}⟧">&nbsp;</p>`);
      return;
    }
    const info = b.info!;
    const p = info.props;
    const css: string[] = [];
    if (p.align !== "left") css.push(`text-align: ${p.align}`);
    if (p.left) css.push(`padding-left: ${PT(p.left)}`);
    if (p.first) css.push(`text-indent: ${PT(p.first)}`);
    if (p.before) css.push(`margin-top: ${PT(p.before)}`);
    if (p.after != null) css.push(`margin-bottom: ${PT(p.after)}`);
    if (p.line && p.line !== 1) css.push(`line-height: ${Math.round(p.line * 100) / 100}`);
    const styleAttr = css.length ? ` style="${escHtml(css.join("; "))}"` : "";
    if (!info.editable) {
      const label = info.chars.map((c) => c.c).join("").trim();
      out.push(`<p data-kp-id="${idx}" data-kp-num="⟦вставка: рисунок или поле — не редактируется⟧"${styleAttr}>${escHtml(label) || "&nbsp;"}</p>`);
      return;
    }
    const attrs = `data-kp-id="${idx}"${info.num ? ` data-kp-num="${escHtml(info.num)}"` : ""}${styleAttr}`;
    // Соседние символы с одинаковым оформлением → один фрагмент.
    let html = "";
    let cur = "";
    let curM: Mark | null = null;
    for (const ch of info.chars) {
      const c = ch.c === TAB ? TAB : ch.c;
      if (curM && sameMark(curM, ch.m)) cur += c;
      else {
        if (curM) html += runHtml(cur, curM);
        cur = c; curM = ch.m;
      }
    }
    if (curM) html += runHtml(cur, curM);
    out.push(`<p ${attrs}>${html}</p>`);
  });
  return out.join("");
}

// ───────────────────────── HTML редактора → разбор ─────────────────────────

interface EditedP { id: number | null; chars: Array<{ c: string; m: Mark }>; align: PProps["align"]; left: number; first: number }

function toTwips(v: string): number {
  const m = v.trim().match(/^(-?[\d.]+)\s*(pt|px|cm|mm|em|in)?$/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  switch ((m[2] || "px").toLowerCase()) {
    case "pt": return n * 20;
    case "cm": return n * 567;
    case "mm": return n * 56.7;
    case "in": return n * 1440;
    case "em": return n * 240;
    default: return n * 15;
  }
}

function styleMap(el: HTMLElement): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of (el.getAttribute("style") || "").split(";")) {
    const i = part.indexOf(":");
    if (i > 0) map.set(part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim()); // последнее значение выигрывает
  }
  return map;
}

function parseColor(v: string): string | null {
  const hex = v.trim().match(/^#([0-9a-f]{6})$/i) || v.trim().match(/^#([0-9a-f]{3})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    return h.toUpperCase() === "000000" ? null : h.toUpperCase();
  }
  const rgb = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const h = [rgb[1], rgb[2], rgb[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("").toUpperCase();
    return h === "000000" ? null : h;
  }
  return null;
}

function collectChars(node: Node, m: Mark, out: Array<{ c: string; m: Mark }>): void {
  const el = node as HTMLElement;
  if (el.nodeType !== 1) {
    const text = (node as unknown as { text: string }).text || "";
    for (const ch of text.replace(/ /g, " ")) out.push({ c: ch, m });
    return;
  }
  const tag = (el.rawTagName || "").toLowerCase();
  if (tag === "br") { out.push({ c: "\n", m }); return; }
  const next = { ...m };
  if (tag === "b" || tag === "strong") next.b = true;
  if (tag === "i" || tag === "em") next.i = true;
  if (tag === "u") next.u = true;
  const sm = styleMap(el);
  if (sm.has("font-weight")) { const w = sm.get("font-weight")!; next.b = w === "bold" || Number(w) >= 600; }
  if (sm.get("font-style") === "italic") next.i = true;
  if ((sm.get("text-decoration") || sm.get("text-decoration-line") || "").includes("underline")) next.u = true;
  if (sm.has("font-family")) next.font = sm.get("font-family")!.split(",")[0].replace(/["']/g, "").trim() || null;
  if (sm.has("font-size")) {
    const s = sm.get("font-size")!;
    const pt = /pt$/i.test(s) ? parseFloat(s) : /px$/i.test(s) ? parseFloat(s) * 0.75 : NaN;
    if (Number.isFinite(pt) && pt > 0) next.sz = Math.round(pt * 2);
  }
  if (sm.has("color")) next.color = parseColor(sm.get("color")!);
  for (const ch of el.childNodes) collectChars(ch, next, out);
}

function parseEditorHtml(html: string): EditedP[] {
  const root = parse(html || "", { blockTextElements: {} });
  const out: EditedP[] = [];
  const addPara = (el: HTMLElement, prefix?: string) => {
    const idRaw = el.getAttribute("data-kp-id");
    const sm = styleMap(el);
    const chars: Array<{ c: string; m: Mark }> = [];
    for (const ch of el.childNodes) collectChars(ch, emptyMark(), chars);
    if (prefix) chars.unshift(...[...prefix].map((c) => ({ c, m: emptyMark() })));
    const ta = (sm.get("text-align") || el.getAttribute("align") || "left").toLowerCase();
    out.push({
      id: idRaw != null && /^\d+$/.test(idRaw) ? Number(idRaw) : null,
      chars,
      align: ta === "center" ? "center" : ta === "right" ? "right" : ta === "justify" ? "justify" : "left",
      left: toTwips(sm.get("padding-left") || sm.get("margin-left") || "0"),
      first: toTwips(sm.get("text-indent") || "0"),
    });
  };
  for (const ch of root.childNodes) {
    const el = ch as HTMLElement;
    if (el.nodeType !== 1) continue;
    const tag = (el.rawTagName || "").toLowerCase();
    if (tag === "ul" || tag === "ol") {
      let i = 0;
      for (const li of el.childNodes) {
        const l = li as HTMLElement;
        if (l.nodeType !== 1) continue;
        i++;
        addPara(l, tag === "ol" ? `${i}. ` : "• ");
      }
    } else if (tag === "table") {
      continue; // таблицы из редактора не переносим — таблицы шаблона остаются как в оригинале
    } else {
      addPara(el);
    }
  }
  return out;
}

// ───────────────────────── Сборка правок ─────────────────────────

const RPR_ORDER = ["w:rStyle", "w:rFonts", "w:b", "w:bCs", "w:i", "w:iCs", "w:caps", "w:smallCaps", "w:strike", "w:dstrike", "w:outline", "w:shadow", "w:emboss", "w:imprint", "w:noProof", "w:snapToGrid", "w:vanish", "w:webHidden", "w:color", "w:spacing", "w:w", "w:kern", "w:position", "w:sz", "w:szCs", "w:highlight", "w:u", "w:effect", "w:bdr", "w:shd", "w:fitText", "w:vertAlign", "w:rtl", "w:cs", "w:em", "w:lang", "w:eastAsianLayout", "w:specVanish", "w:oMath"];
const PPR_ORDER = ["w:pStyle", "w:keepNext", "w:keepLines", "w:pageBreakBefore", "w:framePr", "w:widowControl", "w:numPr", "w:suppressLineNumbers", "w:pBdr", "w:shd", "w:tabs", "w:suppressAutoHyphens", "w:kinsoku", "w:wordWrap", "w:overflowPunct", "w:topLinePunct", "w:autoSpaceDE", "w:autoSpaceDN", "w:bidi", "w:adjustRightInd", "w:snapToGrid", "w:spacing", "w:ind", "w:contextualSpacing", "w:mirrorIndents", "w:suppressOverlap", "w:jc", "w:textDirection", "w:textAlignment", "w:textboxTightWrap", "w:outlineLvl", "w:divId", "w:cnfStyle", "w:rPr", "w:sectPr", "w:pPrChange"];

function rebuildProps(wrapper: "w:rPr" | "w:pPr", existing: string, remove: string[], add: string[]): string {
  const order = wrapper === "w:rPr" ? RPR_ORDER : PPR_ORDER;
  const kids = splitElements(existing ? innerOf(existing) : "").filter((k) => !remove.includes(tagName(k)));
  kids.push(...add);
  const rank = (k: string) => { const i = order.indexOf(tagName(k)); return i < 0 ? order.length : i; };
  kids.sort((a, b) => rank(a) - rank(b));
  return kids.length ? `<${wrapper}>${kids.join("")}</${wrapper}>` : "";
}

function patchRPr(rPr: string, src: Mark, now: Mark): string {
  const remove: string[] = [];
  const add: string[] = [];
  if (src.b !== now.b) { remove.push("w:b", "w:bCs"); add.push(now.b ? "<w:b/><w:bCs/>" : '<w:b w:val="0"/><w:bCs w:val="0"/>'); }
  if (src.i !== now.i) { remove.push("w:i", "w:iCs"); add.push(now.i ? "<w:i/><w:iCs/>" : '<w:i w:val="0"/><w:iCs w:val="0"/>'); }
  if (src.u !== now.u) { remove.push("w:u"); add.push(now.u ? '<w:u w:val="single"/>' : '<w:u w:val="none"/>'); }
  if (src.sz !== now.sz && now.sz) { remove.push("w:sz", "w:szCs"); add.push(`<w:sz w:val="${now.sz}"/><w:szCs w:val="${now.sz}"/>`); }
  if ((src.font || "").toLowerCase() !== (now.font || "").toLowerCase() && now.font) {
    const f = esc(now.font).replace(/"/g, "&quot;");
    remove.push("w:rFonts"); add.push(`<w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}" w:eastAsia="${f}"/>`);
  }
  if (src.color !== now.color) { remove.push("w:color"); add.push(`<w:color w:val="${now.color ?? "auto"}"/>`); }
  if (!remove.length) return rPr;
  return rebuildProps("w:rPr", rPr, remove, add);
}

function patchPPr(info: PInfo, e: EditedP): string {
  const p = info.props;
  const remove: string[] = [];
  const add: string[] = [];
  if (e.align !== p.align) { remove.push("w:jc"); add.push(`<w:jc w:val="${e.align === "justify" ? "both" : e.align}"/>`); }
  if (Math.abs(e.left - p.left) > 15 || Math.abs(e.first - p.first) > 15) {
    const old = info.pPr ? (innerOf(info.pPr).match(/<w:ind\b[^>]*\/?>/)?.[0] || "") : "";
    const right = attr(old, "w:right");
    remove.push("w:ind");
    add.push(`<w:ind w:left="${Math.max(0, Math.round(e.left))}"${right != null ? ` w:right="${right}"` : ""}${e.first < 0 ? ` w:hanging="${Math.round(-e.first)}"` : ` w:firstLine="${Math.round(e.first)}"`}/>`);
  }
  if (!remove.length) return info.pPr;
  return rebuildProps("w:pPr", info.pPr, remove, add);
}

const wsNorm = (chars: Array<{ c: string }>) => chars.map((x) => x.c).join("").replace(/\s+/g, " ").trim();

function runXml(rPr: string, text: string): string {
  let body = "";
  let buf = "";
  const flush = () => { if (buf) { body += `<w:t xml:space="preserve">${esc(buf)}</w:t>`; buf = ""; } };
  for (const ch of text) {
    if (ch === TAB) { flush(); body += "<w:tab/>"; }
    else if (ch === "\n") { flush(); body += "<w:br/>"; }
    else buf += ch;
  }
  flush();
  return `<w:r>${rPr}${body}</w:r>`;
}

/** Абзац из правок: свойства и оформление берём у оригинала (или у соседнего абзаца-образца для нового). */
function buildParagraph(info: PInfo, e: EditedP, isNew: boolean): string {
  const pPr = patchPPr(info, e);
  const open = (info.xml.match(/^<w:p\b[^>]*>/) || ["<w:p>"])[0];
  // Исходные символы для сопоставления: для нового абзаца — образец (оформление первого символа / первого запуска).
  const orig = isNew ? [] : info.chars;
  const nw = e.chars;

  // Пробельные серии в редакторе схлопываются — сравниваем по схлопнутому тексту.
  if (!isNew && wsNorm(orig) === wsNorm(nw)) {
    // Текст тот же: проверим, не менялось ли оформление (жирный, размер и т.п.).
    const o2 = collapse(orig);
    const n2 = collapse(nw);
    if (o2.length === n2.length && o2.every((o, i) => sameMark(o.m, n2[i].m))) {
      if (pPr === info.pPr) return info.xml;
      return info.pPr ? info.xml.replace(info.pPr, () => pPr) : info.xml.replace(open, () => `${open}${pPr}`);
    }
  }

  const o = collapse(orig);
  const n = collapse(nw);
  let pre = 0;
  while (pre < o.length && pre < n.length && o[pre].c === n[pre].c) pre++;
  let suf = 0;
  while (suf < o.length - pre && suf < n.length - pre && o[o.length - 1 - suf].c === n[n.length - 1 - suf].c) suf++;

  const tplRun = (idx: number) => info.runs[idx] ?? info.runs[0];
  const groups: Array<{ rPr: string; text: string; key: string }> = [];
  for (let j = 0; j < n.length; j++) {
    let srcRun = -1;
    let srcMark: Mark;
    if (j < pre) { srcRun = o[j].run; srcMark = o[j].m; }
    else if (j >= n.length - suf) { const k = o.length - (n.length - j); srcRun = o[k].run; srcMark = o[k].m; }
    else if (pre > 0) { srcRun = o[pre - 1].run; srcMark = o[pre - 1].m; }
    else if (o.length > 0) { srcRun = o[0].run; srcMark = o[0].m; }
    else if (info.chars.length) { srcRun = info.chars[0].run; srcMark = info.chars[0].m; }
    else { srcRun = 0; srcMark = info.runs[0]?.m ?? info.base; }
    const run = tplRun(srcRun);
    const baseRPr = run?.rPr || "";
    const rPr = patchRPr(baseRPr, srcMark, n[j].m);
    const key = `${srcRun}|${rPr}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.text += n[j].c;
    else groups.push({ rPr, text: n[j].c, key });
  }
  const runs = groups.map((g) => runXml(g.rPr, g.text)).join("");
  return `${open}${pPr}${info.others.join("")}${runs}</w:p>`;
}

/** Схлопывает серии пробелов (как это делает редактор) и сохраняет принадлежность запуску. */
function collapse<T extends { c: string }>(chars: T[]): T[] {
  const out: T[] = [];
  let prevSpace = true; // ведущие пробелы редактор отбрасывает
  for (const ch of chars) {
    const isSp = /\s/.test(ch.c) && ch.c !== TAB && ch.c !== "\n" && ch.c !== " ";
    if (isSp) { if (prevSpace) continue; out.push({ ...ch, c: " " }); prevSpace = true; }
    else { out.push(ch); prevSpace = false; }
  }
  while (out.length && out[out.length - 1].c === " ") out.pop();
  return out;
}

/** Переносит правки из редактора в исходный .docx; всё, что не правилось, остаётся нетронутым. */
export async function patchDocxFromEditorHtml(buf: Buffer, html: string): Promise<Buffer> {
  const doc = await loadDoc(buf);
  const edited = parseEditorHtml(html);
  const { blocks } = doc;

  const used = new Set<number>();
  const result: Array<{ orig: number | null; xml: string }> = [];
  let lastTemplate: number | null = null; // образец для новых абзацев
  const firstTemplate = blocks.findIndex((b) => b.kind === "p" && b.info!.editable);

  for (const e of edited) {
    const idx = e.id;
    const blk = idx != null ? blocks[idx] : undefined;
    if (blk && blk.kind !== "other") {
      if (blk.kind === "tbl" || !blk.info!.editable) {
        if (!used.has(idx!)) { used.add(idx!); result.push({ orig: idx!, xml: blk.xml }); }
        continue;
      }
      if (!used.has(idx!)) {
        used.add(idx!);
        lastTemplate = idx!;
        result.push({ orig: idx!, xml: buildParagraph(blk.info!, e, false) });
        continue;
      }
      // Повторный id (абзац разделён Enter) — новый абзац по образцу оригинала.
      result.push({ orig: null, xml: buildParagraph(blk.info!, e, true) });
      continue;
    }
    const tplIdx = lastTemplate ?? (firstTemplate >= 0 ? firstTemplate : null);
    if (tplIdx == null) {
      // В документе вообще нет редактируемых абзацев — простой абзац.
      result.push({ orig: null, xml: `<w:p>${runXml("", e.chars.map((c) => c.c).join(""))}</w:p>` });
    } else {
      result.push({ orig: null, xml: buildParagraph(blocks[tplIdx].info!, e, true) });
    }
  }

  // Неотображаемые элементы (закладки, sdt и т.п.) возвращаем на место: после предыдущего видимого блока.
  const others: Array<{ prev: number; xml: string; placed: boolean }> = [];
  let prevVisible = -1;
  blocks.forEach((b, i) => {
    if (b.kind === "other") others.push({ prev: prevVisible, xml: b.xml, placed: false });
    else prevVisible = i;
  });
  const parts: string[] = [];
  for (const o of others) if (o.prev === -1) { parts.push(o.xml); o.placed = true; }
  for (const r of result) {
    parts.push(r.xml);
    if (r.orig != null) for (const o of others) if (!o.placed && o.prev === r.orig) { parts.push(o.xml); o.placed = true; }
  }
  for (const o of others) if (!o.placed) parts.push(o.xml);

  const newXml = `${doc.head}${parts.join("")}${doc.sect}${doc.tail}`;
  doc.zip.file("word/document.xml", newXml);
  return (await doc.zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })) as Buffer;
}
