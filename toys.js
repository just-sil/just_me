// The hero's 3D toy box: a little robot and a handful of bouncy shapes.
// Everything is built from primitives with toon shading and ink outlines,
// so there are no model files to load.
//
// Poke the robot and it jumps, spins and throws confetti. Poke a shape and
// it boings. Shapes also shy away from the pointer.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const C = {
  lime: 0xb7f000,
  coral: 0xff6b4a,
  blue: 0x3d5afe,
  yellow: 0xffd23f,
  pink: 0xff9ed2,
  purple: 0xa68bff,
  mint: 0x4fd1a5,
  cream: 0xfff3dc,
  ink: 0x141414
};
const CONFETTI_COLORS = [C.lime, C.coral, C.blue, C.yellow, C.pink, C.purple, C.mint];

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (cur, target, rate, dt) => lerp(cur, target, 1 - Math.exp(-rate * dt));

/* ── materials ────────────────────────────────────────────── */

// Three flat bands of light: the classic cel-shaded look.
const gradientMap = (() => {
  const tex = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

const toonCache = new Map();
const toon = (color) => {
  if (!toonCache.has(color)) toonCache.set(color, new THREE.MeshToonMaterial({ color, gradientMap }));
  return toonCache.get(color);
};

// Outline by drawing the back faces pushed out along their normals, in ink.
// Works on smooth geometry; faceted shapes use a scaled copy instead.
const outlineCache = new Map();
const outlineMaterial = (width) => {
  if (!outlineCache.has(width)) {
    outlineCache.set(
      width,
      new THREE.ShaderMaterial({
        uniforms: { width: { value: width } },
        vertexShader: /* glsl */ `
          uniform float width;
          void main() {
            vec3 p = position + normal * width;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          void main() { gl_FragColor = vec4(0.078, 0.078, 0.078, 1.0); }`,
        side: THREE.BackSide
      })
    );
  }
  return outlineCache.get(width);
};
const scaledOutline = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide });

function inked(geometry, color, { width = 0.035, scaled = false, basic = false } = {}) {
  const group = new THREE.Group();
  const mat = basic ? new THREE.MeshBasicMaterial({ color }) : toon(color);
  const mesh = new THREE.Mesh(geometry, mat);
  const line = new THREE.Mesh(geometry, scaled ? scaledOutline : outlineMaterial(width));
  if (scaled) line.scale.setScalar(1 + width * 2.2);
  group.add(line, mesh);
  group.userData.mesh = mesh;
  return group;
}

/* ── the robot ────────────────────────────────────────────── */

