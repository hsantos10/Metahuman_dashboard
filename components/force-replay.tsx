"use client";

/*
 * Force replay: a held-out GroundLink trial in 3D with the measured ground reaction force and the force each model
 * predicted, both drawn at their centre of pressure. Data come from public/inference/*.json, written by
 * scripts/export_inference.py from the saved fold predictions (forces in body weights, positions in metres).
 *
 * "Model's view" animates the pipeline's own input transform: subtract the pelvis, rotate by the trial's heading
 * angle. With co-rotated targets the forces turn with the body; with plate-frame targets (the old pipeline) they do
 * not, which is the frame mismatch of Sec. IV-B.
 */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Html, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { buildBody, type BodyStyle } from "./mannequin";

export type Vec3 = [number, number, number];
export interface PlateSeries { F: Vec3[]; cop: [number, number][]; loaded?: boolean[] }
export interface TrialData {
  id: string; label: string; subject: string; heldOut: string; rate: number; n: number;
  massKg: number; heightM: number; headingDeg: number;
  markers: string[]; displayOnly: string[]; positions: Vec3[][];
  truth: { p1: PlateSeries; p2: PlateSeries };
  preds: Record<string, { p1: PlateSeries; p2: PlateSeries }>;
  metrics: Record<string, { r2: number; vert_r2: number; vert_rmse_pbw: number; cop_cm: number | null }>;
}

/** Playback state shared between the page (writes it in effects and handlers) and the scene (reads it per frame). */
export interface ReplayState {
  frame: number;            // float frame index
  playing: boolean;
  speed: number;
  view: number;             // target: 0 lab, 1 model's view
  coRotated: boolean;       // in the model's view: co-rotated vs plate-frame force targets
}
export type ReplayControls = MutableRefObject<ReplayState>;

export const COLORS = { truth: "#e4e4e7", loso: "#f59e0b", trial: "#a78bfa", bone: "#71717a", joint: "#a1a1aa" };
export type Theme = "dark" | "light";
const THEME = {
  dark: { bg: "#09090b", truth: "#ececef", loso: "#f59e0b", trial: "#a78bfa", body: "#c7ccd3", marker: "#22d3ee", cell: "#1f1f23", section: "#34343a", shadow: 0.55 },
  light: { bg: "#ffffff", truth: "#27272a", loso: "#e8590c", trial: "#7c3aed", body: "#b4bcc6", marker: "#0e7490", cell: "#ececee", section: "#d9d9de", shadow: 0.35 },
};
const BW_TO_M = 0.9;      // 1 body weight drawn as 0.9 m


/* ---------- geometry helpers ---------- */
const UP = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpQ = new THREE.Quaternion();

/** arrow = shaft cylinder (unit height) + cone tip; origin at the CoP, vector in metres */
function placeArrow(g: THREE.Group, origin: THREE.Vector3, v: THREE.Vector3) {
  const len = v.length();
  g.visible = len > 0.02;
  if (!g.visible) return;
  const head = Math.min(0.08, len * 0.35);
  g.position.copy(origin);
  g.quaternion.copy(tmpQ.setFromUnitVectors(UP, tmpD.copy(v).normalize()));
  const [shaft, tip] = g.children as THREE.Mesh[];
  shaft.scale.set(1, len - head, 1);
  shaft.position.set(0, (len - head) / 2, 0);
  tip.scale.set(1, head / 0.08, 1);
  tip.position.set(0, len - head / 2, 0);
}

