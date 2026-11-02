import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solve, makeCalc, generateProblem, parseAnswer, formatNumber, checkStep, substances, substanceById,
  answerSentence, steps, zPrep, fieldsFor,
} from '../roztoky/generator.mjs';

const decimals = n => (String(n).split('.')[1] || '').length;

test('notebook examples compute exactly with the 1 % method', () => {
  assert.deepEqual(solve(200, 20), { total: 200, pct: 20, onePct: 2, solute: 40, water: 160 });
  assert.deepEqual(solve(350, 16), { total: 350, pct: 16, onePct: 3.5, solute: 56, water: 294 });
  assert.deepEqual([250, 200, 100].map(t => { const r = solve(t, 8); return [r.water, r.solute]; }), [[230, 20], [184, 16], [92, 8]]);
  const salt = makeCalc('sul', 200, 20);
  assert.equal(answerSentence(salt), 'Připravím ho ze 160 g H₂O a 40 g NaCl.');
  assert.equal(steps(makeCalc('sul', 350, 16))[0].text, '1 % ze 350 g = 350 : 100 = 3,5 g');
  assert.equal(answerSentence(makeCalc('ocet', 250, 8)), '250 g octa = 230 g H₂O + 20 g kyseliny octové.');
});

test('generated problems respect substance bounds, add up and keep at most one decimal', () => {
  let prev = null;
  const kinds = new Set(), series = new Set(), decimalOnePct = new Set();
  for (let seed = 1; seed <= 3000; seed++) {
    const p = generateProblem(seed, prev);
    const s = substanceById(p.substanceId);
    assert.ok(p.pct >= s.min && p.pct <= s.max, `${s.id} ${p.pct}% out of bounds`);
    assert.ok(p.total >= 50 && p.total <= 500 && p.total % 10 === 0, `total ${p.total}`);
    assert.equal(Math.round((p.solute + p.water) * 10), p.total * 10, `seed ${seed}`);
    assert.ok(p.water > 0 && p.solute > 0);
    for (const v of [p.onePct, p.solute, p.water]) assert.ok(decimals(v) <= 1, `seed ${seed}: ${v}`);
    if (decimals(p.onePct) === 1) decimalOnePct.add(seed);
    kinds.add(p.kind); if (p.series) series.add(p.series);
    prev = p;
  }
  assert.deepEqual([...kinds].sort(), ['findError', 'full', 'water']);
  assert.deepEqual([...series].sort(), ['sameMass', 'samePct']);
  assert.ok(decimalOnePct.size > 100, 'some problems must have a decimal 1 %');
});

test('generator is deterministic for a seed', () => {
  const a = generateProblem(42), b = generateProblem(42);
  assert.equal(a.question, b.question);
  assert.deepEqual([a.total, a.pct, a.substanceId], [b.total, b.pct, b.substanceId]);
  assert.notEqual(JSON.stringify([1, 2, 3, 4, 5].map(s => generateProblem(s).question)), JSON.stringify([6, 7, 8, 9, 10].map(s => generateProblem(s).question)));
});

test('vinegar is always 8 % (as in the notebook) and every substance stays within its own range', () => {
  const vinegar = [];
  for (let seed = 1; seed <= 4000; seed++) { const p = generateProblem(seed); if (p.substanceId === 'ocet') vinegar.push(p.pct); }
  assert.ok(vinegar.length > 0 && vinegar.every(x => x === 8));
  assert.deepEqual(substances.map(s => [s.id, s.min, s.max]), [['sul', 1, 25], ['cukr', 5, 50], ['ocet', 8, 8], ['hypermangan', 1, 5], ['sirup', 5, 20]]);
});

test('parser accepts comma, dot, unit and spaces and rejects garbage', () => {
  for (const [input, value] of [['3,5', 3.5], ['3.5', 3.5], ['3,5 g', 3.5], [' 160g ', 160], ['1 000', 1000], ['0,5', 0.5], ['40 G', 40]]) assert.equal(parseAnswer(input), value, input);
  for (const bad of ['', 'abc', '3,5,5', '1e3', '-4', 'g', '3 kg', '½', '3..5', null, undefined]) assert.equal(parseAnswer(bad), null, String(bad));
  assert.equal(formatNumber(3.5), '3,5');
  assert.equal(formatNumber(160), '160');
  assert.equal(formatNumber(0.1 + 0.2), '0,3');
});

test('each typical mistake is classified (200 g of 20 % salt, 350 g of 16 %)', () => {
  const p = makeCalc('sul', 200, 20);
  const cases = [
    ['water', '200', 'forgotSubtract'], ['water', '240', 'addedInstead'], ['onePct', '20', 'tenTimesLarge'],
    ['solute', '20', 'percentAsGrams'], ['water', '180', 'percentAsGrams'], ['solute', '160', 'swapped'], ['water', '40', 'swapped'],
    ['solute', '400', 'tenTimesLarge'], ['water', '159', 'other'],
  ];
  for (const [field, input, mistake] of cases) {
    const r = checkStep(p, field, input);
    assert.equal(r.ok, false); assert.equal(r.mistake, mistake, `${field}=${input}`);
    assert.ok(r.message.length > 20);
  }
  const q = makeCalc('sul', 350, 16);
  assert.equal(checkStep(q, 'onePct', '35').mistake, 'tenTimesLarge');
  assert.equal(checkStep(q, 'onePct', '3.5 g').ok, true);
  assert.equal(checkStep(q, 'water', '406').mistake, 'addedInstead');
  assert.equal(checkStep(q, 'water', '294').ok, true);
  assert.equal(checkStep(q, 'check', '350').ok, true);
  assert.equal(checkStep(q, 'water', 'nevím').mistake, 'unreadable');
});

