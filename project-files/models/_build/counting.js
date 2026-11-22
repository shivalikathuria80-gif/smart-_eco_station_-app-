(function(){
const {mat,box,cyl,anchorAt,seg,ease,clamp,M}=ES;
const DUR=28;
const ctx=ES.setup({name:'Counting_System',title:'Smart Eco Station: AI counting + load cell',file:'counting_system',dur:DUR,
  cam:[900,1000,1350],target:[0,470,0],size:520,exportT:0,toggles:[{key:'doors',label:'Bin doors',values:['Closed','Open']}],
  stls:()=>({'flap_tray_200x160.stl':flapBody,'load_cell_platform.stl':platform,'servo_bracket.stl':bracket,'camera_lid_mount.stl':camMount})});
const {root,fx,part,walls}=ctx;

// ---------------- sizes (mm) ----------------
const CW=660,CD=400,CH=800,T=5;
const SHELF_Y=420;                // shelf that carries the flap unit
const LC_Y=SHELF_Y+T;             // load cell sits on shelf
const PLAT_Y=LC_Y+30+12.7+12+6;   // platform top: block 30 + bar 12.7 + spacer 12 + plate 6
const AXLE_Y=PLAT_Y+62;           // flap pivot height (camera sits about 200 mm above the tray)
const FW=200,FD=160;              // flap size
const LID_Y=CH;                   // lid underside
const BIN_H=380,BIN_W=250,BIN_D=320;

// ---------------- cabinet ----------------
const cab=new THREE.Group();root.add(cab);
const cw=(w,h,d,x,y,z,m=mat.cabinet)=>{const b=box(w,h,d,m,x,y,z,cab);b.castShadow=false;walls.push(b);return b;};
cw(T,CH,CD,-CW/2,CH/2,0);cw(T,CH,CD,CW/2,CH/2,0);cw(CW,CH,T,0,CH/2,-CD/2);
// front: lower panel + side strips, leaving a hand opening 300 x 110
const panelM=M(0xf2f4f6,{roughness:.7});
// solid front panel above the doors (not glass): holds RFID + LCD, leaves the hand opening
const fp=(w,h,x,y)=>{const b=box(w,h,T,panelM,x,y,CD/2,cab);walls.push(b);return b;};
fp(CW,80,0,SHELF_Y+40);
fp((CW-300)/2,CH-SHELF_Y-80,-(150+(CW-300)/4),SHELF_Y+80+(CH-SHELF_Y-80)/2);
fp((CW-300)/2,CH-SHELF_Y-80,(150+(CW-300)/4),SHELF_Y+80+(CH-SHELF_Y-80)/2);
fp(300,CH-SHELF_Y-250,0,SHELF_Y+250+(CH-SHELF_Y-250)/2);
// two hinged bin doors (frame + clear window + handle), hinges on the outer edges
const doors=[];
[-1,1].forEach(s=>{const hinge=new THREE.Group();hinge.position.set(s*CW/2,0,CD/2+T);root.add(hinge);
  const d=new THREE.Group();hinge.add(d);const W=CW/2-4,H=SHELF_Y-10,cx=-s*W/2;
  box(W,30,T,panelM,cx,H-15+5,0,d);box(W,30,T,panelM,cx,20,0,d);box(30,H-60,T,panelM,cx-W/2+15,H/2+5,0,d);box(30,H-60,T,panelM,cx+W/2-15,H/2+5,0,d);
  const win=box(W-60,H-60,2,mat.acrylic,cx,H/2+5,0,d);win.castShadow=false;
  box(12,90,14,mat.frame,cx-s*(W/2-45),H/2+5,10,d);
  [60,H-60].forEach(y=>{const h=cyl(5,5,30,mat.steel,12);h.position.set(0,y,0);hinge.add(h);});
  doors.push({hinge,s});
  part((s<0?'WET':'DRY')+' bin door',d,anchorAt(d,cx,H-20,6),'Opens to slide the bin out and empty it');
});
const opening=anchorAt(root,0,SHELF_Y+165,CD/2+4);part('Hand opening 300 x 170',new THREE.Group(),opening,'User places the items on the tray through here');
// shelf with a 240 x 200 hole
const shelf=new THREE.Group();root.add(shelf);
const wood=M(0xc8a27a,{transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide});
box(CW-2*T,T*2,(CD-200)/2,wood,0,SHELF_Y,-(100+(CD-200)/4),shelf);
box(CW-2*T,T*2,(CD-200)/2,wood,0,SHELF_Y,(100+(CD-200)/4),shelf);
box((CW-240)/2,T*2,200,wood,-(120+(CW-240)/4),SHELF_Y,0,shelf);
box((CW-240)/2,T*2,200,wood,(120+(CW-240)/4),SHELF_Y,0,shelf);
// lid (plywood / acrylic) on top
const lid=new THREE.Group();root.add(lid);
walls.push(box(CW+20,9,CD+20,wood,0,LID_Y+4.5,0,lid));
// lid ribs (stiffeners)
[-150,150].forEach(x=>box(20,20,CD-20,mat.frame,x,LID_Y-10,0,lid));

// ---------------- bins + chutes ----------------
const bins={};
[['WET',-165,mat.binWet],['DRY',165,mat.binDry]].forEach(([n,x,m])=>{
  const g=new THREE.Group();g.position.x=x;root.add(g);
  const bw=(w,h,d,px,py,pz)=>{const b=box(w,h,d,m,px,py,pz,g);b.castShadow=false;};
  bw(T,BIN_H,BIN_D,-BIN_W/2,BIN_H/2,0);bw(T,BIN_H,BIN_D,BIN_W/2,BIN_H/2,0);bw(BIN_W,BIN_H,T,0,BIN_H/2,-BIN_D/2);bw(BIN_W,BIN_H,T,0,BIN_H/2,BIN_D/2);bw(BIN_W,T,BIN_D,0,T/2,0);
  bins[n]={g,x};
  part(n+' bin',g,anchorAt(g,0,BIN_H*.6,BIN_D/2),n==='WET'?'Left side, flap tips left':'Right side, flap tips right');
});
// chutes from flap edge to each bin (sloped sheets)
const chuteM=mat.outlet;
[-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.BoxGeometry(150,3,180),chuteM);c.position.set(s*150,SHELF_Y-40,0);c.rotation.z=s*-0.6;c.castShadow=true;root.add(c);});

