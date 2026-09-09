import "server-only";
import JSZip from "jszip";
import type { KpTableData } from "./kpMerge";

/*
 * Заполнение Word-шаблона (.docx) без сторонних движков: JSZip + правка
 * word/document.xml. Плейсхолдеры {{tag}} Word часто разбивает на несколько
 * <w:r>/<w:t> (+ орфография), поэтому текст абзаца склеивается, потом
 * подставляются значения. {{cadastral_table}} → сгенерированная <w:tbl>.
 * Картиночные алиасы ({{company_header_image}}, {{signature}}, {{stamp}}) →
 * вставка inline-изображения (шапка/подпись/печать компании).
 */

const TABLE_TOKENS = ["{{cadastral_table}}", "{{calculation_table}}"];
const DANGER_TOKENS = [
  "line_service_area",
  "line_service_distance",
  "line_service_quantity",
  "line_ais_offer",
  "line_kp_number",
];

/** Картинка для вставки по алиасу. */
export interface KpImage {
  token: string; // без скобок, напр. "signature"
  data: Buffer;
  mime: string; // image/png | image/jpeg
  maxWidthPt: number; // максимальная ширина в пунктах (1 пт = 12700 EMU)
}

const EMU_PER_PT = 12700;
const EMU_PER_PX = 9525; // 96 dpi

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function valueToTextRuns(value: string): string {
  return value
    .split("\n")
    .map((p) => `<w:t xml:space="preserve">${xmlEscape(p)}</w:t>`)
    .join("<w:br/>");
}

function paragraphText(pXml: string): string {
  const texts = pXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  return texts.map((t) => t.replace(/<w:t\b[^>]*>/, "").replace(/<\/w:t>/, "")).join("");
}

function firstRunRpr(pXml: string): string {
  const runs = pXml.match(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g) || [];
  for (const r of runs) {
    if (/<w:t\b/.test(r)) {
      const m = r.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
      return m ? m[0] : "";
    }
  }
  return "";
}

function paragraphPropsXml(pXml: string): string {
  const m = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  return m ? m[0] : "";
}

function paragraphOpenTag(pXml: string): string {
  const m = pXml.match(/^<w:p\b[^>]*>/);
  return m ? m[0] : "<w:p>";
}

/* ─────────────── Таблица ─────────────── */

const COL_WIDTHS_5 = [600, 3400, 2400, 1400, 1800];

