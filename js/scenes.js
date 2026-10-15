/* 3D scenes for How I can help (Fahad 2026-09-24: situation 03 approved at round 2, "lets implement for all").
   One kit builds every building (walls with real openings, recessed glass, a lit room inside, roof,
   trim, door, lights); four stages each act out the same story as their line drawing:
   shop     a shopfront: awnings unfold, lights on, the door sign flips CLOSED to OPEN, the fascia lights
   invest   a street of three houses lighting one by one; FOR SALE flips to SOLD, a fourth house grows
   key      the approved house: the gold key flies in, turns, the door opens, the room lights
   move     SOLD at the old house, three moving boxes arc to the new one, the lights change over
   Studio HDRI (Poly Haven, CC0) loaded once and shared. Each stage fits its camera numerically so the
   whole plinth stays in frame through every angle it turns through. A stage renders only while its act
   plays; the fly-through decides when (window.__h3d[name].play/reset). */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
const BOXES=window.__m3dBoxes;
// built after the loading screen finishes, so these four scenes never compete with the gold key for the first seconds
const buildScenes=()=>{
const gsap=window.gsap;

// ---------------- procedural textures ----------------
function tex(w,h,draw,srgb,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=8;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(rep)t.repeat.set(rep[0],rep[1]);return t;}
let seed=7;const rnd=(a=0,b=1)=>{seed=(seed*16807)%2147483647;return a+(seed-1)/2147483646*(b-a);};
const sidingBump=tex(64,512,(x,w,h)=>{for(let y=0;y<h;y+=32){const g=x.createLinearGradient(0,y,0,y+32);g.addColorStop(0,'#3c3c3c');g.addColorStop(.1,'#ffffff');g.addColorStop(1,'#cfcfcf');x.fillStyle=g;x.fillRect(0,y,w,32);}},false,[1,.7]);
const grain=tex(256,256,(x,w,h)=>{const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=128+rnd(-60,60);d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);});
const grassBump=tex(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){x.fillStyle=rnd()<.5?'rgba(255,255,255,.35)':'rgba(0,0,0,.35)';x.fillRect(rnd(0,w),rnd(0,h),1,rnd(1,3));}},false,[3,3]);
const leafBump=tex(128,128,(x,w,h)=>{x.fillStyle='#777';x.fillRect(0,0,w,h);for(let i=0;i<1400;i++){x.fillStyle=rnd()<.5?'#fff':'#111';x.beginPath();x.arc(rnd(0,w),rnd(0,h),rnd(1,3),0,7);x.fill();}});
const brickBump=tex(128,128,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#333';for(let r=0;r<8;r++){x.fillRect(0,r*16,w,2);for(let c=0;c<4;c++)x.fillRect((c*32+(r%2)*16)%w,r*16,2,16);}});
const brickCol=tex(128,128,(x,w,h)=>{for(let r=0;r<8;r++)for(let c=0;c<5;c++){const v=rnd(-14,14);x.fillStyle=`rgb(${150+v},${88+v*.6},${70+v*.5})`;x.fillRect((c*32+(r%2)*16)-16,r*16,32,16);}x.fillStyle='#cfc4b4';for(let r=0;r<8;r++){x.fillRect(0,r*16,w,2);for(let c=0;c<5;c++)x.fillRect((c*32+(r%2)*16)%w,r*16,2,16);}},true);
const paving=tex(128,128,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#555';for(let i=0;i<=4;i++){x.fillRect(0,i*32,w,2);x.fillRect(i*32,0,2,h);}},false,[5,4]);
const room=tex(8,64,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#8a5a22');g.addColorStop(.6,'#f2b865');g.addColorStop(1,'#ffe6b0');x.fillStyle=g;x.fillRect(0,0,w,h);},true);
const blob=tex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,.75)');g.addColorStop(.55,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
const stripes=tex(256,64,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#f1ece0':'#1a4480';x.fillRect(i*32,0,32,h);}},true);
function label(text,bg,fg,w=512,h=256,size=86){return tex(w,h,(x)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=8;x.strokeRect(14,14,w-28,h-28);x.fillStyle=fg;x.font=`800 ${size}px "Mona Sans","Helvetica Neue",Arial,sans-serif`;x.textAlign='center';x.textBaseline='middle';
  const sp=size*.12;const chars=[...text];let tw=chars.reduce((a,c)=>a+x.measureText(c).width,0)+sp*(chars.length-1);let cx=(w-tw)/2;x.textAlign='left';chars.forEach(c=>{x.fillText(c,cx,h/2+4);cx+=x.measureText(c).width+sp;});},true);}

// ---------------- materials ----------------
const M=o=>new THREE.MeshPhysicalMaterial(o);
const sidingCache={};const siding=c=>sidingCache[c]||(sidingCache[c]=M({color:c,roughness:.72,bumpMap:sidingBump,bumpScale:1.4}));
const trim=M({color:0xf6f3ec,roughness:.55});
const roofCache={};const roofM=c=>roofCache[c]||(roofCache[c]=M({color:c,metalness:.65,roughness:.42,clearcoat:.3,clearcoatRoughness:.4}));
const seamMat=M({color:0x3a414c,metalness:.7,roughness:.35});
const brass=M({color:0xd3b65a,metalness:1,roughness:.26});
const gold=M({color:0xe8c96c,metalness:1,roughness:.12,clearcoat:.8});
const doorCache={};const doorM=c=>doorCache[c]||(doorCache[c]=M({color:c,roughness:.3,clearcoat:1,clearcoatRoughness:.1}));
const lacquer=M({color:0x123262,roughness:.2,metalness:.1,clearcoat:1,clearcoatRoughness:.08});
const lawnM=M({color:0x3d5a2e,roughness:.95,bumpMap:grassBump,bumpScale:1.2,sheen:.6,sheenColor:0x6f8f4a,sheenRoughness:.8});
const hedgeM=M({color:0x2f4d27,roughness:.9,bumpMap:leafBump,bumpScale:2.5});
const stone=M({color:0xb9b1a3,roughness:.85,bumpMap:grain,bumpScale:.6});
const pavingM=M({color:0xc4bcae,roughness:.88,bumpMap:paving,bumpScale:1.2});
const chimneyM=M({color:0x8c7b6c,roughness:.9,bumpMap:brickBump,bumpScale:1.5});
const brickWall=M({map:brickCol,roughness:.88,bumpMap:brickBump,bumpScale:1.6});
brickCol.repeat.set(1.6,1.6);brickBump.repeat.set(1,1);
const interior=M({color:0xe9d9bd,roughness:.85,side:THREE.BackSide,envMapIntensity:.12});
const floorM=M({color:0x7a5534,roughness:.55,bumpMap:grain,bumpScale:.3,envMapIntensity:.2});
const glassM=M({color:0xdfe8f5,roughness:.04,transparent:true,opacity:.18,envMapIntensity:1.6,depthWrite:false});
const cardboard=M({color:0xb98a57,roughness:.85,bumpMap:grain,bumpScale:.25});
const tape=M({color:0xd8c39a,roughness:.5});
const woodM=M({color:0x8a6240,roughness:.6,bumpMap:grain,bumpScale:.2});
const lampMat=()=>new THREE.MeshStandardMaterial({color:0x2a2418,emissive:0xffffff,emissiveMap:room,emissiveIntensity:0});
function mesh(g,m,cast=true){const o=new THREE.Mesh(g,m);o.castShadow=cast;o.receiveShadow=true;return o;}
function B(p,w,h,d,m,x,y,z,cast=true){const b=mesh(new THREE.BoxGeometry(w,h,d),m,cast);b.position.set(x,y,z);p.add(b);return b;}
function RB(p,w,h,d,r,m,x,y,z,cast=true){const b=mesh(new RoundedBoxGeometry(w,h,d,2,r),m,cast);b.position.set(x,y,z);p.add(b);return b;}

// ---------------- the kit ----------------
// walls: extruded shapes with real openings, built at ground level 0, front face on +z
function wallShape(len,H,holes){const sh=new THREE.Shape();sh.moveTo(-len/2,0);sh.lineTo(len/2,0);sh.lineTo(len/2,H);sh.lineTo(-len/2,H);sh.closePath();
  holes.forEach(([x,y,w,h])=>{const p=new THREE.Path();p.moveTo(x-w/2,y);p.lineTo(x-w/2,y+h);p.lineTo(x+w/2,y+h);p.lineTo(x+w/2,y);p.closePath();sh.holes.push(p);});return sh;}
function walls(g,W,D,H,T,mat,holes){ // holes: {front:[],back:[],right:[],left:[]}
  const mk=(len,hl,x,z,r)=>{const geo=new THREE.ExtrudeGeometry(wallShape(len,H,hl),{depth:T,bevelEnabled:false});geo.translate(0,0,-T);const m=mesh(geo,mat);m.position.set(x,0,z);m.rotation.y=r;g.add(m);};
  mk(W,holes.front||[],0,D/2,0);mk(W,holes.back||[],0,-D/2,Math.PI);mk(D-2*T,holes.right||[],W/2,0,Math.PI/2);mk(D-2*T,holes.left||[],-W/2,0,-Math.PI/2);
}
function room3(g,W,D,H,T){ // lining, floor and the light that comes on
  const lining=new THREE.Mesh(new THREE.BoxGeometry(W-2*T-.01,H-.01,D-2*T-.01),interior);lining.position.y=H/2;lining.receiveShadow=true;g.add(lining);
  const f=mesh(new THREE.PlaneGeometry(W-2*T,D-2*T),floorM,false);f.rotation.x=-Math.PI/2;f.position.y=.004;g.add(f);
  const L=new THREE.PointLight(0xffb25a,0,Math.max(W,D)*1.05,1.4);L.position.set(0,H*.66,.1);g.add(L);return L;
}
function windowAt(g,x,y,w,h,z,rotY,T){
  const w0=new THREE.Group();w0.rotation.y=rotY;g.add(w0);const cy=y+h/2;
  B(w0,w+.14,.07,.03,trim,x,cy+h/2+.035,z+.012);B(w0,.06,h,.03,trim,x-w/2-.035,cy,z+.012);B(w0,.06,h,.03,trim,x+w/2+.035,cy,z+.012);
  B(w0,w+.2,.045,.1,trim,x,y-.03,z+.03);B(w0,.022,h,.03,trim,x,cy,z-T*.55);B(w0,w,.022,.03,trim,x,cy,z-T*.55);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),glassM);gl.position.set(x,cy,z-T*.6);w0.add(gl);
}
function hedge(g,w,d,x,z,h=.26){const m=mesh(new RoundedBoxGeometry(w,h,d,4,.1),hedgeM);m.position.set(x,h/2,z);g.add(m);return m;}
function gableRoof(g,W,D,H,T,wallMat,roofCol,pitch=.62){
  const run=W/2+.16,slope=run/Math.cos(pitch),rise=Math.tan(pitch)*(W/2),RL=D+.34;
  const gs=new THREE.Shape();gs.moveTo(-W/2,0);gs.lineTo(W/2,0);gs.lineTo(0,rise);gs.closePath();
  [D/2,-D/2+T].forEach(z=>{const geo=new THREE.ExtrudeGeometry(gs,{depth:T,bevelEnabled:false});geo.translate(0,0,-T);const m=mesh(geo,wallMat);m.position.set(0,H,z);g.add(m);});
  const rm=roofM(roofCol);
  [1,-1].forEach(sd=>{
    const p=new THREE.Group();p.position.set(sd*run/2,H+rise-Math.tan(pitch)*run/2+.03/Math.cos(pitch),0);p.rotation.z=-sd*pitch;g.add(p);
    p.add(mesh(new RoundedBoxGeometry(slope,.06,RL,2,.012),rm));
    for(let z=-RL/2+.1;z<RL/2-.05;z+=.16){const sm=mesh(new THREE.BoxGeometry(slope-.01,.03,.018),seamMat);sm.position.set(0,.043,z);p.add(sm);}
    const so=mesh(new THREE.BoxGeometry(slope,.012,RL),trim,false);so.position.y=-.036;p.add(so);
    const gut=mesh(new THREE.CylinderGeometry(.035,.035,RL,16,1,true,0,Math.PI),M({color:0xf6f3ec,roughness:.4,side:THREE.DoubleSide}));
    gut.rotation.x=Math.PI/2;gut.rotation.y=sd>0?Math.PI/2:-Math.PI/2;gut.position.set(sd*slope/2,-.02,0);p.add(gut);
  });
  B(g,.12,.05,RL,rm,0,H+rise+.07,0);
  return rise;
}
// a house: storeys 1 or 2; returns handles for its act
function house(o){
  const {W=2.3,D=1.9,H=1.45,T=.09,body=0xece6da,roof=0x2c323c,door=0x123262,storeys=1,lantern=true,sideHedge=true,stones=3,chimney=true,sideWindow=true}=o;
  const g=new THREE.Group(),sm=siding(body),hs=H/storeys;
  const winW=W<2?.38:.46,winH=Math.min(.54,hs*.37),winY=Math.min(.62,hs*.43),doorW=.5,doorH=.98;
  const wx=Math.max(.25+.08+winW/2,W*.31);
  const front=[[-wx,winY,winW,winH],[wx,winY,winW,winH],[0,0,doorW,doorH]];
  const up=storeys>1?[-wx,0,wx].map(x=>[x,hs+winY*.8,winW,winH]):[];
  walls(g,W,D,H,T,sm,{front:front.concat(up),back:[[-W*.22,winY,winW,winH],[W*.22,winY,winW,winH]],right:sideWindow?[[0,winY,.62,winH]]:[]});
  const inside=room3(g,W,D,H,T);
  [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>B(g,.08,H,.08,trim,sx*(W/2-.02),H/2,sz*(D/2-.02)));
  B(g,W+.04,.07,D+.04,M({color:0x9d9488,roughness:.85,bumpMap:grain,bumpScale:.4}),0,.035,0);
  front.slice(0,2).concat(up).forEach(([x,y,w,h])=>windowAt(g,x,y,w,h,D/2,0,T));
  [[-W*.22],[W*.22]].forEach(([x])=>windowAt(g,x,winY,winW,winH,D/2,Math.PI,T));
  if(sideWindow)windowAt(g,0,winY,.62,winH,W/2,Math.PI/2,T);
  if(storeys>1)B(g,W+.02,.05,D+.02,trim,0,hs,0); // band between storeys
  // door
  B(g,doorW+.16,.08,.035,trim,0,doorH+.04,D/2+.012);B(g,.07,doorH,.035,trim,-doorW/2-.035,doorH/2,D/2+.012);B(g,.07,doorH,.035,trim,doorW/2+.035,doorH/2,D/2+.012);
  const hinge=new THREE.Group();hinge.position.set(-doorW/2,.005,D/2-T*.45);g.add(hinge);
  const dm=doorM(door);const leaf=mesh(new RoundedBoxGeometry(doorW-.01,doorH-.012,.04,2,.006),dm);leaf.position.set(doorW/2,(doorH-.012)/2,0);hinge.add(leaf);
  [.3,.72].forEach(py=>{B(hinge,.15,.28,.012,dm,doorW/2-.1,py,.024);B(hinge,.15,.28,.012,dm,doorW/2+.1,py,.024);});
  const kb=mesh(new THREE.SphereGeometry(.024,24,16),gold);kb.position.set(doorW-.07,.47,.045);hinge.add(kb);
  RB(hinge,.045,.16,.01,.004,brass,doorW-.07,.53,.026);B(hinge,doorW-.06,.07,.006,brass,doorW/2,.06,.024);
  let lamp=null,porch=null;
  if(lantern){const L=new THREE.Group();L.position.set(doorW/2+.2,.78,D/2+.06);g.add(L);lamp=lampMat();L.add(mesh(new THREE.BoxGeometry(.075,.11,.075),lamp));
    const lt=mesh(new THREE.ConeGeometry(.065,.05,4),brass);lt.rotation.y=Math.PI/4;lt.position.y=.08;L.add(lt);B(L,.03,.03,.06,brass,0,-.02,-.05);
    porch=new THREE.PointLight(0xffc27a,0,1.3,1.8);porch.position.set(doorW/2+.2,.74,D/2+.2);g.add(porch);}
  RB(g,.78,.08,.3,.015,stone,0,.04,D/2+.16);
  for(let i=0;i<stones;i++){const p=RB(g,.38+rnd(-.04,.04),.025,.13,.01,stone,rnd(-.03,.03),.005,D/2+.36+i*.18);p.rotation.y=rnd(-.08,.08);}
  hedge(g,.62*(winW/.46),.24,-wx,D/2+.2);hedge(g,.62*(winW/.46),.24,wx,D/2+.2);if(sideHedge)hedge(g,.24,D*.63,W/2+.2,0);
  B(g,.022,H+.1,.022,trim,W/2+.1,H/2,D/2+.1).geometry=new THREE.CylinderGeometry(.022,.022,H+.1,12);
  const rise=gableRoof(g,W,D,H,T,sm,roof);
  if(chimney){B(g,.3,.75,.3,chimneyM,W*.24,H+rise-.08,-D*.21);RB(g,.36,.05,.36,.012,seamMat,W*.24,H+rise+.31,-D*.21);}
  return {g,hinge,inside,porch,lamp,doorW,doorH,D,T,top:H+rise+.4};
}
function plinth(model,PW,PD,top){ // lacquered navy base with a brass edge; top: 'lawn' or 'paving'
  const PH=.2;RB(model,PW,PH,PD,.05,lacquer,0,PH/2,0);RB(model,PW+.03,.035,PD+.03,.012,brass,0,PH-.03,0,false);
  RB(model,PW-.12,.03,PD-.12,.012,top==='paving'?pavingM:lawnM,0,PH+.012,0,false);
  const ao=new THREE.Mesh(new THREE.PlaneGeometry(PW*.8,PD*.8),new THREE.MeshBasicMaterial({map:blob,transparent:true,opacity:.5,depthWrite:false}));ao.rotation.x=-Math.PI/2;ao.position.y=PH+.03;ao.userData.noFit=true;model.add(ao);
  return PH+.028; // ground level
}
function sidewalk(model,PW,PD,G,depth=.36){const s=RB(model,PW-.14,.02,depth,.008,pavingM,0,G+.002,PD/2-.07-depth/2,false);return s;}
function saleSign(front,back){ // brass post and arm, a board that flips from one side to the other
  const g=new THREE.Group();B(g,.035,.9,.035,brass,0,.45,0).geometry=new THREE.CylinderGeometry(.018,.02,.9,14);
  B(g,.46,.03,.03,brass,.21,.86,0);const board=new THREE.Group();board.position.set(.26,.84,0);g.add(board);
  [.12,.4].forEach(x=>B(board,.006,.06,.006,brass,x-.26,-.03,0));
  const pl=(t,r)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.4,.2),new THREE.MeshStandardMaterial({map:t,roughness:.45}));m.position.y=-.16;m.rotation.y=r;m.position.z=r?-.004:.004;m.castShadow=true;board.add(m);};
  pl(label(front,'#123262','#e8c96c'),0);pl(label(back,'#e8c96c','#123262'),Math.PI);B(board,.41,.21,.006,brass,0,-.16,0);
  return {g,board};
}
function cardBox(){const g=new THREE.Group();RB(g,.24,.19,.24,.012,cardboard,0,.095,0);B(g,.245,.008,.05,tape,0,.19,0);B(g,.05,.19,.245,tape,0,.095,0).scale.set(.2,1.002,1);return g;}

