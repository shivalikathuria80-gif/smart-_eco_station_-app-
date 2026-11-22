const {chromium}=require('playwright');const fs=require('fs');
const [,,html,outdir,shotsJson]=process.argv;
(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1400,height:950},deviceScaleFactor:2,colorScheme:'light'});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
fs.mkdirSync(outdir,{recursive:true});
await p.goto('file://'+__dirname+'/'+html);await p.waitForTimeout(1500);if(process.env.SHOT)await p.evaluate(()=>document.body.classList.add('shot'));
for(const s of JSON.parse(fs.readFileSync(shotsJson))){for(let i=0;i<2;i++){await p.evaluate(s=>{document.querySelector("[data-w="+(s.w||"glass")+"]").click();BS.pose(s.t,s);},s);await p.waitForTimeout(250);}await p.screenshot({path:outdir+'/'+s.n+'.png'});}
const r=await p.evaluate(()=>BS.exportAll());
for(const k in r){if(k==='error'){console.log('ERR',r[k]);continue;}fs.writeFileSync(outdir+'/'+k,Buffer.from(r[k],'base64'));}
console.log('errors',errs);await b.close();})();
