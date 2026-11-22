(function(){
const {mat,box,cyl,anchorAt,seg,ease,M}=ES;
const st=document.createElement('style');st.textContent='.lab{font-size:15px;padding:4px 9px}.lab.big{font-size:18px;color:#fff;border:none}.lab.ok{background:#1f8a5b}.lab.no{background:#c0392b}';document.head.appendChild(st);
const ctx=ES.setup({name:'ServoCrank',title:'How one servo pushes the plate down',file:'servo_crank',dur:8,cam:[160,560,1150],target:[0,190,0],size:450});
const {root,part,walls}=ctx;
const red=M(0xe53935,{emissive:0x551111}),ring=new THREE.MeshBasicMaterial({color:0xe53935,transparent:true,opacity:.55});
const R=60; // arm length (mm)
// SG90 with shaft along +y in its own frame; arm attached to the shaft
function servoWithArm(){
  const g=new THREE.Group();
  const s=ES.sg90();g.add(s);                         // shaft top at local (-5.5, 16, 0)
  const hub=new THREE.Group();hub.position.set(-5.5,17,0);g.add(hub);
  box(10,4,10,mat.gear,0,0,0,hub);
  const arm=box(10,4,R+10,M(0xffffff),0,1,-R/2,hub);   // arm points along -z of hub
  const tip=new THREE.Mesh(new THREE.SphereGeometry(6,20,12),red);tip.position.set(0,3,-R);hub.add(tip);
  const path=new THREE.Mesh(new THREE.TorusGeometry(R,1.2,8,64),ring);path.rotation.x=Math.PI/2;path.position.y=3;hub.add(path);
  return {g,hub,tip};
}
// ---------- bin + guide rails + bridge (shared builder) ----------
function rig(x,label){
  const g=new THREE.Group();g.position.x=x;root.add(g);
  const bin=new THREE.Group();g.add(bin);
  const bw=(w,h,d,px,py,pz)=>{const b=box(w,h,d,mat.binWet,px,py,pz,bin);b.castShadow=false;walls.push(b);};
  bw(4,220,180,-90,110,0);bw(4,220,180,90,110,0);bw(180,220,4,0,110,-90);bw(180,220,4,0,110,90);box(180,4,180,mat.binWet,0,2,0,bin);
  [-70,70].forEach(px=>{const r=cyl(3,3,330,mat.steel,10);r.position.set(px,165,-60);g.add(r);});
  box(220,12,30,mat.frame,0,336,-60,g);[-110,110].forEach(px=>box(12,340,12,mat.frame,px,170,-60,g));
  const pile=ES.pile(g,170,170,4,mat.wet);
  return {g,bin,pile};
}
// LEFT: servo lying flat (shaft points up) -> arm swings sideways only
const L=rig(-260);
const flat=servoWithArm();flat.g.position.set(0,350,-60);L.g.add(flat.g);
const lPlate=new THREE.Group();L.g.add(lPlate);box(160,6,160,mat.plate,0,0,0,lPlate);lPlate.position.y=210;
[-70,70].forEach(px=>box(14,10,14,mat.frame,px,0,-60,lPlate));
// RIGHT: same servo turned on its side (shaft points at you) -> arm swings up and down
const Rr=rig(260);
const side=servoWithArm();side.g.rotation.x=Math.PI/2;side.g.position.set(5.5,350,-33);Rr.g.add(side.g);
const rod=box(8,1,8,M(0xffb300),0,0,0,Rr.g);
const rPlate=new THREE.Group();Rr.g.add(rPlate);box(160,6,160,mat.plate,0,0,0,rPlate);
[-70,70].forEach(px=>box(14,10,14,mat.frame,px,0,-60,rPlate));const pin=cyl(5,5,24,mat.frame,12);pin.rotation.x=Math.PI/2;pin.position.set(0,10,-60);rPlate.add(pin);
const LR=170;
// labels
const ok=anchorAt(Rr.g,0,470,-60),no=anchorAt(L.g,0,470,-60);
part('SERVO LYING FLAT: tip only goes left/right, plate never moves',L.bin,no,'');
part('SERVO ON ITS SIDE: tip goes up and down, plate goes down',Rr.bin,ok,'');
part('Servo on its side (shaft points at you)',side.g,anchorAt(side.g,0,0,0),'Screw it to the bridge sideways, like a wheel facing you');
part('Long arm (60 mm, printed or stiff strip)',side.hub,anchorAt(side.hub,0,6,-R*0.6),'Fixed on the servo horn');
part('Push rod (170 mm)',rod,anchorAt(rod,0,0,0),'Hinged at the arm tip and at the plate');
part('Press plate on 2 guide rods',rPlate,anchorAt(rPlate,70,8,70),'Rods keep it level, so it can only slide up/down');
part('Red circle = path of the arm tip',flat.hub,anchorAt(flat.tip,0,10,0),'');
ctx.finish(function(t){
  const k=ease(seg(t,.5,3.2))*(1-ease(seg(t,4.5,7.2)));const th=Math.PI*k;      // servo 0..180 deg
  flat.hub.rotation.y=th;
  side.hub.rotation.y=th;
  // world-ish math in the right rig frame: hub centre at (0,350+? ) -> compute from tip world pos
  const tp=new THREE.Vector3();side.tip.getWorldPosition(tp);Rr.g.worldToLocal(tp);
  const dx=tp.x,py=tp.y-Math.sqrt(LR*LR-dx*dx);
  rod.position.set(dx/2,(tp.y+py)/2,tp.z);rod.scale.y=LR;rod.rotation.z=-Math.atan2(dx,tp.y-py);pin.position.z=tp.z+60;
  rPlate.position.y=py-10;
  const plateBottom=py-13;const full=170,low=95;const top=Math.min(full,Math.max(low,plateBottom));
  Rr.pile.set(top-4,(full-top)/(full-low));L.pile.set(full-4,0);
  document.querySelectorAll('.lab').forEach((e,i)=>{if(i<2){e.classList.add('big',i?'ok':'no');}});
  const deg=Math.round(th*180/Math.PI);
  if(k<.02)ctx.status('Servo at 0°: plate is up','Both servos are the same. Only the way they are screwed on is different.');
  else if(t<4.5)ctx.status('Servo turning to '+deg+'°','Left: tip swings sideways (red circle lies flat). Right: tip swings DOWN (red circle stands up), the rod pushes the plate');
  else ctx.status('Servo going back to 0°','Right: rod pulls the plate back up. Plate travel = 2 × arm length = 120 mm');
});
})();
