// Shared helpers for the Smart Eco Station 3D viewers (three.js r147, units = mm)
(function(){
const ES={};window.ES=ES;
const dark=matchMedia('(prefers-color-scheme: dark)').matches;
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.05},o));
ES.M=M;
ES.mat={
  wall:M(0xf4f6f8,{transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}),
  acrylic:M(0xbfe6ff,{transparent:true,opacity:.16,roughness:.05,side:THREE.DoubleSide,depthWrite:false}),
  frame:M(0x3c4650),steel:M(0xc9d1d8,{metalness:.9,roughness:.25}),plate:M(0x2f9e6b),
  funnel:M(0xf0b429,{side:THREE.DoubleSide}),flap:M(0x2b7bb9),servo:M(0x2d5fd6),gear:M(0xffffff,{roughness:.4}),
  pcb:M(0x1e1e1e),pcbBlue:M(0x1d4ed8),pcbGreen:M(0x0f7a4a),uno:M(0x00838f),probe:M(0xd8a640,{metalness:.7,roughness:.3}),
  lens:M(0x111111,{roughness:.1}),led:M(0xff3b30),silver:M(0xb8c0c8,{metalness:.8,roughness:.3}),
  bag:M(0x2c3a2f,{roughness:.35,transparent:true,opacity:.95}),wet:M(0x8a5a2b),dry:M(0xd9c59a),
  outlet:M(0x9aa6b2,{side:THREE.DoubleSide}),binWet:M(0x2e9d57,{transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}),
  binDry:M(0x2f6fd0,{transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}),
  cabinet:M(0xe9edf1,{transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}),
  wood:M(0xc8a27a),solar:M(0x1b2a4a,{metalness:.4,roughness:.25}),beam:new THREE.MeshBasicMaterial({color:0x37d67a,transparent:true,opacity:.22,depthWrite:false}),
  card:M(0xffffff),rfid:M(0x1565c0),dht:M(0xffffff),mq:M(0x8d99a6,{metalness:.6}),rain:M(0x3a3f45,{metalness:.5}),cable:M(0x222222)
};
const mat=ES.mat;
ES.box=(w,h,d,m,x,y,z,parent)=>{const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);g.position.set(x||0,y||0,z||0);g.castShadow=g.receiveShadow=true;if(parent)parent.add(g);return g;};
ES.cyl=(rt,rb,h,m,seg=24,open=false)=>{const g=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg,1,open),m);g.castShadow=true;return g;};
ES.anchorAt=(parent,x,y,z)=>{const a=new THREE.Object3D();a.position.set(x,y,z);parent.add(a);return a;};
const box=ES.box,cyl=ES.cyl,anchorAt=ES.anchorAt;
ES.clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));ES.seg=(t,a,b)=>ES.clamp((t-a)/(b-a));ES.ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
const seg=ES.seg,ease=ES.ease;

