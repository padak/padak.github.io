import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerse, normalizeWord } from '../basen/match.mjs';

test('normalizeWord ignores case, accents and punctuation', () => {
  assert.equal(normalizeWord('Mañana,'), 'manana');
  assert.equal(normalizeWord('está;'), 'esta');
  assert.equal(normalizeWord('¿Pájaros?'), 'pajaros');
});

test('a perfect recitation marks every word correct', () => {
  const r = compareVerse('roja como sangre está;', 'Roja como sangre esta');
  assert.deepEqual(r.words.map(w => w.ok), [true, true, true, true]);
  assert.equal(r.score, 1);
  assert.deepEqual(r.extra, []);
});

test('a missing word is marked wrong while the rest still match', () => {
  const r = compareVerse('el rocío no la toca', 'el rocío la toca');
  assert.deepEqual(r.words.map(w => [w.text, w.ok]), [
    ['el', true], ['rocío', true], ['no', false], ['la', true], ['toca', true],
  ]);
  assert.equal(r.score, 0.8);
});

test('a substituted word is wrong and the heard word is reported as extra', () => {
  const r = compareVerse('es dura como el coral,', 'es dura como el corral');
  assert.equal(r.words[4].ok, false);
  assert.deepEqual(r.extra, ['corral']);
});

test('the original punctuation is kept for display', () => {
  const r = compareVerse('porque se teme quemar.', 'porque se teme quemar');
  assert.equal(r.words[3].text, 'quemar.');
});

test('silence scores zero', () => {
  const r = compareVerse('abierta en el mediodía', '');
  assert.equal(r.score, 0);
  assert.ok(r.words.every(w => !w.ok));
});
