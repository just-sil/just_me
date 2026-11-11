// The 3D dev board. Everything is modelled procedurally from primitives and
// canvas-drawn textures, so there are no model or image files to load.
//
// Board space: x runs along the long side (-2..2), z along the short side
// (-1..1), y is up, and the top copper surface sits at y = 0.

import * as THREE from "./vendor/three.module.min.js";

const W = 4;
const D = 2;
const T = 0.08;
const PPU = 512; // texture pixels per board unit

const PINS = 17;
const PITCH = 0.2;
const ROW_Z = 0.88;
const pinX = (i) => -1.6 + i * PITCH;

const LIME = 0xb7f000;
const GOLD = "#d8b65e";
const SILK = "#e6eadf";
const MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

const MODULE = { x: 1.05, w: 1.9, d: 1.36, t: 0.045 };
const CAN = { x: -0.25, w: 1.24, d: 1.16, h: 0.13 }; // relative to the module
const LANES = [0.6, 0.52, 0.44, 0.36, 0.28];
const BUS = [-0.045, -0.015, 0.015, 0.045];

const PIN_LABELS = {
  top: ["3V3", "EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26", "D27", "D14", "D12", "GND", "D13", "D2", "D3"],
  bottom: ["VIN", "GND", "D15", "D4", "RX2", "TX2", "D5", "D18", "D19", "D21", "RX0", "TX0", "D22", "D23", "GND", "3V3", "CMD"]
};

// Which parts light up for each toolkit step, the pose the board takes, and
// where the callout points (in the local space of the named part).
const STEPS = [
  { parts: ["module", "can"], tilt: 0.56, yaw: -0.78, anchor: ["module", 1.78, 0.06, 0] },
  { parts: ["headers"], tilt: 0.3, yaw: -0.42, anchor: ["headers", 0.4, -0.42, ROW_Z] },
  { parts: ["usb", "uart"], tilt: 0.62, yaw: 0.92, anchor: ["usb", -1.9, 0.14, 0] },
  { parts: ["buttons"], tilt: 0.72, yaw: 0.6, anchor: ["buttons", -1.62, 0.17, 0.6] },
  { parts: ["soc"], tilt: 0.88, yaw: -0.5, anchor: ["module", 0.63, 0.12, 0] },
  { parts: ["pcb"], tilt: 1.12, yaw: -0.22, anchor: ["pcb", -0.3, 0, -0.14] }
];

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (cur, target, rate, dt) => lerp(cur, target, 1 - Math.exp(-rate * dt));

/* ── canvas textures ──────────────────────────────────────── */

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}

function toTexture(canvas, renderer) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Copper routes on the main board. `pulse` marks the ones signals travel along.
function buildTraces() {
  const traces = [];
  for (const s of [-1, 1]) {
    // pins that sit beside the module: straight into its castellated pads
    for (let i = 9; i < PINS; i++) traces.push({ pts: [[pinX(i), s * ROW_Z], [pinX(i), s * 0.7]] });
    // pins further away: drop, jog at 45°, then run in a lane to the module
    LANES.forEach((lz, j) => {
      const x = pinX(7 - j);
      traces.push({ pts: [[x, s * ROW_Z], [x, s * 0.8], [x + (0.8 - lz), s * lz], [0.12, s * lz]], pulse: true });
    });
    // the rest end in a via
    [0, 1, 2, 8].forEach((i) => traces.push({ pts: [[pinX(i), s * ROW_Z], [pinX(i), s * 0.77]], via: true }));
  }
  BUS.forEach((z) => traces.push({ pts: [[-0.85, z], [0.12, z]], pulse: true }));
  traces.push({ pts: [[-1.6, -0.03], [-1.25, -0.03]] }, { pts: [[-1.6, 0.03], [-1.25, 0.03]] });
  // power
  traces.push({ w: 15, pts: [[-1.6, -0.18], [-1.44, -0.18], [-1.33, -0.29], [-1.33, -0.4]] });
  traces.push({ w: 15, pts: [[-0.97, -0.45], [-0.72, -0.45], [-0.66, -0.39], [-0.66, -0.2]], via: true });
  // status LEDs
  for (const z of [0.34, 0.52]) {
    traces.push({ pts: [[-1.25, z], [-1.17, z]] });
    traces.push({ pts: [[-1.07, z], [-0.96, z]], via: true });
  }
  return traces;
}

