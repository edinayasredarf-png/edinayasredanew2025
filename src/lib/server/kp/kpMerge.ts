import "server-only";
import { parseFio, initials as fioInitials, detectGender, declineLast } from "../nameTransforms";
import {
  formatHa,
  formatInt,
  formatMoney,
  type KpIncludes,
  type PriceMode,
  type PriceTier,
} from "./kpCalc";
import { rublesInWords, countInWords } from "./kpNumberWords";
import { computeTable, type CalcColumn, type KpTableData } from "./kpTable";
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
    position?: string; // должность клиента (адресата)
    territory?: string; // территория/объект («города Луганск», «… общей площадью 6 Га»)
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
  /** Конфигурируемая таблица расчёта: колонки + ключ-алиас. */
  table: { key: string; name?: string; columns: CalcColumn[] };
  /** Строки таблицы: карта ключ_колонки → значение. */
  rows: Array<Record<string, string>>;
  ais?: { licenses: number; pricePerLicense: number };
  renewal?: { years: number; pricePerYear: number };
  vat?: { mode: "none" | "usn" | "nds"; rate?: number };
  /** Сельское поселение: цена АИС делится на 1,6. */
  ruralSettlement?: boolean;
}

/** Коэффициент удешевления АИС для сельского поселения. */
const RURAL_AIS_DIVISOR = 1.6;

interface KpCalcSummary {
  serviceTotal: number;
  aisTotal: number;
  renewalTotal: number;
  grandTotal: number;
}

