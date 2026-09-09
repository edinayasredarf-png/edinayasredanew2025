import "server-only";
import JSZip from "jszip";
import type { KpTableData } from "./kpMerge";

/*
 * Заполнение Word-шаблона (.docx) без сторонних движков: JSZip + правка
 * word/document.xml. Плейсхолдеры {{tag}} Word часто разбивает на несколько
 * <w:r>/<w:t> (+ теги проверки орфографии), поэтому текст абзаца сначала
 * склеивается, потом подставляются значения. Табличный плейсхолдер
 * {{cadastral_table}} / {{calculation_table}} заменяется сгенерированной <w:tbl>.
 */

const TABLE_TOKENS = ["{{cadastral_table}}", "{{calculation_table}}"];
/** «Опасные» условные плейсхолдеры: пустое значение удаляет весь абзац. */
const DANGER_TOKENS = [
  "line_service_area",
  "line_service_distance",
  "line_service_quantity",
  "line_ais_offer",
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Текст значения → набор <w:t> с переносами строк через <w:br/>. */
function valueToTextRuns(value: string): string {
  return value
    .split("\n")
    .map((p) => `<w:t xml:space="preserve">${xmlEscape(p)}</w:t>`)
    .join("<w:br/>");
}

/** Собирает видимый текст абзаца из всех <w:t> (для поиска плейсхолдеров). */
function paragraphText(pXml: string): string {
  const texts = pXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  return texts
    .map((t) => t.replace(/<w:t\b[^>]*>/, "").replace(/<\/w:t>/, ""))
    .join("");
}

/** rPr первого текстового прогона (сохраняем форматирование). */
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

const COL_WIDTHS_5 = [600, 3400, 2400, 1400, 1800]; // № / наимен. / кадастр / га / стоимость

function tableXml(table: KpTableData): string {
  const n = table.headers.length;
  const widths = n === 5 ? COL_WIDTHS_5 : Array(n).fill(Math.floor(9600 / n));

  const side = (name: string) =>
    `<w:${name} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`;
  const borders =
    `<w:tblBorders>` +
    ["top", "left", "bottom", "right", "insideH", "insideV"].map(side).join("") +
    `</w:tblBorders>`;

  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;

  const cell = (text: string, opts?: { bold?: boolean; span?: number; center?: boolean }) => {
    const rpr = opts?.bold ? "<w:rPr><w:b/></w:rPr>" : "";
    const jc = opts?.center ? '<w:jc w:val="center"/>' : "";
    const tcPr =
      `<w:tcPr><w:tcW w:w="0" w:type="auto"/>` +
      (opts?.span ? `<w:gridSpan w:val="${opts.span}"/>` : "") +
      `<w:vAlign w:val="center"/></w:tcPr>`;
    return `<w:tc>${tcPr}<w:p><w:pPr>${jc}</w:pPr><w:r>${rpr}${valueToTextRuns(text)}</w:r></w:p></w:tc>`;
  };

  const headerRow =
    `<w:tr><w:trPr><w:tblHeader/></w:trPr>` +
    table.headers.map((h) => cell(h, { bold: true, center: true })).join("") +
    `</w:tr>`;

  const bodyRows = table.rows
    .map(
      (r) =>
        `<w:tr>` + r.map((c, ci) => cell(c, { center: ci === 0 || ci >= 3 })).join("") + `</w:tr>`
    )
    .join("");

  const totalRow =
    `<w:tr>` +
    cell(table.totalLabel, { bold: true, span: n - 1 }) +
    cell(table.totalValue, { bold: true, center: true }) +
    `</w:tr>`;

  const totalAisRow = table.totalWithAisLabel
    ? `<w:tr>` +
      cell(table.totalWithAisLabel, { bold: true, span: n - 1 }) +
      cell(table.totalWithAisValue || "", { bold: true, center: true }) +
      `</w:tr>`
    : "";

  return (
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${borders}` +
    `<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>` +
    `</w:tblPr>${grid}${headerRow}${bodyRows}${totalRow}${totalAisRow}</w:tbl>`
  );
}

/*
 * Собирает содержимое итогового <w:r> из склеенного (уже XML-экранированного)
 * текста абзаца. Исходный текст остаётся как есть, экранируются ТОЛЬКО
 * подставляемые значения.
 */
function buildRunInner(merged: string, tags: Record<string, string>): string {
  let inner = "";
  let last = 0;
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(merged))) {
    const lit = merged.slice(last, m.index);
    if (lit) inner += `<w:t xml:space="preserve">${lit}</w:t>`;
    const key = m[1];
    if (key in tags) inner += valueToTextRuns(tags[key]);
    else inner += `<w:t xml:space="preserve">${m[0]}</w:t>`; // неизвестный — как есть
    last = m.index + m[0].length;
  }
  const tail = merged.slice(last);
  if (tail) inner += `<w:t xml:space="preserve">${tail}</w:t>`;
  return inner || '<w:t xml:space="preserve"></w:t>';
}

/** Обрабатывает один <w:p>: возвращает новый XML (или '' для удаления абзаца). */
function processParagraph(pXml: string, tags: Record<string, string>, table: KpTableData): string {
  const text = paragraphText(pXml);
  if (!text.includes("{{")) return pXml;

  if (TABLE_TOKENS.some((t) => text.includes(t))) {
    return tableXml(table);
  }

  for (const dt of DANGER_TOKENS) {
    if (text.includes(`{{${dt}}}`) && !(tags[dt] || "").trim()) {
      return "";
    }
  }

  const rPr = firstRunRpr(pXml);
  const open = paragraphOpenTag(pXml);
  const pPr = paragraphPropsXml(pXml);
  return `${open}${pPr}<w:r>${rPr}${buildRunInner(text, tags)}</w:r></w:p>`;
}

function fillDocumentXml(xml: string, tags: Record<string, string>, table: KpTableData): string {
  return xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (p) => processParagraph(p, tags, table));
}

/** Заполняет .docx-шаблон и возвращает готовый буфер .docx. */
export async function fillDocxTemplate(
  templateBuffer: Buffer,
  tags: Record<string, string>,
  table: KpTableData
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Некорректный шаблон: нет word/document.xml");
  const xml = await docFile.async("string");
  zip.file("word/document.xml", fillDocumentXml(xml, tags, table));

  // Колонтитулы тоже могут содержать плейсхолдеры (шапка/подвал).
  for (const f of zip.file(/word\/(header|footer)\d*\.xml/)) {
    const hx = await f.async("string");
    zip.file(f.name, fillDocumentXml(hx, tags, table));
  }

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return out as Buffer;
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
