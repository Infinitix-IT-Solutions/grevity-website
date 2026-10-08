/* =========================================================
   Grevity — 3D pendrive
   ---------------------------------------------------------
   A real WebGL model of the drive, one per [data-pd] stage:
   a bevelled silver body with a ring hole, a hollow USB-A plug
   with its black tongue and gold contacts, and GREVITY engraved
   on the top face. Built from code — no model file to download.

     · it turns on a slow turntable (360°); drag to spin it by hand
     · arrow keys (pointer over the stage, or focused) move it;
       it leans into its direction of travel
     · Esc / Home / 0 send it back

   Progressive enhancement: each stage already holds the flat
   cut-out photo. It is only hidden once the first 3D frame is on
   screen, so a blocked CDN, no WebGL or Save-Data all just keep
   the photo.
   ========================================================= */

const SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const stages = Array.prototype.slice.call(document.querySelectorAll('[data-pd]'));

if (stages.length && !saveData && webglOK()) boot();

async function boot() {
  let THREE;
  try {
    THREE = await import(/* @vite-ignore */ SRC);
  } catch (e) {
    if (window.console) console.info('Grevity: 3D layer skipped —', e && e.message);
    return;
  }
  stages.forEach(function (host) {
    try { mount(THREE, host); }
    catch (e) { if (window.console) console.info('Grevity: 3D stage skipped —', e && e.message); }
  });
}

/* =========================================================
   Geometry
   ========================================================= */

/* ExtrudeGeometry is non-indexed, so computeVertexNormals() would shade every
   triangle flat and the curved sides would look faceted. This averages normals
   only between faces that meet at a shallow angle: curves come out smooth, real
   edges stay crisp. */
function crease(THREE, geo, maxDeg) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position, n = p.count, tris = n / 3;
  const fn = new Float32Array(tris * 3);           // area-weighted face normals
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), f = new THREE.Vector3();
  const key = function (i) {
    return Math.round(p.getX(i) * 2000) + '_' + Math.round(p.getY(i) * 2000) + '_' + Math.round(p.getZ(i) * 2000);
  };
  const at = new Map();
  for (let t = 0; t < tris; t++) {
    a.fromBufferAttribute(p, t * 3); b.fromBufferAttribute(p, t * 3 + 1); c.fromBufferAttribute(p, t * 3 + 2);
    f.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
    fn[t * 3] = f.x; fn[t * 3 + 1] = f.y; fn[t * 3 + 2] = f.z;
    for (let k = 0; k < 3; k++) {
      const kk = key(t * 3 + k);
      if (!at.has(kk)) at.set(kk, []);
      at.get(kk).push(t);
    }
  }
  const cos = Math.cos(maxDeg * Math.PI / 180);
  const out = new Float32Array(n * 3);
  const u = new THREE.Vector3(), w = new THREE.Vector3(), sum = new THREE.Vector3();
  for (let t = 0; t < tris; t++) {
    u.set(fn[t * 3], fn[t * 3 + 1], fn[t * 3 + 2]);
    const ul = u.length();
    if (ul < 1e-12) { u.set(0, 0, 1); } else { u.divideScalar(ul); }
    for (let k = 0; k < 3; k++) {
      sum.set(0, 0, 0);
      const list = at.get(key(t * 3 + k));
      for (let j = 0; j < list.length; j++) {
        const s = list[j];
        w.set(fn[s * 3], fn[s * 3 + 1], fn[s * 3 + 2]);
        const wl = w.length();
        if (wl < 1e-12) continue;
        if (u.dot(w) / wl >= cos) sum.add(w);
      }
      if (sum.lengthSq() < 1e-12) sum.copy(u);
      sum.normalize();
      const o = (t * 3 + k) * 3;
      out[o] = sum.x; out[o + 1] = sum.y; out[o + 2] = sum.z;
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return g;
}

function roundedRect(THREE, shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

/* The Grevity logo printed directly on the metal top face in its own colours.
   The canvas stays transparent around the logo so only the ink shows. */
const LOGO_SRC = '/assets/img/grevity-logo-compact.svg';
function labelTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 540;
  const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  const img = new Image();
  img.onload = function () {
    const sr = img.width / img.height, cr = c.width / c.height;
    let dw, dh;
    if (sr > cr) { dw = c.width * 0.95;  dh = dw / sr; }
    else         { dh = c.height * 0.95; dw = dh * sr; }
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    t.needsUpdate = true;
  };
  img.src = LOGO_SRC;
  return t;
}

function shadowTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(0.5, 'rgba(0,0,0,.2)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* A small photo studio painted into a texture: a bright softbox overhead, two
   long strip lights and a dark floor. Through PMREM it gives the metal real
   reflections, so the bevels catch highlights as the drive turns. */
function envTexture(THREE, renderer) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.38, '#d6dbe6');
  g.addColorStop(0.5, '#b4b9c4'); g.addColorStop(0.62, '#868b97'); g.addColorStop(1, '#40444f');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  x.fillStyle = 'rgba(255,255,255,1)';
  x.fillRect(120, 70, 260, 70);           // softbox
  x.fillRect(620, 90, 90, 150);           // strip light, tall
  x.fillRect(820, 110, 150, 40);          // strip light, wide
  x.fillStyle = 'rgba(150,158,255,.22)';  // faint brand-coloured bounce off the floor
  x.fillRect(0, 380, 1024, 70);
  x.fillStyle = 'rgba(255,255,255,.55)';   // low fill cards, so the side walls read as silver, not slate
  x.fillRect(0, 300, 200, 120); x.fillRect(430, 300, 220, 120); x.fillRect(800, 300, 224, 120);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}