// ---------------- load cell + platform ----------------
const lcG=new THREE.Group();root.add(lcG);
const lcMat=M(0xc9d1d8,{metalness:.85,roughness:.3});
// mounting block on shelf (back) and bar running front
box(40,30,30,mat.frame,0,LC_Y+15,-95,lcG);                    // fixed end block (bolted to shelf)
const bar=box(12.7,12.7,80,lcMat,0,LC_Y+30+6.35,-70,lcG);      // 1 kg bar load cell
box(13.2,4,14,M(0xffffff),0,LC_Y+30+6.35,-70,lcG);               // strain gauge label
const wires=[0xff3b30,0x111111,0x2e7d32,0xffffff];wires.forEach((c,i)=>box(1.6,1.6,40,M(c),-4.5+i*3,LC_Y+30+3,-118,lcG));
const platform=new THREE.Group();root.add(platform);
box(20,12,20,mat.frame,0,LC_Y+42.7+6,-40,platform);            // spacer on the free end
box(60,6,FD+40,M(0x7b8794),0,PLAT_Y-3,0,platform);             // narrow platform: items fall past it

part('1 kg load cell + HX711',lcG,anchorAt(lcG,0,LC_Y+45,-60),'Weighs the whole flap unit, tared level and empty');
const hx=new THREE.Group();root.add(hx);box(34,2,21,mat.pcbGreen,0,0,0,hx);box(10,3,10,M(0x111111),0,2,0,hx);hx.position.set(-70,SHELF_Y+T+2,-150);
part('HX711 board',hx,anchorAt(hx,0,4,0),'DT GPIO 39, SCK GPIO 17, VCC 3V3');

