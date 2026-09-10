import "server-only";

/*
 * Безопасный вычислитель формул стоимости (без eval). Рекурсивный спуск:
 * поддерживает + - * / , скобки, унарный минус, переменные и функции
 * max/min/round/floor/ceil/abs/sqrt/pow. Используется для настраиваемых
 * формул стоимости услуги (по площади / по штукам / по км …).
 *
 * Доступные переменные (scope) задаёт вызывающий код: area_ha, area_sqm,
 * quantity, distance_km, price, price_direct, price_tender, min_ha.
 */

export type Scope = Record<string, number>;

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "par"; v: "(" | ")" }
  | { t: "comma" };

const FUNCS: Record<string, (args: number[]) => number> = {
  max: (a) => Math.max(...a),
  min: (a) => Math.min(...a),
  round: (a) => Math.round(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
  abs: (a) => Math.abs(a[0]),
  sqrt: (a) => Math.sqrt(a[0]),
  pow: (a) => Math.pow(a[0], a[1]),
};

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const s = src.trim();
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < s.length && ((s[j] >= "0" && s[j] <= "9") || s[j] === "." )) j++;
      toks.push({ t: "num", v: parseFloat(s.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++;
      toks.push({ t: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      toks.push({ t: "par", v: c });
      i++;
      continue;
    }
    if (c === ",") {
      toks.push({ t: "comma" });
      i++;
      continue;
    }
    throw new Error(`Недопустимый символ «${c}» в формуле`);
  }
  return toks;
}

class Parser {
  private p = 0;
  constructor(private toks: Tok[], private scope: Scope) {}

  parse(): number {
    const v = this.expr();
    if (this.p < this.toks.length) throw new Error("Лишние символы в формуле");
    return v;
  }
  private peek(): Tok | undefined {
    return this.toks[this.p];
  }
  private expr(): number {
    let v = this.term();
    let tk = this.peek();
    while (tk && tk.t === "op" && (tk.v === "+" || tk.v === "-")) {
      this.p++;
      const r = this.term();
      v = tk.v === "+" ? v + r : v - r;
      tk = this.peek();
    }
    return v;
  }
  private term(): number {
    let v = this.factor();
    let tk = this.peek();
    while (tk && tk.t === "op" && (tk.v === "*" || tk.v === "/")) {
      this.p++;
      const r = this.factor();
      v = tk.v === "*" ? v * r : v / r;
      tk = this.peek();
    }
    return v;
  }
  private factor(): number {
    const tk = this.peek();
    if (!tk) throw new Error("Неожиданный конец формулы");
    if (tk.t === "op" && tk.v === "-") {
      this.p++;
      return -this.factor();
    }
    if (tk.t === "op" && tk.v === "+") {
      this.p++;
      return this.factor();
    }
    if (tk.t === "num") {
      this.p++;
      return tk.v;
    }
    if (tk.t === "par" && tk.v === "(") {
      this.p++;
      const v = this.expr();
      const close = this.peek();
      if (!close || close.t !== "par" || close.v !== ")") throw new Error("Нет закрывающей скобки");
      this.p++;
      return v;
    }
    if (tk.t === "id") {
      this.p++;
      const next = this.peek();
      if (next && next.t === "par" && next.v === "(") {
        // вызов функции
        this.p++;
        const args: number[] = [];
        if (!(this.peek()?.t === "par" && (this.peek() as { v: string }).v === ")")) {
          args.push(this.expr());
          while (this.peek()?.t === "comma") {
            this.p++;
            args.push(this.expr());
          }
        }
        const close = this.peek();
        if (!close || close.t !== "par" || close.v !== ")") throw new Error("Нет закрывающей скобки функции");
        this.p++;
        const fn = FUNCS[tk.v];
        if (!fn) throw new Error(`Неизвестная функция «${tk.v}»`);
        return fn(args);
      }
      // переменная
      if (!(tk.v in this.scope)) throw new Error(`Неизвестная переменная «${tk.v}»`);
      return this.scope[tk.v];
    }
    throw new Error("Ошибка разбора формулы");
  }
}

/** Вычисляет формулу; при ошибке бросает Error. */
export function evaluateFormula(expr: string, scope: Scope): number {
  const v = new Parser(tokenize(expr), scope).parse();
  return Number.isFinite(v) ? v : 0;
}

/** Безопасно вычисляет: при любой ошибке возвращает 0. */
export function evaluateFormulaSafe(expr: string, scope: Scope): number {
  try {
    return evaluateFormula(expr, scope);
  } catch {
    return 0;
  }
}

/** Проверяет формулу на тестовом scope. */
export function validateFormula(
  expr: string,
  sampleScope: Scope
): { ok: boolean; error?: string; result?: number } {
  try {
    const result = evaluateFormula(expr, sampleScope);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
