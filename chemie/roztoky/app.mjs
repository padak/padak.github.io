import { generateProblem, steps, answerSentence, checkLine, checkStep, fieldsFor, g } from './generator.mjs';

const $ = id => document.getElementById(id);
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const storageKey = 'chemie-roztoky-v1';

let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { saved = {}; }
const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify({ level, best: score.best })); } catch { /* storage blocked: keep going in memory */ } };

let level = [1, 2, 3].includes(saved.level) ? saved.level : 2;
const score = { solved: 0, streak: 0, best: Number.isInteger(saved.best) ? saved.best : 0 };
let seed = Math.floor(Date.now() % 1e9);
let calcCount = 0;
let problem, st;

const fieldLabel = (p, key) => {
  const map = Object.fromEntries(steps(p).map(s => [s.key, s.label]));
  if (key === 'check') return `Zkouška: ${p.substance.solute} + voda = ? (musí vyjít celá hmotnost)`;
  if (level === 3) return key === 'solute' ? `${p.substance.solute} (rozpuštěná látka)` : 'voda (rozpouštědlo)';
  return map[key];
};

function newProblem() {
  problem = generateProblem(seed++, problem);
  const isCalc = problem.kind !== 'findError';
  st = { conceptDone: !isCalc || calcCount % 4 !== 0, conceptWrong: null, conceptOk: false, revealed: 0, done: {}, msgs: {}, drafts: {}, mistakes: 0, finished: false, chosen: [] };
  if (isCalc) calcCount++;
  render();
}

function retry() {
  st = { ...st, revealed: 0, done: {}, msgs: {}, drafts: {}, finished: false, chosen: [] };
  render();
}

function finish() {
  if (st.finished) return;
  st.finished = true;
  if (st.counted || (level === 1 && problem.kind !== 'findError')) return;
  st.counted = true;
  score.solved++;
  score.streak = st.mistakes === 0 ? score.streak + 1 : 0;
  score.best = Math.max(score.best, score.streak);
  persist();
}

function renderScore() {
  $('score').innerHTML = `<span>Vyřešeno <b>${score.solved}</b></span><span>Bez chyby v řadě <b>${score.streak}</b></span><span>Nejlepší <b>${score.best}</b></span>`;
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.level) === level)));
}

function successBlock() {
  return `<div class="result"><p class="sentence">${esc(answerSentence(problem))}</p><p class="check">${esc(checkLine(problem))}</p></div>`;
}

function renderConcept() {
  const c = problem.concept;
  let html = `<div class="concept"><p class="mini">Nejdřív rychlá otázka</p><p class="q2">${esc(c.question)}</p><div class="choices">`;
  for (const o of c.options) {
    const cls = st.conceptOk && o.correct ? 'ok' : st.conceptWrong === o.id ? 'bad' : '';
    html += `<button type="button" class="choice ${cls}" data-concept="${o.id}" ${st.conceptOk ? 'disabled' : ''}>${esc(o.text)}</button>`;
  }
  html += '</div>';
  if (st.conceptWrong) html += `<p class="fb bad">Ne tak úplně. ${esc(c.explain)}</p>`;
  if (st.conceptOk) html += `<p class="fb ok">Ano! ${esc(c.explain)}</p><button type="button" class="primary" data-action="concept-continue">Počítat</button>`;
  return html + '</div>';
}

function renderFindError() {
  let html = '<div class="choices">';
  for (const o of problem.options) {
    const cls = st.finished && o.correct ? 'ok' : st.chosen.includes(o.id) ? 'bad' : '';
    html += `<button type="button" class="choice ${cls}" data-option="${o.id}" ${st.finished || st.chosen.includes(o.id) ? 'disabled' : ''}>${esc(o.text)}</button>`;
  }
  html += '</div>';
  if (st.finished) html += `<p class="fb ok">Správně! ${esc(problem.explain)}</p>`;
  else if (st.chosen.length) html += '<p class="fb bad">Tohle to není. Podívej se, kolik dávají látka a voda dohromady a jestli sedí 1 %. Zkus jinou možnost.</p>';
  return html;
}