function tableXml(table: KpTableData): string {
  const n = table.headers.length;
  const widths = n === 5 ? COL_WIDTHS_5 : Array(n).fill(Math.floor(9600 / n));
  const sideBorder = (name: string) =>
    `<w:${name} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`;
  const borders =
    `<w:tblBorders>` +
    ["top", "left", "bottom", "right", "insideH", "insideV"].map(sideBorder).join("") +
    `</w:tblBorders>`;
  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  const cell = (text: string, o?: { bold?: boolean; span?: number; center?: boolean }) => {
    const rpr = o?.bold ? "<w:rPr><w:b/></w:rPr>" : "";
    const jc = o?.center ? '<w:jc w:val="center"/>' : "";
    const tcPr =
      `<w:tcPr><w:tcW w:w="0" w:type="auto"/>` +
      (o?.span ? `<w:gridSpan w:val="${o.span}"/>` : "") +
      `<w:vAlign w:val="center"/></w:tcPr>`;
    return `<w:tc>${tcPr}<w:p><w:pPr>${jc}</w:pPr><w:r>${rpr}${valueToTextRuns(text)}</w:r></w:p></w:tc>`;
  };
  const headerRow =
    `<w:tr><w:trPr><w:tblHeader/></w:trPr>` +
    table.headers.map((h) => cell(h, { bold: true, center: true })).join("") +
    `</w:tr>`;
  const bodyRows = table.rows
    .map((r) => `<w:tr>` + r.map((c, ci) => cell(c, { center: ci === 0 || ci >= 3 })).join("") + `</w:tr>`)
    .join("");
  const totalRow =
    `<w:tr>` + cell(table.totalLabel, { bold: true, span: n - 1 }) + cell(table.totalValue, { bold: true, center: true }) + `</w:tr>`;
  const totalAisRow = table.totalWithAisLabel
    ? `<w:tr>` + cell(table.totalWithAisLabel, { bold: true, span: n - 1 }) + cell(table.totalWithAisValue || "", { bold: true, center: true }) + `</w:tr>`
    : "";
  return (
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${borders}` +
    `<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>` +
    `</w:tblPr>${grid}${headerRow}${bodyRows}${totalRow}${totalAisRow}</w:tbl>`
  );
}

/* ─────────────── Размеры картинок ─────────────── */

function imageSizePx(buf: Buffer, mime: string): { w: number; h: number } {
  try {
    if (mime.includes("png") && buf.length > 24) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    if (mime.includes("jpeg") || mime.includes("jpg")) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = buf[i + 1];
        // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          const h = buf.readUInt16BE(i + 5);
          const w = buf.readUInt16BE(i + 7);
          return { w, h };
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      }
    }
  } catch {
    /* fallthrough */
  }
  return { w: 600, h: 200 }; // разумный дефолт
}

function drawingXml(rId: string, docPrId: number, cx: number, cy: number, name: string): string {
  return (
    `<w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${docPrId}" name="${xmlEscape(name)}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${xmlEscape(name)}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`
  );
}

/* ─────────────── Подстановка ─────────────── */

function buildRunInner(
  merged: string,
  tags: Record<string, string>,
  imageRuns: Record<string, string>
): string {
  let inner = "";
  let last = 0;
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(merged))) {
    const lit = merged.slice(last, m.index);
    if (lit) inner += `<w:t xml:space="preserve">${lit}</w:t>`;
    const key = m[1];
    if (key in imageRuns) inner += imageRuns[key];
    else if (key in tags) inner += valueToTextRuns(tags[key]);
    else inner += `<w:t xml:space="preserve">${m[0]}</w:t>`;
    last = m.index + m[0].length;
  }
  const tail = merged.slice(last);
  if (tail) inner += `<w:t xml:space="preserve">${tail}</w:t>`;
  return inner || '<w:t xml:space="preserve"></w:t>';
}

function processParagraph(
  pXml: string,
  tags: Record<string, string>,
  table: KpTableData,
  imageRuns: Record<string, string>
): string {
  const text = paragraphText(pXml);
  if (!text.includes("{{")) return pXml;
  if (TABLE_TOKENS.some((t) => text.includes(t))) return tableXml(table);
  for (const dt of DANGER_TOKENS) {
    if (text.includes(`{{${dt}}}`) && !(tags[dt] || "").trim()) return "";
  }
  const rPr = firstRunRpr(pXml);
  return `${paragraphOpenTag(pXml)}${paragraphPropsXml(pXml)}<w:r>${rPr}${buildRunInner(text, tags, imageRuns)}</w:r></w:p>`;
}

function fillDocumentXml(
  xml: string,
  tags: Record<string, string>,
  table: KpTableData,
  imageRuns: Record<string, string>
): string {
  return xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (p) => processParagraph(p, tags, table, imageRuns));
}

/** Гарантирует объявление пространств имён wp/r/a/pic на корне документа. */
function ensureRootNamespaces(xml: string): string {
  const nsMap: Record<string, string> = {
    "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
  };
  return xml.replace(/<w:document\b([^>]*)>/, (whole, attrs: string) => {
    let add = "";
    for (const [k, v] of Object.entries(nsMap)) {
      if (!attrs.includes(`${k}=`)) add += ` ${k}="${v}"`;
    }
    return `<w:document${attrs}${add}>`;
  });
}

/* ─────────────── Авто-блоки шапки/подписанта ─────────────── */

function drawingPara(drawing: string, center = true): string {
  const jc = center ? '<w:jc w:val="center"/>' : "";
  return `<w:p><w:pPr>${jc}</w:pPr><w:r>${drawing}</w:r></w:p>`;
}

/** Блок шапки: картинка (приоритет) или жирный центрированный текст. */
function autoHeaderBlock(headerDrawing?: string, headerText?: string): string {
  if (headerDrawing) return drawingPara(headerDrawing) + "<w:p/>";
  if (headerText && headerText.trim()) {
    return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr>${valueToTextRuns(headerText)}</w:r></w:p><w:p/>`;
  }
  return "";
}

/** Блок подписанта в конце документа: должность, подпись+печать, ФИО. */
function autoSignerBlock(
  sigDrawing?: string,
  stampDrawing?: string,
  role?: string,
  name?: string
): string {
  if (!sigDrawing && !stampDrawing && !(name && name.trim()) && !(role && role.trim())) return "";
  const parts: string[] = ["<w:p/>"]; // отступ
  if (role && role.trim()) parts.push(`<w:p><w:r>${valueToTextRuns(role)}</w:r></w:p>`);
  if (sigDrawing || stampDrawing) {
    const inner = [sigDrawing, stampDrawing]
      .filter(Boolean)
      .map((d) => `<w:r>${d}</w:r>`)
      .join('<w:r><w:t xml:space="preserve">      </w:t></w:r>');
    parts.push(`<w:p><w:pPr></w:pPr>${inner}</w:p>`);
  }
  if (name && name.trim()) parts.push(`<w:p><w:r>${valueToTextRuns(name)}</w:r></w:p>`);
  return parts.join("");
}

/* ─────────────── Сборка ─────────────── */