// ---------------- scene + UI ----------------
ES.setup=function(cfg){
  const canvas=document.getElementById('c');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene();scene.background=new THREE.Color(dark?0x151a1f:0xeef1f4);
  const camera=new THREE.PerspectiveCamera(35,1,1,20000);camera.position.set(...cfg.cam);
  const controls=new THREE.OrbitControls(camera,canvas);controls.target.set(...cfg.target);controls.enableDamping=true;controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff,0x8899aa,.75));
  const R=cfg.size||300;
  const sun=new THREE.DirectionalLight(0xffffff,.85);sun.position.set(R,R*2,R*1.3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-R*1.3,right:R*1.3,top:R*1.3,bottom:-R*1.3,near:10,far:R*6});scene.add(sun);
  const fill=new THREE.DirectionalLight(0xffffff,.3);fill.position.set(-R,R*.7,-R);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(R*1.6,64),M(dark?0x20272e:0xdfe4e9,{roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=cfg.floorY||0;floor.receiveShadow=true;scene.add(floor);
  const root=new THREE.Group();root.name=cfg.name;scene.add(root);
  const fx=new THREE.Group();scene.add(fx);
  const parts=[],walls=[];
  const ctx={scene,camera,controls,renderer,root,fx,parts,walls,t:0,playing:true,speed:1,dur:cfg.dur,flags:{}};
  ctx.part=(name,obj,anchor,note)=>{obj.name=name.replace(/[^A-Za-z0-9]+/g,'_');if(!obj.parent)root.add(obj);parts.push({name,obj,anchor,note});return obj;};
  document.getElementById('title').textContent=cfg.title;
  const slider=document.getElementById('t');slider.max=cfg.dur;
  const playB=document.getElementById('play');
  playB.onclick=()=>{ctx.playing=!ctx.playing;playB.textContent=ctx.playing?'Pause':'Play';playB.classList.toggle('on',ctx.playing);};
  document.getElementById('speed').onclick=e=>{ctx.speed=ctx.speed===1?.5:ctx.speed===.5?2:1;e.target.textContent='Speed '+ctx.speed+'x';};
  slider.oninput=()=>{ctx.t=+slider.value;};
  (cfg.toggles||[]).forEach(tg=>{const b=document.createElement('button');const upd=()=>b.textContent=tg.label+': '+tg.values[ctx.flags[tg.key]];
    ctx.flags[tg.key]=0;upd();b.onclick=()=>{ctx.flags[tg.key]=(ctx.flags[tg.key]+1)%tg.values.length;upd();};document.getElementById('extra').appendChild(b);});
  document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-w]').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    const m=b.dataset.w;walls.forEach(w=>{w.visible=m!=='off';});[mat.wall,mat.cabinet].forEach(mm=>{mm.opacity=m==='solid'?1:(mm===mat.wall?.3:.28);mm.transparent=m!=='solid';mm.depthWrite=m==='solid';mm.needsUpdate=true;});});
  let showLabels=true;document.getElementById('lbl').onclick=e=>{showLabels=!showLabels;e.target.classList.toggle('on',showLabels);};
  const statusEl=document.getElementById('status');
  ctx.status=(a,b)=>{statusEl.innerHTML=a+'<small>'+(b||'')+'</small>';};
  ctx.finish=function(update){
    const labelsEl=document.getElementById('labels'),list=document.getElementById('parts');
    parts.forEach((p,i)=>{const el=document.createElement('div');el.className='lab';el.innerHTML='<b>'+(i+1)+'</b>'+p.name;labelsEl.appendChild(el);p.el=el;
      const li=document.createElement('li');li.innerHTML='<span>'+p.name+'</span>'+(p.note?': '+p.note:'');li.onmouseenter=()=>el.classList.add('hl');li.onmouseleave=()=>el.classList.remove('hl');list.appendChild(li);});
    const v=new THREE.Vector3();
    const place=()=>{parts.forEach(p=>{if(!showLabels){p.el.style.display='none';return;}p.anchor.getWorldPosition(v);v.project(camera);
      p.el.style.display=v.z<1?'block':'none';p.el.style.left=((v.x+1)/2*innerWidth)+'px';p.el.style.top=((1-v.y)/2*innerHeight-14)+'px';});};
    const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};
    addEventListener('resize',resize);resize();
    let last=performance.now();
    const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(ctx.playing){ctx.t=(ctx.t+dt*ctx.speed)%cfg.dur;slider.value=ctx.t;}
      update(ctx.t);controls.update();renderer.render(scene,camera);place();requestAnimationFrame(loop);};
    requestAnimationFrame(loop);
    const b64=buf=>{const u=buf instanceof DataView?new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength):new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);};
    window.BS={
      pose(time,o={}){ctx.playing=false;ctx.t=time;slider.value=time;Object.assign(ctx.flags,o.flags||{});if(o.cam)camera.position.set(...o.cam);if(o.target)controls.target.set(...o.target);
        controls.update();update(time);renderer.render(scene,camera);place();},
      exportAll(stls){return new Promise(res=>{update(cfg.exportT||0);fx.visible=false;root.updateMatrixWorld(true);const out={};const stl=new THREE.STLExporter();
        out[cfg.file+'_full.stl']=b64(stl.parse(root,{binary:true}));
        const sep=cfg.stls?cfg.stls():{};for(const k in sep){sep[k].updateMatrixWorld(true);out[k]=b64(stl.parse(sep[k],{binary:true}));}
        new THREE.GLTFExporter().parse(root,glb=>{out[cfg.file+'.glb']=b64(glb);fx.visible=true;res(out);},e=>res({error:String(e)}),{binary:true});});}
    };
  };
  return ctx;
};

