import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { MazeModel } from '../arena-maze.js';
import { StationGuides } from '../arena-npcs.js';

test('tickled guides flee on walkable paths, survive, and recover without opening any gates',()=>{
  const scene=new THREE.Scene(),guides=new StationGuides(scene);
  for(const seed of [0,1,17,42,12345]){
    const model=new MazeModel(12,[2,5,8,10],seed);guides.populate(model);
    const start=guides.characters.map(c=>c.root.position.clone());
    for(const c of guides.characters){
      const player=c.root.position.clone().add(new THREE.Vector3(0,1.7,4));
      assert.equal(guides.tickle(c,player),true);
      assert.equal(guides.canTalk(c),false);
      assert.equal(guides.tickle(c,player),false,'Repeated hits do not restart the escape');
    }
    for(let frame=0;frame<180;frame++){
      guides.animate(frame*.05,.05,seed===17,new THREE.Vector3(-4,1.7,0),true);
      for(const c of guides.characters)assert.ok(model.canOccupy(c.root.position.x,c.root.position.z),'NPC stays inside corridors while escaping');
    }
    guides.characters.forEach((c,i)=>{
      assert.ok(c.root.position.distanceTo(start[i])>4,'NPC actually ran away');
      assert.equal(c.root.parent,scene,'NPC remains alive and present');
      assert.equal(guides.canTalk(c),true,'NPC can talk after recovering');
      assert.equal(c.mouth.scale.y,.058,'Laughing expression resets');
    });
    assert.equal(model.opened.size,0,'Tickling never bypasses a mathematical gate');
  }
});

test('NPC reactions pause when movement is paused',()=>{
  const guides=new StationGuides(new THREE.Scene());guides.populate(new MazeModel(1,[],7));
  const character=guides.characters[0],player=new THREE.Vector3(-4,1.7,0);
  guides.tickle(character,player);
  const position=character.root.position.clone(),timer=character.fleeTime;
  guides.animate(1,1,false,player,false);
  assert.equal(character.fleeTime,timer);assert.ok(character.root.position.equals(position));
});
