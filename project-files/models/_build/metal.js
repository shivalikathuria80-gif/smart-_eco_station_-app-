(function(){
const {mat,box,cyl,anchorAt,seg,ease,clamp,M}=ES;
const DUR=26;
const ctx=ES.setup({name:'Metal_Tray',title:'Smart Eco Station: metal tray + drop check',file:'metal_tray',dur:DUR,
  cam:[1250,1050,1350],target:[110,430,0],size:600,exportT:0,toggles:[{key:'doors',label:'Bin doors',values:['Closed','Open']}],
  stls:()=>({'metal_side_tray.stl':mtray,'flap_with_metal_spot.stl':flapBody})});
const {root,fx,part,walls}=ctx;

// ---------------- sizes (mm) ----------------
const CW=660,CD=400,CH=800,T=5;
const SHELF_Y=420;
const LC_Y=SHELF_Y+T;
const PLAT_Y=LC_Y+30+12.7+12+6;
const AXLE_Y=PLAT_Y+62;
const FW=200,FD=160;
const LID_T=6,LID_Y=CH;              // 6 mm plywood lid
const BIN_H=380,BIN_W=250,BIN_D=320;
// metal side tray (stands on the floor, bolted to the right cabinet wall)
const MW=180,MD=240,MH=560;
const MX=CW/2+T/2+MW/2+4,MZ=CD/2-MD/2;
const BEAM_Y=MH-30;                  // IR beam height, just inside the mouth
const SPOT_X=55;                     // metal check spot on the flap (local x)

// ---------------- cabinet ----------------
const cab=new THREE.Group();root.add(cab);
const cw=(w,h,d,x,y,z,m=mat.cabinet)=>{const b=box(w,h,d,m,x,y,z,cab);b.castShadow=false;walls.push(b);return b;};
cw(T,CH,CD,-CW/2,CH/2,0);cw(T,CH,CD,CW/2,CH/2,0);cw(CW,CH,T,0,CH/2,-CD/2);
const panelM=M(0xf2f4f6,{roughness:.7});
const fp=(w,h,x,y)=>{const b=box(w,h,T,panelM,x,y,CD/2,cab);walls.push(b);return b;};
fp(CW,80,0,SHELF_Y+40);
fp((CW-300)/2,CH-SHELF_Y-80,-(150+(CW-300)/4),SHELF_Y+80+(CH-SHELF_Y-80)/2);
fp((CW-300)/2,CH-SHELF_Y-80,(150+(CW-300)/4),SHELF_Y+80+(CH-SHELF_Y-80)/2);
fp(300,CH-SHELF_Y-250,0,SHELF_Y+250+(CH-SHELF_Y-250)/2);
const doors=[];
[-1,1].forEach(s=>{const hinge=new THREE.Group();hinge.position.set(s*CW/2,0,CD/2+T);root.add(hinge);
  const d=new THREE.Group();hinge.add(d);const W=CW/2-4,H=SHELF_Y-10,cx=-s*W/2;
  box(W,30,T,panelM,cx,H-15+5,0,d);box(W,30,T,panelM,cx,20,0,d);box(30,H-60,T,panelM,cx-W/2+15,H/2+5,0,d);box(30,H-60,T,panelM,cx+W/2-15,H/2+5,0,d);
  const win=box(W-60,H-60,2,mat.acrylic,cx,H/2+5,0,d);win.castShadow=false;
  box(12,90,14,mat.frame,cx-s*(W/2-45),H/2+5,10,d);
  [60,H-60].forEach(y=>{const h=cyl(5,5,30,mat.steel,12);h.position.set(0,y,0);hinge.add(h);});
  doors.push({hinge,s});
});
part('Hand opening',new THREE.Group(),anchorAt(root,0,SHELF_Y+165,CD/2+4),'Put the item on the tray through here');
const shelf=new THREE.Group();root.add(shelf);
const wood=M(0xc8a27a,{transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide});
box(CW-2*T,T*2,(CD-200)/2,wood,0,SHELF_Y,-(100+(CD-200)/4),shelf);
box(CW-2*T,T*2,(CD-200)/2,wood,0,SHELF_Y,(100+(CD-200)/4),shelf);
box((CW-240)/2,T*2,200,wood,-(120+(CW-240)/4),SHELF_Y,0,shelf);
box((CW-240)/2,T*2,200,wood,(120+(CW-240)/4),SHELF_Y,0,shelf);
const lid=new THREE.Group();root.add(lid);
walls.push(box(CW+20,LID_T,CD+20,wood,0,LID_Y+LID_T/2,0,lid));
[-150,150].forEach(x=>box(20,20,CD-20,mat.frame,x,LID_Y-10,0,lid));
part('Lid: 6 mm plywood',lid,anchorAt(lid,-CW/2+60,LID_Y+8,CD/2),'Carries only the light camera + LED ring');

// ---------------- WET + DRY bins (unchanged) ----------------
const bins={};
[['WET',-165,mat.binWet],['DRY',165,mat.binDry]].forEach(([n,x,m])=>{
  const g=new THREE.Group();g.position.x=x;root.add(g);
  const bw=(w,h,d,px,py,pz)=>{const b=box(w,h,d,m,px,py,pz,g);b.castShadow=false;};
  bw(T,BIN_H,BIN_D,-BIN_W/2,BIN_H/2,0);bw(T,BIN_H,BIN_D,BIN_W/2,BIN_H/2,0);bw(BIN_W,BIN_H,T,0,BIN_H/2,-BIN_D/2);bw(BIN_W,BIN_H,T,0,BIN_H/2,BIN_D/2);bw(BIN_W,T,BIN_D,0,T/2,0);
  bins[n]={g,x};
  part(n+' bin',g,anchorAt(g,0,BIN_H*.55,BIN_D/2),n==='WET'?'Flap tips left (compactor stays)':'Flap tips right (compactor stays)');
});
[-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.BoxGeometry(150,3,180),mat.outlet);c.position.set(s*150,SHELF_Y-40,0);c.rotation.z=s*-0.6;c.castShadow=true;root.add(c);});