// ---------------- stages ----------------
const HDRI='https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr';
const stages=[];let hdr=null;
new RGBELoader().load(HDRI,t=>{hdr=t;t.mapping=THREE.EquirectangularReflectionMapping;stages.forEach(s=>s.useHdr());});
function stage(name,def){
  const box=BOXES[name];if(!box)return;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;box.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.5;
  const model=new THREE.Group();scene.add(model);
  const S=def.size; // shadow reach
  scene.add(new THREE.HemisphereLight(0xcfdcf5,0x0d2240,.28));
  const sun=new THREE.DirectionalLight(0xfff1dc,3.2);sun.position.set(-4,7,4.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-S,right:S,top:S,bottom:-S,near:1,far:24});sun.shadow.radius=5;sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;scene.add(sun);
  const rim=new THREE.DirectionalLight(0x9dbcff,1.2);rim.position.set(3.5,3,-5);scene.add(rim);
  const catcher=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.ShadowMaterial({opacity:.4}));catcher.rotation.x=-Math.PI/2;catcher.receiveShadow=true;scene.add(catcher);
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(def.plinth[0]*1.25,def.plinth[1]*1.25),new THREE.MeshBasicMaterial({map:blob,transparent:true,opacity:.6,depthWrite:false}));outer.rotation.x=-Math.PI/2;outer.position.y=.002;scene.add(outer);
  const h=def.build(model);
  // camera: fitted to the model's parts at every angle of its turn
  const cam=new THREE.PerspectiveCamera(def.fov||24,1,.1,90),target=new THREE.Vector3(...def.target),dir=new THREE.Vector3(...def.dir).normalize();
  if(def.fitPose)def.fitPose(h);
  model.updateMatrixWorld(true);const pts=[];const bb=new THREE.Box3();
  model.traverse(o=>{if(o.isMesh&&!o.userData.noFit&&!isFlying(o)){bb.setFromObject(o);const {min:a,max:b}=bb;[[a.x,a.y,a.z],[b.x,a.y,a.z],[a.x,b.y,a.z],[a.x,a.y,b.z],[b.x,b.y,a.z],[b.x,a.y,b.z],[a.x,b.y,b.z],[b.x,b.y,b.z]].forEach(p=>pts.push(new THREE.Vector3(...p)));}});
  function isFlying(o){for(let p=o;p;p=p.parent){if(p.userData.flying)return true;}return false;}
  const rots=[];for(let r=def.rot[0];r<=def.rot[1]+.001;r+=.05)rots.push(r);
  function fits(d){cam.position.copy(target).addScaledVector(dir,d);cam.lookAt(target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
    const v=new THREE.Vector3(),m=new THREE.Matrix4();
    for(const r of rots){m.makeRotationY(r);for(const p of pts){v.copy(p).applyMatrix4(m).project(cam);if(v.x>.9||v.x<-.9||v.y>.9||v.y<-.9)return false;}}return true;}
  function frame(){let lo=3,hi=60;for(let i=0;i<18;i++){const md=(lo+hi)/2;if(fits(md))hi=md;else lo=md;}fits(hi);}
  if(def.pose0)def.pose0(h);
  let tl=null,running=false;
  const render=()=>renderer.render(scene,cam);
  function size(){const cv=renderer.domElement,w=cv.clientWidth,hh=cv.clientHeight;if(!w||!hh)return;renderer.setSize(w,hh,false);cam.aspect=w/hh;frame();render();}
  new ResizeObserver(size).observe(box);
  const start=()=>{if(!running){running=true;gsap.ticker.add(render);}},stop=()=>{if(running){running=false;gsap.ticker.remove(render);}};
  function reset(){if(tl)tl.kill();tl=null;stop();model.rotation.y=def.rot[0];model.position.y=-.3;model.scale.setScalar(.92);def.pose0(h);render();}
  function play(){reset();start();tl=gsap.timeline()
      .to(model.rotation,{y:def.rest,duration:1.9,ease:'power3.out'},0)
      .to(model.position,{y:0,duration:1.4,ease:'power3.out'},0)
      .to(model.scale,{x:1,y:1,z:1,duration:1.4,ease:'power3.out'},0);
    const end=def.act(tl,h);
    tl.to(model.rotation,{y:def.rot[1],duration:5,ease:'sine.inOut',repeat:-1,yoyo:true},Math.max(end,2));}
  const st={useHdr(){scene.environment=pmrem.fromEquirectangular(hdr).texture;scene.environmentIntensity=.55;render();}};
  if(hdr)st.useHdr();stages.push(st);
  reset();size();
  (window.__h3d=window.__h3d||{})[name]={play,reset};
  if(window.__h3dWant===name)play();
}