function Arrow({ color, opacity = 1, radius = 0.014, refCb }: { color: string; opacity?: number; radius?: number; refCb: (g: THREE.Group | null) => void }) {
  return (
    <group ref={refCb} visible={false}>
      {/* drawn on top of the body (no depth test), as force vectors usually are in biomechanics figures */}
      <mesh renderOrder={10}>
        <cylinderGeometry args={[radius, radius, 1, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} depthTest={false} roughness={0.5} />
      </mesh>
      <mesh renderOrder={10}>
        <coneGeometry args={[radius * 2.5, 0.08, 20]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} depthTest={false} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ---------- scene ---------- */
function Scene({ data, predKey, compareKey, ctl, showHeading = true, theme = "dark", showMarkers = true, body = "capsule" }:
  { data: TrialData; predKey: string; compareKey: string | null; ctl: ReplayControls; showHeading?: boolean; theme?: Theme; showMarkers?: boolean; body?: BodyStyle }) {
  const TH = THEME[theme];
  const mann = useMemo(() => buildBody(body, theme), [body, theme]);
  const idx = useMemo(() => Object.fromEntries(data.markers.map((m, i) => [m, i])), [data]);
  const theta = (data.headingDeg * Math.PI) / 180;

  // pelvis track (mean of the four pelvis markers, as subtract_pelvis_root) and the trial-mean pelvis for the lab view
  const pelvis = useMemo(() => {
    const ids = ["LASI", "RASI", "LPSI", "RPSI"].map((m) => idx[m]).filter((i) => i !== undefined);
    return data.positions.map((f) => {
      const p = [0, 0, 0];
      ids.forEach((i) => { p[0] += f[i][0]; p[1] += f[i][1]; p[2] += f[i][2]; });
      return p.map((v) => v / ids.length) as Vec3;
    });
  }, [data, idx]);
  const centre = useMemo(() => {
    const c = [0, 0];
    pelvis.forEach((p) => { c[0] += p[0]; c[1] += p[2]; });
    return [c[0] / pelvis.length, c[1] / pelvis.length];
  }, [pelvis]);

  const jointRefs = useRef<(THREE.Mesh | null)[]>([]);
  const arrows = useRef<Record<string, THREE.Group | null>>({});
  const copRefs = useRef<Record<string, THREE.Mesh | null>>({});
  const trails = useMemo(() => {
    const out: Record<string, THREE.Line> = {};
    for (const [key, color] of [["truth", TH.truth], ["pred", TH.loso], ["cmp", TH.trial]] as const)
      for (const p of ["p1", "p2"]) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(30 * 3), 3));
        out[`${key}-${p}`] = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }));
      }
    return out;
  }, [TH]);
  const fwdRef = useRef<THREE.Group | null>(null);
  const tView = useRef(0);
  const pts = useMemo(() => data.markers.map(() => new THREE.Vector3()), [data]);
  const pelvisV = useMemo(() => new THREE.Vector3(), []);
  const TRAIL = 30;

  useFrame((_, dt) => {
    // advance time
    const st = ctl.current;
    if (st.playing) {
      st.frame += dt * data.rate * st.speed;
      if (st.frame >= data.n - 1) st.frame = 0;
    }
    tView.current += (st.view - tView.current) * Math.min(1, dt * 3);
    const t = tView.current;
    const fi = Math.max(0, Math.min(data.n - 1, st.frame));
    const f0 = Math.floor(fi), f1 = Math.min(data.n - 1, f0 + 1), w = fi - f0;

    // frame transform: lab (centred on the trial-mean pelvis) -> model's view (pelvis-centred, heading-aligned)
    const pl0 = pelvis[f0], pl1 = pelvis[f1];
    const pelX = pl0[0] + (pl1[0] - pl0[0]) * w, pelZ = pl0[2] + (pl1[2] - pl0[2]) * w;
    const ox = centre[0] + t * (pelX - centre[0]), oz = centre[1] + t * (pelZ - centre[1]);
    const c = Math.cos(t * theta), s = Math.sin(t * theta);
    const xf = (out: THREE.Vector3, x: number, y: number, z: number) => {
      const dx = x - ox, dz = z - oz;
      return out.set(c * dx - s * dz, y, s * dx + c * dz);
    };
    const rot = (out: THREE.Vector3, v: Vec3, rotate: boolean) =>
      rotate ? out.set(c * v[0] - s * v[2], v[1], s * v[0] + c * v[2]) : out.set(v[0], v[1], v[2]);

    // markers and bones
    const P0 = data.positions[f0], P1 = data.positions[f1];
    for (let i = 0; i < pts.length; i++) {
      xf(pts[i], P0[i][0] + (P1[i][0] - P0[i][0]) * w, P0[i][1] + (P1[i][1] - P0[i][1]) * w, P0[i][2] + (P1[i][2] - P0[i][2]) * w);
      const j = jointRefs.current[i];
      if (j) j.position.copy(pts[i]);
    }
    xf(pelvisV, pelX, pl0[1] + (pl1[1] - pl0[1]) * w, pelZ);
    mann.update((m: string) => (idx[m] !== undefined ? pts[idx[m]] : undefined));
    if (fwdRef.current) {   // the trial's heading (model +Z, display -Z after the full rotation), on the floor under the pelvis
      fwdRef.current.position.set(pelvisV.x, 0.003, pelvisV.z);
      fwdRef.current.rotation.set(0, Math.PI - (t - 1) * theta, 0);
    }

    // forces at the CoP (lab vectors; rotated with the frame only when targets are co-rotated)
    const rotateForces = st.coRotated;
    const series: [string, { p1: PlateSeries; p2: PlateSeries } | undefined][] = [
      ["truth", data.truth], ["pred", data.preds[predKey]], ["cmp", compareKey ? data.preds[compareKey] : undefined],
    ];
    for (const [key, ser] of series) {
      for (const p of ["p1", "p2"] as const) {
        const g = arrows.current[`${key}-${p}`], cop = copRefs.current[`${key}-${p}`], trail = trails[`${key}-${p}`];
        if (!g) continue;
        if (!ser) { g.visible = false; if (cop) cop.visible = false; if (trail) trail.visible = false; continue; }
        const S = ser[p], loadedTrue = data.truth[p].loaded?.[f0] ?? true;
        const F0 = S.F[f0], F1 = S.F[f1];
        const Fv: Vec3 = [F0[0] + (F1[0] - F0[0]) * w, F0[1] + (F1[1] - F0[1]) * w, F0[2] + (F1[2] - F0[2]) * w];
        const C0 = S.cop[f0], C1 = S.cop[f1];
        const show = loadedTrue || Fv[1] > 0.05;
        xf(tmpA, C0[0] + (C1[0] - C0[0]) * w, 0.004, C0[1] + (C1[1] - C0[1]) * w);
        rot(tmpB, Fv, rotateForces).multiplyScalar(BW_TO_M);   // plate-frame targets keep the lab orientation
        if (show) placeArrow(g, tmpA, tmpB); else g.visible = false;
        if (cop) { cop.visible = show; cop.position.copy(tmpA); }
        if (trail) {
          const arr = (trail.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          let k = 0;
          for (let q = Math.max(0, f0 - TRAIL + 1); q <= f0; q++) {
            const cq = S.cop[q];
            xf(tmpD, cq[0], 0.003, cq[1]);
            arr[k++] = tmpD.x; arr[k++] = tmpD.y; arr[k++] = tmpD.z;
          }
          const cnt = k / 3;
          for (; k < TRAIL * 3; k++) arr[k] = arr[k - 3];
          trail.geometry.setDrawRange(0, cnt);
          trail.geometry.attributes.position.needsUpdate = true;
          trail.visible = show && cnt > 1;
        }
      }
    }
  });

  const arrowSpecs: [string, string, number, number][] = [
    ["truth", TH.truth, 1, 0.019], ["pred", predKey.startsWith("trial") ? TH.trial : TH.loso, 0.92, 0.016],
    ["cmp", TH.trial, 0.8, 0.013],
  ];
  return (
    <>
      <hemisphereLight args={["#ffffff", theme === "light" ? "#b8b8c0" : "#2a2a30", theme === "light" ? 0.9 : 0.75]} />
      <directionalLight position={[2.5, 4.5, 2]} intensity={theme === "light" ? 1.6 : 1.9} />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.45} />
      <Grid args={[8, 8]} cellSize={0.25} cellThickness={0.5} sectionSize={1} sectionThickness={1}
            cellColor={TH.cell} sectionColor={TH.section} fadeDistance={8} infiniteGrid />
      <ContactShadows position={[0, 0.001, 0]} scale={6} blur={2.4} far={2.2} opacity={TH.shadow} resolution={1024} />
      <primitive object={mann.group} />
      {data.markers.map((m, i) => (
        <mesh key={m} ref={(el) => { jointRefs.current[i] = el; }} visible={showMarkers && !data.displayOnly.includes(m)}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color={TH.marker} emissive={TH.marker} emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
      ))}
      {arrowSpecs.flatMap(([key, color, op, r]) => (["p1", "p2"] as const).map((p) => (
        <group key={`${key}-${p}`}>
          <Arrow color={color} opacity={op} radius={r} refCb={(g) => { arrows.current[`${key}-${p}`] = g; }} />
          <mesh ref={(el) => { copRefs.current[`${key}-${p}`] = el; }} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[key === "truth" ? 0.03 : 0.022, 20]} />
            <meshBasicMaterial color={color} transparent opacity={key === "truth" ? 0.85 : 0.7} />
          </mesh>
          <primitive object={trails[`${key}-${p}`]} />
        </group>
      )))}
      <group ref={fwdRef} visible={showHeading}>
        <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.05, 0.14, 3]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
        </mesh>
        {showHeading && (
          <Html position={[0, 0.02, 0.42]} center style={{ pointerEvents: "none" }}>
            <span style={{ color: "#67e8f9", fontSize: 10, whiteSpace: "nowrap" }}>heading</span>
          </Html>
        )}
      </group>
    </>
  );
}

