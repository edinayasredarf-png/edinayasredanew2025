// Клиентский вычислитель формул (для живого превью итогов). Логика совпадает с
// серверным kpFormula.ts, но без "server-only" — можно использовать в браузере.

export type Scope = Record<string, number>;

type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'par'; v: '(' | ')' }
  | { t: 'comma' };

const FUNCS: Record<string, (a: number[]) => number> = {
  max: (a) => Math.max(...a),
  min: (a) => Math.min(...a),
  round: (a) => Math.round(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
  abs: (a) => Math.abs(a[0]),
  sqrt: (a) => Math.sqrt(a[0]),
  pow: (a) => Math.pow(a[0], a[1]),
};

function tokenize(s: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const src = s.trim();
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j++;
      toks.push({ t: 'num', v: parseFloat(src.slice(i, j)) }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      toks.push({ t: 'id', v: src.slice(i, j) }); i = j; continue;
    }
    if ('+-*/'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(' || c === ')') { toks.push({ t: 'par', v: c }); i++; continue; }
    if (c === ',') { toks.push({ t: 'comma' }); i++; continue; }
    throw new Error(`символ «${c}»`);
  }
  return toks;
}

function parse(toks: Tok[], scope: Scope): number {
  let p = 0;
  const peek = () => toks[p];
  function expr(): number {
    let v = term();
    let tk = peek();
    while (tk && tk.t === 'op' && (tk.v === '+' || tk.v === '-')) { p++; const r = term(); v = tk.v === '+' ? v + r : v - r; tk = peek(); }
    return v;
  }
  function term(): number {
    let v = factor();
    let tk = peek();
    while (tk && tk.t === 'op' && (tk.v === '*' || tk.v === '/')) { p++; const r = factor(); v = tk.v === '*' ? v * r : v / r; tk = peek(); }
    return v;
  }
  function factor(): number {
    const tk = peek();
    if (!tk) throw new Error('конец');
    if (tk.t === 'op' && tk.v === '-') { p++; return -factor(); }
    if (tk.t === 'op' && tk.v === '+') { p++; return factor(); }
    if (tk.t === 'num') { p++; return tk.v; }
    if (tk.t === 'par' && tk.v === '(') { p++; const v = expr(); const c = peek(); if (!c || c.t !== 'par' || c.v !== ')') throw new Error(')'); p++; return v; }
    if (tk.t === 'id') {
      p++;
      const next = peek();
      if (next && next.t === 'par' && next.v === '(') {
        p++;
        const args: number[] = [];
        if (!(peek()?.t === 'par' && (peek() as { v: string }).v === ')')) {
          args.push(expr());
          while (peek()?.t === 'comma') { p++; args.push(expr()); }
        }
        const c = peek(); if (!c || c.t !== 'par' || c.v !== ')') throw new Error(')'); p++;
        const fn = FUNCS[tk.v]; if (!fn) throw new Error(`функция ${tk.v}`);
        return fn(args);
      }
      if (!(tk.v in scope)) throw new Error(`переменная ${tk.v}`);
      return scope[tk.v];
    }
    throw new Error('разбор');
  }
  const v = expr();
  if (p < toks.length) throw new Error('лишние символы');
  return v;
}

export function evalFormulaSafe(expr: string, scope: Scope): number {
  try {
    const v = parse(tokenize(expr), scope);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

export function checkFormula(expr: string, scope: Scope): { ok: boolean; error?: string; result?: number } {
  try {
    const v = parse(tokenize(expr), scope);
    return { ok: true, result: Number.isFinite(v) ? v : 0 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const DEFAULT_ROW_FORMULA = 'max(area_ha, min_ha) * price';
