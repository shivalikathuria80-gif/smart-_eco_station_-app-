(function(){
const {mat,box,cyl,anchorAt,seg,ease,clamp,M}=ES;
const ctx=ES.setup({name:'SmartEcoStation',title:'Smart Eco Station: full model',file:'smart_eco_station',dur:20,cam:[1250,1150,1600],target:[60,560,0],size:900,
  toggles:[{key:'waste',label:'Waste',values:['WET','DRY']}]});
const {root,fx,part,walls}=ctx;
const CW=660,CD=400,CH=640,T=6,HEADY=CH;
// ---------- cabinet ----------
const cab=new THREE.Group();root.add(cab);
const cw=(w,h,d,x,y,z,m=mat.cabinet)=>{const b=box(w,h,d,m,x,y,z,cab);b.castShadow=false;walls.push(b);return b;};
cw(T,CH,CD,-CW/2+T/2,CH/2,0);cw(T,CH,CD,CW/2-T/2,CH/2,0);cw(CW,CH,T,0,CH/2,-CD/2+T/2);cw(CW,CH,T,0,CH/2,CD/2-T/2,mat.acrylic);
box(CW,T,CD,mat.wood,0,T/2,0,cab);
box((CW/2-75),T,CD,mat.wood,-(75+(CW/2-75)/2),CH-T/2,0,cab);box((CW/2-75),T,CD,mat.wood,(75+(CW/2-75)/2),CH-T/2,0,cab);
box(150,T,CD/2-85,mat.wood,0,CH-T/2,-(85+(CD/2-85)/2),cab);box(150,T,CD/2-85,mat.wood,0,CH-T/2,(85+(CD/2-85)/2),cab);
part('Station cabinet (660 x 400 x 640)',cab,anchorAt(cab,-CW/2,CH*.85,CD/2),'Clear front so judges can see inside');
// ---------- bins + compactors ----------
const BW=260,BD=340,BH=520,BT=4;
function bin(x,name,bm,wm,lv){
  const g=new THREE.Group();g.position.set(x,T,0);root.add(g);
  const bg=new THREE.Group();g.add(bg);
  const bw=(w,h,d,px,py,pz)=>{const b=box(w,h,d,bm,px,py,pz,bg);b.castShadow=false;walls.push(b);};
  bw(BT,BH,BD,-BW/2+BT/2,BH/2,0);bw(BT,BH,BD,BW/2-BT/2,BH/2,0);bw(BW,BH,BT,0,BH/2,-BD/2+BT/2);bw(BW,BH,BT,0,BH/2,BD/2-BT/2);box(BW,BT,BD,bm,0,BT/2,0,bg);
  box(BW+2,2,2,new THREE.MeshBasicMaterial({color:0xff5a36}),0,BT+(BH-BT)*.7,BD/2+1,bg);
  const comp=ES.compactor(g,{w:BW-40,d:BD-30,topY:600-T,L:125,stages:3,minDeg:12,maxDeg:70});
  const pile=ES.pile(g,BW-2*BT-2,BD-2*BT-2,BT,wm);
  return {g,bg,comp,pile,x,lv0:lv,name};
}
const bins=[bin(-185,'WET',mat.binWet,mat.wet,.4),bin(185,'DRY',mat.binDry,mat.dry,.4)];
part('WET bin (left)',bins[0].bg,anchorAt(bins[0].bg,-BW/2+30,BH*.35,BD/2),'Red line = 70% full');
part('DRY bin (right)',bins[1].bg,anchorAt(bins[1].bg,BW/2-30,BH*.35,BD/2),'Red line = 70% full');
part('Scissor compactor (each bin)',bins[0].comp.plate,bins[0].comp.anchors.plate,'SG90 + two plates + scissor; starts at 70%');
part('Fill sensors HC-SR04 (each bin)',bins[1].comp.fill,anchorAt(bins[1].comp.fill,0,2,-12),'Measure how full each bin is');
// ---------- chutes ----------
const chutes=new THREE.Group();root.add(chutes);
[-1,1].forEach(s=>{const a=new THREE.Vector3(s*50,HEADY,0),b=new THREE.Vector3(s*85,470,0);const len=a.distanceTo(b);
  const c=cyl(34,34,len,mat.outlet,4,true);c.rotation.y=Math.PI/4;const q=new THREE.Group();q.add(c);q.position.copy(a.clone().add(b).multiplyScalar(.5));
  q.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),a.clone().sub(b).normalize());chutes.add(q);});
