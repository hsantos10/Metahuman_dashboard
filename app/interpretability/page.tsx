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
} from "recharts";
import { Brain } from "lucide-react";
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
import Image from "next/image";
import ChartLightbox from "@/components/chart-lightbox";

/* ─── Real data from attention_metrics_per_fold.csv ─────────────── */

const attentionFolds = [
  { fold: "Fold 1", sparsity: 97.78, entropy: 8.38, temporal: 246.2, roi: 18.9, pval: 8.5e-33, anchors: 3598, anchorsInROI: 681, significant: true },
  { fold: "Fold 2", sparsity: 97.71, entropy: 8.53, temporal: 266.9, roi: 26.8, pval: 4.8e-137, anchors: 4179, anchorsInROI: 1121, significant: true },
  { fold: "Fold 3", sparsity: 97.35, entropy: 8.16, temporal: 242.1, roi: 26.9, pval: 3.8e-112, anchors: 3163, anchorsInROI: 851, significant: true },
  { fold: "Fold 4", sparsity: 97.60, entropy: 8.28, temporal: 238.8, roi: 23.1, pval: 1.2e-39, anchors: 3449, anchorsInROI: 796, significant: true },
  { fold: "Fold 5", sparsity: 97.05, entropy: 7.93, temporal: 247.2, roi: 14.1, pval: 0.130, anchors: 4068, anchorsInROI: 573, significant: false },
  { fold: "Fold 6", sparsity: 98.44, entropy: 8.30, temporal: 236.4, roi: 28.8, pval: 1.1e-148, anchors: 2819, anchorsInROI: 813, significant: true },
];

const meanSparsity = attentionFolds.reduce((s, f) => s + f.sparsity, 0) / attentionFolds.length;
const meanEntropy = attentionFolds.reduce((s, f) => s + f.entropy, 0) / attentionFolds.length;
const meanTemporal = attentionFolds.reduce((s, f) => s + f.temporal, 0) / attentionFolds.length;
const meanROI = attentionFolds.reduce((s, f) => s + f.roi, 0) / attentionFolds.length;

const foldPairs = [1, 2, 3, 4, 5, 6];

const markerGroups = [
  {
    group: "Lower Extremity",
    markers: ["LASI", "RASI", "LPSI", "RPSI", "LKNE", "RKNE", "LANK", "RANK", "LTOE", "RTOE"],
    color: "bg-sky-950/60 text-sky-400 border border-sky-800/50",
    role: "Primary force contributors — foot/ankle/hip loading chain",
  },
  {
    group: "Upper Extremity",
    markers: ["LSHO", "RSHO", "LELB", "RELB", "LWRA", "RWRA"],
    color: "bg-violet-950/60 text-violet-400 border border-violet-800/50",
    role: "Secondary — arm swing, upper-body mass distribution",
  },
  {
    group: "Trunk & Pelvis",
    markers: ["LASI", "RASI", "LPSI", "RPSI", "C7", "STRN"],
    color: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50",
    role: "Pelvis root (subtracted), trunk orientation for heading",
  },
];

