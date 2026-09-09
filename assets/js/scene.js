/* =========================================================
   Grevity — 3D pendrive stages
   ---------------------------------------------------------
   Two WebGL scenes, both of the same object: the licensed
   Grevity pendrive.

     data-stage="hero"     slow float + drag to spin
     data-stage="anatomy"  explodes into cap / body / connector
                           as the section scrolls past, with
                           HTML hotspots projected onto it

   The drive is built procedurally — no model files, no
   textures to download, no HDR environment. Everything
   (including the reflections) is generated in a few hundred
   lines here, which keeps the whole 3D layer at the cost of
   three.js itself and nothing more.

   This module is progressive enhancement, top to bottom.
   Every stage already contains a working CSS-3D pendrive;
   if any guard below trips, that is what the visitor keeps.
   ========================================================= */

const SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;

/* ---------- guards ---------- */
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const stages = Array.prototype.slice.call(document.querySelectorAll('[data-stage]'));

// Motion is the entire point of these scenes. If the visitor has asked for
// less of it, a spinning drive is the wrong answer — the CSS fallback holds
// still and says the same thing.
if (stages.length && !reduced && !saveData && webglOK()) {
  boot();
}

async function boot() {
  let THREE;
  try {
    THREE = await import(/* @vite-ignore */ SRC);
  } catch (e) {
    // Blocked CDN, offline visitor, corporate proxy — all end up here, and
    // all of them keep the CSS drive. Never surface this to the visitor.
    if (window.console) console.info('Grevity: 3D layer skipped —', e && e.message);
    return;
  }
  stages.forEach(function (host) { mount(THREE, host); });
}

/* =========================================================
   Geometry helpers
   ========================================================= */

/* A rounded slab. ExtrudeGeometry's bevel grows the outline outward, so the
   shape is drawn inset by the bevel and the finished box lands on exactly
   the w/h/d asked for. */
function slab(THREE, w, h, d, r, bevel) {
  bevel = bevel === undefined ? Math.min(0.02, d * 0.25) : bevel;
  const iw = w - bevel * 2, ih = h - bevel * 2, ir = Math.max(0.001, r - bevel);
  const x = -iw / 2, y = -ih / 2;

  const s = new THREE.Shape();
  s.moveTo(x + ir, y);
  s.lineTo(x + iw - ir, y);
  s.quadraticCurveTo(x + iw, y, x + iw, y + ir);
  s.lineTo(x + iw, y + ih - ir);
  s.quadraticCurveTo(x + iw, y + ih, x + iw - ir, y + ih);
  s.lineTo(x + ir, y + ih);
  s.quadraticCurveTo(x, y + ih, x, y + ih - ir);
  s.lineTo(x, y + ir);
  s.quadraticCurveTo(x, y, x + ir, y);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, d - bevel * 2),
    bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 10
  });
  g.center();
  return g;
}

/* The wordmark, drawn to a canvas and laid on the drive's top face as a
   decal. Cheaper and sharper than extruded text, and it re-renders on a
   theme change without touching geometry. */
function labelTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const x = c.getContext('2d');

  x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = '#ffffff';
  x.font = '700 108px Inter, system-ui, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.letterSpacing = '26px';
  x.fillText('GREVITY', c.width / 2 + 13, 104);

  x.font = '600 44px Inter, system-ui, sans-serif';
  x.letterSpacing = '10px';
  x.globalAlpha = 0.62;
  x.fillText('OFFLINE EDITION', c.width / 2 + 5, 186);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* A soft contact shadow — a radial gradient on a plane under the drive.
   Cheaper than a shadow map and it never shimmers while the object spins. */
function shadowTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,.42)');
  g.addColorStop(0.45, 'rgba(0,0,0,.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* A studio in a gradient: bright ceiling, two soft strip lights, dark floor.
   Run through PMREM it gives the metal parts believable roll-off without
   shipping a single HDR byte. */
function envTexture(THREE, renderer, dark) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const x = c.getContext('2d');

  const g = x.createLinearGradient(0, 0, 0, 256);
  if (dark) {
    g.addColorStop(0, '#3d4661'); g.addColorStop(0.45, '#171d2e');
    g.addColorStop(0.55, '#0d1120'); g.addColorStop(1, '#05070d');
  } else {
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#dfe5f2');
    g.addColorStop(0.55, '#b9c2d6'); g.addColorStop(1, '#7c869c');
  }
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 256);

  // two strip lights, so edges catch a highlight as the drive turns
  x.fillStyle = dark ? 'rgba(150,170,255,.5)' : 'rgba(255,255,255,.95)';
  x.fillRect(40, 26, 150, 34);
  x.fillRect(300, 40, 120, 26);
  // a hint of the brand bouncing off the floor
  x.fillStyle = dark ? 'rgba(99,102,241,.34)' : 'rgba(99,102,241,.2)';
  x.fillRect(0, 200, 512, 56);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/* =========================================================
   The drive itself
   ========================================================= */
function buildDrive(THREE, dark) {
  const root = new THREE.Group();

  // Three parts, because the anatomy stage pulls them apart.
  const cap = new THREE.Group();
  const body = new THREE.Group();
  const plug = new THREE.Group();
  root.add(cap, body, plug);

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: dark ? 0x232c45 : 0x1c2438,
    metalness: 0.42, roughness: 0.34,
    clearcoat: 0.85, clearcoatRoughness: 0.22
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd7dcea, metalness: 1, roughness: 0.24
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f1a, metalness: 0.2, roughness: 0.7
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441, metalness: 1, roughness: 0.3
  });

  /* --- body: the slab that carries the wordmark --- */
  const BODY_W = 2.5, BODY_H = 1.02, BODY_D = 0.42;
  const bodyMesh = new THREE.Mesh(slab(THREE, BODY_W, BODY_H, BODY_D, 0.2, 0.035), shellMat);
  body.add(bodyMesh);

  // brushed collar where the body meets the connector
  const collar = new THREE.Mesh(slab(THREE, 0.22, BODY_H * 0.96, BODY_D * 1.02, 0.16, 0.03), steelMat);
  collar.position.x = BODY_W / 2 - 0.02;
  body.add(collar);

  // wordmark decals, one per flat face
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTexture(THREE), transparent: true, opacity: 0.9, depthWrite: false
  });
  const labelGeo = new THREE.PlaneGeometry(1.5, 0.375);
  const labelFront = new THREE.Mesh(labelGeo, labelMat);
  labelFront.position.set(-0.22, 0, BODY_D / 2 + 0.004);
  const labelBack = labelFront.clone();
  labelBack.position.z = -(BODY_D / 2 + 0.004);
  labelBack.rotation.y = Math.PI;
  body.add(labelFront, labelBack);

  // activity LED — the "it is running" tell
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2.4, roughness: 0.35
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), ledMat);
  led.position.set(-BODY_W / 2 + 0.26, -0.3, BODY_D / 2 - 0.02);
  body.add(led);
  const ledGlow = new THREE.PointLight(0x10b981, 1.4, 1.6);
  ledGlow.position.copy(led.position);
  body.add(ledGlow);

  // lanyard loop
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 10, 24), steelMat);
  loop.position.set(-BODY_W / 2 - 0.06, 0.3, 0);
  loop.rotation.y = Math.PI / 2;
  body.add(loop);

  /* --- plug: the USB-A connector --- */
  const PLUG_W = 0.92, PLUG_H = 0.6, PLUG_D = 0.2;
  const shell = new THREE.Mesh(slab(THREE, PLUG_W, PLUG_H, PLUG_D, 0.03, 0.015), steelMat);
  plug.add(shell);

  // the plastic tongue with its four contacts, set into the shell
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(PLUG_W * 0.82, PLUG_H * 0.42, PLUG_D * 0.42), darkMat);
  tongue.position.set(0.03, -0.06, 0);
  plug.add(tongue);
  for (let i = 0; i < 4; i++) {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(PLUG_W * 0.56, 0.035, 0.04), goldMat);
    pin.position.set(0.08, -0.02, (i - 1.5) * 0.05);
    plug.add(pin);
  }
  plug.position.x = BODY_W / 2 + PLUG_W / 2 - 0.02;

  /* --- cap --- */
  const cw = 0.72;
  const capMesh = new THREE.Mesh(
    slab(THREE, cw, BODY_H * 1.1, BODY_D * 1.18, 0.22, 0.035),
    new THREE.MeshPhysicalMaterial({
      color: dark ? 0x596484 : 0x8e98b4,
      metalness: 0.85, roughness: 0.28, clearcoat: 1
    })
  );
  cap.add(capMesh);
  const capBand = new THREE.Mesh(slab(THREE, 0.09, BODY_H * 1.12, BODY_D * 1.2, 0.2, 0.02), steelMat);
  capBand.position.x = -cw / 2 + 0.1;
  cap.add(capBand);
  // the cap's home is over the connector
  cap.position.x = BODY_W / 2 + PLUG_W / 2 - 0.02;

  // The drive is modelled from the body's centre, but the cap and connector
  // both sit on the right, so the assembled object's visual centre is offset.
  // Shifting it back means the spin axis runs through the middle of what you
  // actually see, instead of swinging one end out of frame.
  const leftEdge  = -BODY_W / 2 - 0.23;                        // lanyard loop
  const rightEdge = cap.position.x + cw / 2;                   // tip of the cap
  root.position.x = -(leftEdge + rightEdge) / 2;

  root.userData = {
    parts: { cap: cap, body: body, plug: plug },
    // Where each hotspot label points, in the drive's own space. They sit
    // clear of the object on purpose — a pill laid over the drive hides the
    // very thing it is labelling.
    anchors: {
      loop:  new THREE.Vector3(-BODY_W / 2 - 0.3,  1.15, 0),   // top left
      body:  new THREE.Vector3(0.35,               1.15, 0),   // top right
      led:   new THREE.Vector3(-BODY_W / 2 - 0.1, -1.15, 0),   // bottom left
      usb:   new THREE.Vector3(BODY_W / 2 + 0.5,  -1.15, 0)    // bottom right
    },
    materials: { shell: shellMat, cap: capMesh.material },
    home: { cap: cap.position.x, plug: plug.position.x }
  };
  return root;
}

