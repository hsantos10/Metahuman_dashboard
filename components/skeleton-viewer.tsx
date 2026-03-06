"use client";

import { useRef, useMemo, useState, useEffect, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */
interface MotionFrame {
  markers: Record<string, [number, number, number]>;
  forces: {
    grf1: [number, number, number];
    grf2: [number, number, number];
    cop1: [number, number];
    cop2: [number, number];
  };
}
interface MotionData {
  subject: string; trial: string; activity: string;
  originalRate: number; downsampleStep: number; effectiveRate: number;
  nFrames: number; markerNames: string[];
  maxVerticalGRF: number;
  frames: MotionFrame[];
}

/* ═══════════════════════════════════════════════════════════════════
   Bone / LBS definitions
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 20 bones. Index 0 = Root (centroid of all 4 pelvis markers).
 * All other bones are direct children of Root.
 * LPSI/RPSI (18/19) added so the pelvis box is fully skinned — without
 * them the 4 pelvis-corner markers form an empty tetragon outline.
 */
const BONE_DEFS: { name: string; marker: string | null }[] = [
  { name: "Root",  marker: null   }, // 0  pelvis centroid (avg LASI+RASI+LPSI+RPSI)
  { name: "STRN",  marker: "STRN" }, // 1
  { name: "C7",    marker: "C7"   }, // 2
  { name: "HEAD",  marker: "HEAD" }, // 3
  { name: "LSHO",  marker: "LSHO" }, // 4
  { name: "LELB",  marker: "LELB" }, // 5
  { name: "LWRA",  marker: "LWRA" }, // 6
  { name: "RSHO",  marker: "RSHO" }, // 7
  { name: "RELB",  marker: "RELB" }, // 8
  { name: "RWRA",  marker: "RWRA" }, // 9
  { name: "LASI",  marker: "LASI" }, // 10  left anterior superior iliac (front-left hip)
  { name: "LKNE",  marker: "LKNE" }, // 11
  { name: "LANK",  marker: "LANK" }, // 12
  { name: "LTOE",  marker: "LTOE" }, // 13
  { name: "RASI",  marker: "RASI" }, // 14  right anterior superior iliac (front-right hip)
  { name: "RKNE",  marker: "RKNE" }, // 15
  { name: "RANK",  marker: "RANK" }, // 16
  { name: "RTOE",  marker: "RTOE" }, // 17
  { name: "LPSI",  marker: "LPSI" }, // 18  left posterior superior iliac (back-left hip)
  { name: "RPSI",  marker: "RPSI" }, // 19  right posterior superior iliac (back-right hip)
];

/**
 * Tube segments — radii are sized so the mesh surface stays INSIDE the
 * marker cloud. Because bone endpoints ARE skin-surface markers, the tube
 * radius must be strictly smaller than the real body half-width at that
 * position (~40-45 % of anatomical values leave the markers visibly outside).
 */
const TUBE_SEGS: { a: number; b: number; rA: number; rB: number; rings: number; sides: number }[] = [
  // ── Torso ──────────────────────────────────────────────────────
  // Main spine column: Root→C7 (back-of-neck marker, on the spine axis).
  // This runs up through the body centre rather than toward the chest surface.
  { a:  0, b:  2, rA: 0.096, rB: 0.080, rings: 7, sides: 16 }, // Root  → C7  (main spine, big)
  // Secondary fills so the front chest volume is also covered:
  { a:  0, b:  1, rA: 0.055, rB: 0.048, rings: 4, sides: 12 }, // Root  → STRN (chest front fill)
  { a:  1, b:  2, rA: 0.050, rB: 0.044, rings: 3, sides: 12 }, // STRN  → C7  (upper chest brace)
  // ── Neck ───────────────────────────────────────────────────────
  { a:  2, b:  3, rA: 0.028, rB: 0.026, rings: 3, sides: 12 }, // C7   → HEAD
  // ── Shoulder bar ───────────────────────────────────────────────
  { a:  4, b:  7, rA: 0.032, rB: 0.032, rings: 3, sides: 10 }, // LSHO → RSHO
  { a:  2, b:  4, rA: 0.042, rB: 0.034, rings: 3, sides: 10 }, // C7   → LSHO
  { a:  2, b:  7, rA: 0.042, rB: 0.034, rings: 3, sides: 10 }, // C7   → RSHO
  // ── Left arm ───────────────────────────────────────────────────
  { a:  4, b:  5, rA: 0.028, rB: 0.020, rings: 4, sides: 10 }, // LSHO → LELB
  { a:  5, b:  6, rA: 0.018, rB: 0.013, rings: 4, sides: 10 }, // LELB → LWRA
  // ── Right arm ──────────────────────────────────────────────────
  { a:  7, b:  8, rA: 0.028, rB: 0.020, rings: 4, sides: 10 },
  { a:  8, b:  9, rA: 0.018, rB: 0.013, rings: 4, sides: 10 },
  // ── Pelvis box — 4 surface markers form a rectangle; connect all
  //    6 pairs so the interior is skinned and not an empty outline ──
  { a: 10, b: 14, rA: 0.036, rB: 0.036, rings: 3, sides: 12 }, // LASI → RASI  (front)
  { a: 18, b: 19, rA: 0.036, rB: 0.036, rings: 3, sides: 12 }, // LPSI → RPSI  (back)
  { a: 10, b: 18, rA: 0.030, rB: 0.030, rings: 3, sides: 10 }, // LASI → LPSI  (left side)
  { a: 14, b: 19, rA: 0.030, rB: 0.030, rings: 3, sides: 10 }, // RASI → RPSI  (right side)
  { a: 10, b: 19, rA: 0.028, rB: 0.028, rings: 3, sides: 10 }, // LASI → RPSI  (diagonal)
  { a: 14, b: 18, rA: 0.028, rB: 0.028, rings: 3, sides: 10 }, // RASI → LPSI  (diagonal)
  { a:  0, b: 10, rA: 0.042, rB: 0.036, rings: 3, sides: 12 }, // Root → LASI
  { a:  0, b: 14, rA: 0.042, rB: 0.036, rings: 3, sides: 12 }, // Root → RASI
  { a:  0, b: 18, rA: 0.038, rB: 0.032, rings: 3, sides: 10 }, // Root → LPSI
  { a:  0, b: 19, rA: 0.038, rB: 0.032, rings: 3, sides: 10 }, // Root → RPSI
  // ── Left leg ───────────────────────────────────────────────────
  { a: 10, b: 11, rA: 0.040, rB: 0.030, rings: 5, sides: 12 }, // LASI → LKNE
  { a: 11, b: 12, rA: 0.027, rB: 0.017, rings: 5, sides: 12 }, // LKNE → LANK
  { a: 12, b: 13, rA: 0.015, rB: 0.010, rings: 3, sides: 10 }, // LANK → LTOE
  // ── Right leg ──────────────────────────────────────────────────
  { a: 14, b: 15, rA: 0.040, rB: 0.030, rings: 5, sides: 12 },
  { a: 15, b: 16, rA: 0.027, rB: 0.017, rings: 5, sides: 12 },
  { a: 16, b: 17, rA: 0.015, rB: 0.010, rings: 3, sides: 10 },
];

/* ─── Helper: compute world-space position of each bone from marker map ─── */
const YUP   = new THREE.Vector3(0, 1, 0);
const XRIGHT = new THREE.Vector3(1, 0, 0);

function getBoneWorldPositions(markerPos: Record<string, THREE.Vector3>): THREE.Vector3[] {
  const zero = new THREE.Vector3();
  const lasi = markerPos["LASI"] ?? zero;
  const rasi = markerPos["RASI"] ?? zero;
  const lpsi = markerPos["LPSI"] ?? lasi; // fall back to LASI if missing
  const rpsi = markerPos["RPSI"] ?? rasi;
  // Centroid of all 4 pelvis corner markers gives a better-centred Root
  const pelvis = lasi.clone().add(rasi).add(lpsi).add(rpsi).multiplyScalar(0.25);

  return BONE_DEFS.map((def) => {
    if (def.marker === null) return pelvis.clone();
    return (markerPos[def.marker] ?? pelvis).clone();
  });
}

/* ─── Build merged BufferGeometry with skinning attributes ──────── */
function buildBodyGeometry(bindBonePos: THREE.Vector3[]): THREE.BufferGeometry {
  const positions:   number[] = [];
  const normals:     number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices:     number[] = [];

  for (const seg of TUBE_SEGS) {
    const posA = bindBonePos[seg.a];
    const posB = bindBonePos[seg.b];
    if (!posA || !posB) continue;

    const segDir = posB.clone().sub(posA);
    const len = segDir.length();
    if (len < 0.001) continue;
    const dir = segDir.clone().normalize();

    // Build orthonormal basis for the ring cross-section
    const ref = Math.abs(dir.dot(YUP)) < 0.9 ? YUP : XRIGHT;
    const tang1 = new THREE.Vector3().crossVectors(ref, dir).normalize();
    const tang2 = new THREE.Vector3().crossVectors(dir, tang1).normalize();

    const baseVert = positions.length / 3;

    for (let ri = 0; ri < seg.rings; ri++) {
      const t  = seg.rings === 1 ? 0.5 : ri / (seg.rings - 1);
      const r  = seg.rA + (seg.rB - seg.rA) * t;
      const cx = posA.x + (posB.x - posA.x) * t;
      const cy = posA.y + (posB.y - posA.y) * t;
      const cz = posA.z + (posB.z - posA.z) * t;
      const wA = 1 - t;
      const wB = t;

      for (let vi = 0; vi < seg.sides; vi++) {
        const angle = (vi / seg.sides) * Math.PI * 2;
        const c = Math.cos(angle), s = Math.sin(angle);
        const nx = c * tang1.x + s * tang2.x;
        const ny = c * tang1.y + s * tang2.y;
        const nz = c * tang1.z + s * tang2.z;

        positions.push(cx + r * nx, cy + r * ny, cz + r * nz);
        normals.push(nx, ny, nz);
        skinIndices.push(seg.a, seg.b, 0, 0);
        skinWeights.push(wA, wB, 0, 0);
      }
    }

    // Triangles – use DoubleSide material so winding doesn't matter for visibility
    for (let ri = 0; ri < seg.rings - 1; ri++) {
      for (let vi = 0; vi < seg.sides; vi++) {
        const v00 = baseVert +  ri      * seg.sides + vi;
        const v01 = baseVert +  ri      * seg.sides + (vi + 1) % seg.sides;
        const v10 = baseVert + (ri + 1) * seg.sides + vi;
        const v11 = baseVert + (ri + 1) * seg.sides + (vi + 1) % seg.sides;
        indices.push(v00, v10, v01);
        indices.push(v01, v10, v11);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position",   new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal",     new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute("skinIndex",  new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  return geo;
}

/* ─── Build SkinnedMesh from bind pose ──────────────────────────── */
function buildSkinnedMesh(bindBonePos: THREE.Vector3[]) {
  const geometry = buildBodyGeometry(bindBonePos);

  // Flat hierarchy: bone[0] = Root at pelvis-midpoint, all others are children of Root.
  // Root is at its actual world bind position so that vertices weighted to Root
  // are properly anchored and move with the pelvis (not pinned to world origin).
  const rootBone = new THREE.Bone();
  rootBone.position.copy(bindBonePos[0]); // pelvis midpoint at frame 0
  const bones: THREE.Bone[] = [rootBone];
  for (let i = 1; i < BONE_DEFS.length; i++) {
    const b = new THREE.Bone();
    // local = world - rootWorld so that worldMatrix == translation(bindBonePos[i])
    b.position.copy(bindBonePos[i]).sub(bindBonePos[0]);
    rootBone.add(b);
    bones.push(b);
  }
  rootBone.updateMatrixWorld(true);

  const skeleton = new THREE.Skeleton(bones);

  const material = new THREE.MeshStandardMaterial({
    color:            "#b8cfe8",
    emissive:         "#1e3a5f",
    emissiveIntensity: 0.4,
    roughness:        0.65,
    metalness:        0.05,
    transparent:      true,
    opacity:          0.40,
    side:             THREE.DoubleSide,
  });

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.add(rootBone);
  mesh.bind(skeleton);
  mesh.castShadow = false;

  return { mesh, bones };
}

/* ═══════════════════════════════════════════════════════════════════
   Wire skeleton helpers
   ═══════════════════════════════════════════════════════════════════ */
const BONE_PAIRS: [string, string][] = [
  ["LASI","RASI"],["LPSI","RPSI"],["LASI","LPSI"],["RASI","RPSI"],
  ["LASI","LKNE"],["LKNE","LANK"],["LANK","LTOE"],["LANK","LHEE"],
  ["RASI","RKNE"],["RKNE","RANK"],["RANK","RTOE"],["RANK","RHEE"],
  ["LASI","STRN"],["RASI","STRN"],["STRN","C7"],
  ["C7","LSHO"],["C7","RSHO"],["C7","HEAD"],
  ["LSHO","LELB"],["LELB","LWRA"],
  ["RSHO","RELB"],["RELB","RWRA"],
];

function markerGroup(name: string) {
  if (["LASI","RASI","LPSI","RPSI"].includes(name))
    return { color:"#00d4ff", emissive:"#00aaff", size:0.017 };
  if (["STRN","C7"].includes(name))
    return { color:"#f000ff", emissive:"#cc00ff", size:0.015 };
  if (name === "HEAD")
    return { color:"#ff6ec7", emissive:"#ff2090", size:0.020 };
  if (["LSHO","RSHO","LELB","RELB","LWRA","RWRA"].includes(name))
    return { color:"#b388ff", emissive:"#7c3aed", size:0.014 };
  if (["LKNE","RKNE","LANK","RANK"].includes(name))
    return { color:"#00ffaa", emissive:"#00cc88", size:0.015 };
  return { color:"#ffe033", emissive:"#ffaa00", size:0.013 };
}

function orientToDir(group: THREE.Group, dir: THREE.Vector3) {
  const d = dir.clone().normalize();
  if (d.lengthSq() < 0.0001) return;
  if (Math.abs(d.dot(YUP)) > 0.9999) {
    group.quaternion.identity();
    if (d.y < 0) group.quaternion.setFromAxisAngle(XRIGHT, Math.PI);
  } else {
    group.quaternion.setFromUnitVectors(YUP, d);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Main animated scene component
   ═══════════════════════════════════════════════════════════════════ */
function AnimatedSkeleton({
  data, speed, paused, showForces,
}: {
  data: MotionData; speed: number; paused: boolean; showForces: boolean;
}) {
  const timeRef  = useRef(0);
  const nFrames  = data.nFrames;
  const frameDt  = 1 / data.effectiveRate;
  const markerNames = data.markerNames;

  // Wire marker/bone refs
  const markerMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
  const boneMeshes   = useRef<Map<string, THREE.Mesh>>(new Map());
  const headGhostRef = useRef<THREE.Mesh>(null!);

  // Force arrow refs
  const lfGroup = useRef<THREE.Group>(null!);
  const lfShaft = useRef<THREE.Mesh>(null!);
  const lfTip   = useRef<THREE.Mesh>(null!);
  const lfCop   = useRef<THREE.Mesh>(null!);
  const rfGroup = useRef<THREE.Group>(null!);
  const rfShaft = useRef<THREE.Mesh>(null!);
  const rfTip   = useRef<THREE.Mesh>(null!);
  const rfCop   = useRef<THREE.Mesh>(null!);

  // EMA state for smooth forces
  const smoothGRF1 = useRef([0, 0, 0]);
  const smoothGRF2 = useRef([0, 0, 0]);
  const smoothCOP1 = useRef([0, 0]);
  const smoothCOP2 = useRef([0, 0]);
  const EMA = 0.18;

  // Pre-compute frame positions
  const framePositions = useMemo(() =>
    data.frames.map((f) => {
      const m: Record<string, THREE.Vector3> = {};
      for (const name of markerNames) {
        const p = f.markers[name];
        if (p) m[name] = new THREE.Vector3(p[0], p[1], p[2]);
      }
      return m;
    }), [data, markerNames]);

  // ── Build SkinnedMesh once from bind pose (frame 0) ─────────────
  const { skinnedMesh, lbsBones } = useMemo(() => {
    const bindPos = getBoneWorldPositions(framePositions[0]);
    const built   = buildSkinnedMesh(bindPos);
    return { skinnedMesh: built.mesh, lbsBones: built.bones };
  }, [framePositions]);

  const maxGRF    = data.maxVerticalGRF || 1;
  const VIS_SCALE = 1.6;
  const GRF_THRESH = 0.015;

  // ── Force arrow updater ──────────────────────────────────────────
  const updateArrow = (
    group: THREE.Group, shaft: THREE.Mesh, tip: THREE.Mesh, copRing: THREE.Mesh,
    rawGRF: [number, number, number], rawCOP: [number, number],
    smoothGRF: MutableRefObject<number[]>,
    smoothCOP: MutableRefObject<number[]>,
  ) => {
    const a = EMA;
    smoothGRF.current[0] += a * (rawGRF[0] - smoothGRF.current[0]);
    smoothGRF.current[1] += a * (rawGRF[1] - smoothGRF.current[1]);
    smoothGRF.current[2] += a * (rawGRF[2] - smoothGRF.current[2]);
    smoothCOP.current[0] += a * (rawCOP[0] - smoothCOP.current[0]);
    smoothCOP.current[1] += a * (rawCOP[1] - smoothCOP.current[1]);

    const grfWorld = new THREE.Vector3(
      smoothGRF.current[0],
      smoothGRF.current[2],
      smoothGRF.current[1],
    );
    const mag     = grfWorld.length();
    const visible = mag > GRF_THRESH;
    group.visible   = visible;
    copRing.visible = visible;
    if (!visible) return;

    const visualLen = (mag / maxGRF) * VIS_SCALE;
    group.position.set(smoothCOP.current[0], 0, smoothCOP.current[1]);
    orientToDir(group, grfWorld);
    shaft.scale.y    = visualLen;
    shaft.position.y = visualLen * 0.5;
    tip.position.y   = visualLen + 0.028;
    copRing.position.set(smoothCOP.current[0], 0.002, smoothCOP.current[1]);
  };

  // ── Per-frame update ─────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!paused) timeRef.current += delta * speed;
    const total = nFrames * frameDt;
    const t  = ((timeRef.current % total) + total) % total;
    const fi = Math.min(Math.floor(t / frameDt), nFrames - 1);

    const pos    = framePositions[fi];
    const forces = data.frames[fi].forces;

    // Wire markers
    markerMeshes.current.forEach((mesh, name) => {
      if (pos[name]) mesh.position.copy(pos[name]);
    });
    // Head ghost sphere
    if (headGhostRef.current && pos["HEAD"]) {
      headGhostRef.current.position.copy(pos["HEAD"]);
    }

    // Wire bones
    BONE_PAIRS.forEach(([a, b], i) => {
      const mesh = boneMeshes.current.get(String(i));
      if (!mesh || !pos[a] || !pos[b]) return;
      const dir = pos[b].clone().sub(pos[a]);
      const len = dir.length();
      mesh.position.copy(pos[a].clone().lerp(pos[b], 0.5));
      mesh.scale.y = len;
      const q = new THREE.Quaternion();
      q.setFromUnitVectors(YUP, dir.clone().normalize());
      mesh.quaternion.copy(q);
    });

    // ── Update LBS bones ──
    const bonePos = getBoneWorldPositions(pos);
    // Root tracks the pelvis midpoint; children carry local offsets from Root
    // so that bone[i].worldMatrix.translation == bonePos[i] every frame.
    lbsBones[0].position.copy(bonePos[0]);
    for (let i = 1; i < lbsBones.length; i++) {
      lbsBones[i].position.copy(bonePos[i]).sub(bonePos[0]);
    }
    lbsBones[0].updateMatrixWorld(true);

    // Force arrows
    if (showForces) {
      updateArrow(lfGroup.current, lfShaft.current, lfTip.current, lfCop.current,
                  forces.grf1, forces.cop1, smoothGRF1, smoothCOP1);
      updateArrow(rfGroup.current, rfShaft.current, rfTip.current, rfCop.current,
                  forces.grf2, forces.cop2, smoothGRF2, smoothCOP2);
    } else {
      lfGroup.current.visible = false; lfCop.current.visible = false;
      rfGroup.current.visible = false; rfCop.current.visible = false;
    }
  });

  const initPos = framePositions[0];

  return (
    <group>
      {/* ── LBS ghost mesh ──────────────────────────────────────── */}
      <primitive object={skinnedMesh} />

      {/* ── Head sphere (driven by dedicated ref) ── */}
      <mesh position={initPos["HEAD"] ?? [0, 1.6, 0]}
            ref={headGhostRef}>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial color="#b8cfe8" emissive="#1e3a5f"
          emissiveIntensity={0.4} roughness={0.65} transparent opacity={0.40}
          side={THREE.DoubleSide} />
      </mesh>

      {/* ── Wire markers ─────────────────────────────────────────── */}
      {markerNames.map((name) => {
        const g = markerGroup(name);
        return (
          <mesh key={name} position={initPos[name] ?? [0, 0, 0]}
                ref={(m) => { if (m) markerMeshes.current.set(name, m as THREE.Mesh); }}>
            <sphereGeometry args={[g.size, 16, 16]} />
            <meshStandardMaterial color={g.color} emissive={g.emissive}
              emissiveIntensity={2.2} roughness={0.1} metalness={0.2} />
          </mesh>
        );
      })}

      {/* ── Wire bones ───────────────────────────────────────────── */}
      {BONE_PAIRS.map(([a, b], i) => {
        const pa = initPos[a] ?? new THREE.Vector3();
        const pb = initPos[b] ?? new THREE.Vector3();
        const dir = pb.clone().sub(pa);
        const len = dir.length();
        const q = new THREE.Quaternion();
        if (len > 0.001) q.setFromUnitVectors(YUP, dir.clone().normalize());
        return (
          <mesh key={i} position={pa.clone().lerp(pb, 0.5)} quaternion={q}
                scale={[1, len, 1]}
                ref={(m) => { if (m) boneMeshes.current.set(String(i), m as THREE.Mesh); }}>
            <cylinderGeometry args={[0.004, 0.006, 1, 8]} />
            <meshStandardMaterial color="#e0e0ff" emissive="#8080cc"
              emissiveIntensity={0.5} roughness={0.2} metalness={0.3} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* ── Left GRF arrow (red) ─────────────────────────────────── */}
      <group ref={lfGroup}>
        <mesh ref={lfShaft}>
          <cylinderGeometry args={[0.009, 0.009, 1, 10]} />
          <meshStandardMaterial color="#f87171" emissive="#ef4444"
            emissiveIntensity={1.5} transparent opacity={0.92} />
        </mesh>
        <mesh ref={lfTip}>
          <coneGeometry args={[0.022, 0.055, 10]} />
          <meshStandardMaterial color="#fca5a5" emissive="#f87171" emissiveIntensity={2} />
        </mesh>
      </group>
      <mesh ref={lfCop} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.040, 24]} />
        <meshStandardMaterial color="#f87171" emissive="#ef4444"
          emissiveIntensity={3} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Right GRF arrow (blue) ───────────────────────────────── */}
      <group ref={rfGroup}>
        <mesh ref={rfShaft}>
          <cylinderGeometry args={[0.009, 0.009, 1, 10]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6"
            emissiveIntensity={1.5} transparent opacity={0.92} />
        </mesh>
        <mesh ref={rfTip}>
          <coneGeometry args={[0.022, 0.055, 10]} />
          <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={2} />
        </mesh>
      </group>
      <mesh ref={rfCop} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.040, 24]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6"
          emissiveIntensity={3} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Ground ───────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.6} metalness={0.3}
          transparent opacity={0.95} />
      </mesh>

      {/* ── Force plates ─────────────────────────────────────────── */}
      {([
        { pos: [-0.18, -0.005, 0.06] as [number,number,number], color:"#6b1414", emissive:"#dd2200", side:"left" },
        { pos: [ 0.18, -0.005, 0.06] as [number,number,number], color:"#0f2d52", emissive:"#1155dd", side:"right" },
      ] as const).map(({ pos, color, emissive, side }) => (
        <mesh key={side} position={pos}>
          <boxGeometry args={[0.35, 0.007, 1.20]} />
          <meshStandardMaterial color={color} emissive={emissive}
            emissiveIntensity={1.0} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Camera
   ═══════════════════════════════════════════════════════════════════ */
function CameraRig({ autoRotate }: { autoRotate: boolean }) {
  return (
    <OrbitControls enablePan enableZoom enableRotate
      autoRotate={autoRotate} autoRotateSpeed={0.7}
      minDistance={0.5} maxDistance={7}
      target={[0, 0.85, 0]} />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Export
   ═══════════════════════════════════════════════════════════════════ */
export default function SkeletonViewerComponent({
  speed = 1, paused = false, showTrails = true,
  showForces = true, autoRotate = false,
}: {
  speed?: number; paused?: boolean; showTrails?: boolean;
  showForces?: boolean; autoRotate?: boolean;
}) {
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [loadError,  setLoadError ] = useState<string | null>(null);

  useEffect(() => {
    fetch("/motion_data.json")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: MotionData) => setMotionData(d))
      .catch((e) => setLoadError(e.message));
  }, []);

  if (loadError)
    return <div className="flex h-[600px] items-center justify-center bg-zinc-950 text-red-400 text-sm font-mono">
      Failed to load motion data: {loadError}</div>;

  if (!motionData)
    return <div className="flex h-[600px] items-center justify-center bg-zinc-950 text-zinc-500 text-sm font-mono">
      Loading motion capture data…</div>;

  return (
    <div style={{ width:"100%", height:600, background:"#0d0d1a", borderRadius:"0 0 12px 12px" }}>
      <Canvas
        camera={{ position:[1.8, 1.5, 2.8], fov:40 }}
        gl={{ antialias:true, alpha:false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.4 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#0d0d1a"]} />
        <fog attach="fog" args={["#0d0d1a", 5, 14]} />

        <ambientLight intensity={1.8} />
        <directionalLight position={[4, 6, 3]}  intensity={3.5} color="#ffffff" />
        <directionalLight position={[-3, 4, -2]} intensity={2.0} color="#dde6ff" />
        <directionalLight position={[0, -1, 3]}  intensity={1.0} color="#ffffff" />
        <directionalLight position={[0, 2, -4]}  intensity={1.2} color="#a5b4fc" />
        <pointLight position={[0, 1.8, 0.5]}     intensity={1.5} color="#ffffff" />
        <pointLight position={[-1, 0.5, 1]}       intensity={0.8} color="#7dd3fc" />
        <pointLight position={[1,  0.5, 1]}       intensity={0.8} color="#fca5a5" />

        <Grid args={[8, 8]} position={[0, -0.003, 0]}
          cellColor="#252540" sectionColor="#3f3f6a"
          fadeDistance={7} cellSize={0.2} sectionSize={1.0}
          infiniteGrid fadeStrength={1.2} />

        <AnimatedSkeleton data={motionData} speed={speed}
          paused={paused} showForces={showForces} />
        <CameraRig autoRotate={autoRotate} />
      </Canvas>
    </div>
  );
}
