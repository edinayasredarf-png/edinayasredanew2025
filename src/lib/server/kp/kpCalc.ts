import "server-only";

/*
 * Калькулятор КП. Формулы взяты из рабочего Excel «Расчёт по документам»:
 *   стоимость строки = max(площадь_га, 1) × цена_за_га   (минимум 1 гектар)
 *   площадь_га       = площадь_кв.м / 10000
 *   ИТОГО            = сумма строк
 *   ИТОГО с АИС      = сумма строк + стоимость АИС (единожды)
 * Разные организации отличаются только ценой за гектар и ценой АИС
 * (листы «Е С» / «ЛД» / «Куш» = Экострой / Лесное дело / Кушнарёва).
 */

/** Режим цены: прямой контракт или торги. */
export type PriceMode = "direct" | "tender";

/** Ценовой тир организации для конкретного типа услуги. */
export interface PriceTier {
  /** Цена за гектар, прямой контракт. */
  pricePerHaDirect: number;
  /** Цена за гектар, торги. */
  pricePerHaTender: number;
  /** Стоимость одной лицензии АИС «Единая среда». */
  aisPrice: number;
  /** Стоимость пролонгации за год. */
  renewalPerYear: number;
  /** Минимум гектаров к оплате (пол по площади). По умолчанию 1. */
  minHectares?: number;
}

/** Строка расчётной таблицы (территория / кадастровый участок). */
export interface CalcRow {
  /** Наименование территории / объекта. */
  name?: string;
  /** Кадастровый номер. */
  cadastral?: string;
  /** Площадь в кв. метрах (основной ввод). */
  areaSqm?: number;
  /** Либо площадь сразу в гектарах (если задана — приоритетнее areaSqm). */
  areaHa?: number;
}

/** Что включаем в КП. */
export interface KpIncludes {
  service: boolean;
  ais: boolean;
  renewal: boolean;
}

export interface AisParams {
  licenses: number;
  pricePerLicense: number;
}

export interface RenewalParams {
  years: number;
  pricePerYear: number;
}

export interface ComputedRow extends CalcRow {
  index: number;
  areaHaResolved: number;
  billedHa: number;
  cost: number;
}

export interface KpCalcResult {
  mode: PriceMode;
  rows: ComputedRow[];
  serviceTotal: number;
  aisTotal: number;
  renewalTotal: number;
  grandTotal: number;
}

const HA_IN_SQM = 10000;

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\s+/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Площадь строки в гектарах (из га напрямую или из кв.м). */
export function rowHectares(row: CalcRow): number {
  if (row.areaHa != null && toNum(row.areaHa) > 0) return toNum(row.areaHa);
  return toNum(row.areaSqm) / HA_IN_SQM;
}

/** Стоимость одной строки: max(га, минимум) × цена за гектар выбранного режима. */
export function rowCost(row: CalcRow, tier: PriceTier, mode: PriceMode): number {
  const ha = rowHectares(row);
  const min = tier.minHectares ?? 1;
  const billed = Math.max(ha, min);
  const perHa = mode === "tender" ? tier.pricePerHaTender : tier.pricePerHaDirect;
  return billed * toNum(perHa);
}

export function computeKp(input: {
  rows: CalcRow[];
  tier: PriceTier;
  mode: PriceMode;
  includes: KpIncludes;
  ais?: AisParams;
  renewal?: RenewalParams;
}): KpCalcResult {
  const { tier, mode, includes } = input;
  const min = tier.minHectares ?? 1;

  const rows: ComputedRow[] = input.rows.map((r, i) => {
    const ha = rowHectares(r);
    const billedHa = Math.max(ha, min);
    return {
      ...r,
      index: i + 1,
      areaHaResolved: ha,
      billedHa,
      cost: rowCost(r, tier, mode),
    };
  });

  const serviceTotal = includes.service
    ? rows.reduce((s, r) => s + r.cost, 0)
    : 0;

  const aisTotal =
    includes.ais && input.ais
      ? toNum(input.ais.licenses) * toNum(input.ais.pricePerLicense)
      : 0;

  const renewalTotal =
    includes.renewal && input.renewal
      ? toNum(input.renewal.years) * toNum(input.renewal.pricePerYear)
      : 0;

  return {
    mode,
    rows,
    serviceTotal,
    aisTotal,
    renewalTotal,
    grandTotal: serviceTotal + aisTotal + renewalTotal,
  };
}

/** Округление до 2 знаков (деньги). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Формат «1 234 567.00». */
export function formatMoney(n: number): string {
  const v = round2(n);
  const [int, dec = "00"] = v.toFixed(2).split(".");
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + dec;
}

/** Формат «1 234 567» (без копеек). */
export function formatInt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Формат гектаров: «11.35» (два знака, точка). */
export function formatHa(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}