// ---------------- servo bracket + flap ----------------
const bracket=new THREE.Group();platform.add(bracket);
const posts=[-1,1].map(s=>box(8,AXLE_Y-PLAT_Y+6,16,mat.frame,0,PLAT_Y+(AXLE_Y-PLAT_Y+6)/2,s*(FD/2+12),bracket));
const sv=ES.sg90();sv.rotation.x=-Math.PI/2;sv.position.set(5.5,AXLE_Y,-(FD/2+30));bracket.add(sv);
const flapG=new THREE.Group();flapG.position.set(0,AXLE_Y,0);platform.add(flapG);
const flapBody=new THREE.Group();flapG.add(flapBody);
const tray=M(0x2f8f6a,{roughness:.95});  // matte green surface
box(FW,3,FD,tray,0,0,0,flapBody);
const ribM=M(0x26795a);[-60,0,60].forEach(x=>box(3,6,FD-6,ribM,x,-4.5,0,flapBody));box(FW-6,6,3,ribM,0,-4.5,-FD/2+20,flapBody);box(FW-6,6,3,ribM,0,-4.5,FD/2-20,flapBody);
box(FW,14,3,tray,0,7,-FD/2,flapBody);box(FW,14,3,tray,0,7,FD/2,flapBody);
const ax=cyl(2.5,2.5,FD+44,mat.steel,12);ax.rotation.x=Math.PI/2;ax.position.y=-4;flapBody.add(ax);
// flat moisture sensor, flush in the middle
const moist=new THREE.Group();box(26,1.2,60,M(0x1b4fd6),0,2.6,0,moist);for(let i=-2;i<=2;i++)box(2,1.4,52,mat.probe,i*4.5,2.8,0,moist);flapBody.add(moist);
part('Sorting flap: 3D printed, 200 x 160',flapBody,anchorAt(flapBody,-80,10,FD/2),'2 mm plate + ribs, about 70 g. Pivot in the middle. SG90 tips it left (WET) or right (DRY)');
part('SG90 flap servo',sv,anchorAt(sv,0,0,0),'Switched off while the load cell reads');
part('Flat moisture sensor',moist,anchorAt(moist,0,4,10),'Flush with the tray, double-checks for wet');

