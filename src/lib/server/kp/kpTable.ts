import "server-only";
import { evaluateFormulaSafe } from "./kpFormula";

/*
 * Конфигурируемая расчётная таблица КП. Колонки произвольного типа и порядка,
 * с формулами (движок kpFormula). Таблица сохраняется как шаблон в БД и имеет
 * алиас {{key}} для вставки в Word-шаблон.
 */

export type ColAlign = "left" | "center" | "right";
export type ColKind = "index" | "text" | "number" | "const" | "formula";

export interface CalcColumn {
  key: string; // ключ ячейки в строке и переменная для формул (латиница)
  label: string; // заголовок колонки
  kind: ColKind;
  formula?: string; // для kind=formula
  constValue?: string; // для kind=const
  align?: ColAlign;
  sum?: boolean; // суммировать в строке ИТОГО
  isCost?: boolean; // это колонка стоимости → её сумма = стоимость услуги
  money?: boolean; // форматировать как деньги
}

export interface CalcTableDef {
  key: string; // алиас {{key}}
  name: string;
  columns: CalcColumn[];
  isActive: boolean;
  sortOrder: number;
}

/** Данные таблицы для рендера в .docx. */
export interface KpTableData {
  headers: string[];
  align: ColAlign[];
  rows: string[][];
  footers: string[][]; // строки ИТОГО (жирные), совпадают по числу колонок
}

export interface PriceVars {
  price: number;
  price_direct: number;
  price_tender: number;
  min_ha: number;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\s+/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function fmtMoney(n: number): string {
  const v = Math.round((n + Number.EPSILON) * 100) / 100;
  const [i, d = "00"] = v.toFixed(2).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + d;
}
function fmtNum(n: number): string {
  if (Number.isInteger(n)) return Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ");
  return fmtMoney(n);
}

export interface ComputedTable {
  data: KpTableData;
  serviceTotal: number;
  costColIndex: number; // индекс колонки стоимости (для строки «+АИС»)
  colSums: number[]; // суммы по колонкам (0, если не суммируется)
}

/** Вычисляет таблицу: подставляет формулы построчно, считает суммы и стоимость. */
export function computeTable(
  columns: CalcColumn[],
  rows: Array<Record<string, string>>,
  priceVars: PriceVars
): ComputedTable {
  const headers = columns.map((c) => c.label);
  const align: ColAlign[] = columns.map((c) => c.align || (c.kind === "text" ? "left" : "center"));
  const colSums = columns.map(() => 0);
  const costColIndex = columns.findIndex((c) => c.isCost);

  const body: string[][] = rows.map((row, ri) => {
    // scope: числовые/константные колонки + цены
    const scope: Record<string, number> = { ...priceVars, row_index: ri + 1 };
    for (const c of columns) {
      if (c.kind === "number") scope[c.key] = toNum(row[c.key]);
      else if (c.kind === "const") scope[c.key] = toNum(c.constValue);
    }
    // формулы слева направо (следующая может ссылаться на предыдущую)
    const numericByCol: number[] = [];
    const cells = columns.map((c, ci) => {
      let text = "";
      let num = 0;
      switch (c.kind) {
        case "index":
          num = ri + 1;
          text = String(ri + 1);
          break;
        case "text":
          text = (row[c.key] || "").toString();
          break;
        case "const":
          text = c.constValue || "";
          num = toNum(c.constValue);
          break;
        case "number":
          num = toNum(row[c.key]);
          text = row[c.key] ? (c.money ? fmtMoney(num) : fmtNum(num)) : "";
          break;
        case "formula": {
          num = evaluateFormulaSafe(c.formula || "0", scope);
          scope[c.key] = num; // доступно последующим формулам
          text = c.money || c.isCost ? fmtMoney(num) : fmtNum(num);
          break;
        }
      }
      numericByCol[ci] = num;
      if (c.sum || c.isCost) colSums[ci] += num;
      return text;
    });
    return cells;
  });

  const serviceTotal = costColIndex >= 0 ? colSums[costColIndex] : 0;

  // строка ИТОГО: «ВСЕГО» в первой колонке, суммы — под суммируемыми
  const footerRow: string[] = columns.map((c, ci) => {
    if (ci === 0) return "ВСЕГО";
    if (c.sum || c.isCost) return c.money || c.isCost ? fmtMoney(colSums[ci]) : fmtNum(colSums[ci]);
    return "";
  });

  return {
    data: { headers, align, rows: body, footers: [footerRow] },
    serviceTotal,
    costColIndex,
    colSums,
  };
}

/** Приводит ключ к латинице (для алиаса/переменной). */
export function slugKey(s: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return s
    .toLowerCase()
    .split("")
    .map((ch) => (ch in map ? map[ch] : ch))
    .join("")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}