// 1 · self-employed: a shopfront
stage('shop',{plinth:[4.2,3.1],size:3.4,target:[0,1.05,.2],dir:[.6,.34,1],rot:[-.75,.2],rest:-.12,
  build(model){
    const G=plinth(model,4.2,3.1,'paving'),g=new THREE.Group();g.position.y=G;model.add(g);
    const W=2.6,D=1.7,H=2.05,T=.09,sw=.8,sh=.86,sy=.3,dW=.52,dH=1.08,uy=1.5;
    const front=[[-.8,sy,sw,sh],[.8,sy,sw,sh],[0,0,dW,dH],[-.72,uy,.42,.36],[.72,uy,.42,.36]];
    walls(g,W,D,H,T,brickWall,{front,back:[],right:[[0,sy+.1,.6,.6]]});
    const inside=room3(g,W,D,H,T);inside.distance=3;
    // shop interior: counter and shelves seen through the glass
    RB(g,.9,.42,.34,.02,woodM,.35,.21,-.2);[.35,.7,1.05].forEach(y=>B(g,1.9,.03,.22,woodM,0,y,-D/2+T+.12));
    for(let i=0;i<14;i++)RB(g,.1,.12+rnd(0,.08),.12,.01,M({color:[0x1a4480,0xd3b65a,0xe9e1cf,0x9a741f][i%4],roughness:.5}),-.85+i*.13,.43+ (i%3)*.35,-D/2+T+.12);
    // shopfront joinery in navy: pilasters, stall risers, transom rail, fascia
    const nv=doorM(0x123262);
    [-W/2+.07,-dW/2-.05,dW/2+.05,W/2-.07].forEach(x=>B(g,.1,1.3,.07,nv,x,.65,D/2+.03));
    [-.8,.8].forEach(x=>B(g,sw+.02,sy,.07,nv,x,sy/2,D/2+.03));
    B(g,W+.02,.06,.09,nv,0,1.3,D/2+.04);
    const signTex=label('YOUR BUSINESS','#123262','#e8c96c',1024,160,92);
    const sign=new THREE.MeshStandardMaterial({map:signTex,emissive:0xffffff,emissiveMap:signTex,emissiveIntensity:0,roughness:.4});
    const fascia=mesh(new THREE.BoxGeometry(W-.1,.26,.08),[nv,nv,nv,nv,sign,nv]);fascia.position.set(0,1.46,D/2+.05);g.add(fascia);
    B(g,W+.08,.04,.12,trim,0,1.61,D/2+.06);
    // glass: display windows, upper windows, a glazed door
    [[-.8,sy,sw,sh],[.8,sy,sw,sh]].forEach(([x,y,w,h])=>{const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),glassM);gl.position.set(x,y+h/2,D/2-T*.6);g.add(gl);B(g,.02,h,.03,nv,x,y+h/2,D/2-T*.5);});
    [[-.72],[.72]].forEach(([x])=>windowAt(g,x,uy,.42,.36,D/2,0,T));
    windowAt(g,0,sy+.1,.6,.6,W/2,Math.PI/2,T);
    const hinge=new THREE.Group();hinge.position.set(-dW/2,.005,D/2-T*.45);g.add(hinge);
    B(hinge,.06,dH-.02,.04,nv,.03,(dH-.02)/2,0);B(hinge,.06,dH-.02,.04,nv,dW-.03,(dH-.02)/2,0);B(hinge,dW,.06,.04,nv,dW/2,dH-.05,0);B(hinge,dW,.16,.04,nv,dW/2,.08,0);
    const dg=new THREE.Mesh(new THREE.PlaneGeometry(dW-.12,dH-.26),glassM);dg.position.set(dW/2,.16+(dH-.26)/2,0);hinge.add(dg);
    B(hinge,.02,.3,.02,brass,dW-.1,.55,.04);
    // the door sign: CLOSED facing out, OPEN on its back, hung inside the glass
    const hang=new THREE.Group();hang.position.set(dW/2,.72,-.01);hinge.add(hang);
    [[-.07],[.07]].forEach(([x])=>B(hang,.004,.1,.004,brass,x,.05,0));
    const face=(t,r)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.26,.12),new THREE.MeshStandardMaterial({map:t,roughness:.5}));m.rotation.y=r;m.position.z=r?-.003:.003;hang.add(m);};
    face(label('CLOSED','#f1ece0','#123262'),0);face(label('OPEN','#123262','#e8c96c'),Math.PI);B(hang,.265,.125,.004,brass,0,0,0);
    // awnings over the display windows, hinged at the top of the glass
    const awn=[-.8,.8].map(x=>{const a=new THREE.Group();a.position.set(x,sy+sh+.06,D/2+.06);g.add(a);
      const cloth=new THREE.MeshStandardMaterial({map:stripes,roughness:.8,side:THREE.DoubleSide});
      const top=mesh(new THREE.BoxGeometry(sw+.1,.012,.46),cloth);top.position.z=.23;a.add(top);
      const val=mesh(new THREE.BoxGeometry(sw+.1,.1,.012),cloth);val.position.set(0,-.05,.46);a.add(val);return a;});
    // gooseneck lamps lighting the fascia
    const lampL=[];[-.95,.95].forEach(x=>{B(g,.02,.02,.2,brass,x,1.66,D/2+.14);const sh2=mesh(new THREE.ConeGeometry(.06,.07,20,1,true),brass);sh2.position.set(x,1.64,D/2+.25);sh2.rotation.x=Math.PI;g.add(sh2);
      const sp=new THREE.SpotLight(0xffd29a,0,1.6,.9,.6,1.5);sp.position.set(x,1.62,D/2+.26);sp.target.position.set(x,1.35,D/2);g.add(sp,sp.target);lampL.push(sp);});
    // flat roof with a parapet cap
    B(g,W-.02,.04,D-.02,M({color:0x2a2e35,roughness:.9,bumpMap:grain,bumpScale:.4}),0,H+.02,0); // dark roof membrane
    // parapet: brick upstand round the edge with a pale stone coping, a rooftop unit behind it
    [[0,D/2-.045,W,.09],[0,-D/2+.045,W,.09]].forEach(([x,z,w,d])=>{B(g,w,.18,d,brickWall,x,H+.09,z);B(g,w+.06,.035,d+.06,trim,x,H+.195,z);});
    [[W/2-.045,0,.09,D-.18],[-W/2+.045,0,.09,D-.18]].forEach(([x,z,w,d])=>{B(g,w,.18,d,brickWall,x,H+.09,z);B(g,w+.06,.035,d,trim,x,H+.195,z);});
    RB(g,.5,.24,.4,.02,M({color:0x9aa1ab,metalness:.6,roughness:.4}),.5,H+.14,-.3);
    // planters by the door
    [-1.15,1.15].forEach(x=>{RB(g,.3,.26,.3,.02,nv,x,.13,D/2+.3);const b=mesh(new THREE.SphereGeometry(.17,32,20),hedgeM);b.position.set(x,.42,D/2+.3);g.add(b);});
    return {awn,hang,inside,sign,lampL};
  },
  pose0(h){h.awn.forEach(a=>a.rotation.x=-1.45);h.hang.rotation.y=0;h.inside.intensity=0;h.sign.emissiveIntensity=0;h.lampL.forEach(l=>l.intensity=0);},
  fitPose(h){h.awn.forEach(a=>a.rotation.x=.42);},
  act(tl,h){
    tl.to(h.awn.map(a=>a.rotation),{x:.42,duration:1,stagger:.18,ease:'back.out(1.4)'},1.0)
      .to(h.inside,{intensity:3.4,duration:.9},1.9)
      .to(h.hang.rotation,{y:Math.PI,duration:.9,ease:'back.inOut(1.6)'},2.6)
      .to(h.lampL,{intensity:2.2,duration:.5,stagger:.15},3.4)
      .to(h.sign,{emissiveIntensity:.85,duration:.7},3.5);
    return 4.4;
  }});

