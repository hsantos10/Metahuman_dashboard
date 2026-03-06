"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  ZapOff,
  Orbit,
} from "lucide-react";

const SkeletonViewer = dynamic(() => import("@/components/skeleton-viewer"), {
  ssr: false,
});

export default function ReconstructorPage() {
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showForces, setShowForces] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
          Texas A&amp;M · Biomechanics
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          3D Motion Viewer
        </h1>
        <p className="text-sm text-zinc-400">
          Real motion capture playback of subject s002 performing a <span className="text-white font-medium">Ballet High Leg</span> trial.
          21-marker skeletal model with bilateral Ground Reaction Force vectors — the
          input/output space of the ImprovedConvFormer model.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Markers", value: "21", sub: "Anatomical landmarks" },
          { label: "GRF Outputs", value: "10", sub: "5 per force plate" },
          { label: "Capture Rate", value: "50 Hz", sub: "Downsampled from 250 Hz" },
          { label: "Trial", value: "s002", sub: "Ballet High Leg" },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-xl font-bold text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3D Viewer + Controls */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live 3D Skeleton — Ballet High Leg</CardTitle>
              <CardDescription className="text-xs mt-1">
                Drag to rotate · Scroll to zoom · Right-click to pan
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {/* Control buttons */}
              <button
                onClick={() => setPaused((p) => !p)}
                className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                title={paused ? "Play" : "Pause"}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setShowForces((f) => !f)}
                className={`rounded-md border p-2 transition-colors ${
                  showForces
                    ? "border-blue-800 bg-blue-950/50 text-blue-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-600"
                }`}
                title={showForces ? "Hide forces" : "Show forces"}
              >
                {showForces ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setAutoRotate((r) => !r)}
                className={`rounded-md border p-2 transition-colors ${
                  autoRotate
                    ? "border-[color:var(--tamu)] bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]"
                    : "border-zinc-800 bg-zinc-900 text-zinc-600"
                }`}
                title="Auto-rotate"
              >
                <Orbit className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[10px] font-mono text-zinc-600 w-10 shrink-0">SPEED</span>
            <Slider
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              min={0.1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs font-mono text-zinc-400 w-10 text-right tabular-nums">{speed.toFixed(1)}×</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center bg-zinc-950 text-zinc-500 text-sm font-mono">
                Initializing WebGL…
              </div>
            }
          >
            <SkeletonViewer
              speed={speed}
              paused={paused}
              showForces={showForces}
              autoRotate={autoRotate}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Legend + Channel Reference side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Colour legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Marker Legend</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            {[
              { color: "bg-sky-400", label: "Pelvis (ASIS / PSIS)" },
              { color: "bg-fuchsia-400", label: "Spine (C7 / Sternum)" },
              { color: "bg-pink-400", label: "Head" },
              { color: "bg-violet-400", label: "Upper limbs" },
              { color: "bg-emerald-400", label: "Knees / Ankles" },
              { color: "bg-amber-400", label: "Feet (Toe / Heel)" },
              { color: "bg-zinc-500", label: "Bone segments" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-zinc-400">{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Force visualization legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Force Visualization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-6 rounded bg-red-500" />
              <span className="text-zinc-400">Left foot GRF — magnitude-scaled arrow</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-6 rounded bg-blue-500" />
              <span className="text-zinc-400">Right foot GRF — magnitude-scaled arrow</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-6 rounded bg-rose-950" />
              <span className="text-zinc-400">Left force plate zone</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-6 rounded bg-blue-950" />
              <span className="text-zinc-400">Right force plate zone</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRF Channel Reference */}
      <Card>
        <CardHeader>
          <CardTitle>GRF Channel Reference</CardTitle>
          <CardDescription className="text-xs">
            The ICF model simultaneously predicts 10 GRF channels per timestep from 21 marker trajectories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                foot: "Force Plate 1 (Left)",
                channels: [
                  { name: "gf1_ml", axis: "Mediolateral shear", r2: "0.690", color: "text-amber-400" },
                  { name: "gf1_vert", axis: "Vertical (body weight)", r2: "0.802", color: "text-emerald-400" },
                  { name: "gf1_ap", axis: "Anteroposterior", r2: "0.410", color: "text-orange-400" },
                  { name: "gf1_px", axis: "CoP mediolateral", r2: "0.862", color: "text-sky-400" },
                  { name: "gf1_pz", axis: "CoP anteroposterior", r2: "0.515", color: "text-sky-300" },
                ],
                borderColor: "border-l-blue-500",
              },
              {
                foot: "Force Plate 2 (Right)",
                channels: [
                  { name: "gf2_ml", axis: "Mediolateral shear", r2: "0.720", color: "text-amber-400" },
                  { name: "gf2_vert", axis: "Vertical (body weight)", r2: "0.761", color: "text-emerald-400" },
                  { name: "gf2_ap", axis: "Anteroposterior", r2: "0.311", color: "text-orange-400" },
                  { name: "gf2_px", axis: "CoP mediolateral", r2: "0.786", color: "text-sky-400" },
                  { name: "gf2_pz", axis: "CoP anteroposterior", r2: "0.697", color: "text-sky-300" },
                ],
                borderColor: "border-l-red-500",
              },
            ].map((fp) => (
              <div key={fp.foot} className={`rounded-lg border border-zinc-800 border-l-4 p-3 ${fp.borderColor}`}>
                <p className="mb-3 text-sm font-semibold text-zinc-200">{fp.foot}</p>
                <div className="space-y-1.5">
                  {fp.channels.map((ch) => (
                    <div key={ch.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] text-zinc-600 font-mono">{ch.name}</code>
                        <span className={`text-[11px] ${ch.color}`}>{ch.axis}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">R² {ch.r2}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-zinc-600">
            R² values shown are ICF GL LOSO means across 6 subjects. CoP position (px) is the easiest
            to predict; anteroposterior force (ap) is the hardest.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
