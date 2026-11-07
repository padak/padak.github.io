#!/usr/bin/env node
/*
 * Automated verification of a Brain Bench detective game (SKILL.md step 8).
 *
 * Run (from the repo root):
 *   node .claude/skills/brain-bench-case/verify_case.mjs brain-bench/<slug>/ [--out <dir>] [--no-doc-shots]
 *
 * Playwright is not a repo dependency (no package.json). It is resolved in this order:
 *   1. $PLAYWRIGHT_DIR (a directory that has node_modules/playwright)
 *   2. `playwright` resolvable from the current directory / this script
 *   3. a scratch install:  mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright
 *      (this script also looks in /tmp/pw and in $TMPDIR-style scratch dirs named "pw")
 *   4. the playwright bundled with the global @playwright/mcp package
 * If the browser build bundled with the found Playwright is not installed, the newest Chromium in
 * ~/Library/Caches/ms-playwright (or ~/.cache/ms-playwright) is used instead.
 *
 * Checks per viewport (375x812, 820x1180, 1180x820), each in a fresh browser context:
 *   - no console error, page error, failed request or HTTP >= 400 (images, case.json)
 *   - no horizontal scroll on the start screen, file list, suspects, notes and inside every document
 *   - every document in case.json opens, renders text, and all its <img> loaded (naturalWidth > 0)
 *   - reader mode hides timer / hints / accusation and still opens documents
 *   - one hint per track: penalty shown before reveal, nothing charged on ask, charged exactly once
 *   - a deliberately wrong accusation gives the "N wrong" message and charges the penalty
 *   - the correct accusation (base64 solution from case.json) shows the solved screen
 *   - give-up shows the solution without a score
 * Screenshots go to --out (default: a fresh temp dir). The solution is never printed.
 * Exit code 1 on any failure.
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- args ----------
const args = process.argv.slice(2);
let caseArg = null, outDir = null, docShots = true;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') outDir = args[++i];
  else if (args[i] === '--no-doc-shots') docShots = false;
  else if (!caseArg) caseArg = args[i];
}
if (!caseArg) { console.error('usage: verify_case.mjs brain-bench/<slug>/ [--out dir] [--no-doc-shots]'); process.exit(2); }
const caseDir = path.resolve(caseArg);
if (!fs.existsSync(path.join(caseDir, 'index.html')) || !fs.existsSync(path.join(caseDir, 'case.json'))) {
  console.error('index.html / case.json not found in ' + caseDir); process.exit(2);
}
outDir = path.resolve(outDir || fs.mkdtempSync(path.join(os.tmpdir(), 'bb-verify-')));
fs.mkdirSync(outDir, { recursive: true });

// ---------- playwright resolution ----------
async function loadPlaywright() {
  const cands = [];
  if (process.env.PLAYWRIGHT_DIR) cands.push(path.join(process.env.PLAYWRIGHT_DIR, 'node_modules', 'playwright'));
  cands.push('playwright');
  for (const d of ['/tmp/pw', path.join(os.tmpdir(), 'pw'), '/private/tmp/pw']) cands.push(path.join(d, 'node_modules', 'playwright'));
  // scratch dirs like <scratchpad>/pw
  try { if (process.env.CLAUDE_SCRATCHPAD) cands.push(path.join(process.env.CLAUDE_SCRATCHPAD, 'pw', 'node_modules', 'playwright')); } catch {}
  for (const root of ['/opt/homebrew/lib/node_modules', '/usr/local/lib/node_modules'])
    cands.push(path.join(root, '@playwright', 'mcp', 'node_modules', 'playwright'));
  const req = createRequire(path.join(process.cwd(), 'x.js'));
  const req2 = createRequire(import.meta.url);
  for (const c of cands) {
    for (const r of [req, req2]) {
      try { return r(c); } catch {}
    }
  }
  console.error('Playwright not found. Install it outside the repo: mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright && npx playwright install chromium; then set PLAYWRIGHT_DIR=/tmp/pw');
  process.exit(2);
}
const pw = await loadPlaywright();

async function launch() {
  try { return await pw.chromium.launch(); } catch (e) {
    // fall back to the newest cached Chromium
    const roots = [path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright')];
    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      const dirs = fs.readdirSync(root).filter(n => /^chromium-\d+$/.test(n)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1]);
      for (const d of dirs) {
        const base = path.join(root, d);
        const bins = [
          'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
          'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
          'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
          'chrome-linux/chrome', 'chrome-linux64/chrome',
        ].map(b => path.join(base, b)).filter(fs.existsSync);
        for (const executablePath of bins) {
          try { return await pw.chromium.launch({ executablePath }); } catch {}
        }
      }
    }
    throw e;
  }
}

// ---------- static server ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(caseDir, u);
  if (!f.startsWith(caseDir)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// ---------- case data (solution stays in memory only) ----------
const CASE = JSON.parse(fs.readFileSync(path.join(caseDir, 'case.json'), 'utf8'));
const SOL = JSON.parse(Buffer.from(CASE.solution, 'base64').toString('utf8'));
const DOCS = CASE.documents.map(d => d.id);
const QS = CASE.form.questions;
const PEN = CASE.form.wrongPenalty;

// ---------- reporting ----------
const results = []; // {vp, name, ok, detail}
let curVp = '';
function rec(name, ok, detail = '') {
  results.push({ vp: curVp, name, ok, detail });
  if (!ok) console.log(`  FAIL [${curVp}] ${name}${detail ? ' - ' + detail : ''}`);
}
async function guard(name, fn) {
  try { await fn(); } catch (e) { rec(name, false, 'exception: ' + String(e.message).split('\n')[0].slice(0, 200)); }
}

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '1180x820', width: 1180, height: 820 },
];

async function newPage(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, acceptDownloads: false });
  ctx.setDefaultTimeout(8000);
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 160)); });
  page.on('pageerror', e => problems.push('pageerror: ' + String(e.message).slice(0, 160)));
  page.on('requestfailed', r => problems.push('requestfailed: ' + r.url().replace(BASE, '/')));
  page.on('response', r => { if (r.status() >= 400) problems.push(`http ${r.status()}: ` + r.url().replace(BASE, '/')); });
  return { ctx, page, problems };
}

const shot = async (page, vp, name, full = false) => {
  const f = path.join(outDir, `${vp.name}-${name.replace(/[^\w.-]+/g, '_')}.png`);
  try { await page.screenshot({ path: f, fullPage: full }); } catch (e) { rec('screenshot ' + name, false, e.message.split('\n')[0]); }
};
const noHScroll = async (page, label) => {
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth,
    bw: document.body.scrollWidth,
    pane: (() => { const p = document.querySelector('#pane'); return p ? [p.scrollWidth, p.clientWidth] : null; })() }));
  const ok = m.sw <= m.iw && (!m.pane || m.pane[0] <= m.pane[1] + 1);
  rec('no horizontal scroll: ' + label, ok, ok ? '' : `scrollWidth ${m.sw} > innerWidth ${m.iw}` + (m.pane ? `, pane ${m.pane[0]}/${m.pane[1]}` : ''));
};
// loading="lazy" images in hidden tabs never start loading: force eager so they are really checked.
const settle = page => page.evaluate(() => Promise.all(Array.from(document.images).map(img => { img.loading = 'eager'; return img.complete ? 0 :
  new Promise(r => { img.addEventListener('load', r); img.addEventListener('error', r); setTimeout(r, 5000); }); })));

async function checkImages(page, label) {
  await settle(page);
  const bad = await page.evaluate(() => Array.from(document.images).filter(i => !i.naturalWidth).map(i => (i.getAttribute('src') || '').slice(0, 80)));
  rec('images loaded: ' + label, bad.length === 0, bad.join(', '));
}

// Open a document from the list (works for the split phone layout and the wide layout).
async function openDocFromList(page, id) {
  await page.locator(`#tab-docs [data-open="${id}"]`).click();
  await page.waitForFunction(() => document.querySelector('#pane #docTitle'), null, { timeout: 5000 });
}
async function backToList(page) {
  const b = page.locator('#pane [data-back]');
  if (await b.isVisible().catch(() => false)) await b.click();
  await page.waitForFunction(() => !document.body.classList.contains('viewdoc') || window.innerWidth >= 960, null, { timeout: 5000 });
}

// ---------- scenarios ----------
async function startScreen(page, vp, problems) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('#start:not([hidden])', { timeout: 8000 });
  await checkImages(page, 'start screen');
  await noHScroll(page, 'start screen');
  await shot(page, vp, '01-start', true);
}

async function gameFlow(browser, vp) {
  const { ctx, page, problems } = await newPage(browser, vp);
  try {
    await guard('start screen', () => startScreen(page, vp, problems));
    await page.click('#btnStartGame');
    await page.waitForSelector('#app:not([hidden])');
    await guard('file list', async () => {
      await noHScroll(page, 'file list');
      await shot(page, vp, '02-list', true);
    });
    // briefing + all documents
    const ids = ['brief', ...DOCS];
    let nOpened = 0;
    for (const id of ids) {
      await guard('open ' + id, async () => {
        if (id === 'brief') await page.locator('#tab-docs [data-open="brief"]').click();
        else await openDocFromList(page, id);
        await page.waitForSelector('#pane #docTitle');
        const len = await page.evaluate(() => (document.querySelector('#pane .docbody') || {}).innerText?.trim().length || 0);
        rec(`document ${id} renders text`, len > 20, `text length ${len}`);
        await checkImages(page, 'document ' + id);
        await noHScroll(page, 'document ' + id);
        if (docShots) await shot(page, vp, `doc-${id}`, vp.width < 960);
        nOpened++;
        if (id !== 'brief') {
          const read = await page.evaluate(i => !!document.querySelector(`#tab-docs [data-open="${i}"].read`), id);
          rec(`document ${id} marked read`, read);
        }
        await backToList(page);
      });
    }
    rec(`all ${ids.length} documents opened`, nOpened === ids.length, `${nOpened}/${ids.length}`);
    // suspects + notes tabs
    await guard('suspects tab', async () => {
      await page.click('.tabs [data-tab="suspects"]');
      await checkImages(page, 'suspects tab');
      await noHScroll(page, 'suspects tab');
      await shot(page, vp, '03-suspects', true);
    });
    await guard('notes tab', async () => {
      await page.click('.tabs [data-tab="notes"]');
      await page.fill('#notesField', 'test');
      await page.click('#tlAdd');
      await noHScroll(page, 'notes tab');
      await shot(page, vp, '04-notes', true);
      await page.click('.tabs [data-tab="docs"]');
    });

    // hints: one per track
    await guard('hints', async () => {
      await page.click('#btnHints');
      await page.waitForSelector('#dlgHints[open]');
      await noHScroll(page, 'hints dialog');
      await shot(page, vp, '05-hints');
      const penOf = async () => page.evaluate(() => { const p = document.querySelector('#clock .pen'); return p ? +(p.textContent.match(/\d+/) || [0])[0] : 0; });
      let expected = 0;
      for (const tr of CASE.hints) {
        const pen = tr.steps[0].penalty;
        const ask = page.locator(`[data-hint-ask="${tr.id}"]`);
        const label = await ask.innerText();
        rec(`hint ${tr.id}: penalty shown on ask button`, label.includes('+' + pen), '');
        const before = await penOf();
        await ask.click();
        const confirmTxt = await page.locator('.confirmline').innerText();
        rec(`hint ${tr.id}: confirmation shows penalty`, confirmTxt.includes('+' + pen));
        rec(`hint ${tr.id}: not charged before confirming`, (await penOf()) === before);
        // cancel keeps it uncharged
        await page.click('[data-hint-no]');
        rec(`hint ${tr.id}: cancel charges nothing`, (await penOf()) === before);
        await page.locator(`[data-hint-ask="${tr.id}"]`).click();
        await page.locator(`[data-hint-yes="${tr.id}"]`).click();
        expected += pen;
        const shown = await page.locator('#hintTracks').innerText();
        rec(`hint ${tr.id}: text revealed`, shown.includes(tr.steps[0].text.slice(0, 25)));
        rec(`hint ${tr.id}: charged exactly once`, (await penOf()) === before + pen, `expected +${pen}`);
        // a second reveal must require another confirmation (no accidental double charge)
        if (tr.steps.length > 1) {
          const again = await page.locator(`[data-hint-yes="${tr.id}"]`).count();
          rec(`hint ${tr.id}: next step needs a new confirmation`, again === 0);
        }
      }
      const total = await page.locator('#hintTotal').innerText();
      rec('hint total equals sum of revealed penalties', total.includes('+' + expected), `expected +${expected}`);
      await page.click('#dlgHints [data-close]');
      page._hintMin = expected;
    });

    // wrong accusation
    await guard('wrong accusation', async () => {
      await page.click('#btnAccuse');
      await page.waitForSelector('#dlgAccuse[open]');
      await noHScroll(page, 'accusation dialog');
      const nWrong = await fillForm(page, 'wrong');
      await shot(page, vp, '06-accuse-filled');
      await page.click('#accForm [type="submit"]');
      const fb = (await page.locator('#accFeedback').innerText()).trim();
      const m = fb.match(/špatn\S*[^0-9]*(\d+)/i);
      rec('wrong accusation reports N wrong', !!m && +m[1] === nWrong, m ? `reported ${m[1]}, made ${nWrong}` : 'no count in feedback');
      rec('wrong accusation shows penalty', fb.includes('+' + PEN));
      const pen = await page.evaluate(() => { const p = document.querySelector('#clock .pen'); return p ? +(p.textContent.match(/\d+/) || [0])[0] : 0; });
      rec('wrong accusation charged once on the clock', pen === (page._hintMin || 0) + PEN, `clock +${pen}, expected +${(page._hintMin || 0) + PEN}`);
      await shot(page, vp, '07-accuse-wrong');
      // correct
      await fillForm(page, 'right');
      await page.click('#accForm [type="submit"]');
      await page.waitForSelector('#dlgResult[open]', { timeout: 5000 });
      const head = (await page.locator('#rH').innerText()).trim();
      const hasFinal = await page.locator('#resultBody .final').count();
      rec('correct accusation shows solved screen', /uzavřen/i.test(head) && hasFinal > 0, 'heading: ' + head);
      const solved = await page.locator('#resultBody').innerText();
      rec('solved screen has solution text', solved.length > 200);
      await noHScroll(page, 'result dialog');
      await shot(page, vp, '08-solved');
    });
    rec('no console errors / failed requests (game flow)', problems.length === 0, problems.slice(0, 5).join(' | '));
  } finally { await ctx.close(); }
}

// Fills the accusation form. mode 'wrong': every question answered incorrectly; returns number of wrong questions.
async function fillForm(page, mode) {
  let wrong = 0;
  for (const q of QS) {
    const sol = SOL[q.id];
    if (q.multi) {
      const solSet = new Set(sol);
      let pick;
      if (mode === 'right') pick = sol;
      else {
        const others = q.options.filter(o => !solSet.has(o));
        pick = others.slice(0, q.multi);
        // not enough non-solution options: swap just one
        if (pick.length < q.multi) pick = [...sol.slice(0, q.multi - 1), ...others.slice(0, 1)].slice(0, q.multi);
        wrong++;
      }
      // uncheck everything first (the draft may be restored), then check the picks
      for (const o of q.options) {
        const box = page.locator(`#accQuestions input[type=checkbox][name="${q.id}"][value="${o}"]`);
        if (await box.isChecked() && !pick.includes(o)) await box.uncheck({ force: true });
      }
      for (const o of pick) {
        const box = page.locator(`#accQuestions input[type=checkbox][name="${q.id}"][value="${o}"]`);
        if (!(await box.isChecked())) await box.check({ force: true });
      }
    } else {
      const val = mode === 'right' ? sol : q.options.find(o => o !== sol);
      if (mode !== 'right') wrong++;
      await page.locator(`#accQuestions input[type=radio][name="${q.id}"][value="${val}"]`).check({ force: true });
    }
  }
  return wrong;
}

async function readerFlow(browser, vp) {
  const { ctx, page, problems } = await newPage(browser, vp);
  try {
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForSelector('#start:not([hidden])');
    await page.click('#btnStartReader');
    await page.waitForSelector('#app:not([hidden])');
    const vis = async s => page.locator(s).isVisible().catch(() => false);
    rec('reader mode: timer hidden', !(await vis('#clock')));
    rec('reader mode: hints hidden', !(await vis('#btnHints')));
    rec('reader mode: accusation hidden', !(await vis('#btnAccuse')));
    await shot(page, vp, 'reader-list', true);
    await guard('reader opens a document', async () => {
      await openDocFromList(page, DOCS[0]);
      const len = await page.evaluate(() => (document.querySelector('#pane .docbody') || {}).innerText?.length || 0);
      rec('reader mode: document renders', len > 20);
      await noHScroll(page, 'reader document');
      await shot(page, vp, 'reader-doc');
      await backToList(page);
    });
    await page.click('#btnMenu');
    await page.click('#mEndReader');
    await page.waitForSelector('#start:not([hidden])');
    rec('reader mode: can return to start', true);
    rec('no console errors / failed requests (reader)', problems.length === 0, problems.slice(0, 5).join(' | '));
  } finally { await ctx.close(); }
}

async function giveUpFlow(browser, vp) {
  const { ctx, page, problems } = await newPage(browser, vp);
  try {
    page.on('dialog', d => d.accept());
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForSelector('#start:not([hidden])');
    await page.click('#btnStartGame');
    await page.click('#btnAccuse');
    await page.click('#btnGiveUp');
    await page.waitForSelector('#dlgResult[open]', { timeout: 5000 });
    const head = (await page.locator('#rH').innerText()).trim();
    rec('give-up shows solution without score', /bez hodnocení/i.test(head) && (await page.locator('#resultBody .final').count()) === 0, 'heading: ' + head);
    await shot(page, vp, '09-giveup');
    rec('no console errors / failed requests (give-up)', problems.length === 0, problems.slice(0, 5).join(' | '));
  } finally { await ctx.close(); }
}

// ---------- main ----------
let browser;
try {
  browser = await launch();
  for (const vp of VIEWPORTS) {
    curVp = vp.name;
    console.log(`viewport ${vp.name} ...`);
    await guard('game flow', () => gameFlow(browser, vp));
    await guard('reader flow', () => readerFlow(browser, vp));
    await guard('give-up flow', () => giveUpFlow(browser, vp));
  }
} finally {
  if (browser) await browser.close();
  server.close();
}

// ---------- summary ----------
const fails = results.filter(r => !r.ok);
console.log('');
for (const vp of VIEWPORTS) {
  const r = results.filter(x => x.vp === vp.name);
  const f = r.filter(x => !x.ok).length;
  console.log(`${f ? 'FAIL' : 'PASS'}  ${vp.name}: ${r.length - f}/${r.length} checks passed`);
}
console.log(`documents in case.json: ${DOCS.length}, hint tracks: ${CASE.hints.length}, accusation questions: ${QS.length}`);
console.log(`screenshots: ${outDir}`);
console.log(fails.length ? `RESULT: FAIL (${fails.length} failed checks)` : `RESULT: PASS (${results.length} checks)`);
process.exit(fails.length ? 1 : 0);