// 2 · investors: a street, and the next purchase
stage('invest',{plinth:[6.2,3.0],size:4,target:[.1,.7,.2],dir:[.5,.42,1],rot:[-.55,.12],rest:-.1,
  build(model){
    const G=plinth(model,6.2,3.0,'lawn');sidewalk(model,6.2,3.0,G);
    const k=.6,lots=[-2.25,-.75,.75,2.25];
    const hs=[house({W:2.1,D:1.8,H:1.45,body:0xece6da,stones:2,sideHedge:false}),
              house({W:2.2,D:1.9,H:2.6,storeys:2,body:0xc9d2da,stones:2,sideHedge:false,door:0x2c323c}),
              house({W:2.0,D:1.8,H:1.45,body:0xd9d1c5,roof:0x3a3530,stones:2,sideHedge:false,door:0x5a2f2a}),
              house({W:2.0,D:1.8,H:1.45,body:0xf0ece2,stones:2,sideHedge:false,lantern:true})];
    hs.forEach((x,i)=>{x.g.scale.setScalar(k);x.g.position.set(lots[i],G,-.25);model.add(x.g);});
    const sign=saleSign('FOR SALE','SOLD');sign.g.position.set(lots[3]+.42,G,.72);sign.g.scale.setScalar(1.1);model.add(sign.g);
    return {hs,sign,k};
  },
  pose0(h){h.hs.forEach(x=>{x.inside.intensity=0;if(x.lamp)x.lamp.emissiveIntensity=0;if(x.porch)x.porch.intensity=0;});h.sign.board.rotation.y=0;const n=h.hs[3].g;n.scale.set(h.k,.001,h.k);n.visible=false;},
  fitPose(h){},
  act(tl,h){
    [0,1,2].forEach(i=>tl.to(h.hs[i].inside,{intensity:2.6,duration:.6},.9+i*.45).to(h.hs[i].lamp,{emissiveIntensity:1.5,duration:.4},.95+i*.45).to(h.hs[i].porch,{intensity:1.1,duration:.4},.95+i*.45));
    const n=h.hs[3];
    tl.to(h.sign.board.rotation,{y:Math.PI,duration:.9,ease:'back.inOut(1.6)'},2.5)
      .set(n.g,{visible:true},3.2)
      .to(n.g.scale,{y:h.k,duration:1.2,ease:'back.out(1.3)'},3.2)
      .to(n.inside,{intensity:2.6,duration:.6},4.3).to(n.lamp,{emissiveIntensity:1.5,duration:.4},4.3).to(n.porch,{intensity:1.1,duration:.4},4.3);
    return 5;
  }});

