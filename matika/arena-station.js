import * as THREE from './vendor/three.module.js';

export const isJunction=level=>[2,5,8,10].includes(level);
export const directions=['↖ VLEVO','↑ ROVNĚ','↗ VPRAVO'];
export const exitAngle=(level,index)=>isJunction(level)?[Math.PI/4,0,-Math.PI/4][index]:0;

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
    this.scene=scene;this.makeSign=makeSign;this.rooms=[];
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
  room(level,position=new THREE.Vector3(),angle=0) {
    const group=new THREE.Group();group.position.copy(position);group.rotation.y=angle;this.scene.add(group);
    const junction=isJunction(level),width=junction?20:14.4;
    const glow=new THREE.MeshBasicMaterial({color:[0x66ead3,0xb893ff,0xffbe75][Math.min(2,Math.floor(level/4))]});
    this.box(group,junction?44:width,.3,junction?48:18,0,-.18,junction?-10:-1,this.floor);
    this.box(group,junction?44:width,.18,junction?48:18,0,6.15,junction?-10:-1,this.wall);
    if(junction){for(const side of [-1,1])this.box(group,.3,6.2,48,side*22,3,-10,this.wall);this.box(group,44,6.2,.3,0,3,-34,this.wall);}
    const room={group,gates:[],junction,level};this.rooms.push(room);
    for(const side of [-1,1]) {
      this.box(group,.3,6.2,junction?10:18,side*(width/2+.12),3,junction?3:-1,this.wall);
      this.box(group,.8,6,.5,side*(width/2-.3),3,4,this.trim);
      this.box(group,.09,4.7,.07,side*(width/2-.75),2.8,4,glow);
      this.box(group,.07,.08,junction?7:18,side*(width/2-.1),1.1,junction?4.5:-1,glow);
    }
    for(const z of [4,-2,-8]){this.box(group,width,.18,.4,0,5.9,z,this.trim);this.box(group,5,.04,.4,0,5.76,z,new THREE.MeshBasicMaterial({color:0xd8e9e8}));}
    const angles=junction?[Math.PI/4,0,-Math.PI/4]:[0];
    if(junction)for(const side of [-1,1])this.box(group,3,6.2,8,side*5.5,3,-17,this.wall);
    for(const a of angles) {
      const branch=new THREE.Group();branch.position.z=-4;branch.rotation.y=a;group.add(branch);
      this.box(branch,7,.3,24,0,-.20,-12,this.floor);this.box(branch,7,.2,24,0,6.15,-12,this.wall);
      for(const side of [-1,1]) {
        this.box(branch,.3,6.2,12,side*3.6,3,-18,this.wall);
        this.box(branch,.08,.05,19,side*3.2,.13,-14,glow);
        this.box(branch,.07,.08,12,side*3.42,2.2,-18,glow);
      }
      const portal=new THREE.Group();portal.position.z=-12;branch.add(portal);
      this.box(portal,.24,5.4,.5,-3.35,2.7,0,glow);this.box(portal,.24,5.4,.5,3.35,2.7,0,glow);this.box(portal,6.9,.25,.5,0,5.3,0,glow);
      const left=this.box(portal,3.25,5.1,.3,-1.65,2.55,0,this.door),right=this.box(portal,3.25,5.1,.3,1.65,2.55,0,this.door);
      for(const half of [left,right])this.box(half,.05,4.5,.05,0,0,.19,glow);
      room.gates.push({left,right,open:0});
      this.makeSign(`BRÁNA ${level+1}`,junction?directions[room.gates.length-1]:'DALŠÍ SEKTOR',2.7,.85,0,4.6,.23,portal);
      // Bulkhead at the far end of unused branches; the chosen route continues.
      this.box(branch,7,6,.3,0,3,-27,this.wall);
    }
    if(junction)this.makeSign('ROZCESTÍ','SPRÁVNÁ CENA OTEVŘE CESTU',3.7,1.1,0,5,-6,group);
    return room;
  }
  nextPose(level,index) {
    const angle=exitAngle(level,index);
    return {angle,position:new THREE.Vector3(-Math.sin(angle)*28,0,-4-Math.cos(angle)*28)};
  }
  remove(room) {
    room.group.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];for(const m of materials)if(!this.shared.has(m)){m.map?.dispose();m.dispose();}}});
    room.group.removeFromParent();this.rooms=this.rooms.filter(r=>r!==room);
  }
  reset() {for(const room of [...this.rooms])this.remove(room);}
  animate(dt,reduced) {
    for(const room of this.rooms)for(const gate of room.gates){const x=1.65+gate.open*3.3,rate=reduced?1:Math.min(1,dt*4);gate.left.position.x=THREE.MathUtils.lerp(gate.left.position.x,-x,rate);gate.right.position.x=THREE.MathUtils.lerp(gate.right.position.x,x,rate);}
  }
}
