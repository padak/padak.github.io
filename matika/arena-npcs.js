import * as THREE from './vendor/three.module.js';
import { CELL, ZONE_ROWS } from './arena-maze.js';

// A mesh caricature inspired by the reference: curls, strong brows, long nose,
// khaki shirt and hiking backpack. No photographic texture is used.
export class StationGuides {
  constructor(scene) {
    this.scene=scene;this.characters=[];this.hitMeshes=[];
    this.sphere=new THREE.SphereGeometry(1,12,10);
    this.cube=new THREE.BoxGeometry(1,1,1);
    this.materials={
      skin:new THREE.MeshStandardMaterial({color:0xb4b98c,roughness:1}),
      nose:new THREE.MeshStandardMaterial({color:0xc5b393,roughness:1}),
      hair:new THREE.MeshStandardMaterial({color:0x292329,roughness:1}),
      shirt:new THREE.MeshStandardMaterial({color:0x555d49,roughness:1}),
      trousers:new THREE.MeshStandardMaterial({color:0x354455,roughness:1}),
      straps:new THREE.MeshStandardMaterial({color:0x9aa6a1,roughness:1}),
      pack:new THREE.MeshStandardMaterial({color:0x273135,roughness:1}),
      eyes:new THREE.MeshBasicMaterial({color:0xfff3df}),
      pupils:new THREE.MeshBasicMaterial({color:0x342925}),
      mouth:new THREE.MeshStandardMaterial({color:0x785752,roughness:1}),
      badge:new THREE.MeshBasicMaterial({color:0x94ebc1}),
      hit:new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false})
    };
  }
  part(parent,kind,color,scale,position) {
    const mesh=new THREE.Mesh(kind==='box'?this.cube:this.sphere,this.materials[color]);
    mesh.scale.set(...scale);mesh.position.set(...position);parent.add(mesh);return mesh;
  }
  makeCharacter() {
    const root=new THREE.Group(),body=new THREE.Group();root.add(body);
    this.part(body,'sphere','shirt',[.34,.46,.23],[0,1.05,0]);
    this.part(body,'box','pack',[.55,.66,.26],[0,1.1,-.28]);
    const eyes=[];
    for(const side of [-1,1]){
      this.part(body,'box','straps',[.065,.66,.07],[side*.22,1.15,.22]).rotation.z=side*.12;
      this.part(body,'box','shirt',[.15,.15,.06],[side*.12,1.4,.24]).rotation.z=side*-.4;
    }
    this.part(body,'sphere','skin',[.12,.18,.12],[0,1.5,0]);
    this.part(body,'box','badge',[.11,.1,.025],[.16,1.11,.246]);
    const head=new THREE.Group();head.position.set(0,1.84,0);body.add(head);
    this.part(head,'sphere','skin',[.37,.45,.3],[0,0,0]);
    this.part(head,'sphere','skin',[.29,.18,.25],[0,-.28,.06]);
    for(const side of [-1,1]){
      this.part(head,'sphere','skin',[.115,.18,.085],[side*.36,-.015,0]);
      this.part(head,'sphere','nose',[.065,.12,.04],[side*.4,-.025,.045]);
      eyes.push(this.part(head,'sphere','eyes',[.12,.075,.052],[side*.145,.045,.267]));
      this.part(head,'sphere','pupils',[.041,.048,.025],[side*.14,.045,.313]);
      this.part(head,'box','hair',[.22,.055,.055],[side*.15,.15,.287]).rotation.z=side*-.2;
      this.part(head,'sphere','nose',[.12,.09,.07],[side*.19,-.105,.255]);
    }
    this.part(head,'sphere','nose',[.085,.16,.12],[0,-.045,.29]).rotation.x=-.22;
    this.part(head,'sphere','nose',[.115,.074,.11],[0,-.135,.35]);
    const mouth=this.part(head,'sphere','mouth',[.17,.058,.038],[0,-.257,.284]);
    const teeth=this.part(head,'box','eyes',[.21,.045,.026],[0,-.23,.322]);teeth.visible=false;
    this.part(head,'sphere','nose',[.17,.025,.03],[0,-.225,.29]);
    // Uneven, chunky curls create the silhouette instead of a smooth helmet.
    this.part(head,'sphere','hair',[.37,.25,.31],[0,.3,-.04]);
    for(let ring=0;ring<3;ring++)for(let i=0;i<11;i++){
      const angle=i/11*Math.PI*2+ring*.27,spread=ring===2?.14:.31;
      const curl=this.part(head,'sphere','hair',[.115,.12,.105],[Math.cos(angle)*spread,.24+ring*.105+Math.sin(i*2.3)*.025,Math.sin(angle)*spread-.02]);
      curl.rotation.z=i*.7;
    }
    for(const side of [-1,1])this.part(head,'sphere','hair',[.105,.2,.14],[side*.33,.14,-.06]);
    const arms=[],legs=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.38,1.3,0);body.add(arm);
      this.part(arm,'sphere','shirt',[.13,.2,.14],[0,-.12,0]);
      this.part(arm,'sphere','skin',[.09,.22,.09],[0,-.42,.06]);
      this.part(arm,'sphere','skin',[.11,.11,.085],[0,-.61,.09]);arms.push(arm);
      const leg=new THREE.Group();leg.position.set(side*.17,.72,0);root.add(leg);
      this.part(leg,'sphere','trousers',[.135,.34,.13],[0,-.28,0]);
      this.part(leg,'sphere','pack',[.15,.1,.24],[0,-.61,.1]);legs.push(leg);
    }
    const hit=this.part(root,'box','hit',[1,2.6,.95],[0,1.3,0]);
    return {root,body,head,arms,legs,hit,eyes,mouth,teeth};
  }
  populate(model) {
    this.clear();this.model=model;
    for(let stage=0;stage<model.gateCount;stage++){
      const col=3,row=stage*ZONE_ROWS+1;
      const neighbours=[[0,1],[1,0],[-1,0],[0,-1]];
      const [dc,dr]=neighbours.find(([c,r])=>model.has(col+c,row+r));
      const a=new THREE.Vector3((col-4)*CELL,0,-row*CELL);
      const b=a.clone().add(new THREE.Vector3(dc*CELL,0,-dr*CELL));
      const character={...this.makeCharacter(),stage,a,b,progress:0,direction:1,phase:stage*1.7,reaction:0,laughTime:0,fleeTime:0,escapePath:[],escapeIndex:0,runDelay:0};
      character.root.position.copy(a);character.root.rotation.y=Math.PI;
      character.hit.userData.npc=character;this.scene.add(character.root);
      this.characters.push(character);this.hitMeshes.push(character.hit);
    }
  }
  tickle(character,player) {
    if(character.fleeTime>0)return false;
    character.laughTime=4.3;character.fleeTime=8;character.runDelay=.65;
    let best=[],score=-Infinity;
    // Pick a reachable destination farther from the player, inside this sector.
    // A short route allows the guide to escape around a corner, then calm down.
    const offset=character.stage*ZONE_ROWS;
    for(let row=offset+1;row<=offset+5;row++)for(let col=1;col<=7;col++){
      if(!this.model.has(col,row))continue;
      const goal={x:(col-4)*CELL,z:-row*CELL};
      const path=this.model.pathToGoal(character.stage,character.root.position.x,character.root.position.z,goal);
      if(path.length<2||path.length>7)continue;
      const distance=Math.hypot(goal.x-player.x,goal.z-player.z),value=distance+path.length*.5;
      if(value>score){score=value;best=path;}
    }
    character.escapePath=best;character.escapeIndex=0;return true;
  }
  canTalk(character){return character.fleeTime<=0;}
  resumePatrol(character) {
    const position=character.root.position,{col,row}=this.model.cellAt(position.x,position.z);
    character.a=position.clone();
    const offset=character.stage*ZONE_ROWS;
    const next=[[0,1],[1,0],[-1,0],[0,-1]].find(([dc,dr])=>row+dr>=offset&&row+dr<=offset+6&&this.model.has(col+dc,row+dr));
    character.b=new THREE.Vector3((col+next[0]-4)*CELL,0,-(row+next[1])*CELL);
    character.progress=0;character.direction=1;character.escapePath=[];
  }
  animate(time,dt,reduced,player,walking) {
    for(const character of this.characters){
      const wasFleeing=character.fleeTime>0;
      if(walking){character.laughTime=Math.max(0,character.laughTime-dt);character.fleeTime=Math.max(0,character.fleeTime-dt);character.runDelay=Math.max(0,character.runDelay-dt);}
      if(wasFleeing&&character.fleeTime===0)this.resumePatrol(character);
      const laughing=character.laughTime>0,fleeing=character.fleeTime>0;
      const near=character.root.position.distanceTo(player)<4.5;
      const active=walking&&(fleeing||!near);
      let escape=character.escapePath[character.escapeIndex];
      if(fleeing&&walking&&escape&&character.runDelay===0){
        const p=character.root.position,delta=new THREE.Vector3(escape.x-p.x,0,escape.z-p.z),distance=delta.length();
        const step=Math.min(distance,dt*4.2);delta.normalize().multiplyScalar(step);
        this.model.move(p,delta.x,delta.z);
        if(Math.hypot(escape.x-p.x,escape.z-p.z)<.08)character.escapeIndex++;
        escape=character.escapePath[character.escapeIndex]||escape;
      }else if(active&&!fleeing&&!reduced){
        character.progress+=dt*.14*character.direction;
        if(character.progress>1){character.progress=1;character.direction=-1;}
        if(character.progress<0){character.progress=0;character.direction=1;}
        character.root.position.lerpVectors(character.a,character.b,character.progress);
      }
      const target=fleeing&&escape?escape:near?player:character.direction===1?character.b:character.a;
      character.root.rotation.y=Math.atan2(target.x-character.root.position.x,target.z-character.root.position.z);
      const swing=active&&!reduced?Math.sin(time*(fleeing?11:4)+character.phase)*(fleeing?.6:.25):0;
      character.legs.forEach((leg,i)=>{leg.rotation.x=swing*(i?1:-1);});
      character.arms.forEach((arm,i)=>{arm.rotation.x=laughing?-.8+swing*.4:swing*(i?-1:1);arm.rotation.z=laughing?(i?1:-1)*(.7+(reduced?0:Math.sin(time*15)*.14)):0;});
      character.reaction=Math.max(0,character.reaction-dt);
      character.head.rotation.z=reduced?0:laughing?Math.sin(time*17)*.16:character.reaction>0?Math.sin(character.reaction*12)*.13:0;
      character.body.rotation.z=laughing&&!reduced?Math.sin(time*13)*.12:0;
      character.body.rotation.x=fleeing?.12:0;
      character.body.position.y=reduced?0:Math.sin(time*(laughing?17:2)+character.phase)*(laughing?.045:.018);
      character.mouth.scale.y=laughing?.14:.058;character.teeth.visible=laughing;
      character.eyes.forEach(eye=>{eye.scale.y=laughing?.045:.075;});
    }
  }
  clear() {
    for(const character of this.characters)character.root.removeFromParent();
    this.characters.length=0;this.hitMeshes.length=0;
  }
}