/** Заполняет .docx-шаблон и возвращает готовый буфер .docx. */
export async function fillDocxTemplate(
  templateBuffer: Buffer,
  tags: Record<string, string>,
  table: KpTableData,
  images: KpImage[] = [],
  autoBlocks = true
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Некорректный шаблон: нет word/document.xml");
  let xml = await docFile.async("string");

  // Регистрируем ВСЕ картинки компании (шапка/подпись/печать) с данными —
  // они пригодятся либо по алиасу, либо для авто-вставки в начало/конец.
  const allDrawings: Record<string, string> = {};
  const withData = images.filter((img) => img.data?.length);
  if (withData.length) {
    const rels = await ensureRelsXml(zip);
    const usedExts = new Set<string>();
    let n = existingImageCount(rels.xml);
    let relXml = rels.xml;
    withData.forEach((img, idx) => {
      n++;
      const ext = img.mime.includes("png") ? "png" : "jpeg";
      usedExts.add(ext);
      const mediaName = `kp_img_${n}.${ext}`;
      const rId = `rIdKpImg${n}`;
      zip.file(`word/media/${mediaName}`, img.data);
      relXml = relXml.replace(
        "</Relationships>",
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaName}"/></Relationships>`
      );
      const { w, h } = imageSizePx(img.data, img.mime);
      const maxW = img.maxWidthPt * EMU_PER_PT;
      let cx = w * EMU_PER_PX;
      let cy = h * EMU_PER_PX;
      if (cx > maxW) {
        const k = maxW / cx;
        cx = Math.round(cx * k);
        cy = Math.round(cy * k);
      }
      allDrawings[img.token] = drawingXml(rId, 1000 + idx, cx, cy, mediaName);
    });
    zip.file("word/_rels/document.xml.rels", relXml);
    await ensureContentTypes(zip, usedExts);
    xml = ensureRootNamespaces(xml);
  }

  // Картинки, чей алиас есть в шаблоне, ставим на месте алиаса.
  const imageRuns: Record<string, string> = {};
  for (const [token, draw] of Object.entries(allDrawings)) {
    if (xml.includes(`{{${token}}}`)) imageRuns[token] = draw;
  }

  let filled = fillDocumentXml(xml, tags, table, imageRuns);

  // Авто-вставка, если в шаблоне НЕТ соответствующих алиасов: шапку — в начало
  // тела, подписанта — перед завершающим <w:sectPr> (иначе перед </w:body>).
  const headerAlias = /\{\{(company_header|company_header_image)\}\}/.test(xml);
  const signerAlias = /\{\{(signature|stamp|signer_name|signer_role|sender_director)\}\}/.test(xml);

  if (autoBlocks && !headerAlias) {
    const block = autoHeaderBlock(allDrawings["company_header_image"], tags.company_header);
    if (block) filled = filled.replace(/(<w:body[^>]*>)/, `$1${block}`);
  }
  if (autoBlocks && !signerAlias) {
    const block = autoSignerBlock(
      allDrawings["signature"],
      allDrawings["stamp"],
      tags.signer_role,
      tags.signer_name
    );
    if (block) {
      const idx = filled.lastIndexOf("<w:sectPr");
      if (idx !== -1) filled = filled.slice(0, idx) + block + filled.slice(idx);
      else filled = filled.replace("</w:body>", `${block}</w:body>`);
    }
  }

  zip.file("word/document.xml", filled);

  // Колонтитулы — только текст/таблица (без картинок для MVP).
  for (const f of zip.file(/word\/(header|footer)\d*\.xml/)) {
    const hx = await f.async("string");
    zip.file(f.name, fillDocumentXml(hx, tags, table, {}));
  }

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return out as Buffer;
}

async function ensureRelsXml(zip: JSZip): Promise<{ xml: string }> {
  const f = zip.file("word/_rels/document.xml.rels");
  if (f) return { xml: await f.async("string") };
  const xml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  return { xml };
}

function existingImageCount(relsXml: string): number {
  return (relsXml.match(/relationships\/image/g) || []).length;
}

async function ensureContentTypes(zip: JSZip, exts: Set<string>): Promise<void> {
  const f = zip.file("[Content_Types].xml");
  if (!f) return;
  let xml = await f.async("string");
  const add = (ext: string, ct: string) => {
    if (!new RegExp(`Extension="${ext}"`, "i").test(xml)) {
      xml = xml.replace("</Types>", `<Default Extension="${ext}" ContentType="${ct}"/></Types>`);
    }
  };
  if (exts.has("png")) add("png", "image/png");
  if (exts.has("jpeg")) {
    add("jpeg", "image/jpeg");
    add("jpg", "image/jpeg");
  }
  zip.file("[Content_Types].xml", xml);
}

/** Извлекает список {{плейсхолдеров}} из шаблона (для карточки шаблона). */
export async function extractPlaceholders(templateBuffer: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const found = new Set<string>();
  const files = [
    zip.file("word/document.xml"),
    ...zip.file(/word\/(header|footer)\d*\.xml/),
  ].filter(Boolean) as JSZip.JSZipObject[];
  for (const f of files) {
    const xml = await f.async("string");
    for (const p of xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) || []) {
      const text = paragraphText(p);
      for (const mm of text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []) {
        found.add(mm.replace(/[{}\s]/g, ""));
      }
    }
  }
  return [...found].sort();
}
