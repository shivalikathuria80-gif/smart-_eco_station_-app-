(function(){
// Threaded-rod compactors: one 5 V geared DC motor + M8 threaded rod per bin, drive column BEHIND the bin.
const {mat,box,cyl,anchorAt,seg,ease,clamp,M}=ES;
const BW=250,BD=320,BH=380,T=4;          // bin (same as Counting_System_3D)
const SHELF=420;                          // shelf above the bins
const PARK=386,LOW=160;                   // plate bottom: parked (just above the rim) .. lowest allowed
const ZC=-197;                            // drive column axis (behind the back wall)
const PX=137,PZ=172;                      // frame post centres
let wet,dry;
const ctx=ES.setup({name:'ThreadedRodCompactors',title:'Smart Eco Station: threaded-rod compactors',file:'threaded_compactors',dur:30,
  cam:[950,760,1150],target:[0,210,-40],size:520,exportT:0,
  stls:()=>({'carriage_nut_block.stl':wet.carriageBody,'bearing_block_x2.stl':wet.topBlock,'press_plate_236x300.stl':wet.plateBody,'motor_mount.stl':wet.motorMount})});
const {root,part,walls}=ctx;
const blk=M(0x2b2f36),printed=M(0xf2f2f2),nutM=M(0xaab4bd,{metalness:.9,roughness:.3}),brass=M(0xc9a227,{metalness:.8,roughness:.3});
const rodM=M(0x8f99a3,{metalness:.9,roughness:.35}),stripe=M(0xff8a00),gbox=M(0xd0d6dc,{metalness:.85,roughness:.3}),can=M(0x30343a,{metalness:.6,roughness:.4});
const sw=M(0x222222),swLever=M(0xd9dde1,{metalness:.8});

// ghost shelf (shows it all fits underneath)
const shelf=box(760,6,400,M(0xc8a27a,{transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}),0,SHELF+3,-20,root);shelf.castShadow=false;walls.push(shelf);
part('Shelf above the bins (420 mm)',shelf,anchorAt(shelf,-300,8,150),'Nothing is fixed to it. The whole compactor hangs on the bin frame and fits under it');

function rig(x,name,binM,wm,inner){
  const g=new THREE.Group();g.position.x=x;root.add(g);
  // ---- bin with back slot + inner-side window ----
  const bin=new THREE.Group();g.add(bin);
  const bw=(w,h,d,px,py,pz)=>{const b=box(w,h,d,binM,px,py,pz,bin);b.castShadow=false;walls.push(b);return b;};
  const OX=inner*(BW/2-T/2),SX=-inner*(BW/2-T/2);
  bw(T,BH,BD,SX,BH/2,0);                                         // outer side
  bw(T,290,BD,OX,145,0);bw(T,10,BD,OX,375,0);                     // inner side, window 290..370
  bw(T,80,(BD-180)/2,OX,330,-(90+(BD-180)/4));bw(T,80,(BD-180)/2,OX,330,90+(BD-180)/4);
  bw(BW,BH,T,0,BH/2,BD/2-T/2);                                   // front
  bw(BW/2-8,BH,T,-(8+(BW/2-8)/2),BH/2,-BD/2+T/2);bw(BW/2-8,BH,T,8+(BW/2-8)/2,BH/2,-BD/2+T/2);bw(16,150,T,0,75,-BD/2+T/2); // back with slot
  box(BW,T,BD,binM,0,T/2,0,bin);
  box(BW+2,2,2,new THREE.MeshBasicMaterial({color:0xff5a36}),0,T+(BH-T)*.7,BD/2+1,bin);
  // chute stub into the window
  const ch=box(130,3,180,M(0x9aa6b2,{side:THREE.DoubleSide}),inner*(BW/2+55),352,0,g);ch.rotation.z=inner*.42;
  // ---- frame ----
  const frame=new THREE.Group();g.add(frame);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>box(20,416,20,mat.frame,sx*PX,208,sz*PZ,frame));
  box(2*PX+20,16,20,mat.frame,0,408,PZ,frame);box(2*PX+20,16,20,mat.frame,0,408,-PZ,frame);box(2*PX+20,16,20,mat.frame,0,108,-PZ,frame);
  [-1,1].forEach(s=>box(20,16,2*PZ,mat.frame,s*PX,408,0,frame));
  box(2*PX,12,20,mat.frame,0,410,0,frame);                       // sensor bar
  // ---- fill ultrasonic (kept) ----
  const fill=ES.ultrasonic();fill.position.set(0,402,0);g.add(fill);
  // ---- drive column ----
  const col=new THREE.Group();g.add(col);
  const bearingBlock=y=>{const b=new THREE.Group();box(150,16,30,printed,0,0,0,b);const br=cyl(11,11,7.2,nutM,24);br.position.y=0;b.add(br);
    [-50,50].forEach(px=>{const c=cyl(6,6,17,blk,16);c.position.x=px;b.add(c);});b.position.set(0,y,ZC);col.add(b);return b;};
  const topBlock=bearingBlock(408),botBlock=bearingBlock(108);
  // lock nuts above + below the top bearing (all the push goes into the frame, not the motor)
  [419,397].forEach(y=>{const n=cyl(7.5,7.5,6.5,nutM,6);n.position.set(0,y,ZC);col.add(n);});
  [-50,50].forEach(px=>{const r=cyl(4,4,316,mat.steel,16);r.position.set(px,258,ZC);col.add(r);});
  const screw=new THREE.Group();screw.position.set(0,0,ZC);col.add(screw);
  const sh=cyl(4,4,336,rodM,16);sh.position.y=90+168;screw.add(sh);
  for(let y=92;y<=424;y+=5){const r=new THREE.Mesh(new THREE.TorusGeometry(4,.7,4,16),rodM);r.rotation.x=Math.PI/2;r.position.y=y;screw.add(r);}
  box(1.6,320,2,stripe,0,258,3.6,screw);
  // motor (shaft up) + coupler + mount
  const motor=new THREE.Group();motor.position.set(0,0,ZC);col.add(motor);
  const c1=cyl(12.2,12.2,31,can,24);c1.position.y=24;motor.add(c1);const c2=cyl(12.5,12.5,21,gbox,24);c2.position.y=50;motor.add(c2);
  const shaft=cyl(2,2,12,nutM,12);shaft.position.y=66;motor.add(shaft);
  [-1,1].forEach(s=>{const t=box(3,4,2,brass,s*7,9,10,motor);});
  const coupler=new THREE.Group();coupler.position.set(0,0,ZC);col.add(coupler);
  const cp=cyl(9.5,9.5,25,M(0x5aa0e6,{metalness:.7,roughness:.3}),20);cp.position.y=80;coupler.add(cp);box(2,25,20,stripe,0,80,0,coupler);
  const motorMount=new THREE.Group();motorMount.position.set(0,0,ZC);col.add(motorMount);
  box(60,6,60,printed,0,3,0,motorMount);box(60,4,40,printed,0,60,-2,motorMount);
  [[-26,-26],[26,-26]].forEach(([a,b])=>box(6,60,6,printed,a,32,b,motorMount));
  const mmArm=box(6,4,26,printed,0,108,0,motorMount);mmArm.visible=false;
  // top limit switch (under the top block, hit by the carriage when parked)
  const lsw=new THREE.Group();box(20,10,6,sw,0,0,0,lsw);const lev=box(18,1,5,swLever,-3,-6,0,lsw);lev.rotation.z=.18;lsw.position.set(38,394,ZC+12);col.add(lsw);
  // ---- moving part: carriage + neck + press plate ----
  const mover=new THREE.Group();g.add(mover);
  const carriageBody=new THREE.Group();mover.add(carriageBody);
  box(140,50,30,printed,0,-19,ZC,carriageBody);
  const nut=cyl(7.5,7.5,13,nutM,6);nut.position.set(0,12.5,ZC);carriageBody.add(nut);
  [-50,50].forEach(px=>{const b=cyl(7.6,7.6,24,nutM,20);b.position.set(px,-19,ZC);carriageBody.add(b);});
  box(10,40,46,printed,0,-14,-PZ+5,carriageBody);                 // neck through the slot
  const plateBody=new THREE.Group();mover.add(plateBody);
  const pm=mat.plate,PW=236,PD=300,H=60;
  box(PW,6,(PD-H)/2,pm,0,3,-(H/2+(PD-H)/4),plateBody);box(PW,6,(PD-H)/2,pm,0,3,H/2+(PD-H)/4,plateBody);
  box((PW-H)/2,6,H,pm,-(H/2+(PW-H)/4),3,0,plateBody);box((PW-H)/2,6,H,pm,H/2+(PW-H)/4,3,0,plateBody);
  [-60,60].forEach(px=>box(4,10,PD-10,M(0x26795a),px,11,0,plateBody));
  box(4,10,(PD-H)/2-10,M(0x26795a),0,11,-(H/2+(PD-H)/4),plateBody);
  // waste
  const pile=ES.pile(g,BW-2*T-2,BD-2*T-2,T,wm);
  // labels
  const A=(o,x,y,z)=>anchorAt(o,x,y,z);
  part(name+' bin (250 x 320 x 380)',bin,A(bin,-inner*BW/2,BH*.45,BD/2),'Red line = 70% full. Slides out of the front when the plate is parked');
  if(name==='WET'){
    part('5 V geared motor 25GA-370 (6 V, 130 RPM)',motor,A(motor,0,30,14),'Shaft points UP. Runs on 5 V at about 100 RPM');
    part('Flexible coupler 4 mm to 8 mm',coupler,A(coupler,0,86,10),'Joins the motor shaft to the threaded rod');
    part('M8 threaded rod (330 mm, turns)',screw,A(screw,0,300,6),'1.25 mm per turn. Self-locking: the plate stays put with the motor off');
    part('Top bearing block: 608 bearing + 2 lock nuts',topBlock,A(topBlock,-60,10,0),'Takes all the push, so the motor gearbox never does');
    part('2 x 8 mm guide rods',col,A(col,-50,320,ZC+6),'Stop the plate from tilting or spinning');
    part('Carriage: M8 nut + 2 x LM8UU',carriageBody,A(carriageBody,-60,0,ZC+16),'Nut moves 1.25 mm down for every turn of the rod');
    part('Top limit switch',lsw,A(lsw,0,6,0),'Clicks when the plate is home (parked)');
    part('Press plate 236 x 300 (6 mm plywood)',plateBody,A(plateBody,PW/2-10,8,PD/2-10),'60 mm hole in the middle for the fill sensor');
    part('Fill sensor HC-SR04 (kept)',fill,A(fill,0,2,-12),'Measures the waste. Also tells the ESP32 when to stop pressing');
  } else {
    part('Back slot 16 mm (neck slides in it)',bin,A(bin,0,250,-BD/2-2),'Cover it with a brush or rubber strip');
    part('Chute end + side window',ch,A(ch,0,4,60),'Waste drops in under the parked plate');
  }
  return {g,mover,screw,coupler,pile,fill,lsw,lev,carriageBody,plateBody,topBlock,motorMount};
}
wet=rig(-165,'WET',mat.binWet,mat.wet,1);dry=rig(165,'DRY',mat.binDry,mat.dry,-1);

// electronics: DRV8833 + PCF8574 behind the bins
const el=new THREE.Group();el.position.set(0,250,-238);root.add(el);
box(120,90,4,M(0xc8a27a),0,0,0,el);
const drv=new THREE.Group();box(20,18,1.6,M(0x7b3fa0),0,0,0,drv);box(6,6,1,M(0x111111),0,0,1.2,drv);drv.position.set(-30,10,3);el.add(drv);
const pcf=new THREE.Group();box(40,20,1.6,mat.pcbBlue,0,0,0,pcf);box(14,6,2,M(0x111111),0,0,1.6,pcf);pcf.position.set(25,10,3);el.add(pcf);
part('DRV8833 motor driver (drives both motors)',drv,anchorAt(drv,0,10,2),'Instead of the L298N: loses about 0.3 V, not 2 V');
part('PCF8574 I2C expander',pcf,anchorAt(pcf,0,-14,2),'On the LCD wires (SDA 21, SCL 22). Gives 8 extra pins');

function cycle(b,t,t0,lv0,lv1,label){
  // returns {plateY, phase}
  const full=T+(BH-T)*lv1,squeezed=T+(BH-T)*.46,spring=T+(BH-T)*.49;
  const tDown=t0,tTouch=t0+3,tStop=t0+7,tUpEnd=t0+11.5;
  let py=PARK,ph='idle',lv;
  if(t<tDown){lv=lv0+(lv1-lv0)*seg(t,0,tDown);}
  else if(t<tTouch){py=PARK-(PARK-full)*seg(t,tDown,tTouch);ph='down';lv=lv1;}
  else if(t<tStop){py=full-(full-squeezed)*ease(seg(t,tTouch,tStop-.6));ph=t<tStop-.6?'press':'stall';lv=null;}
  else if(t<tUpEnd){py=squeezed+(PARK-squeezed)*seg(t,tStop,tUpEnd);ph='up';lv=null;}
  else {ph='home';lv=null;}
  let top,sq;
  if(lv!==null&&ph!=='press'){top=T+(BH-T)*lv;sq=0;}
  if(ph==='press'||ph==='stall'){top=py;sq=clamp((full-top)/(full-squeezed));}
  if(ph==='up'||ph==='home'){top=Math.min(spring,py);sq=1;}
  if(ph==='home'){const k=seg(t,tUpEnd,ctx.dur);top=spring+(T+(BH-T)*.52-spring)*k*(label==='WET'?1:0);}
  b.pile.set(top-T,sq);
  b.mover.position.y=py;
  const ang=-(PARK-py)/14*Math.PI*2;b.screw.rotation.y=ang;b.coupler.rotation.y=ang;
  const pressed=py>PARK-1;b.lev.rotation.z=pressed?0:.18;
  // fill sensor sees the waste through the hole (or the squeezed top)
  b.fill.userData.beam(Math.max(10,390-top),ph==='idle'||ph==='home'||ph==='press'||ph==='stall');
  const pct=Math.round(((top-T)/(BH-T))*100);
  return {py,ph,pct,cm:Math.round((402-top)/10)};
}
ctx.finish(function(t){
  const a=cycle(wet,t,3,.40,.70,'WET');
  const b=cycle(dry,Math.max(0,t-14)+0,3,.60,.70,'DRY');
  if(t<14){b.ph='idle';dry.mover.position.y=PARK;dry.pile.set((BH-T)*(.55+.15*seg(t,6,14)),0);dry.fill.userData.beam(390-(T+(BH-T)*(.55+.15*seg(t,6,14))),true);dry.lev.rotation.z=0;}
  const mm=p=>Math.round(PARK-p.py);
  const S=ctx.status;
  if(t<3)S('1. WET bin fills up to the red line (70%)','Fill sensor reads the waste through the hole in the parked plate');
  else if(a.ph==='down')S('2. WET motor ON, plate going DOWN ('+mm(a)+' mm)','ESP32 tells the PCF8574 -> DRV8833. Rod turns, the nut and plate walk down. Real time: about 1 minute to reach the waste');
  else if(a.ph==='press')S('3. Pressing the waste: '+a.pct+'% full','Fill sensor reading keeps growing ('+a.cm+' cm) while the waste squashes');
  else if(a.ph==='stall')S('4. Reading stopped changing for 2 s: STOP','Or the plate hit the 40% limit, or 60 s passed. Whatever comes first');
  else if(a.ph==='up')S('5. Motor reversed, plate going back UP','Threaded rod is self-locking, so nothing slips while it changes direction');
  else if(t<17)S('6. Top limit switch clicks: motor OFF, plate parked','WET bin back down to about 46-50%. Bin can slide out now');
  else if(b.ph==='down')S('7. DRY bin hits 70%: same cycle (only one motor runs at a time)','Plate going DOWN ('+mm(b)+' mm)');
  else if(b.ph==='press'||b.ph==='stall')S('8. DRY waste squeezed: '+b.pct+'% full','Stops when the fill reading stops changing');
  else if(b.ph==='up')S('9. DRY plate going back UP','Until the top switch clicks');
  else S('10. Both bins compacted, both plates parked','Authority portal sees the new levels');
});
})();
