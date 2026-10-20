/*
 * A mannequin driven by the GroundLink markers, for the force replay. It is a drawing aid, not a biomechanical model:
 * joint centres are estimated from the surface markers with simple offsets (hips from the pelvis markers, knees moved
 * medially from the lateral knee marker, ankles/elbows/wrists as the midpoint of their lateral and medial markers,
 * the head centre below the head-top marker), then limbs are tapered cylinders capped with spheres and the trunk is
 * three ellipsoids oriented with the pelvis and shoulder axes.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Get = (name: string) => THREE.Vector3 | undefined;

const UP = new THREE.Vector3(0, 1, 0);
const v = () => new THREE.Vector3();
const t1 = v(), t2 = v(), t3 = v(), tq = new THREE.Quaternion(), tm = new THREE.Matrix4();

interface Seg { mesh: THREE.Mesh; a: string; b: string }
interface Ell { mesh: THREE.Mesh; radii: [number, number, number] }

export interface Mannequin {
  group: THREE.Group;
  update: (get: Get) => void;
}

export function buildMannequin(color = "#c7ccd3"): Mannequin {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02 });
  const group = new THREE.Group();
  const J: Record<string, THREE.Vector3> = {};
  const joint = (name: string) => (J[name] ??= v());

  // limb segments: tapered, open cylinder of unit height (radius at a -> radius at b), capped by joint spheres
  const SEG: [string, string, number, number][] = [
    ["Lhip", "Lknee", 0.072, 0.05], ["Rhip", "Rknee", 0.072, 0.05],
    ["Lknee", "Lankle", 0.049, 0.032], ["Rknee", "Rankle", 0.049, 0.032],
    ["Lheel", "Ltoe", 0.034, 0.024], ["Rheel", "Rtoe", 0.034, 0.024],
    ["Lankle", "Lheel", 0.033, 0.031], ["Rankle", "Rheel", 0.033, 0.031],
    ["Lsho", "Lelb", 0.046, 0.034], ["Rsho", "Relb", 0.046, 0.034],
    ["Lelb", "Lwri", 0.033, 0.025], ["Relb", "Rwri", 0.033, 0.025],
    ["neck", "headC", 0.048, 0.044],
  ];
  const segs: Seg[] = SEG.map(([a, b, ra, rb]) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, 1, 24, 1, true), mat);
    mesh.castShadow = true; group.add(mesh);
    return { mesh, a, b };
  });
  const SPH: [string, number][] = [
    ["Lhip", 0.072], ["Rhip", 0.072], ["Lknee", 0.05], ["Rknee", 0.05], ["Lankle", 0.033], ["Rankle", 0.033],
    ["Lheel", 0.034], ["Rheel", 0.034], ["Ltoe", 0.024], ["Rtoe", 0.024],
    ["Lsho", 0.048], ["Rsho", 0.048], ["Lelb", 0.034], ["Relb", 0.034], ["Lwri", 0.026], ["Rwri", 0.026],
    ["Lhand", 0.036], ["Rhand", 0.036],
  ];
  const sphs = SPH.map(([name, r]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);
    mesh.castShadow = true; group.add(mesh);
    return { mesh, name };
  });
  const ell = (radii: [number, number, number]): Ell => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat);
    mesh.castShadow = true; group.add(mesh);
    return { mesh, radii };
  };
  // pelvis: rounded block in the pelvis axes (wider than deep, like the abdomen and chest)
  const PEL: [number, number, number] = [0.31, 0.17, 0.19];
  const pelvisB = new THREE.Mesh(new RoundedBoxGeometry(PEL[0], PEL[1], PEL[2], 6, 0.075), mat);
  pelvisB.castShadow = true; group.add(pelvisB);
  // abdomen: a slimmer rounded block bridging chest and pelvis (stretched to fit each frame)
  const ABD: [number, number, number] = [0.25, 0.2, 0.155];
  const abdomen = new THREE.Mesh(new RoundedBoxGeometry(ABD[0], ABD[1], ABD[2], 6, 0.07), mat);
  abdomen.castShadow = true; group.add(abdomen);
  // chest: a rounded box (a mannequin's ribcage is flatter front-to-back and squarer at the shoulders than an ellipsoid)
  const CHEST: [number, number, number] = [0.34, 0.3, 0.185];
  const chest = new THREE.Mesh(new RoundedBoxGeometry(CHEST[0], CHEST[1], CHEST[2], 6, 0.075), mat);
  chest.castShadow = true; group.add(chest);
  const headE = ell([0.083, 0.108, 0.098]);

  const mid = (out: THREE.Vector3, a?: THREE.Vector3, b?: THREE.Vector3) =>
    a && b ? out.addVectors(a, b).multiplyScalar(0.5) : out.copy((a ?? b) as THREE.Vector3);
  const placeEll = (e: Ell, c: THREE.Vector3, x: THREE.Vector3, y: THREE.Vector3) => {
    const z = t3.crossVectors(x, y).normalize();
    tm.makeBasis(x, y, z); e.mesh.quaternion.setFromRotationMatrix(tm);
    e.mesh.position.copy(c); e.mesh.scale.set(...e.radii);
  };
  const lat = v(), fwd = v(), up = v(), asis = v(), psis = v(), pc = v(), latT = v(), upT = v(), tmp = v();

  function update(get: Get) {
    const LASI = get("LASI"), RASI = get("RASI"), LPSI = get("LPSI"), RPSI = get("RPSI");
    if (!LASI || !RASI) { group.visible = false; return; }
    group.visible = true;
    mid(asis, LASI, RASI); mid(psis, LPSI ?? LASI, RPSI ?? RASI);
    pc.addVectors(asis, psis).multiplyScalar(0.5);
    lat.subVectors(RASI, LASI); const asisW = lat.length(); lat.normalize();
    fwd.subVectors(asis, psis); fwd.addScaledVector(lat, -fwd.dot(lat)).normalize();
    up.crossVectors(lat, fwd).normalize();
    const C7 = get("C7"), STRN = get("STRN"), LSHO = get("LSHO"), RSHO = get("RSHO"), HEAD = get("HEAD");
    // trunk: neck base between C7 and the sternum marker; trunk "up" from the pelvis centre to it
    if (C7 && STRN) joint("neck").lerpVectors(C7, STRN, 0.35);
    else if (LSHO && RSHO) mid(joint("neck"), LSHO, RSHO).addScaledVector(up, 0.04);
    if (up.dot(tmp.subVectors(joint("neck"), pc)) < 0) up.negate();
    upT.subVectors(joint("neck"), pc).normalize();
    // hips: in from the ASIS line, below and behind it
    for (const [side, s] of [["L", -1], ["R", 1]] as const) {
      joint(`${side}hip`).copy(asis).addScaledVector(lat, s * 0.36 * asisW).addScaledVector(up, -0.075).addScaledVector(fwd, -0.035);
    }
    for (const side of ["L", "R"] as const) {
      const ank = get(`${side}ANKL`), ankM = get(`${side}ANKM`), kne = get(`${side}KNE`);
      if (ank || ankM) mid(joint(`${side}ankle`), ank, ankM);
      // knee centre: the lateral knee marker moved up to 4.5 cm toward the hip-ankle line
      if (kne) {
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
    if (HEAD) joint("headC").copy(HEAD).addScaledVector(t1.subVectors(HEAD, joint("neck")).normalize(), -0.105);
    else joint("headC").copy(joint("neck")).addScaledVector(upT, 0.2);

    for (const { mesh, a, b } of segs) {
      const A = J[a], B = J[b];
      if (!A || !B) { mesh.visible = false; continue; }
      t1.subVectors(B, A); const len = t1.length();
      mesh.visible = len > 1e-4;
      if (!mesh.visible) continue;
      mesh.position.copy(A).addScaledVector(t1, 0.5);
      mesh.quaternion.copy(tq.setFromUnitVectors(UP, t1.normalize()));
      mesh.scale.set(1, len, 1);
    }
    for (const { mesh, name } of sphs) {
      const p = J[name];
      mesh.visible = !!p;
      if (p) mesh.position.copy(p);
    }
    // trunk ellipsoids: pelvis in the pelvis axes; abdomen and chest in the shoulder axes
    if (LSHO && RSHO) latT.subVectors(RSHO, LSHO); else latT.copy(lat);
    latT.addScaledVector(upT, -latT.dot(upT)).normalize();
    t3.crossVectors(lat, up).normalize();
    tm.makeBasis(lat, up, t3); pelvisB.quaternion.setFromRotationMatrix(tm);
    pelvisB.position.copy(pc).addScaledVector(up, -0.04);
    pelvisB.scale.set(Math.min(1.3, Math.max(0.8, (asisW + 0.1) / PEL[0])), 1, 1);
    // chest box: as wide as the shoulders, top just below the shoulder joints
    const shoW = J.Lsho && J.Rsho ? J.Lsho.distanceTo(J.Rsho) : CHEST[0];
    mid(tmp, J.Lsho, J.Rsho).addScaledVector(upT, -(CHEST[1] / 2 - 0.05));
    t3.crossVectors(latT, upT).normalize();
    tm.makeBasis(latT, upT, t3); chest.quaternion.setFromRotationMatrix(tm);
    chest.position.copy(tmp); chest.scale.set(Math.min(1.3, Math.max(0.8, (shoW + 0.06) / CHEST[0])), 1, 1);
    // abdomen from just inside the chest's lower edge down into the pelvis
    t1.copy(tmp).addScaledVector(upT, -CHEST[1] / 2 + 0.04);          // chest bottom (overlap 4 cm)
    t2.copy(pc).addScaledVector(up, 0.02);                             // pelvis top
    const abdLen = Math.max(0.05, t1.distanceTo(t2));
    abdomen.position.addVectors(t1, t2).multiplyScalar(0.5);
    abdomen.quaternion.copy(chest.quaternion);
    abdomen.scale.set(1, abdLen / ABD[1], 1);
    t2.subVectors(joint("headC"), joint("neck")).normalize();
    t3.copy(latT).addScaledVector(t2, -latT.dot(t2)).normalize();
    placeEll(headE, joint("headC"), t3.clone(), t2.clone());
  }

  return { group, update };
}
