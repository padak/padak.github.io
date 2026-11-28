// Shared poem trainer: verse-by-verse playback of pre-recorded audio, four levels of
// hidden text with tap-to-reveal, and a self-check "Umím to" that feeds a reward picture.
// A page calls startTrainer(config) — see es/cuando-se-abre.html for a full example.
//
// config = {
//   title, intro,                        // heading and one-paragraph intro (Czech)
//   stanzas: [[[es, cz], ...], ...],     // verses grouped by stanza, Spanish + Czech translation
//   stanzaNames: [...],                  // heading per stanza
//   store,                               // localStorage key for progress
//   audioDir,                            // folder with v01.mp3, v02.mp3, ... (one per verse)
//   reward: { label, draw(svg, mastered, total) },  // progress picture and its text equivalent
//   winTitle,                            // headline once every verse is known
// }

const ICON_PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg>';
const STAR = on => `<svg class="star" width="18" height="18" viewBox="0 0 24 24" aria-label="${on ? 'zvládnuto' : 'zatím ne'}"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" fill="${on ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="1.5"/></svg>`;

export function startTrainer(cfg) {
  const VERSES = cfg.stanzas.flatMap((s, si) => s.map(([es, cz]) => ({ es, cz, stanza: si })));
  const total = VERSES.length;

  document.getElementById('app').innerHTML = `
  <div class="card">
    <div class="top">
      <svg id="reward" viewBox="-50 -50 100 100" width="96" height="96" role="img" aria-label="${cfg.reward.label}"></svg>
      <div style="flex:1">
        <h1>${cfg.title}</h1>
        <p class="sub">${cfg.intro}</p>
        <div class="bar"><i id="barFill"></i></div>
        <p class="sub" id="progressText" style="margin-top:4px"></p>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="controls">
      <span class="label">Kolik textu vidíš</span>
      <div class="seg" id="levels">
        <button class="chip on" data-level="0">Celý text</button>
        <button class="chip" data-level="1">Díry</button>
        <button class="chip" data-level="2">První písmena</button>
        <button class="chip" data-level="3">Zpaměti</button>
      </div>
      <span class="label">Rychlost hlasu</span>
      <div class="seg" id="speeds">
        <button class="chip" data-rate="0.75">Pomalu</button>
        <button class="chip on" data-rate="1">Normálně</button>
      </div>
      <span class="label">Hlas: Sarah, ElevenLabs</span>
      <span class="label">Další</span>
      <div class="seg">
        <button class="chip" id="czToggle">Český překlad</button>
        <button class="big" id="playAll"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg><span>Přehrát celou</span></button>
      </div>
    </div>
    <details style="margin-top:10px">
      <summary>Jak na to</summary>
      <p><b>1. Poslouchej.</b> Klepni na „Poslechni“ u verše a opakuj po hlasu nahlas.</p>
      <p><b>2. Řekni to sama.</b> Řekni verš nahlas a pak si ho pusť znovu pro kontrolu.</p>
      <p><b>3. Schovávej text.</b> Přepni na „Díry“, pak „První písmena“ a nakonec „Zpaměti“. Na schované slovo můžeš klepnout a nakouknout.</p>
      <p>Když verš řekneš bez nakukování v režimu „Díry“ nebo těžším, klepni na „Umím to“ a obrázek nahoře se posune.</p>
    </details>
  </div>
  <div id="poem"></div>
  <div class="card win hidden" id="win">
    <h2>${cfg.winTitle}</h2>
    <p class="sub">Umíš všech ${total} veršů. Zkus teď celou básničku v režimu „Zpaměti“ bez nakukování.</p>
    <button class="chip" id="reset" style="margin-top:10px">Začít znovu</button>
  </div>`;

  let level = 0, rate = 1;
  let mastered = new Set(JSON.parse(localStorage.getItem(cfg.store) || '[]'));
  const revealed = new Set(); // "verse:word" keys the student peeked at
  const save = () => localStorage.setItem(cfg.store, JSON.stringify([...mastered]));

  // ---------- audio ----------
  // Pre-recorded verses (ElevenLabs "Sarah"): iPhone Safari only offers web pages its basic
  // built-in voices. One shared <audio> element: iOS allows later play() calls after the first tap.
  const player = new Audio();
  player.preload = 'auto';
  let finishCurrent = () => {};
  function say(i) {
    return new Promise(resolve => {
      finishCurrent = resolve;
      player.src = `${cfg.audioDir}/v${String(i + 1).padStart(2, '0')}.mp3`;
      player.playbackRate = rate; player.preservesPitch = true;
      player.onended = player.onerror = () => resolve();
      player.play().catch(() => resolve());
    });
  }
  let playToken = 0;
  async function playVerses(list) {
    const token = ++playToken;
    player.pause(); finishCurrent(); // stop whatever was playing; its loop sees the old token and quits
    document.querySelectorAll('.verse.playing').forEach(v => v.classList.remove('playing'));
    for (const i of list) {
      if (token !== playToken) return;
      mark(i, true);
      await say(i);
      mark(i, false);
      if (token === playToken) await new Promise(r => setTimeout(r, 350));
    }
  }
  const mark = (i, on) => document.querySelector(`.verse[data-i="${i}"]`)?.classList.toggle('playing', on);

  // ---------- rendering ----------
  function wordView(i, k, word) {
    const key = `${i}:${k}`;
    const hide = level === 1 ? k % 3 === 1 : level === 3 ? k > 0 : false;
    if (revealed.has(key)) return `<span class="w">${word}</span>`;
    if (level === 2) {
      const m = word.match(/^([¿¡]?)(\p{L})(\p{L}*)(.*)$/u);
      if (m) return `<span class="w hint" data-key="${key}">${m[1]}${m[2]}${'_'.repeat(m[3].length)}${m[4]}</span>`;
    }
    if (hide) return `<span class="w hid" data-key="${key}">${'·'.repeat(Math.max(2, word.length))}</span>`;
    return `<span class="w">${word}</span>`;
  }

  function render() {
    let html = '';
    cfg.stanzas.forEach((_, si) => {
      html += `<div class="stanza-title">${cfg.stanzaNames[si]}
        <button class="act" data-stanza="${si}" style="margin-left:8px">${ICON_PLAY}<span>Celá sloka</span></button></div>`;
      VERSES.forEach((v, i) => {
        if (v.stanza !== si) return;
        const on = mastered.has(i);
        html += `<div class="verse ${on ? 'done' : ''}" data-i="${i}">
          <div class="num">${i + 1}${STAR(on)}</div>
          <div class="text">${v.es.split(' ').map((w, k) => wordView(i, k, w)).join('')}</div>
          <div class="cz">${v.cz}</div>
          <div class="acts">
            <button class="act" data-play="${i}">${ICON_PLAY}<span>Poslechni</span></button>
            ${level >= 1 ? `<button class="act know ${on ? 'on' : ''}" data-know="${i}">${on ? 'Umím to' : 'Umím to?'}</button>` : ''}
          </div>
        </div>`;
      });
    });
    document.getElementById('poem').innerHTML = html;
    const n = mastered.size;
    document.getElementById('barFill').style.width = (n / total * 100) + '%';
    document.getElementById('progressText').textContent = `Zvládnuto ${n} z ${total} veršů`;
    cfg.reward.draw(document.getElementById('reward'), mastered, total);
    document.getElementById('win').classList.toggle('hidden', n < total);
  }

  // ---------- events ----------
  document.getElementById('poem').addEventListener('click', e => {
    const t = e.target.closest('[data-play],[data-know],[data-stanza],[data-key]');
    if (!t) return;
    if (t.dataset.play) playVerses([+t.dataset.play]);
    else if (t.dataset.stanza) playVerses(VERSES.map((v, i) => v.stanza === +t.dataset.stanza ? i : -1).filter(i => i >= 0));
    else if (t.dataset.know) { const i = +t.dataset.know; mastered.has(i) ? mastered.delete(i) : mastered.add(i); save(); render(); }
    else if (t.dataset.key) { revealed.add(t.dataset.key); render(); }
  });
  document.getElementById('levels').addEventListener('click', e => {
    const b = e.target.closest('[data-level]'); if (!b) return;
    level = +b.dataset.level; revealed.clear();
    document.querySelectorAll('#levels .chip').forEach(c => c.classList.toggle('on', c === b));
    render();
  });
  document.getElementById('speeds').addEventListener('click', e => {
    const b = e.target.closest('[data-rate]'); if (!b) return;
    rate = +b.dataset.rate;
    document.querySelectorAll('#speeds .chip').forEach(c => c.classList.toggle('on', c === b));
  });
  document.getElementById('czToggle').addEventListener('click', e => {
    e.currentTarget.classList.toggle('on', document.getElementById('poem').classList.toggle('show-cz'));
  });
  document.getElementById('playAll').addEventListener('click', () => playVerses(VERSES.map((_, i) => i)));
  document.getElementById('reset').addEventListener('click', () => { mastered = new Set(); save(); render(); });

  render();
}
