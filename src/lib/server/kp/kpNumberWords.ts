import "server-only";

/*
 * Число прописью на русском (для «сумма прописью»). Учитывает род (тысячи —
 * женский род), склонение единиц измерения (рубль/рубля/рублей и т.д.).
 */

const ONES = [
  "",
  "один",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
];
const ONES_F = [
  "",
  "одна",
  "две",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
];
const TEENS = [
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать",
];
const TENS = [
  "",
  "",
  "двадцать",
  "тридцать",
  "сорок",
  "пятьдесят",
  "шестьдесят",
  "семьдесят",
  "восемьдесят",
  "девяносто",
];
const HUNDREDS = [
  "",
  "сто",
  "двести",
  "триста",
  "четыреста",
  "пятьсот",
  "шестьсот",
  "семьсот",
  "восемьсот",
  "девятьсот",
];

/** Склонение по числу: [1, 2-4, 5+]. */
export type PluralForms = [string, string, string];

export function plural(n: number, forms: PluralForms): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function tripletWords(num: number, female: boolean): string {
  const out: string[] = [];
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const o = num % 10;
  if (h) out.push(HUNDREDS[h]);
  if (t > 1) {
    out.push(TENS[t]);
    if (o) out.push((female ? ONES_F : ONES)[o]);
  } else if (t === 1) {
    out.push(TEENS[o]);
  } else if (o) {
    out.push((female ? ONES_F : ONES)[o]);
  }
  return out.join(" ");
}

const SCALES: Array<{ female: boolean; forms: PluralForms }> = [
  { female: false, forms: ["", "", ""] }, // единицы (склоняются валютой отдельно)
  { female: true, forms: ["тысяча", "тысячи", "тысяч"] },
  { female: false, forms: ["миллион", "миллиона", "миллионов"] },
  { female: false, forms: ["миллиард", "миллиарда", "миллиардов"] },
];

/** Целое число прописью. female — род последней (единичной) группы. */
export function intToWords(value: number, female = false): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return "ноль";
  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    const scale = SCALES[i] || SCALES[SCALES.length - 1];
    const isUnits = i === 0;
    const words = tripletWords(g, scale.female || (isUnits && female));
    parts.push(words);
    if (i > 0) parts.push(plural(g, scale.forms));
  }
  return parts.filter(Boolean).join(" ");
}

/** Сумма рублей прописью: «Пятьсот пятьдесят тысяч рублей 00 копеек». */
export function rublesInWords(amount: number): string {
  const rub = Math.floor(Math.abs(amount));
  const kop = Math.round((Math.abs(amount) - rub) * 100);
  const rubWords = intToWords(rub, false);
  const rubUnit = plural(rub, ["рубль", "рубля", "рублей"]);
  const kopStr = String(kop).padStart(2, "0");
  const kopUnit = plural(kop, ["копейка", "копейки", "копеек"]);
  const head = rubWords.charAt(0).toUpperCase() + rubWords.slice(1);
  return `${head} ${rubUnit} ${kopStr} ${kopUnit}`;
}

/** Число лет/лицензий прописью с единицей. */
export function countInWords(n: number, forms: PluralForms, female = false): string {
  return `${intToWords(n, female)} ${plural(n, forms)}`.trim();
}
