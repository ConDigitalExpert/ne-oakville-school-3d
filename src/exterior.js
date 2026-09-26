import * as THREE from 'three';
import envelope from './data/envelope.json';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const m=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...extra});
function brickMap(){const c=document.createElement('canvas');c.width=512;c.height=256;const a=c.getContext('2d');a.fillStyle='#c0a37c';a.fillRect(0,0,512,256);for(let row=0;row<12;row++){const h=256/12,y=row*h;a.fillStyle=row%3===0?'#b59a75':'#baa07b';a.fillRect(0,y,512,h-1);a.strokeStyle='#aa9477';a.lineWidth=1;a.beginPath();a.moveTo(0,y);a.lineTo(512,y);for(let x=(row%2)*42;x<512;x+=84){a.moveTo(x,y);a.lineTo(x,y+h);}a.stroke();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.SRGBColorSpace;return t;}
const brick=m('#d5bc96',{map:brickMap()}),charcoal=m('#434b4a'),trim=m('#6a716c'),pale=m('#e5e0d2'),glass=m('#5c858b',{metalness:.5,roughness:.19}),roof=m('#a8aca6'),paving=m('#c6c6b9');
const cv=([x,z])=>[(x-640)*.14,(z-480)*.14];
function block(g,w,h,d,x,y,z,mat){if(w<.01||h<.01||d<.01)return;let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function edge(g,a,b,base,height,thick,mat){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);const o=block(g,l,height,thick,(a[0]+b[0])/2,base+height/2,(a[1]+b[1])/2,mat);if(o)o.rotation.y=-Math.atan2(dz,dx);}
function sub(g,a,b,t0,t1,base,h,d,mat){edge(g,[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0],[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1],base,h,d,mat);}
function slab(g,p,y,h,mat){let shape=new THREE.Shape(p.outer.map(cv).map(([x,z])=>new THREE.Vector2(x,-z)));for(const ring of p.holes||[])shape.holes.push(new THREE.Path(ring.map(cv).map(([x,z])=>new THREE.Vector2(x,-z))));const geom=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geom.rotateX(-Math.PI/2);let o=new THREE.Mesh(geom,mat);o.position.y=y;o.castShadow=o.receiveShadow=true;g.add(o);}
export function batch(g){const mats=new Map();for(const o of [...g.children]){if(!o.isMesh||o.userData.room||o.material.transparent||Array.isArray(o.material))continue;o.updateMatrix();const geo=o.geometry.clone().applyMatrix4(o.matrix);const k=o.material.uuid;if(!mats.has(k))mats.set(k,{material:o.material,geos:[],objects:[]});mats.get(k).geos.push(geo);mats.get(k).objects.push(o);}for(const v of mats.values()){if(v.geos.length<2)continue;const geo=mergeGeometries(v.geos,false);if(!geo)continue;const out=new THREE.Mesh(geo,v.material);out.castShadow=out.receiveShadow=true;out.name='Batched architectural detail';g.add(out);for(const o of v.objects)g.remove(o);}}
export function buildEnvelope(){const g=new THREE.Group();g.name='Source-informed architectural envelope';
for(const story of envelope.stories){for(const shape of story.polygons){for(const ring of [shape.outer,...shape.holes]){const poly=ring.map(cv);for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.3)continue;const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,base=story.base;const gym=x<15&&z>23&&story.level>0&&story.level<3;const northShop=z<-32&&story.level===1;
if(gym){edge(g,a,b,base,4.2,.32,story.level===2?charcoal:brick);if(story.level===2){sub(g,a,b,.12,.88,base+2.25,1.3,.36,glass);const n=Math.ceil(l/2.8);for(let k=1;k<n;k++)sub(g,a,b,k/n-.005,k/n+.005,base+2.25,1.3,.39,trim);}}
else{const sill=story.level===0?.35:1.05,win=story.level===0?2.7:1.65;edge(g,a,b,base,sill,.32,brick);edge(g,a,b,base+sill+win,4.2-sill-win,.32,brick);const bays=Math.max(1,Math.round(l/6.2));for(let k=0;k<bays;k++){const t=k/bays,t1=(k+1)/bays,pier=Math.min(.24,.8/l);sub(g,a,b,t,t+pier,base+sill,win,.32,brick);sub(g,a,b,t+pier,t1-pier,base+sill,win,.17,glass);sub(g,a,b,t1-pier,t1,base+sill,win,.32,brick);for(let j=1;j<4;j++){const u=t+pier+(t1-t-2*pier)*j/4;sub(g,a,b,u-.004,u+.004,base+sill,win,.22,trim);}}
if(northShop&&l>7){sub(g,a,b,.22,.49,base+.1,2.8,.4,trim);for(let h=.4;h<2.8;h+=.35)sub(g,a,b,.22,.49,base+h,.035,.42,charcoal);}}
edge(g,a,b,base+4.08,.12,.43,trim);
}}}}
for(const r of envelope.roofs){for(const p of r.polygons){slab(g,p,r.elevation,.18,roof);const pts=p.outer.map(cv);for(let i=0;i<pts.length;i++)edge(g,pts[i],pts[(i+1)%pts.length],r.elevation,.42,.23,brick);}}
/* East forecourt entrance: facade along Z, canopy projecting toward Sixth Line. */
block(g,.22,6.9,19.5,34.1,3.45,-7.4,glass);
for(let z=-17;z<3;z+=2.5)block(g,.36,7,.1,34.3,3.5,z,trim);
for(let h=2.4;h<7;h+=2.3)block(g,.4,.1,19.5,34.3,h,-7.4,trim);
block(g,9,.55,24,37.8,7.45,-6,charcoal);block(g,.25,7.2,.25,41.7,3.6,4.5,trim);
block(g,.5,12.5,9.8,55,6.25,-20.5,pale);for(let z=-25;z<-16;z+=3)block(g,.56,.045,9,55.05,4.2,z,pale);
block(g,8,.14,22,39,-.05,-6,paving);
// Tall glazed circulation strips in the north and south academic wing.
for(const [x,z,rot] of [[26.9,-44,0],[23.7,47,0],[-22,-18,Math.PI/2]]){const tower=new THREE.Group();for(let y=0;y<12.6;y+=2.1){block(tower,4.5,1.97,.18,0,y+1,0,glass);block(tower,4.6,.12,.25,0,y+2,0,trim);}for(let u=-2.3;u<=2.3;u+=1.15)block(tower,.08,12.6,.24,u,6.3,0,trim);tower.position.set(x,0,z);tower.rotation.y=rot;g.add(tower);batch(tower);}
// Rooftop plant and screened service equipment, schematic.
for(const [x,z,w,d,h] of [[-5,-45,17,6,2.6],[-22,37,11,4,1.5]]){const y=z>0?8.6:12.8;block(g,w,h,d,x,y+h/2,z,trim);for(let k=0;k<6;k++)block(g,w+.4,.05,d+.35,x,y+.2+k*h/6,z,charcoal);}
const text=document.createElement('canvas');text.width=1024;text.height=256;const c=text.getContext('2d');c.clearRect(0,0,1024,256);c.fillStyle='#303b36';c.textAlign='center';c.font='30px Arial';c.fillText('N E   O A K V I L L E',512,80);c.fillText('H I G H   S C H O O L',512,140);c.font='20px Arial';c.fillText('4 0 2 0',512,208);const tex=new THREE.CanvasTexture(text);tex.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));sign.rotation.y=Math.PI/2;sign.position.set(55.3,7,-20.5);g.add(sign);
batch(g);return g;}
