// Guards the Baroko data contract: the pages look answers up by exact string or
// id, so a typo here does not fail loudly, it silently breaks a game or a hint.
// Run: node --test dejepis/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(
  readFileSync(new URL('../baroko-questions.json', import.meta.url), 'utf8')
);

test('every question has one unique answer and a reason for each wrong one', () => {
  const ids = new Set();
  for (const q of data.otazky) {
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
    assert.equal(q.spatne_odpovedi.length, 3, q.id);
    assert.equal(new Set([q.spravna_odpoved, ...q.spatne_odpovedi]).size, 4, q.id);
    assert.deepEqual(
      Object.keys(q.proc_spatne).sort(),
      [...q.spatne_odpovedi].sort(),
      `${q.id} proc_spatne keys`
    );
    assert.ok(q.oduvodneni.trim(), q.id);
    assert.ok(['lehka', 'stredni', 'tezka'].includes(q.obtiznost), q.id);
  }
});

test('questions cover all sub-themes and all difficulty levels', () => {
  const themes = new Set(data.otazky.map(q => q.tema));
  assert.deepEqual([...themes], [
    'Baroko a společnost',
    'Život v baroku',
    'Móda a jídlo',
    'Architektura a výtvarné umění',
    'Literatura',
    'Hudba a divadlo',
    'Sovičky z učebnice'
  ]);
  for (const level of ['lehka', 'stredni', 'tezka']) {
    assert.ok(data.otazky.some(q => q.obtiznost === level), level);
  }
});

test('sorting games only point at buckets that exist', () => {
  for (const key of ['monarchie', 'vrstvy', 'tabule', 'tvurci']) {
    const game = data.hry[key];
    const buckets = new Set(game.kose.map(k => k.id));
    assert.equal(new Set(game.polozky.map(p => p.text)).size, game.polozky.length, key);
    for (const item of game.polozky) {
      assert.ok(item.kos.length > 0, item.text);
      item.kos.forEach(id => assert.ok(buckets.has(id), `${key}: ${item.text} -> ${id}`));
      assert.ok(item.proc.trim(), item.text);
    }
    for (const id of buckets) {
      assert.ok(game.polozky.some(p => p.kos.includes(id)), `${key}: empty bucket ${id}`);
    }
  }
});

test('remaining games have complete, unambiguous data', () => {
  const pairs = data.hry.nahrady.pary;
  assert.equal(new Set(pairs.map(p => p.nove)).size, pairs.length);
  assert.equal(data.hry.venkov.poradi.length, 4);
  assert.ok(data.hry.pravda.vyroky.some(v => v.pravda));
  assert.ok(data.hry.pravda.vyroky.some(v => !v.pravda));
  assert.equal(data.hry.brambora.casti.filter(c => c.jedle).length, 1);
  for (const list of [data.hry.odev.muz, data.hry.odev.zena, data.hry.kostel.body]) {
    assert.equal(new Set(list.map(b => b.id)).size, list.length);
  }
});