export interface KpContext {
  tags: Record<string, string>;
  calc: KpCalcSummary;
  table: KpTableData;
  tableAlias: string;
  totalCost: number;
  filenameBase: string;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\s+/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
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

/** Короткое имя организации для имени файла: из кавычек или без правовой формы. */
export function deriveShortName(orgFull: string): string {
  const s = (orgFull || "").trim();
  if (!s) return "";
  const q = s.match(/[«"]([^»"]+)[»"]/);
  if (q?.[1]) return q[1].trim().slice(0, 60);
  const stripped = s.replace(
    /^(ООО|ОАО|ЗАО|ПАО|АО|НАО|ИП|МУП|ГУП|ФГУП|МКУ|МБУ|ГБУ|ФГБУ|Общество с ограниченной ответственностью|Индивидуальный предприниматель|Акционерное общество|Публичное акционерное общество)\s+/i,
    ""
  );
  return stripped.replace(/[«»"]/g, "").trim().slice(0, 60) || s.slice(0, 60);
}

/** «Иванову И.И.» — фамилия в дательном падеже + инициалы. */
export function fioShortDative(fio: string): string {
  const { last, first, middle } = parseFio(fio);
  const gender = detectGender(first, middle);
  const lastDat = declineLast(last, first, middle, gender, "dative");
  const ini = fioInitials(first, middle);
  return `${lastDat} ${ini}`.trim();
}

/**
 * Должность в дательном падеже. Склоняем только первое (главное) слово по
 * простым правилам мужского/женского рода, остальное («администрации …»)
 * остаётся как есть: «Глава администрации X» → «Главе администрации X».
 */
export function positionDative(position: string): string {
  const s = (position || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  parts[0] = declineHeadWord(parts[0]);
  return parts.join(" ");
}

function declineHeadWord(w: string): string {
  if (!w) return w;
  if (/[ая]$/i.test(w)) return w.slice(0, -1) + "е"; // Глава→Главе, Судья→Судье
  if (/[ьй]$/i.test(w)) return w.slice(0, -1) + "ю"; // Руководитель→Руководителю
  if (/[бвгдзклмнпрстфхцчшщ]$/i.test(w)) return w + "у"; // Директор→Директору, Мэр→Мэру
  return w;
}

/** Строит контекст для одной организации (тир + исполнитель заданы). */
export function buildKpContext(input: {
  payload: KpFormPayload;
  org: KpOrganization;
  executor: KpExecutor | null;
  tier: PriceTier;
  rowFormula?: string;
}): KpContext {
  const { payload, org, executor, tier } = input;

  const activePrice = payload.mode === "tender" ? tier.pricePerHaTender : tier.pricePerHaDirect;
  const ct = computeTable(payload.table?.columns || [], payload.rows || [], {
    price: toNum(activePrice),
    price_direct: toNum(tier.pricePerHaDirect),
    price_tender: toNum(tier.pricePerHaTender),
    min_ha: tier.minHectares ?? 1,
  });

  const areaHaTotal = deriveAreaHa(payload);
  const location = payload.object?.location?.trim() || deriveLocation(payload);

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

  // Готовая вступительная фраза: есть номер запроса → «В ответ на ваш запрос …»,
  // иначе → «Направляем для вас КП на».
  const requestIntro = payload.client.requestNumber?.trim()
    ? `В ответ на ваш запрос ${requestRef}`
    : "Направляем для вас КП на";

  const aisLicenses = payload.ais?.licenses ?? 0;
  // Сельское поселение — цена АИС делится на 1,6.
  const aisPriceRaw = payload.ais?.pricePerLicense ?? tier.aisPrice;
  const aisPrice = payload.ruralSettlement ? toNum(aisPriceRaw) / RURAL_AIS_DIVISOR : toNum(aisPriceRaw);
  const renewalYears = payload.renewal?.years ?? 0;
  const renewalPerYear = payload.renewal?.pricePerYear ?? tier.renewalPerYear;

  const serviceTotal = payload.includes.service ? ct.serviceTotal : 0;
  const aisTotal = payload.includes.ais ? toNum(aisLicenses) * toNum(aisPrice) : 0;
  const renewalTotal = payload.includes.renewal ? toNum(renewalYears) * toNum(renewalPerYear) : 0;
  const grandTotal = serviceTotal + aisTotal + renewalTotal;

  const aisOfferText = payload.includes.ais
    ? `Предлагаем внедрение АИС «Единая среда»: ${aisLicenses} лиценз${
        aisLicenses === 1 ? "ия" : "ий"
      } на сумму ${formatMoney(aisTotal)} руб. В стоимость включено обучение, внедрение, онбординг, настройка и сервис.`
    : "";

  const vatMode = payload.vat?.mode ?? "usn";
  const vatBlock =
    vatMode === "nds"
      ? `В том числе НДС 20% — ${formatMoney((grandTotal * 20) / 120)} руб.`
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
    client_org_short: payload.client.orgShort?.trim() || deriveShortName(payload.client.orgFull),
    client_fio_full: payload.client.fioFull.trim(),
    client_fio_short: fioShortLastFirst(payload.client.fioFull),
    client_fio_short_dative: fioShortDative(payload.client.fioFull),
    client_fio_initials: fioShortLastFirst(payload.client.fioFull),
    client_io: [first, middle].filter(Boolean).join(" "), // Имя Отчество
    client_greeting: `${salutation} ${[first, middle].filter(Boolean).join(" ")}!`, // «Уважаемый Иван Иванович!»
    territory: payload.client.territory?.trim() || "",
    client_position: payload.client.position?.trim() || "",
    client_position_dative: positionDative(payload.client.position || ""),
    client_salutation: salutation,
    client_request_number: payload.client.requestNumber?.trim() || "",
    client_request_date: shortDateRu(payload.client.requestDate),
    client_request_reference: requestRef,
    request_intro: requestIntro, // «В ответ на ваш запрос …» или «Направляем для вас КП на»
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
    ais_total: formatMoney(aisTotal),
    ais_license_price_in_words: rublesInWords(aisPrice),
    ais_total_in_words: rublesInWords(aisTotal),
    ais_offer_text: aisOfferText,
    line_ais_offer: aisOfferText,
    // Пролонгация
    renewal_period: renewalYears ? countInWords(renewalYears, ["год", "года", "лет"]) : "",
    renewal_price_per_year: formatMoney(renewalPerYear),
    renewal_total: formatMoney(renewalTotal),
    renewal_price_per_year_in_words: rublesInWords(renewalPerYear),
    renewal_total_in_words: rublesInWords(renewalTotal),
    // Итоги
    total_cost: formatMoney(grandTotal),
    total_cost_kopecks: String(Math.round((grandTotal % 1) * 100)).padStart(2, "0"),
    total_cost_in_words: rublesInWords(grandTotal),
    // НДС
    vat_rate: vatMode === "nds" ? "20%" : "0%",
    vat_amount: vatMode === "nds" ? formatMoney((grandTotal * 20) / 120) : "0.00",
    vat_note: vatBlock,
    vat_block: vatBlock,
    // Оформление
    stamp: "",
    // Условные строки (для «ОПАСНЫХ» плейсхолдеров с удалением абзаца)
    line_service_area: payload.includes.service ? " " : "",
    line_service_distance: payload.object?.distanceKm ? " " : "",
    line_service_quantity: payload.object?.quantityUnits ? " " : "",
  };

  // Строка «ВСЕГО с АИС» в подвале таблицы (под колонкой стоимости).
  const table = ct.data;
  if (payload.includes.ais && aisTotal > 0 && ct.costColIndex >= 0) {
    table.footers.push(
      table.headers.map((_, ci) =>
        ci === 0
          ? 'ВСЕГО с АИС «Единая среда»'
          : ci === ct.costColIndex
            ? formatMoney(serviceTotal + aisTotal)
            : ""
      )
    );
  }

  const filenameBase = `КП ${payload.client.orgShort?.trim() || deriveShortName(payload.client.orgFull)} ${org.shortName || org.name}`.trim();

  return {
    tags,
    calc: { serviceTotal, aisTotal, renewalTotal, grandTotal },
    table,
    tableAlias: payload.table?.key || "",
    totalCost: grandTotal,
    filenameBase,
  };
}

/** Суммарная площадь в гектарах из строк таблицы (колонки area_ha или area_sqm). */
function deriveAreaHa(payload: KpFormPayload): number {
  const cols = payload.table?.columns || [];
  const hasHa = cols.some((c) => c.key === "area_ha");
  const hasSqm = cols.some((c) => c.key === "area_sqm");
  if (!hasHa && !hasSqm) return 0;
  let sum = 0;
  for (const r of payload.rows || []) {
    sum += hasHa ? toNum(r.area_ha) : toNum(r.area_sqm) / 10000;
  }
  return sum;
}

/** Местоположение из строк (колонка location или name или первая текстовая). */
function deriveLocation(payload: KpFormPayload): string {
  const cols = payload.table?.columns || [];
  const col =
    cols.find((c) => c.key === "location") ||
    cols.find((c) => c.key === "name") ||
    cols.find((c) => c.kind === "text");
  if (!col) return "";
  return (payload.rows || [])
    .map((r) => r[col.key])
    .filter(Boolean)
    .join(", ");
}
