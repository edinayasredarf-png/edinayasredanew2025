import "server-only";
import JSZip from "jszip";

/*
 * Минимальный генератор .xlsx (OpenXML SpreadsheetML) без внешних зависимостей —
 * как buildDocxFromHtml для Word. Достаточно для отчётов: несколько листов,
 * строковые/числовые ячейки, жирная строка заголовка. Строки — inline (без
 * sharedStrings), числа — как есть.
 */

export type Cell = string | number | null | undefined;
export interface Sheet {
  name: string;
  rows: Cell[][];
  headerRows?: number; // сколько первых строк выделить жирным (по умолчанию 1)
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Индекс колонки (0→A, 25→Z, 26→AA). */
function colName(idx: number): string {
  let s = "";
  let n = idx;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

/** Имя листа для Excel: ≤31 символ, без : \ / ? * [ ]. */
function safeName(name: string, i: number): string {
  const clean = (name || `Лист${i + 1}`).replace(/[:\\/?*[\]]/g, " ").slice(0, 31).trim();
  return clean || `Лист${i + 1}`;
}

function cellXml(ref: string, v: Cell, bold: boolean): string {
  const s = bold ? ' s="1"' : "";
  if (v == null || v === "") return `<c r="${ref}"${s}/>`;
  if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
}

function sheetXml(sheet: Sheet): string {
  const header = sheet.headerRows ?? 1;
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row.map((v, c) => cellXml(`${colName(c)}${r + 1}`, v, r < header)).join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rows}</sheetData></worksheet>`
  );
}

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  "<fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font><font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts>" +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border/></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  "</styleSheet>";

/** Собрать .xlsx-буфер из листов. */
export async function buildXlsx(sheets: Sheet[]): Promise<Buffer> {
  const list = sheets.length ? sheets : [{ name: "Лист1", rows: [] as Cell[][] }];
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      list
        .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
        .join("") +
      "</Types>"
  );

  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      "</Relationships>"
  );

  const sheetsXml = list.map((s, i) => `<sheet name="${esc(safeName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("");
  zip.file(
    "xl/workbook.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheets>${sheetsXml}</sheets></workbook>`
  );

  const rels = list
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join("");
  zip.file(
    "xl/_rels/workbook.xml.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      rels +
      `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      "</Relationships>"
  );

  zip.file("xl/styles.xml", STYLES);
  list.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)));

  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return out as Buffer;
}
