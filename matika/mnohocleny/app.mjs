import { workshops, glossary, foundations, walkthroughs } from './content.mjs';
import { gardenItems, unlockedItems, newlyUnlocked, sanitizeGarden, placeItem } from './garden.mjs';
import { add, multiply, parse, format, term, monomial, number, checkAnswer } from './algebra.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'polynomial-workshops-v1';
const validIds = new Set(workshops.flatMap(w => w.exercises.map(e => e.id)));
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { saved = {}; }
const completed = new Set(Array.isArray(saved.completed) ? saved.completed.filter(id => validIds.has(id)) : []);
const validGuidedIds = new Set([foundations,...Object.values(walkthroughs).flat()].flatMap(l=>l.steps.map((_,i)=>`${l.id}-${i}`)));
const guidedCompleted = new Set(Array.isArray(saved.guidedCompleted)?saved.guidedCompleted.filter(id=>validGuidedIds.has(id)):[]);
const totalDrops = () => completed.size + guidedCompleted.size;
let gardenSlots = sanitizeGarden(saved.gardenSlots,totalDrops()), selectedPlant=null, removingPlant=false;
let guidedLesson=0, guidedStep=0, guidedRevealed=false, guidedChoice=null, mirrorValue=3;
const cursors = Object.fromEntries(workshops.map(w => [w.id, Number.isInteger(saved.cursors?.[w.id]) && saved.cursors[w.id] >= 0 && saved.cursors[w.id] < w.exercises.length ? saved.cursors[w.id] : 0]));
const requestedLesson = new URLSearchParams(location.search).get('lesson');
const hashId = location.hash.slice(1);
let active = Math.max(0, workshops.findIndex(w => w.id === (hashId || saved.active)));
let mode = 'guided';
const examples = Object.fromEntries(workshops.map(w => [w.id, 0]));
let scene = {}, history = [], hints = 0, sceneVersion = 0, merging = false;
const workshop = () => workshops[active];
const currentExample = () => workshop().examples[examples[workshop().id]];
const countDone = w => w.exercises.filter(e => completed.has(e.id)).length;
const poly = pairs => pairs.reduce((p, [coefficient, key]) => add(p, {[key]:coefficient}), {});
const displayPairs = pairs => pairs.map(([n,k],i) => i ? `${n<0?'−':'+'} ${term(Math.abs(n),k)}` : term(n,k)).join(' ');
const productPair = (a,b) => [a[0]*b[0], [...a[1],...b[1]].sort().join('')];
function quotientPair(a,b) {
  const p = parse(`(${term(...a)})/(${term(...b)})`);
  const entry = Object.entries(p)[0];
  return entry ? [entry[1],entry[0]] : [0,''];
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({completed:[...completed], guidedCompleted:[...guidedCompleted], gardenSlots, cursors, active:workshop().id})); }
  catch { $('save-label').textContent = 'Pokrok teď držíme jen do zavření stránky'; }
}
function feedback(message, success = false) {
  $('scene-feedback').textContent = message;
  $('scene-feedback').classList.toggle('success', success);
}
function renderNav() {
  $('workshop-nav').innerHTML = workshops.map((w,i) => `<button type="button" class="workshop-link ${countDone(w)>=3?'earned':''}" data-workshop="${i}" data-color="${w.color}" aria-current="${i===active}" aria-label="${i+1}. ${w.name}, vyřešeno ${countDone(w)} z 8"><span class="workshop-icon" aria-hidden="true">${w.icon}</span><span class="workshop-number">${countDone(w)>=3?'✦':`0${i+1}`}</span><strong>${w.short}</strong><span class="workshop-progress">${countDone(w) ? `${countDone(w)} / 8 vyřešeno` : 'Otevřít dílnu'}</span></button>`).join('');
  const parts = workshops.filter(w=>countDone(w)>=3).length;
  updateGardenCount();
  document.querySelector('.robot-body>span').innerHTML = parts===6 ? '✦' : 'm<span>+</span>';
}
const why = {
  combine: 'Koeficient říká, kolikrát máme stejný výraz. Tři kopie x a dvě kopie x je pět kopií x. Změní se počet, samotné x zůstává. Člen x² je jiný výraz než x.',
  minus: 'Opačný výraz po přičtení k původnímu vytvoří nulu. Proto musíme otočit každý člen. Například (x − 4) + (−x + 4) = 0. Odečítání tak můžeme nahradit přičtením opaku.',
  distribute: 'Závorka drží balíček pohromadě. Tři balíčky (x + 2) obsahují tři x a šest jednotek. Toto pravidlo, distributivní zákon, platí i pro záporné činitele a proměnné.',
  multiply: 'První člen zleva roznásobí celou druhou závorku a potom to udělá další člen. Každé políčko je právě jedna dvojice. Pro kladné délky si to můžeš představit jako části obdélníku. Se zápornými členy jde o tabulku součinů, ne záporné délky.',
  factor: 'Roznásobením a(b + c) získáš ab + ac. Vytknutím postup obrátíš: z každého členu vyjmeš společného činitele. Zpětné roznásobení ověří, že žádný člen nechybí.',
  divide: 'Dělení nenulovým dělitelem obrací násobení. Když (6x + 9) rozdělíš do tří stejných skupin, v každé je 2x + 3. Násobením třemi musíš dostat původní výraz. Krátit lze společné činitele, ne libovolné členy součtu.'
};
function chooseWorkshop(index, scroll = false) {
  active = index;
  const w = workshop();
  $('workbench').dataset.color = w.color;
  $('lesson-number').textContent = `DÍLNA 0${active+1} / 06`;
  $('lesson-title').textContent = w.name;
  $('lesson-mission').textContent = w.mission;
  $('lesson-symbol').textContent = w.icon;
  $('lesson-intro').textContent = w.intro;
  $('lesson-rule').textContent = w.rule;
  $('lesson-why').textContent = why[w.id];
  guidedLesson=active===0&&!foundations.steps.every((_,i)=>guidedCompleted.has(`${foundations.id}-${i}`))?0:1;
  guidedStep=0;guidedRevealed=false;guidedChoice=null;
  renderNav(); resetScene(); renderPaper(); setMode('guided'); persist(); updateGardenCount();
  window.history.replaceState(null,'',`#${w.id}`);
  if(scroll) $('workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function setMode(next) {
  mode = next;
  for(const m of ['guided','discover','practice','paper']) {
    $(`tab-${m}`).setAttribute('aria-selected', String(m===next));
    $(`tab-${m}`).tabIndex = m===next ? 0 : -1;
    $(`panel-${m}`).hidden = m!==next;
  }
  if(next==='practice') renderPractice();
  if(next==='guided') renderGuided();
}
function resetScene() {
  sceneVersion++; merging = false;
  history = [];
  scene = {selected:null, opened:[], flipped:[], packed:false, factorChosen:false, multiplier:null, mergeId:null, zero:false};
  if(workshop().id==='combine') scene.tiles = currentExample().map(([n,k],i)=>({n,k,id:i}));
  renderScene();
  const notes = {combine:'Ťukni na dva členy stejného druhu. Znaménko je součást členu.',minus:'Nejdřív odhadni znaménka. Pak ťukni na každý člen uvnitř balíčku.',distribute:'Ťukni na člen v závorce. Uvidíš, jak ho činitel vynásobí.',multiply:'Odhadni součin a otevři políčko. Vyplň celou mřížku.',factor:'Vyber ze tří možností společného činitele. Musí být součástí každého členu.',divide:'Ťukni na každý zlomek. Každý člen dělíme stejným jednočlenem.'};
  feedback(notes[workshop().id]);
}
function snapshot() { history.push(JSON.stringify(scene)); }
function tile(n,k,attrs='') { return `<button type="button" class="term-tile ${n<0?'negative':''}" data-key="${k}" ${attrs}>${escape(term(n,k,true))}</button>`; }
function renderScene() {
  const focused = $('scene').contains(document.activeElement) ? document.activeElement : null;
  const identity = focused ? Object.entries(focused.dataset).find(([k])=>['combine','flip','product','cell','factor','pack','divide'].includes(k)) : null;
  const renderers = {combine:renderCombine,minus:renderMinus,distribute:renderDistribute,multiply:renderMultiply,factor:renderFactor,divide:renderDivide};
  $('scene').innerHTML = renderers[workshop().id]();
  $('undo-scene').disabled = history.length===0;
  if(identity) {
    const same = $('scene').querySelector(`[data-${identity[0]}="${identity[1]}"]:not(:disabled)`);
    (same || $('scene').querySelector('button:not(:disabled)') || $('reset-scene')).focus({preventScroll:true});
  }
}
function renderCombine() {
  const done = new Set(scene.tiles.map(t=>t.k)).size === scene.tiles.length;
  return `<h3 class="scene-title">Najdi dvojici, která patří k sobě.</h3><div class="original formula">${escape(displayPairs(currentExample()))}</div><div class="tile-field" aria-label="Členy ke sloučení">${scene.tiles.map(t=>`<button type="button" class="term-tile ${t.n<0?'negative':''} ${scene.selected===t.id?'selected':''} ${scene.mergeId===t.id?'merged':''}" data-key="${t.k}" data-combine="${t.id}" aria-pressed="${scene.selected===t.id}" aria-label="Člen ${escape(term(t.n,t.k))}">${escape(term(t.n,t.k,true))}</button>`).join('') || '<span class="formula">0</span>'}</div>${scene.zero?'<div class="zero-pair"><span>Opačné členy → 0</span></div>':''}<p class="scene-help">Stejný druh = stejné proměnné i mocniny. Například xy a yx jsou stejný druh.</p><div class="result-strip" aria-live="polite">${done?`✦ Hotovo: ${escape(format(poly(scene.tiles.map(t=>[t.n,t.k]))))}`:`Zbývá ${scene.tiles.length} členů. Které můžeš spojit?`}</div>`;
}
function renderMinus() {
  const ex = currentExample();
  const done = scene.flipped.length === ex.inside.length;
  const out = add(poly(ex.outside),poly(ex.inside),ex.sign);
  return `<h3 class="scene-title">${ex.sign<0?'Každý člen dostane opačné znaménko.':'Plus zachová každý člen.'}</h3><div class="original formula">(${escape(displayPairs(ex.outside))}) ${ex.sign<0?'−':'+'} (${escape(displayPairs(ex.inside))})</div><div class="bag"><p class="bag-label">${ex.sign<0?'OBRACEČ: NÁSOBENÍ ČÍSLEM −1':'PRŮCHOD: NÁSOBENÍ ČÍSLEM +1'}</p><div class="tile-field">${ex.inside.map(([n,k],i)=>`<button type="button" class="term-tile ${(scene.flipped.includes(i)?n*ex.sign:n)<0?'negative':''} ${scene.flipped.includes(i)?'flipped':''}" data-key="${k}" data-flip="${i}" ${scene.flipped.includes(i)?'disabled':''} aria-label="${escape(term(n,k))}: ${scene.flipped.includes(i)?'hotovo':ex.sign<0?'otočit znaménko':'zachovat znaménko'}">${escape(term(scene.flipped.includes(i)?n*ex.sign:n,k,true))}${scene.flipped.includes(i)?'<small>✓</small>':''}</button>`).join('')}</div></div><p class="scene-help">${scene.flipped.length} / ${ex.inside.length} členů prošlo strojem. ${ex.sign<0?'Otoč i původně záporné členy.':'Zkus další příklad s mínusem.'}</p><div class="result-strip" aria-live="polite">${done?`${escape(displayPairs([...ex.outside,...ex.inside.map(([n,k])=>[n*ex.sign,k])]))} = ${escape(format(out))}`:'Po otevření balíčku můžeme sloučit stejné členy.'}</div>`;
}
function renderDistribute() {
  const ex = currentExample();
  const scalar = scene.multiplier===null ? ex.scalar : [scene.multiplier,''];
  const done = scene.opened.length===ex.inside.length;
  const pairs = ex.inside.map(t=>productPair(scalar,t));
  return `<h3 class="scene-title">Jeden činitel. Všechny členy.</h3><div class="original formula">${escape(term(...scalar))} · (${escape(displayPairs(ex.inside))})</div>${ex.scalar[1]===''&&Number.isInteger(ex.scalar[0])?`<div class="copy-controls"><label for="copy-range">Zkus jiný počet kopií / jiný činitel: <strong>${number(scalar[0])}</strong></label><input id="copy-range" type="range" min="-4" max="4" value="${scalar[0]}"></div>`:''}<div class="products" style="--columns:${ex.inside.length}">${ex.inside.map(([n,k],i)=>`<div class="product-column">${tile(n,k,`data-product="${i}" ${scene.opened.includes(i)?'disabled':''}`)}<span class="product-arrow">↓ × (${escape(term(...scalar))})</span><div class="product-output ${scene.opened.includes(i)?'revealed':''}">${scene.opened.includes(i)?escape(term(...pairs[i])):'?'}</div></div>`).join('')}</div>${scalar[1]===''&&Number.isInteger(scalar[0])&&scalar[0]>0?`<div class="copy-bundles" aria-label="Stejné kopie balíčku">${Array.from({length:scalar[0]},()=>`<span class="copy-bundle">${escape(displayPairs(ex.inside))}</span>`).join('')}</div>`:''}<p class="scene-help">${scalar[0]===0?'Nula kopií znamená nulu. I to platí pro každý člen.':scalar[0]<0?'Záporný činitel mění také znaménka. Záporné kopie nekreslíme; násobíme každý člen.':'Ťukni na každý člen. Žádný nesmí zůstat bez násobku.'}</p><div class="result-strip" aria-live="polite">${done?`✦ Výsledek: ${escape(format(poly(pairs)))}`:`Hotovo ${scene.opened.length} / ${ex.inside.length} součinů`}</div>`;
}
function renderMultiply() {
  const ex = currentExample(), total=ex.rows.length*ex.cols.length;
  const products=ex.rows.flatMap(r=>ex.cols.map(c=>productPair(r,c)));
  return `<h3 class="scene-title">Každý řádek × každý sloupec.</h3><div class="original formula">(${escape(displayPairs(ex.rows))}) · (${escape(displayPairs(ex.cols))})</div><div class="multiply-grid" style="--cols:${ex.cols.length}" role="group" aria-label="Tabulka součinů"><span class="grid-head">×</span>${ex.cols.map(c=>`<span class="grid-head">${escape(term(...c))}</span>`).join('')}${ex.rows.map((r,row)=>`<span class="grid-head">${escape(term(...r))}</span>${ex.cols.map((c,col)=>{const i=row*ex.cols.length+col,open=scene.opened.includes(i);return `<button type="button" class="grid-cell ${open?'revealed':''} ${open&&products[i][0]<0?'negative':''}" data-cell="${i}" ${open?'disabled':''} aria-label="${escape(term(...r))} krát ${escape(term(...c))}${open?`: ${escape(term(...products[i]))}`:''}">${open?escape(term(...products[i])):'?'}<small>${escape(term(...r))} × (${escape(term(...c))})</small></button>`;}).join('')}`).join('')}</div><p class="scene-help">${ex.rows.length} × ${ex.cols.length} = ${total} dvojic. ${products.some(p=>p[0]<0)?'Znaménko patří ke členu i při násobení.':'Každé políčko představuje jednu část součinu.'}</p><div class="result-strip" aria-live="polite">${scene.opened.length===total?`${escape(displayPairs(products))}<br>= ${escape(format(poly(products)))}`:`Vyplněno ${scene.opened.length} / ${total}. Co patří do dalšího políčka?`}</div>`;
}
function renderFactor() {
  const ex=currentExample(), quotients=ex.terms.map(t=>quotientPair(t,ex.factor));
  return `<h3 class="scene-title">Co mají všechny členy společné?</h3><div class="original formula">${escape(displayPairs(ex.terms))}</div><p class="scene-help">Vyber činitele, který po vyjmutí z každého členu nechá celé koeficienty a žádnou proměnnou ve jmenovateli.</p><div class="factor-options">${ex.choices.map(([n,k],i)=>`<button type="button" class="secondary" data-factor="${i}" ${scene.factorChosen?'disabled':''}>${escape(term(n,k))}</button>`).join('')}</div>${scene.factorChosen?`<div class="factor-package"><p class="eyebrow">${scene.packed?'ZABALENO':'CO ZBUDE PO VYJMUTÍ SPOLEČNÉHO ČINITELE'}</p><p class="formula">${scene.packed?`${escape(term(...ex.factor))}(${escape(displayPairs(quotients))})`:ex.terms.map((t,i)=>`${escape(term(...t))} : (${escape(term(...ex.factor))}) = ${escape(term(...quotients[i]))}`).join('<br>')}</p></div><div class="button-row"><button type="button" class="primary" data-pack>${scene.packed?'Rozbalit a zkontrolovat ↔':'Sbalit do závorky →'}</button></div>`:''}<div class="result-strip" aria-live="polite">${scene.packed?`Zkouška: ${escape(term(...ex.factor))} · (${escape(displayPairs(quotients))}) = ${escape(displayPairs(ex.terms))}`:'Roznásobení a vytýkání jsou opačné cesty.'}</div>`;
}
function renderDivide() {
  const ex=currentExample(), quotients=ex.terms.map(t=>quotientPair(t,ex.divisor)), done=scene.opened.length===ex.terms.length;
  const openedPairs=quotients.filter((_,i)=>scene.opened.includes(i));
  return `<h3 class="scene-title">Vyděl každý člen zvlášť.</h3><div class="original formula">(${escape(displayPairs(ex.terms))}) : (${escape(term(...ex.divisor))})</div><div class="products" style="--columns:${ex.terms.length}">${ex.terms.map((t,i)=>`<div class="product-column"><button type="button" class="term-tile ${t[0]<0?'negative':''}" data-divide="${i}" ${scene.opened.includes(i)?'disabled':''} aria-label="${escape(term(...t))} děleno ${escape(term(...ex.divisor))}"><span class="fraction"><span class="numerator">${escape(term(...t))}</span><span class="denominator">${escape(term(...ex.divisor))}</span></span></button><span class="product-arrow">↓ vydělíme</span><div class="product-output ${scene.opened.includes(i)?'revealed':''}">${scene.opened.includes(i)?escape(term(...quotients[i])):'?'}</div></div>`).join('')}</div>${ex.divisor[1]===''&&ex.divisor[0]===3?`<div class="share-boxes" aria-label="Tři stejné skupiny">${[1,2,3].map(i=>`<div class="share-box"><small>SKUPINA ${i}</small>${openedPairs.length?escape(displayPairs(openedPairs)):'…'}</div>`).join('')}</div>`:''}${ex.condition?`<div class="condition-note"><strong>${escape(ex.condition)} ≠ 0</strong> · Kdyby ${escape(ex.condition)} = 0, dělili bychom nulou. Podmínka platí i po zkrácení.</div>`:'<p class="scene-help">Zpětná zkouška: výsledek krát dělitel musí vrátit původní mnohočlen.</p>'}<div class="result-strip" aria-live="polite">${done?`✦ ${escape(format(poly(quotients)))}${ex.condition?`, pro ${escape(ex.condition)} ≠ 0`:''}`:`Vyděleno ${scene.opened.length} / ${ex.terms.length} členů`}</div>`;
}
async function handleScene(event) {
  const button=event.target.closest('button');
  if(!button||button.disabled||merging) return;
  const ex=currentExample(), data=button.dataset;
  if('combine' in data) {
    const id=Number(data.combine), chosen=scene.tiles.find(t=>t.id===id);
    if(scene.selected===id){scene.selected=null;renderScene();return;}
    if(scene.selected===null){scene.selected=id;scene.mergeId=null;renderScene();feedback(`Vybráno ${term(chosen.n,chosen.k)}. Najdi druhý člen se stejnou proměnnou a mocninou.`);return;}
    const first=scene.tiles.find(t=>t.id===scene.selected);
    if(first.k!==chosen.k){feedback(`${term(first.n,first.k)} a ${term(chosen.n,chosen.k)} mají jinou proměnnou nebo mocninu. Tyto členy neslučujeme. Vyber jiný, nebo prvním klepnutím výběr zruš.`);return;}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      merging=true;
      const version=sceneVersion;
      const pair=[...$('scene').querySelectorAll(`[data-combine="${first.id}"], [data-combine="${chosen.id}"]`)];
      const boxes=pair.map(el=>el.getBoundingClientRect());
      const center={x:boxes.reduce((n,b)=>n+b.x+b.width/2,0)/2,y:boxes.reduce((n,b)=>n+b.y+b.height/2,0)/2};
      const animations=pair.map((el,i)=>el.animate([{transform:'translate(0, 0)',opacity:1},{transform:`translate(${center.x-boxes[i].x-boxes[i].width/2}px, ${center.y-boxes[i].y-boxes[i].height/2}px) scale(.65)`,opacity:.25}],{duration:440,easing:'ease-in-out',fill:'forwards'}));
      await Promise.allSettled(animations.map(a=>a.finished));
      if(version!==sceneVersion)return;
      merging=false;
    }
    snapshot();
    const result=first.n+chosen.n;
    const newId=Math.max(...scene.tiles.map(t=>t.id))+1;
    scene.tiles=scene.tiles.filter(t=>t.id!==first.id&&t.id!==chosen.id);
    if(Math.abs(result)>1e-9) scene.tiles.push({n:result,k:chosen.k,id:newId});
    scene.selected=null;scene.mergeId=newId;scene.zero=Math.abs(result)<1e-9;
    renderScene();
    feedback(`${term(first.n,first.k)} + (${term(chosen.n,chosen.k)}) = ${term(result,chosen.k)}. ${scene.zero?'Opačné členy tvoří nulu.':`Koeficienty: ${number(first.n)} + (${number(chosen.n)}) = ${number(result)}. Druh členu zůstává.`}`,true);
  } else if('flip' in data) {
    const i=Number(data.flip); snapshot(); scene.flipped.push(i); renderScene();
    feedback(`${term(...ex.inside[i])} × (${ex.sign}) = ${term(ex.inside[i][0]*ex.sign,ex.inside[i][1])}. ${scene.flipped.length===ex.inside.length?'Hotovo! Teď už můžeme sloučit stejné členy.':'Stejná operace čeká i ostatní členy.'}`,true);
  } else if('product' in data) {
    const i=Number(data.product),scalar=scene.multiplier===null?ex.scalar:[scene.multiplier,''];
    snapshot();scene.opened.push(i);renderScene();feedback(`${term(...scalar)} · (${term(...ex.inside[i])}) = ${term(...productPair(scalar,ex.inside[i]))}. Násobíme čísla i proměnné.`,true);
  } else if('cell' in data) {
    const i=Number(data.cell),r=ex.rows[Math.floor(i/ex.cols.length)],c=ex.cols[i%ex.cols.length];
    snapshot();scene.opened.push(i);renderScene();feedback(`${term(...r)} · (${term(...c)}) = ${term(...productPair(r,c))}. ${scene.opened.length===ex.rows.length*ex.cols.length?'Všechny dvojice jsou hotové. Nakonec sluč stejné členy.':'Každá dvojice má právě jedno políčko.'}`,true);
  } else if('factor' in data) {
    const selected=ex.choices[Number(data.factor)];
    if(selected[0]!==ex.factor[0]||selected[1]!==ex.factor[1]) {
      const missing=[...selected[1]].find(k=>ex.terms.some(t=>!t[1].includes(k)));
      feedback(missing?`Proměnná ${missing} není v každém členu. Vyber společný činitel všech členů.`:`Číslo ${number(selected[0])} nedělí všechny koeficienty na celá čísla. Hledáme společného dělitele.`);return;
    }
    snapshot();scene.factorChosen=true;renderScene();feedback(`Ano, ${term(...ex.factor)} je společný činitel. Vyděl jím každý člen a zbytky zabal do závorky.`,true);
  } else if('pack' in data) {snapshot();scene.packed=!scene.packed;renderScene();feedback(scene.packed?'Zabaleno! Závorku můžeš znovu roznásobit a ověřit, že dostaneš původní výraz.':'Rozbaleno. U každého členu vidíš, co po vyjmutí společného činitele zůstává.',true);
  } else if('divide' in data) {
    const i=Number(data.divide);snapshot();scene.opened.push(i);renderScene();feedback(`${term(...ex.terms[i])} : (${term(...ex.divisor)}) = ${term(...quotientPair(ex.terms[i],ex.divisor))}.${ex.condition?` Nezapomeň: ${ex.condition} ≠ 0.`:' Stejně vyděl i ostatní členy.'}`,true);
  }
}
function renderPractice() {
  const w=workshop(), index=cursors[w.id], e=w.exercises[index];
  hints=0;
  $('practice').innerHTML=`<div class="practice-wrap"><div class="practice-head"><div><span class="level">${e.level} · úloha ${index+1} / ${w.exercises.length}</span><p>${countDone(w)} různých úloh vyřešeno. Každý nový vyřešený příklad přidá kapku do zahrady.</p></div><span class="workshop-icon" aria-hidden="true">${w.icon}</span></div><div class="question-dots" aria-label="Vyber úlohu">${w.exercises.map((item,i)=>`<button type="button" class="question-dot ${i===index?'current':''} ${completed.has(item.id)?'done':''}" data-question="${i}" aria-label="Úloha ${i+1}${completed.has(item.id)?', vyřešeno':''}" aria-current="${i===index}">${completed.has(item.id)?'✓':i+1}</button>`).join('')}</div><p class="question-label">${e.factor?'Vytkni společného činitele. Zapiš jako součin.':'Uprav výraz. Ve výsledku sluč stejné členy.'}</p><div class="question-equation">${escape(e.prompt)} = ?</div><form class="answer-form" id="answer-form"><label for="answer">Tvůj výsledek</label><div class="answer-row"><input class="answer-input" id="answer" name="answer" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" maxlength="180" enterkeyhint="done" aria-describedby="input-help" placeholder="${e.factor?'např. 3(x + 2)':'např. 2x + 3'}"><button type="submit" class="primary">Zkontrolovat →</button></div><p class="input-help" id="input-help">x² můžeš napsat jako x^2. Desetinná čárka i tečka fungují. Na pořadí členů nezáleží.</p><div class="math-keypad" aria-label="Matematické znaky">${['x','y','a','b','−','+','²','(',')',','].map(k=>`<button type="button" data-insert="${k}" aria-label="Vložit ${k}">${k}</button>`).join('')}</div>${e.condition?`<div class="condition-select"><label for="condition">Původní dělitel je nenulový, když:</label><select id="condition"><option value="">Vyber podmínku</option><option value="none">Žádná podmínka není potřeba</option><option value="zero">${e.condition} = 0</option><option value="${e.condition}">${e.condition} ≠ 0</option><option value="positive">${e.condition} &gt; 0</option></select></div>`:''}</form><div class="feedback" id="answer-feedback" role="status" aria-live="polite" hidden></div><div class="hint-box" id="hint-box" hidden></div><div class="practice-actions"><button type="button" class="secondary" id="hint-button">Malá nápověda</button><button type="button" class="secondary" id="back-discover">Zpátky k pokusu</button><button type="button" class="secondary" id="next-question">${index===w.exercises.length-1?'Znovu od začátku ↻':'Další úloha →'}</button><button type="button" class="primary" id="next-workshop" hidden>${active===5?'Zpátky do třídírny →':'Další dílna →'}</button></div></div>`;
}
function submitAnswer(event) {
  event.preventDefault();
  const w=workshop(), e=w.exercises[cursors[w.id]];
  const result=checkAnswer($('answer').value,e,$('condition')?.value||'');
  const box=$('answer-feedback');box.hidden=false;box.classList.toggle('success',result.ok);
  box.replaceChildren();
  const title=document.createElement('strong');title.textContent=result.ok?'✦ Sedí to!':'Ještě jeden malý krok.';box.append(title,document.createTextNode(result.message));
  if(result.ok) {
    const dropsBefore=totalDrops();
    completed.add(e.id);persist();renderNav();updateGardenCount();
    if(totalDrops()>dropsBefore)box.insertAdjacentHTML('beforeend',rewardMarkup(dropsBefore));
    $('next-question').className='primary';$('next-workshop').hidden=false;
    const dot=document.querySelector(`[data-question="${cursors[w.id]}"]`);dot.classList.add('done');dot.textContent='✓';dot.setAttribute('aria-label',`Úloha ${cursors[w.id]+1}, vyřešeno`);
  }
}
function showHint() {
  const e=workshop().exercises[cursors[workshop().id]];
  const box=$('hint-box');box.hidden=false;
  if(hints===0){box.innerHTML=`<strong>Podívej se na tento krok:</strong><p>${escape(e.hint)}</p>`;}
  else {const step=e.steps[Math.min(hints-1,e.steps.length-1)];const p=document.createElement('p');p.textContent=`${hints}. ${step}`;box.append(p);}
  hints++;
  $('hint-button').textContent=hints>e.steps.length?'Postup je celý odkrytý':'Odkrýt další krok';
  $('hint-button').disabled=hints>e.steps.length;
}
function renderPaper() {
  const w=workshop();
  $('paper').innerHTML=`<div class="paper-wrap"><p class="eyebrow">OBRAZOVKA STRANOU. TUŽKA DO RUKY.</p><h3 style="margin-top:9px">Teď to zvládni vlastním postupem.</h3><p class="paper-intro">Napiš zadání a každý mezikrok na papír. Pak otevři řešení a porovnej, kde se vaše cesty potkaly. ${w.id==='divide'?'U proměnné v děliteli nezapomeň napsat podmínku.':''}</p><div class="button-row"><button type="button" class="secondary" id="print-paper">Vytisknout zadání</button><button type="button" class="secondary" id="paper-practice">Ještě potrénovat na iPadu</button></div>${w.paper.map((e,i)=>`<article class="paper-task"><h3>Pokus ${i+1} ${w.id==='factor'?'· Vytkni společného činitele':'· Uprav a zjednoduš'}</h3><p class="formula">${escape(e.prompt)} =</p><div class="paper-lines" aria-hidden="true"></div><details><summary>Porovnat s řešením</summary>${e.steps.map((s,j)=>`<p><strong>${j+1}.</strong> ${escape(s)}</p>`).join('')}<p>Jiné pořadí členů nevadí, pokud mají stejné koeficienty a znaménka.</p></details></article>`).join('')}<div class="reflection"><strong>Zkus to vysvětlit nahlas:</strong> ${({combine:'Proč můžu spojit 3ab a 2ba, ale ne 3a a 2a²?',minus:'Proč se v −(x − 4) změní −4 na +4?',distribute:'Jak poznám, že jsem v závorce nic nevynechal/a?',multiply:'Kolik součinů vznikne při násobení dvojčlenu trojčlenem a proč?',factor:'Jak roznásobením ověřím, že jsem správně vytkl/a?',divide:'Proč podmínka a ≠ 0 platí dál, i když a po zkrácení zmizelo?'})[w.id]}</div></div>`;
}

