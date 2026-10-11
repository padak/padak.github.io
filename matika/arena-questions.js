// Small, exact-number exercises. All percentages refer to an explicitly named base.
const pick = values => values[Math.floor(Math.random() * values.length)];
const fmt = value => new Intl.NumberFormat('cs-CZ', {maximumFractionDigits:2}).format(value);
const kc = value => `${fmt(value)} Kč`;
const pct = value => `${fmt(value)} %`;
const answer = (label, correct = false, hint = '') => ({label, correct, hint});

export function createMission() {
  const questions = [];
  let base, p, paid, part;
  p = pick([10,20,25,30,40]);
  questions.push({skill:'Zbytek do 100 %',text:`Na energetické články je sleva ${p} %. Kolik procent původní ceny zaplatíš?`,
    options:[answer(pct(100-p),true),answer(pct(p),false,'To je část, kterou neplatíš. Co zbývá do 100 %?'),answer(pct(100+p),false,'Při slevě platíš méně než 100 %. Slevu odečítáme.')],
    hint:'Původní cena je celých 100 %. Odečti procento slevy.',explanation:`100 − ${p} = ${100-p} %. Sleva je odebraná část, zaplatíš zbytek.`});

  base=pick([200,300,400,500,600,800]);p=pick([10,20,25,30]);part=base*p/100;
  questions.push({skill:'Procentová část',text:`V nádrži je ${base} litrů. Motor spotřebuje ${p} % tohoto množství. Kolik litrů spotřebuje?`,
    options:[answer(`${fmt(part)} l`,true),answer(`${fmt(base-part)} l`,false,'To je množství, které zůstane. Ptáme se na spotřebovanou část.'),answer(`${p} l`,false,'Procenta nejsou litry. Nejdřív zjisti, kolik litrů představuje 1 %.')],
    hint:`1 % znamená jednu setinu. Vyděl ${base} číslem 100.`,explanation:`100 % je ${base} l. 1 % je ${fmt(base/100)} l. ${p} % = ${p} × ${fmt(base/100)} = ${fmt(part)} l.`});

  base=pick([200,500,600,800]);p=pick([10,20,25,40]);part=base*p/100;
  questions.push({skill:'Hledáme počet procent',text:`Z celkové kapacity ${base} jednotek je nabito ${part} jednotek. Na kolik procent je baterie nabitá?`,
    options:[answer(pct(p),true),answer(pct(100-p),false,'To je nenabitá část. Ptáme se, kolik procent už je nabito.'),answer(pct(part),false,'Počet jednotek není počet procent. Porovnej ho s celkovou kapacitou.')],
    hint:`Plná baterie je 100 %. Kolik jednotek je 1 % z ${base}?`,explanation:`1 % kapacity je ${fmt(base/100)} jednotek. ${part} ÷ ${fmt(base/100)} = ${p} %. Základem je celá kapacita ${base}.`});

  base=pick([200,400,500,800]);p=pick([10,20]);
  questions.push({skill:'Zvýšení o procenta',text:`Oprava stojí ${kc(base)}. Technik cenu zvýší o ${p} % původní ceny. Kolik bude stát teď?`,
    options:[answer(kc(base*(1+p/100)),true),answer(kc(base*(1-p/100)),false,'To by byla sleva. Tady cenu zvyšujeme.'),answer(kc(base+p),false,`Přidala jsi ${p} korun. Máme ale přidat ${p} procent z ${kc(base)}.`)],
    hint:`Přičti ${p} % z původních ${kc(base)}.`,explanation:`${p} % z ${kc(base)} je ${kc(base*p/100)}. ${fmt(base)} + ${fmt(base*p/100)} = ${kc(base*(1+p/100))}. Nová cena je ${100+p} % původní ceny.`});

  base=pick([300,400,600,800]);p=pick([20,25,30]);paid=base*(100-p)/100;
  questions.push({skill:'Cena po slevě',text:`Náhradní panel stojí před slevou ${kc(base)}. Sleva je ${p} %. Kolik zaplatíš?`,
    options:[answer(kc(paid),true),answer(kc(base*p/100),false,'To je hodnota slevy. Tu od původní ceny ještě odečti.'),answer(kc(base-p),false,'Odečetla jsi počet procent jako koruny. Procenta nejdřív převeď na peníze.')],
    hint:`Po slevě zaplatíš ${100-p} % původní ceny.`,explanation:`Sleva ${p} % z ${kc(base)} je ${kc(base*p/100)}. ${fmt(base)} − ${fmt(base*p/100)} = ${kc(paid)}.`});

  base=pick([500,800,1000,1200]);p=pick([20,25,40]);paid=base*(100-p)/100;
  questions.push({skill:'Původní cena',text:`Skener stojí po slevě ${p} % celkem ${kc(paid)}. Kolik stál před slevou?`,
    options:[answer(kc(base),true),answer(kc(paid*(1+p/100)),false,'Přičítáš procenta k nové ceně. Původní sleva se ale počítala z původní ceny.'),answer(kc(paid*(1-p/100)),false,'To je další sleva. Hledáme vyšší cenu před první slevou.')],
    hint:`${kc(paid)} představuje ${100-p} %. Vyděl cenu počtem zbývajících procent.`,explanation:`${100-p} % stojí ${kc(paid)}. 1 % = ${fmt(paid)} ÷ ${100-p} = ${kc(base/100)}. 100 % = ${fmt(base/100)} × 100 = ${kc(base)}.`});

  base=pick([400,800,1200]);p=pick([20,25,40]);paid=base*(100-p)/100;
  questions.push({skill:'Úspora ze známé nové ceny',text:`Balík součástek stojí po slevě ${p} % celkem ${kc(paid)}. Kolik korun sleva ušetřila?`,
    options:[answer(kc(base*p/100),true),answer(kc(paid*p/100),false,'To je procento z nové ceny. Sleva se počítá z původní ceny.'),answer(kc(base),false,'To je celá původní cena. Ptáme se jen na část, kterou sleva ubrala.')],
    hint:`Cena po slevě je ${100-p} %. Zjisti hodnotu 1 % a pak ji vynásob ${p}.`,explanation:`1 % původní ceny je ${fmt(paid)} ÷ ${100-p} = ${kc(base/100)}. Úspora ${p} % = ${p} × ${fmt(base/100)} = ${kc(base*p/100)}.`});

  base=pick([500,800,1000]);p=pick([10,20,25,40]);paid=base*(100-p)/100;
  questions.push({skill:'Velikost slevy',text:`Dron původně stál ${kc(base)}, po slevě stojí ${kc(paid)}. Kolik procent původní ceny tvoří sleva?`,
    options:[answer(pct(p),true),answer(pct(100-p),false,'To je podíl ceny, který stále platíš. Sleva je odebraná část.'),answer(pct(base-paid),false,'To je počet ušetřených korun. Porovnej úsporu s původní cenou.')],
    hint:`Úspora je ${kc(base-paid)}. Původních ${kc(base)} představuje 100 %.`,explanation:`Ušetříš ${fmt(base)} − ${fmt(paid)} = ${kc(base-paid)}. 1 % původní ceny je ${kc(base/100)}. ${fmt(base-paid)} ÷ ${fmt(base/100)} = ${p} %.`});

  base=pick([500,1000,1500]);
  questions.push({skill:'Zvýšení a snížení',text:`Cena modulu ${kc(base)} nejdřív vzroste o 20 %. Potom klesne o 20 % z nové ceny. Kolik stojí nakonec?`,
    options:[answer(kc(base*.96),true),answer(kc(base),false,'Procenta mají různé základy. Druhých 20 % se počítá z vyšší ceny.'),answer(kc(base*.8),false,'To odpovídá jen slevě z původní ceny. Nejdřív cenu zvýšíme.')],
    hint:`Po zvýšení stojí modul ${kc(base*1.2)}. Slevu počítej z této částky.`,explanation:`Po zvýšení: ${fmt(base)} + ${fmt(base*.2)} = ${kc(base*1.2)}. Sleva je 20 % z ${kc(base*1.2)}, tedy ${kc(base*.24)}. Nakonec ${fmt(base*1.2)} − ${fmt(base*.24)} = ${kc(base*.96)}.`});

  base=pick([800,1000,1200]);
  questions.push({skill:'Dvě slevy za sebou',text:`Výbava stojí ${kc(base)}. První sleva je 20 %. Druhá sleva je 10 % z už snížené ceny. Kolik zaplatíš?`,
    options:[answer(kc(base*.72),true),answer(kc(base*.7),false,'Sečetla jsi slevy na 30 %. Druhá sleva má ale jiný, menší základ.'),answer(kc(base*.8),false,'To je cena po první slevě. Z ní ještě odečti dalších 10 %.')],
    hint:`Po první slevě zbývá ${kc(base*.8)}. Druhých 10 % ber z této ceny.`,explanation:`Po první slevě: ${kc(base*.8)}. Druhá sleva je ${kc(base*.08)}. ${fmt(base*.8)} − ${fmt(base*.08)} = ${kc(base*.72)}. Celková sleva je 28 %, nikoli 30 %.`});

  const scale=pick([1,2]);
  questions.push({skill:'Porovnání obchodů',text:`Stejný reaktor: obchod A má cenu ${kc(800*scale)} a slevu 25 %, obchod B cenu ${kc(750*scale)} a slevu 20 %. Kde zaplatíš méně?`,
    options:[answer('V obou stejně',true),answer('Obchod A',false,'Větší procento slevy samo o sobě nestačí. Porovnej výsledné ceny.'),answer('Obchod B',false,'Nižší původní cena sama o sobě nestačí. Vypočítej obě ceny po slevě.')],
    hint:'Vypočítej 75 % ceny v obchodě A a 80 % ceny v obchodě B.',explanation:`A: ${fmt(800*scale)} − ${fmt(200*scale)} = ${kc(600*scale)}. B: ${fmt(750*scale)} − ${fmt(150*scale)} = ${kc(600*scale)}. Obě nabídky mají stejnou výslednou cenu.`});

  const final=pick([{base:1200,p:30},{base:1200,p:40},{base:800,p:25}]);base=final.base;p=final.p;paid=base*(100-p)/100;
  questions.push({skill:'Finále: od části k celku',text:`Finální kód: ${kc(paid)} je cena zdroje po slevě ${p} %. Jaká byla původní cena?`,
    options:[answer(kc(base),true),answer(kc(paid*(1+p/100)),false,'Přičtení procent z nové ceny nevrátí původní cenu. Nejprve zjisti, kolik procent je známá částka.'),answer(kc(paid/(p/100)),false,`${kc(paid)} představuje ${100-p} %, ne ${p} %. Nezaměň cenu po slevě s hodnotou slevy.`)],
    hint:`${100-p} % = ${kc(paid)} → 1 % → 100 %.`,explanation:`${100-p} % = ${kc(paid)}. 1 % = ${fmt(paid)} ÷ ${100-p} = ${kc(base/100)}. Celých 100 % je ${kc(base)}. Reaktor může znovu běžet!`});

  for(const q of questions) {
    if(new Set(q.options.map(o=>o.label)).size!==3||q.options.filter(o=>o.correct).length!==1)throw new Error('Invalid percentage exercise');
    for(let i=q.options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[q.options[i],q.options[j]]=[q.options[j],q.options[i]];}
  }
  return questions;
}
