// Original exercises following the scope of the supplied textbook, pages 22–28.
const q = (prompt, answer, hint, steps, extra = {}) => ({ prompt, answer, hint, steps, why: steps.join(' → '), ...extra });
export const workshops = [
  { id: 'combine', name: 'Třídírna členů', short: 'Slučování', icon: '◈', color: 'purple', mission: 'Dej k sobě, co k sobě patří.', intro: 'Stejné proměnné a stejné mocniny tvoří jeden druh. Sečti jejich koeficienty. Znaménko cestuje se členem.', rule: '3x + 2x = 5x, ale x + x² dál zůstává x + x².', badge: 'Třídič', examples: [
    [[3,'x'],[2,'y'],[-1,'x'],[4,''],[-2,'y']],
    [[2,'xx'],[3,'x'],[-5,'xx'],[1,'x']],
    [[3,'xy'],[2,'x'],[-1,'xy'],[-2,'x']],
    [[0.5,'a'],[1.5,'a'],[-2,'a'],[3,'b']]
  ], exercises: [
    q('3x + 5x', '8x', 'Počítáš počet x: 3 + 5. Proměnná x se nemění.', ['(3 + 5)x', '8x'], { mistakes: [['8x^2','Mocniny se při sčítání nesčítají. Tři x a pět x je osm x.']] }),
    q('7a − 10a', '-3a', 'Koeficienty odečti i se znaménkem: 7 − 10.', ['(7 − 10)a', '−3a']),
    q('4x + 2y + 3x − y', '7x+y', 'Nejprve spoj členy s x, pak členy s y. Samotné y znamená 1y.', ['(4 + 3)x + (2 − 1)y', '7x + y']),
    q('2x² + 3x − 5x² + x', '-3x^2+4x', 'x² a x jsou různé druhy. Sluč je zvlášť.', ['(2 − 5)x² + (3 + 1)x', '−3x² + 4x']),
    q('3ab + 2ba − ab', '4ab', 'ab a ba jsou stejný součin: pořadí činitelů nehraje roli.', ['(3 + 2 − 1)ab', '4ab']),
    q('0,5m + 1,5m − m', 'm', 'Samotné m má koeficient 1. Sečti 0,5 + 1,5 − 1.', ['(0,5 + 1,5 − 1)m', 'm']),
    q('4a − 4a + 2 − 5', '-3', 'Členy 4a a −4a tvoří nulu. Zbývají čísla.', ['0a + 2 − 5', '−3']),
    q('2abc − 5bc + 3cb − 2abc − bc', '-3bc', 'abc se vyruší. bc a cb jsou stejný druh.', ['(2 − 2)abc + (−5 + 3 − 1)bc', '−3bc'])
  ], paper: [q('6x + 4y − 2x − 7y', '4x-3y', '', ['(6 − 2)x + (4 − 7)y', '4x − 3y']), q('3a² + 2a − a² + 5a', '2a^2+7a', '', ['(3 − 1)a² + (2 + 5)a', '2a² + 7a'])] },
  { id: 'minus', name: 'Obraceč závorek', short: 'Závorky', icon: '↺', color: 'coral', mission: 'Otoč celý balíček.', intro: 'Odečíst výraz znamená přičíst jeho opak. Minus před závorkou je násobení číslem −1, a to se týká každého členu.', rule: '−(x − 4) = −x + 4. Plus před závorkou znaménka zachová.', badge: 'Obraceč', examples: [
    { outside: [[3,'x'],[2,'']], inside: [[1,'x'],[-4,'']], sign: -1 },
    { outside: [[5,'a']], inside: [[2,'a'],[3,'b']], sign: -1 },
    { outside: [[2,'x']], inside: [[3,'x'],[-2,'y'],[1,'']], sign: -1 },
    { outside: [[2,'x']], inside: [[3,'x'],[-2,'y']], sign: 1 }
  ], exercises: [
    q('−(x + 3)', '-x-3', 'Násob −1 oba členy: x i +3.', ['−1 · x + (−1) · 3', '−x − 3'], { mistakes: [['-x+3','Změnil se jen první člen. Minus před závorkou násobí −1 také číslo +3.']] }),
    q('−(2a − 5)', '-2a+5', 'Opak −5 je +5. Otoč oba členy.', ['−1 · 2a + (−1) · (−5)', '−2a + 5']),
    q('(3x + 2) − (x − 4)', '2x+6', 'Z druhé závorky vznikne −x + 4. Potom sluč.', ['3x + 2 − x + 4', '2x + 6'], { mistakes: [['2x-2','Člen −4 se po odečtení závorky změní na +4. Proto 2 + 4 = 6.']] }),
    q('(4p + 7r) − (4p − 5r)', '12r', 'Otoč i −5r: vznikne +5r.', ['4p + 7r − 4p + 5r', '12r']),
    q('(6a + 2b) + (7b − 4a)', '2a+9b', 'Před druhou závorkou je plus. Znaménka uvnitř se nemění.', ['6a + 2b + 7b − 4a', '2a + 9b']),
    q('3u − (6u + 7v) − 5v + u', '-2u-12v', 'Před závorkou je minus: −6u − 7v. Pak seskup stejné členy.', ['3u − 6u − 7v − 5v + u', '−2u − 12v']),
    q('(x + 2y) − (2x + y) + (x − y)', '0', 'Druhou závorku otoč, poslední má plus. Všechny členy se vyruší.', ['x + 2y − 2x − y + x − y', '0']),
    q('8z − [6z − (2z − 3)]', '4z-3', 'Začni uvnitř: 6z − (2z − 3) = 4z + 3.', ['8z − (4z + 3)', '8z − 4z − 3', '4z − 3'])
  ], paper: [q('(4x + 1) − (2x − 3)', '2x+4', '', ['4x + 1 − 2x + 3', '2x + 4']), q('5a − (2a − 3b) + (a − b)', '4a+2b', '', ['5a − 2a + 3b + a − b', '4a + 2b'])] },
  { id: 'distribute', name: 'Násobicí kopírka', short: 'Jeden × závorka', icon: '✳', color: 'teal', mission: 'Každý člen dostane svůj násobek.', intro: 'Třikrát (x + 2) znamená tři stejné balíčky. Je v nich celkem 3x a 6 jednotek. I záporným číslem nebo proměnnou násobíme každý člen.', rule: 'a(b + c) = ab + ac. Pozor: 2x · 3x = 6x².', badge: 'Kopírka', examples: [
    { scalar: [3,''], inside: [[1,'x'],[2,'']] },
    { scalar: [-2,''], inside: [[2,'x'],[-3,'']] },
    { scalar: [2,'x'], inside: [[3,'x'],[-1,'y'],[2,'']] },
    { scalar: [0.5,''], inside: [[4,'a'],[-2,'b']] }
  ], exercises: [
    q('3(x + 2)', '3x+6', 'Trojkou vynásob x i číslo 2.', ['3 · x + 3 · 2', '3x + 6'], { mistakes: [['3x+2','Dvojka uvnitř závorky také patří do každé ze tří kopií. 3 · 2 = 6.']] }),
    q('−4(3u − v)', '-12u+4v', '−4 · 3u = −12u; záporné krát záporné je kladné.', ['(−4) · 3u + (−4) · (−v)', '−12u + 4v']),
    q('2x(3x + 4)', '6x^2+8x', 'Násob čísla a pak proměnné: x · x = x².', ['2x · 3x + 2x · 4', '6x² + 8x']),
    q('a(c + 7b + 2)', 'ac+7ab+2a', 'Vynásob a všechny tři členy: c, 7b i 2.', ['a · c + a · 7b + a · 2', 'ac + 7ab + 2a']),
    q('4a − 2(a + 3b)', '2a-6b', 'Před závorkou je −2. Vynásob oba členy a sluč s 4a.', ['4a − 2a − 6b', '2a − 6b']),
    q('5x + 3(x − 5y) + y', '8x-14y', 'Nejdřív roznásob trojkou. Až potom sluč x a y.', ['5x + 3x − 15y + y', '8x − 14y']),
    q('0,5(6a − 4b)', '3a-2b', 'Polovina 6a je 3a. Polovina −4b je −2b.', ['0,5 · 6a − 0,5 · 4b', '3a − 2b']),
    q('−2a(3ab − a + 2)', '-6a^2b+2a^2-4a', 'Násob každý člen. a · ab = a²b a (−2a) · (−a) = 2a².', ['−6a²b + 2a² − 4a'])
  ], paper: [q('5(2x − 3y + 1)', '10x-15y+5', '', ['5 · 2x − 5 · 3y + 5 · 1', '10x − 15y + 5']), q('2x(x − 3) + 4x', '2x^2-2x', '', ['2x² − 6x + 4x', '2x² − 2x'])] },
  { id: 'multiply', name: 'Mřížka součinů', short: 'Závorka × závorka', icon: '▦', color: 'blue', mission: 'Propoj každého s každým.', intro: 'Každý člen první závorky násobí každý člen druhé. Mřížka ohlídá, že žádná dvojice nechybí. Nakonec sluč stejné členy.', rule: '(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6.', badge: 'Mřížka', examples: [
    { rows: [[1,'x'],[2,'']], cols: [[1,'x'],[3,'']] },
    { rows: [[1,'x'],[-1,'']], cols: [[1,'y'],[2,'']] },
    { rows: [[2,'x'],[1,'']], cols: [[1,'x'],[-3,'']] },
    { rows: [[1,'a'],[2,'']], cols: [[1,'b'],[-1,'c'],[3,'']] }
  ], exercises: [
    q('(x + 2)(x + 3)', 'x^2+5x+6', 'Potřebuješ čtyři součiny: x·x, x·3, 2·x, 2·3.', ['x² + 3x + 2x + 6', 'x² + 5x + 6'], { mistakes: [['x^2+6','Chybí dva křížové součiny: x · 3 a 2 · x.']] }),
    q('(x − 1)(y + 1)', 'xy+x-y-1', 'Člen −1 násobí y i +1. Oba tyto součiny jsou záporné.', ['xy + x − y − 1']),
    q('(2x + 1)(x − 4)', '2x^2-7x-4', 'Vytvoř čtyři součiny. Potom sečti −8x + x.', ['2x² − 8x + x − 4', '2x² − 7x − 4']),
    q('(3 − a)(3 + b)', '9+3b-3a-ab', 'Násobí i člen −a. Součin (−a) · b je −ab.', ['9 + 3b − 3a − ab']),
    q('(a + 3)(b − 2)', 'ab-2a+3b-6', 'Každý člen zleva násobí oba zprava.', ['ab − 2a + 3b − 6']),
    q('(x + 2)(x − 2)', 'x^2-4', 'Křížové členy −2x a +2x se navzájem vyruší.', ['x² − 2x + 2x − 4', 'x² − 4']),
    q('(x − 5)(y − 2z + 1)', 'xy-2xz+x-5y+10z-5', 'Dva členy krát tři členy: celkem šest součinů. (−5) · (−2z) = +10z.', ['xy − 2xz + x − 5y + 10z − 5']),
    q('(a + b − 3)(c + 3)', 'ac+3a+bc+3b-3c-9', 'Tři řádky a dva sloupce. Člen −3 násobí c i +3.', ['ac + 3a + bc + 3b − 3c − 9'])
  ], paper: [q('(x + 4)(x − 1)', 'x^2+3x-4', '', ['x² − x + 4x − 4', 'x² + 3x − 4']), q('(2a − 1)(b + 3)', '2ab+6a-b-3', '', ['2ab + 6a − b − 3'])] },
  { id: 'factor', name: 'Balírna výrazů', short: 'Vytýkání', icon: '⬡', color: 'amber', mission: 'Najdi společnou součást.', intro: 'Vytýkání obrací roznásobování. Najdi, co má každý člen společného, a dej to před závorku. Obsah závorky získáš vydělením každého členu.', rule: '6x + 9 = 3(2x + 3). Zkouška: závorku znovu roznásob.', badge: 'Balírna', examples: [
    { terms: [[6,'x'],[9,'']], factor: [3,''], choices: [[2,''],[3,''],[6,'']] },
    { terms: [[4,'xy'],[8,'x']], factor: [4,'x'], choices: [[4,'x'],[4,'y'],[8,'x']] },
    { terms: [[2,'a'],[4,'b'],[-10,'']], factor: [2,''], choices: [[2,'a'],[4,''],[2,'']] },
    { terms: [[-6,'s'],[-9,'']], factor: [-3,''], choices: [[-6,''],[-3,''],[3,'s']] }
  ], exercises: [
    q('6x + 9', '3(2x+3)', 'Čísla 6 a 9 mají společného dělitele 3. Vyděl jím oba členy.', ['6x : 3 = 2x; 9 : 3 = 3', '3(2x + 3)'], {factor:true}),
    q('5b − 15c', '5(b-3c)', 'Oba koeficienty jsou dělitelné pěti. Znaménko − zůstává uvnitř.', ['5b : 5 = b; −15c : 5 = −3c', '5(b − 3c)'], {factor:true}),
    q('2a + 4b − 10', '2(a+2b-5)', 'Dvojka dělí všechny tři členy, včetně −10.', ['2a : 2 = a; 4b : 2 = 2b; −10 : 2 = −5', '2(a + 2b − 5)'], {factor:true}),
    q('4xy + 8x', '4x(y+2)', 'Oba členy obsahují 4 i x. Z druhého zbude 2.', ['4xy : 4x = y; 8x : 4x = 2', '4x(y + 2)'], {factor:true}),
    q('abc + bc', 'bc(a+1)', 'Společný součin je bc. bc : bc dává 1, ne 0.', ['abc = bc · a; bc = bc · 1', 'bc(a + 1)'], {factor:true, mistakes:[['abc','V závorkách musí zůstat také +1. Druhý člen bc nezmizí.']]}),
    q('−21s − 7', '-7(3s+1)', 'Můžeš vytknout −7. Při dělení záporným číslem se změní obě znaménka.', ['−21s : (−7) = 3s; −7 : (−7) = 1', '−7(3s + 1)'], {factor:true}),
    q('0,2s + 0,4t', '0.2(s+2t)', 'Společný činitel může být i desetinný: 0,2.', ['0,2s : 0,2 = s; 0,4t : 0,2 = 2t', '0,2(s + 2t)'], {factor:true}),
    q('10n − 5m + 15n', '5(5n-m)', 'Nejdřív sluč 10n + 15n. Potom vytkni 5.', ['25n − 5m', '5(5n − m)'], {factor:true})
  ], paper: [q('12x − 8y', '4(3x-2y)', '', ['12x : 4 = 3x; −8y : 4 = −2y', '4(3x − 2y)'], {factor:true}), q('6ab + 3a', '3a(2b+1)', '', ['6ab = 3a · 2b; 3a = 3a · 1', '3a(2b + 1)'], {factor:true})] },
  { id: 'divide', name: 'Rozdělovna', short: 'Dělení', icon: '÷', color: 'pink', mission: 'Každý člen dostane stejný dělitel.', intro: 'Dělíme mnohočlen jednočlenem. Vyděl každý člen zvlášť a zachovej znaménka. Původní dělitel se nikdy nesmí rovnat nule.', rule: '(12xy − 6y) : 3y = 4x − 2, pro y ≠ 0.', badge: 'Rozdělovna', examples: [
    { terms: [[6,'x'],[9,'']], divisor: [3,''], condition: '' },
    { terms: [[12,'xy'],[-6,'y']], divisor: [3,'y'], condition: 'y' },
    { terms: [[8,'x'],[-4,'']], divisor: [-2,''], condition: '' },
    { terms: [[6,'r'],[21,'s'],[-15,'']], divisor: [3,''], condition: '' }
  ], exercises: [
    q('(6x + 9) : 3', '2x+3', 'Trojkou vyděl 6x i číslo 9.', ['6x : 3 + 9 : 3', '2x + 3'], {mistakes:[['2x+9','Dělíš celý mnohočlen. Také 9 se musí vydělit třemi.']]}),
    q('(12u + 48v) : 12', 'u+4v', '12u : 12 = 1u = u. První člen nezmizí.', ['12u : 12 + 48v : 12', 'u + 4v']),
    q('(4,5s − 5t) : (−1)', '-4.5s+5t', 'Dělení −1 obrátí znaménko každého členu.', ['4,5s : (−1) − 5t : (−1)', '−4,5s + 5t']),
    q('(36p + 9q) : 6', '6p+1.5q', '9 : 6 = 1,5. Výsledkem nemusí být celé číslo.', ['36p : 6 + 9q : 6', '6p + 1,5q']),
    q('(6r + 21s − 15) : 3', '2r+7s-5', 'Vyděl všechny tři členy včetně čísla −15.', ['6r : 3 + 21s : 3 − 15 : 3', '2r + 7s − 5']),
    q('12xy : 3y', '4x', '12 : 3 = 4 a y : y = 1. Dělitel 3y nesmí být nula.', ['(12 : 3) · x · (y : y)', '4x, pro y ≠ 0'], {condition:'y'}),
    q('(36ab + 9a) : 6a', '6b+1.5', 'Vyděl i druhý člen: 9a : 6a = 1,5. Podmínka a ≠ 0 platí dál.', ['36ab : 6a + 9a : 6a', '6b + 1,5, pro a ≠ 0'], {condition:'a'}),
    q('(21x − 70yx − 14xyz) : 7x', '3-10y-2yz', 'V každém členu zkrať společný nenulový činitel 7x. x nesmí být nula.', ['21x : 7x − 70yx : 7x − 14xyz : 7x', '3 − 10y − 2yz, pro x ≠ 0'], {condition:'x'})
  ], paper: [q('(15x − 10y + 5) : 5', '3x-2y+1', '', ['15x : 5 − 10y : 5 + 5 : 5', '3x − 2y + 1']), q('(18ab − 6a) : 3a', '6b-2', '', ['18ab : 3a − 6a : 3a', '6b − 2, pro a ≠ 0'], {condition:'a'})] }
];
workshops.forEach(w => w.exercises.forEach((e, index) => { e.id = `${w.id}-${index}`; e.level = index < 2 ? 'Rozjezd' : index < 5 ? 'Další krok' : 'Výzva'; }));
export const glossary = [
  ['Proměnná', 'Písmeno zastupuje číslo. Výraz 3x znamená 3 · x.'],
  ['Člen', 'Jedna část součtu nebo rozdílu, včetně svého znaménka. Výraz 2xy − 3 má členy 2xy a −3. Násobení člen nerozděluje.'],
  ['Koeficient', 'Číslo násobící proměnné. U −3xy je to −3, u x je to 1, u −x je to −1.'],
  ['Stejné členy', 'Mají přesně stejné proměnné se stejnými mocninami: 2ab a −5ba ano; 2a a 2a² ne.'],
  ['Mocnina', 'x² znamená x · x. Neznamená 2 · x. Proto x + x = 2x, ale x · x = x².'],
  ['Mnohočlen', 'Součet členů, například 2x² − 3x + 1. Jednočlen má jeden člen, dvojčlen dva, trojčlen tři.'],
  ['Opačný výraz', 'Vznikne vynásobením všech členů číslem −1. Součet výrazu a jeho opaku je nula.'],
  ['Podmínka při dělení', 'Dělitel musí být nenulový. Při dělení 3y platí y ≠ 0, i když po zkrácení y ve výsledku zmizí.']
];

