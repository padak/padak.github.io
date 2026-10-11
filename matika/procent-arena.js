import * as THREE from './vendor/three.module.js';
import { createMission } from './arena-questions.js';

export async function init() {
  const $ = id => document.getElementById(id);
  const canvas=$('scene'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  canvas.inert=true;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x091222);scene.fog=new THREE.Fog(0x091222,22,72);
  const camera=new THREE.PerspectiveCamera(65,1,.05,80);camera.rotation.order='YXZ';scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xb9dbff,0x1e1c35,2));
  const light=new THREE.DirectionalLight(0x9dcaff,2.5);light.position.set(3,8,6);scene.add(light);
  const fill=new THREE.PointLight(0x7fffe0,12,20);scene.add(fill);
  const raycaster=new THREE.Raycaster(), center=new THREE.Vector2(), hover=new THREE.Vector2(9,9);
  const colors=[0x66ead3,0xb893ff,0xffbe75];
  const keys=new Set(), moving=new Set();
  const effects=[], gates=[], targets=[], targetMeshes=[];
  const sectors=['ZÁKLADNA','SLEVOVÉ DOKY','REAKTOR'];
  let questions=createMission(), level=0, mode='intro', yaw=0, pitch=0, recoil=0;
  let attempts=0, helped=false, results=[], flight=null, lastShot=-Infinity, time=0, previous=0;
  let pointer=null, sound=false, audio=null, lastHover=null;
  const station=new THREE.Group();scene.add(station);

  function box(w,h,d,x,y,z,color,glow=false,parent=station) {
    const material=glow?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.4});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function labelTexture(text,sub='',color='#a0fff0') {
    const image=document.createElement('canvas');image.width=1024;image.height=384;
    const ctx=image.getContext('2d');
    ctx.fillStyle='#101f35';ctx.fillRect(0,0,1024,384);
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.strokeRect(8,8,1008,368);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
    ctx.font='700 40px system-ui';ctx.fillText(sub,512,70);
    let size=106;ctx.font=`700 ${size}px system-ui`;
    while(ctx.measureText(text).width>930 && size>52){size-=2;ctx.font=`700 ${size}px system-ui`;}
    ctx.fillStyle='#f0f9ff';ctx.fillText(text,512,218);
    const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return texture;
  }
  function sign(text,sub,w,h,x,y,z,parent=station) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:labelTexture(text,sub),toneMapped:false}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  box(14.8,.3,292,0,-.18,-132,0x172538);
  box(.45,6.5,292,-7.3,3,-132,0x111e32);box(.45,6.5,292,7.3,3,-132,0x111e32);
  const gridPoints=[];
  for(let x=-7;x<=7;x++)gridPoints.push(x,.01,14,x,.01,-278);
  for(let z=14;z>=-278;z-=2)gridPoints.push(-7,.01,z,7,.01,z);
  const gridGeometry=new THREE.BufferGeometry();gridGeometry.setAttribute('position',new THREE.Float32BufferAttribute(gridPoints,3));
  station.add(new THREE.LineSegments(gridGeometry,new THREE.LineBasicMaterial({color:0x365169,transparent:true,opacity:.65})));
  for(let i=0;i<12;i++) {
    const z=-i*22, color=colors[Math.floor(i/4)];
    for(const side of [-1,1]) {
      box(.12,.05,19,side*6.5,.12,z-2,color,true);
      box(.06,.09,14,side*7,2.1,z-2,color,true);
      box(.8,5.8,1.2,side*6.8,2.9,z-10,0x273951);
      box(.09,5.6,.12,side*6.32,2.8,z-9.3,color,true);
      for(let j=0;j<3;j++)box(.09,.45,1.5,side*7.04,3.8,z-j*5,0x32526b);
    }
    box(14.4,.3,.6,0,5.7,z-10,0x2a3e56);box(10,.04,.12,0,5.5,z-9.7,color,true);
    const gate=new THREE.Group();gate.position.z=z-12;station.add(gate);
    box(.3,5,.5,-5.6,2.5,0,color,true,gate);box(.3,5,.5,5.6,2.5,0,color,true,gate);box(11.5,.2,.5,0,5,0,color,true,gate);
    const left=box(5.5,4.7,.35,-2.78,2.35,0,0x22304a,false,gate);
    const right=box(5.5,4.7,.35,2.78,2.35,0,0x22304a,false,gate);
    for(const half of [left,right])box(.04,4.2,.06,0,0,.21,color,true,half);
    gates.push({left,right,open:0});
    sign(`BRÁNA ${String(i+1).padStart(2,'0')}`,sectors[Math.floor(i/4)],3.2,1.2,0,4.1,z-11.77);
  }
  const core=new THREE.Group();core.position.set(0,2.7,-260);station.add(core);
  const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,2),new THREE.MeshStandardMaterial({color:0x446269,emissive:0x1a4543,emissiveIntensity:.8,metalness:.7,roughness:.25}));core.add(orb);
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2+i*.25,.045,8,64),new THREE.MeshBasicMaterial({color:colors[i]}));ring.rotation.set(i*.8,i*.5,0);core.add(ring);}
  const weapon=new THREE.Group();camera.add(weapon);weapon.scale.setScalar(.7);weapon.position.set(.34,-.34,-.9);weapon.rotation.set(.04,-.12,0);
  box(.18,.18,.48,0,0,0,0x324761,false,weapon);box(.2,.08,.4,0,.12,.05,0xb4cce0,false,weapon);
  box(.08,.2,.12,.02,-.13,.16,0x172331,false,weapon);box(.12,.035,.32,0,.03,-.02,0x79f5dc,true,weapon);
  const muzzle=new THREE.Mesh(new THREE.TorusGeometry(.074,.014,8,24),new THREE.MeshBasicMaterial({color:0x79f5dc}));muzzle.position.z=-.25;weapon.add(muzzle);

  function disposeGroup(group) {
    group.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(material=>{material.map?.dispose();material.dispose();});}});
    scene.remove(group);
  }
  function createTargets() {
    for(const target of targets)disposeGroup(target.group);
    targets.length=0;targetMeshes.length=0;
    questions[level].options.forEach((option,index)=>{
      const group=new THREE.Group();group.position.set((index-1)*4.2,2.5,-level*22-7);scene.add(group);
      const face=sign(option.label,`TERČ ${index+1}`,3.2,1.2,0,0,.16,group);
      face.userData.index=index;targetMeshes.push(face);
      const hitArea=new THREE.Mesh(new THREE.CircleGeometry(1.38,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
      hitArea.position.z=-.02;hitArea.userData.index=index;group.add(hitArea);targetMeshes.push(hitArea);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.38,.035,8,64),new THREE.MeshBasicMaterial({color:0x69bdce}));ring.position.z=-.06;group.add(ring);
      const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,0),new THREE.MeshStandardMaterial({color:0x50617a,metalness:.7,roughness:.4}));body.position.y=-.92;group.add(body);
      box(.8,.05,.12,0,-.94,.04,0x7fffe0,true,group);
      const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,.22,12),new THREE.MeshStandardMaterial({color:0x253951}));pedestal.position.set(group.position.x,.11,group.position.z);scene.add(pedestal);
      // The pedestal belongs to this disposable group but sits at floor level.
      group.attach(pedestal);
      targets.push({group,face,ring,body,option,index,baseY:2.5});
    });
    responsive();
  }
  function responsive() {
    const bounds=$('arena').getBoundingClientRect();renderer.setSize(bounds.width,bounds.height,false);
    camera.aspect=bounds.width/bounds.height;camera.fov=camera.aspect<.8?82:65;camera.updateProjectionMatrix();
    camera.clearViewOffset();
    if(!$('hud').hidden) {
      const questionBottom=document.querySelector('.brief').getBoundingClientRect().bottom-bounds.top;
      const dockTop=document.querySelector('.dock').getBoundingClientRect().top-bounds.top;
      const targetY=bounds.height/2-.8/(12*Math.tan(camera.fov*Math.PI/360))*bounds.height/2;
      const desiredY=Math.min(Math.max(targetY,questionBottom+55),dockTop-70);
      const offset=Math.max(0,desiredY-targetY);
      if(offset>0)camera.setViewOffset(bounds.width,bounds.height,0,-offset,bounds.width,bounds.height);
    }
    const compact=camera.aspect<.8;
    for(const target of targets){target.group.position.x=(target.index-1)*(compact?2.7:4.2);target.group.scale.x=compact?.79:1;}
  }
  new ResizeObserver(responsive).observe($('arena'));
  function updateBrief() {
    $('sector').textContent=`0${Math.floor(level/4)+1} / ${sectors[Math.floor(level/4)]}`;
    $('counter').textContent=`BRÁNA ${level+1} / 12`;$('question').textContent=questions[level].text;$('skill').textContent=questions[level].skill;
    $('route').replaceChildren();for(let i=0;i<12;i++){const segment=document.createElement('span');segment.className=i<level?'done':i===level?'current':'';$('route').append(segment);}
    $('route').setAttribute('aria-label',`${level} z 12 bran otevřeno`);
    $('answer-buttons').replaceChildren();questions[level].options.forEach((option,index)=>{
      const button=document.createElement('button');button.type='button';button.dataset.index=index;button.setAttribute('aria-label',`Terč ${index+1}: ${option.label}`);
      const key=document.createElement('span');key.className='answer-key';key.textContent=index+1;
      const label=document.createElement('span');label.className='answer-label';label.textContent=option.label;
      button.append(key,label);button.addEventListener('click',()=>shootTarget(index));$('answer-buttons').append(button);
    });
    responsive();
  }
  function hideFeedback(){ $('feedback').hidden=true; }
  function feedback(tag,text,solved=false,offerReveal=false) {
    $('feedback').classList.toggle('hint',!solved);$('feedback-tag').textContent=tag;$('feedback-text').textContent=text;
    $('continue').hidden=!solved;$('continue').textContent=level===11?'Spustit reaktor →':'Otevřít bránu →';
    $('reveal').hidden=!offerReveal;$('dismiss').hidden=solved;$('feedback').hidden=false;
  }
  function playSound(kind) {
    if(!sound)return;
    try {
      audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
      const now=audio.currentTime;const notes=kind==='success'?[523,659,784]:kind==='wrong'?[230]:[500];
      notes.forEach((frequency,index)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type=kind==='shot'?'triangle':'sine';osc.frequency.setValueAtTime(frequency,now+index*.09);if(kind==='shot')osc.frequency.exponentialRampToValueAtTime(150,now+.08);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.035,now+index*.09+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+index*.09+.14);osc.connect(gain);gain.connect(audio.destination);osc.start(now+index*.09);osc.stop(now+index*.09+.15);});
    } catch {sound=false;$('sound').textContent='Zvuk nedostupný';$('sound').setAttribute('aria-pressed','false');}
  }
  function beam(end,good=false) {
    scene.updateMatrixWorld(true);const start=muzzle.getWorldPosition(new THREE.Vector3());
    const direction=end.clone().sub(start),length=direction.length();
    const laser=new THREE.Mesh(new THREE.CylinderGeometry(.023,.023,length,5),new THREE.MeshBasicMaterial({color:good?0x97ffe0:0x93deff}));
    laser.position.copy(start).add(end).multiplyScalar(.5);laser.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());scene.add(laser);
    effects.push({mesh:laser,life:.13,max:.13});recoil=.04;playSound('shot');
  }
  function burst(position,color) {
    if(reduced)return;
    for(let i=0;i<16;i++){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.07),new THREE.MeshBasicMaterial({color}));mesh.position.copy(position);scene.add(mesh);effects.push({mesh,life:.65,max:.65,velocity:new THREE.Vector3((Math.random()-.5)*5,(Math.random()-.2)*4,(Math.random()-.5)*4)});}
  }
  function shootAt(point=center) {
    if(mode!=='playing'||performance.now()-lastShot<220)return;
    scene.updateMatrixWorld(true);raycaster.setFromCamera(point,camera);
    const hit=raycaster.intersectObjects(targetMeshes,false)[0];
    if(hit){shootTarget(hit.object.userData.index,hit.point);return;}
    lastShot=performance.now();beam(raycaster.ray.at(18,new THREE.Vector3()));
    $('aim-label').textContent='Miř na svítící terč';
  }
  function shootTarget(index,hitPoint=null) {
    if(mode!=='playing'||performance.now()-lastShot<220)return;
    const target=targets[index];if(!target||!target.group.visible)return;
    lastShot=performance.now();scene.updateMatrixWorld(true);const point=hitPoint??target.face.getWorldPosition(new THREE.Vector3());beam(point,target.option.correct);
    attempts++;
    if(target.option.correct) {
      mode='solved';keys.clear();moving.clear();burst(point,colors[Math.floor(level/4)]);target.group.visible=false;gates[level].open=1;
      results.push({firstTry:attempts===1&&!helped,assisted:helped,skill:questions[level].skill,explanation:questions[level].explanation});
      unlock();playSound('success');feedback('SPRÁVNÝ ZÁSAH · BRÁNA ODEMČENA',questions[level].explanation,true);
      $('answer-buttons').querySelectorAll('button').forEach(button=>button.disabled=true);
      $('route').children[level].className='done';$('route').setAttribute('aria-label',`${level+1} z 12 bran otevřeno`);
      $('continue').focus({preventScroll:true});
    } else {
      target.ring.material.color.setHex(0xffbd78);const button=$('answer-buttons').querySelector(`[data-index="${index}"]`);button.classList.add('wrong');
      playSound('wrong');feedback('TAHLE CENOVKA KLAME · ZKUS TO ZNOVU',target.option.hint||questions[level].hint,false,true);
      unlock();
    }
  }
  function hint(full=false) {
    if(mode!=='playing')return;helped=true;unlock();
    feedback(full?'SERVISNÍ MANUÁL · TEĎ TREF SPRÁVNÝ TERČ':'NAVIGÁTOR RADÍ',full?questions[level].explanation:questions[level].hint,false,!full);
    if(full){const index=questions[level].options.findIndex(option=>option.correct);targets[index].ring.material.color.setHex(0x86ffe0);$('answer-buttons').querySelector(`[data-index="${index}"]`).classList.add('assisted');}
  }
  function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
  function positionPlayer(){camera.position.set(0,1.7,-level*22+5);yaw=0;pitch=0;camera.rotation.set(0,0,0);fill.position.copy(camera.position);}
  function start() {
    unlock();questions=createMission();level=0;results=[];attempts=0;helped=false;mode='playing';flight=null;lastShot=-Infinity;
    keys.clear();moving.clear();for(const gate of gates){gate.open=0;gate.left.position.x=-2.78;gate.right.position.x=2.78;}
    orb.material.emissive.setHex(0x1a4543);orb.material.emissiveIntensity=.8;
    $('intro').hidden=true;$('victory').hidden=true;$('paused').hidden=true;$('hud').hidden=false;$('hud').inert=false;canvas.inert=false;
    document.querySelector('.brief').style.visibility='visible';$('transit').hidden=true;
    hideFeedback();positionPlayer();createTargets();updateBrief();canvas.focus({preventScroll:true});
  }
  function pause() {
    if(mode!=='playing'&&mode!=='solved')return;
    const old=mode;mode='paused';$('paused').dataset.previous=old;keys.clear();moving.clear();pointer=null;unlock();$('hud').inert=true;canvas.inert=true;$('paused').hidden=false;$('resume').focus({preventScroll:true});
  }
  function resume(){mode=$('paused').dataset.previous||'playing';$('hud').inert=false;canvas.inert=false;$('paused').hidden=true;(mode==='solved'?$('continue'):canvas).focus({preventScroll:true});}
  function victory() {
    mode='victory';unlock();keys.clear();moving.clear();hideFeedback();$('transit').hidden=true;document.querySelector('.brief').style.visibility='visible';
    $('hud').inert=true;canvas.inert=true;$('victory').hidden=false;orb.material.emissive.setHex(0x59ffd2);orb.material.emissiveIntensity=3;
    const count=results.filter(result=>result.firstTry).length;$('victory-stats').textContent=`12 / 12 bran otevřeno · ${count} na první zásah`;
    $('review').replaceChildren();const missed=results.filter(result=>!result.firstTry);
    if(!missed.length){const text=document.createElement('p');text.textContent='Všechny cenovky jsi rozluštila na první zásah. Zkus další misi — čísla se změní.';$('review').append(text);}
    else for(const result of missed){const text=document.createElement('p');const title=document.createElement('strong');title.textContent=`${result.skill}: `;text.append(title,document.createTextNode(result.explanation));$('review').append(text);}
    $('debrief').open=false;$('again').focus({preventScroll:true});playSound('success');
  }
  function advance() {
    if(mode!=='solved')return;
    hideFeedback();unlock();keys.clear();moving.clear();
    const final=level===11;
    if(final){orb.material.emissive.setHex(0x59ffd2);orb.material.emissiveIntensity=3;}
    mode='transit';flight={elapsed:0,start:camera.position.clone(),end:final?new THREE.Vector3(0,2.2,-253):new THREE.Vector3(0,1.7,-(level+1)*22+5),yaw,pitch,final};
    document.querySelector('.brief').style.visibility='hidden';$('transit').hidden=false;
  }
  function updateEffects(dt) {
    for(let i=effects.length-1;i>=0;i--){const effect=effects[i];effect.life-=dt;if(effect.velocity){effect.mesh.position.addScaledVector(effect.velocity,dt);effect.velocity.y-=dt*3;effect.mesh.scale.setScalar(Math.max(.01,effect.life/effect.max));}if(effect.life<=0){scene.remove(effect.mesh);effect.mesh.geometry.dispose();effect.mesh.material.dispose();effects.splice(i,1);}}
  }
  function animate(timestamp) {
    const dt=Math.min((timestamp-previous)/1000,.05)||0;previous=timestamp;
    if(mode!=='paused'&&!document.hidden){
      time+=dt;updateEffects(dt);recoil=Math.max(0,recoil-dt*.25);weapon.position.z=-.9+recoil;
      if(!reduced){core.rotation.y+=dt*.15;core.rotation.z+=dt*.06;}
      for(const gate of gates){const targetX=2.78+gate.open*4.5;const rate=reduced?1:Math.min(1,dt*4);gate.left.position.x=THREE.MathUtils.lerp(gate.left.position.x,-targetX,rate);gate.right.position.x=THREE.MathUtils.lerp(gate.right.position.x,targetX,rate);}
      if(mode==='playing') {
        const forward=(keys.has('KeyW')||keys.has('ArrowUp')||moving.has('forward')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')||moving.has('backward')?1:0);
        const sideways=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
        yaw+=(keys.has('ArrowLeft')?1:0)*dt*1.2-(keys.has('ArrowRight')?1:0)*dt*1.2;yaw=THREE.MathUtils.clamp(yaw,-1.25,1.25);
        const step=4*dt/Math.max(1,Math.hypot(forward,sideways));
        camera.position.x+=(-Math.sin(yaw)*forward+Math.cos(yaw)*sideways)*step;
        camera.position.z+=(-Math.cos(yaw)*forward-Math.sin(yaw)*sideways)*step;
        camera.position.x=THREE.MathUtils.clamp(camera.position.x,-5.3,5.3);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-level*22-4,-level*22+7);
      }
      if(mode==='transit') {
        flight.elapsed+=dt;const t=reduced?1:Math.min(flight.elapsed/1.55,1),ease=t*t*(3-2*t);
        camera.position.lerpVectors(flight.start,flight.end,ease);yaw=flight.yaw*(1-ease);pitch=flight.pitch*(1-ease);
        if(t>=1){if(flight.final){flight=null;victory();}else{level++;attempts=0;helped=false;mode='playing';flight=null;lastShot=-Infinity;createTargets();updateBrief();$('transit').hidden=true;document.querySelector('.brief').style.visibility='visible';canvas.focus({preventScroll:true});}}
      }
      camera.rotation.set(pitch,yaw,0);fill.position.copy(camera.position);
      for(const target of targets){target.group.position.y=target.baseY+(reduced?0:Math.sin(time*1.3+target.index)*.055);if(!reduced){target.ring.rotation.z=time*.12;target.body.rotation.y=time*.3;}}
      if(mode==='playing') {
        scene.updateMatrixWorld(true);raycaster.setFromCamera(document.pointerLockElement===canvas?center:hover,camera);
        const hit=raycaster.intersectObjects(targetMeshes,false)[0];const next=hit?.object.userData.index??null;
        if(next!==lastHover){$('crosshair').classList.toggle('hot',next!==null);$('aim-label').textContent=next===null?'':`TERČ ${next+1}`;lastHover=next;}
      } else {$('crosshair').classList.remove('hot');$('aim-label').textContent='';lastHover=null;}
    }
    renderer.render(scene,camera);
  }
  function pointFromEvent(event){const rect=canvas.getBoundingClientRect();return new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);}
  canvas.addEventListener('pointerdown',event=>{
    if(mode!=='playing'||event.button!==0)return;
    if(document.pointerLockElement===canvas){shootAt();return;}
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,dragged:false};canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    hover.copy(pointFromEvent(event));
    if(mode!=='playing')return;
    if(document.pointerLockElement===canvas){yaw=THREE.MathUtils.clamp(yaw-event.movementX*.0025,-1.25,1.25);pitch=THREE.MathUtils.clamp(pitch-event.movementY*.0025,-.5,.5);return;}
    if(pointer?.id===event.pointerId){if(Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>7)pointer.dragged=true;if(pointer.dragged){yaw=THREE.MathUtils.clamp(yaw-(event.clientX-pointer.x)*.004,-1.25,1.25);pitch=THREE.MathUtils.clamp(pitch-(event.clientY-pointer.y)*.004,-.5,.5);}pointer.x=event.clientX;pointer.y=event.clientY;}
  });
  canvas.addEventListener('pointerup',event=>{if(pointer?.id!==event.pointerId)return;const wasDrag=pointer.dragged;pointer=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(!wasDrag)shootAt(pointFromEvent(event));});
  canvas.addEventListener('pointercancel',()=>{pointer=null;});
  canvas.addEventListener('pointerleave',()=>{hover.set(9,9);});
  document.querySelectorAll('[data-move]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{if(mode!=='playing')return;button.setPointerCapture(event.pointerId);moving.add(button.dataset.move);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>moving.delete(button.dataset.move));
  });
  document.addEventListener('keydown',event=>{
    if(event.code==='Escape'){if(mode==='paused')resume();else pause();return;}
    if(mode!=='playing')return;
    if(event.code==='Space'&&event.target.closest('button,a,summary'))return;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(event.code))event.preventDefault();
    keys.add(event.code);if(event.repeat)return;
    if(event.code==='Space')shootAt();if(/^Digit[123]$/.test(event.code))shootTarget(Number(event.code.slice(-1))-1);
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;$('lock').setAttribute('aria-pressed',String(locked));$('lock').textContent=locked?'Uvolnit myš':'Zamknout myš';hover.set(9,9);});
  document.addEventListener('pointerlockerror',()=>{if(mode==='playing')feedback('MYŠ ZŮSTÁVÁ VOLNÁ','Tento prohlížeč nepovolil zamknutí myši. Můžeš normálně klikat na terče a rozhlížet se tažením.');});
  $('lock').addEventListener('click',()=>{if(document.pointerLockElement===canvas){unlock();return;}if(mode!=='playing')return;try{const request=canvas.requestPointerLock();request?.catch(()=>{});}catch{feedback('KLIKACÍ REŽIM','Můžeš klikat na terče a rozhlížet se tažením.');}});
  $('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Vypnout zvuk':'Zapnout zvuk');$('sound').textContent=sound?'Zvuk: zap.':'Zvuk: vyp.';if(sound)playSound('success');});
  $('start').addEventListener('click',start);$('restart').addEventListener('click',start);$('again').addEventListener('click',start);
  $('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
  $('hint').addEventListener('click',()=>hint());$('reveal').addEventListener('click',()=>hint(true));$('dismiss').addEventListener('click',hideFeedback);$('continue').addEventListener('click',advance);$('fire').addEventListener('click',()=>shootAt());
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();$('intro').hidden=false;$('paused').hidden=true;$('hud').hidden=true;$('loading-error').hidden=false;$('loading-error').textContent='Grafika se přerušila. Obnov stránku a začni novou misi.';$('start').textContent='Obnovit stránku';$('start').onclick=()=>location.reload();});
  if(matchMedia('(pointer: coarse)').matches)$('control-tip').textContent='Ťukni na terč · tažením rozhlížení · šipkami chůze';
  positionPlayer();createTargets();updateBrief();responsive();renderer.setAnimationLoop(animate);
  $('start').disabled=false;$('start').textContent='Vstoupit na stanici →';
}
