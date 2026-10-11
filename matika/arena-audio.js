// Original procedural soundtrack and effects. No recordings or downloads needed.
const STORAGE_KEY='percentage-arena-audio-v1';
const defaults={enabled:true,music:true,effects:true,musicVolume:.28,effectsVolume:.7};
const frequency=note=>440*2**((note-69)/12);

export class ArenaAudio {
  constructor(onChange=()=>{}) {
    this.settings={...defaults};this.onChange=onChange;
    try {
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
      for(const key of ['enabled','music','effects'])if(typeof saved?.[key]==='boolean')this.settings[key]=saved[key];
      for(const key of ['musicVolume','effectsVolume'])if(Number.isFinite(saved?.[key]))this.settings[key]=Math.max(0,Math.min(1,saved[key]));
    } catch { /* Private browsing or unavailable storage: use defaults. */ }
    this.context=null;this.active=false;this.unavailable=false;this.timer=null;
    this.musicVoices=new Set();this.effectVoices=new Set();
  }
  async unlock() {
    if(!this.settings.enabled||this.unavailable)return;
    try {
      if(!this.context) {
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        if(!AudioContext)throw new Error('Web Audio unavailable');
        this.context=new AudioContext();
        this.master=this.context.createGain();this.musicBus=this.context.createGain();this.effectsBus=this.context.createGain();
        const limiter=this.context.createDynamicsCompressor();
        limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=6;
        this.musicBus.connect(this.master);this.effectsBus.connect(this.master);this.master.connect(limiter);limiter.connect(this.context.destination);
        this.noise=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate);
        const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        this.applyVolumes();
      }
      await this.context.resume();
      this.syncMusic();
    } catch { this.unavailable=true;this.stopMusic();this.onChange(); }
  }
  update(patch) {
    for(const key of ['enabled','music','effects'])if(typeof patch[key]==='boolean')this.settings[key]=patch[key];
    for(const key of ['musicVolume','effectsVolume'])if(Number.isFinite(patch[key]))this.settings[key]=Math.max(0,Math.min(1,patch[key]));
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(this.settings));}catch { /* Settings still work for this visit. */ }
    this.applyVolumes();this.syncMusic();this.onChange();
    if(!this.settings.enabled||!this.settings.effects)this.stopVoices(this.effectVoices);
  }
  applyVolumes() {
    if(!this.context)return;
    const t=this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.enabled?.8:0,t,.025);
    this.musicBus.gain.setTargetAtTime(this.settings.music?this.settings.musicVolume:0,t,.025);
    this.effectsBus.gain.setTargetAtTime(this.settings.effects?this.settings.effectsVolume:0,t,.025);
  }
  async start() {this.active=true;await this.unlock();this.syncMusic();}
  pause() {this.active=false;this.stopMusic();this.stopVoices(this.effectVoices);}
  stopVoices(voices) {
    if(!this.context)return;
    const t=this.context.currentTime;
    for(const voice of voices) {
      voice.gain.gain.cancelScheduledValues(t);voice.gain.gain.setTargetAtTime(0,t,.01);
      try {voice.source.stop(t+.06);}catch { /* Already ended. */ }
    }
    voices.clear();
  }
  stopMusic() {if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.stopVoices(this.musicVoices);}
  syncMusic() {
    if(!this.active||!this.settings.enabled||!this.settings.music||!this.settings.musicVolume||this.context?.state!=='running') {this.stopMusic();return;}
    if(this.timer!==null)return;
    this.step=0;this.nextBeat=this.context.currentTime+.04;
    this.scheduleMusic();this.timer=setInterval(()=>this.scheduleMusic(),40);
  }
  voice(bus,at,duration,volume,{note=60,type='sine',endNote=null,noise=false,cutoff=2200,attack=.012}={}) {
    const ctx=this.context;if(!ctx)return;
    const source=noise?ctx.createBufferSource():ctx.createOscillator();
    if(noise)source.buffer=this.noise;
    else {source.type=type;source.frequency.setValueAtTime(frequency(note),at);if(endNote!==null)source.frequency.exponentialRampToValueAtTime(frequency(endNote),at+duration*.8);}
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,at);
    const gain=ctx.createGain();gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+Math.min(attack,duration*.2));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(filter);filter.connect(gain);gain.connect(bus);
    const voices=bus===this.musicBus?this.musicVoices:this.effectVoices;
    const voice={source,gain};voices.add(voice);
    source.onended=()=>{voices.delete(voice);source.disconnect();filter.disconnect();gain.disconnect();};
    source.start(at);source.stop(at+duration+.03);return voice;
  }
  scheduleMusic() {
    const ctx=this.context, eighth=60/92/2;
    // Skip missed beats when a browser stalls; never schedule a backlog of notes.
    if(this.nextBeat<ctx.currentTime-.1)this.nextBeat=ctx.currentTime+.04;
    while(this.nextBeat<ctx.currentTime+.16) {
      const step=this.step%64,bar=step%16;
      const chord=[[52,55,59],[48,52,55],[55,59,62],[50,54,57]][Math.floor(step/16)];
      const at=this.nextBeat;
      if(bar===0)for(const note of chord)this.voice(this.musicBus,at,eighth*15,.055,{note,type:'sine',cutoff:1200,attack:.35});
      if(bar%4===0)this.voice(this.musicBus,at,eighth*2.5,.11,{note:chord[0]-12,type:'triangle',cutoff:550,attack:.03});
      if(bar%2===0)this.voice(this.musicBus,at,eighth*1.7,.052,{note:chord[[0,1,2,1,0,2,1,2][bar/2]]+12,type:'sine',cutoff:2600});
      if(bar%4===0)this.voice(this.musicBus,at,.16,.10,{note:38,endNote:22,cutoff:180});
      if(bar%4===2)this.voice(this.musicBus,at,.07,.019,{noise:true,cutoff:5000,attack:.002});
      this.step++;this.nextBeat+=eighth;
    }
  }
  play(kind) {
    if(!this.settings.enabled||!this.settings.effects||this.unavailable||this.context?.state!=='running')return;
    const at=this.context.currentTime+.005,bus=this.effectsBus;
    const note=(n,t,d,v,extra={})=>this.voice(bus,at+t,d,v,{note:n,...extra});
    if(kind==='shot') {
      // Mžvžhůůů: sharp crack, descending resonant buzz, and a low tail.
      const laser=note(92,0,.38,.23,{type:'sawtooth',endNote:34,cutoff:4200,attack:.003});
      const mod=this.context.createOscillator(),depth=this.context.createGain();
      mod.frequency.setValueAtTime(47,at);mod.frequency.exponentialRampToValueAtTime(17,at+.3);
      depth.gain.setValueAtTime(140,at);depth.gain.exponentialRampToValueAtTime(6,at+.35);
      mod.connect(depth);depth.connect(laser.source.frequency);mod.start(at);mod.stop(at+.4);
      mod.onended=()=>{mod.disconnect();depth.disconnect();};
      note(67,.015,.48,.14,{type:'triangle',endNote:28,cutoff:1600,attack:.004});
      this.voice(bus,at,.085,.085,{noise:true,cutoff:6500,attack:.002});
    } else if(kind==='wrong') {
      note(48,.1,.2,.15,{type:'triangle'});note(43,.28,.26,.12,{type:'triangle'});
    } else if(kind==='door') {
      this.voice(bus,at,.65,.10,{noise:true,cutoff:1000,attack:.2});
      note(38,0,.7,.14,{type:'triangle',endNote:62,cutoff:1400,attack:.08});
    } else {
      const notes=kind==='win'?[64,67,71,76,79,83]:kind==='launch'?[52,59,64]:[64,67,71,76];
      notes.forEach((n,i)=>note(n,i*.1,kind==='win'?.75:.28,.14,{type:'sine',attack:.01}));
      if(kind==='win')for(const n of [52,55,59])note(n,.3,1.2,.08,{type:'triangle',cutoff:1600,attack:.12});
    }
  }
}
