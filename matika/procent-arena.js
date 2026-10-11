import * as THREE from './vendor/three.module.js';
import { createMission } from './arena-questions.js';
import { ArenaAudio } from './arena-audio.js?v=junction-1';
import { Station, isJunction, directions, exitAngle } from './arena-station.js';
import { SpiderHunt } from './arena-spiders.js';

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
  const ambient=new THREE.HemisphereLight(0xb9dbff,0x1e1c35,2);scene.add(ambient);
  const light=new THREE.DirectionalLight(0x9dcaff,2.5);light.position.set(3,8,6);scene.add(light);
  const fill=new THREE.PointLight(0x7fffe0,12,20);scene.add(fill);
  const raycaster=new THREE.Raycaster(), center=new THREE.Vector2(), hover=new THREE.Vector2(9,9);
  const colors=[0x66ead3,0xb893ff,0xffbe75];
  const keys=new Set(), moving=new Set();
  const effects=[], targets=[], targetMeshes=[];
  const sectors=['ZÁKLADNA','SLEVOVÉ DOKY','REAKTOR'];
  let questions=createMission(), level=0, mode='intro', yaw=0, pitch=0, recoil=0;
  let attempts=0, helped=false, results=[], flight=null, lastShot=-Infinity, time=0, previous=0;
  let pointer=null, lastHover=null, mixerTrigger=null;
  let currentRoom=null, nextRoom=null, selectedExit=1, spiderCount=0, trail=[], bonusTimer=null;
  let lightTheme=false;
  try {lightTheme=localStorage.getItem('percentage-arena-theme')==='light';}catch { /* Optional storage. */ }
  const audio=new ArenaAudio(syncAudioControls);
  function syncAudioControls() {
    const s=audio.settings;
    $('sound').textContent=audio.unavailable?'Zvuk: —':s.enabled?'Zvuk: zap.':'Zvuk: vyp.';
    $('sound').setAttribute('aria-pressed',String(s.enabled&&!audio.unavailable));
    $('sound').setAttribute('aria-label',s.enabled?'Vypnout zvuk':'Zapnout zvuk');
    $('audio-enabled').checked=s.enabled;$('music-enabled').checked=s.music;$('effects-enabled').checked=s.effects;
    for(const channel of ['music','effects']) {
      const volume=Math.round(s[`${channel}Volume`]*100);
      $(`${channel}-volume`).value=volume;$(`${channel}-value`).textContent=`${volume} %`;
      $(`${channel}-volume`).setAttribute('aria-valuetext',`${volume} %`);
    }
    $('audio-status').textContent=audio.unavailable?'Zvuk tento prohlížeč nepovolil. Mise funguje i bez něj.':!s.enabled?'Všechny zvuky jsou ztlumené. Nastavení si stanice pamatuje.':'Vlastní sci-fi soundtrack. Při pauze je ticho.';
  }
  function closeMixer(focus=true) {
    $('audio-panel').hidden=true;$('audio-settings').setAttribute('aria-expanded','false');$('paused-audio').setAttribute('aria-expanded','false');
    if(focus&&mixerTrigger&&!mixerTrigger.closest('[inert]'))mixerTrigger.focus({preventScroll:true});
  }
  function openMixer(event) {
    if(!$('audio-panel').hidden){closeMixer();return;}
    unlock();keys.clear();moving.clear();mixerTrigger=event.currentTarget;$('audio-panel').hidden=false;
    mixerTrigger.setAttribute('aria-expanded','true');$('audio-close').focus({preventScroll:true});
  }
  const station=new THREE.Group();scene.add(station);

  function box(w,h,d,x,y,z,color,glow=false,parent=station) {
    const material=glow?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.4});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function labelTexture(text,sub='',color='#a0fff0') {
    const image=document.createElement('canvas');image.width=1024;image.height=384;
    const ctx=image.getContext('2d');
    ctx.fillStyle=lightTheme?'#e8f1f3':'#101f35';ctx.fillRect(0,0,1024,384);
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.strokeRect(8,8,1008,368);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
    ctx.font='700 40px system-ui';ctx.fillText(sub,512,70);
    let size=106;ctx.font=`700 ${size}px system-ui`;
    while(ctx.measureText(text).width>930 && size>52){size-=2;ctx.font=`700 ${size}px system-ui`;}
    ctx.fillStyle=lightTheme?'#12313f':'#f0f9ff';ctx.fillText(text,512,218);
    const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return texture;
  }
  function sign(text,sub,w,h,x,y,z,parent=station) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:labelTexture(text,sub),toneMapped:false}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const halls=new Station(scene,renderer,sign),spiders=new SpiderHunt(scene);
  const core=new THREE.Group();core.position.set(0,2.7,-27);core.visible=false;station.add(core);
  const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,2),new THREE.MeshStandardMaterial({color:0x446269,emissive:0x1a4543,emissiveIntensity:.8,metalness:.7,roughness:.25}));core.add(orb);
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2+i*.25,.045,8,64),new THREE.MeshBasicMaterial({color:colors[i]}));ring.rotation.set(i*.8,i*.5,0);core.add(ring);}
  const weapon=new THREE.Group();camera.add(weapon);weapon.scale.setScalar(.7);weapon.position.set(.34,-.34,-.9);weapon.rotation.set(.04,-.12,0);
  box(.18,.18,.48,0,0,0,0x324761,false,weapon);box(.2,.08,.4,0,.12,.05,0xb4cce0,false,weapon);
  box(.08,.2,.12,.02,-.13,.16,0x172331,false,weapon);box(.12,.035,.32,0,.03,-.02,0x79f5dc,true,weapon);
  const muzzle=new THREE.Mesh(new THREE.TorusGeometry(.074,.014,8,24),new THREE.MeshBasicMaterial({color:0x79f5dc}));muzzle.position.z=-.25;weapon.add(muzzle);

  function setTheme() {
    document.documentElement.dataset.theme=lightTheme?'light':'dark';halls.setTheme(lightTheme);
    scene.background.setHex(lightTheme?0xc8d9e2:0x091222);scene.fog.color.copy(scene.background);
    ambient.color.setHex(lightTheme?0xeaf5ff:0xb9dbff);ambient.groundColor.setHex(lightTheme?0x798b96:0x1e1c35);ambient.intensity=lightTheme?3:2;
    light.intensity=lightTheme?3.2:2.5;renderer.toneMappingExposure=lightTheme?1.15:1.35;
    for(const id of ['theme','intro-theme','paused-theme']){
      const text=lightTheme?'Tmavý režim':'Světlý režim';$(id).textContent=id==='theme'?(lightTheme?'☾':'☀'):`${lightTheme?'☾':'☀'} ${text}`;
      $(id).setAttribute('aria-pressed',String(lightTheme));$(id).setAttribute('aria-label',`Přepnout na ${text.toLowerCase()}`);$(id).title=text;
    }
    for(const target of targets)refreshLabel(target);
    try{localStorage.setItem('percentage-arena-theme',lightTheme?'light':'dark');}catch { /* Optional storage. */ }
  }
  function refreshLabel(target) {
    target.face.material.map?.dispose();target.face.material.map=labelTexture(target.option.label,isJunction(level)?directions[target.index]:`TERČ ${target.index+1}`,lightTheme?'#075e68':'#a0fff0');
  }
  function enterRoom() {
    core.visible=level===11;spiders.spawn(level,isJunction(level));selectedExit=1;
    positionPlayer();createTargets();updateBrief();
  }

  function disposeGroup(group) {
    group.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(material=>{material.map?.dispose();material.dispose();});}});
    group.removeFromParent();
  }
  function createTargets() {
    for(const target of targets)disposeGroup(target.group);
    targets.length=0;targetMeshes.length=0;
    questions[level].options.forEach((option,index)=>{
      const group=new THREE.Group();group.position.set((index-1)*4.2,2.5,-7);scene.add(group);
      const face=sign(option.label,isJunction(level)?directions[index]:`TERČ ${index+1}`,3.2,1.2,0,0,.16,group);
      face.userData.index=index;targetMeshes.push(face);
      const hitArea=new THREE.Mesh(new THREE.CircleGeometry(1.38,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
      hitArea.position.z=-.02;hitArea.userData.index=index;group.add(hitArea);targetMeshes.push(hitArea);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.38,.035,8,64),new THREE.MeshBasicMaterial({color:0x69bdce}));ring.position.z=-.06;group.add(ring);
      const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,0),new THREE.MeshStandardMaterial({color:0x50617a,metalness:.7,roughness:.4}));body.position.y=-.92;group.add(body);
      box(.8,.05,.12,0,-.94,.04,0x7fffe0,true,group);
      targets.push({group,face,ring,body,option,index,baseY:2.5});
    });
    responsive();
  }
  function responsive() {
    const bounds=$('arena').getBoundingClientRect();renderer.setSize(bounds.width,bounds.height,false);
    camera.aspect=bounds.width/bounds.height;camera.fov=camera.aspect<.8?(isJunction(level)?100:88):65;camera.updateProjectionMatrix();
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
    for(const target of targets){
      if(isJunction(level)) {
        const a=exitAngle(level,target.index);target.group.position.x=-Math.sin(a)*8;target.group.position.z=-4-Math.cos(a)*8;
        target.group.rotation.y=Math.atan2(-target.group.position.x,5-target.group.position.z);target.group.scale.setScalar(compact?.72:.9);
      } else {target.group.position.x=(target.index-1)*(compact?2.7:4.2);target.group.position.z=-7;target.group.rotation.y=0;target.group.scale.set( compact?.79:1,1,1);}
    }
  }
  new ResizeObserver(responsive).observe($('arena'));
  function updateBrief() {
    $('sector').textContent=`0${Math.floor(level/4)+1} / ${sectors[Math.floor(level/4)]}`;
    $('counter').textContent=`BRÁNA ${level+1} / 12`;$('question').textContent=questions[level].text;$('skill').textContent=questions[level].skill;
    $('junction-label').textContent=isJunction(level)?'ROZCESTÍ · ↖ vlevo / ↑ rovně / ↗ vpravo':'CHODBA · další brána před tebou';
    $('path-history').textContent=trail.length?`Tvoje trasa: ${trail.join(' · ')}`:'Tvoje trasa: start';
    $('bonus-score').textContent=`🕷 ${spiderCount} · ${spiderCount*100} bodů`;
    $('route').replaceChildren();for(let i=0;i<12;i++){const segment=document.createElement('span');segment.className=i<level?'done':i===level?'current':'';$('route').append(segment);}
    $('route').setAttribute('aria-label',`${level} z 12 bran otevřeno`);
    $('answer-buttons').replaceChildren();questions[level].options.forEach((option,index)=>{
      const direction=isJunction(level)?directions[index]:'';
      const button=document.createElement('button');button.type='button';button.dataset.index=index;button.setAttribute('aria-label',`Terč ${index+1}: ${option.label}${direction?`, ${direction}`:''}`);
      const key=document.createElement('span');key.className='answer-key';key.textContent=index+1;
      const label=document.createElement('span');label.className='answer-label';label.textContent=option.label;
      const contents=document.createElement('span');contents.className='answer-content';contents.append(label);
      if(direction){const arrow=document.createElement('small');arrow.textContent=direction;contents.append(arrow);}
      button.append(key,contents);button.addEventListener('click',()=>shootTarget(index));$('answer-buttons').append(button);
    });
    responsive();
  }
  function hideFeedback(){ $('feedback').hidden=true; }
  function feedback(tag,text,solved=false,offerReveal=false) {
    $('feedback').classList.toggle('hint',!solved);$('feedback-tag').textContent=tag;$('feedback-text').textContent=text;
    $('continue').hidden=!solved;$('continue').textContent=level===11?'Spustit reaktor →':isJunction(level)?`Pokračovat ${['vlevo ↖','rovně ↑','vpravo ↗'][selectedExit]}`:'Otevřít bránu →';
    $('reveal').hidden=!offerReveal;$('dismiss').hidden=solved;$('feedback').hidden=false;
  }
  function playSound(kind) {
    audio.play(kind);
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
    const hit=raycaster.intersectObjects([...targetMeshes,...spiders.hitMeshes],false)[0];
    if(hit?.object.userData.spider) {
      lastShot=performance.now();beam(hit.point,true);const position=spiders.hit(hit.object.userData.spider);
      if(position){spiderCount++;burst(position,0xb1ed8a);playSound('splat');$('bonus-score').textContent=`🕷 ${spiderCount} · ${spiderCount*100} bodů`;$('bonus-toast').textContent='PLÁC! +100 bonusových bodů';$('bonus-toast').hidden=false;clearTimeout(bonusTimer);bonusTimer=setTimeout(()=>{$('bonus-toast').hidden=true;},1600);}
      return;
    }
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
      mode='solved';keys.clear();moving.clear();burst(point,colors[Math.floor(level/4)]);target.group.visible=false;selectedExit=index;
      currentRoom.gates[isJunction(level)?index:0].open=1;
      if(level<11){const pose=halls.nextPose(level,index);nextRoom=halls.room(level+1,pose.position,pose.angle);}
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
  function positionPlayer(){camera.position.set(0,1.7,5);yaw=0;pitch=0;camera.rotation.set(0,0,0);fill.position.copy(camera.position);}
  function start() {
    closeMixer(false);audio.pause();void audio.start().then(()=>{if(mode==='playing')playSound('launch');});
    unlock();questions=createMission();level=0;results=[];attempts=0;helped=false;mode='playing';flight=null;lastShot=-Infinity;
    keys.clear();moving.clear();halls.reset();currentRoom=halls.room(0);nextRoom=null;spiderCount=0;trail=[];
    clearTimeout(bonusTimer);$('bonus-toast').hidden=true;
    orb.material.emissive.setHex(0x1a4543);orb.material.emissiveIntensity=.8;
    $('intro').hidden=true;$('victory').hidden=true;$('paused').hidden=true;$('hud').hidden=false;$('hud').inert=false;canvas.inert=false;
    document.querySelector('.brief').style.visibility='visible';$('transit').hidden=true;
    hideFeedback();enterRoom();canvas.focus({preventScroll:true});
  }
  function pause() {
    audio.pause();closeMixer(false);
    if(!['playing','solved','transit'].includes(mode))return;
    const old=mode;mode='paused';$('paused').dataset.previous=old;keys.clear();moving.clear();pointer=null;unlock();$('hud').inert=true;canvas.inert=true;$('paused').hidden=false;$('resume').focus({preventScroll:true});
  }
  function resume(){closeMixer(false);mode=$('paused').dataset.previous||'playing';$('hud').inert=false;canvas.inert=false;$('paused').hidden=true;void audio.start();(mode==='solved'?$('continue'):canvas).focus({preventScroll:true});}
  function victory() {
    mode='victory';unlock();keys.clear();moving.clear();hideFeedback();$('transit').hidden=true;document.querySelector('.brief').style.visibility='visible';
    $('hud').inert=true;canvas.inert=true;$('victory').hidden=false;orb.material.emissive.setHex(0x59ffd2);orb.material.emissiveIntensity=3;
    const count=results.filter(result=>result.firstTry).length;$('victory-stats').textContent=`12 / 12 bran otevřeno · ${count} na první zásah`;
    $('victory-bonus').textContent=`🕷 ${spiderCount} ${spiderCount===1?'pavouk':spiderCount>=2&&spiderCount<=4?'pavouci':'pavouků'} · ${spiderCount*100} bonusových bodů`;
    $('victory-path').textContent=`Rozcestí: ${trail.join(' · ')}`;
    $('review').replaceChildren();const missed=results.filter(result=>!result.firstTry);
    if(!missed.length){const text=document.createElement('p');text.textContent='Všechny cenovky jsi rozluštila na první zásah. Zkus další misi — čísla se změní.';$('review').append(text);}
    else for(const result of missed){const text=document.createElement('p');const title=document.createElement('strong');title.textContent=`${result.skill}: `;text.append(title,document.createTextNode(result.explanation));$('review').append(text);}
    $('debrief').open=false;$('again').focus({preventScroll:true});audio.pause();playSound('win');
  }
  function advance() {
    if(mode!=='solved')return;
    hideFeedback();unlock();keys.clear();moving.clear();
    playSound('door');
    const final=level===11;
    if(final){orb.material.emissive.setHex(0x59ffd2);orb.material.emissiveIntensity=3;}
    const angle=exitAngle(level,selectedExit);
    if(isJunction(level))trail.push(['↖','↑','↗'][selectedExit]);
    const end=final?new THREE.Vector3(0,2.2,-23):nextRoom.group.localToWorld(new THREE.Vector3(0,1.7,5));
    const path=new THREE.CatmullRomCurve3([camera.position.clone(),new THREE.Vector3(0,1.7,-4),end]);
    mode='transit';flight={elapsed:0,path,angle,yaw,pitch,final};
    $('transit').textContent=final?'Reaktor na dohled':isJunction(level)?`Brána otevřena · odbočujeme ${['vlevo','rovně','vpravo'][selectedExit]}`:'Brána otevřena · letíme dál';
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
      halls.animate(dt,reduced);spiders.animate(time,reduced);
      if(mode==='playing') {
        const forward=(keys.has('KeyW')||keys.has('ArrowUp')||moving.has('forward')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')||moving.has('backward')?1:0);
        const sideways=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
        yaw+=(keys.has('ArrowLeft')?1:0)*dt*1.2-(keys.has('ArrowRight')?1:0)*dt*1.2;yaw=THREE.MathUtils.clamp(yaw,-1.25,1.25);
        const step=4*dt/Math.max(1,Math.hypot(forward,sideways));
        camera.position.x+=(-Math.sin(yaw)*forward+Math.cos(yaw)*sideways)*step;
        camera.position.z+=(-Math.cos(yaw)*forward-Math.sin(yaw)*sideways)*step;
        camera.position.x=THREE.MathUtils.clamp(camera.position.x,-5.3,5.3);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-4,7);
      }
      if(mode==='transit') {
        flight.elapsed+=dt;const t=reduced?1:Math.min(flight.elapsed/2.2,1),ease=t*t*(3-2*t);
        camera.position.copy(flight.path.getPoint(ease));yaw=THREE.MathUtils.lerp(flight.yaw,flight.angle,ease);pitch=flight.pitch*(1-ease);
        if(t>=1){if(flight.final){flight=null;victory();}else{
          // Rebase the modular station at the new room; camera and room move together.
          halls.remove(currentRoom);currentRoom=nextRoom;nextRoom=null;currentRoom.group.position.set(0,0,0);currentRoom.group.rotation.y=0;
          level++;attempts=0;helped=false;mode='playing';flight=null;lastShot=-Infinity;
          enterRoom();$('transit').hidden=true;document.querySelector('.brief').style.visibility='visible';responsive();canvas.focus({preventScroll:true});
        }}
      }
      camera.rotation.set(pitch,yaw,0);fill.position.copy(camera.position);
      for(const target of targets){target.group.position.y=target.baseY+(reduced?0:Math.sin(time*1.3+target.index)*.055);if(!reduced){target.ring.rotation.z=time*.12;target.body.rotation.y=time*.3;}}
      if(mode==='playing') {
        scene.updateMatrixWorld(true);raycaster.setFromCamera(document.pointerLockElement===canvas?center:hover,camera);
        const hit=raycaster.intersectObjects([...targetMeshes,...spiders.hitMeshes],false)[0];const next=hit?.object.userData.spider?'spider':hit?.object.userData.index??null;
        if(next!==lastHover){$('crosshair').classList.toggle('hot',next!==null);$('aim-label').textContent=next===null?'':next==='spider'?'🕷 BONUS +100':`TERČ ${next+1}`;lastHover=next;}
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
    if(event.code==='Escape'){if(!$('audio-panel').hidden)closeMixer();else if(mode==='paused')resume();else pause();return;}
    if(event.target.closest('input,select,textarea')||!$('audio-panel').hidden)return;
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
  $('sound').addEventListener('click',()=>{audio.update({enabled:!audio.settings.enabled});if(audio.settings.enabled)void audio.unlock();});
  for(const id of ['audio-settings','paused-audio'])$(id).addEventListener('click',openMixer);
  $('audio-close').addEventListener('click',()=>closeMixer());
  document.addEventListener('pointerdown',event=>{if(!$('audio-panel').hidden&&!event.target.closest('#audio-panel,#audio-settings,#paused-audio'))closeMixer(false);});
  for(const [id,key] of [['audio-enabled','enabled'],['music-enabled','music'],['effects-enabled','effects']])$(id).addEventListener('change',()=>{audio.update({[key]:$(id).checked});void audio.unlock();});
  for(const channel of ['music','effects'])$(`${channel}-volume`).addEventListener('input',()=>{audio.update({[`${channel}Volume`]:Number($(`${channel}-volume`).value)/100});void audio.unlock();});
  syncAudioControls();
  $('start').addEventListener('click',start);$('restart').addEventListener('click',start);$('again').addEventListener('click',start);
  $('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);
  $('hint').addEventListener('click',()=>hint());$('reveal').addEventListener('click',()=>hint(true));$('dismiss').addEventListener('click',hideFeedback);$('continue').addEventListener('click',advance);$('fire').addEventListener('click',()=>shootAt());
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();$('intro').hidden=false;$('paused').hidden=true;$('hud').hidden=true;$('loading-error').hidden=false;$('loading-error').textContent='Grafika se přerušila. Obnov stránku a začni novou misi.';$('start').textContent='Obnovit stránku';$('start').onclick=()=>location.reload();});
  if(matchMedia('(pointer: coarse)').matches)$('control-tip').textContent='Ťukni na terč · tažením rozhlížení · šipkami chůze';
  for(const id of ['theme','intro-theme','paused-theme'])$(id).addEventListener('click',()=>{lightTheme=!lightTheme;setTheme();});
  currentRoom=halls.room(0);enterRoom();setTheme();responsive();renderer.setAnimationLoop(animate);
  $('start').disabled=false;$('start').textContent='Vstoupit na stanici →';
}
