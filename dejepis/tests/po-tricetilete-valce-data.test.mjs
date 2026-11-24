// Guards the data contract: pages look answers up by exact string or id,
// so a typo silently breaks a game or a hint.
// Run: node --test dejepis/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const data = JSON.parse(load('po-tricetilete-valce-questions.json'));

test('every question has unique answers and a reason for each wrong one', () => {
  assert.equal(new Set(data.otazky.map(q => q.id)).size, data.otazky.length);
  for (const q of data.otazky) {
    assert.equal(q.spatne_odpovedi.length, 3, q.id);
    assert.equal(new Set([q.spravna_odpoved, ...q.spatne_odpovedi]).size, 4, q.id);
    assert.deepEqual(Object.keys(q.proc_spatne).sort(), [...q.spatne_odpovedi].sort(), q.id);
    assert.ok(q.oduvodneni.trim(), q.id);
    assert.ok(['lehka', 'stredni', 'tezka'].includes(q.obtiznost), q.id);
  }
});

test('sorting games only point at buckets that exist and none is empty', () => {
  for (const key of ['staty', 'truny', 'hlasy', 'umeni']) {
    const game = data.hry[key];
    const ids = game.kose.map(k => k.id);
    game.polozky.forEach(p => p.kos.forEach(id => assert.ok(ids.includes(id), `${key}: ${id}`)));
    ids.forEach(id => assert.ok(game.polozky.some(p => p.kos.includes(id)), `${key}: empty ${id}`));
  }
});

test('pairs, choices and timeline are unambiguous', () => {
  for (const key of ['roky', 'vztahy']) {
    for (const side of ['a', 'b']) {
      const values = data.hry[key].pary.map(p => p[side]);
      assert.equal(new Set(values).size, values.length, `${key}.${side}`);
    }
  }
  for (const round of [...data.hry.masky.kolo, ...data.hry.obrazy.kolo]) {
    assert.equal(new Set([round.spravne, ...round.spatne]).size, 4, round.art);
  }
  data.hry.masky.kolo.forEach(r => assert.ok(data.hry.masky.staty.includes(r.stat), r.art));
  for (const { id } of data.hry.primky.staty) {
    const reigns = data.hry.primky.vlady.filter(v => v.stat === id).sort((a, b) => a.od - b.od);
    assert.ok(reigns.length, id);
    reigns.slice(1).forEach((r, i) => assert.ok(r.od >= reigns[i].do, r.jmeno));
  }
});
