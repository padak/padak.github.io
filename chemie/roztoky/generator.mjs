// Pure logic for the solution-composition trainer ("složení roztoku").
// Follows the teacher's 1 % method only: 1 % of the total, times the percentage = solute,
// total minus solute = water. Deliberately no w = m(solute)/m(solution) formula.
// All masses are computed in integer tenths of a gram so results never drift (3,5 g stays 3,5 g).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const intIn = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- numbers -------------------------------------------------------------

export function formatNumber(n) {
  const r = Math.round(n * 10) / 10;
  return (Object.is(r, -0) ? 0 : r).toString().replace('.', ',').replace('-', '−');
}
export const g = n => `${formatNumber(n)} g`;
const zg = n => `${zPrep(n)} ${g(n)}`;

// Accepts "3,5", "3.5", "3,5 g", " 160g ", "1 000". Returns a number or null.
export function parseAnswer(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  let s = String(input).trim().toLowerCase().replace(/[\s  ]+/g, '');
  s = s.replace(/g$/, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

// Exact comparison (3,54 is not 3,5); the epsilon only absorbs binary floating-point noise.
const same = (a, b) => Math.abs(a - b) < 1e-9;

// Czech preposition "z"/"ze" in front of a number as it is read aloud
// ("ze 160 g" = "ze sto šedesáti", "z 230 g" = "z dvou set třiceti").
export function zPrep(n) {
  const i = Math.floor(n);
  const zeWord = w => /^(s|z|š|ž|tř|čt)/.test(w);
  const words = ['nula', 'jedna', 'dva', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět', 'deset',
    'jedenáct', 'dvanáct', 'třináct', 'čtrnáct', 'patnáct', 'šestnáct', 'sedmnáct', 'osmnáct', 'devatenáct'];
  const tens = ['', '', 'dvacet', 'třicet', 'čtyřicet', 'padesát', 'šedesát', 'sedmdesát', 'osmdesát', 'devadesát'];
  const hundreds = ['', 'sto', 'dvě stě', 'tři sta', 'čtyři sta', 'pět set', 'šest set', 'sedm set', 'osm set', 'devět set'];
  let w;
  if (i >= 1000) w = 'tisíc';
  else if (i >= 100) w = hundreds[Math.floor(i / 100)];
  else if (i >= 20) w = tens[Math.floor(i / 10)];
  else w = words[i];
  return zeWord(w) ? 'ze' : 'z';
}

// --- substances ----------------------------------------------------------
// Bounds are realistic for each mixture; the generator never leaves them.

export const substances = [
  {
    id: 'sul', min: 1, max: 25, typical: [10, 20], solute: 'sůl', soluteGen: 'soli', label: 'NaCl', pronoun: 'ho',
    whole: 'roztok', wholeGen: 'roztoku',
    ask: (t, p) => `Jak připravím ${g(t)} ${p}% roztoku soli (NaCl)?`,
    askWater: (t, p) => `Kolik vody obsahuje ${g(t)} ${p}% roztoku soli?`,
  },
  {
    id: 'cukr', min: 5, max: 50, typical: [10, 25], solute: 'cukr', soluteGen: 'cukru', label: 'cukru', pronoun: 'ho',
    whole: 'roztok', wholeGen: 'roztoku',
    ask: (t, p) => `Jak připravím ${g(t)} ${p}% roztoku cukru?`,
    askWater: (t, p) => `Kolik vody obsahuje ${g(t)} ${p}% roztoku cukru?`,
  },
  {
    id: 'ocet', min: 8, max: 8, typical: [8], // the notebook defines vinegar as 8 % acetic acid, always
    solute: 'kyselina octová', soluteGen: 'kyseliny octové', label: 'kyseliny octové', pronoun: 'ho',
    whole: 'ocet', wholeGen: 'octa', vinegar: true,
    ask: (t, p) => `Ocet je ${p} % kyseliny octové a zbytek je voda. Kolik vody a kolik kyseliny octové je v ${g(t)} octa?`,
    askWater: (t, p) => `Ocet je ${p} % kyseliny octové a zbytek je voda. Kolik vody obsahuje ${g(t)} octa?`,
  },
  {
    id: 'hypermangan', min: 1, max: 5, typical: [1, 2], solute: 'hypermangan', soluteGen: 'hypermanganu', label: 'KMnO₄', pronoun: 'ho',
    whole: 'roztok', wholeGen: 'roztoku',
    ask: (t, p) => `Jak připravím ${g(t)} ${p}% roztoku hypermanganu (manganistanu draselného, KMnO₄)?`,
    askWater: (t, p) => `Kolik vody obsahuje ${g(t)} ${p}% roztoku hypermanganu (KMnO₄)?`,
  },
  {
    id: 'sirup', min: 5, max: 20, typical: [10, 20], solute: 'sirup', soluteGen: 'sirupu', label: 'sirupu', pronoun: 'ji',
    whole: 'šťáva', wholeGen: 'šťávy', feminine: true,
    ask: (t, p) => `Jak připravím ${g(t)} šťávy, ve které je ${p} % sirupu (zbytek je voda)?`,
    askWater: (t, p) => `Kolik vody obsahuje ${g(t)} šťávy, ve které je ${p} % sirupu?`,
  },
];
export const substanceById = id => substances.find(s => s.id === id);

// --- the 1 % method ------------------------------------------------------

export function solve(total, pct) {
  const totalT = Math.round(total * 10);
  const onePctT = totalT / 100; // total is a multiple of 10 g, so this is a whole number of tenths
  const soluteT = pct * onePctT;
  const waterT = totalT - soluteT;
  return { total, pct, onePct: onePctT / 10, solute: soluteT / 10, water: waterT / 10 };
}

export function steps(p) {
  const s = p.substance;
  return [
    { key: 'onePct', label: `1 % ${zg(p.total)}`, value: p.onePct, text: `1 % ${zg(p.total)} = ${formatNumber(p.total)} : 100 = ${g(p.onePct)}` },
    { key: 'solute', label: `${s.solute} (rozpuštěná látka) = ${p.pct} · ${g(p.onePct)}`, value: p.solute, text: `${p.pct} · ${g(p.onePct)} = ${g(p.solute)} (${s.solute} – rozpuštěná látka)` },
    { key: 'water', label: `voda (rozpouštědlo) = ${g(p.total)} − ${s.solute}`, value: p.water, text: `${g(p.total)} − ${g(p.solute)} = ${g(p.water)} (voda – rozpouštědlo)` },
  ];
}

export function answerSentence(p) {
  const s = p.substance;
  if (s.vinegar) return `${g(p.total)} octa = ${g(p.water)} H₂O + ${g(p.solute)} kyseliny octové.`;
  return `Připravím ${s.pronoun} ${zPrep(p.water)} ${g(p.water)} H₂O a ${g(p.solute)} ${s.label}.`;
}

export const checkLine = p => `Zkouška: ${g(p.solute)} + ${g(p.water)} = ${g(p.solute + p.water)} = ${wholeName(p.substance)} ✓`;
const wholeName = s => (s.whole === 'roztok' ? 'celý roztok' : s.whole === 'ocet' ? 'celý ocet' : 'celá šťáva');

// --- problem generation --------------------------------------------------

function randomTotal(rng) {
  // Half the time a multiple of 50 g, otherwise a multiple of 10 g (1 % then often has a decimal, like 350 g -> 3,5 g).
  return rng() < 0.5 ? 50 * intIn(rng, 1, 10) : 10 * intIn(rng, 5, 50);
}
function randomPct(rng, s) {
  return rng() < 0.35 ? pick(rng, s.typical) : intIn(rng, s.min, s.max);
}

function build(kind, s, total, pct, extra = {}) {
  return { kind, substance: s, substanceId: s.id, ...solve(total, pct), ...extra };
}

export function makeCalc(substanceId, total, pct, kind = 'full') {
  const s = substanceById(substanceId);
  const p = build(kind, s, total, pct);
  p.question = kind === 'water' ? s.askWater(total, pct) : s.ask(total, pct);
  p.concept = conceptCheck(p);
  return p;
}

// Concept check asked before calculating: what does the given mass weigh?
export function conceptCheck(p) {
  const s = p.substance;
  return {
    question: `Co váží ${g(p.total)}?`,
    options: [
      { id: 'whole', text: `${wholeName(s)} (voda i ${s.solute} dohromady)`, correct: true },
      { id: 'water', text: 'jen voda', correct: false },
      { id: 'solute', text: `jen ${s.solute}`, correct: false },
    ],
    explain: `${g(p.total)} je hmotnost ${s.feminine ? 'celé' : 'celého'} ${s.wholeGen} – rozpouštědla (vody) i rozpuštěné látky dohromady. Proto vodu nakonec spočítám odečtením: ${g(p.total)} − ${s.solute}.`,
  };
}

const mistakeOptions = {
  added: p => `Látka a voda musí dohromady dát přesně ${g(p.total)}. Voda se má odečíst: ${g(p.total)} − rozpuštěná látka.`,
  percentAsGrams: p => `Spletl si procenta s gramy: ${p.pct} % není ${p.pct} g. Nejdřív se počítá 1 %.`,
  swapped: p => `Prohodil látku a vodu: ${p.substance.soluteGen} má být jen ${p.pct} %, vody je víc.`,
  tenTimes: p => `1 % se počítá dělením stem, ne deseti: 1 % ${zg(p.total)} je ${g(p.onePct)}.`,
  none: () => 'Nic, je to správně.',
};

// "Najdi chybu" item: someone's claim, choose what is wrong with it.
function makeFindError(rng, s, total, pct) {
  const base = solve(total, pct);
  const claims = {
    added: [base.solute, total],
    percentAsGrams: [pct, total - pct],
    swapped: [base.water, base.solute],
    tenTimes: [base.onePct * 10 * pct, total - base.onePct * 10 * pct],
    none: [base.solute, base.water],
  };
  // Keep only wrong claims that are physically possible and actually differ from the truth.
  const variants = Object.keys(claims).filter(v => v === 'none' ||
    (claims[v][0] > 0 && claims[v][1] > 0 && !(same(claims[v][0], base.solute) && same(claims[v][1], base.water))));
  const type = pick(rng, variants);
  const [claimSolute, claimWater] = claims[type];
  const p = build('findError', s, total, pct, { claimSolute, claimWater, errorType: type });
  const wholePhrase = s.vinegar ? `${g(total)} ${pct}% octa` : s.whole === 'šťáva' ? `${g(total)} šťávy s ${pct} % sirupu` : `${g(total)} ${pct}% roztoku`;
  p.question = `Někdo smíchal ${g(claimSolute)} ${s.soluteGen} a ${g(claimWater)} vody a tvrdí, že má ${wholePhrase}. Co je špatně?`;
  const others = shuffle(rng, variants.filter(v => v !== type)).slice(0, 3);
  p.options = shuffle(rng, [type, ...others]).map(id => ({ id, text: mistakeOptions[id](p), correct: id === type }));
  p.explain = `Správně podle 1 %: ${steps(p).map(st => st.text).join('; ')}. ${type === 'none' ? 'Tvrzení sedí.' : `Tvrzení „${g(claimSolute)} látky a ${g(claimWater)} vody“ nesedí.`}`;
  return p;
}

// Next problem, deterministic for a given seed. `prev` (optional) enables the
// "same % different mass" and "same mass different %" series.
export function generateProblem(seed, prev = null) {
  const rng = mulberry32(seed);
  const roll = rng();
  if (prev && prev.kind !== 'findError' && roll < 0.2) {
    const s = prev.substance;
    if (roll < 0.1) {
      let total = prev.total;
      for (let i = 0; i < 10 && total === prev.total; i++) total = randomTotal(rng);
      const p = makeCalc(s.id, total, prev.pct, 'full');
      p.series = 'samePct';
      p.seriesNote = `Stejné procento (${prev.pct} %), jiná hmotnost než minule (${g(prev.total)}).`;
      return p;
    }
    // Vinegar has a fixed 8 %, so it falls back to the same-percentage series.
    if (s.min === s.max) return generateProblem(seed + 1, null);
    let pct = prev.pct;
    for (let i = 0; i < 10 && pct === prev.pct; i++) pct = intIn(rng, s.min, s.max);
    const p = makeCalc(s.id, prev.total, pct, 'full');
    p.series = 'sameMass';
    p.seriesNote = `Stejná hmotnost (${g(prev.total)}), jiné procento než minule (${prev.pct} %).`;
    return p;
  }
  const s = pick(rng, substances);
  const total = randomTotal(rng);
  const pct = randomPct(rng, s);
  if (roll < 0.35) return makeFindError(rng, s, total, pct);
  if (roll < 0.5) return makeCalc(s.id, total, pct, 'water');
  return makeCalc(s.id, total, pct, 'full');
}

// --- checking answers and classifying mistakes ---------------------------

// tenTimesLarge = divided by 10 instead of 100 (result 10x too big); tenTimesSmall = result 10x too small.
export const mistakeTypes = ['forgotSubtract', 'addedInstead', 'tenTimesLarge', 'tenTimesSmall', 'percentAsGrams', 'swapped'];

// Returns {ok, value, mistake, message}. `field` is onePct | solute | water | check.
export function checkStep(p, field, input) {
  const value = parseAnswer(input);
  if (value === null) return { ok: false, value: null, mistake: 'unreadable', message: 'Tomu číslu nerozumím. Napiš jen číslo, třeba 3,5 nebo 160 (jednotku g psát nemusíš).' };
  const target = field === 'check' ? p.total : p[field];
  if (same(value, target)) return { ok: true, value, mistake: null, message: 'Správně!' };
  const mistake = classify(p, field, value);
  return { ok: false, value, mistake, message: explainMistake(p, mistake, field) };
}

export function classify(p, field, v) {
  const { total, pct, onePct, solute, water } = p;
  if (field === 'onePct') {
    if (same(v, onePct * 10)) return 'tenTimesLarge';
    if (same(v, onePct / 10)) return 'tenTimesSmall';
    if (same(v, pct)) return 'percentAsGrams';
    return 'other';
  }
  if (field === 'solute') {
    if (same(v, water)) return 'swapped';
    if (same(v, pct)) return 'percentAsGrams';
    if (same(v, solute * 10)) return 'tenTimesLarge';
    if (same(v, solute / 10)) return 'tenTimesSmall';
    return 'other';
  }
  if (field === 'water') {
    if (same(v, total)) return 'forgotSubtract';
    if (same(v, total + solute)) return 'addedInstead';
    if (same(v, solute)) return 'swapped';
    if (same(v, total - pct) || same(v, 100 - pct)) return 'percentAsGrams';
    if (same(v, total - solute / 10)) return 'tenTimesSmall';
    if (same(v, total - solute * 10)) return 'tenTimesLarge';
    return 'other';
  }
  // 'check' asks for látka + voda, so adding is right there: no subtraction diagnosis.
  return 'other';
}

export function explainMistake(p, mistake, field) {
  const s = p.substance;
  switch (mistake) {
    case 'forgotSubtract':
      return `To je hmotnost ${s.feminine ? 'celé' : 'celého'} ${s.wholeGen}. Voda je jen ${s.feminine ? 'její' : 'jeho'} část – musíš odečíst rozpuštěnou látku: ${g(p.total)} − ${g(p.solute)}.`;
    case 'addedInstead':
      return `Tady se nesčítá. ${s.solute[0].toUpperCase() + s.solute.slice(1)} už je v těch ${g(p.total)} obsažen${s.id === 'sul' || s.id === 'ocet' ? 'á' : 'ý'}, proto se odečítá: ${g(p.total)} − ${g(p.solute)}.`;
    case 'tenTimesLarge':
      return `Vyšlo ti to 10× víc. Pozor na 1 %: dělí se stem, ne deseti. 1 % ${zg(p.total)} = ${formatNumber(p.total)} : 100 = ${g(p.onePct)}.`;
    case 'tenTimesSmall': {
      const how = `1 % = ${g(p.onePct)}. Látka = ${p.pct} · ${g(p.onePct)} = ${g(p.solute)}.`;
      if (field === 'onePct') return `Vyšlo ti to 10× méně. 1 % ${zg(p.total)} = ${formatNumber(p.total)} : 100 = ${g(p.onePct)}.`;
      if (field === 'water') return `Látka ti vyšla 10× menší. ${how} Voda = ${g(p.total)} − ${g(p.solute)}.`;
      return `Vyšlo ti to 10× méně. ${how}`;
    }
    case 'percentAsGrams':
      if (field === 'onePct') return `Tady hledáme 1 %, ne ${p.pct} %. 1 % ${zg(p.total)} = ${formatNumber(p.total)} : 100 = ${g(p.onePct)}.`;
      return `Procenta nejsou gramy: ${p.pct} % neznamená ${p.pct} g. Nejdřív spočítej 1 % (${g(p.onePct)}) a vynásob ho ${p.pct}.`;
    case 'swapped':
      return `Prohodila jsi látku a vodu. ${s.solute[0].toUpperCase() + s.solute.slice(1)} je jen ${p.pct} %, voda je zbytek – té je víc.`;
    default: {
      const hints = {
        onePct: `1 % najdeš tak, že celou hmotnost vydělíš stem: ${formatNumber(p.total)} : 100.`,
        solute: `Vezmi 1 % (${g(p.onePct)}) a vynásob ho ${p.pct}.`,
        water: `Voda = ${wholeName(s)} − rozpuštěná látka.`,
        check: 'Sečti látku a vodu – musí vyjít celá hmotnost.',
      };
      return `Ještě ne. ${hints[field] || ''}`.trim();
    }
  }
}

// Fields asked at each scaffolding level (1 = worked example has no inputs).
// The "Co váží X g?" check belongs to the guided level only: the worked example
// already explains it and the independent level skips scaffolding. Gating every
// level behind it made the level switch look like it did nothing.
export const conceptGate = (level, conceptDone) => level === 2 && !conceptDone;

export function fieldsFor(p, level) {
  if (level === 2) return ['onePct', 'solute', 'water', 'check'];
  if (level === 3) return p.kind === 'water' ? ['water'] : ['solute', 'water'];
  return [];
}
