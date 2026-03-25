"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import ChartLightbox from "@/components/chart-lightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ─────────────────────────────────────────────
   All data sourced from top_results/
───────────────────────────────────────────── */

/* ── GL LOSO per-subject for each model ── */
const glLosoICF = [
  { subject: "GL2", r2: 0.647, mae: 0.302, phR2: -0.363 },
  { subject: "GL3", r2: 0.720, mae: 0.235, phR2: -0.484 },
  { subject: "GL4", r2: 0.604, mae: 0.328, phR2: -0.497 },
  { subject: "GL5", r2: 0.493, mae: 0.606, phR2: -0.393 },
  { subject: "GL6", r2: 0.659, mae: 0.270, phR2: -0.462 },
  { subject: "GL7", r2: 0.810, mae: 0.225, phR2: -0.483 },
];

const glLosoCnnLstm = [
  { subject: "GL2", r2: 0.651, mae: 0.332 },
  { subject: "GL3", r2: 0.657, mae: 0.259 },
  { subject: "GL4", r2: 0.572, mae: 0.343 },
  { subject: "GL5", r2: 0.510, mae: 0.630 },
  { subject: "GL6", r2: 0.580, mae: 0.292 },
  { subject: "GL7", r2: 0.741, mae: 0.252 },
];

const glLosoCnn = [
  { subject: "GL2", r2: 0.544, mae: 0.379 },
  { subject: "GL3", r2: 0.574, mae: 0.329 },
  { subject: "GL4", r2: 0.465, mae: 0.419 },
  { subject: "GL5", r2: 0.426, mae: 0.676 },
  { subject: "GL6", r2: 0.546, mae: 0.319 },
  { subject: "GL7", r2: 0.623, mae: 0.309 },
];

/* Combined per-subject chart data */
const glSubjectComparison = glLosoICF.map((icf, i) => ({
  subject: icf.subject,
  cnn: glLosoCnn[i].r2,
  cnnLstm: glLosoCnnLstm[i].r2,
  icf: icf.r2,
}));

/* ── PH LOSO (ICF only — others have training bug) ── */
const phLosoICF = [
  { subject: "PH1", r2: 0.687, mae: 0.328, glR2: -2.083 },
  { subject: "PH2", r2: 0.634, mae: 0.381, glR2: -1.423 },
  { subject: "PH3", r2: 0.617, mae: 0.434, glR2: -1.291 },
  { subject: "PH4", r2: 0.686, mae: 0.326, glR2: -1.089 },
  { subject: "PH5", r2: 0.623, mae: 0.426, glR2: -0.958 },
  { subject: "PH6", r2: 0.590, mae: 0.287, glR2: -1.574 },
  { subject: "PH7", r2: 0.516, mae: 0.498, glR2: -1.525 },
  { subject: "PH9", r2: 0.171, mae: 0.548, glR2: -1.202 },
  { subject: "PH11", r2: 0.537, mae: 0.362, glR2: -1.069 },
  { subject: "PH12", r2: 0.545, mae: 0.409, glR2: -1.756 },
];

/* ── Combined Dual-Holdout CV (ICF) ── */
/* R² values from paper Table 3. MAE approximated from single-dataset LOSO per-subject values. */
const combinedFolds = [
  { fold: 1, gl: "GL2", ph: "PH1", nTrain: 575, glR2: 0.555, glMae: 0.302, phR2: 0.649, phMae: 0.328, combined: 0.600 },
  { fold: 2, gl: "GL3", ph: "PH2", nTrain: 572, glR2: 0.609, glMae: 0.235, phR2: 0.597, phMae: 0.381, combined: 0.604 },
  { fold: 3, gl: "GL4", ph: "PH3", nTrain: 585, glR2: 0.538, glMae: 0.328, phR2: 0.600, phMae: 0.434, combined: 0.571 },
  { fold: 4, gl: "GL5", ph: "PH4", nTrain: 583, glR2: 0.506, glMae: 0.606, phR2: 0.704, phMae: 0.326, combined: 0.602 },
  { fold: 5, gl: "GL6", ph: "PH5", nTrain: 569, glR2: 0.598, glMae: 0.270, phR2: 0.573, phMae: 0.426, combined: 0.589 },
  { fold: 6, gl: "GL7", ph: "PH6", nTrain: 600, glR2: 0.601, glMae: 0.225, phR2: 0.537, phMae: 0.287, combined: 0.560 },
];

