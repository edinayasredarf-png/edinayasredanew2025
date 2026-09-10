import "server-only";
import { parseFio, initials as fioInitials, detectGender } from "../nameTransforms";
import {
  computeKp,
  formatHa,
  formatInt,
  formatMoney,
  type CalcRow,
  type KpCalcResult,
  type KpIncludes,
  type PriceMode,
  type PriceTier,
} from "./kpCalc";
import { rublesInWords, countInWords } from "./kpNumberWords";
import type { KpExecutor, KpOrganization } from "./kpDb";

/** Полезная нагрузка формы «Создать КП» (одинаковая для всех организаций). */
export interface KpFormPayload {
  serviceType: string;
  mode: PriceMode;
  includes: KpIncludes;
  client: {
    orgFull: string;
    orgShort?: string;
    fioFull: string;
    salutation?: string; // Уважаемый / Уважаемая — если пусто, определяется по ФИО
    requestNumber?: string;
    requestDate?: string;
  };
  kp: {
    date?: string; // ISO или пусто → сегодня
    number?: string; // пусто → автоген
    validityPeriod?: string; // «30 дней»
  };
  object?: {
    location?: string;
    distanceKm?: number;
    quantityUnits?: number;
  };
  rows: CalcRow[];
  ais?: { licenses: number; pricePerLicense: number };
  renewal?: { years: number; pricePerYear: number };
  vat?: { mode: "none" | "usn" | "nds"; rate?: number };
}

export interface KpTableData {
  headers: string[];
  rows: string[][];
  totalLabel: string;
  totalValue: string;
  totalWithAisLabel?: string;
  totalWithAisValue?: string;
}

export interface KpContext {
  tags: Record<string, string>;
  calc: KpCalcResult;
  table: KpTableData;
  totalCost: number;
  filenameBase: string;
}

function todayRu(d?: string): string {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) return formatDateRu(new Date());
  return formatDateRu(date);
}

function formatDateRu(d: Date): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  return `«${String(d.getDate()).padStart(2, "0")}» ${months[d.getMonth()]} ${d.getFullYear()} г.`;
}

function shortDateRu(d?: string): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function autoKpNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `КП-${y}${m}${day}-001`;
}

/** «Иванов И.И.» из полного ФИО. */
export function fioShortLastFirst(fio: string): string {
  const { last, first, middle } = parseFio(fio);
  const ini = fioInitials(first, middle);
  return `${last} ${ini}`.trim();
}