// Event delegation also keeps all interactions available to keyboard and touch.
const undo=document.createElement('button');undo.type='button';undo.id='undo-scene';undo.className='secondary';undo.textContent='← Krok zpět';
$('reset-scene').before(undo);
$('workshop-nav').addEventListener('click',e=>{const b=e.target.closest('[data-workshop]');if(b)chooseWorkshop(Number(b.dataset.workshop),true);});
document.querySelector('.mode-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setMode(b.dataset.mode);});
document.querySelector('.mode-tabs').addEventListener('keydown',e=>{
  const tabs=[...document.querySelectorAll('[data-mode]')],i=tabs.indexOf(document.activeElement);
  if(i<0||!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
  e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;setMode(tabs[next].dataset.mode);tabs[next].focus();
});
$('scene').addEventListener('click',handleScene);
$('scene').addEventListener('input',e=>{
  if(e.target.id!=='copy-range')return;
  const value=Number(e.target.value);snapshot();scene.multiplier=value;scene.opened=[];
  // Keep the native slider mounted while a finger is dragging it.
  e.target.closest('.copy-controls').querySelector('strong').textContent=number(value);
  const template=document.createElement('template');template.innerHTML=renderDistribute();
  const oldChildren=[...$('scene').children];
  const newChildren=[...template.content.children];
  newChildren.forEach((child,i)=>{
    if(child.classList.contains('copy-controls'))return;
    if(oldChildren[i])oldChildren[i].replaceWith(child);else $('scene').append(child);
  });
  // A zero or negative factor removes the optional copy-bundle row.
  for(let i=newChildren.length;i<oldChildren.length;i++) oldChildren[i].remove();
  $('undo-scene').disabled=false;
  feedback(`Činitel je teď ${value}. Odhadni nové součiny a otevři oba členy.`);
});
$('undo-scene').addEventListener('click',()=>{if(history.length){sceneVersion++;merging=false;scene=JSON.parse(history.pop());scene.mergeId=null;renderScene();feedback('Vráceno o jeden krok. Zkus znovu odhadnout, co se stane.');}});
$('reset-scene').addEventListener('click',resetScene);
$('next-example').addEventListener('click',()=>{const w=workshop();examples[w.id]=(examples[w.id]+1)%w.examples.length;resetScene();});
$('to-practice').addEventListener('click',()=>setMode('practice'));
$('practice').addEventListener('submit',submitAnswer);
$('practice').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if('question' in b.dataset){cursors[workshop().id]=Number(b.dataset.question);persist();renderPractice();}
  if('insert' in b.dataset){const input=$('answer'),start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.setRangeText(b.dataset.insert,start,end,'end');input.focus();}
  if(b.id==='hint-button')showHint();
  if(b.id==='back-discover')setMode('discover');
  if(b.id==='next-question'){cursors[workshop().id]=(cursors[workshop().id]+1)%workshop().exercises.length;persist();renderPractice();}
  if(b.id==='next-workshop')chooseWorkshop((active+1)%workshops.length,true);
});
$('paper').addEventListener('click',e=>{if(e.target.closest('#print-paper'))window.print();if(e.target.closest('#paper-practice'))setMode('practice');});
$('value-x').addEventListener('input',e=>{const x=Number(e.target.value);$('x-value').textContent=x;$('value-result').textContent=`3 · (${x}) + 2 = ${3*x+2}`;});
document.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{$('count-feedback').textContent=b.dataset.count==='3'?'Ano: 2ab, −3a a +7. Znaménko patří ke členu.':'Počítej části oddělené + a −: 2ab, −3a, +7. Součin ab zůstává uvnitř jednoho členu.';}));
$('glossary').innerHTML=glossary.map(([name,description])=>`<dt>${escape(name)}</dt><dd>${escape(description)}</dd>`).join('');
window.addEventListener('hashchange',()=>{const i=workshops.findIndex(w=>w.id===location.hash.slice(1));if(i>=0&&i!==active)chooseWorkshop(i);});