test('find-the-error items have exactly one correct option that matches the claim', () => {
  let found = 0;
  for (let seed = 1; seed <= 2000; seed++) {
    const p = generateProblem(seed);
    if (p.kind !== 'findError') continue;
    found++;
    assert.equal(p.options.filter(o => o.correct).length, 1);
    assert.equal(p.options.length, new Set(p.options.map(o => o.id)).size);
    const correct = p.options.find(o => o.correct).id;
    const fine = Math.round(p.claimSolute * 10) === Math.round(p.solute * 10) && Math.round(p.claimWater * 10) === Math.round(p.water * 10);
    assert.equal(correct === 'none', fine, `seed ${seed}`);
    assert.ok(p.claimSolute > 0 && p.claimWater > 0);
  }
  assert.ok(found > 300);
});

test('concept check, levels and Czech prepositions', () => {
  const p = makeCalc('sul', 200, 20);
  assert.equal(p.concept.options.filter(o => o.correct)[0].id, 'whole');
  assert.deepEqual(fieldsFor(p, 2), ['onePct', 'solute', 'water', 'check']);
  assert.deepEqual(fieldsFor(p, 3), ['solute', 'water']);
  assert.deepEqual(fieldsFor(makeCalc('ocet', 250, 8, 'water'), 3), ['water']);
  assert.deepEqual([160, 230, 294, 56, 40, 8, 350, 7, 3.5].map(zPrep), ['ze', 'z', 'z', 'z', 'ze', 'z', 'ze', 'ze', 'ze']);
});

test('answers are compared exactly, not after rounding', () => {
  const q = makeCalc('sul', 350, 16);
  assert.equal(checkStep(q, 'onePct', '3,54').ok, false);
  assert.equal(checkStep(q, 'onePct', '3,46').ok, false);
  assert.equal(checkStep(q, 'onePct', '3,50 g').ok, true);
  assert.equal(checkStep(makeCalc('hypermangan', 190, 3), 'water', '184,3').ok, true);
});

test('the check field never says "do not add" because the check is an addition', () => {
  const p = makeCalc('sul', 200, 20);
  const r = checkStep(p, 'check', '240');
  assert.equal(r.mistake, 'other');
  assert.doesNotMatch(r.message, /nesčítá/);
});

test('10x too small is told apart from 10x too large and shows the multiplication', () => {
  const p = makeCalc('sul', 200, 20);
  const small = checkStep(p, 'solute', '4');
  assert.equal(small.mistake, 'tenTimesSmall');
  assert.match(small.message, /1 % = 2 g\. Látka = 20 · 2 g = 40 g\./);
  assert.doesNotMatch(small.message, /ne deseti/);
  assert.equal(checkStep(p, 'onePct', '0,2').mistake, 'tenTimesSmall');
  assert.equal(checkStep(p, 'water', '196').mistake, 'tenTimesSmall');
  const large = checkStep(p, 'onePct', '20');
  assert.equal(large.mistake, 'tenTimesLarge');
  assert.match(large.message, /ne deseti/);
});

test('percent-as-grams feedback in the 1 % field talks about 1 %', () => {
  const r = checkStep(makeCalc('ocet', 100, 8), 'onePct', '8');
  assert.equal(r.mistake, 'percentAsGrams');
  assert.match(r.message, /Tady hledáme 1 %, ne 8 %\. 1 % ze 100 g = 100 : 100 = 1 g\./);
  assert.doesNotMatch(r.message, /neznamená/);
});

test('feminine šťáva and masculine roztok/ocet agree in feedback', () => {
  const juice = makeCalc('sirup', 200, 10);
  const jm = checkStep(juice, 'water', '200').message;
  assert.match(jm, /celé šťávy/); assert.match(jm, /její část/);
  assert.match(juice.concept.explain, /celé šťávy/);
  const salt = checkStep(makeCalc('sul', 200, 20), 'water', '200').message;
  assert.match(salt, /celého roztoku/); assert.match(salt, /jeho část/);
  assert.match(checkStep(makeCalc('ocet', 200, 8), 'water', '200').message, /celého octa/);
});

test('each level looks different from the first screen: only guided mode is gated by the concept check', async () => {
  const { conceptGate } = await import('../roztoky/generator.mjs');
  assert.equal(conceptGate(1, false), false);
  assert.equal(conceptGate(2, false), true);
  assert.equal(conceptGate(2, true), false);
  assert.equal(conceptGate(3, false), false);
});