function buildRobot() {
  const robot = new THREE.Group();
  const rig = new THREE.Group(); // bobs, jumps and squashes
  robot.add(rig);
  const parts = { robot, rig };

  // body
  const body = inked(new RoundedBoxGeometry(1.3, 1.02, 0.98, 5, 0.26), C.coral);
  rig.add(body);

  // belly panel with three buttons
  const panel = inked(new RoundedBoxGeometry(0.74, 0.44, 0.08, 3, 0.04), C.cream, { width: 0.025 });
  panel.position.set(0, -0.02, 0.5);
  rig.add(panel);
  [C.lime, C.yellow, C.blue].forEach((color, i) => {
    const button = inked(new THREE.SphereGeometry(0.075, 20, 14), color, { width: 0.022 });
    button.position.set(-0.2 + i * 0.2, -0.02, 0.56);
    button.scale.z = 0.6;
    rig.add(button);
  });

  // head
  const head = new THREE.Group();
  head.position.y = 1.08;
  rig.add(head);
  parts.head = head;
  head.add(inked(new RoundedBoxGeometry(1.56, 1.08, 1.06, 5, 0.3), C.cream));

  const screen = inked(new RoundedBoxGeometry(1.2, 0.72, 0.08, 3, 0.14), C.ink, { width: 0.01, basic: true });
  screen.position.z = 0.52;
  head.add(screen);

  const face = new THREE.Group(); // eyes + mouth slide around inside the screen
  face.position.z = 0.575;
  head.add(face);
  parts.face = face;
  const eyeMat = new THREE.MeshBasicMaterial({ color: C.lime });
  const eyeGeo = new THREE.CapsuleGeometry(0.075, 0.12, 6, 14);
  parts.eyes = [-0.25, 0.25].map((x) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.05, 0);
    face.add(eye);
    return eye;
  });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.026, 8, 24, Math.PI), eyeMat);
  mouth.rotation.z = Math.PI;
  mouth.position.y = -0.14;
  face.add(mouth);
  parts.mouth = mouth;
  // blush
  const blushMat = new THREE.MeshBasicMaterial({ color: C.pink, transparent: true, opacity: 0.9 });
  [-0.45, 0.45].forEach((x) => {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), blushMat);
    blush.scale.y = 0.6;
    blush.position.set(x, -0.12, 0);
    face.add(blush);
  });

  // ears
  [-1, 1].forEach((s) => {
    const ear = inked(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 24), C.blue, { scaled: true, width: 0.06 });
    ear.rotation.z = Math.PI / 2;
    ear.position.x = s * 0.83;
    head.add(ear);
  });

  // antenna on a spring
  const antenna = new THREE.Group();
  antenna.position.y = 0.54;
  head.add(antenna);
  parts.antenna = antenna;
  const stalk = inked(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 10), C.ink, { width: 0.01, basic: true });
  stalk.position.y = 0.18;
  antenna.add(stalk);
  const bulb = inked(new THREE.SphereGeometry(0.12, 22, 16), C.yellow);
  bulb.position.y = 0.42;
  antenna.add(bulb);

  // arms hang from shoulder pivots
  parts.arms = [-1, 1].map((s) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.72, 0.28, 0);
    rig.add(shoulder);
    const arm = inked(new THREE.CapsuleGeometry(0.12, 0.42, 6, 14), C.blue);
    arm.position.y = -0.3;
    shoulder.add(arm);
    const hand = inked(new THREE.SphereGeometry(0.16, 22, 16), C.yellow);
    hand.position.y = -0.66;
    shoulder.add(hand);
    shoulder.rotation.z = s * 0.18;
    return shoulder;
  });

  // a little thruster flame instead of legs
  const flame = new THREE.Group();
  flame.position.y = -0.62;
  rig.add(flame);
  parts.flame = flame;
  const nozzle = inked(new THREE.CylinderGeometry(0.2, 0.26, 0.16, 24), C.ink, { width: 0.012, basic: true });
  flame.add(nozzle);
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 20), new THREE.MeshBasicMaterial({ color: C.yellow }));
  outer.rotation.x = Math.PI;
  outer.position.y = -0.28;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 16), new THREE.MeshBasicMaterial({ color: C.coral }));
  inner.rotation.x = Math.PI;
  inner.position.y = -0.2;
  flame.add(outer, inner);
  parts.flameCones = [outer, inner];

  // soft shadow on the "floor"
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(20,20,20,.32)");
    grad.addColorStop(1, "rgba(20,20,20,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.42), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.position.set(0, -1.55, -0.3);
  robot.add(shadow);
  parts.shadow = shadow;

  // a box around the robot for hit-testing
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2, 2.9, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.35;
  robot.add(hit);
  parts.hit = hit;

  return parts;
}

/* ── the shapes ───────────────────────────────────────────── */

function makeStarGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.26 : 0.6;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i) shape.lineTo(x, y);
    else shape.moveTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
  geo.center();
  return geo;
}