// ---------------- load cell + platform ----------------
const lcG=new THREE.Group();root.add(lcG);
const lcMat=M(0xc9d1d8,{metalness:.85,roughness:.3});
box(40,30,30,mat.frame,0,LC_Y+15,-95,lcG);
box(12.7,12.7,80,lcMat,0,LC_Y+30+6.35,-70,lcG);
box(13.2,4,14,M(0xffffff),0,LC_Y+30+6.35,-70,lcG);
const platform=new THREE.Group();root.add(platform);
box(20,12,20,mat.frame,0,LC_Y+42.7+6,-40,platform);
box(60,6,FD+40,M(0x7b8794),0,PLAT_Y-3,0,platform);
const hx=new THREE.Group();root.add(hx);box(34,2,21,mat.pcbGreen,0,0,0,hx);box(10,3,10,M(0x111111),0,2,0,hx);hx.position.set(-70,SHELF_Y+T+2,-150);

// ---------------- flap with the metal check spot ----------------
const bracket=new THREE.Group();platform.add(bracket);
[-1,1].forEach(s=>box(8,AXLE_Y-PLAT_Y+6,16,mat.frame,0,PLAT_Y+(AXLE_Y-PLAT_Y+6)/2,s*(FD/2+12),bracket));
const sv=ES.sg90();sv.rotation.x=-Math.PI/2;sv.position.set(5.5,AXLE_Y,-(FD/2+30));bracket.add(sv);
const flapG=new THREE.Group();flapG.position.set(0,AXLE_Y,0);platform.add(flapG);
const flapBody=new THREE.Group();flapG.add(flapBody);
const tray=M(0x2f8f6a,{roughness:.95});
// tray plate with an 18 mm hole at the metal spot (sensor face sits flush in it)
const H=10,L=SPOT_X-H,R=SPOT_X+H;
box(L+FW/2,3,FD,tray,(-FW/2+L)/2,0,0,flapBody);
box(FW/2-R,3,FD,tray,(R+FW/2)/2,0,0,flapBody);
box(2*H,3,FD/2-H,tray,SPOT_X,0,-(H+(FD/2-H)/2),flapBody);
box(2*H,3,FD/2-H,tray,SPOT_X,0,(H+(FD/2-H)/2),flapBody);
const ribM=M(0x26795a);[-60,0].forEach(x=>box(3,6,FD-6,ribM,x,-4.5,0,flapBody));box(FW-6,6,3,ribM,0,-4.5,-FD/2+20,flapBody);box(FW-6,6,3,ribM,0,-4.5,FD/2-20,flapBody);
box(FW,14,3,tray,0,7,-FD/2,flapBody);box(FW,14,3,tray,0,7,FD/2,flapBody);
const ax=cyl(2.5,2.5,FD+44,mat.steel,12);ax.rotation.x=Math.PI/2;ax.position.y=-4;flapBody.add(ax);
const moist=new THREE.Group();box(26,1.2,60,M(0x1b4fd6),0,2.6,0,moist);for(let i=-2;i<=2;i++)box(2,1.4,52,mat.probe,i*4.5,2.8,0,moist);flapBody.add(moist);
// painted ring = "metal check spot"
const spotRing=new THREE.Mesh(new THREE.RingGeometry(16,30,40),M(0xe2e8ee,{metalness:.3,roughness:.5,side:THREE.DoubleSide}));
spotRing.rotation.x=-Math.PI/2;spotRing.position.set(SPOT_X,1.6,0);flapBody.add(spotRing);
// LJ18A3-8-Z/BX-5V inductive sensor: M18 body, face flush with the tray top, 2 nuts on a printed clamp
const ind=new THREE.Group();flapBody.add(ind);ind.position.set(SPOT_X,0,0);
const body=cyl(9,9,60,M(0x9aa3ab,{metalness:.85,roughness:.35}),28);body.position.y=1.5-30;ind.add(body);
const face=cyl(8.6,8.6,1,M(0xff8a1f,{roughness:.5}),28);face.position.y=1.2;ind.add(face);
[-6,-20].forEach(y=>{const n=cyl(14,14,4,mat.silver,6);n.position.y=y;ind.add(n);});
const indLed=M(0xff3b30);const il=box(4,3,4,indLed,0,-56,10,ind);
box(40,6,30,mat.frame,0,-13,0,ind);                     // printed clamp under the ribs
const cable=cyl(2.5,2.5,40,mat.cable,8);cable.position.y=-78;ind.add(cable);
// detection field (only an effect)
const fieldMat=new THREE.MeshBasicMaterial({color:0xff8a1f,transparent:true,opacity:.0,depthWrite:false});
const field=new THREE.Mesh(new THREE.CylinderGeometry(9,9,10,24,1,true),fieldMat);fx.add(field);
part('Sorting flap 200 x 160 (metal spot added)',flapBody,anchorAt(flapBody,-80,10,FD/2),'Same flap: tips left = WET, right = DRY. Metal never tips');
part('Metal check spot',spotRing,anchorAt(flapBody,SPOT_X,6,-30),'Painted ring: LCD asks to put cans/foil here');
part('Inductive sensor LJ18A3-8 (5V)',ind,anchorAt(ind,0,-40,12),'Face flush in an 18 mm hole. Senses metal, ignores paper/plastic');
part('Flat moisture sensor',moist,anchorAt(moist,0,4,-20),'Still decides wet vs dry');

