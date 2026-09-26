import {buildEnvelope,batch} from './exterior.js';
import * as THREE from 'three';
import l0 from './data/level0.json';import l1 from './data/level1.json';import l2 from './data/level2.json';import l3 from './data/level3.json';import siteData from './data/site.json';import childcareSite from './data/childcare-site.json';
export const levels=[l0,l1,l2,l3];
export const colors={classroom:'#b7c9b0',science:'#a4c3c4',technology:'#aec0c7',arts:'#c3b0c5',athletics:'#dcc599',admin:'#b6bfca',childcare:'#d8b3a2',support:'#c6c6bc',circulation:'#e8e5d9',commons:'#d6c5a6',stair:'#a5b7b5'};
const mat=(c,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,...extra});
const wallMat=mat('#e9e6d9'),wood=mat('#c7ac80'),dark=mat('#535a57'),glass=mat('#608a91',{metalness:.35,roughness:.22}),roofmat=mat('#a9aca3'),brick=mat('#b8a07c'),white=mat('#d9d8ca'),groundMat=mat('#dde1d4');
export const convert=([x,z])=>[(x-640)*.14,(z-480)*.14];
function inside(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
export function box(g,w,h,d,x,y,z,m){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function slab(poly,y,h,m,g,holes=[]){const p=poly.map(convert);const shape=new THREE.Shape(p.map(v=>new THREE.Vector2(v[0],-v[1])));for(const hole of holes)shape.holes.push(new THREE.Path(hole.map(convert).map(([x,z])=>new THREE.Vector2(x,-z))));let geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=new THREE.Mesh(geo,m);o.position.y=y;o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function beam(g,a,b,y,h,width,m){const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,len=Math.hypot(b[0]-a[0],b[1]-a[1]);let o=box(g,len,h,width,x,y+h/2,z,m);o.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);return o;}
function segment(g,a,b,t0,t1,y,h,width,m){beam(g,[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0],[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1],y,h,width,m);}
function label(text,x,y,z){let c=document.createElement('canvas');c.width=512;c.height=100;let ctx=c.getContext('2d');ctx.fillStyle='rgba(246,248,239,.93)';ctx.fillRect(0,0,512,100);ctx.fillStyle='#324a3a';ctx.font='26px Arial';ctx.textAlign='center';ctx.fillText(text.length>32?text.slice(0,30)+'…':text,256,60);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));s.position.set(x,y,z);s.scale.set(10,1.95,1);return s;}
export function buildModel(){
const building=new THREE.Group(),exterior=new THREE.Group(),floorGroups=[],rooms=[],labels=[];
building.name='NE Oakville School — inferred reconstruction';exterior.name='Architectural envelope';
for(const data of levels){
const group=new THREE.Group();group.position.y=data.elevation;group.name=data.label;building.add(group);floorGroups.push(group);
const circulation=data.circulation||[];for(const r of circulation)slab(r.polygon,-.18,.25,mat(colors.circulation),group);
for(const r of data.rooms){
const p=r.polygon.map(convert),xs=p.map(a=>a[0]),zs=p.map(a=>a[1]),minx=Math.min(...xs),maxx=Math.max(...xs),minz=Math.min(...zs),maxz=Math.max(...zs),cx=(minx+maxx)/2,cz=(minz+maxz)/2,w=maxx-minx,d=maxz-minz;
const floor=slab(r.polygon,-.18,.25,mat(colors[r.category]||'#c8c8bc'),group);floor.userData={room:r,level:data.level,source:data.source};rooms.push(floor);
if(r.category!=='circulation'){for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.2)continue;let wallH=2.5;if(i===0&&len>3){let t=.7,gap=Math.min(.13,1.05/len);segment(group,a,b,0,t-gap/2,.08,wallH,.16,wallMat);segment(group,a,b,t+gap/2,1,.08,wallH,.16,wallMat);segment(group,a,b,t-gap/2,t+gap/2,2.22,.36,.16,wallMat);}else beam(group,a,b,.08,wallH,.16,wallMat);}}
if(r.category==='stair'){const fw=Math.min(1.6,w*.38),run=Math.min(4.2,d-1.3),step=run/15;for(let k=0;k<15;k++){box(group,fw,.13,step,cx-fw*.55,.14*(k+1),cz-run/2+k*step,white);box(group,fw,.13,step,cx+fw*.55,2.1+.14*(k+1),cz+run/2-k*step,white);}box(group,fw*2.2,.16,1.1,cx,2.1,cz+run/2+.35,white);}
else if(['classroom','science','technology','arts','childcare'].includes(r.category)&&w>3&&d>3){let cols=Math.min(4,Math.floor(w/2.4)),rows=Math.min(4,Math.floor(d/2.5));for(let a=0;a<cols;a++)for(let b=0;b<rows;b++){let x=minx+1.5+a*(w-2.5)/Math.max(cols-1,1),z=minz+1.5+b*(d-3)/Math.max(rows-1,1);if(!inside([x,z],p))continue;box(group,1.05,.1,.65,x,.8,z,wood);box(group,.12,.7,.12,x-.35,.4,z,dark);box(group,.12,.7,.12,x+.35,.4,z,dark);box(group,.45,.1,.42,x,.45,z+.62,white);box(group,.45,.4,.09,x,.65,z+.85,white);}box(group,Math.max(1,w*.5),.85,.12,cx,1.6,minz+.2,dark);}
else if(r.category==='admin'){box(group,w*.5,.12,1.1,cx,.85,cz,wood);box(group,.7,.6,.6,cx,.4,cz+.8,dark);}
else if(r.category==='commons'){for(let a=-1;a<=1;a++){let t=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.12,18),wood);t.position.set(cx+a*3,.8,cz);group.add(t);}}
else if(r.category==='athletics'&&w>10&&d>10){let points=[[-w*.4,-d*.4],[w*.4,-d*.4],[w*.4,d*.4],[-w*.4,d*.4],[-w*.4,-d*.4]].map(([x,z])=>new THREE.Vector3(cx+x,.09,cz+z));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#f4ead3'}));group.add(line);let ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.16,48),new THREE.MeshBasicMaterial({color:'#f4ead3',side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(cx,.095,cz);group.add(ring);beam(group,[minx+.4,cz],[maxx-.4,cz],.09,.03,.07,white);}
const lab=label(r.name,cx,3,cz);lab.visible=false;group.add(lab);labels.push(lab);
}
batch(group);
}
building.add(exterior);
const revised=buildEnvelope();exterior.add(revised);
const site=new THREE.Group();site.name='Inferred site context';const ground=box(site,1100,.2,1100,0,-4.65,-100,groundMat);
ground.name='Backdrop ground';for(const f of siteData.features){const c=f.id==='campus'?'#b4c09f':f.id.includes('parking')?'#929992':f.id.includes('line')||f.id.includes('burnham')?'#858e87':f.id==='track'?'#b79b86':f.id==='courts'?'#91a69a':'#a5b58d';const y=f.id==='campus'?-.38:f.id==='field'?-.29:f.id==='courts'?-.17:f.id==='track'?-.21:-.25;
if(f.id==='track'){const curve=new THREE.CatmullRomCurve3(f.polygon.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal');const outer=curve.getPoints(140).slice(0,-1).map(p=>[p.x,p.z]);const center=outer.reduce((a,p)=>[a[0]+p[0]/outer.length,a[1]+p[1]/outer.length],[0,0]),inner=outer.map(p=>[center[0]+(p[0]-center[0])*.84,center[1]+(p[1]-center[1])*.78]);slab(outer,y,.035,mat(c),site,[inner]);slab(inner,y,.035,mat('#a6b987'),site);for(let k=1;k<=5;k++){const fx=1-k*.025,fz=1-k*.035,pts=outer.map(p=>convert([center[0]+(p[0]-center[0])*fx,center[1]+(p[1]-center[1])*fz])).map(([x,z])=>new THREE.Vector3(x,y+.04,z));site.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#d9d0b7'})));}}
else slab(f.polygon,y,.035,mat(c),site,f.id==='campus'?[[[220,520],[755,520],[755,965],[220,965]]]:[]);}
// Lower childcare terrace; retaining edges indicate inferred falling grade.
box(site,74,.12,62,-20.5,-4.4,36,mat('#bdc3b1'));
box(site,74,4.1,.35,-20.5,-2.35,5.6,mat('#b5b6ac'));
box(site,.35,4.1,62,16.1,-2.35,36,mat('#b5b6ac'));
for(const f of childcareSite.features){
 slab(f.polygon,-4.18,.05,mat(f.id.includes('infant')?'#b6c08a':'#bdc795'),site);
 const p=f.polygon.map(convert);for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);beam(site,a,b,-3.38,.055,.055,dark);for(let t=0;t<1;t+=Math.min(1,2/len))box(site,.045,.85,.045,a[0]+(b[0]-a[0])*t,-3.76,a[1]+(b[1]-a[1])*t,dark);}
}
// Local paved apron and garden, trees seeded deterministically.

const treeMat=mat('#839773'),trunk=mat('#8c8875');for(let i=0;i<38;i++){let x=i<15?-67+((i*13)%7):62+((i*17)%11),z=-64+(i%19)*8.2;box(site,.22,2.7,.22,x,1,z,trunk);let crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.65+(i%3)*.3,1),treeMat);crown.scale.y=1.35;crown.position.set(x,3.4,z);crown.castShadow=true;site.add(crown);}
for(let i=0;i<20;i++){let x=-68+(i%2)*8,z=-50+Math.floor(i/2)*9;box(site,2,.9,4.4,x,.3,z,mat(['#e1e2d8','#59655e','#929c91'][i%3]));}
batch(site);return{building,exterior,floorGroups,rooms,labels,site,ground};
}

