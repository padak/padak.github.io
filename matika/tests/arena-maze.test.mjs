import test from 'node:test';
import assert from 'node:assert/strict';
import { MazeModel, CELL, ZONE_ROWS } from '../arena-maze.js';
import { arenaLevels, loadLevel } from '../arena-levels.js';

function follow(model,position,stage,goal) {
  const path=model.pathToGoal(stage,position.x,position.z,goal);
  assert.ok(path.length,'A route to the objective exists');
  for(const point of path){
    model.move(position,point.x-position.x,point.z-position.z);
    assert.ok(Math.hypot(position.x-point.x,position.z-point.z)<.01,'The planned route is physically walkable');
  }
}

test('100 generated mazes: every gate blocks movement until unlocked, with a route to the finish',()=>{
  for(let seed=0;seed<100;seed++){
    const model=new MazeModel(12,[2,5,8,10],seed),position={x:-4,z:0};
    assert.ok(model.canOccupy(position.x,position.z));
    for(let stage=0;stage<12;stage++){
      follow(model,position,stage,model.goal(stage));
      const goal={x:0,z:-(stage+1)*ZONE_ROWS*CELL};
      assert.equal(model.pathToGoal(stage,position.x,position.z,goal).length,0,'Closed gates prevent reaching the next sector');
      const gates=model.gates.filter(g=>g.stage===stage);
      for(const gate of gates){
        const probe={x:gate.x,z:gate.z+1};
        model.move(probe,0,-100);
        assert.ok(probe.z>gate.z,'Even a large step cannot tunnel through a gate');
      }
      const chosen=gates[seed%gates.length];model.unlock(stage,chosen.index);
      assert.equal(gates.filter(g=>model.opened.has(g)).length,1,'Only the selected branch opens');
      follow(model,position,stage,goal);
      assert.ok(model.passedGate(stage,position.z));
    }
    follow(model,position,11,{x:0,z:-12*ZONE_ROWS*CELL-CELL});
    // All selected gates remain open when backtracking to the original spawn.
    follow(model,position,0,{x:-4,z:0});
    assert.equal(model.opened.size,12);
  }
});

test('maze size follows question count, including the supported limits',()=>{
  for(const count of [1,4,24]){
    const model=new MazeModel(count,[],17),position={x:-4,z:0};
    for(let stage=0;stage<count;stage++){
      follow(model,position,stage,model.goal(stage));model.unlock(stage,2);
      follow(model,position,stage,{x:0,z:-(stage+1)*ZONE_ROWS*CELL});
    }
    assert.equal(model.gates.length,count);
    follow(model,position,count-1,{x:0,z:-count*ZONE_ROWS*CELL-CELL});
  }
});

test('only authored levels load; malformed future question modules fail clearly',()=>{
  assert.equal(loadLevel('percentages').questions.length,12);
  assert.throws(()=>loadLevel('level-2'),/unavailable/);
  const fixture={id:'test-fixture',available:true,createQuestions:()=>null};
  arenaLevels.push(fixture);
  try{
    assert.throws(()=>loadLevel(fixture.id),/1–24/);
    fixture.createQuestions=()=>[{text:'Fixture',skill:'Fixture',hint:'Fixture',explanation:'Fixture',options:[{label:'A',correct:true},{label:'A',correct:false},{label:'B',correct:false}]}];
    assert.throws(()=>loadLevel(fixture.id),/Invalid arena/);
  }finally{arenaLevels.pop();}
});