function dropsText(n, accusative = false) { return `${n} ${n===1?(accusative?'kapku':'kapka'):n>=2&&n<=4?'kapky':'kapek'}`; }
function updateGardenCount() {
  const label=`${unlockedItems(totalDrops()).length} / ${gardenItems.length}`;
  $('garden-count').textContent=label; $('parts-count').textContent=label;
}
function rewardMarkup(before) {
  const gifts=newlyUnlocked(before,totalDrops());
  const next=gardenItems.find(item=>item.at>totalDrops());
  return `<div class="reward ${gifts.length?'new-gift':''}"><span class="reward-icon" aria-hidden="true">${gifts.length?gifts[0].icon:'💧'}</span><div><strong>${gifts.length?`Nové do zahrady: ${escape(gifts[0].name)}!`:'+1 kapka pro tvoji zahradu'}</strong><p>${gifts.length?'Vyber jí místo ve své zahrádce.':next?`Další odměna za ${dropsText(next.at-totalDrops(),true)}. Každý nový vyřešený krok přidá jednu.`:'Tvoje zahrada už má celou sbírku. Další kroky jsou pro radost z matematiky.'}</p></div><button type="button" class="secondary" data-open-garden>${gifts.length?'Zasadit →':'Moje zahrada'}</button>${gifts.length?'<span class="reward-spark" aria-hidden="true">✦</span><span class="reward-spark second" aria-hidden="true">✧</span>':''}</div>`;
}
function renderGarden() {
  const drops=totalDrops(), owned=unlockedItems(drops), next=gardenItems.find(i=>i.at>drops);
  const selected=gardenItems.find(i=>i.id===selectedPlant);
  $('garden-body').innerHTML=`<div class="garden-summary"><strong>💧 ${dropsText(drops)}</strong><span>${owned.length} / ${gardenItems.length} objevených pokladů</span></div><p class="garden-instruction" role="status">${removingPlant?'Ťukni na obsazené místo. Rostlina se vrátí do sbírky.':selected?`Vybráno: ${escape(selected.name)}. Teď ťukni na místo v zahradě.`:owned.length?'Nejdřív vyber poklad ze sbírky dole. Potom ťukni na místo v zahradě.':'První květinu získáš za jeden správně vyřešený krok. Pak si ji sem zasadíš.'}</p><div class="garden-land"><div class="garden-sky" aria-hidden="true"><span>☀</span><span>☁</span><span>☁</span></div><div class="garden-plots" aria-label="Dvanáct míst v zahradě">${gardenSlots.map((id,i)=>{const item=gardenItems.find(p=>p.id===id);return `<button type="button" class="garden-plot ${item?'planted':''}" data-plot="${i}" aria-label="Místo ${i+1}: ${item?escape(item.name):'prázdné'}${selected?', zasadit '+escape(selected.name):''}" ${!selected&&!removingPlant?'disabled':''}><span aria-hidden="true">${item?item.icon:'+'}</span><small>${item?escape(item.name):`Místo ${i+1}`}</small></button>`;}).join('')}</div></div><div class="garden-tools"><button type="button" class="secondary" id="garden-remove" aria-pressed="${removingPlant}">${removingPlant?'Ukončit přesazování':'Vrátit poklad do sbírky'}</button><span>Přesazování nic nestojí.</span></div><h3 class="collection-title">Tvoje sbírka</h3><div class="garden-collection">${gardenItems.map(item=>`<button type="button" class="collection-item ${item.at<=drops?'owned':''}" data-plant="${item.id}" ${item.at>drops?'disabled':''} aria-pressed="${selectedPlant===item.id}" aria-label="${escape(item.name)}, ${item.at<=drops?'vybrat':`odemkne se při ${item.at} kapkách`}"><span aria-hidden="true">${item.at<=drops?item.icon:'◇'}</span><strong>${escape(item.name)}</strong><small>${item.at<=drops?gardenSlots.includes(item.id)?'V zahradě · přesadit':'Můžeš zasadit':dropsText(item.at)}</small></button>`).join('')}</div><p class="garden-footnote">${next?`Další poklad: ${escape(next.name)} za ${dropsText(next.at-drops,true)}. `:'Celá sbírka je tvoje! '}Jedna kapka za každý nový správně vyřešený krok nebo příklad. Nápověda i oprava chyby se počítají. Opakování už vyřešeného úkolu další kapku nepřidá. Za chyby nic neztrácíš.</p>`;
}
function openGarden() {
  selectedPlant=null;removingPlant=false;renderGarden();
  if(!$('garden-dialog').open)$('garden-dialog').showModal();
}
const guidedLessons = () => [foundations,...walkthroughs[workshop().id]];
function resetGuidedStep() {guidedRevealed=false;guidedChoice=null;mirrorValue=guidedLessons()[guidedLesson].steps[guidedStep].visual?.value??3;renderGuided();}
function numberLine(from,to,label,mirror=false) {
  const x=n=>210+n*30, direction=Math.sign(to-from), distance=Math.abs(to-from);
  const ticks=Array.from({length:13},(_,i)=>i-6);
  const arrow=(at,y)=>`<path d="M ${at-direction*5} ${y-7} L ${at} ${y} L ${at+direction*2} ${y-9}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
  const journey=mirror
    ? (distance?`<path class="line-journey" d="M ${x(from)} 82 Q ${(x(from)+x(to))/2} -35 ${x(to)} 82" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${arrow(x(to),82)}`:'')
    : Array.from({length:distance},(_,i)=>{const start=from+i*direction,end=start+direction;return `<g class="unit-jump" style="animation-delay:${i*.45}s"><path d="M ${x(start)} 82 Q ${(x(start)+x(end))/2} 35 ${x(end)} 82" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${arrow(x(end),82)}<text x="${(x(start)+x(end))/2}" y="48" text-anchor="middle">${direction<0?'−1':'+1'}</text></g>`;}).join('');
  return `<div class="number-line-caption">${mirror?(distance?'Najdi stejně vzdálené místo na druhé straně nuly.':'Nula zůstává na místě: opačné číslo k 0 je 0.'):`Začni na ${number(from)}. ${distance} kroky ${direction<0?'doleva':'doprava'}, každý o 1.`}</div><svg class="guided-line precise-line" viewBox="0 0 420 140" role="img" aria-label="${escape(label)}"><title>${escape(label)}</title>${mirror?'<line x1="210" y1="12" x2="210" y2="120" stroke="var(--accent)" stroke-dasharray="3 4" opacity=".35"/>':''}<line x1="15" y1="92" x2="405" y2="92" stroke="currentColor" stroke-width="1.5"/>${ticks.map(n=>`<line x1="${x(n)}" y1="${n===0?84:87}" x2="${x(n)}" y2="${n===0?101:97}" stroke="currentColor"/><text x="${x(n)}" y="122" text-anchor="middle" font-weight="${n===0?'800':'500'}">${n}</text>`).join('')}${journey}<circle cx="${x(from)}" cy="92" r="6" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><circle class="line-destination" cx="${x(to)}" cy="92" r="${distance?6:3}" fill="var(--accent)"/></svg><div class="line-legend"><span>○ začátek: ${number(from)}</span><span>● výsledek: ${number(to)}</span></div>${!mirror?`<p class="unit-route">${Array.from({length:distance+1},(_,i)=>number(from+i*direction)).join(' → ')}</p>`:''}`;
}
function visualMarkup(v) {
  if(!v)return '';
  if(v.kind==='line')return numberLine(v.from,v.to,v.label);
  if(v.kind==='mirror')return `<div class="mirror-controls"><span>Zkus dosadit za x:</span>${[-3,0,3].map(n=>`<button type="button" class="secondary" data-mirror="${n}" aria-pressed="${mirrorValue===n}">x = ${n}</button>`).join('')}</div>${numberLine(mirrorValue,-mirrorValue,`Hodnota x je ${mirrorValue}, hodnota −x je ${-mirrorValue}`,true)}<p class="mirror-result">+x = ${mirrorValue} <span>ale</span> −x = (−1) · (${mirrorValue}) = ${-mirrorValue}</p><p class="visual-caption">+x má stejnou hodnotu jako x. Minus před x hledá opačnou hodnotu.</p>`;
  if(v.kind==='distribute')return `<div class="branch-diagram" aria-label="Činitel násobí oba členy"><div class="branch-source">${escape(v.factor)}</div><svg viewBox="0 0 300 62" preserveAspectRatio="none" aria-hidden="true"><path class="branch-path" d="M150 0 L150 16 L75 16 L75 56 M150 16 L225 16 L225 56"/><path d="M69 49 L75 57 L81 49 M219 49 L225 57 L231 49"/></svg><div class="branch-targets">${v.members.map((member,i)=>`<div class="branch-target"><span class="branch-member">${escape(member)}</span><span class="branch-caption">${i+1}. násobení</span><strong>${escape(v.products[i])}</strong></div>`).join('<span class="branch-plus" aria-label="plus">+</span>')}</div></div>`;
  if(v.kind==='split')return `<div class="split-groups">${v.groups.map(g=>`<div><span class="eyebrow">${escape(g.label)}</span><p>${escape(g.expression)}</p><strong>↓ ${escape(g.result)}</strong></div>`).join('')}</div>`;
  return `<div class="guided-pieces">${v.pieces.map((piece,i)=>`${i?`<span class="piece-op">${v.kind==='parts'?(v.operator||'·'):v.kind==='copies'?'+':'→'}</span>`:''}<div class="guided-piece"><strong>${escape(piece)}</strong>${v.labels?`<small>${escape(v.labels[i])}</small>`:''}</div>`).join('')}</div><p class="visual-result">${escape(v.result)}</p>`;
}
function renderGuided() {
  const lessons=guidedLessons(), l=lessons[guidedLesson], s=l.steps[guidedStep];
  const stepId=`${l.id}-${guidedStep}`, done=guidedCompleted.has(stepId), last=guidedStep===l.steps.length-1;
  const url=new URL(location.href);url.searchParams.set('lesson',l.id);url.hash=workshop().id;window.history.replaceState(null,'',url);
  $('guided').innerHTML=`<div class="guided-wrap"><div class="guided-heading"><div><p class="eyebrow">ŽÁDNÁ PŘESKOČENÁ JEDNIČKA ANI ZNAMÉNKO</p><h3>Podíváme se operacím pod ruce.</h3></div><span class="guided-drop">💧 ${dropsText(totalDrops())}</span></div><label class="guided-select-label" for="guided-lesson">Co si rozkreslíme?</label><select id="guided-lesson">${lessons.map((item,i)=>`<option value="${i}" ${i===guidedLesson?'selected':''}>${escape(item.title)}</option>`).join('')}</select><div class="guided-progress" aria-label="Krok ${guidedStep+1} z ${l.steps.length}">${l.steps.map((_,i)=>`<span class="${i===guidedStep?'current':i<guidedStep?'past':''}"></span>`).join('')}</div><div class="guided-step-head"><span class="level">KROK ${guidedStep+1} / ${l.steps.length}${done?' · UŽ VYZKOUŠENO':''}</span><h3 id="guided-step-title" tabindex="-1">${escape(s.title)}</h3></div><div class="guided-before"><span class="eyebrow">VÝCHOZÍ ZÁPIS</span><div class="formula">${escape(s.before)}</div></div><div class="guided-question"><p>${escape(s.question)}</p><div class="guided-options">${s.choices.map((choice,i)=>`<button type="button" class="guided-option ${guidedChoice===i?(i===s.correct?'correct':'retry'):''}" data-guide-choice="${i}" ${guidedChoice===s.correct?'disabled':''}>${escape(choice)}</button>`).join('')}</div><p class="guided-feedback" id="guided-feedback" role="status" aria-live="polite">${guidedChoice===null?'Nejdřív si zkus vybrat. Když nevíš, ukážeme si proč.':guidedChoice===s.correct?'Ano. Teď sleduj, co jsme v zápisu odkryli.':'Zkus se podívat na vysvětlení a vyber znovu. Chybou o nic nepřijdeš.'}</p></div><div id="guided-reveal" ${guidedRevealed?'':'hidden'}><div class="guided-visual">${visualMarkup(s.visual)}</div><div class="guided-after"><span class="eyebrow">STEJNÁ HODNOTA, ROZEPSANÝ KROK</span><div class="formula">${escape(s.after)}</div></div><p class="guided-explanation">${escape(s.explanation)}</p>${workshop().id==='divide'&&l.id!=='signs'?'<p class="condition-note">Po celou dobu: y ≠ 0. Původní dělitel 3y nesmí být nula.</p>':''}</div><div id="guided-reward" aria-live="polite"></div><div class="guided-actions"><button type="button" class="secondary" id="guided-prev" ${guidedStep===0?'disabled':''}>← Předchozí krok</button><button type="button" class="secondary" id="guided-explain">${guidedRevealed?'Přehrát rozkreslení ↻':'Nevím — ukaž mi proč'}</button><button type="button" class="primary" id="guided-next" ${guidedRevealed?'':'disabled'}>${last?guidedLesson<lessons.length-1?'Další vysvětlení →':'Zkusit pokus →':'Další malý krok →'}</button></div><p class="guided-bottom">Můžeš se vracet i použít vysvětlení. Nový správně vyřešený krok přidá kapku do zahrady.</p></div>`;
}
$('guided').addEventListener('change',event=>{if(event.target.id==='guided-lesson'){guidedLesson=Number(event.target.value);guidedStep=0;resetGuidedStep();}});
$('guided').addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  const l=guidedLessons()[guidedLesson], s=l.steps[guidedStep];
  if('guideChoice' in b.dataset){
    guidedChoice=Number(b.dataset.guideChoice);
    if(guidedChoice===s.correct){const before=totalDrops();guidedCompleted.add(`${l.id}-${guidedStep}`);guidedRevealed=true;persist();updateGardenCount();renderGuided();if(totalDrops()>before)$('guided-reward').innerHTML=rewardMarkup(before);}
    else {guidedRevealed=true;renderGuided();}
    $('guided-feedback').scrollIntoView({block:'nearest',behavior:'auto'});
  }
  if('mirror' in b.dataset){mirrorValue=Number(b.dataset.mirror);document.querySelector('#guided-reveal .guided-visual').innerHTML=visualMarkup(s.visual);}
  if(b.id==='guided-explain'){guidedRevealed=true;renderGuided();}
  if(b.id==='guided-prev'&&guidedStep>0){guidedStep--;resetGuidedStep();}
  if(b.id==='guided-next'&&guidedRevealed){
    if(guidedStep<l.steps.length-1){guidedStep++;resetGuidedStep();}
    else if(guidedLesson<guidedLessons().length-1){guidedLesson++;guidedStep=0;resetGuidedStep();}
    else setMode('discover');
    if(mode==='guided'){$('guided-step-title').focus({preventScroll:true});$('guided-step-title').scrollIntoView({block:'nearest',behavior:'auto'});}
  }
});
document.addEventListener('click',event=>{if(event.target.closest('[data-open-garden]'))openGarden();});
$('garden-close').addEventListener('click',()=>$('garden-dialog').close());
$('garden-body').addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if('plant' in b.dataset){selectedPlant=b.dataset.plant;removingPlant=false;renderGarden();document.querySelector('.garden-instruction').scrollIntoView({block:'nearest',behavior:'auto'});}
  if('plot' in b.dataset){const index=Number(b.dataset.plot);if(removingPlant)gardenSlots[index]=null;else if(selectedPlant)gardenSlots=placeItem(gardenSlots,selectedPlant,index,totalDrops());persist();renderGarden();}
  if(b.id==='garden-remove'){removingPlant=!removingPlant;selectedPlant=null;renderGarden();}
});
chooseWorkshop(active);
if(requestedLesson){const index=guidedLessons().findIndex(l=>l.id===requestedLesson);if(index>=0){guidedLesson=index;guidedStep=0;resetGuidedStep();}}