// x/y are fractions of the hero (0..1 from the left / top), z is depth.
const TOYS = [
  { geo: () => new THREE.TorusGeometry(0.42, 0.18, 18, 40), color: C.pink, x: 0.03, y: 0.56, z: -1, s: 1, m: [0.9, 0.14] },
  { geo: makeStarGeometry, color: C.yellow, x: 0.53, y: 0.63, z: -1.2, s: 0.85, scaled: true, m: [0.1, 0.22] },
  { geo: () => new THREE.SphereGeometry(0.5, 32, 22), color: C.blue, x: 0.985, y: 0.27, z: -1.6, s: 0.9 },
  { geo: () => new RoundedBoxGeometry(0.8, 0.8, 0.8, 4, 0.16), color: C.lime, x: 0.6, y: 0.88, z: -0.5, s: 0.7, m: [0.9, 0.84] },
  { geo: () => new THREE.ConeGeometry(0.45, 0.85, 32), color: C.coral, x: 0.43, y: 0.9, z: -2, s: 0.7, scaled: true },
  { geo: () => new THREE.CapsuleGeometry(0.22, 0.55, 8, 20), color: C.purple, x: 0.99, y: 0.62, z: -0.8, s: 0.85, m: [0.09, 0.78] },
  { geo: () => new THREE.IcosahedronGeometry(0.5, 0), color: C.mint, x: 0.385, y: 0.135, z: -2.4, s: 0.6, scaled: true },
  { geo: () => new THREE.TorusGeometry(0.3, 0.12, 14, 32), color: C.yellow, x: 0.93, y: 1.0, z: -1.8, s: 0.8 },
  { geo: () => new THREE.SphereGeometry(0.28, 24, 16), color: C.coral, x: 0.012, y: 0.96, z: -1.2, s: 1 },
  { geo: () => new THREE.OctahedronGeometry(0.42, 0), color: C.blue, x: 0.3, y: 0.6, z: -1.6, s: 0.6, scaled: true }
];

/* ── init ─────────────────────────────────────────────────── */