// ---------------- LCD 16x2 with live text ----------------
ES.lcd=function(color){
  const g=new THREE.Group();
  box(80,36,8,mat.pcbGreen,0,0,0,g);box(72,25,3,M(0x222222),0,0,4.5,g);
  const cv=document.createElement('canvas');cv.width=512;cv.height=128;const c2=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(64,16),new THREE.MeshBasicMaterial({map:tex}));scr.position.z=6.1;g.add(scr);
  let lastTxt='';
  g.userData.set=(a,b)=>{const k=a+'|'+b;if(k===lastTxt)return;lastTxt=k;c2.fillStyle=color||'#3b7bff';c2.fillRect(0,0,512,128);
    c2.fillStyle='#e8f1ff';c2.font='bold 50px monospace';c2.textBaseline='top';c2.fillText(a.slice(0,16),12,8);c2.fillText((b||'').slice(0,16),12,66);tex.needsUpdate=true;};
  g.userData.set('','');return g;
};

// ---------------- HC-SR04 ultrasonic + beam ----------------
ES.ultrasonic=function(){ // faces -y (down) by default
  const g=new THREE.Group();box(45,1.6,20,mat.pcbBlue,0,0,0,g);
  [-13,13].forEach(x=>{const c=cyl(8,8,12,mat.silver,20);c.position.set(x,-7,0);g.add(c);});
  const beam=new THREE.Mesh(new THREE.ConeGeometry(30,1,24,1,true),mat.beam);beam.rotation.x=Math.PI;beam.position.y=-13;beam.visible=false;g.add(beam);
  g.userData.beam=(len,on)=>{beam.visible=on;beam.scale.set(len/300+.2,len,len/300+.2);beam.position.y=-13-len/2;};
  return g;
};

// ---------------- SG90 ----------------
ES.sg90=function(){const g=new THREE.Group();box(22.8,22.5,12.2,mat.servo,0,0,0,g);box(32.5,2.5,12.2,mat.servo,0,4,0,g);
  const s=cyl(2.4,2.4,5,mat.gear,12);s.position.set(-5.5,13.5,0);g.add(s);return g;}; // shaft points +y