// ---------------- camera on the lid ----------------
const camMount=new THREE.Group();root.add(camMount);
box(60,8,50,mat.frame,0,LID_Y-4,0,camMount);box(8,40,8,mat.frame,0,LID_Y-28,0,camMount);
const camB=new THREE.Group();camMount.add(camB);
box(27,4,40,mat.pcb,0,0,0,camB);const lens=cyl(4.5,4.5,6,mat.lens,20);lens.position.y=-4;camB.add(lens);
camB.position.set(0,LID_Y-50,0);
const ringMat=M(0xffffff,{emissive:0x000000});
const ledRing=new THREE.Mesh(new THREE.TorusGeometry(55,4,8,48),ringMat);ledRing.rotation.x=Math.PI/2;ledRing.position.y=LID_Y-14;camMount.add(ledRing);
part('ESP32-CAM',camB,anchorAt(camB,0,-6,0),'Counts wet/dry items as before');

// ---------------- front electronics ----------------
const lcd=ES.lcd('#1f8a4c');lcd.position.set(235,SHELF_Y+290,CD/2+6);root.add(lcd);
part('LCD 1',lcd,anchorAt(lcd,0,22,0),'Tells the user: metal, use the side tray + countdown');
const rfid=new THREE.Group();box(60,40,3,mat.rfid,0,0,0,rfid);rfid.position.set(235,SHELF_Y+210,CD/2+4);root.add(rfid);
part('RFID reader',rfid,anchorAt(rfid,-30,0,0),'Tap to start, tap again to finish');
const card=new THREE.Group();box(54,86,1,mat.card,0,0,0,card);box(20,10,1.2,M(0x1f8a4c),0,25,0,card);root.add(card);
const esp=new THREE.Group();box(52,2,28,M(0x111111),0,0,0,esp);box(18,3,16,mat.silver,10,2,0,esp);esp.position.set(-230,SHELF_Y+T+2,-150);root.add(esp);
part('ESP32 DevKit',esp,anchorAt(esp,0,4,0),'Reads the inductive sensor + IR beam, gives points');

