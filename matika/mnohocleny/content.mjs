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