// A guided step always preserves the value from `before` to `after`.
// Choices ask one small question; explanation is shown on request or after success.
const step = (title, before, after, question, choices, correct, explanation, visual = null) => ({title,before,after,question,choices,correct,explanation,visual});
const lesson = (id,title,steps) => ({id,title,steps});
export const foundations = lesson('signs','Nejdřív jen čísla a znaménka',[
  step('Znaménko čísla a odčítání nejsou totéž.','5 − 3','(+5) + (−3)','Co znamená „od pěti odečti tři“?',['K pěti přičti −3.','K pěti přičti +3.','Z pěti udělej −5.'],0,'Minus mezi dvěma výrazy je pokyn k odčítání. Můžeme ho nahradit přičtením opačného čísla. Na ose jdeme z 5 o tři doleva a dojdeme na 2.',{kind:'line',from:5,to:2,label:'Od 5 o tři doleva'}),
  step('Minus před číslem říká: vezmi opak.','−(+3)','(−1) · (+3)','Jaký je opak čísla +3?',['0','−3','+3'],1,'Opak +3 je −3. Jsou stejně daleko od nuly, ale na opačné straně. Vynásobení číslem −1 udělá přesně toto otočení.',{kind:'line',from:3,to:-3,label:'Z +3 na jeho opak −3'}),
  step('Záporné číslo má také svůj opak.','−(−3)','(+3)','Jaký je opak čísla −3?',['−6','−3','+3'],2,'Opak −3 je +3: −3 + 3 = 0. Proto −(−3) = +3. Dvě mínus tady znamenají, že hledáme opak záporného čísla.',{kind:'line',from:-3,to:3,label:'Z −3 na jeho opak +3'}),
  step('Proč záporné krát záporné dává kladné?','(−3) · (−2)','−(3 · (−2))','Tři kopie −2 dávají −6. Jaký je opak −6?',['+6','−6','0'],0,'Nejdřív 3 · (−2) = −6. Násobit −3 znamená vzít opak tohoto výsledku: −(−6) = +6. Znaménka tedy nejsou kouzlo: dvakrát hledáme opak.',{kind:'signs',pieces:['3 · (−2) = −6','opak −6 je +6'],result:'(−3) · (−2) = +6'})
]);
export const walkthroughs = {
  combine:[lesson('same-terms','Co sčítám: počty, nebo proměnné?',[
    step('Samotné x má schovanou jedničku.','x','(+1) · x','Kolikrát je x v samotném zápisu x?',['Jednou.','Nulakrát.','To nejde poznat.'],0,'Jedničkou můžeme násobit, aniž se hodnota změní. Proto 1 · x zkracujeme na x. Písmeno stále zastupuje číslo.',{kind:'parts',pieces:['+1','x'],labels:['kolikrát','co násobím'],result:'(+1) · x'}),
    step('Dvě x jsou dvě kopie téhož čísla.','x + x','2 · x','Když sečtu x a x, dostanu…',['x²','2x','2'],1,'Přidávám dvě kopie x. Je to stejný rozdíl jako 3 + 3 = 2 · 3. Naproti tomu x · x píšeme x².',{kind:'copies',pieces:['x','x'],result:'2 · x'}),
    step('Sčítáme počty stejných členů.','3x + 2x','(3 + 2) · x','Co se sečte ve výrazu 3x + 2x?',['3 + 2, proměnná x zůstane.','x + x se změní na x².','3x a 2x se vynásobí.'],0,'Tři kopie x a dvě kopie x dohromady tvoří pět kopií. Koeficienty se sečtou, x se nemění.',{kind:'copies',pieces:['x','x','x','x','x'],result:'5x'}),
    step('Znaménko patří k počtu kopií.','3x − x','((+3) + (−1)) · x','Kolik je (+3) + (−1)?',['4','−2','2'],2,'−x znamená (−1) · x. Počítáme 3 − 1 = 2, takže zbude 2x. Dvě stejné proměnné nesčítáme na mocninu.',{kind:'parts',pieces:['+3','−1'],labels:['první koeficient','druhý koeficient'],result:'(+3) + (−1) = 2'})
  ])],
  minus:[lesson('hidden-one','Co je schovaného v −x?',[
    step('Neviditelná jednička.','−x','(−1) · x','Jaké číslo násobí x ve výrazu −x?',['−1','0','+1'],0,'−x je zkrácený zápis (−1) · x. Nula krát x by byla nula. Plus jedna krát x by zůstalo x.',{kind:'parts',pieces:['−1','x'],labels:['koeficient','proměnná'],result:'(−1) · x'}),
    step('I plus můžeme napsat výslovně.','(−1) · x','(−1) · (+x)','Změní připsání plus před x jeho hodnotu?',['Ano, vždy z něj udělá kladné číslo.','Ne. +x má stejnou hodnotu jako x.','Ano, přičte k x jedničku.'],1,'+x znamená (+1) · x. Neříká, že x je kladné! Když x = −3, pak +x = −3 a −x = +3.',{kind:'mirror'}),
    step('Záporný koeficient obrací hodnotu x.','−x','(−1) · x','Když x = −3, kolik je −x?',['−3','0','+3'],2,'Dosadíme: (−1) · (−3) = +3. Zápis −x tedy nemusí mít zápornou hodnotu. Minus říká, že bereme opak hodnoty x.',{kind:'mirror',value:-3})
  ]),lesson('minus-plus','Proč −(x + 3) = −x − 3?',[
    step('Minus před závorkou je násobení −1.','−(x + 3)','(−1) · (x + 3)','Jaké násobení je schované před celou závorkou?',['× 0','× (−1)','× (+1)'],1,'Celý součet x + 3 má dostat opačnou hodnotu. Zápis −1 · (x + 3) říká totéž, ale vidíme v něm násobení.'),
    step('Odkryj znaménka obou členů.','(−1) · (x + 3)','(−1) · ((+x) + (+3))','Které dva členy jsou uvnitř?',['+x a +3','−x a +3','+x a −3'],0,'Uvnitř je součet +x a +3. Zatím jsme nic nepřepočítali — jen doplnili znaménka, která se běžně nepíšou.',{kind:'parts',pieces:['+x','+3'],labels:['první člen','druhý člen'],operator:'+',result:'(+x) + (+3)'}),
    step('−1 násobí každý člen zvlášť.','(−1) · ((+x) + (+3))','(−1) · (+x) + (−1) · (+3)','Co se musí vynásobit číslem −1?',['Jen x.','Jen 3.','x i 3.'],2,'Roznásobení znamená, že činitel před závorkou dostane každý člen uvnitř. Proto máme dvě násobení, propojená sčítáním.',{kind:'distribute',factor:'−1',members:['+x','+3'],products:['(−1) · (+x)','(−1) · (+3)']}),
    step('Vypočítej každé násobení.','(−1) · (+x) + (−1) · (+3)','(−1) · x + (−3)','Kolik je (−1) · (+3)?',['−3','+3','−2'],0,'Číselný součin −1 · 3 je −3. U prvního členu zůstává koeficient −1 a proměnná x. Jeho hodnotu bez dosazení x neznáme.',{kind:'parts',pieces:['−1','+3'],labels:['první číslo','druhé číslo'],result:'(−1) · (+3) = −3'}),
    step('Teprve teď zkrať zápis.','(−1) · x + (−3)','−x − 3','Který zápis říká totéž jako (−1) · x + (−3)?',['−x + 3','−x − 3','x − 3'],1,'(−1) · x zkrátíme na −x. Přičíst −3 můžeme napsat jako odečíst 3. Žádný člen se neztratil.')
  ]),lesson('minus-minus','A co −(x − 3)?',[
    step('Odčítání přepiš na přičtení opaku.','−(x − 3)','(−1) · ((+x) + (−3))','Jaký je druhý člen uvnitř závorky?',['+3','−1','−3'],2,'Výraz x − 3 je součet +x a −3. Vnější minus je další samostatná operace: násobení celé závorky číslem −1.'),
    step('Roznásob i záporný člen.','(−1) · ((+x) + (−3))','(−1) · (+x) + (−1) · (−3)','Kolik je (−1) · (−3)?',['+3','−3','−4'],0,'Hledáme opak −3, tedy +3. Druhý člen po roznásobení bude kladná trojka.',{kind:'distribute',factor:'−1',members:['+x','−3'],products:['−x','+3']}),
    step('Zapiš oba výsledky.','(−1) · (+x) + (−1) · (−3)','−x + 3','Co zůstane po odstranění závorky?',['−x − 3','−x + 3','x + 3'],1,'První člen je −x. Druhý člen je +3. Změnila se znaménka obou členů, protože oba jsme násobili −1.')
  ])],
  distribute:[lesson('positive-copies','Nejdřív tři stejné balíčky',[
    step('Násobení třemi znamená tři kopie.','3(x + 2)','(x + 2) + (x + 2) + (x + 2)','Kolikrát je v těch třech balíčcích číslo 2?',['Jednou.','Třikrát.','Šestkrát.'],1,'Každý balíček obsahuje x a 2. Když vezmu tři balíčky, vezmu třikrát x a třikrát dvojku.',{kind:'copies',pieces:['x + 2','x + 2','x + 2'],result:'3 · x + 3 · 2'}),
    step('Obě části dostanou stejný násobitel.','3(x + 2)','3 · x + 3 · 2','Kolik je 3 · 2?',['5','2','6'],2,'Násobíme x i 2. Proto bude výsledek 3x + 6. Dvojka nemůže zůstat beze změny.',{kind:'distribute',factor:'+3',members:['+x','+2'],products:['3x','+6']})
  ]),lesson('negative-monomial','Rozkresli −4x(5 − x)',[
    step('Najdi skryté násobení.','−4x(5 − x)','((−4) · x) · (5 − x)','Co násobí celou závorku?',['Jen −4.','Celý člen −4x.','Jen x.'],1,'Mezi −4 a x je násobení. Další násobení je mezi členem −4x a závorkou. Celý činitel −4x musí dostat každý člen uvnitř.',{kind:'parts',pieces:['−4','x'],labels:['číselný koeficient','proměnná'],result:'−4x = (−4) · x'}),
    step('Přepiš rozdíl jako součet členů.','((−4) · x) · (5 − x)','((−4) · x) · ((+5) + ((−1) · x))','Jak zapíšeme samotný člen −x?',['(−1) · x','(+1) · x','(−4) · x'],0,'Uvnitř jsou dva členy: +5 a −x. Ten druhý je (−1) · x. −1 patří k vnitřnímu x; −4 patří k činiteli před závorkou.'),
    step('Rozděl násobení do dvou větví.','−4x(5 − x)','(−4x) · (+5) + (−4x) · (−x)','Které dvě násobení potřebujeme?',['−4x · 5 a −4x · (−x)','−4x · 5 a samotné −x','−4 · 5 a x · x'],0,'Oba členy uvnitř se násobí celým −4x. Mezi výslednými součiny je plus: sčítáme výsledky obou větví.',{kind:'distribute',factor:'−4x',members:['+5','−x'],products:['(−4x) · (+5)','(−4x) · (−x)']}),
    step('První větev: čísla a proměnná zvlášť.','(−4x) · (+5) + (−4x) · (−x)','((−4) · (+5)) · x + (−4x) · (−x)','Kolik je (−4) · (+5)?',['+20','−9','−20'],2,'V první větvi násobíme −4 a +5: dostaneme −20. Proměnná x zůstane jednou, takže první člen je −20x.',{kind:'parts',pieces:['−4','+5'],labels:['koeficient zvenku','číslo zevnitř'],result:'(−4) · (+5) = −20'}),
    step('Druhá větev: odhal −1 u −x.','−20x + (−4x) · (−x)','−20x + ((−4) · (−1)) · (x · x)','Kolik je (−4) · (−1)?',['−4','+4','−5'],1,'Čísla násobíme spolu: −4 · (−1) = +4, protože bereme opak −4. Proměnné násobíme také spolu: x · x. Nejde o sčítání x + x.',{kind:'split',groups:[{label:'Čísla',expression:'(−4) · (−1)',result:'+4'},{label:'Proměnné',expression:'x · x',result:'x²'}]}),
    step('Součin x · x je druhá mocnina.','−20x + ((−4) · (−1)) · (x · x)','−20x + 4x²','Jak se zkrátí x · x?',['2x','x','x²'],2,'x · x píšeme x². Celý výsledek je −20x + 4x². Tyto členy nesloučíme: jeden má x, druhý x². Pořadí můžeme obrátit na 4x² − 20x.',{kind:'split',groups:[{label:'První větev',expression:'(−4x) · (+5)',result:'−20x'},{label:'Druhá větev',expression:'(−4x) · (−x)',result:'+4x²'}]})
  ])],
  multiply:[lesson('four-products','Každý člen s každým, opravdu po jednom',[
    step('Rozděl druhou závorku na členy.','(x + 2)(x − 3)','(x + 2)((+x) + (−3))','Jaký je druhý člen druhé závorky?',['−3','+3','−x'],0,'Znaménko patří ke členu: druhá závorka obsahuje +x a −3. Než začneme násobit, rozpoznáme tyto dva členy.'),
    step('První x násobí celou druhou závorku.','(x + 2)(x − 3)','x · (x − 3) + 2 · (x − 3)','Kolikrát musíme použít celou druhou závorku v tomto rozpisu?',['Jednou.','Dvakrát: pro x a pro 2.','Třikrát.'],1,'První závorka má dva členy. Každý z nich násobí celou druhou závorku.',{kind:'distribute',factor:'(x − 3)',members:['x','+2'],products:['x · (x − 3)','2 · (x − 3)']}),
    step('Každou malou závorku roznásob.','x · (x − 3) + 2 · (x − 3)','x · x + x · (−3) + 2 · x + 2 · (−3)','Kolik je 2 · (−3)?',['+6','−1','−6'],2,'Vznikly čtyři součiny. Jsou to x², −3x, +2x a −6. Znaménka počítáme v každém součinu zvlášť.'),
    step('Nakonec sluč jen stejné druhy.','x² − 3x + 2x − 6','x² − x − 6','Které dva členy můžeme sloučit?',['x² a −6','−3x a +2x','x² a +2x'],1,'Koeficienty u x jsou −3 a +2. Jejich součet je −1. Proto zůstane −x; x² a −6 se nemění.')
  ])],
  factor:[lesson('reverse-products','Vytýkání: najdi stejné násobení',[
    step('Oba členy rozepiš jako součiny.','6x + 9','3 · (2x) + 3 · (+3)','Který činitel je v obou součinech?',['3','x','2x'],0,'6x můžeme napsat jako 3 · 2x a 9 jako 3 · 3. V obou členech je stejná trojka.',{kind:'split',groups:[{label:'První člen',expression:'6x',result:'3 · 2x'},{label:'Druhý člen',expression:'+9',result:'3 · (+3)'}]}),
    step('Společnou trojku napiš jednou před závorku.','3 · (2x) + 3 · (+3)','3(2x + 3)','Co zůstane v závorkách?',['6x + 9','2x + 3','2x + 9'],1,'V každém členu vyjmeme násobení třemi. Zůstane 2x a +3. Je to roznásobování pozpátku.'),
    step('Ověř oba členy zpětným násobením.','3(2x + 3)','6x + 9','Jak ověříme vytknutí?',['Znovu závorku roznásobíme.','Vynásobíme jen první člen.','Závorku vymažeme.'],0,'3 · 2x = 6x a 3 · 3 = 9. Dostali jsme oba původní členy, takže vytknutí sedí.',{kind:'distribute',factor:'+3',members:['2x','+3'],products:['6x','+9']})
  ])],
  divide:[lesson('divide-each','Dělení: čísla a proměnné zvlášť',[
    step('Nejdřív podmínka.','(12xy − 6y) : (3y)','(12xy − 6y) : (3y)','Kdy nesmíme dělit číslem 3y?',['Když y = 1.','Když y = 0.','Když y = −1.'],1,'Pokud y = 0, pak 3y = 0. Nulou dělit nejde. Po celou dobu proto platí y ≠ 0. I když se y později zkrátí.'),
    step('Dělitele dostane každý člen.','(12xy − 6y) : (3y)','(12xy) : (3y) + (−6y) : (3y)','Co se dělí jednočlenem 3y?',['Jen 12xy.','Jen −6y.','Oba členy.'],2,'Celý součet dělíme stejným nenulovým dělitelem. Zachováme i znaménko − u druhého členu.',{kind:'split',groups:[{label:'První člen',expression:'12xy : 3y',result:'4x'},{label:'Druhý člen',expression:'−6y : 3y',result:'−2'}]}),
    step('Společný nenulový činitel y se zkrátí.','(12xy) : (3y) + (−6y) : (3y)','(12 : 3) · x + ((−6) : 3)','Kolik je y : y, když y ≠ 0?',['0','1','y'],1,'Stejné nenulové číslo dělené sebou je 1. V první části zůstane x, protože ve jmenovateli žádné x nebylo. Podmínka y ≠ 0 stále platí.'),
    step('Dopočítej číselné koeficienty.','(12 : 3) · x + ((−6) : 3)','4x − 2','Kolik je (−6) : (+3)?',['−2','+2','−3'],0,'12 : 3 = 4. Číslo −6 dělené 3 je −2, protože (−2) · 3 = −6. Výsledek je 4x − 2, pro y ≠ 0.')
  ])]
};