function drawBoard(traces) {
  const c = makeCanvas(W * PPU, D * PPU);
  const g = c.getContext("2d");
  const X = (x) => (x + W / 2) * PPU;
  const Z = (z) => (z + D / 2) * PPU;
  const U = (v) => v * PPU;

  // solder mask
  g.fillStyle = "#0c2a1e";
  g.fillRect(0, 0, c.width, c.height);

  // copper under the mask reads as a slightly lighter green
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "#1c6146";
  traces.forEach((tr) => {
    g.lineWidth = tr.w || 8;
    g.beginPath();
    tr.pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))));
    g.stroke();
  });

  const pad = (x, z, w, d, r = 4) => {
    g.fillStyle = GOLD;
    roundRect(g, X(x) - U(w) / 2, Z(z) - U(d) / 2, U(w), U(d), r);
    g.fill();
  };
  const ring = (x, z, r, hole) => {
    g.fillStyle = GOLD;
    g.beginPath();
    g.arc(X(x), Z(z), U(r), 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#07120d";
    g.beginPath();
    g.arc(X(x), Z(z), U(hole), 0, Math.PI * 2);
    g.fill();
  };

  // vias
  traces.filter((t) => t.via).forEach((t) => {
    const [x, z] = t.pts[t.pts.length - 1];
    ring(x, z, 0.03, 0.012);
  });
  [[-0.3, -0.62], [-0.55, 0.7], [-0.2, 0.74], [-0.42, -0.72], [-1.48, 0.2], [-0.62, 0.22], [-0.78, -0.62]].forEach(([x, z]) => ring(x, z, 0.026, 0.011));

  // header pads (pin 1 is square, as on a real board)
  for (const s of [-1, 1]) {
    for (let i = 0; i < PINS; i++) {
      if (i === 0) pad(pinX(i), s * ROW_Z, 0.125, 0.125, 3);
      ring(pinX(i), s * ROW_Z, i === 0 ? 0.001 : 0.064, 0.03);
    }
  }
  // mounting holes
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ring(sx * 1.84, sz * 0.84, 0.115, 0.07);

  // module footprint
  for (const s of [-1, 1]) {
    for (let i = 9; i < PINS; i++) pad(pinX(i), s * 0.665, 0.1, 0.11);
    LANES.forEach((lz) => pad(0.135, s * lz, 0.11, 0.05));
  }
  BUS.forEach((z) => pad(0.135, z, 0.11, 0.018, 2));
  pad(0.85, 0, 0.5, 0.5, 6); // thermal pad

  // USB-UART bridge (QFN)
  pad(-1.05, 0, 0.2, 0.2, 3);
  for (let i = -2; i <= 2; i++) {
    pad(-1.05 + i * 0.07, -0.19, 0.035, 0.06, 2);
    pad(-1.05 + i * 0.07, 0.19, 0.035, 0.06, 2);
    pad(-1.24, i * 0.07, 0.06, 0.035, 2);
    pad(-0.86, i * 0.07, 0.06, 0.035, 2);
  }
  // regulator
  pad(-1.15, -0.6, 0.24, 0.09);
  for (let i = -1; i <= 1; i++) pad(-1.15 + i * 0.11, -0.31, 0.06, 0.1);
  // USB connector
  for (let i = -3; i <= 3; i++) pad(-1.58, i * 0.055, 0.1, 0.03, 2);
  pad(-1.8, -0.29, 0.16, 0.07);
  pad(-1.8, 0.29, 0.16, 0.07);
  // buttons
  for (const z of [0.6, -0.6]) for (const dx of [-0.17, 0.17]) for (const dz of [-0.1, 0.1]) pad(-1.62 + dx, z + dz, 0.08, 0.06);
  // LEDs + their resistors, capacitors
  for (const z of [0.34, 0.52]) {
    for (const x of [-1.345, -1.255, -1.165, -1.075]) pad(x, z, 0.05, 0.075, 2);
  }
  [[-0.7, 0.17], [-0.7, -0.17], [-1.42, 0.17]].forEach(([x, z]) => {
    pad(x - 0.045, z, 0.05, 0.075, 2);
    pad(x + 0.045, z, 0.05, 0.075, 2);
  });
  [[-1.47, -0.22], [-0.82, -0.45]].forEach(([x, z]) => {
    pad(x - 0.09, z, 0.07, 0.11, 2);
    pad(x + 0.09, z, 0.07, 0.11, 2);
  });

  // silkscreen
  g.strokeStyle = SILK;
  g.fillStyle = SILK;
  g.lineWidth = 4;
  g.lineJoin = "miter";
  // module outline
  g.beginPath();
  g.moveTo(X(2), Z(-0.71));
  g.lineTo(X(0.07), Z(-0.71));
  g.lineTo(X(0.07), Z(0.71));
  g.lineTo(X(2), Z(0.71));
  g.stroke();
  // chip, button and connector outlines
  g.strokeRect(X(-1.29), Z(-0.24), U(0.48), U(0.48));
  g.beginPath();
  g.arc(X(-1.33), Z(-0.26), 5, 0, Math.PI * 2);
  g.fill();
  for (const z of [0.6, -0.6]) g.strokeRect(X(-1.79), Z(z - 0.17), U(0.34), U(0.34));

  const text = (str, x, z, size, weight = 700, align = "left") => {
    g.font = `${weight} ${size}px ${MONO}`;
    g.textAlign = align;
    g.textBaseline = "alphabetic";
    g.fillText(str, X(x), Z(z));
  };
  text("SIL-32", -0.52, -0.105, 70);
  text("DEVKIT · REV 2026", -0.515, 0.165, 21, 500);
  text("just-sil / KERALA", -0.515, 0.215, 21, 500);
  text("BOOT", -1.79, 0.405, 22);
  text("EN", -1.79, -0.375, 22);
  text("PWR", -1.0, 0.36, 20);
  text("IO2", -1.0, 0.54, 20);
  text("U2", -1.29, -0.27, 18, 500);
  text("U3", -0.93, -0.55, 18, 500);
  text("U1", 0.1, -0.74, 18, 500);
  text("J3", -1.58, 0.31, 18, 500);

  // pin labels, rotated to read along the header
  g.font = `500 21px ${MONO}`;
  g.textBaseline = "middle";
  for (let i = 0; i < PINS; i++) {
    const x = pinX(i) + PITCH / 2;
    if (x > 1.75) continue;
    g.save();
    g.translate(X(x), Z(0.81));
    g.rotate(-Math.PI / 2);
    g.textAlign = "left";
    g.fillText(PIN_LABELS.bottom[i], 0, 0);
    g.restore();
    g.save();
    g.translate(X(x), Z(-0.81));
    g.rotate(-Math.PI / 2);
    g.textAlign = "right";
    g.fillText(PIN_LABELS.top[i], 0, 0);
    g.restore();
  }
  return c;
}