// ---------------- METAL side tray ----------------
const mtray=new THREE.Group();mtray.position.set(MX,0,MZ);root.add(mtray);
const metalM=M(0x8e9aa6,{transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false});
const mw=(w,h,d,x,y,z,m=metalM)=>{const b=box(w,h,d,m,x,y,z,mtray);b.castShadow=false;return b;};
mw(T,MH,MD,-MW/2,MH/2,0);mw(T,MH,MD,MW/2,MH/2,0);mw(MW,MH,T,0,MH/2,-MD/2);mw(MW,MH,T,0,MH/2,MD/2);mw(MW,T,MD,0,T/2,0);
// solid rim around the mouth
const rimM=M(0x5b6670,{metalness:.5,roughness:.4});
box(MW+12,8,10,rimM,0,MH+4,-MD/2,mtray);box(MW+12,8,10,rimM,0,MH+4,MD/2,mtray);box(10,8,MD,rimM,-MW/2,MH+4,0,mtray);box(10,8,MD,rimM,MW/2,MH+4,0,mtray);
// METAL sign on the front
const sc=document.createElement('canvas');sc.width=512;sc.height=160;const s2=sc.getContext('2d');
s2.fillStyle='#5b6670';s2.fillRect(0,0,512,160);s2.fillStyle='#fff';s2.font='bold 92px system-ui,sans-serif';s2.textAlign='center';s2.textBaseline='middle';s2.fillText('METAL',256,84);
const stex=new THREE.CanvasTexture(sc);stex.encoding=THREE.sRGBEncoding;
const sign=new THREE.Mesh(new THREE.PlaneGeometry(150,47),new THREE.MeshBasicMaterial({map:stex}));sign.position.set(0,MH-110,MD/2+3.5);mtray.add(sign);
// 2 L-brackets bolted to the right cabinet wall
[-60,60].forEach(z=>{box(4,60,30,mat.steel,-MW/2-4,MH-60,z,mtray);box(25,4,30,mat.steel,-MW/2+10,MH-90,z,mtray);});
// a few cans already inside
const canGeo=new THREE.CylinderGeometry(22,22,62,24);
const canM=[M(0xd23b3b,{metalness:.3,roughness:.35}),M(0xc8ced4,{metalness:.35,roughness:.35}),M(0x2b7bb9,{metalness:.3,roughness:.35})];
[[-40,22,40,1.57,0.3],[35,22,-50,1.57,1.2],[0,26,-5,0,0]].forEach(([x,y,z,rx,ry],i)=>{const c=new THREE.Mesh(canGeo,canM[i]);c.position.set(x,T+y,z);c.rotation.set(rx,ry,0);c.castShadow=true;mtray.add(c);});
// IR break-beam: emitter on the back wall, receiver on the front wall, beam runs front-to-back across the mouth
const irBox=(z,col)=>{const g=new THREE.Group();box(22,14,10,M(0x111111),0,0,0,g);const l=cyl(2.6,2.6,6,M(col),12);l.rotation.x=Math.PI/2;l.position.z=z<0?7:-7;g.add(l);g.position.set(0,BEAM_Y,z);mtray.add(g);return g;};
const emit=irBox(-MD/2+8,0x6a2ca8),recv=irBox(MD/2-8,0x111111);
const recvLedM=M(0x222222);box(4,4,3,recvLedM,7,8,-2,recv);
const beamM=new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.35,depthWrite:false});
const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,MD-30,8),beamM);beam.rotation.x=Math.PI/2;beam.position.set(MX,BEAM_Y,MZ);fx.add(beam);
const beamGlow=new THREE.Mesh(new THREE.CylinderGeometry(5,5,MD-30,12,1,true),new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.12,depthWrite:false}));
beamGlow.rotation.x=Math.PI/2;beamGlow.position.copy(beam.position);fx.add(beamGlow);
part('METAL side tray (no compactor)',mtray,anchorAt(mtray,MW/2,MH*.45,MD/2),'Stands on the floor, bolted to the cabinet wall with 2 L-brackets');
part('IR break-beam (emitter + receiver)',recv,anchorAt(recv,0,10,0),'Sees the item fall in. Counts only right after metal was detected');
part('L-brackets to cabinet wall',mtray,anchorAt(mtray,-MW/2-6,MH-40,60),'M4 bolts through the 5 mm side wall');