function CameraPreset({ preset }: { preset: string }) {
  const { camera } = useThree();
  useEffect(() => {
    const pos: Record<string, Vec3> = { side: [2.7, 1.2, 0.1], front: [0.1, 1.2, 2.7], top: [0.01, 3.6, 0.01], iso: [1.9, 1.5, 1.9] };
    const p = pos[preset] ?? pos.iso;
    camera.position.set(...p);
    camera.lookAt(0, 0.8, 0);
  }, [preset, camera]);
  return null;
}

export default function ForceReplay({ data, predKey, compareKey, ctl, cameraPreset, showHeading = true, theme = "dark", showMarkers = true, body = "capsule" }:
  { data: TrialData; predKey: string; compareKey: string | null; ctl: ReplayControls; cameraPreset: string; showHeading?: boolean; theme?: Theme; showMarkers?: boolean; body?: BodyStyle }) {
  return (
    <Canvas camera={{ position: [1.9, 1.5, 1.9], fov: 45 }} dpr={[1, 2]} style={{ background: THEME[theme].bg }}>
      <CameraPreset preset={cameraPreset} />
      <Scene data={data} predKey={predKey} compareKey={compareKey} ctl={ctl} showHeading={showHeading} theme={theme} showMarkers={showMarkers} body={body} />
      <OrbitControls target={[0, 0.8, 0]} enableDamping makeDefault />
    </Canvas>
  );
}
