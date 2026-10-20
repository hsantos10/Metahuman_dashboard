/*
 * Bodies driven by the GroundLink markers, for the force replay. They are drawing aids, not biomechanical models.
 *
 * Joint centres (shared by every style) are estimated from the surface markers with simple offsets: hips in from the
 * pelvis markers, knees moved toward the hip-ankle line from the lateral knee marker, ankles/elbows/wrists as the
 * midpoint of their lateral and medial markers, the head centre below the head-top marker, the neck between C7 and
 * the sternum marker.
 *
 * Styles (how others draw marker-driven bodies):
 *   block    - wooden artist's mannequin: rounded-block chest, waist and pelvis, tapered limbs
 *   capsule  - physics-simulation humanoid (MuJoCo-style): every part a capsule between two joints, sphere head
 *   segments - biomechanics software (Visual3D-style): tapered segments between joint centres, left blue / right green,
 *              joint centres marked
 *   stick    - stick figure between joint centres with joint dots (the classic motion-capture view)
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type BodyStyle = "block" | "capsule" | "segments" | "stick";
export const BODY_STYLES: [BodyStyle, string][] = [
  ["block", "Mannequin"], ["capsule", "Capsules"], ["segments", "Segments"], ["stick", "Stick figure"],
];
type Get = (name: string) => THREE.Vector3 | undefined;

const Y = new THREE.Vector3(0, 1, 0);
const v = () => new THREE.Vector3();
const t1 = v(), t2 = v(), t3 = v(), tq = new THREE.Quaternion(), tm = new THREE.Matrix4();

/* ------------------------------------------------------------------ joint centres */
interface Frames { pc: THREE.Vector3; lat: THREE.Vector3; fwd: THREE.Vector3; up: THREE.Vector3; latT: THREE.Vector3; upT: THREE.Vector3; asisW: number; shoMid: THREE.Vector3 }

function makeJointSolver() {
  const J: Record<string, THREE.Vector3> = {};
  const joint = (n: string) => (J[n] ??= v());
  const F: Frames = { pc: v(), lat: v(), fwd: v(), up: v(), latT: v(), upT: v(), asisW: 0.25, shoMid: v() };
  const asis = v(), psis = v(), tmp = v();
  const mid = (out: THREE.Vector3, a?: THREE.Vector3, b?: THREE.Vector3) =>
    a && b ? out.addVectors(a, b).multiplyScalar(0.5) : a || b ? out.copy((a ?? b) as THREE.Vector3) : out;

  function solve(get: Get): boolean {
    const LASI = get("LASI"), RASI = get("RASI"), LPSI = get("LPSI"), RPSI = get("RPSI");
    if (!LASI || !RASI) return false;
    const { pc, lat, fwd, up, latT, upT, shoMid } = F;
    mid(asis, LASI, RASI); mid(psis, LPSI ?? LASI, RPSI ?? RASI);
    pc.addVectors(asis, psis).multiplyScalar(0.5);
    lat.subVectors(RASI, LASI); F.asisW = lat.length(); lat.normalize();
    fwd.subVectors(asis, psis); fwd.addScaledVector(lat, -fwd.dot(lat)).normalize();
    up.crossVectors(lat, fwd).normalize();
    const C7 = get("C7"), STRN = get("STRN"), LSHO = get("LSHO"), RSHO = get("RSHO"), HEAD = get("HEAD");
    if (C7 && STRN) joint("neck").lerpVectors(C7, STRN, 0.35);
    else if (LSHO && RSHO) mid(joint("neck"), LSHO, RSHO).addScaledVector(up, 0.04);
    if (up.dot(tmp.subVectors(joint("neck"), pc)) < 0) up.negate();
    upT.subVectors(joint("neck"), pc).normalize();
    for (const [side, s] of [["L", -1], ["R", 1]] as const)
      joint(`${side}hip`).copy(asis).addScaledVector(lat, s * 0.36 * F.asisW).addScaledVector(up, -0.075).addScaledVector(fwd, -0.035);
    for (const side of ["L", "R"] as const) {
      mid(joint(`${side}ankle`), get(`${side}ANKL`), get(`${side}ANKM`));
      const kne = get(`${side}KNE`);
      if (kne) {   // knee centre: lateral knee marker moved up to 4.5 cm toward the hip-ankle line
        const h = joint(`${side}hip`), a = joint(`${side}ankle`);
        t1.subVectors(a, h); const L2 = t1.lengthSq();
        const s = L2 > 1e-9 ? Math.max(0, Math.min(1, t2.subVectors(kne, h).dot(t1) / L2)) : 0;
        t2.copy(h).addScaledVector(t1, s).sub(kne);
        joint(`${side}knee`).copy(kne).addScaledVector(t2.normalize(), Math.min(0.045, t2.length() || 0.045));
      }
      const hee = get(`${side}HEE`), toe = get(`${side}TOE`);
      if (hee) joint(`${side}heel`).copy(hee);
      if (toe) joint(`${side}toe`).copy(toe);
      const sho = side === "L" ? LSHO : RSHO;
      if (sho) joint(`${side}sho`).copy(sho).addScaledVector(upT, -0.045);
      mid(joint(`${side}elb`), get(`${side}ELBL`), get(`${side}ELBM`));
      mid(joint(`${side}wri`), get(`${side}WRL`), get(`${side}WRM`));
      t1.subVectors(joint(`${side}wri`), joint(`${side}elb`)).normalize();
      joint(`${side}hand`).copy(joint(`${side}wri`)).addScaledVector(t1, 0.06);
    }
    mid(shoMid, J.Lsho, J.Rsho);
    if (HEAD) joint("headC").copy(HEAD).addScaledVector(t1.subVectors(HEAD, joint("neck")).normalize(), -0.105);
    else joint("headC").copy(joint("neck")).addScaledVector(upT, 0.2);
    if (LSHO && RSHO) latT.subVectors(RSHO, LSHO); else latT.copy(lat);
    latT.addScaledVector(upT, -latT.dot(upT)).normalize();
    joint("hipMid").addVectors(joint("Lhip"), joint("Rhip")).multiplyScalar(0.5);
    joint("neckBase").copy(shoMid).addScaledVector(upT, 0.01);   // inside the chest, so the neck grows out of it
    return true;
  }
  return { J, F, solve };
}

