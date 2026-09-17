/**
 * Разбор комбинированных услуг (ИЗН + ЕС, ИЗН + ИМЗ + ЕС, ИМЗ + ЕС, Лес + ЛХР…)
 * на атомарные компоненты. Комбинированная услуга НЕ имеет собственной цены —
 * её тариф складывается из уже заданных тарифов атомарных услуг компании:
 *   • ₽/га (прямой/торги) берётся у площадной услуги (ИМЗ, иначе ИЗН);
 *   • цена АИС «Единая среда» — у услуги ЕС;
 *   • пролонгация — у ЕС.
 *
 * Модуль без server-only — используется и на клиенте (превью/итоги), и на сервере
 * (генерация), чтобы правило разложения было единым.
 */

/** Явная карта разложения для услуг, где аббревиатуры не совпадают с названиями. */
export const SERVICE_COMPONENTS: Record<string, string[]> = {
  "ИМЗ + ЕС": ["ИМЗ", "ЕС"],
  "ИЗН + ЕС": ["ИЗН", "ЕС"],
  "ИЗН + ИМЗ + ЕС": ["ИЗН", "ИМЗ", "ЕС"],
  "Лес + ЛХР": ["Лесоустройство", "Лесохозяйственный регламент"],
};

/** Услуга комбинированная, если есть явная карта или в названии есть «+». */
export function isCombinedService(name: string): boolean {
  return Boolean(SERVICE_COMPONENTS[name]) || name.includes("+");
}

/** Атомарные компоненты услуги (для атомарной — сама услуга). */
export function serviceComponents(name: string): string[] {
  if (SERVICE_COMPONENTS[name]) return SERVICE_COMPONENTS[name];
  if (name.includes("+")) {
    return name.split(/\s*\+\s*/).map((s) => s.trim()).filter(Boolean);
  }
  return [name];
}

export interface TierLike {
  orgKey: string;
  serviceType: string;
  pricePerHaDirect: number;
  pricePerHaTender: number;
  aisPrice: number;
  renewalPerYear: number;
  minHectares: number;
}

/** Позиция (строка-услуга) в таблице расчёта. */
export interface ServiceLineItem {
  key: string;
  name: string;
  unit: string;
}

/** Позиция с ценой конкретной компании (max — верх диапазона «до», 0 = нет диапазона). */
export interface PricedLine {
  svc: string; // атомарная услуга-владелец позиции
  key: string; // ключ позиции внутри услуги
  name: string;
  unit: string;
  direct: number;
  tender: number;
  directMax: number;
  tenderMax: number;
}

/**
 * Строки таблицы для услуги (для комбинированной — объединение строк компонентов),
 * с ценами из тарифа компании. `lineItemsOf`/`priceOf` дают доступ к данным
 * атомарных услуг (одинаково на клиенте и сервере).
 */
export function composeLines(
  serviceType: string,
  lineItemsOf: (svc: string) => ServiceLineItem[],
  priceOf: (svc: string, key: string) => { direct: number; tender: number; directMax?: number; tenderMax?: number } | undefined,
): PricedLine[] {
  const out: PricedLine[] = [];
  for (const svc of serviceComponents(serviceType)) {
    for (const it of lineItemsOf(svc)) {
      const p = priceOf(svc, it.key);
      out.push({
        svc,
        key: it.key,
        name: it.name,
        unit: it.unit,
        direct: p?.direct ?? 0,
        tender: p?.tender ?? 0,
        directMax: p?.directMax ?? 0,
        tenderMax: p?.tenderMax ?? 0,
      });
    }
  }
  return out;
}

const AREA_PRIORITY = ["ИМЗ", "ИЗН"];

/**
 * Тариф услуги. Для атомарной — просто `find(serviceType)`. Для комбинированной —
 * синтез из тарифов компонентов (цены не дублируются в отдельной «групповой» услуге).
 */
export function composeTier(
  orgKey: string,
  serviceType: string,
  find: (svc: string) => TierLike | undefined,
): TierLike | undefined {
  const comps = serviceComponents(serviceType);
  if (comps.length <= 1) return find(serviceType);

  const tiers = comps.map((s) => find(s));

  // Площадная услуга задаёт ₽/га: приоритет ИМЗ → ИЗН → первый с ненулевой ценой.
  let area: TierLike | undefined;
  for (const p of AREA_PRIORITY) {
    const idx = comps.indexOf(p);
    if (idx >= 0 && tiers[idx]) { area = tiers[idx]; break; }
  }
  if (!area) area = tiers.find((t) => t && (t.pricePerHaDirect || t.pricePerHaTender)) || undefined;

  // ЕС задаёт цену АИС и пролонгации.
  const esIdx = comps.indexOf("ЕС");
  const es = esIdx >= 0 ? tiers[esIdx] : undefined;
  const aisPrice = es?.aisPrice || tiers.find((t) => t && t.aisPrice)?.aisPrice || 0;
  const renewalPerYear = es?.renewalPerYear || tiers.find((t) => t && t.renewalPerYear)?.renewalPerYear || 0;

  return {
    orgKey,
    serviceType,
    pricePerHaDirect: area?.pricePerHaDirect ?? 0,
    pricePerHaTender: area?.pricePerHaTender ?? 0,
    aisPrice,
    renewalPerYear,
    minHectares: area?.minHectares ?? 1,
  };
}
