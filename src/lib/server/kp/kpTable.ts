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
  weights: number[]; // относительная ширина колонок (для растяжки на всю страницу)
  rows: string[][];
  footers: string[][]; // строки ИТОГО (жирные), совпадают по числу колонок
}

const KIND_WEIGHT: Record<ColKind, number> = {
  index: 0.5,
  number: 1.4,
  formula: 1.6,
  const: 1,
  text: 2.6,
};

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
  serviceTotalMax: number; // верх диапазона стоимости услуги (= serviceTotal, если без «до»)
  costColIndex: number; // индекс колонки стоимости (для строки «+АИС»)
  colSums: number[]; // суммы по колонкам, нижняя граница
  colSumsMax: number[]; // суммы по колонкам, верхняя граница
  moneyCols: number[]; // индексы денежных суммируемых колонок
}

/** Формат диапазона «мин – макс» (или одно число, если max ≤ min). */
export function fmtRange(min: number, max: number, money: boolean): string {
  const f = money ? fmtMoney : fmtNum;
  return max > min + 0.005 ? `${f(min)} – ${f(max)}` : f(min);
}

/** Вычисляет таблицу: подставляет формулы построчно, считает суммы и стоимость. */
export function computeTable(
  columns: CalcColumn[],
  rows: Array<Record<string, string>>,
  priceVars: PriceVars,
  opts?: { areaUnit?: "sqm" | "ha" }
): ComputedTable {
  const areaUnit = opts?.areaUnit || "sqm";
  const headers = columns.map((c) => c.label);
  const align: ColAlign[] = columns.map((c) => c.align || (c.kind === "text" ? "left" : "center"));
  const weights = columns.map((c) => KIND_WEIGHT[c.kind] ?? 1.5);
  const colSums = columns.map(() => 0);
  const colSumsMax = columns.map(() => 0);
  const costColIndex = columns.findIndex((c) => c.isCost);

  const body: string[][] = rows.map((row, ri) => {
    // scope: числовые/константные/текстовые колонки + цены. Две границы — min и max.
    const scope: Record<string, number> = { ...priceVars, row_index: ri + 1 };
    for (const c of columns) {
      if (c.kind === "number") scope[c.key] = toNum(row[c.key]);
      else if (c.kind === "const") scope[c.key] = toNum(c.constValue);
      else if (c.kind === "text") scope[c.key] = toNum(row[c.key]); // «5 Га» → 5 для формул площади
    }
    // Площадь в га: значение колонки area_sqm интерпретируем как гектары
    // (для формул area_sqm/10000 переводим в кв.м, отображение — как введено).
    if (areaUnit === "ha" && "area_sqm" in scope) scope.area_sqm *= 10000;
    const scopeMax: Record<string, number> = { ...scope };
    // Пер-строчная цена из раздела «Цены» (по компании), с верхней границей «до».
    if (row.__pd !== undefined && row.__pd !== "") {
      const pd = toNum(row.__pd);
      scope.price_direct = pd;
      scopeMax.price_direct = toNum(row.__pdMax) || pd;
    }
    if (row.__pt !== undefined && row.__pt !== "") {
      const pt = toNum(row.__pt);
      scope.price_tender = pt;
      scopeMax.price_tender = toNum(row.__ptMax) || pt;
    }
    if (row.__p !== undefined && row.__p !== "") {
      const p = toNum(row.__p);
      scope.price = p;
      scopeMax.price = toNum(row.__pMax) || p;
    }
    // формулы слева направо (следующая может ссылаться на предыдущую)
    const cells = columns.map((c, ci) => {
      let text = "";
      let num = 0;
      let numMax = 0;
      switch (c.kind) {
        case "index":
          num = numMax = ri + 1;
          text = String(ri + 1);
          break;
        case "text":
          text = (row[c.key] || "").toString();
          break;
        case "const":
          text = c.constValue || "";
          num = numMax = toNum(c.constValue);
          break;
        case "number":
          num = numMax = toNum(row[c.key]);
          text = row[c.key] ? (c.money ? fmtMoney(num) : fmtNum(num)) : "";
          break;
        case "formula": {
          if (row.__manual === "1" && row[c.key] !== undefined && row[c.key] !== "") {
            num = numMax = toNum(row[c.key]);
          } else {
            num = evaluateFormulaSafe(c.formula || "0", scope);
            numMax = evaluateFormulaSafe(c.formula || "0", scopeMax);
          }
          scope[c.key] = num;
          scopeMax[c.key] = numMax;
          text = fmtRange(num, numMax, Boolean(c.money || c.isCost));
          break;
        }
      }
      if (c.sum || c.isCost) { colSums[ci] += num; colSumsMax[ci] += numMax; }
      return text;
    });
    return cells;
  });

  const serviceTotal = costColIndex >= 0 ? colSums[costColIndex] : 0;
  const serviceTotalMax = costColIndex >= 0 ? colSumsMax[costColIndex] : 0;
  // Денежные суммируемые колонки (для строки «ВСЕГО с АИС» по обеим ценам).
  const moneyCols = columns
    .map((c, ci) => (c.isCost || (c.sum && c.money) ? ci : -1))
    .filter((i) => i >= 0);

  // строка ИТОГО: «ВСЕГО» в первой колонке, суммы (диапазоном) — под суммируемыми
  const footerRow: string[] = columns.map((c, ci) => {
    if (ci === 0) return "ВСЕГО";
    if (c.sum || c.isCost) return fmtRange(colSums[ci], colSumsMax[ci], Boolean(c.money || c.isCost));
    return "";
  });

  return {
    data: { headers, align, weights, rows: body, footers: [footerRow] },
    serviceTotal,
    serviceTotalMax,
    colSumsMax,
    costColIndex,
    colSums,
    moneyCols,
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