/* ------------------------------------------------------------------ primitives */
function rod(group: THREE.Group, mat: THREE.Material, ra: number, rb: number, closed = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, 1, 24, 1, !closed), mat);
  m.castShadow = true; group.add(m); return m;
}
function ball(group: THREE.Group, mat: THREE.Material, r: number) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);
  m.castShadow = true; group.add(m); return m;
}
function placeRod(m: THREE.Mesh, A?: THREE.Vector3, B?: THREE.Vector3) {
  if (!A || !B) { m.visible = false; return; }
  t1.subVectors(B, A); const len = t1.length();
  m.visible = len > 1e-4;
  if (!m.visible) return;
  m.position.copy(A).addScaledVector(t1, 0.5);
  m.quaternion.copy(tq.setFromUnitVectors(Y, t1.normalize()));
  m.scale.set(1, len, 1);
}
function placeBall(m: THREE.Mesh, p?: THREE.Vector3) { m.visible = !!p; if (p) m.position.copy(p); }
function orient(m: THREE.Object3D, x: THREE.Vector3, y: THREE.Vector3) {
  t3.crossVectors(x, y).normalize(); tm.makeBasis(x, y, t3); m.quaternion.setFromRotationMatrix(tm);
}

type Limb = [string, string, number, number];
const LIMBS = (thigh: [number, number], shank: [number, number], upper: [number, number], fore: [number, number]): Limb[] => [
  ["Lhip", "Lknee", ...thigh], ["Rhip", "Rknee", ...thigh], ["Lknee", "Lankle", ...shank], ["Rknee", "Rankle", ...shank],
  ["Lheel", "Ltoe", 0.033, 0.024], ["Rheel", "Rtoe", 0.033, 0.024], ["Lankle", "Lheel", 0.032, 0.031], ["Rankle", "Rheel", 0.032, 0.031],
  ["Lsho", "Lelb", ...upper], ["Rsho", "Relb", ...upper], ["Lelb", "Lwri", ...fore], ["Relb", "Rwri", ...fore],
];

export interface Body { group: THREE.Group; update: (get: Get) => void }