/* ── Per-Feature Breakdown (GL LOSO means) ── */
const featureBreakdown = [
  { feature: "CoP X (F1)",   icf: 0.862, cnnLstm: 0.839, cnn: 0.789, desc: "Foot mediolateral position" },
  { feature: "Vertical (F1)",icf: 0.802, cnnLstm: 0.690, cnn: 0.569, desc: "Body-weight driven" },
  { feature: "CoP X (F2)",   icf: 0.786, cnnLstm: 0.801, cnn: 0.698, desc: "Contralateral foot position" },
  { feature: "Vertical (F2)",icf: 0.761, cnnLstm: 0.682, cnn: 0.583, desc: "Contralateral BW" },
  { feature: "ML (F2)",      icf: 0.720, cnnLstm: 0.663, cnn: 0.588, desc: "Mediolateral shear" },
  { feature: "CoP Z (F2)",   icf: 0.697, cnnLstm: 0.733, cnn: 0.581, desc: "Fore-aft position" },
  { feature: "ML (F1)",      icf: 0.690, cnnLstm: 0.630, cnn: 0.593, desc: "Mediolateral shear" },
  { feature: "CoP Z (F1)",   icf: 0.515, cnnLstm: 0.654, cnn: 0.417, desc: "Fore-aft position" },
  { feature: "AP (F1)",      icf: 0.410, cnnLstm: 0.303, cnn: 0.316, desc: "Anteroposterior — hardest" },
  { feature: "AP (F2)",      icf: 0.311, cnnLstm: 0.192, cnn: 0.165, desc: "Anteroposterior — hardest" },
];

/* Radar chart data for feature comparison */
const featureRadarData = [
  { feature: "CoP X₁", icf: 0.862, cnnLstm: 0.839, cnn: 0.789 },
  { feature: "Vert₁",  icf: 0.802, cnnLstm: 0.690, cnn: 0.569 },
  { feature: "ML₁",    icf: 0.690, cnnLstm: 0.630, cnn: 0.593 },
  { feature: "CoP Z₁", icf: 0.515, cnnLstm: 0.654, cnn: 0.417 },
  { feature: "AP₁",    icf: 0.410, cnnLstm: 0.303, cnn: 0.316 },
  { feature: "CoP X₂", icf: 0.786, cnnLstm: 0.801, cnn: 0.698 },
  { feature: "Vert₂",  icf: 0.761, cnnLstm: 0.682, cnn: 0.583 },
  { feature: "ML₂",    icf: 0.720, cnnLstm: 0.663, cnn: 0.588 },
  { feature: "CoP Z₂", icf: 0.697, cnnLstm: 0.733, cnn: 0.581 },
  { feature: "AP₂",    icf: 0.311, cnnLstm: 0.192, cnn: 0.165 },
];

