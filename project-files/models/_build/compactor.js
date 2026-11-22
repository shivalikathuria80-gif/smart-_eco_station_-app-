(function(){
const {mat,box,cyl,anchorAt,seg,ease,clamp}=ES;
const ctx=ES.setup({name:'Compactors',title:'Smart Eco Station: bin compactors',file:'compactors',dur:14,cam:[900,850,1250],target:[0,300,0],size:600,
  toggles:[],stls:()=>{const arm=new THREE.Group();arm.add(new THREE.Mesh(new THREE.BoxGeometry(125,6,4)));return {'press_plate.stl':wet.comp.plate,'top_plate.stl':wet.comp.top,'scissor_arm_125mm.stl':arm};}});
const {root,part,walls}=ctx;
const BW=260,BD=340,BH=520,T=4,TOPY=600;
function bin(x,name,bm,color,wm){
  const g=new THREE.Group();g.position.x=x;root.add(g);
  const binG=new THREE.Group();g.add(binG);
  const bw=(w,h,d,px,py,pz)=>{const b=box(w,h,d,bm,px,py,pz,binG);b.castShadow=false;walls.push(b);};
  bw(T,BH,BD,-BW/2+T/2,BH/2,0);bw(T,BH,BD,BW/2-T/2,BH/2,0);bw(BW,BH,T,0,BH/2,-BD/2+T/2);bw(BW,BH,T,0,BH/2,BD/2-T/2);
  box(BW,T,BD,bm,0,T/2,0,binG);
  // 70% line
  const line=box(BW+2,2,2,new THREE.MeshBasicMaterial({color:0xff5a36}),0,T+(BH-T)*.7,BD/2+1,binG);
  // frame: 4 posts + top plate is part of compactor
  const frame=new THREE.Group();g.add(frame);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>box(16,TOPY+8,16,mat.frame,sx*(BW/2+15),(TOPY+8)/2,sz*(BD/2+15),frame));
  const comp=ES.compactor(g,{w:BW-20,d:BD-20,topY:TOPY,L:125,stages:3,minDeg:12,maxDeg:70});
  const pile=ES.pile(g,BW-2*T-2,BD-2*T-2,T,wm);
  const lcd=ES.lcd(color);lcd.position.set(0,BH+30,BD/2+16);g.add(lcd);
  part(name+' bin (260 x 340 x 520)',binG,anchorAt(binG,-BW/2,BH*.45,BD/2),'Red line = 70% full');
  if(name==='WET'){part('Fixed top plate (both bins)',comp.top,comp.anchors.top,'Bolted to the bin frame, holds the servo and fill sensor');
  part('Press plate (both bins)',comp.plate,comp.anchors.plate,'Pushed down by the 3-stage scissor arms');
  part('Fill sensor HC-SR04 (both bins)',comp.fill,comp.anchors.fill,'Looks down through a window in the press plate');
  part('SG90 compactor servo (both bins)',comp.servo,comp.anchors.servo,'Turns the top scissor arm to open the scissor');}
  part(name+': level LCD',lcd,anchorAt(lcd,0,22,0),'Shows fill %');
  return {g,comp,pile,lcd};
}
const wet=bin(-200,'WET',mat.binWet,'#1f8a4c',mat.wet),dry=bin(200,'DRY',mat.binDry,'#2f63c4',mat.dry);
ctx.finish(function(t){
  const run=(b,name,lv0,lv1,t0,tc,lvAfter,growAfter)=>{
    // fill before compaction
    let lv=t<tc?lv0+(lv1-lv0)*seg(t,t0,tc):lvAfter+growAfter*seg(t,tc+4,ctx.dur);
    const k=ease(seg(t,tc+.4,tc+2))*(1-ease(seg(t,tc+2.5,tc+4)));
    const plateBottom=b.comp.set(k);
    const full=T+(BH-T)*lv;
    let h=full-T,sq=0;
    const comp=T+(BH-T)*lvAfter;
    if(t>=tc&&t<tc+4){const top=t>tc+2.2?comp:clamp(Math.min(full,plateBottom),comp,full);h=top-T;sq=clamp((full-top)/(full-comp));lv=h/(BH-T);}
    if(t>=tc+4)sq=1;
    b.pile.set(h,sq);
    const pct=Math.round(lv*100);
    b.lcd.userData.set(name+' BIN '+pct+'%',k>0.01?'COMPACTING...':(pct>=70?'70%: COMPACT!':'LEVEL OK'));
    b.comp.fill.userData.beam(Math.max(10,TOPY-15-(T+h+10)),k<0.01);
    return {k,pct};
  };
  const a=run(wet,'WET',.40,.70,0,3,.46,.06);
  const b=run(dry,'DRY',.52,.70,0,8,.46,.02);
  if(t<3)ctx.status('1. Bins fill up','Fill sensors measure the distance to the waste every 15 s');
  else if(t<3.4)ctx.status('2. WET bin hits 70%','ESP32 starts the compactor');
  else if(t<5)ctx.status('3. Scissor opens, press plate goes down','SG90 turns the top arm, 3 stages push the plate about 270 mm');
  else if(t<5.5)ctx.status('4. Waste is squeezed','70% full becomes about 46%');
  else if(t<7)ctx.status('5. Plate goes back up','The bin has room again, no need to empty it yet');
  else if(t<8)ctx.status('6. DRY bin keeps filling','Each bin has its own compactor and fill sensor');
  else if(t<12)ctx.status('7. DRY bin hits 70% and compacts','Same cycle on the other bin');
  else ctx.status('8. Both bins back to about 46%','Authority portal sees the new levels');
});
})();