/* ------------------------------------------------------------------ styles */
function blockBody(color: string): Body {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02 });
  const group = new THREE.Group(), { J, F, solve } = makeJointSolver();
  const limbs = LIMBS([0.066, 0.05], [0.049, 0.032], [0.046, 0.034], [0.033, 0.025]).map(([a, b, ra, rb]) => ({ m: rod(group, mat, ra, rb), a, b }));
  const neck = rod(group, mat, 0.05, 0.044);
  const balls = ([["Lhip", 0.066], ["Rhip", 0.066], ["Lknee", 0.05], ["Rknee", 0.05], ["Lankle", 0.032], ["Rankle", 0.032],
    ["Lheel", 0.033], ["Rheel", 0.033], ["Ltoe", 0.024], ["Rtoe", 0.024], ["Lsho", 0.048], ["Rsho", 0.048],
    ["Lelb", 0.034], ["Relb", 0.034], ["Lwri", 0.025], ["Rwri", 0.025], ["Lhand", 0.036], ["Rhand", 0.036]] as [string, number][])
    .map(([n, r]) => ({ m: ball(group, mat, r), n }));
  const box = (d: [number, number, number], r: number) => { const m = new THREE.Mesh(new RoundedBoxGeometry(...d, 6, r), mat); m.castShadow = true; group.add(m); return m; };
  const CH: [number, number, number] = [0.34, 0.3, 0.185], AB: [number, number, number] = [0.25, 0.2, 0.155], PE: [number, number, number] = [0.28, 0.15, 0.15];
  const chest = box(CH, 0.075), abd = box(AB, 0.07), pel = box(PE, 0.065);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat); head.castShadow = true; group.add(head);
  return {
    group,
    update(get) {
      group.visible = solve(get); if (!group.visible) return;
      const { pc, lat, fwd, up, latT, upT, asisW, shoMid } = F;
      limbs.forEach(({ m, a, b }) => placeRod(m, J[a], J[b]));
      balls.forEach(({ m, n }) => placeBall(m, J[n]));
      placeRod(neck, J.neckBase, J.headC);
      orient(pel, lat, up); pel.position.copy(pc).addScaledVector(up, -0.035).addScaledVector(fwd, 0.012);
      pel.scale.set(Math.min(1.2, Math.max(0.8, (asisW + 0.05) / PE[0])), 1, 1);
      const shoW = J.Lsho && J.Rsho ? J.Lsho.distanceTo(J.Rsho) : CH[0];
      orient(chest, latT, upT);
      chest.position.copy(shoMid).addScaledVector(upT, -(CH[1] / 2 - 0.05));
      chest.scale.set(Math.min(1.3, Math.max(0.8, (shoW + 0.06) / CH[0])), 1, 1);
      t1.copy(chest.position).addScaledVector(upT, -CH[1] / 2 + 0.04); t2.copy(pc).addScaledVector(up, 0.02);
      abd.position.addVectors(t1, t2).multiplyScalar(0.5); abd.quaternion.copy(chest.quaternion);
      abd.scale.set(1, Math.max(0.05, t1.distanceTo(t2)) / AB[1], 1);
      t2.subVectors(J.headC, J.neckBase).normalize(); t3.copy(latT).addScaledVector(t2, -latT.dot(t2)).normalize();
      orient(head, t3.clone(), t2.clone()); head.position.copy(J.headC); head.scale.set(0.083, 0.108, 0.098);
    },
  };
}

function capsuleBody(color: string): Body {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.0 });
  const group = new THREE.Group(), { J, F, solve } = makeJointSolver();
  // capsule = rod of one radius + end balls
  const cap = (r: number) => ({ rod: rod(group, mat, r, r), a: ball(group, mat, r), b: ball(group, mat, r) });
  const place = (c: ReturnType<typeof cap>, A?: THREE.Vector3, B?: THREE.Vector3) => { placeRod(c.rod, A, B); placeBall(c.a, A); placeBall(c.b, B); };
  const limbs = LIMBS([0.06, 0.06], [0.046, 0.046], [0.042, 0.042], [0.034, 0.034]).map(([a, b, r]) => ({ c: cap(Math.min(r, 0.06)), a, b }));
  const shoulders = cap(0.06), hips = cap(0.075), spine = cap(0.1), waist = cap(0.085), neck = cap(0.045);
  const head = ball(group, mat, 0.1), hands = [ball(group, mat, 0.037), ball(group, mat, 0.037)];
  return {
    group,
    update(get) {
      group.visible = solve(get); if (!group.visible) return;
      const { pc, up, upT, shoMid } = F;
      limbs.forEach(({ c, a, b }) => place(c, J[a], J[b]));
      place(shoulders, J.Lsho, J.Rsho);
      place(hips, J.Lhip, J.Rhip);
      t1.copy(shoMid).addScaledVector(upT, -0.07); t2.lerpVectors(pc, shoMid, 0.45);
      place(spine, t1.clone(), t2.clone());
      place(waist, t2.clone(), t3.copy(pc).addScaledVector(up, -0.01).clone());
      place(neck, J.neckBase, J.headC);
      placeBall(head, J.headC); placeBall(hands[0], J.Lhand); placeBall(hands[1], J.Rhand);
    },
  };
}