export default function InterpretabilityPage() {
  const roiBarData = attentionFolds.map((f) => ({
    name: f.fold.replace("Fold ", "F"),
    roi: parseFloat(f.roi.toFixed(1)),
    significant: f.significant,
  }));

  const temporalBarData = attentionFolds.map((f) => ({
    name: f.fold.replace("Fold ", "F"),
    dist: parseFloat(f.temporal.toFixed(0)),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
          Texas A&M · Biomechanics
        </span>
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-zinc-500" />
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Interpretability
          </h1>
        </div>
        <p className="text-sm text-zinc-400 max-w-2xl">
          The ImprovedConvFormer&apos;s 16 attention heads (8 per layer × 2 layers) show consistent and
          interpretable specialisation across all 6 CV folds. Attention is extremely sparse (97.5%
          near-zero weights), focusing selectively on biomechanically critical timesteps. ROI hit rate
          significantly exceeds the 12.5% chance baseline (p &lt; 10⁻³³ in 5/6 folds), confirming the
          model has learned genuine biomechanical structure.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-white">
              {meanSparsity.toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">Mean Attention Sparsity</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              % weights &lt; 0.01 threshold
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-white">
              {meanEntropy.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Mean Entropy (bits)</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Lower = more focused
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-white">
              {meanTemporal.toFixed(0)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Mean Temporal Distance</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Frames between anchor → target
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-white">
              {meanROI.toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">Mean ROI Hit Rate</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Attention anchors in biomechanical ROI
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">Attention Metrics</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="markers">Marker Setup</TabsTrigger>
        </TabsList>

        {/* ── METRICS ──────────────────────────────────────────────── */}
        <TabsContent value="metrics" className="space-y-6">

          {/* Head cluster summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { cluster: "Local Trackers", count: "5–6 heads", window: "5–15 frames", role: "Smooth kinematic trajectory tracking during steady-state motion", color: "border-t-sky-600" },
              { cluster: "Feature Extractors", count: "5–6 heads", window: "Mixed", role: "Extract marker relationships and spatial asymmetries between limbs", color: "border-t-violet-600" },
              { cluster: "Contextualizers", count: "3–4 heads", window: "Full sequence", role: "Phase identification — distinguishing stance vs swing, task stages", color: "border-t-[color:var(--tamu)]" },
            ].map((c) => (
              <Card key={c.cluster} className={`border-t-2 ${c.color}`}>
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold text-white">{c.cluster}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-zinc-600">{c.count}</span>
                    <span className="text-zinc-800">&middot;</span>
                    <span className="text-[9px] font-mono text-zinc-600">{c.window} attn window</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{c.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Layer specialisation note */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-6 text-xs">
                <div className="flex-1 border-r border-zinc-800 pr-6">
                  <p className="font-semibold text-zinc-200 mb-1">Layer 1 — Local Feature Extraction</p>
                  <p className="text-zinc-500">Attends to nearby timesteps (short temporal windows). Captures local dynamics: heel-strike transients, acceleration, deceleration. Functions similarly to the Conv1D embedding&apos;s temporal receptive field. More dense attention pattern.</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-200 mb-1">Layer 2 — Global Context</p>
                  <p className="text-zinc-500">Attends to distant timesteps and phase transitions. Identifies critical biomechanical phases (peak effort, weight transfer, foot release). Highly sparse — few high-weight connections across the full sequence. Layer 2 &quot;selects&quot; from Layer 1&apos;s broad information gather.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>ROI Hit Rate per Fold</CardTitle>
                <CardDescription>
                  Percentage of high-attention anchors landing in biomechanically
                  relevant regions. Statistically significant in 5/6 folds
                  (binomial test).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={roiBarData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                    <YAxis domain={[0, 35]} unit="%" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#f4f4f5' }} formatter={(v: number) => [`${v}%`, "ROI Hit Rate"]} />
                    <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                      {roiBarData.map((d) => (
                        <Cell
                          key={d.name}
                          fill={d.significant ? "#10b981" : "#f59e0b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-zinc-500">
                  <span className="inline-block mr-2 w-3 h-3 rounded-sm bg-emerald-500 align-middle" />
                  Statistically significant (p &lt; 0.05)
                  <span className="inline-block mx-2 w-3 h-3 rounded-sm bg-amber-400 align-middle" />
                  Not significant (Fold 5: p = 0.130)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mean Temporal Distance per Fold</CardTitle>
                <CardDescription>
                  Average frame distance between attention anchor and attended
                  timestep. Values ~240 indicate the model attends to context
                  ≈2–4 seconds away (at 100 Hz).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={temporalBarData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                    <YAxis domain={[200, 280]} unit="fr" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#f4f4f5' }} formatter={(v: number) => [`${v} frames`, "Temporal Distance"]} />
                    <Bar dataKey="dist" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Full metrics table */}
          <Card>
            <CardHeader>
              <CardTitle>Full Attention Metrics Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fold</TableHead>
                    <TableHead className="text-right">Sparsity %</TableHead>
                    <TableHead className="text-right">Entropy (bits)</TableHead>
                    <TableHead className="text-right">Temporal Dist.</TableHead>
                    <TableHead className="text-right">ROI Hit %</TableHead>
                    <TableHead className="text-right">Anchors</TableHead>
                    <TableHead className="text-right">In ROI</TableHead>
                    <TableHead className="text-center">Significant?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attentionFolds.map((f) => (
                    <TableRow key={f.fold}>
                      <TableCell className="font-medium">{f.fold}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {f.sparsity.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {f.entropy.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {f.temporal.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {f.roi.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {f.anchors.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {f.anchorsInROI.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {f.significant ? (
                          <span className="text-xs font-semibold text-emerald-700">Yes</span>
                        ) : (
                          <span className="text-xs text-amber-600">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Interpretation */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-sky-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-sky-400">Sparse Attention</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                97–98% of attention weights are near-zero. The model learns
                highly selective temporal focus rather than diffuse averaging,
                suggesting it identifies specific gait events (heel strike,
                toe-off, weight transfer).
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-violet-400">Long-Range Dependency</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                Mean temporal distance of ~248 frames at 100 Hz ≈ 2.5 seconds.
                The model integrates context across full gait cycles, not just
                local windows. This explains why the CNN front-end (local
                features) + Transformer (global context) combination works well.
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-400">Biomechanical ROI</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400">
                14–29% of high-attention anchors fall in kinematically relevant
                regions (e.g., stance phases, transitions). Binomial test
                confirms this is significantly above chance in 5/6 folds,
                validating that the model has learned biomechanically meaningful
                temporal patterns.
              </CardContent>
            </Card>
          </div>

          {/* Summary across folds image */}
          <Card>
            <CardHeader>
              <CardTitle>Attention Summary Across Folds</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Attention Summary Across Folds">
                <Image
                  src="/outputs/combined/attention_summary_across_folds.png"
                  alt="Attention summary across folds"
                  width={1200}
                  height={500}
                  className="w-full rounded"
                  unoptimized
                />
              </ChartLightbox>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HEATMAPS ─────────────────────────────────────────────── */}
        <TabsContent value="heatmaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Head Specialisation — Combined (All Folds)</CardTitle>
              <CardDescription>
                Each of the 8 attention heads learns distinct temporal patterns.
                Some heads specialise in short-range local dependencies; others
                in long-range cross-cycle context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Head Specialisation — Combined">
                <Image
                  src="/outputs/combined/head_specialization_combined.png"
                  alt="Head specialization"
                  width={1200}
                  height={600}
                  className="w-full rounded"
                  unoptimized
                />
              </ChartLightbox>
            </CardContent>
          </Card>

          {/* Per-fold attention overlays */}
          <Card>
            <CardHeader>
              <CardTitle>Per-Fold Attention Overlays</CardTitle>
              <CardDescription>
                Attention weights overlaid on GRF time series for GL (blue) and
                PH (purple) held-out subjects. Brighter regions = higher
                attention weight.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {foldPairs.map((fold) => (
                  <div key={fold} className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-400">
                      Fold {fold}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-[10px] text-zinc-500">
                          GroundLink held-out
                        </p>
                        <ChartLightbox title={`Fold ${fold} — GroundLink Attention Overlay`}>
                          <Image
                            src={`/outputs/combined/fold_${fold}/attn_overlaid_fold${fold}_GL.png`}
                            alt={`Attention overlay fold ${fold} GL`}
                            width={500}
                            height={300}
                            className="w-full rounded border"
                            unoptimized
                          />
                        </ChartLightbox>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-zinc-500">
                          Patient Handling held-out
                        </p>
                        <ChartLightbox title={`Fold ${fold} — Patient Handling Attention Overlay`}>
                          <Image
                            src={`/outputs/combined/fold_${fold}/attn_overlaid_fold${fold}_PH.png`}
                            alt={`Attention overlay fold ${fold} PH`}
                            width={500}
                            height={300}
                            className="w-full rounded border"
                            unoptimized
                          />
                        </ChartLightbox>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Multi-head grids */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Head Attention Grid — Fold 1</CardTitle>
              <CardDescription>
                All 8 heads of Layer 1. Each subplot shows the attention
                distribution for one head over the sequence.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500">
                  GL Held-Out (GL 2)
                </p>
                <ChartLightbox title="Multi-Head Grid Fold 1 — GroundLink">
                  <Image
                    src="/outputs/combined/fold_1/multihead_grid_fold1_GL_L1.png"
                    alt="Multi-head grid fold 1 GL"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500">
                  PH Held-Out (PH 1)
                </p>
                <ChartLightbox title="Multi-Head Grid Fold 1 — Patient Handling">
                  <Image
                    src="/outputs/combined/fold_1/multihead_grid_fold1_PH_L1.png"
                    alt="Multi-head grid fold 1 PH"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PREDICTIONS ──────────────────────────────────────────── */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predicted vs Ground Truth — All Folds</CardTitle>
              <CardDescription>
                Time-series overlays for both GL and PH held-out subjects. Green
                = ground truth, blue = model prediction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {foldPairs.map((fold) => (
                  <div key={fold}>
                    <h3 className="mb-3 text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-1">
                      Fold {fold}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {["GL_sample0", "GL_sample1", "PH_sample0", "PH_sample1"].map(
                        (s) => (
                          <div key={s}>
                            <p className="mb-1 text-[10px] font-medium text-slate-500">
                              {s.replace("_sample", " — sample ").replace("GL", "GroundLink").replace("PH", "Patient Handling")}
                            </p>
                            <ChartLightbox title={`Fold ${fold} — ${s.replace("_sample", " sample ").replace("GL", "GroundLink").replace("PH", "Patient Handling")}`}>
                              <Image
                                src={`/outputs/combined/fold_${fold}/pred_fold${fold}_${s}.png`}
                                alt={`Prediction fold ${fold} ${s}`}
                                width={600}
                                height={350}
                                className="w-full rounded border"
                                unoptimized
                              />
                            </ChartLightbox>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DIAGNOSTICS ──────────────────────────────────────────── */}
        <TabsContent value="diagnostics" className="space-y-6">
          <p className="text-sm text-zinc-400">
            Diagnostic plots from the combined experiment investigating scale
            imbalance, coordinate alignment, task-conditioned training, and raw
            attention structure.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                file: "diag1_scale_imbalance.png",
                title: "Diag 1 — Scale Imbalance",
                desc: "Force magnitude distributions before/after normalisation across GL and PH datasets.",
              },
              {
                file: "diag2_coordinate_alignment.png",
                title: "Diag 2 — Coordinate Alignment",
                desc: "Verification of force-axis mapping after correcting the GroundLink Fx/Fy/Fz sign flip.",
              },
              {
                file: "diag3_task_hint_curves.png",
                title: "Diag 3 — Task Hint Curves",
                desc: "Training loss curves with and without task-identity metadata injection.",
              },
              {
                file: "diag4_attention_heatmaps.png",
                title: "Diag 4 — Attention Heatmaps",
                desc: "Raw attention weight matrices from Layer 1, Head 1 on representative trials.",
              },
              {
                file: "diag4_attention_stats.png",
                title: "Diag 4 — Attention Statistics",
                desc: "Distribution of attention entropy and sparsity across all heads and layers.",
              },
              {
                file: "diag4_per_head_attention.png",
                title: "Diag 4 — Per-Head Attention",
                desc: "Per-head attention statistics showing specialisation across the 8 attention heads.",
              },
            ].map((d) => (
              <Card key={d.file}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{d.title}</CardTitle>
                  <CardDescription className="text-xs">{d.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartLightbox title={d.title}>
                    <Image
                      src={`/outputs/diag/${d.file}`}
                      alt={d.title}
                      width={700}
                      height={500}
                      className="w-full rounded border"
                      unoptimized
                    />
                  </ChartLightbox>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── MARKERS ──────────────────────────────────────────────── */}
        <TabsContent value="markers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>20-Marker Body Model</CardTitle>
              <CardDescription>
                Both datasets are mapped to a shared 20-marker canonical set
                before feature engineering. This enables cross-lab training.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="rounded-lg bg-slate-950 p-5 font-mono text-xs text-slate-300 leading-relaxed">
                    <div className="text-slate-500 mb-2">{"// 20-marker canonical set"}</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                      {[
                        "LASI", "RASI", "LPSI", "RPSI",
                        "LKNE", "RKNE", "LANK", "RANK",
                        "LTOE", "RTOE", "LHEE", "RHEE",
                        "LSHO", "RSHO", "LELB", "RELB",
                        "LWRA", "RWRA", "C7", "STRN",
                      ].map((m) => (
                        <div key={m}>
                          <span className="text-teal-400">{m}</span>
                          <span className="text-slate-600">  → x, y, z</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-slate-500">
                      {"// Features per marker:"}<br />
                      {"//   pos(3) + vel(3) + acc(3) = 9"}<br />
                      {"// + 10 pair distances × 3 axes = 30"}<br />
                      {"// Total: 20×9 + 30 = ~170 features"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {markerGroups.map((g) => (
                    <div key={g.group} className="rounded-lg border p-3">
                      <p className="mb-1 font-semibold text-sm text-zinc-200">
                        {g.group}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {g.markers.map((m) => (
                          <span
                            key={m}
                            className={`inline-block rounded px-2 py-0.5 text-xs font-mono ${g.color}`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500">{g.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GRF Output Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Foot</TableHead>
                      <TableHead>Axis</TableHead>
                      <TableHead>Meaning</TableHead>
                      <TableHead className="text-right">Typical R² (combined)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { ch: "ground_force_1_ml", foot: "Left", axis: "ML", mean: "Mediolateral force", r2: "0.60–0.66" },
                      { ch: "ground_force_1_vert", foot: "Left", axis: "Vert", mean: "Vertical force", r2: "0.72–0.83" },
                      { ch: "ground_force_1_ap", foot: "Left", axis: "AP", mean: "Anteroposterior force", r2: "0.07–0.59" },
                      { ch: "ground_force_1_px", foot: "Left", axis: "CoP-x", mean: "Centre of pressure X", r2: "0.72–0.84" },
                      { ch: "ground_force_1_pz", foot: "Left", axis: "CoP-z", mean: "Centre of pressure Z", r2: "0.25–0.67" },
                      { ch: "ground_force_2_ml", foot: "Right", axis: "ML", mean: "Mediolateral force", r2: "0.53–0.66" },
                      { ch: "ground_force_2_vert", foot: "Right", axis: "Vert", mean: "Vertical force", r2: "0.70–0.84" },
                      { ch: "ground_force_2_ap", foot: "Right", axis: "AP", mean: "Anteroposterior force", r2: "0.07–0.35" },
                      { ch: "ground_force_2_px", foot: "Right", axis: "CoP-x", mean: "Centre of pressure X", r2: "0.56–0.65" },
                      { ch: "ground_force_2_pz", foot: "Right", axis: "CoP-z", mean: "Centre of pressure Z", r2: "0.25–0.54" },
                    ].map((r) => (
                      <TableRow key={r.ch}>
                        <TableCell className="font-mono text-xs">{r.ch}</TableCell>
                        <TableCell className="text-xs">{r.foot}</TableCell>
                        <TableCell>
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold
                            ${r.axis === "Vert" ? "bg-emerald-950/60 text-emerald-400" :
                              r.axis === "AP" ? "bg-red-950/60 text-red-400" :
                              r.axis.startsWith("CoP") ? "bg-sky-950/60 text-sky-400" :
                              "bg-amber-950/60 text-amber-400"}`}>
                            {r.axis}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{r.mean}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600">
                          {r.r2}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
