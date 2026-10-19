// Small, bounded polynomial parser. Never evaluates JavaScript or student HTML.
const EPS = 1e-9;
const clean = p => Object.fromEntries(Object.entries(p).filter(([, v]) => Math.abs(v) > EPS));
export const add = (a, b, scale = 1) => {
  const out = { ...a };
  for (const [key, value] of Object.entries(b)) out[key] = (out[key] || 0) + value * scale;
  return clean(out);
};
export const multiply = (a, b) => {
  const out = {};
  if (Object.keys(a).length * Object.keys(b).length > 4096) throw new Error('Tento výraz je pro dílnu příliš rozsáhlý. Zkus kratší zápis.');
  for (const [ka, va] of Object.entries(a)) for (const [kb, vb] of Object.entries(b)) {
    const key = [...ka, ...kb].sort().join('');
    if (key.length > 12) throw new Error('Zkus kratší výraz s menšími mocninami.');
    out[key] = (out[key] || 0) + va * vb;
  }
  return clean(out);
};
function divide(a, b) {
  const entries = Object.entries(clean(b));
  if (entries.length !== 1) throw new Error('Tady dělíme pouze nenulovým jednočlenem.');
  const [den, coefficient] = entries[0];
  const out = {};
  for (const [key, value] of Object.entries(a)) {
    let rest = key;
    for (const letter of den) {
      if (!rest.includes(letter)) throw new Error('Po vydělení by proměnná zůstala ve jmenovateli. Zkontroluj výsledek.');
      rest = rest.replace(letter, '');
    }
    out[rest] = value / coefficient;
  }
  return clean(out);
}
export function normalize(text) {
  return text.trim().replace(/[−–]/g, '-').replace(/[·×⋅]/g, '*').replace(/[÷:]/g, '/').replace(/,/g, '.').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\s/g, '');
}
export function parse(text, restrictions = null) {
  const input = normalize(text);
  if (!input || input.length > 180) throw new Error('Napiš výsledek, třeba 2x + 3.');
  const tokens = input.match(/(?:\d+(?:\.\d+)?|\.\d+)|[a-z]|[+*/^()-]/g) || [];
  if (tokens.join('') !== input) throw new Error('Použij čísla, malá písmena, +, −, závorky nebo / pro zlomek.');
  let pos = 0;
  const isAtom = t => t !== undefined && (/^[a-z]$/.test(t) || /^(\d|\.)/.test(t) || t === '(');
  function atom() {
    const t = tokens[pos++];
    if (t === '(') {
      const p = sum();
      if (tokens[pos++] !== ')') throw new Error('Zkontroluj uzavření závorek.');
      return p;
    }
    if (/^[a-z]$/.test(t || '')) return { [t]: 1 };
    if (/^(\d|\.)/.test(t || '')) return { '': Number(t) };
    throw new Error('Za znaménko patří číslo, proměnná nebo závorka.');
  }
  function power() {
    let p = atom();
    if (tokens[pos] === '^') {
      pos++;
      const exp = Number(tokens[pos++]);
      if (!Number.isInteger(exp) || exp < 0 || exp > 6) throw new Error('Mocninu napiš jako x^2 (nejvýše šestou).');
      if (exp === 0 && (Object.keys(clean(p)).length !== 1 || !Object.hasOwn(p, '') || Math.abs(p['']) < EPS)) throw new Error('Nulté mocniny proměnných tu nepoužíváme: mohly by vyžadovat další podmínku.');
      const base = p; p = { '': 1 };
      for (let i = 0; i < exp; i++) p = multiply(p, base);
    }
    return p;
  }
  function unary() {
    if (tokens[pos] === '+') { pos++; return unary(); }
    if (tokens[pos] === '-') { pos++; return multiply({ '': -1 }, unary()); }
    return power();
  }
  function product() {
    let p = unary();
    while (tokens[pos] === '*' || tokens[pos] === '/' || isAtom(tokens[pos])) {
      const op = tokens[pos];
      if (op === '*' || op === '/') pos++;
      let q = unary();
      // Adjacent factors form the written monomial divisor: 12xy : 3y.
      if (op === '/') while (isAtom(tokens[pos])) q = multiply(q, unary());
      if (op === '/' && restrictions && Object.keys(q).some(key => key.length)) restrictions.variableDivisor = true;
      p = op === '/' ? divide(p, q) : multiply(p, q);
    }
    return p;
  }
  function sum() {
    let p = product();
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      const op = tokens[pos++];
      p = add(p, product(), op === '+' ? 1 : -1);
    }
    return p;
  }
  const result = clean(sum());
  if (pos !== tokens.length) throw new Error('Zkontroluj znaménka a závorky.');
  if (Object.values(result).some(v => !Number.isFinite(v) || Math.abs(v) > 1e12)) throw new Error('Zkus menší čísla.');
  return result;
}
export function equal(a, b) {
  return Object.keys(clean(add(a, b, -1))).length === 0;
}
export function number(n) { return Number(n.toFixed(8)).toLocaleString('cs-CZ', { maximumFractionDigits: 8, useGrouping: false }); }
export function monomial(key) {
  return [...new Set(key)].map(k => {
    const n = [...key].filter(c => c === k).length;
    return k + (n === 1 ? '' : n === 2 ? '²' : n === 3 ? '³' : `^${n}`);
  }).join('');
}
export function term(coefficient, key = '', signed = false) {
  if (Math.abs(coefficient) < EPS) return '0';
  return (coefficient < 0 ? '−' : signed ? '+' : '') + (key && Math.abs(coefficient) === 1 ? '' : number(Math.abs(coefficient))) + monomial(key);
}
export function format(p) {
  const entries = Object.entries(clean(p)).sort(([a], [b]) => b.length - a.length || a.localeCompare(b));
  return entries.length ? entries.map(([key, value], i) => term(value, key, i > 0)).join(' ').replace(/([+−])(?=\S)/g, '$1 ') .trim() : '0';
}
export function isCollected(text) {
  const input = normalize(text);
  if (/[()]/.test(input)) return false;
  const pieces = input.match(/[+-]?[^+-]+/g) || [];
  const seen = new Set();
  return pieces.every(piece => {
    const p = parse(piece), keys = Object.keys(p);
    if (keys.length === 0) return pieces.length === 1;
    if (keys.length !== 1 || seen.has(keys[0])) return false;
    seen.add(keys[0]); return true;
  });
}
export function checkAnswer(input, exercise, condition = '') {
  try {
    const restrictions = {};
    const p = parse(input, restrictions);
    if (restrictions.variableDivisor) return { ok: false, message: 'Výsledek zapiš bez proměnné ve jmenovateli. Krácení v odpovědi by mohlo přidat další podmínku.' };
    if (!equal(p, parse(exercise.answer))) {
      const known = (exercise.mistakes || []).find(m => equal(p, parse(m[0])));
      return { ok: false, message: known ? known[1] : exercise.hint };
    }
    if (exercise.factor) {
      const n = normalize(input);
      const match = n.match(/^([^()]+)\(([^()]+)\)$/);
      if (!match) return { ok: false, message: 'Hodnota sedí. Teď ji zapiš jako součin: společný činitel před závorkou a zbytek uvnitř.' };
      const prefix = match[1].replace(/\*$/, '');
      if (/[+-]/.test(prefix.replace(/^[+-]/, ''))) return { ok: false, message: 'Před závorkou má být jeden společný činitel. Další sčítání nebo odčítání nech uvnitř závorky.' };
      const f = parse(prefix);
      if (Object.keys(f).length !== 1 || equal(f, { '': 1 }) || equal(f, { '': -1 })) return { ok: false, message: 'Vytkni společný činitel různý od 1 a −1.' };
    } else if (!isCollected(input)) return { ok: false, message: 'Tohle má správnou hodnotu! Ještě odstraň závorky a sluč stejné členy.' };
    if (exercise.condition && condition !== exercise.condition) return { ok: false, message: 'Výsledek sedí. Ještě vyber podmínku: původní dělitel se nesmí rovnat nule.' };
    return { ok: true, message: exercise.why };
  } catch (error) { return { ok: false, message: error.message }; }
}