// ---------------- camera on the lid ----------------
const camMount=new THREE.Group();root.add(camMount);
box(60,8,50,mat.frame,0,LID_Y-4,0,camMount);
box(8,40,8,mat.frame,0,LID_Y-28,0,camMount);
const camB=new THREE.Group();camMount.add(camB);
box(27,4,40,mat.pcb,0,0,0,camB);const lens=cyl(4.5,4.5,6,mat.lens,20);lens.position.y=-4;camB.add(lens);
const camLed=M(0xffffff);const led=cyl(2,2,2,camLed,12);led.position.set(8,-3,12);camB.add(led);
camB.position.set(0,LID_Y-50,0);
// LED ring (white strip) around camera
const ringMat=M(0xffffff,{emissive:0x000000});
const ring=new THREE.Mesh(new THREE.TorusGeometry(55,4,8,48),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=LID_Y-14;camMount.add(ring);
part('ESP32-CAM (AI FOMO model)',camB,anchorAt(camB,0,-6,0),'Counts items, labels each one wet or dry');
part('White LED ring',ring,anchorAt(ring,55,0,0),'Steady light so the AI sees the same picture every time');
// view cone
const camH=LID_Y-50-AXLE_Y;
const cone=new THREE.Mesh(new THREE.ConeGeometry(130,camH,4,1,true),new THREE.MeshBasicMaterial({color:0x37d67a,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));
cone.rotation.y=Math.PI/4;cone.position.y=LID_Y-50-camH/2;fx.add(cone);
part('Lid',lid,anchorAt(lid,-CW/2+60,LID_Y+10,CD/2),'Carries only the camera and LED ring: light');

// ultrasonic eyes on back wall
const eyes=ES.ultrasonic();eyes.position.set(0,AXLE_Y+90,-CD/2+20);eyes.rotation.x=0.5;root.add(eyes);
part('Ultrasonic "eyes"',eyes,anchorAt(eyes,0,4,0),'Sees something is on the tray');

// ---------------- front electronics ----------------
const lcd=ES.lcd('#1f8a4c');lcd.position.set(235,SHELF_Y+290,CD/2+6);root.add(lcd);
part('LCD 1 (outside the front panel)',lcd,anchorAt(lcd,0,22,0),'Shows count, grams, points');
const rfid=new THREE.Group();box(60,40,3,mat.rfid,0,0,0,rfid);rfid.position.set(235,SHELF_Y+210,CD/2+4);root.add(rfid);
part('RFID reader (outside the front panel)',rfid,anchorAt(rfid,-30,0,0),'Tap to start, tap again to finish');
const card=new THREE.Group();box(54,86,1,mat.card,0,0,0,card);box(20,10,1.2,M(0x1f8a4c),0,25,0,card);root.add(card);
const esp=new THREE.Group();box(52,2,28,M(0x111111),0,0,0,esp);box(18,3,16,mat.silver,10,2,0,esp);esp.position.set(-230,SHELF_Y+T+2,-150);root.add(esp);
part('ESP32 DevKit',esp,anchorAt(esp,0,4,0),'Runs the flap, RFID, load cell, points');

// ---------------- waste items ----------------
const items=[];
const mk=(kind,geo,color)=>{const m=new THREE.Mesh(geo,M(color,{roughness:.5}));m.castShadow=true;m.userData.kind=kind;fx.add(m);
  const bx=new THREE.Box3().setFromObject(m);const s=new THREE.Vector3();bx.getSize(s);
  const hl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s.x+10,s.y+8,s.z+10)),new THREE.LineBasicMaterial({color:kind==='wet'?0xff3b30:0x22c55e}));
  hl.visible=false;fx.add(hl);const o={m,hl,kind,h:s.y};items.push(o);return o;};
const bottle=new THREE.CylinderGeometry(14,14,70,16);bottle.rotateZ(Math.PI/2);
// batch 1: 4 dry items
const b1=[mk('dry',bottle,0x9fd3ff),mk('dry',new THREE.BoxGeometry(50,4,34),0xf5d76e),mk('dry',new THREE.BoxGeometry(36,22,36),0xd9c59a),mk('dry',new THREE.CylinderGeometry(16,16,30,16),0xc0c6cc)];
const b1pos=[[-55,-40],[45,-45],[-45,40],[50,38]];
// batch 2: 2 dry + 1 wet
const b2=[mk('dry',new THREE.BoxGeometry(46,5,30),0xffffff),mk('dry',bottle,0x9fd3ff),mk('wet',new THREE.DodecahedronGeometry(17),0x8a5a2b)];
const b2pos=[[-50,-35],[50,-35],[0,40]];
const wetAlone=[0,0];window.__dbg={items,flapBody};