/* =========================================================
   Mount one stage
   ========================================================= */
function mount(THREE, host) {
  const canvas = host.querySelector('.stage__canvas');
  if (!canvas) return;
  const mode = host.getAttribute('data-stage');
  const isDark = function () { return document.documentElement.classList.contains('dark'); };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
  } catch (e) { return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.35, mode === 'anatomy' ? 8.4 : 7.4);

  let env = envTexture(THREE, renderer, isDark());
  scene.environment = env;

  scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x0a0d18, isDark() ? 0.5 : 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3.5, 4.5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8b5cf6, 1.9);
  rim.position.set(-4.5, 1.5, -3.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x06b6d4, 0.9);
  fill.position.set(-2, -3, 3);
  scene.add(fill);

  const pivot = new THREE.Group();          // holds the spin
  const drive = buildDrive(THREE, isDark());
  pivot.add(drive);
  scene.add(pivot);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 3),
    new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false, opacity: 0.75 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.5;
  scene.add(shadow);

  /* ---------- sizing ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // On a narrow column the drive would run off both edges, so pull the
    // camera back rather than shrinking the object with a scale hack.
    const narrow = Math.max(0, 1 - w / 620);
    camera.position.z = (mode === 'anatomy' ? 8.4 : 7.4) + narrow * 3.4;
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);
  resize();

  /* ---------- pointer: drag to spin, move to tilt ---------- */
  const aim = { x: 0, y: 0 };        // where the spin wants to be
  const cur = { x: 0, y: 0 };        // where it is
  let dragging = false, lastX = 0, lastY = 0, spin = 0, idle = 0;

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; idle = 0;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', function (e) {
    if (dragging) {
      aim.x += (e.clientX - lastX) * 0.008;
      aim.y += (e.clientY - lastY) * 0.005;
      aim.y = Math.max(-0.7, Math.min(0.7, aim.y));
      lastX = e.clientX; lastY = e.clientY;
      idle = 0;
      return;
    }
    // gentle parallax when simply passing over
    const r = host.getBoundingClientRect();
    aim.y = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', function () { if (!dragging) aim.y = 0; });
  canvas.style.cursor = 'grab';

  // Keyboard parity — the drive is focusable, so arrows have to turn it.
  canvas.addEventListener('keydown', function (e) {
    const step = 0.35;
    if (e.key === 'ArrowLeft')  { aim.x -= step; idle = 0; e.preventDefault(); }
    if (e.key === 'ArrowRight') { aim.x += step; idle = 0; e.preventDefault(); }
    if (e.key === 'ArrowUp')    { aim.y = Math.max(-0.7, aim.y - 0.2); e.preventDefault(); }
    if (e.key === 'ArrowDown')  { aim.y = Math.min(0.7, aim.y + 0.2); e.preventDefault(); }
  });

  /* ---------- hotspots (anatomy stage) ---------- */
  const hots = Array.prototype.slice.call(host.querySelectorAll('.hot'));
  const proj = new THREE.Vector3();

  function placeHotspots(explode) {
    if (!hots.length) return;
    const w = host.clientWidth, h = host.clientHeight;
    hots.forEach(function (el) {
      const key = el.getAttribute('data-anchor');
      const a = drive.userData.anchors[key];
      if (!a) return;
      proj.copy(a);
      // anchors on the pulled-apart pieces have to travel with them
      if (key === 'usb') proj.x += explode * 0.9;
      drive.localToWorld(proj);
      proj.project(camera);
      const on = explode > 0.35 && proj.z < 1;
      el.classList.toggle('is-on', on);
      if (!on) return;
      el.style.left = ((proj.x * 0.5 + 0.5) * w) + 'px';
      el.style.top = ((-proj.y * 0.5 + 0.5) * h) + 'px';
    });
  }

  /* ---------- scroll progress for the anatomy stage ---------- */
  function progress() {
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // 0 as the stage enters from below, 1 once it has settled in view
    const p = (vh - r.top) / (vh * 0.75 + r.height * 0.5);
    return Math.max(0, Math.min(1, p));
  }

  /* ---------- run loop ---------- */
  let visible = true, running = true, first = true, t0 = performance.now();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && running) loop();
    }, { rootMargin: '120px' }).observe(host);
  }
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running && visible) loop();
  });

  let queued = false;
  function loop() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  function frame(now) {
    queued = false;
    const t = (now - t0) / 1000;

    // idle auto-spin: it resumes a beat after the visitor lets go
    if (!dragging) {
      idle += 1 / 60;
      if (idle > 1.4) spin += 0.0032;
    }

    cur.x += (aim.x + spin - cur.x) * 0.08;
    cur.y += (aim.y - cur.y) * 0.08;

    pivot.rotation.y = cur.x;
    pivot.rotation.x = cur.y;
    pivot.position.y = Math.sin(t * 0.9) * 0.07;          // float
    shadow.material.opacity = 0.75 - Math.sin(t * 0.9) * 0.08;

    let explode = 0;
    if (mode === 'anatomy') {
      explode = progress();
      // ease so the pieces glide apart instead of tracking the scrollbar 1:1
      const e = explode * explode * (3 - 2 * explode);
      const p = drive.userData;
      p.parts.cap.position.x = p.home.cap + e * 1.7;
      p.parts.plug.position.x = p.home.plug + e * 0.9;
      p.parts.cap.rotation.z = e * 0.22;
      // The pieces all travel right, so slide the whole rig left by half of
      // that to keep the assembly centred instead of drifting out of frame.
      pivot.position.x = -e * 0.85;
      pivot.rotation.z = -0.06 + e * 0.06;
    } else {
      pivot.rotation.z = -0.08;
    }

    placeHotspots(mode === 'anatomy' ? explode : 0);
    renderer.render(scene, camera);

    if (first) {
      first = false;
      host.classList.add('is-live');
    }
    if (visible && running) loop();
  }

  window.addEventListener('scroll', function () { if (visible && running) loop(); }, { passive: true });
  loop();

  /* ---------- theme ---------- */
  // main.js fires this whenever the toggle flips. The whole scene is lit for
  // one ground or the other, so both the env map and the shell colour move.
  document.addEventListener('grevity:theme', function (e) {
    const dark = e.detail === 'dark';
    const old = env;
    env = envTexture(THREE, renderer, dark);
    scene.environment = env;
    if (old) old.dispose();
    drive.userData.materials.shell.color.setHex(dark ? 0x232c45 : 0x1c2438);
    drive.userData.materials.cap.color.setHex(dark ? 0x596484 : 0x8e98b4);
    loop();
  });
}
