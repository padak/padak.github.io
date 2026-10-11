import * as THREE from './vendor/three.module.js';

export class SpiderHunt {
  constructor(scene) {this.scene=scene;this.spiders=[];this.hitMeshes=[];this.stickers=[];}
  populate(placements) {
    this.clear();
    placements.forEach(({x,y,z,angle,level},index)=>{
      const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=angle;this.scene.add(group);
      const bodyMaterial=new THREE.MeshStandardMaterial({color:[0xb2d86b,0xc598f5,0xf2bc69][(level+index)%3],roughness:.45,metalness:.18});
      const legMaterial=new THREE.MeshStandardMaterial({color:0x424855,roughness:.7});
      const sphere=(r,sx,sy,sz,px,py,pz,material)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),material);mesh.scale.set(sx,sy,sz);mesh.position.set(px,py,pz);group.add(mesh);return mesh;};
      sphere(.29,1,1.25,.65,0,.08,.15,bodyMaterial);sphere(.21,1,1,.65,0,-.25,.19,bodyMaterial);
      for(const side of [-1,1])for(let leg=0;leg<4;leg++) {
        const y=.25-leg*.17,points=[new THREE.Vector3(side*.12,y,.13),new THREE.Vector3(side*.47,y+(leg<2?.16:-.14),.23),new THREE.Vector3(side*.64,y+(leg<2?.32:-.28),.06)];
        for(let i=0;i<2;i++) {
          const delta=points[i+1].clone().sub(points[i]);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.032,.038,delta.length(),5),legMaterial);
          mesh.position.copy(points[i]).add(points[i+1]).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(mesh);
        }
      }
      const white=new THREE.MeshBasicMaterial({color:0xf5f8fa}),black=new THREE.MeshBasicMaterial({color:0x17202d});
      for(const side of [-1,1]){sphere(.085,1,1,.65,side*.09,-.29,.31,white);sphere(.035,1,1,.7,side*.09,-.31,.36,black);}
      const hit=new THREE.Mesh(new THREE.CircleGeometry(.78,16),new THREE.MeshBasicMaterial({side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
      hit.position.z=.38;group.add(hit);
      const spider={group,hit,alive:true,index,baseY:y};hit.userData.spider=spider;this.spiders.push(spider);this.hitMeshes.push(hit);
    });
  }
  hit(spider) {
    if(!spider.alive)return null;
    spider.alive=false;spider.group.visible=false;this.hitMeshes=this.hitMeshes.filter(mesh=>mesh!==spider.hit);
    const sticker=new THREE.Group();sticker.position.copy(spider.group.position);sticker.rotation.copy(spider.group.rotation);this.scene.add(sticker);
    const material=new THREE.MeshBasicMaterial({color:0xb1ed8a,side:THREE.DoubleSide});
    const blob=new THREE.Mesh(new THREE.CircleGeometry(.36,16),material);blob.scale.set(1.5,.9,1);blob.position.z=.035;sticker.add(blob);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const drop=new THREE.Mesh(new THREE.CircleGeometry(.07+(i%3)*.025,8),material);drop.position.set(Math.cos(a)*(.45+i%2*.12),Math.sin(a)*.43,.04);sticker.add(drop);}
    this.stickers.push(sticker);return spider.group.position.clone();
  }
  animate(time,reduced) {
    if(reduced)return;
    for(const s of this.spiders)if(s.alive){s.group.position.y=s.baseY+Math.sin(time*1.4+s.index*2)*.09;s.group.rotation.z=Math.sin(time*2+s.index)*.07;}
  }
  clear() {
    for(const group of [...this.spiders.map(s=>s.group),...this.stickers]){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});group.removeFromParent();}
    this.spiders=[];this.hitMeshes=[];this.stickers=[];
  }
}
