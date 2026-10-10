/* LOADING SCREEN: the gold key (Fahad 2026-09-25: "add that to the loading screen, every time you go to
   the page", "the original logo with the original colours against a black background").
   The Keystone logo in its own colours: the keystone and its wings in 3D (gold keystone with the logo's
   gold gradient, navy lacquer wings, navy keyhole, navy rule), the rest of the logo (KEYSTONE, Financial
   Experts, the DLC badge, the licence line) flat underneath, drawn from the original SVG.
   Plays on a clock, about 3 seconds:
     p 0   -.2   the emblem arrives from the depth and turns to face you, the lettering fades up
     p .2  -.48  a gold key flies in on an arc and slides into the keyhole
     p .48 -.58  the key turns
     p .58 -.7   the wings swing open, light comes through the keyhole, the key melts into it
     p .7  -1    the camera pushes through the keyhole; the loading screen fades into the hero
   The page's inline loader script owns the fallbacks (no WebGL, reduced motion, slow load). */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const box = document.getElementById('loader'), cv = box && box.querySelector('canvas');
let renderer = null;
if (cv && window.__loaderOn && !box.classList.contains('flat')) try { renderer = new THREE.WebGLRenderer({canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance'}); } catch (e) { renderer = null; }
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .75; // no HDRI download: the loader must start at once
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0d2240, .6));
  const keyL = new THREE.DirectionalLight(0xfff1dc, 2.8); keyL.position.set(-3, 4, 6); scene.add(keyL);
  const rim = new THREE.DirectionalLight(0x9dbcff, 1.6); rim.position.set(4, 2, -3); scene.add(rim);
  const warm = new THREE.PointLight(0xffd79a, 0, 12, 1.6); warm.position.set(0, .2, -.9); scene.add(warm);

  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // the logo's own gold gradient (its #gold-keystone stops), as base colour and a soft glow, so the flat face always reads gold
  const gradTex = canvasTex(512, 4, (x) => { const g = x.createLinearGradient(0, 0, 512, 0);
    [[0, '#E9C04B'], [.12, '#FAE487'], [.25, '#FFF4BD'], [.4, '#EDD77C'], [.6, '#BC9132'], [.76, '#D8B14C'], [.92, '#F4E49D'], [1, '#FFF9D7']].forEach(([o, c]) => g.addColorStop(o, c));
    x.fillStyle = g; x.fillRect(0, 0, 512, 4); });
  gradTex.wrapS = gradTex.wrapT = THREE.ClampToEdgeWrapping; gradTex.repeat.set(1 / 1.7, 1); gradTex.offset.set(.5, 0);
  const gold = new THREE.MeshPhysicalMaterial({color: 0xffffff, map: gradTex, metalness: .8, roughness: .24, clearcoat: .7, clearcoatRoughness: .12, emissive: 0xffffff, emissiveMap: gradTex, emissiveIntensity: .42});
  const goldKey = new THREE.MeshPhysicalMaterial({color: 0xf0d27a, metalness: 1, roughness: .1, clearcoat: 1, transparent: true, emissive: 0x8a6a20, emissiveIntensity: .35});
  const navy = new THREE.MeshPhysicalMaterial({color: 0x024282, roughness: .3, clearcoat: 1, clearcoatRoughness: .08}); // the logo's navy #024282
  const navyFlat = new THREE.MeshBasicMaterial({color: 0x034185, transparent: true});                               // keyhole #034185

  // logo units: 70 per scene unit, centred on the keystone (x 307.9, y 120.25), y up
  const U = 70, CX = 307.9, CY = 120.25, P = (x, y) => new THREE.Vector2((x - CX) / U, (CY - y) / U);
  const shape = pts => { const s = new THREE.Shape(); s.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => s.lineTo(p.x, p.y)); s.closePath(); return s; };
  const ks = shape([P(249.4, 41.2), P(366.4, 41.2), P(335.8, 199.3), P(278.1, 199.3)]);
  const hc = P(307.5, 106.5), hr = .2, sb = P(0, 148.3).y, sw = .145, st = .085, sy = hc.y - Math.sqrt(hr * hr - st * st);
  const hole = new THREE.Path(); hole.moveTo(hc.x - sw, sb); hole.lineTo(hc.x - st, sy);
  hole.absarc(hc.x, hc.y, hr, Math.atan2(sy - hc.y, -st), Math.atan2(sy - hc.y, st), true);
  hole.lineTo(hc.x + sw, sb); hole.closePath(); ks.holes.push(hole);
  const D = .34, FRONT = D / 2 + .045;
  const emblem = new THREE.Group(); scene.add(emblem);
  const ksG = new THREE.ExtrudeGeometry(ks, {depth: D, bevelEnabled: true, bevelThickness: .045, bevelSize: .03, bevelSegments: 6, curveSegments: 48}); ksG.translate(0, 0, -D / 2);
  emblem.add(new THREE.Mesh(ksG, gold));
  // navy behind the keyhole, as in the logo, until the light replaces it
  const plug = new THREE.Mesh(new THREE.PlaneGeometry(.5, .9), navyFlat); plug.position.set(hc.x, (hc.y + sb) / 2, -D / 2 - .06); emblem.add(plug);

  function wing(pts, hingeX) {
    const g = new THREE.ExtrudeGeometry(shape(pts), {depth: .16, bevelEnabled: true, bevelThickness: .02, bevelSize: .015, bevelSegments: 3});
    g.translate(-hingeX, 0, -.08);
    const hinge = new THREE.Group(); hinge.position.set(hingeX, 0, -.14); hinge.add(new THREE.Mesh(g, navy)); emblem.add(hinge); return hinge;
  }
  const L = [P(194.6, 92.6), P(249.7, 67.7), P(276, 201.2), P(232.2, 201.2)], R = [P(366.5, 67.8), P(421.2, 92.9), P(383.2, 201.2), P(339.5, 201.2)];
  const wl = wing(L, L[0].x), wr = wing(R, R[1].x);
  // the logo's navy rule (x 62.3-549.8, y 199.5-206.9)
  const rule = new THREE.Mesh(new THREE.BoxGeometry(487.5 / U, 7.4 / U, .08), navy); rule.position.set(P(306.05, 0).x, P(0, 203.2).y, 0); emblem.add(rule);

  // the rest of the logo, flat, cut from the original SVG below the rule (viewBox y 207-512; the SVG's content is shifted 34 left)
  const lockM = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false, toneMapped: false});
  const lock = new THREE.Mesh(new THREE.PlaneGeometry(532 / U, 305 / U), lockM); lock.position.set(P(266 + 34, 0).x, P(0, 207 + 305 / 2).y, .02); emblem.add(lock);

  const halo = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,246,222,1)'); g.addColorStop(.18, 'rgba(255,232,178,.95)'); g.addColorStop(.45, 'rgba(232,196,110,.45)'); g.addColorStop(1, 'rgba(211,182,90,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const glowM = new THREE.MeshBasicMaterial({map: halo, transparent: true, opacity: 0, toneMapped: false, depthWrite: false});
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), glowM); glow.position.set(0, hc.y * .5, -.9); emblem.add(glow);

  const key = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.2, .055, 32, 72), goldKey); bow.rotation.y = Math.PI / 2; bow.position.z = 1.08; key.add(bow);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .09, 32), goldKey); col.rotation.x = Math.PI / 2; col.position.z = .84; key.add(col);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .8, 24), goldKey); shaft.rotation.x = Math.PI / 2; shaft.position.z = .4; key.add(shaft);
  [[.1, .09], [.22, .06], [.34, .1]].forEach(([z, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.04, h, .07), goldKey); b.position.set(0, -.034 - h / 2, z); key.add(b); });
  scene.add(key);
  const KY = hc.y - .06;

  // the whole lockup: x 62-550 (rule) and y 41-500 in logo units
  const LOCK_W = 488 / U, LOCK_H = 460 / U, LOCK_Y = P(0, 270).y;
  const cam = new THREE.PerspectiveCamera(30, 1, .05, 80);
  let dist = 20, p = 0;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out = t => 1 - Math.pow(1 - t, 3);
  const seg = (a, b) => Math.max(0, Math.min(1, (p - a) / (b - a))), lerp = (a, b, t) => a + (b - a) * t;
  function size() {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(15));
    dist = Math.max(LOCK_H / (.56 * 2 * t), LOCK_W / (.84 * 2 * t * cam.aspect)); // lockup about 56% of the height, never over 84% of the width
    cam.updateProjectionMatrix(); draw();
  }
  function draw() {
    const a = out(seg(0, .2));
    const sway = Math.sin(seg(.2, .7) * Math.PI) * .12;
    emblem.position.set(0, lerp(-.5, 0, a), lerp(-9, 0, a)); emblem.rotation.set(lerp(.3, 0, a), lerp(-1, 0, a) + sway, 0);
    lockM.opacity = ease(seg(.12, .3)) * (1 - ease(seg(.7, .8)));
    const fe = ease(seg(.2, .42)), ins = ease(seg(.42, .48)), turn = ease(seg(.48, .58)), gone = ease(seg(.6, .7));
    goldKey.opacity = 1 - gone; key.visible = p > .18 && gone < 1;
    key.position.set(lerp(3.4, 0, fe), lerp(2.6, KY, fe) + Math.sin(fe * Math.PI) * .9, lerp(4.2, FRONT + 1.5, fe) - ins * 1.5 - gone * .45);
    key.rotation.set(lerp(1.2, 0, fe), lerp(2.2, 0, fe), lerp(.8, 0, fe) - turn * Math.PI / 2);
    const u = ease(seg(.58, .7));
    wl.rotation.y = u * .95; wr.rotation.y = -u * .95;
    glowM.opacity = u; warm.intensity = u * 14; navyFlat.opacity = 1 - u;
    // camera: framed on the whole lockup, then through the keyhole
    const k = ease(seg(.7, 1)), ty = lerp(LOCK_Y, hc.y, k);
    cam.position.set(0, ty, lerp(dist, FRONT + .12, k)); cam.lookAt(0, ty, 0);
    renderer.render(scene, cam);
  }
  new ResizeObserver(size).observe(cv);
  size();

  // start once the lettering is ready (a local file, near instant)
  const img = new Image();
  img.onload = img.onerror = () => {
    if (img.naturalWidth) { const t = canvasTex(2128, 1220, (x, w, h) => x.drawImage(img, 0, 207, 532, 305, 0, 0, w, h)); lockM.map = t; lockM.needsUpdate = true; }
    if (!window.__loaderOn || box.classList.contains('flat')) return;
    window.__ksStarted = true;
    const hold = /[?&]ldp=([\d.]+)/.exec(location.search); if (hold) { p = +hold[1]; draw(); return; } // QA: ?ldp=0.4 freezes the loader at that moment
    const pr = {p: 0}, gsap = window.gsap;
    const tick = () => { p = pr.p; draw(); };
    if (gsap) gsap.to(pr, {p: 1, duration: 3.1, ease: 'none', onUpdate: tick, onComplete: window.__loaderDone});
    else { const t0 = performance.now(); (function f(now) { pr.p = Math.min(1, (now - t0) / 3100); tick(); if (pr.p < 1) requestAnimationFrame(f); else window.__loaderDone(); })(t0); }
    setTimeout(() => { if (window.__loaderOn) box.classList.add('done'); }, 2700); // start the fade while the camera is still inside the light
  };
  img.src = 'img/keystone-logo.svg';
}