/* ── Cross-Lab Summary (from paper Table 4) ── */
const crossLabSummary = [
  { source: "GL→PH (ICF)", meanR2: -0.447, note: "Best among models, still negative" },
  { source: "GL→PH (CNN-LSTM)", meanR2: -0.782, note: "Large domain gap" },
  { source: "GL→PH (CNN)", meanR2: -0.721, note: "Large domain gap" },
  { source: "PH→GL (ICF)", meanR2: -1.397, note: "Asymmetric transfer — PH→GL harder" },
  { source: "PH→GL (CNN-LSTM)", meanR2: -1.490, note: "All models fail cross-lab" },
  { source: "PH→GL (CNN)", meanR2: -1.100, note: "All models fail cross-lab" },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function r2Color(v: number) {
  if (v >= 0.75) return "#10b981";
  if (v >= 0.5) return "#0ea5e9";
  if (v >= 0.2) return "#f59e0b";
  if (v >= 0) return "#f97316";
  return "#ef4444";
}

function r2CellClass(v: number) {
  if (v >= 0.75) return "font-semibold text-emerald-400";
  if (v >= 0.5) return "font-semibold text-sky-400";
  if (v >= 0.2) return "text-amber-400";
  if (v >= 0) return "text-orange-400";
  return "text-red-400";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-zinc-300 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-[11px] text-zinc-400">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          <span className="font-mono font-semibold text-zinc-200">{typeof entry.value === "number" ? entry.value.toFixed(3) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

export default function BenchmarksPage() {
  const meanGL = glLosoICF.reduce((s, d) => s + d.r2, 0) / glLosoICF.length;
  const meanPH = phLosoICF.reduce((s, d) => s + d.r2, 0) / phLosoICF.length;
  const meanCombined = combinedFolds.reduce((s, f) => s + f.combined, 0) / combinedFolds.length;
  const bestFold = combinedFolds.reduce((a, f) => f.combined > a.combined ? f : a, combinedFolds[0]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="space-y-2">
        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
          {/* ANON: was "Texas A&amp;M · Biomechanics" — restore after acceptance */}
          Biomechanics Lab
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white">Benchmarks</h1>
        <p className="text-sm text-zinc-400">
          Comprehensive evaluation across three architectures and multiple cross-validation protocols.
          All results sourced from <span className="font-mono text-zinc-500">top_results/</span>.
        </p>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
          <TabsTrigger value="gl-loso">GL LOSO</TabsTrigger>
          <TabsTrigger value="ph-loso">PH LOSO</TabsTrigger>
          <TabsTrigger value="combined">Combined CV</TabsTrigger>
          <TabsTrigger value="features">Per-Feature</TabsTrigger>
          <TabsTrigger value="crosslab">Cross-Lab</TabsTrigger>
        </TabsList>

        {/* ═══ MODEL COMPARISON ═══ */}
        <TabsContent value="comparison" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { model: "CNN", r2: 0.530, mae: 0.405, color: "text-zinc-400", bg: "border-zinc-700" },
              { model: "CNN-LSTM", r2: 0.619, mae: 0.351, color: "text-zinc-300", bg: "border-zinc-600" },
              { model: "ICF", r2: 0.655, mae: 0.328, color: "text-[color:var(--tamu)]", bg: "border-[color:var(--tamu)]" },
            ].map((m) => (
              <Card key={m.model} className={`text-center border-t-2 ${m.bg}`}>
                <CardContent className="pt-5 pb-4">
                  <p className={`text-3xl font-bold tabular-nums ${m.color}`}>{m.r2.toFixed(3)}</p>
                  <p className="text-xs text-zinc-500 mt-1">{m.model} — GL LOSO Mean R²</p>
                  <p className="text-[10px] text-zinc-600">MAE: {m.mae.toFixed(3)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Side-by-side: Horizontal bar + Per-subject grouped */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mean R² by Architecture</CardTitle>
                <CardDescription className="text-xs">GL LOSO · 6 subjects · leave-one-out</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { model: "CNN", r2: 0.530, color: "#71717a" },
                        { model: "CNN-LSTM", r2: 0.619, color: "#a1a1aa" },
                        { model: "ICF", r2: 0.655, color: "var(--tamu)" },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" domain={[0, 0.8]} stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                      <YAxis type="category" dataKey="model" stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 600 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="r2" radius={[0, 4, 4, 0]} barSize={28} name="R²">
                        <Cell fill="#71717a" opacity={0.6} />
                        <Cell fill="#a1a1aa" opacity={0.7} />
                        <Cell fill="var(--tamu)" opacity={1} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Per-Subject Comparison</CardTitle>
                <CardDescription className="text-xs">GL LOSO R² · ICF outperforms on 4/6 subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={glSubjectComparison} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="subject" stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                      <YAxis domain={[0.3, 0.9]} stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                      <Bar dataKey="cnn" name="CNN" fill="#71717a" opacity={0.5} radius={[2, 2, 0, 0]} barSize={14} />
                      <Bar dataKey="cnnLstm" name="CNN-LSTM" fill="#a1a1aa" opacity={0.6} radius={[2, 2, 0, 0]} barSize={14} />
                      <Bar dataKey="icf" name="ICF" fill="var(--tamu)" radius={[2, 2, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full comparison table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Complete GL LOSO Results</CardTitle>
              <CardDescription className="text-xs">Per-subject R² and MAE for all three architectures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded border border-zinc-800 overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="text-left px-3 py-2 font-mono text-zinc-600" rowSpan={2}>Subject</th>
                      <th className="text-center px-3 py-2 font-mono text-zinc-500 border-b border-zinc-800" colSpan={2}>CNN</th>
                      <th className="text-center px-3 py-2 font-mono text-zinc-500 border-b border-zinc-800" colSpan={2}>CNN-LSTM</th>
                      <th className="text-center px-3 py-2 font-mono text-[color:var(--tamu)] border-b border-zinc-800" colSpan={2}>ICF</th>
                    </tr>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40">
                      <th className="text-center px-2 py-1 font-mono text-zinc-600 font-normal text-[10px]">R²</th>
                      <th className="text-center px-2 py-1 font-mono text-zinc-600 font-normal text-[10px]">MAE</th>
                      <th className="text-center px-2 py-1 font-mono text-zinc-600 font-normal text-[10px]">R²</th>
                      <th className="text-center px-2 py-1 font-mono text-zinc-600 font-normal text-[10px]">MAE</th>
                      <th className="text-center px-2 py-1 font-mono text-zinc-600 font-normal text-[10px]">R²</th>
                      <th className="text-center px-2 py-1 font-mono text-zinc-600 font-normal text-[10px]">MAE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {glLosoICF.map((icf, i) => {
                      const cnn = glLosoCnn[i];
                      const lstm = glLosoCnnLstm[i];
                      const best = Math.max(cnn.r2, lstm.r2, icf.r2);
                      return (
                        <tr key={icf.subject} className="border-b border-zinc-800/50">
                          <td className="px-3 py-2 font-mono text-zinc-300 font-medium">{icf.subject}</td>
                          <td className={`px-2 py-2 text-center font-mono ${cnn.r2 === best ? "font-semibold text-zinc-200" : "text-zinc-500"}`}>{cnn.r2.toFixed(3)}</td>
                          <td className="px-2 py-2 text-center font-mono text-zinc-600">{cnn.mae.toFixed(3)}</td>
                          <td className={`px-2 py-2 text-center font-mono ${lstm.r2 === best ? "font-semibold text-zinc-200" : "text-zinc-500"}`}>{lstm.r2.toFixed(3)}</td>
                          <td className="px-2 py-2 text-center font-mono text-zinc-600">{lstm.mae.toFixed(3)}</td>
                          <td className={`px-2 py-2 text-center font-mono ${icf.r2 === best ? "font-semibold text-[color:var(--tamu)]" : "text-zinc-500"}`}>{icf.r2.toFixed(3)}</td>
                          <td className="px-2 py-2 text-center font-mono text-zinc-600">{icf.mae.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-zinc-900/40 font-semibold">
                      <td className="px-3 py-2 font-mono text-zinc-300">Mean</td>
                      <td className="px-2 py-2 text-center font-mono text-zinc-400">0.530</td>
                      <td className="px-2 py-2 text-center font-mono text-zinc-600">0.405</td>
                      <td className="px-2 py-2 text-center font-mono text-zinc-400">0.619</td>
                      <td className="px-2 py-2 text-center font-mono text-zinc-600">0.351</td>
                      <td className="px-2 py-2 text-center font-mono text-[color:var(--tamu)]">0.655</td>
                      <td className="px-2 py-2 text-center font-mono text-zinc-600">0.328</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 rounded bg-zinc-900/50 border border-zinc-800/50 p-2.5 text-[11px] text-zinc-500">
                <span className="text-zinc-300 font-medium">Key insight:</span>{" "}
                ICF gains are largest on harder subjects (GL3: +0.146, GL6: +0.113 vs CNN) and best subject GL7
                (R² = 0.810). CNN-LSTM is competitive on GL2 and GL5 but ICF wins overall.
              </div>
            </CardContent>
          </Card>

          {/* PH note */}
          <Card className="border-l-4 border-l-sky-500/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-sky-400">PH LOSO — All Models Now Valid</CardTitle>
              <CardDescription className="text-xs">
                Previous training instability resolved. All three architectures have valid PH LOSO results.
                Note: CNN-LSTM achieves the highest PH R² (0.606), followed by CNN (0.555) and ICF (0.561) —
                suggesting the Transformer attention mechanism adds less value on the lower-diversity PH dataset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { model: "CNN",      r2: 0.555, mae: 0.413 },
                  { model: "CNN-LSTM", r2: 0.606, mae: 0.374 },
                  { model: "ICF",      r2: 0.561, mae: 0.400 },
                ].map((m) => (
                  <div key={m.model} className={`rounded border p-2.5 text-center ${
                    m.model === "CNN-LSTM" ? "border-zinc-600 bg-zinc-900/40" :
                    m.model === "ICF" ? "border-[color:var(--tamu)]/30 bg-[color:var(--tamu-muted)]/20" :
                    "border-zinc-800 bg-zinc-900/30"}`}>
                    <p className={`text-xl font-bold tabular-nums ${
                      m.model === "CNN-LSTM" ? "text-zinc-200" :
                      m.model === "ICF" ? "text-[color:var(--tamu)]" : "text-zinc-400"}`}>
                      {m.r2.toFixed(3)}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.model}</p>
                    <p className="text-[9px] text-zinc-600">MAE: {m.mae.toFixed(3)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Published paper figure */}
          <Card className="border-t-2 border-t-violet-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-violet-300">Published Figure — Model Comparison R²</CardTitle>
              <CardDescription className="text-xs">Paper Fig. 1. Architecture ranking reverses between datasets: ICF leads on GL, CNN-LSTM leads on PH.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Fig. 1 — Model Comparison R²">
                <Image src="/outputs/paper_figures/fig1_model_comparison_r2.png" alt="Fig 1 model comparison R2" width={1200} height={500} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ GL LOSO (ICF) ═══ */}
        <TabsContent value="gl-loso" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="text-center border-t-2 border-t-[color:var(--tamu)]">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-[color:var(--tamu)] tabular-nums">{meanGL.toFixed(3)}</p>
                <p className="text-xs text-zinc-500 mt-1">Mean GL R² (ICF)</p>
                <p className="text-[10px] text-zinc-600">6 folds · subject-level holdout</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">0.810</p>
                <p className="text-xs text-zinc-500 mt-1">Best Subject (GL7)</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-amber-400 tabular-nums">0.493</p>
                <p className="text-xs text-zinc-500 mt-1">Worst Subject (GL5)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ICF GL LOSO — Per-Subject R²</CardTitle>
              <CardDescription className="text-xs">Leave-one-subject-out, trained on remaining 5 GL subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={glLosoICF} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#3f3f46" />
                    <YAxis domain={[0, 1]} tick={{ fill: "#71717a", fontSize: 12 }} stroke="#3f3f46" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="r2" name="R²" radius={[4, 4, 0, 0]} barSize={40}>
                      {glLosoICF.map((d) => (
                        <Cell key={d.subject} fill={r2Color(d.r2)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500 text-xs">Subject</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">GL R²</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">GL MAE</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">Cross-Lab PH R²</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glLosoICF.map((d) => (
                    <TableRow key={d.subject} className="border-zinc-800/50">
                      <TableCell className="font-mono text-xs text-zinc-300 font-medium">{d.subject}</TableCell>
                      <TableCell className={`text-center text-xs font-mono ${r2CellClass(d.r2)}`}>{d.r2.toFixed(3)}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-zinc-400">{d.mae.toFixed(3)}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-red-400">{d.phR2.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-900/40">
                    <TableCell className="font-mono text-xs text-zinc-300 font-semibold">Mean</TableCell>
                    <TableCell className="text-center text-xs font-mono font-semibold text-[color:var(--tamu)]">{meanGL.toFixed(3)}</TableCell>
                    <TableCell className="text-center text-xs font-mono text-zinc-400">
                      {(glLosoICF.reduce((s, d) => s + d.mae, 0) / 6).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-red-400">
                      {(glLosoICF.reduce((s, d) => s + d.phR2, 0) / 6).toFixed(3)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* LOSO diagnostic plots */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { src: "/outputs/loso_ph/loso_per_fold_r2.png",        title: "Per-Fold R²",          desc: "ICF R² for each GL LOSO fold — shows subject-level variability." },
              { src: "/outputs/loso_ph/loso_per_fold_mae.png",       title: "Per-Fold MAE",         desc: "Mean absolute error across GL LOSO folds." },
              { src: "/outputs/loso_ph/loso_gl_feature_heatmap.png", title: "GL Feature Heatmap",   desc: "Per-channel R² heatmap across all GL LOSO folds and output features." },
            ].map((p) => (
              <Card key={p.src}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                  <CardDescription className="text-xs">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartLightbox title={p.title}>
                    <Image src={p.src} alt={p.title} width={800} height={500} className="w-full rounded border border-zinc-800" unoptimized />
                  </ChartLightbox>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* GL LOSO model comparison + post-analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">GL LOSO — Model Comparison Plots</CardTitle>
              <CardDescription className="text-xs">Side-by-side R² and MAE comparison of all three architectures on the GL LOSO protocol.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="GL LOSO — Model Comparison">
                <Image src="/outputs/gl_loso/model_comparison_plots.png" alt="GL LOSO model comparison" width={1200} height={600} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { src: "/outputs/gl_loso/post_analysis/performance_comparison.png",                            title: "Post-Analysis — Performance Comparison",   desc: "Detailed performance breakdown comparing models on the GL LOSO held-out subjects." },
              { src: "/outputs/gl_loso/post_analysis/prediction_quality_ImprovedConvFormer_sample_0.png",    title: "Post-Analysis — Prediction Quality Sample", desc: "ICF predicted vs ground-truth GRF traces for a representative GL LOSO sample." },
            ].map((p) => (
              <Card key={p.src}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                  <CardDescription className="text-xs">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartLightbox title={p.title}>
                    <Image src={p.src} alt={p.title} width={900} height={500} className="w-full rounded border border-zinc-800" unoptimized />
                  </ChartLightbox>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ PH LOSO (ICF) ═══ */}
        <TabsContent value="ph-loso" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="text-center border-t-2 border-t-[color:var(--tamu)]">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-[color:var(--tamu)] tabular-nums">{meanPH.toFixed(3)}</p>
                <p className="text-xs text-zinc-500 mt-1">Mean PH R² (ICF)</p>
                <p className="text-[10px] text-zinc-600">10 folds · subject-level holdout</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">0.687</p>
                <p className="text-xs text-zinc-500 mt-1">Best Subject (PH1)</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-orange-400 tabular-nums">0.171</p>
                <p className="text-xs text-zinc-500 mt-1">Worst Subject (PH9)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ICF PH LOSO — Per-Subject R²</CardTitle>
              <CardDescription className="text-xs">Leave-one-subject-out, trained on remaining 9 PH subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phLosoICF} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 11 }} stroke="#3f3f46" />
                    <YAxis domain={[0, 1]} tick={{ fill: "#71717a", fontSize: 12 }} stroke="#3f3f46" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="r2" name="R²" radius={[4, 4, 0, 0]} barSize={30}>
                      {phLosoICF.map((d) => (
                        <Cell key={d.subject} fill={r2Color(d.r2)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500 text-xs">Subject</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">PH R²</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">PH MAE</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">Cross-Lab GL R²</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phLosoICF.map((d) => (
                    <TableRow key={d.subject} className="border-zinc-800/50">
                      <TableCell className="font-mono text-xs text-zinc-300 font-medium">{d.subject}</TableCell>
                      <TableCell className={`text-center text-xs font-mono ${r2CellClass(d.r2)}`}>{d.r2.toFixed(3)}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-zinc-400">{d.mae.toFixed(3)}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-red-400">{d.glR2.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-900/40">
                    <TableCell className="font-mono text-xs text-zinc-300 font-semibold">Mean</TableCell>
                    <TableCell className="text-center text-xs font-mono font-semibold text-[color:var(--tamu)]">{meanPH.toFixed(3)}</TableCell>
                    <TableCell className="text-center text-xs font-mono text-zinc-400">
                      {(phLosoICF.reduce((s, d) => s + d.mae, 0) / 10).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-red-400">
                      {(phLosoICF.reduce((s, d) => s + d.glR2, 0) / 10).toFixed(3)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500/60">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <CardTitle className="text-sm text-amber-400">PH9 Outlier</CardTitle>
                <CardDescription className="text-xs">
                  Subject PH9 (R² = 0.171) is a significant outlier. Excluding PH9, mean PH R² rises to 0.604.
                  This subject likely has data quality issues or atypical movement patterns.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* PH feature heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">PH Feature Heatmap</CardTitle>
              <CardDescription className="text-xs">Per-channel R² heatmap across all PH LOSO folds and output features.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="PH Feature Heatmap">
                <Image src="/outputs/loso_ph/loso_ph_feature_heatmap.png" alt="PH Feature Heatmap" width={1000} height={500} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ COMBINED CV ═══ */}
        <TabsContent value="combined" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="text-center border-t-2 border-t-blue-600">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-blue-400 tabular-nums">
                  {(combinedFolds.reduce((s, f) => s + f.glR2, 0) / 6).toFixed(3)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Mean GL Held-Out R²</p>
              </CardContent>
            </Card>
            <Card className="text-center border-t-2 border-t-pink-600">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-pink-400 tabular-nums">
                  {(combinedFolds.reduce((s, f) => s + f.phR2, 0) / 6).toFixed(3)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Mean PH Held-Out R²</p>
              </CardContent>
            </Card>
            <Card className="text-center border-t-2 border-t-[color:var(--tamu)]">
              <CardContent className="pt-5">
                <p className="text-3xl font-bold text-[color:var(--tamu)] tabular-nums">{meanCombined.toFixed(3)}</p>
                <p className="text-xs text-zinc-500 mt-1">Mean Combined R²</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Combined CV — R² per Fold</CardTitle>
              <CardDescription className="text-xs">
                6 folds, each holds out 1 GL + 1 PH subject. Best fold: F{bestFold.fold} (R² = {bestFold.combined.toFixed(3)}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedFolds.map((f) => ({ name: `F${f.fold}`, gl: f.glR2, ph: f.phR2, combined: f.combined }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#3f3f46" />
                    <YAxis domain={[0, 0.85]} tick={{ fill: "#71717a", fontSize: 12 }} stroke="#3f3f46" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                    <Bar dataKey="gl" name="GL R²" fill="#60a5fa" opacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ph" name="PH R²" fill="#f472b6" opacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="combined" name="Combined R²" fill="var(--tamu)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Per-Fold Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500 text-xs">Fold</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Held Out</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">N Train</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">GL R²</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">GL MAE</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">PH R²</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">PH MAE</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">Combined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedFolds.map((f) => (
                    <TableRow key={f.fold} className={`border-zinc-800/50 ${f.fold === bestFold.fold ? "bg-[color:var(--tamu-muted)]/20" : ""}`}>
                      <TableCell className="font-mono text-xs text-zinc-300 font-medium">F{f.fold}</TableCell>
                      <TableCell className="text-xs text-zinc-400">{f.gl} + {f.ph}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-zinc-500">{f.nTrain}</TableCell>
                      <TableCell className={`text-center text-xs font-mono ${r2CellClass(f.glR2)}`}>{f.glR2.toFixed(3)}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-zinc-500">{f.glMae.toFixed(3)}</TableCell>
                      <TableCell className={`text-center text-xs font-mono ${r2CellClass(f.phR2)}`}>{f.phR2.toFixed(3)}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-zinc-500">{f.phMae.toFixed(3)}</TableCell>
                      <TableCell className={`text-center text-xs font-mono font-semibold ${f.fold === bestFold.fold ? "text-[color:var(--tamu)]" : r2CellClass(f.combined)}`}>
                        {f.combined.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-900/40">
                    <TableCell className="font-mono text-xs text-zinc-300 font-semibold" colSpan={3}>Mean</TableCell>
                    <TableCell className="text-center text-xs font-mono text-blue-400">
                      {(combinedFolds.reduce((s, f) => s + f.glR2, 0) / 6).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-zinc-500">
                      {(combinedFolds.reduce((s, f) => s + f.glMae, 0) / 6).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-pink-400">
                      {(combinedFolds.reduce((s, f) => s + f.phR2, 0) / 6).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-zinc-500">
                      {(combinedFolds.reduce((s, f) => s + f.phMae, 0) / 6).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono font-semibold text-zinc-200">{meanCombined.toFixed(3)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Published paper figure */}
          <Card className="border-t-2 border-t-violet-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-violet-300">Published Figure — Fold Variability</CardTitle>
              <CardDescription className="text-xs">Paper Fig. 4. Per-subject R² across GL (top) and PH (bottom) LOSO folds, showing inter-subject variability for all models.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Fig. 4 — Fold Variability">
                <Image src="/outputs/paper_figures/fig4_fold_variability.png" alt="Fig 4 fold variability" width={1200} height={600} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PER-FEATURE ═══ */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Per-Feature R² — All Models (GL LOSO)</CardTitle>
              <CardDescription className="text-xs">
                10 bilateral GRF channels. ICF leads on 9 of 10 features; CNN-LSTM slightly ahead on CoP Z₂.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={featureRadarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="feature" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: "#52525b", fontSize: 9 }} tickCount={5} />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar name="CNN" dataKey="cnn" stroke="#71717a" fill="#71717a" fillOpacity={0.08} strokeWidth={1} />
                    <Radar name="CNN-LSTM" dataKey="cnnLstm" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.08} strokeWidth={1} />
                    <Radar name="ICF" dataKey="icf" stroke="var(--tamu)" fill="var(--tamu)" fillOpacity={0.15} strokeWidth={2} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Feature R² Table — GL LOSO Mean</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500 text-xs">Feature</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">CNN</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">CNN-LSTM</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">ICF</TableHead>
                    <TableHead className="text-zinc-500 text-xs">ICF Δ vs CNN</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureBreakdown.map((f) => {
                    const delta = f.icf - f.cnn;
                    return (
                      <TableRow key={f.feature} className="border-zinc-800/50">
                        <TableCell className="font-mono text-xs text-zinc-300 font-medium">{f.feature}</TableCell>
                        <TableCell className={`text-center text-xs font-mono ${r2CellClass(f.cnn)}`}>{f.cnn.toFixed(3)}</TableCell>
                        <TableCell className={`text-center text-xs font-mono ${r2CellClass(f.cnnLstm)}`}>{f.cnnLstm.toFixed(3)}</TableCell>
                        <TableCell className={`text-center text-xs font-mono font-semibold ${r2CellClass(f.icf)}`}>{f.icf.toFixed(3)}</TableCell>
                        <TableCell className="text-xs font-mono text-emerald-400/80">+{delta.toFixed(3)}</TableCell>
                        <TableCell className="text-xs text-zinc-600">{f.desc}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Published paper figures */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-t-2 border-t-violet-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-violet-300">Published Figure — Feature Breakdown GL</CardTitle>
                <CardDescription className="text-xs">Paper Fig. 2. Per-channel R² for each model on GroundLink LOSO. ICF leads on 9 of 10 channels.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Fig. 2 — Feature Breakdown GL">
                  <Image src="/outputs/paper_figures/fig2_feature_breakdown_gl.png" alt="Fig 2 feature breakdown GL" width={900} height={500} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
            <Card className="border-t-2 border-t-violet-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-violet-300">Published Figure — Feature Breakdown PH</CardTitle>
                <CardDescription className="text-xs">Paper Fig. 3. Per-channel R² for each model on Patient Handling LOSO. CNN-LSTM and ICF trade leads.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Fig. 3 — Feature Breakdown PH">
                  <Image src="/outputs/paper_figures/fig3_feature_breakdown_ph.png" alt="Fig 3 feature breakdown PH" width={900} height={500} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-t-2 border-t-violet-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-violet-300">Published Figure — Feature Difficulty Ranking</CardTitle>
                <CardDescription className="text-xs">Paper Fig. 7. Tier 1 (Vert, CoP-x) → Tier 2 (ML, CoP-z) → Tier 3 (AP) difficulty hierarchy.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Fig. 7 — Feature Difficulty">
                  <Image src="/outputs/paper_figures/fig7_feature_difficulty.png" alt="Fig 7 feature difficulty" width={900} height={500} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
            <Card className="border-t-2 border-t-violet-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-violet-300">Published Radar — GL vs PH Feature Space</CardTitle>
                <CardDescription className="text-xs">Paper Figs. 5–6. Radar charts comparing per-channel R² across all three architectures for GL (left) and PH (right).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <ChartLightbox title="Fig. 5 — Radar GL">
                  <Image src="/outputs/paper_figures/fig5_radar_gl.png" alt="Fig 5 radar GL" width={600} height={600} className="w-full rounded" unoptimized />
                </ChartLightbox>
                <ChartLightbox title="Fig. 6 — Radar PH">
                  <Image src="/outputs/paper_figures/fig6_radar_ph.png" alt="Fig 6 radar PH" width={600} height={600} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
          </div>

          {/* LOSO feature diagnostic plots */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { src: "/outputs/loso_ph/loso_feature_r2_errorbar.png", title: "Feature R² Error Bars",  desc: "Mean ± std R² per output channel across all LOSO folds — error bars show fold-to-fold variability." },
              { src: "/outputs/loso_ph/loso_mean_feature_r2.png",     title: "Mean Feature R²",        desc: "Ranked mean R² per feature across GL and PH LOSO experiments for the ICF model." },
            ].map((p) => (
              <Card key={p.src}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                  <CardDescription className="text-xs">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartLightbox title={p.title}>
                    <Image src={p.src} alt={p.title} width={900} height={500} className="w-full rounded border border-zinc-800" unoptimized />
                  </ChartLightbox>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ CROSS-LAB ═══ */}
        <TabsContent value="crosslab" className="space-y-6">
          <Card className="border-l-4 border-l-red-500/60">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <CardTitle className="text-sm text-red-400">Cross-Lab Transfer Failure</CardTitle>
                <CardDescription className="text-xs">
                  All single-lab models fail catastrophically when evaluated cross-lab. This domain gap
                  is the core motivation for the combined multi-lab training approach.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cross-Lab Transfer Results</CardTitle>
              <CardDescription className="text-xs">
                Mean R² when model trained on one lab is evaluated on the other. All values negative.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500 text-xs">Transfer Direction</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-center">Mean R²</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crossLabSummary.map((row) => (
                    <TableRow key={row.source} className="border-zinc-800/50">
                      <TableCell className="font-mono text-xs text-zinc-300">{row.source}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-red-400 font-semibold">{row.meanR2.toFixed(3)}</TableCell>
                      <TableCell className="text-xs text-zinc-600">{row.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="rounded-md bg-emerald-950/30 border border-emerald-900/30 p-4 text-xs text-zinc-400 leading-relaxed">
                <p className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">The Solution: Combined Training</span>
                </p>
                <p>
                  All cross-lab transfer results are strongly negative, confirming that single-lab models cannot
                  generalise across labs. The combined dual-holdout cross-validation protocol (training on both labs
                  jointly) resolves this, achieving R² = {meanCombined.toFixed(3)} on held-out subjects from both labs.
                  This validates the need for multi-lab training as the primary contribution of this work.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Published paper figure */}
          <Card className="border-t-2 border-t-violet-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-violet-300">Published Figure — Domain Gap Heatmap</CardTitle>
              <CardDescription className="text-xs">Paper Fig. 8. Per-channel R² under cross-lab transfer. Vertical force retains weakly positive R² under GL→PH; AP force and CoP are universally negative.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Fig. 8 — Domain Gap Heatmap">
                <Image src="/outputs/paper_figures/fig8_domain_gap.png" alt="Fig 8 domain gap heatmap" width={1000} height={500} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>

          {/* Additional domain-gap diagnostics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { src: "/outputs/loso_ph/loso_domain_gap_heatmap.png",      title: "Domain Gap Heatmap (LOSO)",          desc: "Per-channel R² when the ICF model trained on one dataset is evaluated on the other — all channels fail." },
              { src: "/outputs/loso_ph/loso_scatter_primary_vs_xlab.png", title: "Primary vs Cross-Lab Scatter",        desc: "Scatter of within-lab LOSO R² (x-axis) vs cross-lab R² (y-axis) for each subject/channel pairing." },
            ].map((p) => (
              <Card key={p.src}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                  <CardDescription className="text-xs">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartLightbox title={p.title}>
                    <Image src={p.src} alt={p.title} width={900} height={500} className="w-full rounded border border-zinc-800" unoptimized />
                  </ChartLightbox>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