// 3 · first-time buyers: the approved house, key and door
stage('key',{plinth:[3.9,3.5],size:3.2,target:[0,1.0,.1],dir:[.62,.36,1],rot:[-.75,.2],rest:-.12,
  build(model){
    const G=plinth(model,3.9,3.5,'lawn'),x=house({});x.g.position.y=G;model.add(x.g);
    const doorway=new THREE.PointLight(0xffb866,0,2.2,1.6);doorway.position.set(0,.6,1.9/2-.35);x.g.add(doorway);
    const key=new THREE.Group();key.userData.flying=true;
    const bow=mesh(new THREE.TorusGeometry(.1,.03,24,56),gold);bow.rotation.y=Math.PI/2;bow.position.z=.52;key.add(bow);
    const col=mesh(new THREE.CylinderGeometry(.035,.035,.05,24),gold);col.rotation.x=Math.PI/2;col.position.z=.4;key.add(col);
    const sf=mesh(new THREE.CylinderGeometry(.019,.019,.38,20),gold);sf.rotation.x=Math.PI/2;sf.position.z=.19;key.add(sf);
    [[.07,.05],[.14,.035],[.21,.06]].forEach(([z,hh])=>{const b=mesh(new THREE.BoxGeometry(.022,hh,.04),gold);b.position.set(0,-.019-hh/2,z);key.add(b);});
    model.add(key);
    const KH=new THREE.Vector3(x.doorW/2-.07,G+.56,x.D/2-x.T*.45+.03);
    return {x,key,doorway,KH,model};
  },
  pose0(h){if(h.key.parent!==h.model)h.model.attach(h.key);h.key.position.set(2.2,2.2,2.6);h.key.rotation.set(1.1,2.4,.6);
    h.x.hinge.rotation.y=0;h.x.inside.intensity=0;h.doorway.intensity=0;h.x.porch.intensity=0;h.x.lamp.emissiveIntensity=0;},
  act(tl,h){const K=h.KH;
    tl.to(h.x.lamp,{emissiveIntensity:1.6,duration:.4},1.0).to(h.x.porch,{intensity:1.4,duration:.4},1.0)
      .to(h.key.position,{keyframes:{x:[2.2,1.2,K.x],y:[2.2,1.7,K.y],z:[2.6,2.4,K.z+.45],easeEach:'sine.inOut'},duration:1.5,ease:'power1.inOut'},.8)
      .to(h.key.rotation,{x:0,y:0,z:0,duration:1.5,ease:'power2.out'},.8)
      .to(h.key.position,{z:K.z,duration:.35,ease:'power2.in'},2.4)
      .to(h.key.rotation,{z:-Math.PI/2,duration:.4,ease:'back.out(2)'},2.85)
      .call(()=>{h.x.hinge.attach(h.key);},null,3.3)
      .to(h.x.hinge.rotation,{y:1.6,duration:1.3,ease:'power2.inOut'},3.32)
      .to(h.doorway,{intensity:2.2,duration:.9},3.4)
      .to(h.x.inside,{intensity:3.2,duration:1.1},3.6);
    return 5.2;
  }});