/* Dimensions in mm-ish units. x runs along the drive, y across, z is thickness. */
const W = 12.4, T = 4.6, LP = 12, LB = 28.5, BEV = 0.5;

function buildDrive(THREE) {
  const metal = new THREE.MeshStandardMaterial({ color: 0xd2d0cc, metalness: 1, roughness: 0.3, envMapIntensity: 1.25 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x0b0c10, metalness: 0.1, roughness: 0.55 });
  const gold  = new THREE.MeshStandardMaterial({ color: 0xd9b04a, metalness: 1, roughness: 0.28, envMapIntensity: 1.2 });

  const root = new THREE.Group();

  /* Body: flat bar, rounded loop at the far end, ring hole through it.
     The bevel grows the outline outward, so the outline is drawn inset by it. */
  const r = W / 2;
  const iw = W - BEV * 2, ir = r - BEV;
  const x0 = 0.5 + BEV, x1 = LB - BEV;
  const hr = W * 0.34;
  const s = new THREE.Shape();
  s.moveTo(x0, -iw / 2);
  s.lineTo(x1 - ir, -iw / 2);
  s.absarc(x1 - ir, 0, ir, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(x0, iw / 2);
  s.lineTo(x0, -iw / 2);
  const hole = new THREE.Path();
  hole.absarc(x1 - ir, 0, hr + BEV, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const bodyGeo = crease(THREE, new THREE.ExtrudeGeometry(s, {
    depth: T - BEV * 2, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV,
    bevelSegments: 6, curveSegments: 64
  }), 18);
  bodyGeo.translate(0, 0, -(T - BEV * 2) / 2);
  const body = new THREE.Mesh(bodyGeo, metal);
  root.add(body);

  /* USB-A plug: an open metal tube, black tongue and gold contacts inside. */
  const t = new THREE.Shape();
  roundedRect(THREE, t, -T / 2, -W / 2, T, W, 0.7);
  const wall = 0.42;
  const th = new THREE.Path();
  roundedRect(THREE, th, -T / 2 + wall, -W / 2 + wall, T - wall * 2, W - wall * 2, 0.4);
  t.holes.push(th);
  const tubeGeo = crease(THREE, new THREE.ExtrudeGeometry(t, { depth: LP, bevelEnabled: false, curveSegments: 12 }), 30);
  tubeGeo.rotateY(Math.PI / 2);            // extrusion axis -> +x, shape x -> -z
  tubeGeo.translate(-LP + 1.6, 0, 0);       // spans x = -LP+1.6 .. 1.6, tucked into the body
  root.add(new THREE.Mesh(tubeGeo, metal));

  const fill = new THREE.Mesh(new THREE.BoxGeometry(3.2, W - wall * 2 - 0.05, T - wall * 2 - 0.05), dark);
  fill.position.set(-0.5, 0, 0);            // plugs the cavity so there is no see-through
  root.add(fill);

  const tongueLen = LP - 4.4;
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(tongueLen, W - 2.4, 1.5), dark);
  tongue.position.set(-2 - tongueLen / 2, 0, -0.25);
  root.add(tongue);
  for (let i = 0; i < 4; i++) {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(tongueLen - 1.4, 1.1, 0.12), gold);
    pin.position.set(-2 - tongueLen / 2 - 0.4, -3.15 + i * 2.1, -0.25 + 0.75 + 0.05);
    root.add(pin);
  }

  /* Grevity logo printed directly on the metal. The map's own alpha channel
     (transparent canvas around the SVG) handles cut-out — no alphaMap, which
     would wrongly dim dark colours by reading their green channel. */
  const logo = labelTexture(THREE);
  logo.colorSpace = THREE.SRGBColorSpace;
  const lw = 16, lh = 4.2;
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(lw, lh),
    new THREE.MeshBasicMaterial({
      map: logo,
      transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
    })
  );
  mark.position.set(8.4, 0, T / 2 + 0.08);
  mark.renderOrder = 2;
  root.add(mark);

  // Lay it flat (thickness -> up) and centre it on its own length.
  root.rotation.x = -Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(root);
  root.position.x = -(LB + (-LP + 1.6)) / 2;
  return holder;
}