function drawModule() {
  const c = makeCanvas(MODULE.w * PPU, MODULE.d * PPU);
  const g = c.getContext("2d");
  const X = (x) => (x + MODULE.w / 2) * PPU;
  const Z = (z) => (z + MODULE.d / 2) * PPU;
  const U = (v) => v * PPU;

  g.fillStyle = "#0e1011";
  g.fillRect(0, 0, c.width, c.height);

  // castellated edge pads
  g.fillStyle = GOLD;
  const cast = (x, z) => {
    g.beginPath();
    g.arc(X(x), Z(z), U(0.045), 0, Math.PI * 2);
    g.fill();
  };
  for (let i = 9; i < PINS; i++) {
    cast(pinX(i) - MODULE.x, -MODULE.d / 2);
    cast(pinX(i) - MODULE.x, MODULE.d / 2);
  }
  [...LANES, ...LANES.map((l) => -l), 0].forEach((z) => {
    g.beginPath();
    g.arc(X(-MODULE.w / 2), Z(z), U(0.03), 0, Math.PI * 2);
    g.fill();
  });

  // ground ring the shield can solders onto, and the footprints under it
  g.strokeStyle = GOLD;
  g.lineWidth = 12;
  roundRect(g, X(CAN.x - CAN.w / 2) + 6, Z(-CAN.d / 2) + 6, U(CAN.w) - 12, U(CAN.d) - 12, 10);
  g.stroke();
  roundRect(g, X(-0.42) - U(0.13), Z(0) - U(0.13), U(0.26), U(0.26), 4);
  g.fill();

  // meandered PCB antenna
  g.lineWidth = 13;
  g.lineJoin = "miter";
  g.lineCap = "butt";
  g.beginPath();
  const ax = 0.52;
  g.moveTo(X(ax - 0.1), Z(0.5));
  g.lineTo(X(ax), Z(0.5));
  let z = 0.5;
  let dir = 1;
  while (z > -0.5) {
    g.lineTo(X(dir > 0 ? ax + 0.32 : ax), Z(z));
    z -= 0.115;
    g.lineTo(X(dir > 0 ? ax + 0.32 : ax), Z(z));
    dir *= -1;
  }
  g.stroke();

  g.fillStyle = "#8b9088";
  g.font = `500 18px ${MONO}`;
  g.textBaseline = "alphabetic";
  g.save();
  g.translate(X(0.9), Z(0.6));
  g.rotate(-Math.PI / 2);
  g.fillText("ANT · KEEP OUT", 0, 0);
  g.restore();
  return c;
}