// ---------------- bag splitter (same as Bag_Splitter_3D) ----------------
// origin = bottom centre of the 180x170x330 box. Returns handles.
ES.splitter=function(parent,opts={}){
  const W=180,D=170,H=330,T=4,HINGE_Y=192,HINGE_Z=-D/2+12,FLAP_Y=75,BB=156,BH=20;
  const g=new THREE.Group();parent.add(g);const walls=[];
  const housing=new THREE.Group();g.add(housing);
  const hw=(w,h,d,x,y,z,m=mat.wall)=>{const b=box(w,h,d,m,x,y,z,housing);b.castShadow=false;walls.push(b);return b;};
  hw(T,H,D,-W/2+T/2,H/2,0);hw(T,H,D,W/2-T/2,H/2,0);hw(W,H,T,0,H/2,-D/2+T/2);hw(W,H,T,0,H/2,D/2-T/2,mat.acrylic);
  hw(W,T,D/2-20,0,T/2,-(20+(D/2-20)/2));hw(W,T,D/2-20,0,T/2,(20+(D/2-20)/2));hw(20,T,40,-80,T/2,0);hw(60,T,40,0,T/2,0);hw(20,T,40,80,T/2,0);
  const LY=H-T/2;hw(30,T,D,-75,LY,0);hw(30,T,D,75,LY,0);hw(120,T,45,0,LY,-62.5);hw(120,T,10,0,LY,80);
  box(T,36,D-2*T,mat.frame,0,T+18,0,housing);
  const mouth=cyl(95,70,18,M(0x3c4650,{side:THREE.DoubleSide}),4,true);mouth.rotation.y=Math.PI/4;mouth.scale.set(1,1,.85);mouth.position.set(0,H+9,17.5);g.add(mouth);
  // camera
  const cam=new THREE.Group();const cb=new THREE.Group();box(4,40,27,mat.pcb,0,0,0,cb);
  const lens=cyl(4.5,4.5,6,mat.lens,20);lens.rotation.z=Math.PI/2;lens.position.set(5,6,0);cb.add(lens);
  const ledMat=M(0xff3b30);const led=cyl(2,2,2,ledMat,12);led.rotation.z=Math.PI/2;led.position.set(3,-8,6);cb.add(led);
  box(10,6,30,mat.frame,-5,22,0,cb);cb.rotation.z=-.75;cam.add(cb);cam.position.set(-W/2+T+8,H-40,10);g.add(cam);
  // press
  const pressG=new THREE.Group();g.add(pressG);
  const press=new THREE.Group();press.position.set(0,HINGE_Y,HINGE_Z);pressG.add(press);
  box(150,6,128,mat.plate,0,0,70,press);for(let x=-48;x<=48;x+=24)box(3,5,118,mat.frame,x+12,-5.5,72,press);box(150,10,10,mat.plate,0,0,6,press);
  const rod=cyl(3,3,W+14,mat.steel,16);rod.rotation.z=Math.PI/2;rod.position.set(7,HINGE_Y,HINGE_Z);pressG.add(rod);
  const gearG=new THREE.Group();g.add(gearG);
  const gear=(r,n,th)=>{const q=new THREE.Group();const c=cyl(r,r,th,mat.gear,32);c.rotation.z=Math.PI/2;q.add(c);
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const t=box(th,3,3.2,mat.gear,0,Math.cos(a)*(r+1.2),Math.sin(a)*(r+1.2),q);t.rotation.x=-a;}return q;};
  const big=gear(16,24,4);big.position.set(W/2+3,HINGE_Y,HINGE_Z);gearG.add(big);
  const small=gear(8,12,4);small.position.set(W/2+3,HINGE_Y,HINGE_Z+26.5);gearG.add(small);
  const sv=new THREE.Group();box(22.5,12.2,22.8,mat.servo,0,0,0,sv);box(2.5,12.2,32.5,mat.servo,-6,0,0,sv);sv.position.set(W/2+19,HINGE_Y,HINGE_Z+32);gearG.add(sv);
  // blades
  const blades=new THREE.Group();g.add(blades);
  const sh=new THREE.Shape();const L=150,N=6,tw=L/N;sh.moveTo(-L/2,0);for(let i=0;i<N;i++){sh.lineTo(-L/2+i*tw+tw/2,BH);sh.lineTo(-L/2+(i+1)*tw,0);}sh.lineTo(-L/2,0);
  const bg=new THREE.ExtrudeGeometry(sh,{depth:1.5,bevelEnabled:false});bg.translate(0,0,-.75);bg.rotateY(Math.PI/2);
  [-60,-36,-12,12,36,60].forEach(x=>{const b=new THREE.Mesh(bg,mat.steel);b.position.set(x,BB,0);b.castShadow=true;blades.add(b);box(6,6,D-2*T,mat.frame,x,BB-3,0,blades);});
  box(W-2*T,6,8,mat.frame,0,BB-3,-D/2+T+4,blades);box(W-2*T,6,8,mat.frame,0,BB-3,D/2-T-4,blades);
  // funnel
  const fn=cyl(84*Math.SQRT2,35*Math.SQRT2,50,mat.funnel,4,true);fn.rotation.y=Math.PI/4;fn.position.y=125;fn.scale.set(1,1,.95);g.add(fn);
  // flap + moisture
  const flapG=new THREE.Group();g.add(flapG);
  const flap=new THREE.Group();flap.position.set(0,FLAP_Y,0);flapG.add(flap);
  box(124,4,110,mat.flap,0,0,0,flap);box(124,8,3,mat.flap,0,4,-55,flap);box(124,8,3,mat.flap,0,4,55,flap);
  const sensor=new THREE.Group();box(20,2,14,mat.pcb,0,3,-20,sensor);[-5,5].forEach(x=>box(3.5,1,30,mat.probe,x,2.5,2,sensor));flap.add(sensor);
  const ax=cyl(2.5,2.5,D-2*T,mat.steel,12);ax.rotation.x=Math.PI/2;flap.add(ax);
  const fs=new THREE.Group();box(12.2,22.8,22.5,mat.servo,0,0,0,fs);box(12.2,32.5,2.5,mat.servo,0,0,6,fs);fs.position.set(0,FLAP_Y+5.5,-D/2-12);flapG.add(fs);
  // "eyes" ultrasonic on back wall above the flap, looking down
  const eyes=ES.ultrasonic();eyes.position.set(0,FLAP_Y+60,-D/2+T+14);eyes.rotation.x=0.35;g.add(eyes);
  const OPEN=-88*Math.PI/180;
  return {g,walls,press,big,small,flap,ledMat,sensor,eyes,cam,mouth,blades,fn,flapG,pressG,gearG,housing,OPEN,
    dims:{W,D,H,HINGE_Y,HINGE_Z,FLAP_Y,TOP:BB+BH},
    setPress(k){const a=OPEN*(1-k);press.rotation.x=a;big.rotation.x=a;small.rotation.x=-2*a;return HINGE_Y+Math.sin(-a)*(10-HINGE_Z)-8;},
    setFlap(tilt){flap.rotation.z=tilt;},
    camLed(on){ledMat.emissive.setHex(on?0xff2a1a:0);},
    anchors:{slot:anchorAt(g,0,H+22,17.5),cam:anchorAt(cam,0,12,0),plate:anchorAt(press,0,6,95),servo:anchorAt(gearG,W/2+20,HINGE_Y+12,HINGE_Z+30),
      blades:anchorAt(blades,36,BB+BH+4,40),funnel:anchorAt(g,60,140,60),flap:anchorAt(flapG,-55,FLAP_Y+6,-40),moist:anchorAt(flap,0,6,0),eyes:anchorAt(eyes,0,4,0)}};
};