// ---------------- moving items ----------------
const can=new THREE.Mesh(canGeo,M(0xc8ced4,{metalness:.35,roughness:.35}));can.castShadow=true;fx.add(can);
const can2=new THREE.Mesh(canGeo,M(0xe0a020,{metalness:.3,roughness:.35}));can2.castShadow=true;fx.add(can2);
const ball=new THREE.Mesh(new THREE.DodecahedronGeometry(16),M(0xf4f1e8,{roughness:.9}));ball.castShadow=true;fx.add(ball);
const v=new THREE.Vector3();
const spotWorld=(dy)=>{flapBody.updateWorldMatrix(true,false);v.set(SPOT_X,1.5+31+dy,0);flapBody.localToWorld(v);return v.clone();};
const path=(pts,k)=>{const n=pts.length-1,i=Math.min(n-1,Math.floor(k*n)),q=k*n-i;return new THREE.Vector3().lerpVectors(pts[i],pts[i+1],ease(q));};
const TOPZ=CD/2+110;                 // in front of the cabinet
const inTray=new THREE.Vector3(MX+10,T+31+44,MZ+20);
const aboveTray=new THREE.Vector3(MX,MH+90,MZ+30);

ctx.finish(function(t){
  // card taps
  const tap=a=>{const k=ease(seg(t,a,a+.8))*(1-ease(seg(t,a+1.2,a+2)));card.position.set(235+(1-k)*120,SHELF_Y+210,CD/2+40-k*30);card.rotation.y=-.4*(1-k);};
  if(t<12)tap(0);else tap(23.6);card.visible=t<2.2||t>23.4;
  const open=ctx.flags.doors===1;doors.forEach(d=>{const tgt=open?d.s*1.75:0;d.hinge.rotation.y+=(tgt-d.hinge.rotation.y)*.2;if(window.__snap)d.hinge.rotation.y=tgt;});
  flapG.rotation.z=0;ringMat.emissive.setHex(t>2&&t<24?0xbbbbbb:0);

  // ---- run 1: can, detected, dropped in, +15 ----
  const spot=spotWorld(0);
  if(t<2){can.visible=false;}
  else if(t<3.4){can.visible=true;const k=ease(seg(t,2,3.4));can.position.set(spot.x,spot.y+(1-k)*170,spot.z+(1-k)*120);}
  else if(t<6){can.visible=true;can.position.copy(spot);}
  else if(t<9.6){can.visible=true;
    const pts=[spot,new THREE.Vector3(spot.x,spot.y+90,spot.z),new THREE.Vector3(spot.x,spot.y+90,TOPZ),new THREE.Vector3(MX,MH+90,TOPZ),aboveTray];
    if(t<8.8)can.position.copy(path(pts,seg(t,6,8.8)));else{const q=seg(t,8.8,9.6);can.position.lerpVectors(aboveTray,inTray,0);can.position.y=aboveTray.y-(aboveTray.y-inTray.y)*q*q;can.position.x=aboveTray.x+(inTray.x-aboveTray.x)*q;can.position.z=aboveTray.z+(inTray.z-aboveTray.z)*q;}
    can.rotation.set(0,0,0);}
  else {can.visible=true;can.position.copy(inTray);can.rotation.set(0,0,0);}

  // ---- run 2: paper ball thrown straight in (no metal scan) ----
  const ballTop=new THREE.Vector3(MX-10,MH+120,MZ+60),ballIn=new THREE.Vector3(MX-40,T+60,MZ+70);
  if(t<11.6||t>=24.9){ball.visible=false;}
  else if(t<12.6){ball.visible=true;const k=ease(seg(t,11.6,12.6));ball.position.set(MX-10,MH+120,TOPZ+120*(1-k));}
  else if(t<13.4){ball.visible=true;const q=seg(t,12.6,13.4);ball.position.lerpVectors(ballTop,ballIn,q);ball.position.y=ballTop.y-(ballTop.y-ballIn.y)*q*q;}
  else {ball.visible=true;ball.position.copy(ballIn);}

  // ---- run 3: can detected but taken away, timer runs out ----
  if(t<15.4||t>21.2){can2.visible=false;}
  else if(t<16.6){can2.visible=true;const k=ease(seg(t,15.4,16.6));can2.position.set(spot.x,spot.y+(1-k)*170,spot.z+(1-k)*120);}
  else if(t<18.6){can2.visible=true;can2.position.copy(spot);}
  else {can2.visible=true;const k=ease(seg(t,18.6,20.4));can2.position.set(spot.x-60*k,spot.y+100*k,spot.z+k*320);}

  // ---- sensors ----
  const onSpot=(t>3.4&&t<6.1)||(t>16.6&&t<18.7);
  const detected=(t>3.9&&t<6.1)||(t>17.1&&t<18.7);
  indLed.emissive.setHex(detected?0xff2a1a:0);face.material.emissive.setHex(detected?0x7a3300:0);
  const fp0=spotWorld(-31+5);field.position.copy(fp0);fieldMat.opacity=detected?.45+.15*Math.sin(t*20):0;
  const armed=(t>4.9&&t<9.45)||(t>18.0&&t<21.2);
  // beam break test: anything moving inside the beam zone
  const inBeam=o=>o.visible&&Math.abs(o.position.y-BEAM_Y)<34&&Math.abs(o.position.x-MX)<MW/2&&Math.abs(o.position.z-MZ)<MD/2;
  const broken=inBeam(can)||inBeam(ball)||inBeam(can2);
  const okFlash=t>9.0&&t<10.3;const badFlash=t>12.95&&t<14;
  let col=0xff2a2a,op=armed?.95:.3;
  if(okFlash){col=0x22e06a;op=.95;}else if(badFlash){col=0xffb020;op=.9;}
  beamM.color.setHex(col);beamGlow.material.color.setHex(col);beamM.opacity=broken?.05:op;beamGlow.material.opacity=armed||okFlash||badFlash?.28:.08;
  recvLedM.emissive.setHex(okFlash?0x22e06a:badFlash?0xffb020:armed?0x661111:0);

  // ---- LCD + status ----
  const Ls=(a,b)=>lcd.userData.set(a,b);
  const cd=(a,b)=>Math.max(0,Math.ceil(10-(t-a)*(10/(b-a))));
  if(t<2){Ls('Hello! 0 pts','Place item');ctx.status('1. Tap the RFID card','Session starts');}
  else if(t<3.4){Ls('Place item','on the tray');ctx.status('2. User puts a can on the tray','Cans and foil go on the painted metal spot');}
  else if(t<3.9){Ls('Checking...','');ctx.status('3. Weight steady, sensors read','Load cell, moisture sensor, camera and inductive sensor');}
  else if(t<4.9){Ls('METAL found!','');ctx.status('4. Inductive sensor says METAL','It reacts to cans and foil only, not paper or plastic. The flap stays locked level');}
  else if(t<9.0){Ls('METAL: put it in','side tray  '+cd(4.9,9.45)+' s');ctx.status('5. LCD: "Metal, put it in the side tray" + 10 s timer','The IR beam is now ARMED (bright red). Points wait for the drop');}
  else if(t<10.3){Ls('Drop seen!','+15 pts');ctx.status('6. The can breaks the IR beam inside the timer','Armed + beam broken = verified drop. +15 points');}
  else if(t<11.6){Ls('+15 pts METAL','Total 15');ctx.status('7. Points given only after the drop check','Load cell is back to 0 g too, so the tray is empty');}
  else if(t<12.95){Ls('Total 15','Place item');ctx.status('8. Cheat test: someone throws a paper ball into the side tray','No metal was detected on the flap first');}
  else if(t<15.4){Ls('No metal scan','0 pts');ctx.status('9. Beam broken but NOT armed: ignored','The beam only counts right after the inductive sensor saw metal. Paper earns nothing');}
  else if(t<17.1){Ls('Place item','on the tray');ctx.status('10. Second can goes on the metal spot','');}
  else if(t<18.0){Ls('METAL found!','');ctx.status('11. Inductive sensor says METAL again','');}
  else if(t<21.2){Ls('METAL: put it in','side tray  '+cd(18.0,21.2)+' s');ctx.status('12. Timer running... but the user takes the can away','Nothing breaks the beam');}
  else if(t<23.4){Ls('Time up','No points');ctx.status('13. 10 s passed with no drop: no points','Beam disarms. Total stays 15');}
  else {Ls('Saved: 15 pts','Thank you!');ctx.status('14. Tap again to finish','Points saved to Firebase once for the visit');}
  onSpot;
});
})();
