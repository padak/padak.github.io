import test from 'node:test';
import assert from 'node:assert/strict';
import {parse,equal,format,checkAnswer,isCollected} from '../mnohocleny/algebra.mjs';
import {workshops} from '../mnohocleny/content.mjs';

test('all sixty authored identities hold and every exercise accepts its canonical answer',()=>{
  assert.equal(workshops.length,6);
  assert.equal(workshops.flatMap(w=>w.exercises).length,48);
  assert.equal(workshops.flatMap(w=>w.paper).length,12);
  const ids=new Set();
  for(const w of workshops) for(const e of [...w.exercises,...w.paper]) {
    assert.ok(equal(parse(e.prompt.replace(/\[/g,'(').replace(/\]/g,')')),parse(e.answer)),e.prompt);
    if(e.id){assert.ok(!ids.has(e.id));ids.add(e.id);}
    assert.ok(checkAnswer(e.answer,e,e.condition||'').ok,e.prompt);
    assert.ok(e.steps.length>0);
  }
});

test('independent hand-calculated polynomial maps cover signs, powers, distribution and division',()=>{
  const cases=[
    ['(3x+2)-(x-4)',{x:2,'':6}],
    ['8z-[6z-(2z-3)]'.replace(/\[/g,'(').replace(/\]/g,')'),{z:4,'':-3}],
    ['-4(3u-v)',{u:-12,v:4}],
    ['(x+2)(x+3)',{xx:1,x:5,'':6}],
    ['(x-5)(y-2z+1)',{xy:1,xz:-2,x:1,y:-5,z:10,'':-5}],
    ['-2a(3ab-a+2)',{aab:-6,aa:2,a:-4}],
    ['12xy:3y',{x:4}],
    ['(36ab+9a):6a',{b:6,'':1.5}],
    ['(21x-70yx-14xyz):7x',{'':3,y:-10,yz:-2}],
    ['abc+bc',{abc:1,bc:1}],
    ['-x^2',{xx:-1}],['(-x)^2',{xx:1}],['2^0',{'':1}],
    ['0,5m+1,5m-m',{m:1}],['4a-4a+2-5',{'':-3}]
  ];
  for(const [input,expected] of cases) assert.deepEqual(parse(input),expected,input);
});

test('wrong answers are rejected and misconception hints are specific',()=>{
  for(const w of workshops) for(const e of w.exercises) for(const [answer,message] of e.mistakes||[]){
    const result=checkAnswer(answer,e,e.condition||'');
    assert.equal(result.ok,false,e.prompt);assert.equal(result.message,message);
  }
  const e=workshops[1].exercises[2];
  assert.equal(checkAnswer('2x-2',e).ok,false);
  assert.equal(checkAnswer('6+2x',e).ok,true);
  assert.equal(checkAnswer('3x+2-x+4',e).ok,false);
  assert.equal(checkAnswer('2(x+3)',e).ok,false);
});

test('division conditions survive cancellation, and extra-domain answers are rejected',()=>{
  for(const e of workshops[5].exercises.filter(e=>e.condition)){
    for(const c of ['', 'none','zero','positive']) assert.equal(checkAnswer(e.answer,e,c).ok,false);
    assert.equal(checkAnswer(e.answer,e,e.condition).ok,true);
  }
  assert.equal(checkAnswer('8x+y/y-1',workshops[0].exercises[0]).ok,false);
  assert.equal(checkAnswer('8x/(x-x)',workshops[0].exercises[0]).ok,false);
});

test('factoring requires a genuine monomial factor and accepts equivalent signs',()=>{
  const e=workshops[4].exercises[0];
  assert.equal(checkAnswer('6x+9',e).ok,false);
  assert.equal(checkAnswer('1(6x+9)',e).ok,false);
  assert.equal(checkAnswer('-1(-6x-9)',e).ok,false);
  assert.equal(checkAnswer('-3(-2x-3)',e).ok,true);
  assert.equal(checkAnswer('3*(3+2x)',e).ok,true);
  assert.equal(checkAnswer('3(2x+9)',e).ok,false);
  assert.equal(checkAnswer('3+3(2x+2)',e).ok,false);
});

test('safe bounded input parser rejects code, malformed syntax, zero denominators and large powers',()=>{
  for(const text of ['', 'alert("x")','<img src=x>','2x+','(x+2','x)','x/0','x^100','x^(2+1)','3..2x','x=2','1'.repeat(181)])
    assert.throws(()=>parse(text),undefined,text);
  // Letters are only variables, never function names or executable code.
  assert.deepEqual(parse('alert(1)'), {aelrt:1});
  for(const text of ['(x-x)^0','x^0','(x+1)^0']) assert.throws(()=>parse(text));
  assert.equal(checkAnswer('3x+6x^0',workshops[2].exercises[0]).ok,false);
  assert.throws(()=>parse('(a+b+c+d+e+f+g+h+i+j)^6'));
  assert.equal(isCollected('x+x'),false);
  assert.equal(isCollected('xy+yx'),false);
  assert.equal(isCollected('2xy+x²'),true);
  assert.equal(format(parse('x-x')),'0');
});

test('all discovery examples produce the intended kind of mathematical result',()=>{
  const combine=workshops[0];
  assert.equal(format(combine.examples[0].reduce((out,[n,k])=>({...out,[k]:(out[k]||0)+n}),{})),'2x + 4');
  for(const ex of workshops[4].examples){
    for(const [n,k] of ex.terms){
      const d=parse(`(${n}${k}):(${ex.factor[0]}${ex.factor[1]})`);
      assert.ok(Object.values(d).every(Number.isInteger));
    }
  }
});
