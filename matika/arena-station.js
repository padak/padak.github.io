import * as THREE from './vendor/three.module.js';
import { CELL, ZONE_ROWS, COLUMNS } from './arena-maze.js';

export const directions=['↖ VLEVO','↑ ROVNĚ','↗ VPRAVO'];

// Painted metal, brushed grain, recessed seams, rivets, grime and scuffs.
// Seeded locally so visual detail never changes the exercise random generator.
function panelTexture(floor=false,bump=false) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');let seed=41;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle=bump?'#a0a0a0':floor?'#87929a':'#c1c7c9';ctx.fillRect(0,0,512,512);
  for(let i=0;i<12000;i++) {
    const v=Math.floor(random()*55+120);ctx.fillStyle=`rgba(${v},${v},${v},${bump?.12:.09})`;
    ctx.fillRect(random()*512,random()*512,random()*22+1,1);
  }
  for(let row=0;row<2;row++)for(let col=0;col<2;col++) {
    const x=col*256,y=row*256;
    ctx.strokeStyle=bump?'#303030':'#535e65';ctx.lineWidth=7;ctx.strokeRect(x+3,y+3,250,250);
    ctx.strokeStyle=bump?'#c8c8c8':'#d6ddde';ctx.lineWidth=2;ctx.strokeRect(x+8,y+8,240,240);
    const dirt=ctx.createLinearGradient(x,y,x+40,y+60);dirt.addColorStop(0,'#383f4540');dirt.addColorStop(1,'#383f4500');
    if(!bump){ctx.fillStyle=dirt;ctx.fillRect(x+9,y+9,237,237);}
    for(const dx of [18,238])for(const dy of [18,238]){
      ctx.fillStyle=bump?'#e0e0e0':'#56616a';ctx.beginPath();ctx.arc(x+dx,y+dy,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e6eaec';ctx.fillRect(x+dx-1,y+dy-2,2,1);
    }
    ctx.strokeStyle=bump?'#777':'#f5f8fa60';ctx.lineWidth=1;
    for(let j=0;j<18;j++){const sx=x+random()*230+12,sy=y+random()*230+12;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+random()*18,sy+random()*3);ctx.stroke();}
    if(floor){ctx.strokeStyle=bump?'#808080':'#6a7780';ctx.lineWidth=3;for(let k=0;k<8;k++){ctx.beginPath();ctx.moveTo(x+40+k*20,y+55);ctx.lineTo(x+65+k*20,y+80);ctx.stroke();}}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  if(!bump)texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export class Station {
  constructor(scene,renderer,makeSign) {
    this.scene=scene;this.makeSign=makeSign;this.root=null;this.doors=[];this.blockers=[];
    const map=panelTexture(),bump=panelTexture(false,true),floor=panelTexture(true);
    for(const t of [map,bump,floor])t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    this.wall=new THREE.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.055,roughness:.55,metalness:.32,color:0x637286});
    this.floor=new THREE.MeshStandardMaterial({map:floor,bumpMap:bump,bumpScale:.035,roughness:.72,metalness:.25,color:0x47596b});
    this.trim=new THREE.MeshStandardMaterial({color:0x32455c,roughness:.38,metalness:.6});
    this.door=new THREE.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.04,color:0x53677e,roughness:.48,metalness:.4});
    this.shared=new Set([this.wall,this.floor,this.trim,this.door]);
  }
  setTheme(light) {
    this.wall.color.setHex(light?0xdbe2e5:0x637286);this.floor.color.setHex(light?0x9faeb5:0x47596b);
    this.trim.color.setHex(light?0x82939e:0x32455c);this.door.color.setHex(light?0x7c909d:0x53677e);
  }
  box(parent,w,h,d,x,y,z,material) {
    const geometry=new THREE.BoxGeometry(w,h,d);
    // Scale texture UVs in metres instead of stretching one panel across a wall.
    const uv=geometry.attributes.uv;
    const sizes=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let face=0;face<6;face++)for(let j=0;j<4;j++){const i=face*4+j;uv.setXY(i,uv.getX(i)*sizes[face][0]/4,uv.getY(i)*sizes[face][1]/4);}
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  build(model) {
    this.reset();this.model=model;this.root=new THREE.Group();this.scene.add(this.root);
    const edges=model.wallEdges(),geometry=new THREE.BoxGeometry(CELL,4.8,.18);
    const walls=new THREE.InstancedMesh(geometry,this.wall,edges.length),dummy=new THREE.Object3D();
    edges.forEach((edge,index)=>{dummy.position.set(edge.x,2.4,edge.z);dummy.rotation.y=edge.angle;dummy.updateMatrix();walls.setMatrixAt(index,dummy.matrix);});
    walls.instanceMatrix.needsUpdate=true;walls.computeBoundingSphere();this.root.add(walls);this.blockers=[walls];
    const length=(model.gateCount*ZONE_ROWS+3)*CELL;
    this.box(this.root,COLUMNS*CELL,.3,length,0,-.18,-length/2+CELL/2,this.floor);
    this.box(this.root,COLUMNS*CELL,.18,length,0,4.9,-length/2+CELL/2,this.wall);
    const strip=new THREE.InstancedMesh(new THREE.BoxGeometry(CELL,.045,.04),new THREE.MeshBasicMaterial({color:0x7cded2}),edges.length);
    edges.forEach((edge,index)=>{dummy.position.set(edge.x,.23,edge.z);dummy.rotation.y=edge.angle;dummy.updateMatrix();strip.setMatrixAt(index,dummy.matrix);});
    strip.instanceMatrix.needsUpdate=true;strip.computeBoundingSphere();this.root.add(strip);
    for(const gate of model.gates) {
      const portal=new THREE.Group();portal.position.set(gate.x,0,gate.z);this.root.add(portal);
      const glow=new THREE.MeshBasicMaterial({color:[0x66ead3,0xb893ff,0xffbe75][Math.floor(gate.stage/4)%3]});
      this.box(portal,.15,4.5,.4,-1.9,2.25,0,glow);this.box(portal,.15,4.5,.4,1.9,2.25,0,glow);this.box(portal,4,.17,.4,0,4.4,0,glow);
      const left=this.box(portal,1.9,4.25,.3,-.96,2.125,0,this.door),right=this.box(portal,1.9,4.25,.3,.96,2.125,0,this.door);
      for(const half of [left,right])this.box(half,.035,3.8,.05,0,0,.18,glow);
      this.doors.push({gate,left,right,open:0});this.blockers.push(left,right);
      this.makeSign(`BRÁNA ${gate.stage+1}`,model.junctions.has(gate.stage)?directions[gate.index]:'MATEMATICKÝ ZÁMEK',2.7,.72,0,3.75,.22,portal);
    }
    for(let stage=0;stage<model.gateCount;stage++) {
      const z=-stage*ZONE_ROWS*CELL;
      for(const offset of [0,3,7,11])this.box(this.root,2.3,.03,.3,0,4.78,z-offset*CELL,new THREE.MeshBasicMaterial({color:0xdbeef1}));
      this.makeSign(`SEKTOR ${stage+1}`,'PROZKOUMEJ CHODBY',2.2,.75,-4,3.4,z+1.85,this.root).rotation.y=Math.PI;
    }
  }
  unlock(stage,index) {
    const gate=this.model.unlock(stage,index);const door=this.doors.find(d=>d.gate===gate);
    if(door)door.open=1;return gate;
  }
  reset() {
    if(this.root){this.root.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();if(obj.isInstancedMesh)obj.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];for(const m of materials)if(!this.shared.has(m)){m.map?.dispose();m.dispose();}}});this.root.removeFromParent();}
    this.root=null;this.doors=[];this.blockers=[];
  }
  animate(dt,reduced) {
    for(const door of this.doors){const x=.96+door.open*1.95,rate=reduced?1:Math.min(1,dt*4);door.left.position.x=THREE.MathUtils.lerp(door.left.position.x,-x,rate);door.right.position.x=THREE.MathUtils.lerp(door.right.position.x,x,rate);}
  }
}
