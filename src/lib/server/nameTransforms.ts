import "server-only";
import petrovich, { GrammCase, Gender } from "petrovich";

/**
 * Преобразования ФИО для именных писем — замена «табличных формул».
 * Пример: «Боровлёв Павел Михайлович» →
 *   обращение «Уважаемый», ИО «Павел Михайлович»,
 *   инициалы «П.М. Боровлёв», дат. падеж «П.М. Боровлёву».
 */

export interface RecipientComputed {
  last: string;
  first: string;
  middle: string;
  gender: Gender;
  address: string; // Уважаемый / Уважаемая
  io: string; // Имя Отчество
  initials: string; // «П.М. Боровлёв» (именительный)
  fioDative: string; // «П.М. Боровлёву» (инициалы + фамилия в дательном)
  positionShort: string;
}

export function parseFio(fio: string): { last: string; first: string; middle: string } {
  const parts = fio.trim().replace(/\s+/g, " ").split(" ");
  return {
    last: parts[0] || "",
    first: parts[1] || "",
    middle: parts.slice(2).join(" ") || "",
  };
}

export function detectGender(first: string, middle: string): Gender {
  if (/(вна|чна|нична)$/i.test(middle)) return "female";
  if (/(вич|ыч|ич)$/i.test(middle)) return "male";
  // запасной вариант — по имени (petrovich внутри тоже умеет)
  if (/(а|я)$/i.test(first) && !/(ья|иа|уа)$/i.test(first)) return "female";
  return "androgynous";
}

const cap = (s: string) => (s ? s[0].toUpperCase() : "");
export function initials(first: string, middle: string): string {
  const f = first ? `${cap(first)}.` : "";
  const m = middle ? `${cap(middle)}.` : "";
  return `${f}${m}`.trim();
}

/** Склоняет только фамилию в нужный падеж. */
export function declineLast(
  last: string,
  first: string,
  middle: string,
  gender: Gender,
  grammCase: GrammCase
): string {
  const res = petrovich({ last, first, middle, gender }, grammCase);
  return res.last || last;
}

/* ── Сокращение должности («Должность сокр») ──
 * Базовый словарь. Список легко расширяется/выносится в настройки.
 * Пример: «Главе Амурского муниципального района...» → «Главе Амурского м.р. ...».
 */
const POSITION_ABBR: Array<[RegExp, string]> = [
  [/муниципальн[а-яё]+ округ[а-яё]*/gi, "м.о."],
  [/муниципальн[а-яё]+ район[а-яё]*/gi, "м.р."],
  [/городск[а-яё]+ округ[а-яё]*/gi, "г.о."],
  [/городск[а-яё]+ поселени[а-яё]*/gi, "г.п."],
  [/сельск[а-яё]+ поселени[а-яё]*/gi, "с.п."],
  [/муниципальн[а-яё]+ образовани[а-яё]*/gi, "МО"],
];

export function abbreviatePosition(position: string): string {
  let out = position;
  for (const [re, short] of POSITION_ABBR) out = out.replace(re, short);
  return out.replace(/\s+/g, " ").trim();
}

export interface ComputeOptions {
  /** Падеж для «дательный падеж ФИО» (по умолчанию dative). */
  fioCase?: GrammCase;
}

export function computeRecipient(
  fio: string,
  position: string,
  opts: ComputeOptions = {}
): RecipientComputed {
  const { last, first, middle } = parseFio(fio);
  const gender = detectGender(first, middle);
  const ini = initials(first, middle);
  const lastCased = declineLast(last, first, middle, gender, opts.fioCase || "dative");

  return {
    last,
    first,
    middle,
    gender,
    address: gender === "female" ? "Уважаемая" : "Уважаемый",
    io: [first, middle].filter(Boolean).join(" "),
    initials: `${ini} ${last}`.trim(),
    fioDative: `${ini} ${lastCased}`.trim(),
    positionShort: abbreviatePosition(position),
  };
}