// helpers
const v=new THREE.Vector3();
const flapTop=()=>AXLE_Y-20+platform.position.y+2; // world y of tray top when level
function onFlap(o,lx,lz,drop){flapBody.updateWorldMatrix(true,false); // drop 0..1 (1 = in the air above)
  v.set(lx,2+o.h/2,lz);flapBody.localToWorld(v);
  o.m.position.set(v.x,v.y+drop*160,v.z);o.m.rotation.set(0,0,flapG.rotation.z);o.m.visible=true;
  o.hl.position.copy(o.m.position);o.hl.rotation.copy(o.m.rotation);
}
function intoBin(o,lx,lz,side,k,idx){flapBody.updateWorldMatrix(true,false); // slide off edge + fall into bin
  const ex=side*(FW/2+10),bx=bins[side>0?'DRY':'WET'].x;
  const p0=new THREE.Vector3(lx,2+o.h/2,lz);flapBody.localToWorld(p0);
  const p1=new THREE.Vector3(ex,2+o.h/2,lz);flapBody.localToWorld(p1);
  const p2=new THREE.Vector3(bx+side*20+(idx%2?-30:30),T+o.h/2+ (idx>1?20:0),lz*.8);
  if(k<.35){o.m.position.lerpVectors(p0,p1,k/.35);}else{const q=(k-.35)/.65;o.m.position.lerpVectors(p1,p2,q);o.m.position.y=p1.y+(p2.y-p1.y)*q*q;}
  o.m.rotation.z=flapG.rotation.z*(1-k)+side*k*2;o.hl.visible=false;o.m.visible=true;
}
function rest(o,side,idx,lz){const bx=bins[side>0?'DRY':'WET'].x;o.m.position.set(bx+side*20+(idx%2?-30:30),T+o.h/2+(idx>1?20:0),lz*.8);o.m.rotation.set(0,0,side*2);o.hl.visible=false;o.m.visible=true;}
const hide=o=>{o.m.visible=false;o.hl.visible=false;};

