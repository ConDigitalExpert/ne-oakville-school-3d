import {chromium} from '@playwright/test';
import fs from 'node:fs';
const url=process.env.QA_URL||'http://localhost:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:1050},deviceScaleFactor:1});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__school?.rooms?.length===208);await page.waitForTimeout(1300);
checks.push({name:'208 spaces loaded',pass:await page.evaluate(()=>__school.rooms.length===208)});
await page.screenshot({path:'verification/final-exterior.png'});
checks.push({name:'batched rendering',...await page.evaluate(()=>({pass:__school.renderer.info.render.calls<1000,drawCalls:__school.renderer.info.render.calls,triangles:__school.renderer.info.render.triangles}))});
await page.selectOption('#roomSearch','cafeteria');await page.waitForTimeout(500);
checks.push({name:'Room finder',pass:await page.locator('#roomName').textContent()==='Cafeteria'});
await page.locator('[data-camera="top"]').click();await page.waitForTimeout(1300);
await page.screenshot({path:'verification/final-level1.png'});
for(const [level,photo,count] of [[1,8,86],[2,4,51],[3,5,49]]){
 await page.locator('[data-level="'+level+'"]').click();await page.locator('#sources').click();await page.check('#overlayToggle');
 checks.push({name:'Source overlay L'+level,pass:await page.locator('#traceOverlay polygon').count()===count && (await page.locator('#sourceImage').getAttribute('src')).includes(photo+'-Photo')});
 await page.screenshot({path:'verification/source-overlay-level'+level+'.png'});
 await page.locator('#closeSources').click();
}
await page.locator('[data-level="0"]').click();await page.locator('[data-camera="top"]').click();await page.waitForTimeout(1200);await page.screenshot({path:'verification/final-childcare.png'});
await page.locator('[data-level="all"]').click();await page.locator('[data-camera="south"]').click();await page.waitForTimeout(1200);await page.screenshot({path:'verification/final-south.png'});
await page.check('#explode');await page.locator('[data-camera="iso"]').click();await page.waitForTimeout(1200);await page.screenshot({path:'verification/final-exploded.png'});
await page.uncheck('#explode');await page.locator('#reset').click();await page.waitForTimeout(1200);
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1200);await page.screenshot({path:'verification/final-mobile.png'});
checks.push({name:'No mobile horizontal overflow',pass:await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth)});
await page.setViewportSize({width:1600,height:1050});
if(!process.env.NO_EXPORT){
 for(const campus of [false,true]){
 const downloadPromise=page.waitForEvent('download',{timeout:120000});
 await page.evaluate(async(campus)=>{const glb=await __school.exportGLB(campus);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([glb],{type:'model/gltf-binary'}));a.download='model.glb';a.click();},campus);
 const dl=await downloadPromise;const filename=campus?'ne-oakville-campus.glb':'ne-oakville-school.glb';await dl.saveAs('public/model/'+filename);
 const buffer=fs.readFileSync('public/model/'+filename);const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString().trim());
 checks.push({name:filename,pass:buffer.toString('ascii',0,4)==='glTF'&&gltf.nodes.filter(n=>n.extras?.room).length===208,bytes:buffer.length,rooms:gltf.nodes.filter(n=>n.extras?.room).length,nodes:gltf.nodes.length,meshes:gltf.meshes.length});
 }
}
checks.push({name:'No browser errors',pass:errors.length===0,errors});
const report={url,time:new Date().toISOString(),checks,pass:checks.every(c=>c.pass)};fs.writeFileSync('verification/final.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(!report.pass)process.exitCode=1;