// 4 · moving homes: SOLD, boxes across, lights change over
stage('move',{plinth:[5.8,3.1],size:3.9,target:[0,.75,.2],dir:[.5,.42,1],rot:[-.55,.12],rest:-.1,
  build(model){
    const G=plinth(model,5.8,3.1,'lawn');sidewalk(model,5.8,3.1,G);
    const k=.66,old=house({W:1.9,D:1.7,H:1.4,body:0xddd3c3,roof:0x3a3530,door:0x5a2f2a,stones:2,sideHedge:false}),nu=house({W:2.2,D:1.9,H:2.6,storeys:2,body:0xf0ece2,stones:2,sideHedge:false});
    old.g.scale.setScalar(k);old.g.position.set(-1.55,G,-.2);nu.g.scale.setScalar(k);nu.g.position.set(1.45,G,-.25);model.add(old.g,nu.g);
    const sign=saleSign('FOR SALE','SOLD');sign.g.position.set(-.75,G,.62);model.add(sign.g);
    const from=new THREE.Vector3(-1.55,G,-.2+(1.7/2+.5)*k),to=new THREE.Vector3(1.45,G,-.25+(1.9/2+.5)*k);
    const slots=[[-.13,0,0],[.13,0,0],[0,.19,0]];
    const boxes=slots.map(()=>{const b=cardBox();b.userData.flying=true;model.add(b);return b;});
    return {old,nu,sign,boxes,from,to,slots};
  },
  pose0(h){[h.old,h.nu].forEach(x=>{x.inside.intensity=0;x.lamp.emissiveIntensity=0;x.porch.intensity=0;});h.sign.board.rotation.y=0;
    h.boxes.forEach((b,i)=>{const s=h.slots[i];b.position.set(h.from.x+s[0],h.from.y+s[1],h.from.z+.15);b.rotation.set(0,.1*i,0);});},
  act(tl,h){
    tl.to(h.old.inside,{intensity:2.6,duration:.5},.4).to(h.old.lamp,{emissiveIntensity:1.5,duration:.4},.4).to(h.old.porch,{intensity:1.1,duration:.4},.4)
      .to(h.sign.board.rotation,{y:Math.PI,duration:.9,ease:'back.inOut(1.6)'},1.3);
    // each box arcs across on its own curve and lands in the stack by the new front door (top box first)
    [2,1,0].forEach((bi,n)=>{const b=h.boxes[bi],s=h.slots[bi],a=new THREE.Vector3(h.from.x+s[0],h.from.y+s[1],h.from.z+.15),e=new THREE.Vector3(h.to.x+s[0],h.to.y+s[1],h.to.z+.15);
      const c=new THREE.CatmullRomCurve3([a,new THREE.Vector3(a.x*.55,a.y+1.1,a.z+.25),new THREE.Vector3(e.x*.55,e.y+1.1,e.z+.25),e]),p={t:0};
      tl.to(p,{t:1,duration:1.2,ease:'power1.inOut',onUpdate:()=>{b.position.copy(c.getPoint(p.t));}},2.1+n*.55)
        .to(b.rotation,{y:'+='+Math.PI,x:.25,duration:.6,ease:'sine.out',yoyo:true,repeat:1},2.1+n*.55);});
    tl.to(h.old.inside,{intensity:0,duration:.6},3.9).to(h.old.lamp,{emissiveIntensity:0,duration:.4},3.9).to(h.old.porch,{intensity:0,duration:.4},3.9)
      .to(h.nu.inside,{intensity:2.8,duration:.7},4.2).to(h.nu.lamp,{emissiveIntensity:1.5,duration:.4},4.2).to(h.nu.porch,{intensity:1.1,duration:.4},4.2);
    return 5.2;
  }});
};
if(BOXES&&window.gsap){if(window.__loaderOn&&window.__afterLoader)window.__afterLoader.push(buildScenes);else buildScenes();}