function drawCan() {
  const c = makeCanvas(CAN.w * PPU, CAN.d * PPU);
  const g = c.getContext("2d");
  g.fillStyle = "#c6cccd";
  g.fillRect(0, 0, c.width, c.height);
  // brushed finish
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * c.height;
    g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "60,70,72"},${0.03 + Math.random() * 0.05})`;
    g.fillRect(Math.random() * c.width, y, 80 + Math.random() * 260, 1);
  }
  g.strokeStyle = "rgba(60,68,70,.55)";
  g.lineWidth = 3;
  roundRect(g, 26, 26, c.width - 52, c.height - 52, 14);
  g.stroke();

  g.fillStyle = "#4d5557";
  g.textBaseline = "alphabetic";
  g.font = `700 92px ${MONO}`;
  g.fillText("SIL-32", 60, 170);
  g.font = `500 27px ${MONO}`;
  g.fillText("2.4 GHz · Wi-Fi + BT", 62, 226);
  g.fillText("SoC · 4 MB FLASH", 62, 266);
  g.font = `700 25px ${MONO}`;
  g.fillText("MADE IN KERALA", 62, c.height - 66);
  // a little data-matrix style mark
  const cell = 11;
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const edge = x === 0 || y === 9;
      if (edge || (x * 7 + y * 13 + x * y) % 3 === 0) g.fillRect(c.width - 62 - (10 - x) * cell, c.height - 62 - (10 - y) * cell, cell, cell);
    }
  }
  return c;
}

function drawChip(lines) {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#17181a";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#8f9696";
  g.beginPath();
  g.arc(36, 36, 11, 0, Math.PI * 2);
  g.fill();
  g.font = `700 40px ${MONO}`;
  g.textAlign = "center";
  lines.forEach((line, i) => g.fillText(line, 128, 122 + i * 52));
  return c;
}

function drawGlow() {
  const c = makeCanvas(128, 128);
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.22, "rgba(255,255,255,.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/* ── geometry helpers ─────────────────────────────────────── */

function roundedPath(path, w, h, r) {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x + w, y + h - r);
  path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y + h);
  path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r);
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return path;
}

function instanced(geometry, material, placements) {
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  const o = new THREE.Object3D();
  placements.forEach(([x, y, z, ry = 0], i) => {
    o.position.set(x, y, z);
    o.rotation.set(0, ry, 0);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// A small lit room, rendered once into an environment map so the metal parts
// have something to reflect.
function makeEnvironment(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: 0x0b0f0c, side: THREE.BackSide })));
  const panel = (hex, intensity, w, h, pos) => {
    const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    mat.color.set(hex).multiplyScalar(intensity);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    env.add(mesh);
  };
  panel(0xffffff, 11, 9, 9, [0, 11, 3]);
  panel(0xfff0d2, 7, 6, 9, [-11, 3, 5]);
  panel(0xd6ecff, 5, 6, 9, [11, 2, -2]);
  panel(0xffffff, 3, 10, 4, [0, -2, 11]);
  panel(LIME, 3, 4, 4, [5, -6, 8]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  env.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return texture;
}

/* ── the board ────────────────────────────────────────────── */

function buildBoard(renderer) {
  const board = new THREE.Group();
  const parts = {};
  const traces = buildTraces();

  // Each part gets its own group (so it can lift away) and its own materials
  // (so it can be highlighted on its own).
  const part = (name, off, parent = board) => {
    const group = new THREE.Group();
    parent.add(group);
    parts[name] = { group, off: new THREE.Vector3(...off), mats: [], hl: 0 };
    return parts[name];
  };
  const std = (p, opts) => {
    const mat = new THREE.MeshStandardMaterial(opts);
    mat.emissive = new THREE.Color(LIME);
    mat.emissiveIntensity = 0;
    p.mats.push(mat);
    return mat;
  };
  const metal = (p, color, roughness = 0.3) => std(p, { color, metalness: 1, roughness });
  const plastic = (p, color = 0x141516, roughness = 0.55) => std(p, { color, metalness: 0, roughness });
  const add = (p, geometry, material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    p.group.add(mesh);
    return mesh;
  };
  const texturedBox = (p, w, h, d, sideMat, topCanvas, topOpts) => {
    const top = std(p, { map: toTexture(topCanvas, renderer), ...topOpts });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideMat, sideMat, top, sideMat, sideMat, sideMat]);
  };

  /* PCB */
  const pcb = part("pcb", [0, 0, 0]);
  const outline = roundedPath(new THREE.Shape(), W, D, 0.12);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const hole = new THREE.Path();
      hole.absarc(sx * 1.84, sz * 0.84, 0.07, 0, Math.PI * 2, true);
      outline.holes.push(hole);
    }
  }
  const body = new THREE.ExtrudeGeometry(outline, { depth: T, bevelEnabled: false, curveSegments: 10 });
  body.rotateX(-Math.PI / 2);
  body.translate(0, -T, 0);
  add(pcb, body, [std(pcb, { color: 0x0c2a1e, roughness: 0.6, metalness: 0.1 }), std(pcb, { color: 0x6f7446, roughness: 0.75, metalness: 0 })]);

  const face = new THREE.ShapeGeometry(outline, 10);
  const uv = face.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W / 2) / W, (uv.getY(i) + D / 2) / D);
  face.rotateX(-Math.PI / 2);
  const faceMat = new THREE.MeshPhysicalMaterial({
    map: toTexture(drawBoard(traces), renderer),
    roughness: 0.58,
    metalness: 0.08,
    clearcoat: 0.3,
    clearcoatRoughness: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  faceMat.emissive = new THREE.Color(LIME);
  faceMat.emissiveIntensity = 0;
  pcb.mats.push(faceMat);
  add(pcb, face, faceMat, 0, 0.001, 0);

  /* pin headers: gold posts through the board, plastic spacer underneath */
  const headers = part("headers", [0, -0.62, 0]);
  const pinSpots = [];
  const jointSpots = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < PINS; i++) {
      pinSpots.push([pinX(i), -0.25, s * ROW_Z]);
      jointSpots.push([pinX(i), 0.012, s * ROW_Z]);
    }
    add(headers, new THREE.BoxGeometry(PINS * PITCH, 0.2, 0.2), plastic(headers), 0, -T - 0.1, s * ROW_Z);
  }
  headers.group.add(instanced(new THREE.BoxGeometry(0.052, 0.64, 0.052), metal(headers, 0xdcb45c, 0.28), pinSpots));
  const joint = new THREE.SphereGeometry(0.05, 12, 8);
  joint.scale(1, 0.55, 1);
  headers.group.add(instanced(joint, metal(headers, 0xc9ced1, 0.22), jointSpots));

  /* USB-C */
  const usb = part("usb", [-0.5, 0.32, 0]);
  const shellShape = roundedPath(new THREE.Shape(), 0.52, 0.17, 0.08);
  shellShape.holes.push(roundedPath(new THREE.Path(), 0.46, 0.11, 0.05));
  const shell = new THREE.ExtrudeGeometry(shellShape, { depth: 0.44, bevelEnabled: false, curveSegments: 10 });
  shell.rotateY(Math.PI / 2);
  add(usb, shell, metal(usb, 0xcfd4d6, 0.24), -2.06, 0.09, 0);
  add(usb, new THREE.BoxGeometry(0.06, 0.12, 0.47), plastic(usb, 0x0c0d0e), -1.67, 0.09, 0);
  add(usb, new THREE.BoxGeometry(0.3, 0.028, 0.34), plastic(usb, 0x1b1c1e, 0.4), -1.86, 0.09, 0);

  /* USB-UART bridge */
  const uart = part("uart", [0, 0.6, 0]);
  const chipSide = plastic(uart, 0x17181a, 0.5);
  const uartChip = texturedBox(uart, 0.4, 0.05, 0.4, chipSide, drawChip(["USB", "UART"]), { roughness: 0.5, metalness: 0 });
  uartChip.position.set(-1.05, 0.025, 0);
  uart.group.add(uartChip);

  /* power: regulator + tantalum capacitors */
  const power = part("power", [0, 0.46, 0]);
  add(power, new THREE.BoxGeometry(0.36, 0.09, 0.2), plastic(power, 0x151617), -1.15, 0.045, -0.45);
  const legMat = metal(power, 0xc9ced1, 0.3);
  add(power, new THREE.BoxGeometry(0.22, 0.025, 0.11), legMat, -1.15, 0.0125, -0.59);
  for (let i = -1; i <= 1; i++) add(power, new THREE.BoxGeometry(0.05, 0.025, 0.1), legMat, -1.15 + i * 0.11, 0.0125, -0.31);
  const tant = std(power, { color: 0xd39b1e, roughness: 0.55, metalness: 0 });
  add(power, new THREE.BoxGeometry(0.21, 0.1, 0.12), tant, -1.47, 0.05, -0.22);
  add(power, new THREE.BoxGeometry(0.21, 0.1, 0.12), tant, -0.82, 0.05, -0.45);

  /* BOOT / EN buttons */
  const buttons = part("buttons", [0, 0.72, 0]);
  const btnBase = metal(buttons, 0xc4c9cb, 0.34);
  const btnCap = plastic(buttons, 0x0f1011, 0.45);
  for (const z of [0.6, -0.6]) {
    add(buttons, new THREE.BoxGeometry(0.28, 0.09, 0.28), btnBase, -1.62, 0.045, z);
    add(buttons, new THREE.CylinderGeometry(0.075, 0.075, 0.07, 24), btnCap, -1.62, 0.125, z);
  }

  /* small passives + LEDs */
  const smd = part("smd", [0, 0.3, 0]);
  smd.group.add(
    instanced(new THREE.BoxGeometry(0.1, 0.05, 0.06), std(smd, { color: 0xb59a74, roughness: 0.6, metalness: 0 }), [
      [-0.7, 0.025, 0.17],
      [-0.7, 0.025, -0.17],
      [-1.42, 0.025, 0.17]
    ])
  );
  smd.group.add(
    instanced(new THREE.BoxGeometry(0.1, 0.035, 0.06), plastic(smd, 0x101112, 0.5), [
      [-1.12, 0.0175, 0.34],
      [-1.12, 0.0175, 0.52]
    ])
  );
  const glowTex = new THREE.CanvasTexture(drawGlow());
  const leds = [
    { z: 0.34, color: LIME, blink: false },
    { z: 0.52, color: 0xffb02e, blink: true }
  ].map((cfg) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf4f7ee, roughness: 0.35, emissive: cfg.color, emissiveIntensity: 1.6 });
    add(smd, new THREE.BoxGeometry(0.1, 0.045, 0.06), mat, -1.3, 0.0225, cfg.z);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: cfg.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    glow.scale.setScalar(0.34);
    glow.position.set(-1.3, 0.07, cfg.z);
    smd.group.add(glow);
    return { ...cfg, mat, glow };
  });

  /* Wi-Fi module: its own little PCB, the SoC, and a shield can on top */
  const module = part("module", [0, 1.0, 0]);
  const modRoot = new THREE.Group();
  modRoot.position.set(MODULE.x, 0.004, 0);
  module.group.add(modRoot);
  const modPcb = texturedBox(module, MODULE.w, MODULE.t, MODULE.d, plastic(module, 0x0e1011, 0.6), drawModule(), { roughness: 0.55, metalness: 0.2 });
  modPcb.position.y = MODULE.t / 2;
  modRoot.add(modPcb);

  const soc = part("soc", [0, 0, 0], modRoot);
  const socChip = texturedBox(soc, 0.46, 0.055, 0.46, plastic(soc, 0x17181a, 0.5), drawChip(["SIL32", "D0WD"]), { roughness: 0.5, metalness: 0 });
  socChip.position.set(-0.42, MODULE.t + 0.0275, 0);
  soc.group.add(socChip);
  // flash, crystal and decoupling around it (not highlighted, so they live on the module)
  const inner = new THREE.Group();
  modRoot.add(inner);
  const innerAdd = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, MODULE.t + y, z);
    inner.add(mesh);
  };
  innerAdd(new THREE.BoxGeometry(0.26, 0.05, 0.2), plastic(module, 0x151617), 0.08, 0.025, -0.32);
  innerAdd(new THREE.BoxGeometry(0.22, 0.05, 0.15), metal(module, 0xd2d6d7, 0.25), 0.08, 0.025, 0.33);
  inner.add(
    instanced(new THREE.BoxGeometry(0.07, 0.035, 0.045), std(module, { color: 0xb59a74, roughness: 0.6, metalness: 0 }), [
      [-0.74, MODULE.t + 0.0175, -0.4],
      [-0.6, MODULE.t + 0.0175, -0.4],
      [-0.74, MODULE.t + 0.0175, 0.4],
      [-0.6, MODULE.t + 0.0175, 0.4],
      [-0.08, MODULE.t + 0.0175, 0.0, Math.PI / 2],
      [-0.08, MODULE.t + 0.0175, 0.12, Math.PI / 2],
      [0.24, MODULE.t + 0.0175, 0.02, Math.PI / 2]
    ])
  );

  const can = part("can", [0, 0.5, 0], modRoot);
  const canMesh = texturedBox(can, CAN.w, CAN.h, CAN.d, metal(can, 0xc9cfd1, 0.3), drawCan(), { roughness: 0.34, metalness: 1 });
  canMesh.position.set(CAN.x, MODULE.t + CAN.h / 2, 0);
  can.group.add(canMesh);

  /* exploded-view guide lines */
  const guideSpots = [
    ["module", 0.12, -0.66], ["module", 0.12, 0.66], ["module", 1.98, -0.66], ["module", 1.98, 0.66],
    ["usb", -1.66, -0.22], ["usb", -1.66, 0.22],
    ["uart", -1.05, 0],
    ["buttons", -1.62, 0.6], ["buttons", -1.62, -0.6],
    ["power", -1.15, -0.45]
  ];
  const guideGeo = new THREE.BufferGeometry();
  guideGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(guideSpots.length * 6), 3));
  const guideMat = new THREE.LineBasicMaterial({ color: 0xd8b65e, transparent: true, opacity: 0, depthWrite: false });
  const guides = new THREE.LineSegments(guideGeo, guideMat);
  guides.frustumCulled = false;
  board.add(guides);

  /* signals running along the traces */
  const routes = traces.filter((t) => t.pulse).map((t) => {
    const pts = t.pts.map(([x, z]) => new THREE.Vector3(x, 0.014, z));
    const lengths = [0];
    for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + pts[i].distanceTo(pts[i - 1]));
    return { pts, lengths, total: lengths[lengths.length - 1] };
  });
  const pulseMat = new THREE.SpriteMaterial({ map: glowTex, color: LIME, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
  const pulses = Array.from({ length: 9 }, (_, i) => {
    const sprite = new THREE.Sprite(pulseMat.clone());
    sprite.scale.setScalar(0.1);
    pcb.group.add(sprite);
    return { sprite, route: routes[i % routes.length], t: Math.random(), speed: 0.35 + Math.random() * 0.4, back: i % 3 === 0 };
  });

  return { board, parts, leds, guides, guideSpots, pulses };
}

/* ── init ─────────────────────────────────────────────────── */

export async function initBoard({ canvas, heroStage, kitStage, callout, labels, state, reducedMotion }) {
  // Wait for the mono font so the silkscreen text is drawn with it.
  if (document.fonts && document.fonts.load) {
    await Promise.race([
      Promise.all([document.fonts.load(`700 40px ${MONO}`), document.fonts.load(`500 20px ${MONO}`)]),
      new Promise((res) => setTimeout(res, 1800))
    ]).catch(() => {});
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = 0.42;

  const FOV = 28;
  const CAM_Z = 16;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdff5a0, 0.7);
  rim.position.set(5, 2, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  const { board, parts, leds, guides, guideSpots, pulses } = buildBoard(renderer);
  const tiltGroup = new THREE.Group(); // leans the board toward the camera
  const spinGroup = new THREE.Group(); // turns it about its own normal
  spinGroup.add(board);
  tiltGroup.add(spinGroup);
  scene.add(tiltGroup);

  const calloutLabel = callout.querySelector(".callout__label");

  /* size */
  let vw = 1;
  let vh = 1;
  let unitsPerPx = 1;
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === vw && h === vh) return;
    vw = w;
    vh = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    unitsPerPx = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h;
  };
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize);

  /* drag to spin */
  let dragYaw = 0;
  let dragVel = 0;
  let dragging = false;
  let lastX = 0;
  [heroStage, kitStage].forEach((el) => {
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      dragVel = 0;
      el.classList.add("is-dragging");
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) * 0.009;
      lastX = e.clientX;
      dragYaw += dx;
      dragVel = dx * 60;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("is-dragging");
      // keep the shortest way home
      dragYaw = THREE.MathUtils.euclideanModulo(dragYaw + Math.PI, Math.PI * 2) - Math.PI;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });

  /* frame loop */
  const cur = { tilt: 0.9, yaw: -0.5, explode: 0, px: 0, py: 0, canLift: 0 };
  const anchor = new THREE.Vector3();
  const guidePos = guides.geometry.attributes.position;
  let shownStep = -2;
  let labelWidth = 0;
  let last = performance.now();
  let time = 0;
  let drawn = true;

  const targetFor = (rect, fit) => ({
    x: (rect.left + rect.width / 2 - vw / 2) * unitsPerPx,
    y: -(rect.top + rect.height / 2 - vh / 2) * unitsPerPx,
    s: Math.min(rect.width / 5.1, rect.height / 3.5) * unitsPerPx * fit
  });

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) return;
    if (!reducedMotion) time += dt;

    const hr = heroStage.getBoundingClientRect();
    const kr = kitStage.getBoundingClientRect();
    const b = state.blend;
    const hero = targetFor(hr, 1);
    const kit = targetFor(kr.width ? kr : hr, 0.9);
    const x = lerp(hero.x, kit.x, b);
    const y = lerp(hero.y, kit.y, b);
    const s = lerp(hero.s, kit.s, b);

    // nothing to draw while the board is well off screen
    const yPx = vh / 2 - y / unitsPerPx;
    const reach = (s / unitsPerPx) * 3.4;
    if (yPx < -reach || yPx > vh + reach) {
      if (drawn) {
        renderer.clear();
        callout.classList.remove("is-on");
        drawn = false;
      }
      return;
    }
    drawn = true;

    /* pose */
    const step = state.step >= 0 ? STEPS[state.step] : null;
    const heroYaw = -0.52 + Math.sin(time * 0.35) * 0.2;
    const kitYaw = (step ? step.yaw : -0.62) + Math.sin(time * 0.5) * 0.04;
    const heroTilt = 0.92;
    const kitTilt = step ? step.tilt : 0.56;

    cur.px = damp(cur.px, state.pointerX, 4, dt);
    cur.py = damp(cur.py, state.pointerY, 4, dt);
    const sway = 1 - b * 0.7;

    if (!dragging) {
      dragYaw += dragVel * dt;
      dragVel = damp(dragVel, 0, 3, dt);
      dragYaw = damp(dragYaw, 0, 0.9, dt);
    }

    cur.yaw = damp(cur.yaw, lerp(heroYaw, kitYaw, b) + cur.px * 0.3 * sway, 5, dt);
    cur.tilt = damp(cur.tilt, lerp(heroTilt, kitTilt, b) + cur.py * 0.1 * sway, 5, dt);
    cur.explode = damp(cur.explode, state.explode, 9, dt);

    tiltGroup.position.set(x, y + Math.sin(time * 0.9) * 0.05 * s, 0);
    tiltGroup.scale.setScalar(s);
    tiltGroup.rotation.set(cur.tilt, 0, lerp(0.1, 0.04, b));
    spinGroup.rotation.y = cur.yaw + dragYaw;

    /* parts: lift apart, glow when they are the current step */
    const e = cur.explode;
    for (const name in parts) {
      const p = parts[name];
      const on = step && step.parts.includes(name) && e > 0.5 ? 1 : 0;
      p.hl = damp(p.hl, on, 7, dt);
      p.group.position.copy(p.off).multiplyScalar(e * (1 + p.hl * 0.14));
      const glow = p.hl * (name === "pcb" ? 0.035 : 0.06);
      for (const m of p.mats) m.emissiveIntensity = glow;
    }
    // lift the shield can further when looking at what's underneath
    cur.canLift = damp(cur.canLift, state.step === 4 && e > 0.5 ? 1 : 0, 6, dt);
    parts.can.group.position.y += cur.canLift * 0.55;
    parts.can.group.position.x = cur.canLift * 0.5;

    /* guide lines from each footprint up to its part */
    guideSpots.forEach(([name, gx, gz], i) => {
      const pos = parts[name].group.position;
      guidePos.setXYZ(i * 2, gx, 0.004, gz);
      guidePos.setXYZ(i * 2 + 1, gx + pos.x, pos.y, gz + pos.z);
    });
    guidePos.needsUpdate = true;
    guides.material.opacity = e * 0.55;

    /* LEDs and signal pulses */
    leds.forEach((led) => {
      const level = led.blink && !reducedMotion ? (Math.sin(time * 3.2) > 0.2 ? 1 : 0.12) : 1;
      led.mat.emissiveIntensity = 1.6 * level;
      led.glow.material.opacity = 0.6 * level;
    });
    pulses.forEach((p) => {
      if (reducedMotion) {
        p.sprite.visible = false;
        return;
      }
      p.t += (dt * p.speed) / p.route.total;
      if (p.t > 1) p.t -= 1 + Math.random() * 0.6;
      const tt = clamp(p.t);
      const dist = (p.back ? 1 - tt : tt) * p.route.total;
      const { pts, lengths } = p.route;
      let i = 1;
      while (i < lengths.length - 1 && lengths[i] < dist) i++;
      const local = (dist - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
      p.sprite.position.lerpVectors(pts[i - 1], pts[i], local);
      p.sprite.visible = p.t > 0;
      p.sprite.material.opacity = Math.sin(tt * Math.PI) * 0.8;
    });

    renderer.render(scene, camera);

    /* callout: follow the highlighted part on screen */
    const showCallout = step && e > 0.72 && b > 0.95;
    if (showCallout) {
      if (state.step !== shownStep) {
        shownStep = state.step;
        calloutLabel.textContent = labels[state.step] || "";
        labelWidth = calloutLabel.offsetWidth;
      }
      const [name, ax, ay, az] = step.anchor;
      anchor.set(ax, ay, az);
      parts[name].group.localToWorld(anchor);
      anchor.project(camera);
      const sx = (anchor.x * 0.5 + 0.5) * vw;
      const sy = (-anchor.y * 0.5 + 0.5) * vh;
      callout.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      // keep the label inside the viewport on narrow screens
      calloutLabel.style.left = `${(clamp(sx + 40, 8, Math.max(8, vw - labelWidth - 8)) - sx).toFixed(1)}px`;
    }
    callout.classList.toggle("is-on", Boolean(showCallout));
  };

  // draw one frame before reporting ready, so the canvas fades in with content
  await new Promise((res) =>
    requestAnimationFrame((now) => {
      last = now;
      frame(now);
      res();
    })
  );
}