// ---------------- timeline ----------------
// 0-2 tap | 2-4 place batch1 | 4-5.5 weigh | 5.5-7.5 scan | 7.5-8.5 decide | 8.5-10.5 tip DRY | 10.5-12 verify +40
// 12-14 place batch2 | 14-15 weigh | 15-17 scan mixed | 17-19 user removes wet | 19-20.5 rescan | 20.5-22 tip DRY +20
// 22-23 wet alone placed | 23-24.5 scan+moist | 24.5-26 tip WET +10 | 26-28 tap finish, saved
const grams1=[18,6,9,12],grams2=[5,14,42];
ctx.finish(function(t){
  // card tap
  const tap=(a)=>{const k=ease(seg(t,a,a+.8))*(1-ease(seg(t,a+1.2,a+2)));card.position.set(235+(1-k)*120,SHELF_Y+210,CD/2+40-k*30);card.rotation.y=-0.4*(1-k);return k;};
  const k1=tap(0),k2=tap(26);card.visible=t<2.2||t>25.8;
  // bin doors
  const open=ctx.flags.doors===1;doors.forEach(d=>{const tgt=open?d.s*1.75:0;d.hinge.rotation.y+= (tgt-d.hinge.rotation.y)*0.2;if(window.__snap)d.hinge.rotation.y=tgt;});
  // flap tilt
  let tilt=0;const tipAt=(a,side)=>{const k=ease(seg(t,a,a+.6))*(1-ease(seg(t,a+1.2,a+1.8)));return -side*k*0.62;};
  tilt=tipAt(8.5,1)+tipAt(20.5,1)+tipAt(24.5,-1);
  flapG.rotation.z=tilt;
  // camera scan
  const scanning=(t>5.5&&t<7.5)||(t>15&&t<17)||(t>19&&t<20.5)||(t>23&&t<24.5);
  cone.visible=scanning;camLed.emissive.setHex(scanning?0xff2a1a:0);ringMat.emissive.setHex(t>2&&t<26?0xbbbbbb:0);
  // load cell flex (tiny visual)
  let g=0;
  // batch 1
  b1.forEach((o,i)=>{const [lx,lz]=b1pos[i];
    if(t<2+i*.4)hide(o);
    else if(t<8.6){onFlap(o,lx,lz,1-ease(seg(t,2+i*.4,2.6+i*.4)));o.hl.visible=t>6&&t<10;if(t>2.6+i*.4)g+=grams1[i];}
    else if(t<10.3){intoBin(o,lx,lz,1,ease(seg(t,8.9+i*.1,10.2)),i);}
    else rest(o,1,i,lz);
  });
  // batch 2
  b2.forEach((o,i)=>{const [lx,lz]=b2pos[i];
    if(o.kind==='wet'){
      if(t<12+i*.4)hide(o);
      else if(t<17.5){onFlap(o,lx,lz,1-ease(seg(t,12+i*.4,12.6+i*.4)));o.hl.visible=t>15.6;if(t>12.6+i*.4)g+=grams2[i];}
      else if(t<19){const k=ease(seg(t,17.5,18.6));onFlap(o,lx,lz,0);o.m.position.z+=k*240;o.m.position.y+=k*60;o.hl.visible=false;}  // user takes it out
      else if(t<22)hide(o);
      else if(t<24.8){onFlap(o,wetAlone[0],wetAlone[1],1-ease(seg(t,22,22.6)));o.hl.visible=t>23.4;if(t>22.6)g+=grams2[i];}
      else if(t<26.3)intoBin(o,0,0,-1,ease(seg(t,24.9,26.2)),0);
      else rest(o,-1,0,0);
    }else{
      if(t<12+i*.4)hide(o);
      else if(t<20.6){onFlap(o,lx,lz,1-ease(seg(t,12+i*.4,12.6+i*.4)));o.hl.visible=(t>15.6&&t<17.5)||t>19.6;if(t>12.6+i*.4)g+=grams2[i];}
      else if(t<22.3)intoBin(o,lx,lz,1,ease(seg(t,20.9+i*.1,22.2)),i+4);
      else rest(o,1,i+4,lz);
    }
  });
  platform.position.y=-g*0.02;
  // LCD + status
  const L=(a,b)=>lcd.userData.set(a,b);
  if(t<2){L('Hello!','Spread 5 items');ctx.status('1. Tap the RFID card','The session starts. LCD: spread up to 5 items on the tray');}
  else if(t<4){L('Place items','apart, max 5');ctx.status('2. Put the items on the tray, apart','The flap is level and the load cell reads 0 g');}
  else if(t<5.5){L('Weighing...',Math.round(g)+' g');ctx.status('3. Load cell: weight steady for 1 s','45 g is inside the 3-150 g window (SG90 limit)');}
  else if(t<7.5){L('AI scanning...','');ctx.status('4. ESP32-CAM runs the FOMO model','It finds 4 items and labels each one: 4 DRY, 0 WET');}
  else if(t<8.5){L('4 items: ALL DRY','45g -> max 15');ctx.status('5. Check the count','Allowed = lowest of camera 4, weight 45/3 = 15, limit 5. So 4 items');}
  else if(t<10.5){L('All dry','Tipping -> DRY');ctx.status('6. All dry, so tip the whole batch right','Camera says all dry and the moisture sensor reads dry');}
  else if(t<12){L('+40 points',Math.round(g)+' g = empty');ctx.status('7. Weight back to 0 g = verified','Only now the 4 items count: +40');}
  else if(t<14){L('Place items','apart, max 5');ctx.status('8. Second batch: 2 dry + 1 wet','');}
  else if(t<15){L('Weighing...',Math.round(g)+' g');ctx.status('9. Weighing','61 g, steady');}
  else if(t<17){L('AI scanning...','');ctx.status('10. Camera finds 3 items: 2 DRY, 1 WET','One tip cannot go two ways');}
  else if(t<19){L('Wet item found','Take it out');ctx.status('11. Mixed batch: flap stays level','Reject path: the user takes the wet item out. No points yet');}
  else if(t<20.5){L('2 items: ALL DRY','19g -> max 6');ctx.status('12. Scan again: 2 DRY','Allowed = lowest of 2, 19/3 = 6, 5. So 2 items');}
  else if(t<22){L('+20 points','Total 60');ctx.status('13. Tip DRY, weight back to 0 g','+20');}
  else if(t<23){L('Place wet item','on its own');ctx.status('14. Wet item goes in on its own','');}
  else if(t<24.5){L('1 item: WET','42 g');ctx.status('15. Camera: WET, moisture sensor: WET','Wet always wins');}
  else if(t<26){L('Tipping -> WET','+10 points');ctx.status('16. Tip left into the WET bin','Weight back to 0 g: +10');}
  else {L('Saved: 70 pts','Thank you!');ctx.status('17. Tap again to finish','Points saved to Firebase once for the whole visit');}
});
})();