/** Строит контекст для одной организации (тир + исполнитель заданы). */
export function buildKpContext(input: {
  payload: KpFormPayload;
  org: KpOrganization;
  executor: KpExecutor | null;
  tier: PriceTier;
}): KpContext {
  const { payload, org, executor, tier } = input;

  const calc = computeKp({
    rows: payload.rows,
    tier,
    mode: payload.mode,
    includes: payload.includes,
    ais: payload.ais,
    renewal: payload.renewal,
  });

  const areaHaTotal = calc.rows.reduce((s, r) => s + r.areaHaResolved, 0);
  const location =
    payload.object?.location?.trim() ||
    calc.rows.map((r) => r.name).filter(Boolean).join(", ");

  // Обращение: из формы или по роду ФИО клиента.
  const { first, middle } = parseFio(payload.client.fioFull);
  const gender = detectGender(first, middle);
  const salutation =
    payload.client.salutation?.trim() || (gender === "female" ? "Уважаемая" : "Уважаемый");

  // Готовая ссылка на входящий запрос. Шаблон уже содержит «В ответ на ваш запрос …»,
  // поэтому здесь только «№ … от …» (без повтора «на запрос»).
  const requestRef = payload.client.requestNumber?.trim()
    ? `№ ${payload.client.requestNumber.trim()}${
        payload.client.requestDate ? ` от ${shortDateRu(payload.client.requestDate)}` : ""
      }`
    : "";

  const aisLicenses = payload.ais?.licenses ?? 0;
  const aisPrice = payload.ais?.pricePerLicense ?? tier.aisPrice;
  const renewalYears = payload.renewal?.years ?? 0;
  const renewalPerYear = payload.renewal?.pricePerYear ?? tier.renewalPerYear;

  const aisOfferText = payload.includes.ais
    ? `Предлагаем внедрение АИС «Единая среда»: ${aisLicenses} лиценз${
        aisLicenses === 1 ? "ия" : "ий"
      } на сумму ${formatMoney(calc.aisTotal)} руб. В стоимость включено обучение, внедрение, онбординг, настройка и сервис.`
    : "";

  const vatMode = payload.vat?.mode ?? "usn";
  const vatBlock =
    vatMode === "nds"
      ? `В том числе НДС 20% — ${formatMoney((calc.grandTotal * 20) / 120)} руб.`
      : "НДС не облагается (применяется УСН).";

  // ФИО подписанта в формате «А.В. Статов» (инициалы впереди) — для блока подписи.
  const signerParsed = org.directorFio ? parseFio(org.directorFio) : null;
  const signerDisplayName = signerParsed
    ? `${fioInitials(signerParsed.first, signerParsed.middle)} ${signerParsed.last}`.trim()
    : "";

  // Номер КП: включён флаг — номер (или авто), выключен — «б/н».
  const kpNumber = org.writeKpNumber ? payload.kp.number?.trim() || autoKpNumber() : "б/н";

  const tags: Record<string, string> = {
    // КП
    kp_date: todayRu(payload.kp.date),
    kp_number: kpNumber,
    line_kp_number: kpNumber, // {{line_kp_number}} — удаляет абзац, если номер не пишем
    kp_validity_period: payload.kp.validityPeriod?.trim() || "30 дней",
    // Клиент
    client_org_full: payload.client.orgFull.trim(),
    client_org_short: payload.client.orgShort?.trim() || payload.client.orgFull.trim(),
    client_fio_full: payload.client.fioFull.trim(),
    client_fio_short: fioShortLastFirst(payload.client.fioFull),
    client_fio_initials: fioShortLastFirst(payload.client.fioFull),
    client_salutation: salutation,
    client_request_number: payload.client.requestNumber?.trim() || "",
    client_request_date: shortDateRu(payload.client.requestDate),
    client_request_reference: requestRef,
    // Отправитель / исполнитель / шапка / подписант
    sender_org: org.name,
    sender_org_short: org.shortName || org.name,
    company_header: org.headerText || "",
    sender_director: org.directorFio || "",
    signer_name: org.directorFio || "",
    signer_role: org.directorRole || "",
    signer_fio_short: org.directorFio ? fioShortLastFirst(org.directorFio) : "",
    // Для блока подписи справа: «А.В. Статов» (инициалы впереди).
    signer_display_name: signerDisplayName,
    executor_fio: executor?.fio || "",
    executor_phone: executor?.phone || "",
    executor_fio_short: executor ? fioShortLastFirst(executor.fio) : "",
    executor_fio_initials: executor ? fioShortLastFirst(executor.fio) : "",
    // Параметры услуги
    area_ha: formatHa(areaHaTotal),
    area_ha_with_unit: `${formatHa(areaHaTotal)} га`,
    area_sqm: formatInt(areaHaTotal * 10000),
    distance_km: payload.object?.distanceKm ? formatInt(payload.object.distanceKm) : "",
    distance_km_with_unit: payload.object?.distanceKm
      ? `${formatInt(payload.object.distanceKm)} км`
      : "",
    quantity_units: payload.object?.quantityUnits ? formatInt(payload.object.quantityUnits) : "",
    quantity_units_with_unit: payload.object?.quantityUnits
      ? `${formatInt(payload.object.quantityUnits)} шт.`
      : "",
    location,
    cadastral_cost_type:
      payload.mode === "tender" ? "для торгов" : "для прямого контракта",
    // АИС
    ais_licenses: String(aisLicenses),
    ais_license_price: formatMoney(aisPrice),
    ais_total: formatMoney(calc.aisTotal),
    ais_license_price_in_words: rublesInWords(aisPrice),
    ais_total_in_words: rublesInWords(calc.aisTotal),
    ais_offer_text: aisOfferText,
    line_ais_offer: aisOfferText,
    // Пролонгация
    renewal_period: renewalYears ? countInWords(renewalYears, ["год", "года", "лет"]) : "",
    renewal_price_per_year: formatMoney(renewalPerYear),
    renewal_total: formatMoney(calc.renewalTotal),
    renewal_price_per_year_in_words: rublesInWords(renewalPerYear),
    renewal_total_in_words: rublesInWords(calc.renewalTotal),
    // Итоги
    total_cost: formatMoney(calc.grandTotal),
    total_cost_kopecks: String(Math.round((calc.grandTotal % 1) * 100)).padStart(2, "0"),
    total_cost_in_words: rublesInWords(calc.grandTotal),
    // НДС
    vat_rate: vatMode === "nds" ? "20%" : "0%",
    vat_amount: vatMode === "nds" ? formatMoney((calc.grandTotal * 20) / 120) : "0.00",
    vat_note: vatBlock,
    vat_block: vatBlock,
    // Оформление
    stamp: "",
    // Условные строки (для «ОПАСНЫХ» плейсхолдеров с удалением абзаца)
    line_service_area: payload.includes.service ? " " : "",
    line_service_distance: payload.object?.distanceKm ? " " : "",
    line_service_quantity: payload.object?.quantityUnits ? " " : "",
  };

  const table = buildTable(payload, calc);

  const filenameBase = `КП ${payload.client.orgShort?.trim() || payload.client.orgFull.trim()} ${org.shortName || org.name}`.trim();

  return { tags, calc, table, totalCost: calc.grandTotal, filenameBase };
}

function buildTable(payload: KpFormPayload, calc: KpCalcResult): KpTableData {
  const costHeader =
    payload.mode === "tender"
      ? "Стоимость, руб. (для торгов)"
      : "Стоимость, руб. (для прямого контракта)";
  const headers = ["№", "Наименование территории", "Кадастровый номер", "Площадь, Га", costHeader];
  const rows = calc.rows.map((r) => [
    String(r.index),
    r.name || "",
    r.cadastral || "",
    formatHa(r.areaHaResolved),
    formatMoney(r.cost),
  ]);
  const result: KpTableData = {
    headers,
    rows,
    totalLabel: "ВСЕГО",
    totalValue: formatMoney(calc.serviceTotal),
  };
  if (payload.includes.ais && calc.aisTotal > 0) {
    result.totalWithAisLabel = 'ВСЕГО с АИС «Единая среда»';
    result.totalWithAisValue = formatMoney(calc.serviceTotal + calc.aisTotal);
  }
  return result;
}