/* =========================================================
   Stage
   ========================================================= */
function mount(THREE, host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pd-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = envTexture(THREE, renderer);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-30, 50, 40);
  scene.add(key);

  const FOV = 26;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 400);

  /* position -> pitch -> spin -> drive. Separate nodes so lean, tilt and turn
     never fight each other. */
  const posG = new THREE.Group();
  const pitchG = new THREE.Group();
  const spinG = new THREE.Group();
  const drive = buildDrive(THREE);
  scene.add(posG); posG.add(pitchG); pitchG.add(spinG); spinG.add(drive);

  const floor = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false, opacity: 0.5 })
  );
  shadow.rotation.x = -Math.PI / 2;
  floor.add(shadow);
  scene.add(floor);

  /* ---- state ---- */
  const BASE_PITCH = 0.2, BASE_YAW = 0.62;            // resting pose, near the product photo
  const AUTO = 0.0085;                                  // rad per 60fps frame (~29°/s)
  const st = { x: 0, y: 0, vx: 0, vy: 0, yaw: BASE_YAW, sv: 0, pitch: BASE_PITCH, tx: null, ty: null, tyaw: null, tpitch: null };
  const dir = { l: 0, r: 0, u: 0, d: 0 };
  let auto = !reduced, dragging = false, hovered = false, focused = false, visible = true;
  let raf = 0, last = 0, view = { w: 1, h: 1, vw: 40, vh: 30 };


  const clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  const ease = function (rate, dt) { return 1 - Math.pow(1 - rate, dt); };

  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Sit far enough back that the drive's full length clears the frame while it
    // turns, with a little room either side for it to be moved around.
    const tan = Math.tan(FOV * Math.PI / 360);
    const dist = Math.max(24 / (tan * camera.aspect), 27 / tan) * 1.1;
    camera.position.set(0, dist * 0.34, dist * 0.94);
    camera.lookAt(0, -0.5, 0);
    camera.updateProjectionMatrix();
    view = { w: w, h: h, vw: 2 * tan * dist * camera.aspect, vh: 2 * tan * dist };
    floor.position.y = -9;
    render();
  }

  function render() {
    const lim = { x: view.vw * 0.17, y: view.vh * 0.17 };
    posG.position.set(st.x * lim.x, -st.y * lim.y, 0);
    posG.rotation.z = clamp(-st.vx * 0.5, -0.4, 0.4);          // bank into the turn
    pitchG.rotation.x = st.pitch + clamp(st.vy * 0.4, -0.35, 0.35);
    spinG.rotation.y = st.yaw;
    // contact shadow: stays on the floor, lightens and shrinks as the drive rises
    const h = clamp(st.y, -1, 1);
    floor.position.x = posG.position.x;
    shadow.scale.set(46 * (1 - h * 0.12), 17 * (1 - h * 0.12), 1);
    shadow.rotation.z = st.yaw;
    shadow.material.opacity = 0.5 + h * 0.18;
    renderer.render(scene, camera);
  }

  let live = false;
  function step(now) {
    raf = 0;
    if (!visible) { last = 0; return; }
    const dt = Math.min(48, now - (last || now)) / 16.667;
    last = now;

    // position is stored in -1..1 of the allowed range
    const topSpeed = 0.022;
    st.vx += ((dir.r - dir.l) * topSpeed - st.vx) * ease(0.12, dt);
    st.vy += ((dir.d - dir.u) * topSpeed - st.vy) * ease(0.12, dt);
    st.x = clamp(st.x + st.vx * dt, -1, 1);
    st.y = clamp(st.y + st.vy * dt, -1, 1);
    if ((st.x === 1 && st.vx > 0) || (st.x === -1 && st.vx < 0)) st.vx = 0;
    if ((st.y === 1 && st.vy > 0) || (st.y === -1 && st.vy < 0)) st.vy = 0;
    if (st.tx !== null) {                                       // gliding home
      st.x += (st.tx - st.x) * ease(0.1, dt); st.y += (st.ty - st.y) * ease(0.1, dt);
      if (Math.abs(st.x - st.tx) + Math.abs(st.y - st.ty) < 0.002) { st.x = st.tx; st.y = st.ty; st.tx = st.ty = null; }
    }

    // turntable
    const autoV = (auto && !dragging) ? AUTO : 0;
    if (dragging) {
      st.sv *= Math.pow(0.8, dt);
    } else {
      st.sv += (autoV - st.sv) * ease(0.05, dt);
      st.yaw += st.sv * dt;
    }
    if (st.tyaw !== null) {                                     // swing back to the resting pose
      st.sv = 0;
      st.yaw += (st.tyaw - st.yaw) * ease(0.09, dt);
      if (Math.abs(st.tyaw - st.yaw) < 0.002) { st.yaw = st.tyaw; st.tyaw = null; }
    }
    if (st.tpitch !== null) {
      st.pitch += (st.tpitch - st.pitch) * ease(0.09, dt);
      if (Math.abs(st.tpitch - st.pitch) < 0.002) { st.pitch = st.tpitch; st.tpitch = null; }
    }

    render();
    if (!live) { live = true; host.classList.add('is-live'); }

    const busy = Math.abs(st.vx) + Math.abs(st.vy) > 0.0004 || dir.l || dir.r || dir.u || dir.d ||
                 dragging || st.tx !== null || st.tyaw !== null || st.tpitch !== null || autoV > 0 || Math.abs(st.sv) > 0.0003 ||
                 Math.abs(posG.rotation.z) > 0.003;
    if (busy) raf = requestAnimationFrame(step); else last = 0;
  }
  function wake() { if (!raf && visible) raf = requestAnimationFrame(step); }

  function press(d, on) {
    if (d === 'reset') {
      if (!on) return;
      st.vx = st.vy = 0; dir.l = dir.r = dir.u = dir.d = 0;
      st.tx = 0; st.ty = 0;
      st.tpitch = BASE_PITCH;
      // Auto-spin keeps turning; otherwise swing back to the resting pose by the shortest way round.
      st.tyaw = auto ? null : BASE_YAW + Math.round((st.yaw - BASE_YAW) / (Math.PI * 2)) * Math.PI * 2;
      wake(); return;
    }
    st.tx = st.ty = null;
    dir[d] = on ? 1 : 0;
    if (on) host.classList.add('is-used');
    wake();
  }

  /* ---- input ---- */
  const KEYS = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd' };
  document.addEventListener('keydown', function (e) {
    if (!(hovered || focused) || e.altKey || e.ctrlKey || e.metaKey) return;
    const d = KEYS[e.key];
    if (d) { e.preventDefault(); press(d, true); }
    else if (e.key === 'Escape' || e.key === 'Home' || e.key === '0') { press('reset', true); }
  });
  document.addEventListener('keyup', function (e) { const d = KEYS[e.key]; if (d) press(d, false); });
  window.addEventListener('blur', function () { dir.l = dir.r = dir.u = dir.d = 0; });
  host.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovered = true; });
  host.addEventListener('pointerleave', function () { hovered = false; });
  host.addEventListener('focus', function () { focused = true; });
  host.addEventListener('blur', function () { focused = false; dir.l = dir.r = dir.u = dir.d = 0; });


  /* drag: sideways spins the drive (and carries on when released), up/down tips it */
  let from = null;
  canvas.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    dragging = true; st.tyaw = st.tpitch = null;
    from = { x: e.clientX, y: e.clientY, t: performance.now() };
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    host.classList.add('is-used', 'is-dragging');
    wake();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(1, now - from.t) / 16.667;
    const dx = e.clientX - from.x, dy = e.clientY - from.y;
    st.yaw += dx * 0.011;
    st.sv = clamp(dx * 0.011 / dt, -0.35, 0.35);
    st.pitch = clamp(st.pitch + dy * 0.008, -0.55, 1.15);
    from.x = e.clientX; from.y = e.clientY; from.t = now;
    wake();
  });
  function drop() {
    if (!dragging) return;
    dragging = false; host.classList.remove('is-dragging');
    wake();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { canvas.addEventListener(ev, drop); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake();
    }).observe(host);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  resize();
  wake();
}