// ---------------- scissor compactor ----------------
// Two plates: fixed top plate (on bin frame) + press plate, joined by a 3-stage scissor. SG90 opens the scissor.
// o: {w,d,topY,L,stages,minDeg,maxDeg}
ES.compactor=function(parent,o){
  const g=new THREE.Group();parent.add(g);
  const L=o.L,S=o.stages,PT=8;
  const top=new THREE.Group();g.add(top);
  box(o.w+30,PT,o.d+30,mat.frame,0,o.topY+PT/2,0,top);
  const plate=new THREE.Group();g.add(plate);
  box(o.w,PT,o.d,mat.plate,0,-PT/2,0,plate);box(50,PT+1,26,M(0x1a2a22),0,-PT/2,0,plate); // sensor window
  for(let x=-o.w/2+20;x<=o.w/2-20;x+=40)box(4,6,o.d-10,mat.frame,x,-PT-3,0,plate); // ribs
  const arms=[];const zs=[-o.d/2+18,o.d/2-18];
  zs.forEach(z=>{for(let i=0;i<S;i++)[1,-1].forEach(s=>{const a=box(L,6,4,mat.steel,0,0,z+s*3,g);a.userData={i,s};arms.push(a);});});
  const pins=[];for(let i=0;i<=S;i++)[-1,1].forEach(s=>{const p=cyl(3,3,o.d-30,mat.frame,10);p.rotation.x=Math.PI/2;g.add(p);pins.push({p,i,s});});
  const servo=ES.sg90();servo.rotation.x=Math.PI/2;g.add(servo);
  const fill=ES.ultrasonic();fill.position.set(0,o.topY-2,0);g.add(fill);
  const minA=(o.minDeg||12)*Math.PI/180,maxA=(o.maxDeg||70)*Math.PI/180;
  const api={g,plate,top,fill,servo,arms,
    set(k){const a=minA+(maxA-minA)*k;const h=L*Math.sin(a),w=L*Math.cos(a);
      arms.forEach(m=>{const{i,s}=m.userData;m.position.set(0,o.topY-h*(i+.5),m.position.z);m.rotation.z=s*a;});
      pins.forEach(({p,i,s})=>{p.position.set(s*w/2,o.topY-h*i,0);});
      plate.position.set(0,o.topY-h*S,0);
      servo.position.set(-w/2,o.topY-8,-o.d/2-4);servo.rotation.z=a;
      return o.topY-h*S-PT; },
    anchors:{plate:anchorAt(plate,o.w/2-10,0,o.d/2),top:anchorAt(top,-o.w/2,o.topY+PT,o.d/2),fill:anchorAt(fill,0,2,-12),servo:anchorAt(servo,0,0,0)}};
  api.set(0);return api;
};

// ---------------- loose waste pile that grows ----------------
ES.pile=function(parent,w,d,y0,m){ // returns set(height) -> pile top
  const g=new THREE.Group();parent.add(g);
  const body=box(w,1,d,m,0,0,0,g);
  const lumps=[];const r=(a=>()=>{a=(a*9301+49297)%233280;return a/233280;})(11);
  for(let i=0;i<26;i++){const s=new THREE.Mesh(new THREE.DodecahedronGeometry(10+r()*12),m);s.position.set((r()-.5)*(w-30),0,(r()-.5)*(d-30));s.userData.o=r()*10;s.castShadow=true;g.add(s);lumps.push(s);}
  return {g,set(h,squash){h=Math.max(1,h);body.scale.y=h;body.position.y=y0+h/2;lumps.forEach(l=>{l.position.y=y0+h+l.userData.o*(1-squash)-4;l.scale.y=1-.7*squash;});}};
};
})();