function renderWorked() {
  const all = steps(problem);
  let html = '<ol class="worked">';
  all.slice(0, st.revealed).forEach((s, i) => { html += `<li><span class="num">${i + 1}</span>${esc(s.text)}</li>`; });
  html += '</ol>';
  if (st.revealed < all.length) html += `<button type="button" class="primary" data-action="reveal">${st.revealed ? 'Další krok' : 'Ukaž 1. krok'}</button>`;
  else { html += successBlock() + '<button type="button" class="primary" data-action="try-guided">Teď to zkusím sama</button>'; finish(); }
  return html;
}

function renderInputs() {
  const fields = fieldsFor(problem, level);
  let html = '';
  for (const key of fields) {
    const done = st.done[key] !== undefined;
    const msg = st.msgs[key];
    html += `<form class="field" data-field="${key}"><label for="in-${key}">${esc(fieldLabel(problem, key))}</label>
      <div class="row"><input id="in-${key}" name="v" inputmode="decimal" autocomplete="off" ${done ? `value="${esc(st.done[key])}" disabled` : `value="${esc(st.drafts[key] ?? '')}"`} aria-describedby="fb-${key}"><span class="unit">g</span>
      ${done ? '<span class="tick" aria-label="správně">✓</span>' : '<button type="submit" class="primary small">Zkontrolovat</button>'}</div>
      <p id="fb-${key}" class="fb ${msg ? (msg.ok ? 'ok' : 'bad') : ''}" aria-live="polite">${msg ? esc(msg.text) : ''}</p></form>`;
    if (!done && level === 2) break; // guided: one step at a time
  }
  if (fields.every(k => st.done[k] !== undefined)) { html += successBlock(); finish(); }
  return html;
}

function render() {
  renderScore();
  const p = problem;
  const isCalc = p.kind !== 'findError';
  const tag = !isCalc ? 'Najdi chybu' : p.kind === 'water' ? 'Jen voda' : 'Látka a voda';
  let html = `<p class="tag">${tag}${p.seriesNote ? ` · ${esc(p.seriesNote)}` : ''}</p><h2 class="question">${esc(p.question)}</h2>`;
  if (!isCalc) html += renderFindError();
  else if (!st.conceptDone) html += renderConcept();
  else if (level === 1) html += renderWorked();
  else html += renderInputs();
  $('card').innerHTML = html;
  $('retry').hidden = !isCalc || level === 1 || !st.conceptDone;
  renderScore();
  const firstInput = $('card').querySelector('input:not([disabled])');
  if (firstInput && document.activeElement?.tagName !== 'BUTTON') firstInput.focus({ preventScroll: true });
}

$('card').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.concept) {
    const o = problem.concept.options.find(x => x.id === b.dataset.concept);
    if (o.correct) { st.conceptOk = true; st.conceptWrong = null; } else { st.conceptWrong = o.id; st.mistakes++; }
    render();
  } else if (b.dataset.option) {
    const o = problem.options.find(x => x.id === b.dataset.option);
    if (o.correct) finish(); else { st.chosen.push(o.id); st.mistakes++; }
    render();
  } else if (b.dataset.action === 'concept-continue') { st.conceptDone = true; render(); }
  else if (b.dataset.action === 'reveal') { st.revealed++; render(); }
  else if (b.dataset.action === 'try-guided') { level = 2; persist(); st = { ...st, finished: false, done: {}, msgs: {}, mistakes: 0 }; render(); }
});

// Keep unsubmitted drafts so a re-render (after checking another field) does not wipe them.
$('card').addEventListener('input', e => {
  const form = e.target.closest('form[data-field]');
  if (form) st.drafts[form.dataset.field] = e.target.value;
});

$('card').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target.closest('form[data-field]');
  const key = form.dataset.field;
  const raw = form.elements.v.value;
  st.drafts[key] = raw;
  if (!raw.trim()) return;
  const r = checkStep(problem, key, raw);
  if (r.ok) { st.done[key] = raw.trim(); st.msgs[key] = { ok: true, text: key === 'check' ? `Sedí: ${g(problem.total)} je celá hmotnost.` : 'Správně!' }; }
  else { st.mistakes++; st.msgs[key] = { ok: false, text: r.message }; }
  render();
  if (!r.ok) { const i = $(`in-${key}`); if (i) { i.value = raw; i.select(); } }
});

document.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
  level = Number(b.dataset.level);
  persist();
  st = { ...st, revealed: 0, done: {}, msgs: {}, finished: false };
  render();
}));
$('next').addEventListener('click', newProblem);
$('retry').addEventListener('click', retry);

newProblem();