export async function initToys({ canvas, hero, stage, state, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const FOV = 35;
  const CAM_Z = 12;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-3, 5, 6);
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xffe2c4, 1.1));

  /* robot */
  const R = buildRobot();
  scene.add(R.robot);

  /* shapes */
  const toys = TOYS.map((def, i) => {
    const group = inked(def.geo(), def.color, { scaled: def.scaled, width: def.scaled ? 0.045 : 0.04 });
    const holder = new THREE.Group();
    holder.add(group);
    scene.add(holder);
    return {
      def,
      holder,
      body: group,
      home: new THREE.Vector3(),
      push: new THREE.Vector2(),
      pushVel: new THREE.Vector2(),
      spin: new THREE.Vector3(0.15 + Math.random() * 0.25, 0.2 + Math.random() * 0.3, 0),
      squash: 0,
      squashVel: 0,
      phase: i * 1.7,
      size: def.s
    };
  });

  /* confetti */
  const CONFETTI = 90;
  const confetti = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.11, 0.06),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    CONFETTI
  );
  confetti.frustumCulled = false;
  scene.add(confetti);
  const bits = Array.from({ length: CONFETTI }, (_, i) => {
    confetti.setColorAt(i, new THREE.Color(CONFETTI_COLORS[i % CONFETTI_COLORS.length]));
    return { life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3() };
  });
  const dummy = new THREE.Object3D();
  const hideConfetti = () => {
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < CONFETTI; i++) confetti.setMatrixAt(i, dummy.matrix);
    confetti.instanceMatrix.needsUpdate = true;
  };
  hideConfetti();
  let confettiAlive = 0;
  const burst = (origin, count = 60) => {
    if (reducedMotion) return;
    let made = 0;
    for (const b of bits) {
      if (b.life > 0) continue;
      b.life = 1.4 + Math.random() * 0.8;
      b.p.copy(origin);
      const a = Math.random() * Math.PI * 2;
      const up = 3.5 + Math.random() * 3.5;
      b.v.set(Math.cos(a) * (1.5 + Math.random() * 2.5), up, Math.sin(a) * 1.5);
      b.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      b.rv.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      if (++made >= count) break;
    }
    confettiAlive = Math.max(confettiAlive, made);
  };

  /* layout: map hero fractions and the stage element into world units */
  let vw = 1;
  let vh = 1;
  let unitsPerPx = 1;
  let mobile = false;
  const robotHome = { x: 0, y: 0, s: 1 };

  const layout = () => {
    const w = canvas.clientWidth || hero.clientWidth;
    const h = canvas.clientHeight || hero.clientHeight;
    vw = w;
    vh = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    unitsPerPx = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h;
    mobile = w < 860;

    const heroRect = hero.getBoundingClientRect();
    const r = stage.getBoundingClientRect();
    robotHome.x = (r.left - heroRect.left + r.width / 2 - w / 2) * unitsPerPx;
    robotHome.y = -(r.top - heroRect.top + r.height / 2 - h / 2) * unitsPerPx;
    robotHome.s = Math.min((r.height * unitsPerPx) / (mobile ? 4.3 : 3.9), (r.width * unitsPerPx) / 2.6);

    const toyScale = clamp(Math.min(w, h * 1.3) / 1100, 0.6, 1.2);
    toys.forEach((t) => {
      t.holder.visible = !mobile || Boolean(t.def.m);
      // on phones the shapes gather around the robot instead of the whole hero
      let [fx, fy] = [t.def.x, t.def.y];
      if (mobile && t.def.m) {
        fx = (r.left - heroRect.left + t.def.m[0] * r.width) / w;
        fy = (r.top - heroRect.top + t.def.m[1] * r.height) / h;
      }
      // at depth z the visible area is a little bigger, so scale positions out
      const depthScale = (CAM_Z - t.def.z) / CAM_Z;
      t.home.set((fx - 0.5) * w * unitsPerPx * depthScale, -(fy - 0.5) * h * unitsPerPx * depthScale, t.def.z);
      t.size = t.def.s * toyScale * (mobile ? 0.9 : 1);
    });
  };
  layout();
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(hero);
  window.addEventListener("resize", layout);

  /* pointer + poking */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointer = { x: -9999, y: -9999, inside: false };
  let hoverTarget = null;

  const pick = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const targets = [R.hit, ...toys.filter((t) => t.holder.visible).map((t) => t.body.userData.mesh)];
    const hit = raycaster.intersectObjects(targets, false)[0];
    if (!hit) return null;
    if (hit.object === R.hit) return "robot";
    return toys.find((t) => t.body.userData.mesh === hit.object) || null;
  };

  const isControl = (el) => el.closest && el.closest("a, button, input, textarea, select");

  hero.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside = true;
    if (e.pointerType === "mouse") {
      hoverTarget = isControl(e.target) ? null : pick(e.clientX, e.clientY);
      hero.classList.toggle("is-poking", Boolean(hoverTarget));
    }
  });
  hero.addEventListener("pointerleave", () => {
    pointer.inside = false;
    hoverTarget = null;
    hero.classList.remove("is-poking");
  });

  // robot animation state
  const bot = { y: 0, vy: 0, spin: 0, spinTarget: 0, squash: 0, squashVel: 0, happy: 0, wave: 0, antenna: 0, antennaVel: 0, blink: 0, nextBlink: 2, nextWave: 4, lookX: 0, lookY: 0 };
  const origin = new THREE.Vector3();

  const pokeRobot = () => {
    if (bot.y > 0.05) return; // already in the air
    bot.vy = 5.2;
    bot.spinTarget += Math.PI * 2;
    bot.squashVel = -6;
    bot.happy = 1;
    bot.wave = 1.6;
    bot.antennaVel += 9;
    R.head.getWorldPosition(origin);
    origin.y += 0.6 * robotHome.s;
    burst(origin);
  };
  const pokeToy = (t) => {
    t.squashVel -= 9;
    t.spin.x += (Math.random() - 0.5) * 9;
    t.spin.y += 6 + Math.random() * 6;
    t.pushVel.y += 5;
    t.pushVel.x += (Math.random() - 0.5) * 5;
    t.holder.getWorldPosition(origin);
    burst(origin, 14);
  };

  hero.addEventListener("pointerdown", (e) => {
    if (isControl(e.target)) return;
    const target = pick(e.clientX, e.clientY);
    if (target === "robot") pokeRobot();
    else if (target) pokeToy(target);
  });

  /* only animate while the hero is on screen */
  let visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 }).observe(hero);
  }

  const screenPos = new THREE.Vector3();
  let last = performance.now();
  let time = 0;

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible || document.hidden) return;
    const motion = reducedMotion ? 0 : 1;
    time += dt * motion;

    // scrolling: shapes drift up at different speeds, robot a bit slower
    const scroll = Math.min(state.heroScroll || 0, vh * 1.2) * unitsPerPx;

    /* robot */
    const pxN = pointer.inside ? (pointer.x / vw) * 2 - 1 : 0;
    const pyN = pointer.inside ? (pointer.y / vh) * 2 - 1 : 0;
    // look toward the pointer, relative to where the robot is on screen
    const robotScreenX = 0.5 + robotHome.x / (vw * unitsPerPx);
    bot.lookX = damp(bot.lookX, clamp((pxN * 0.5 + 0.5 - robotScreenX) * 2.2, -1, 1), 6, dt);
    bot.lookY = damp(bot.lookY, clamp(pyN + 0.25, -1, 1), 6, dt);

    // jump physics
    bot.vy -= 14 * dt;
    bot.y += bot.vy * dt;
    if (bot.y < 0) {
      if (bot.vy < -2) {
        bot.squashVel -= -bot.vy * 1.4;
        bot.antennaVel -= bot.vy * 1.2;
      }
      bot.y = 0;
      bot.vy = 0;
    }
    bot.squashVel += (-120 * bot.squash - 9 * bot.squashVel) * dt;
    bot.squash += bot.squashVel * dt;
    bot.spin = damp(bot.spin, bot.spinTarget, 4.5, dt);
    bot.happy = Math.max(0, bot.happy - dt * 0.6);

    // antenna spring, nudged by head turns
    bot.antennaVel += (-70 * bot.antenna - 4 * bot.antennaVel) * dt;
    bot.antenna += bot.antennaVel * dt;

    // blinking
    bot.nextBlink -= dt;
    if (bot.nextBlink < 0) {
      bot.blink = 0.14;
      bot.nextBlink = 2 + Math.random() * 3.5;
    }
    bot.blink = Math.max(0, bot.blink - dt);
    const eyeOpen = bot.blink > 0 ? 0.12 : bot.happy > 0.2 ? 0.45 : 1;

    // idle wave now and then, and when hovered
    bot.nextWave -= dt * motion;
    if (bot.nextWave < 0) {
      bot.wave = Math.max(bot.wave, 1.4);
      bot.nextWave = 6 + Math.random() * 6;
    }
    if (hoverTarget === "robot") bot.wave = Math.max(bot.wave, 0.6);
    bot.wave = Math.max(0, bot.wave - dt);

    const s = robotHome.s;
    // the robot is taller above its origin than below, so centre its bounds
    R.robot.position.set(robotHome.x, robotHome.y - 0.33 * s + scroll * 0.6, 0);
    R.robot.scale.setScalar(s);
    R.robot.rotation.y = lerp(-0.32, 0.32, clamp(robotHome.x > 0 ? 0 : 1)) + bot.spin;
    const hover = Math.sin(time * 2) * 0.09;
    R.rig.position.y = hover + bot.y;
    R.rig.scale.set(1 - bot.squash * 0.5, 1 + bot.squash, 1 - bot.squash * 0.5);
    R.rig.rotation.z = Math.sin(time * 1.3) * 0.04;

    R.head.rotation.y = damp(R.head.rotation.y, bot.lookX * 0.5, 8, dt);
    R.head.rotation.x = damp(R.head.rotation.x, bot.lookY * 0.25, 8, dt);
    R.face.position.x = bot.lookX * 0.12;
    R.face.position.y = -bot.lookY * 0.06;
    R.eyes.forEach((eye) => (eye.scale.y = damp(eye.scale.y, eyeOpen, 30, dt)));
    R.mouth.scale.setScalar(damp(R.mouth.scale.x, 1 + bot.happy * 0.8, 10, dt));
    R.antenna.rotation.z = bot.antenna * 0.08 - R.head.rotation.y * 0.3;

    const waveAmt = clamp(bot.wave);
    R.arms[1].rotation.z = 0.18 + waveAmt * (2.3 + Math.sin(time * 14) * 0.35);
    R.arms[0].rotation.z = -0.18 - (bot.happy > 0.4 ? waveAmt * 2.3 : Math.sin(time * 2 + 1) * 0.05);

    const flicker = 0.85 + Math.sin(time * 40) * 0.08 + Math.random() * 0.1 * motion;
    const thrust = 1 + clamp(bot.vy / 4, 0, 1.2);
    R.flameCones.forEach((cone, i) => cone.scale.set(1, flicker * thrust * (i ? 1.1 : 1), 1));
    const height = hover + bot.y;
    R.shadow.scale.setScalar(clamp(1 - height * 0.22, 0.4, 1.1));
    R.shadow.material.opacity = clamp(1 - height * 0.3, 0.3, 1);

    /* shapes */
    toys.forEach((t) => {
      if (!t.holder.visible) return;
      const depthParallax = 0.35 + (t.def.z + 3) * 0.25;
      const base = t.home;
      const bob = Math.sin(time * 1.1 + t.phase) * 0.18;

      // shy away from the pointer
      screenPos.set(base.x + t.push.x, base.y + t.push.y + scroll * depthParallax, base.z).project(camera);
      const sx = (screenPos.x * 0.5 + 0.5) * vw;
      const sy = (-screenPos.y * 0.5 + 0.5) * vh;
      if (pointer.inside && motion) {
        const dx = sx - pointer.x;
        const dy = sy - pointer.y;
        const d = Math.hypot(dx, dy);
        const radius = 150;
        if (d < radius && d > 0.01) {
          const f = ((radius - d) / radius) * 26 * dt;
          t.pushVel.x += (dx / d) * f;
          t.pushVel.y -= (dy / d) * f;
        }
      }
      t.pushVel.x += (-10 * t.push.x - 2.6 * t.pushVel.x) * dt;
      t.pushVel.y += (-10 * t.push.y - 2.6 * t.pushVel.y) * dt;
      t.push.x += t.pushVel.x * dt;
      t.push.y += t.pushVel.y * dt;

      t.holder.position.set(base.x + t.push.x, base.y + t.push.y + bob + scroll * depthParallax, base.z);

      t.squashVel += (-160 * t.squash - 8 * t.squashVel) * dt;
      t.squash += t.squashVel * dt;
      const sz = t.size * (hoverTarget === t ? 1.08 : 1);
      t.holder.scale.set(sz * (1 - t.squash * 0.4), sz * (1 + t.squash), sz * (1 - t.squash * 0.4));

      t.spin.x = damp(t.spin.x, Math.sign(t.spin.x || 1) * 0.25, 1.2, dt);
      t.spin.y = damp(t.spin.y, Math.sign(t.spin.y || 1) * 0.35, 1.2, dt);
      t.body.rotation.x += t.spin.x * dt * motion;
      t.body.rotation.y += t.spin.y * dt * motion;
    });

    /* confetti */
    if (confettiAlive > 0) {
      let alive = 0;
      bits.forEach((b, i) => {
        if (b.life <= 0) return;
        b.life -= dt;
        b.v.y -= 9 * dt;
        b.v.multiplyScalar(1 - 0.9 * dt);
        b.p.addScaledVector(b.v, dt);
        b.r.x += b.rv.x * dt;
        b.r.y += b.rv.y * dt;
        b.r.z += b.rv.z * dt;
        dummy.position.copy(b.p);
        dummy.rotation.copy(b.r);
        dummy.scale.setScalar(b.life > 0 ? clamp(b.life * 2) * 1.6 : 0);
        dummy.updateMatrix();
        confetti.setMatrixAt(i, dummy.matrix);
        if (b.life > 0) alive++;
      });
      confetti.instanceMatrix.needsUpdate = true;
      confettiAlive = alive;
    }

    renderer.render(scene, camera);
  };

  await new Promise((res) =>
    requestAnimationFrame((now) => {
      last = now;
      frame(now);
      res();
    })
  );
}