part('Chutes to the bins',chutes,anchorAt(chutes,-70,560,30),'Left = WET, right = DRY');
// ---------- sorting head (bag splitter) ----------
const head=new THREE.Group();head.position.y=HEADY;root.add(head);
const sp=ES.splitter(head);sp.walls.forEach(w=>walls.push(w));
part('Drop slot',sp.mouth,sp.anchors.slot,'Opens to the user after the RFID tap');
part('ESP32-CAM',sp.cam,sp.anchors.cam,'Watches the waste: sees closed bags and dry items');
part('Bag splitter (press + blades)',sp.pressG,sp.anchors.plate,'Splits sealed bags so the sensor can read the waste');
part('Ultrasonic "eyes"',sp.eyes,sp.anchors.eyes,'Detects that waste is on the flap (TRIG 26 / ECHO 35)');
part('Moisture sensor on SG90 flap',sp.flapG,sp.anchors.moist,'Decides WET or DRY, then the flap tips');
// ---------- control panel: RFID + LCD1 ----------
const panel=new THREE.Group();panel.position.set(-210,HEADY,140);root.add(panel);
const pb=new THREE.Group();panel.add(pb);box(190,14,110,mat.frame,0,7,0,pb);pb.rotation.x=0;
const kiosk=new THREE.Group();kiosk.position.set(0,0,0);panel.add(kiosk);
box(190,120,16,mat.frame,0,60,-30,kiosk);kiosk.rotation.x=-0.35;
const rfid=new THREE.Group();box(60,2,40,mat.rfid,0,0,0,rfid);
const coil=new THREE.Mesh(new THREE.TorusGeometry(14,1.2,6,24),mat.probe);coil.rotation.x=Math.PI/2;coil.position.y=1.5;rfid.add(coil);
rfid.rotation.x=Math.PI/2;rfid.position.set(-45,55,-21);kiosk.add(rfid);
const lcd1=ES.lcd('#3b7bff');lcd1.position.set(45,60,-18);kiosk.add(lcd1);
part('RFID reader (RC522)',rfid,anchorAt(rfid,0,2,22),'Tap your card to start');
part('LCD 1 (cards, waste, points)',lcd1,anchorAt(lcd1,0,22,0),'I2C 0x27');
// ---------- ESP32 DevKit box ----------
const elec=new THREE.Group();elec.position.set(220,HEADY,-95);root.add(elec);
const eb=box(200,50,120,mat.acrylic,0,25,0,elec);walls.push(eb);
box(165,9,55,M(0xf5f5f5),0,5,15,elec);
const dev=new THREE.Group();box(52,2,28,mat.pcb,0,0,0,dev);box(18,3,25,mat.silver,14,2,0,dev);box(8,3,8,mat.silver,-25,2,0,dev);
dev.position.set(-30,18,-30);elec.add(dev);
for(let i=0;i<9;i++){const w=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,40,6),M([0xe53935,0x1e88e5,0xfdd835,0x43a047,0x212121][i%5]));w.rotation.z=Math.PI/2;w.rotation.y=(i-4)*.12;w.position.set(10,14,-5+i*3);elec.add(w);}
part('ESP32 DevKit + breadboard',dev,anchorAt(dev,0,4,0),'The brain: RFID, LCDs, servos, sensors, Wi-Fi to Firebase');
// laptop + USB cable
const lap=new THREE.Group();lap.position.set(560,0,160);lap.rotation.y=-0.5;lap.scale.setScalar(.65);root.add(lap);
box(320,16,220,M(0x9aa3ad),0,8,0,lap);const scr=box(320,210,8,M(0x2a2f36),0,120,-110,lap);scr.rotation.x=-0.25;
const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(250,HEADY+20,-155),new THREE.Vector3(340,HEADY+10,-160),new THREE.Vector3(360,300,-100),new THREE.Vector3(430,20,100),new THREE.Vector3(470,11,150)]);
const usb=new THREE.Mesh(new THREE.TubeGeometry(curve,40,3,8),mat.cable);root.add(usb);
part('Computer USB (powers ESP32)',lap,anchorAt(lap,0,240,-110),'5 V from the laptop USB port');
// ---------- weather unit (Arduino Uno) ----------
const wx=new THREE.Group();wx.position.set(220,HEADY,95);root.add(wx);
const wb=box(200,80,110,M(0xdfe6ec),0,40,0,wx);
const uno=new THREE.Group();box(68,2,53,mat.uno,0,0,0,uno);box(12,10,16,mat.silver,-30,6,-14,uno);uno.position.set(-50,83,-15);wx.add(uno);
const lcd2=ES.lcd('#1f8a4c');lcd2.position.set(30,45,59);wx.add(lcd2);
const dht=new THREE.Group();box(15,25,8,mat.dht,0,0,0,dht);for(let i=0;i<4;i++)box(12,1,6,M(0xcfd8dc),0,-8+i*5,4.5,dht);dht.position.set(104,50,20);dht.rotation.y=Math.PI/2;wx.add(dht);
const mq=new THREE.Group();box(32,2,22,mat.pcbBlue,0,0,0,mq);const mc=cyl(10,10,14,mat.mq,20);mc.position.y=8;mq.add(mc);mq.rotation.z=-Math.PI/2;mq.position.set(101,40,-30);wx.add(mq);
const pole=cyl(3,3,90,mat.frame,8);pole.position.set(40,125,-20);wx.add(pole);
const rain=new THREE.Group();box(54,2,40,mat.rain,0,0,0,rain);for(let i=0;i<6;i++)box(48,2.4,1.5,mat.probe,0,.4,-15+i*6,rain);rain.position.set(40,172,-20);rain.rotation.x=.35;wx.add(rain);
part('Arduino Uno weather box',uno,anchorAt(uno,0,4,0),'Separate board, its own USB power');
part('LCD 2 (weather)',lcd2,anchorAt(lcd2,0,22,0),'Temperature, humidity, rain, air');
part('DHT22 temp + humidity',dht,anchorAt(dht,0,15,0),'');
part('MQ-135 air quality',mq,anchorAt(mq,0,18,0),'Relative index: GOOD / MODERATE / POOR');
part('Rain sensor plate',rain,anchorAt(rain,0,6,0),'DRY / DRIZZLE / RAINING');
// ---------- solar panel (display only) ----------
const sol=new THREE.Group();sol.position.set(-230,HEADY,-150);root.add(sol);
const mast=cyl(5,5,420,mat.frame,10);mast.position.y=210;sol.add(mast);
const pan=new THREE.Group();box(300,8,200,mat.silver,0,0,0,pan);
for(let i=0;i<6;i++)for(let j=0;j<4;j++)box(46,9,46,mat.solar,-125+i*50,0.6,-75+j*50,pan);
pan.position.y=430;pan.rotation.x=0.5;sol.add(pan);
part('Solar panel (display only)',pan,anchorAt(pan,0,10,-100),'Not wired: explains how a real station would run');