function segmentBody(trunk: string): Body {
  const mk = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.05 });
  const mats = { L: mk("#5b84c4"), R: mk("#5aa874"), T: mk(trunk), J: mk("#3f3f46") };
  const group = new THREE.Group(), { J, F, solve } = makeJointSolver();
  const limbs = LIMBS([0.065, 0.045], [0.045, 0.03], [0.042, 0.03], [0.032, 0.022])
    .map(([a, b, ra, rb]) => ({ m: rod(group, mats[a[0] as "L" | "R"], ra, rb, true), a, b }));
  const thorax = rod(group, mats.T, 0.1, 0.14, true), pelvis = rod(group, mats.T, 0.075, 0.075, true);
  const neck = rod(group, mats.T, 0.04, 0.035, true), head = ball(group, mats.T, 0.095);
  const joints = ["Lhip", "Rhip", "Lknee", "Rknee", "Lankle", "Rankle", "Lsho", "Rsho", "Lelb", "Relb", "Lwri", "Rwri"]
    .map((n) => ({ m: ball(group, mats.J, 0.022), n }));
  return {
    group,
    update(get) {
      group.visible = solve(get); if (!group.visible) return;
      const { up, shoMid } = F;
      limbs.forEach(({ m, a, b }) => placeRod(m, J[a], J[b]));
      // thorax frustum from the hip midpoint (narrow end) to the shoulders (wide end); pelvis a short bar across the hips
      placeRod(thorax, t1.copy(J.hipMid).addScaledVector(up, 0.06).clone(), shoMid);
      placeRod(pelvis, J.Lhip, J.Rhip);
      placeRod(neck, J.neckBase, J.headC); placeBall(head, J.headC);
      joints.forEach(({ m, n }) => placeBall(m, J[n]));
    },
  };
}

function stickBody(color: string): Body {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const group = new THREE.Group(), { J, solve } = makeJointSolver();
  const pairs: [string, string][] = [
    ["Lhip", "Lknee"], ["Rhip", "Rknee"], ["Lknee", "Lankle"], ["Rknee", "Rankle"], ["Lankle", "Lheel"], ["Rankle", "Rheel"],
    ["Lheel", "Ltoe"], ["Rheel", "Rtoe"], ["Lankle", "Ltoe"], ["Rankle", "Rtoe"], ["Lsho", "Lelb"], ["Rsho", "Relb"],
    ["Lelb", "Lwri"], ["Relb", "Rwri"], ["Lsho", "Rsho"], ["Lhip", "Rhip"], ["hipMid", "neckBase"], ["neckBase", "headC"],
  ];
  const sticks = pairs.map(([a, b]) => ({ m: rod(group, mat, 0.012, 0.012), a, b }));
  const dots = ["Lhip", "Rhip", "Lknee", "Rknee", "Lankle", "Rankle", "Lsho", "Rsho", "Lelb", "Relb", "Lwri", "Rwri", "neckBase", "hipMid"]
    .map((n) => ({ m: ball(group, mat, 0.026), n }));
  const head = ball(group, mat, 0.085);
  return {
    group,
    update(get) {
      group.visible = solve(get); if (!group.visible) return;
      sticks.forEach(({ m, a, b }) => placeRod(m, J[a], J[b]));
      dots.forEach(({ m, n }) => placeBall(m, J[n]));
      placeBall(head, J.headC);
    },
  };
}

export function buildBody(style: BodyStyle, theme: "dark" | "light"): Body {
  const light = theme === "light";
  if (style === "capsule") return capsuleBody(light ? "#d2a77c" : "#cfa47a");
  if (style === "segments") return segmentBody(light ? "#a7adb5" : "#b9bfc7");
  if (style === "stick") return stickBody(light ? "#52525b" : "#c4c4cc");
  return blockBody(light ? "#b4bcc6" : "#c7ccd3");
}