// ---------- moving items ----------
const card=box(54,1.5,86,mat.card,0,0,0,fx);
const bag=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),mat.bag);fx.add(bag);
const torn=new THREE.Group();fx.add(torn);
[-1,1].forEach(s=>{const h=new THREE.Mesh(new THREE.SphereGeometry(1,24,12,0,Math.PI),mat.bag);h.rotation.y=s>0?Math.PI/2:-Math.PI/2;h.scale.set(40,7,26);h.userData.s=s;torn.add(h);});
const bits=[];const rnd=(a=>()=>{a=(a*9301+49297)%233280;return a/233280;})(7);
for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(5+rnd()*3),mat.wet);m.userData={x0:(rnd()-.5)*70,z0:(rnd()-.5)*60,gap:[-48,-24,0,24,48][i%5],fx:(rnd()-.5)*40,fz:(rnd()-.5)*50,d:rnd()*.4,j:(rnd()-.5)*120};fx.add(m);bits.push(m);}
const D=sp.dims,TOP=D.TOP;

ctx.finish(function(t){
  const wetMode=ctx.flags.waste===0;const side=wetMode?-1:1;const B=wetMode?bins[0]:bins[1],O=wetMode?bins[1]:bins[0];
  const u=t-1.5;  // splitter local time
  // card tap
  const cp=ease(seg(t,0,1.1))*(1-seg(t,1.6,2.2));
  const kw=new THREE.Vector3(-45,55,40);kiosk.localToWorld(kw);
  card.position.set(kw.x,kw.y+160*(1-cp),kw.z+120*(1-cp));card.rotation.x=Math.PI/2-.35;card.visible=t<2.2;
  // splitter
  const k=ease(seg(u,1.6,3.0))*(1-ease(seg(u,3.7,4.8)));const plateY=sp.setPress(k);
  sp.camLed(u>1.1&&u<1.6);
  const hB=Math.min(48,Math.max(8,plateY-TOP));const drop=ease(seg(u,0,1));
  bag.visible=u>0&&u<3.25;bag.position.set(0,HEADY+(drop<1?420+(TOP+24-420)*drop:TOP+hB/2),10);bag.scale.set(52+(48-hB)*.35,hB/2,42);
  torn.visible=u>=3.25&&t<17;torn.position.set(0,HEADY+TOP+3,10);torn.children.forEach(h=>{h.position.x=h.userData.s*(18+10*seg(u,3.25,4.5));});
  const tilt=-side*.52*(ease(seg(u,6.4,7.0))-ease(seg(u,7.8,8.5)));sp.setFlap(tilt);
  sp.eyes.userData.beam(45,u>5.3&&u<6.4);
  // bin levels
  const add=.05*seg(u,9.0,9.6);
  const kc=ease(seg(t,11.5,13))*(1-ease(seg(t,13.6,15)));
  bins.forEach(b=>{const isB=b===B;let lv=isB?.66+add:.40;const pb=b.comp.set(isB?kc:0);const full=BT+(BH-BT)*lv,low=BT+(BH-BT)*.46;let top=full,sq=0;
    if(isB&&t>=11.5){top=t>13.2?low:clamp(Math.min(full,pb),low,full);sq=clamp((full-top)/(full-low));}
    b.pile.set(top-BT,sq);b.level=Math.round((top-BT)/(BH-BT)*100);
    b.comp.fill.userData.beam(Math.max(10,600-T-15-(top+10)),Math.floor(t*2)%2===0&&kc<.01);});
  // bits
  bits.forEach(b=>{const q=b.userData;b.material=wetMode?mat.wet:mat.dry;let x,y,z,s=1;const f1=seg(u,3.8+q.d,4.5+q.d),f2=seg(u,4.5+q.d,5.4+q.d);
    if(u<3.8+q.d){x=q.x0*.6;y=TOP+6;z=10+q.z0*.4;s=u<3.25?0:1;}
    else if(f2<=0){x=q.x0*.6+(q.gap-q.x0*.6)*f1;y=TOP+6-(TOP+6-130)*f1*f1;z=10+q.z0*.4;}
    else{x=q.gap+(q.fx*.8-q.gap)*f2;y=130-(130-(D.FLAP_Y+7))*f2;z=(10+q.z0*.4)+(q.fz*.6-(10+q.z0*.4))*f2;}
    if(u>6.4){const p=new THREE.Vector3(q.fx*.8,7,q.fz*.6);p.applyAxisAngle(new THREE.Vector3(0,0,1),tilt);x=p.x;y=D.FLAP_Y+p.y;z=p.z;
      const a1=seg(u,6.9,7.6);if(a1>0){x+=(side*50-x)*a1;y+=(0-y)*a1;z*=1-a1*.6;}}
    y+=HEADY;
    if(u>7.6){const a2=seg(u,7.6,8.4),a3=seg(u,8.4+q.d*.5,9.0+q.d*.5);x=side*(50+35*a2);y=HEADY-(HEADY-470)*a2;
      if(a3>0){const pt=BT+T+(BH-BT)*.66;x=side*(85+(100+q.j*.4)*a3);y=470-(470-pt)*a3*a3;}if(u>9.0+q.d*.5)s=0;}
    b.position.set(x,y,z);b.scale.setScalar(s);});
  // LCDs
  const pts=u>9.6?'+10 pts  (30)':'';
  let l1a='Tap your card',l1b='Smart Eco Stn';
  if(t>1.1){l1a='Hi STUDENT 1';l1b='Drop waste in';}
  if(u>1.1){l1a='Bag detected';l1b='Splitting...';}
  if(u>5.3){l1a='Reading waste';l1b='';}
  if(u>5.9){l1a='Waste: '+(wetMode?'WET':'DRY');l1b='Sorting...';}
  if(u>9.6){l1a='Thank you!';l1b=pts;}
  if(t>11.4&&t<15.2){l1a=B.name+' bin 70%';l1b='Compacting...';}
  if(t>=15.2){l1a='Tap your card';l1b='WET '+bins[0].level+'% DRY '+bins[1].level+'%';}
  lcd1.userData.set(l1a,l1b);
  lcd2.userData.set(...(Math.floor(t/4)%2?['Rain: DRY','Air: GOOD']:['Temp 28.4 C','Humidity 61%']));
  // status
  const S=[[0,'1. Tap your RFID card','ESP32 looks up the card in Firebase, LCD says hi'],[1.5,'2. Drop the waste in','The bag falls onto the splitter'],
    [2.6,'3. ESP32-CAM sees a sealed bag','So the splitter starts'],[3.1,'4. Bag splitter presses','Press plate pushes the bag onto the blades'],
    [5.2,'5. Waste falls onto the flap','The ultrasonic "eyes" confirm something is there'],[7.0,'6. Moisture sensor decides','WASTE'],
    [8.0,'7. Flap tips, waste slides down the chute','Into the '+(wetMode?'WET (left)':'DRY (right)')+' bin'],[11.1,'8. Points added','Card gets +10 points on the website'],
    [11.4,'9. Bin passed 70%: compactor runs','Scissor press squeezes it down to about 46%'],[15.2,'10. Ready for the next user','Weather box keeps showing live readings on LCD 2']];
  let c=S[0];S.forEach(s=>{if(t>=s[0])c=s;});
  ctx.status(c[1],c[2]==='WASTE'?(wetMode?'Reading dropped: WET':'No moisture: DRY'):c[2]);
});
})();
