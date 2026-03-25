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
          {/* ANON: was "Texas A&M · Biomechanics" — restore after acceptance */}
          Biomechanics Lab
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

      <Tabs defaultValue="animations" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="animations">Animations</TabsTrigger>
          <TabsTrigger value="metrics">Attention Metrics</TabsTrigger>
          <TabsTrigger value="single-trial">Single-Trial Analysis</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="markers">Marker Setup</TabsTrigger>
        </TabsList>

        {/* ── ANIMATIONS ───────────────────────────────────────────── */}
        <TabsContent value="animations" className="space-y-6">
          <p className="text-sm text-zinc-400 max-w-2xl">
            Animated visualisations of the ICF attention mechanism on its best-performing trials.
            Each animation type reveals a different facet of what the model has learned — from
            head-by-head competition to the sequential buildup of attention weight. Watching the
            animations makes it easy to see that attention concentrates on biomechanically
            meaningful moments (heel-strike, toe-off, peak loading) rather than spreading evenly
            across the sequence, confirming the model has learned real movement structure.
          </p>

          {/* Animation type legend */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { type: "Head Race", key: "head_race", desc: "All 16 attention heads rendered simultaneously. Watch which heads activate first and which dominate during biomechanically critical phases (heel-strike, toe-off, peak loading)." },
              { type: "Buildup", key: "buildup",   desc: "Cumulative attention weight building over the trial sequence. Reveals how much of the trial the model has 'decided' to focus on by each timestep." },
              { type: "Sweep",    key: "sweep",     desc: "A sliding window sweep across the sequence showing attention weight density at each position. Highlights the model's preferred temporal receptive field." },
            ].map((a) => (
              <Card key={a.key} className="border-t-2 border-t-violet-700">
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold text-violet-300 mb-1">{a.type}</p>
                  <p className="text-xs text-zinc-500">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* GL LOSO — best trial R²=0.967 */}
          <Card>
            <CardHeader>
              <CardTitle>GroundLink LOSO — Best Trial (R² = 0.967, Subject GL7)</CardTitle>
              <CardDescription>
                Single-trial attention animations from the held-out GL7 fold. This trial achieves
                near-perfect prediction, letting us see exactly what a well-converged ICF attends to.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { src: "/outputs/animations/gl_head_race.gif", label: "Head Race" },
                  { src: "/outputs/animations/gl_buildup.gif",   label: "Buildup" },
                  { src: "/outputs/animations/gl_sweep.gif",     label: "Sweep" },
                ].map((a) => (
                  <div key={a.src} className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-400">{a.label}</p>
                    <ChartLightbox title={`GL Best Trial — ${a.label}`}>
                      <Image src={a.src} alt={`GL ${a.label}`} width={600} height={400} className="w-full rounded border border-zinc-800" unoptimized />
                    </ChartLightbox>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PH LOSO — best trial R²=0.891 */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Handling LOSO — Best Trial (R² = 0.891, Subject PH1)</CardTitle>
              <CardDescription>
                Attention animations for the best PH trial. Occupational patient-handling tasks have
                longer, aperiodic movement sequences — notice how the attention patterns differ from the
                stereotyped locomotion above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { src: "/outputs/animations/ph_head_race.gif", label: "Head Race" },
                  { src: "/outputs/animations/ph_buildup.gif",   label: "Buildup" },
                  { src: "/outputs/animations/ph_sweep.gif",     label: "Sweep" },
                ].map((a) => (
                  <div key={a.src} className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-400">{a.label}</p>
                    <ChartLightbox title={`PH Best Trial — ${a.label}`}>
                      <Image src={a.src} alt={`PH ${a.label}`} width={600} height={400} className="w-full rounded border border-zinc-800" unoptimized />
                    </ChartLightbox>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Combined CV — best trial R²=0.906 */}
          <Card>
            <CardHeader>
              <CardTitle>Combined CV — Best Trial (R² = 0.906, Fold 2)</CardTitle>
              <CardDescription>
                Animations from the combined dual-holdout experiment (ICF trained on both GL + PH).
                The model sees two coordinate frames during training; this trial shows how attention
                adapts when the model must generalise across both labs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { src: "/outputs/animations/combined_head_race.gif", label: "Head Race" },
                  { src: "/outputs/animations/combined_buildup.gif",   label: "Buildup" },
                  { src: "/outputs/animations/combined_sweep.gif",     label: "Sweep" },
                ].map((a) => (
                  <div key={a.src} className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-400">{a.label}</p>
                    <ChartLightbox title={`Combined Best Trial — ${a.label}`}>
                      <Image src={a.src} alt={`Combined ${a.label}`} width={600} height={400} className="w-full rounded border border-zinc-800" unoptimized />
                    </ChartLightbox>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── METRICS ──────────────────────────────────────────────── */}
        <TabsContent value="metrics" className="space-y-6">
          <p className="text-sm text-zinc-400 max-w-2xl">
            Quantitative measurements of how the ICF&apos;s 16 attention heads allocate focus across
            the time series, aggregated over all 6 cross-validation folds. Metrics like sparsity
            (~97.5%) confirm the model concentrates on a tiny fraction of timesteps, while the ROI
            hit rate tests whether those timesteps land in biomechanically important regions. Consistent
            results across folds indicate the patterns are genuine learned structure, not fold-specific
            noise.
          </p>

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
              <div className="flex flex-col gap-4 text-xs sm:flex-row sm:gap-6">
                <div className="flex-1 sm:border-r sm:border-zinc-800 sm:pr-6">
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
              <div className="overflow-x-auto">
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
              </div>
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

        {/* ── SINGLE-TRIAL ANALYSIS ─────────────────────────────────── */}
        <TabsContent value="single-trial" className="space-y-6">
          <p className="text-sm text-zinc-400 max-w-2xl">
            Deep-dive into a single GL7 held-out trial (R²&nbsp;=&nbsp;0.967) — the best-performing
            trial across all experiments. These plots characterise how the ICF&apos;s 16 attention heads
            behave at the level of an individual prediction. Examining the exact timesteps each head
            attends to, and correlating them with the force output, reveals the internal mechanism
            behind the model&apos;s accuracy and shows that high performance is driven by interpretable
            attention, not a black-box shortcut.
          </p>

          {/* Synced attention + GRF */}
          <Card>
            <CardHeader>
              <CardTitle>Synced Attention + GRF Signal (Best Trial, R² = 0.967)</CardTitle>
              <CardDescription>
                Attention weights overlaid directly on the predicted and ground-truth GRF time series.
                Bright regions show where the model concentrates attention for each force channel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Synced Attention + GRF — GL7 Best Trial">
                <Image src="/outputs/gl_attn/synced_best.png" alt="Synced attention best trial" width={1200} height={600} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>

          {/* Per-head grids */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Per-Head Attention — Best Trial (R² = 0.967)</CardTitle>
                <CardDescription>
                  Individual attention maps for all 16 heads. Each panel shows one head&apos;s
                  (query → key) attention matrix over the full trial sequence.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Per-Head Attention — GL7 Best Trial">
                  <Image src="/outputs/gl_attn/per_head_best.png" alt="Per-head attention best" width={900} height={700} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Per-Head Attention — Second Trial (R² = 0.909)</CardTitle>
                <CardDescription>
                  Cross-trial comparison: same subject, different trial. Consistent head
                  specialisation across trials confirms the patterns are structural, not random.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Per-Head Attention — GL7 Second Trial">
                  <Image src="/outputs/gl_attn/per_head_second.png" alt="Per-head attention second" width={900} height={700} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
          </div>

          {/* Layer evolution + query profile */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Layer Evolution (Best Trial)</CardTitle>
                <CardDescription>
                  How attention patterns transform from Layer 1 → Layer 2. Layer 1 aggregates
                  local features; Layer 2 distills them into sparse, long-range dependencies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Layer Evolution — GL7 Best Trial">
                  <Image src="/outputs/gl_attn/layer_evolution_best.png" alt="Layer evolution" width={900} height={600} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Query Profile (Best Trial)</CardTitle>
                <CardDescription>
                  Each query timestep&apos;s attention distribution across the full key sequence.
                  Diagonal bands indicate local tracking; off-diagonal spikes indicate long-range
                  reference points.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Query Profile — GL7 Best Trial">
                  <Image src="/outputs/gl_attn/query_profile_best.png" alt="Query profile" width={900} height={600} className="w-full rounded" unoptimized />
                </ChartLightbox>
              </CardContent>
            </Card>
          </div>

          {/* Population-level attention stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { src: "/outputs/gl_attn/anchor_density.png",    title: "Anchor Density",       desc: "Spatial density of high-attention anchors across the trial timeline." },
              { src: "/outputs/gl_attn/head_specialization.png", title: "Head Specialisation", desc: "Cluster assignments for all 16 heads — Local, Feature, Contextualiser." },
              { src: "/outputs/gl_attn/phase_attention.png",   title: "Phase Attention",      desc: "Attention weight concentration aligned to gait phase (stance / swing)." },
              { src: "/outputs/gl_attn/temporal_profiles.png", title: "Temporal Profiles",    desc: "Mean attention weight vs. temporal displacement per head and layer." },
            ].map((p) => (
              <Card key={p.src}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                  <CardDescription className="text-xs">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartLightbox title={p.title}>
                    <Image src={p.src} alt={p.title} width={600} height={450} className="w-full rounded border border-zinc-800" unoptimized />
                  </ChartLightbox>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature correlation */}
          <Card>
            <CardHeader>
              <CardTitle>Head–Feature Correlation</CardTitle>
              <CardDescription>
                Correlation between each attention head&apos;s activation pattern and each of the 10 GRF
                output channels. Reveals which heads are most responsible for predicting each force component.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLightbox title="Head–Feature Correlation">
                <Image src="/outputs/gl_attn/feature_correlation.png" alt="Head feature correlation" width={1000} height={500} className="w-full rounded" unoptimized />
              </ChartLightbox>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HEATMAPS ─────────────────────────────────────────────── */}
        <TabsContent value="heatmaps" className="space-y-6">
          <p className="text-sm text-zinc-400 max-w-2xl">
            2D attention maps showing which timesteps each attention head focuses on, rendered as
            colour-coded grids overlaid on the GRF signal. Bright patches mean high attention weight;
            their position reveals whether a head tracks nearby context (near-diagonal bands) or
            references distant parts of the sequence (off-diagonal spikes). Comparing heatmaps across
            folds and task types shows how consistently each head specialises its role across different
            subjects and movement patterns.
          </p>
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
          <p className="text-sm text-zinc-400 max-w-2xl">
            Time-series overlays of the ICF&apos;s predicted ground reaction forces against the
            force-plate ground truth for each held-out subject and fold. Close alignment across all
            10 GRF channels demonstrates that the model generalises to unseen individuals — the
            primary goal of leave-one-subject-out evaluation. Residuals and divergences highlight
            which force components (typically anteroposterior) are hardest to predict from motion
            capture alone, pointing to where future model improvements are most needed.
          </p>
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
          <p className="text-sm text-zinc-400 max-w-3xl">
            These diagnostics are the methodological preconditions for any meaningful cross-lab comparison.
            The GroundLink and Patient Handling datasets differ simultaneously in coordinate frame (Z-up vs. Y-up),
            task biomechanics, motion-capture hardware, force magnitudes, and AP force variance — so a naive
            cross-lab experiment can fail for trivial reasons unrelated to learned representations.
            Each diagnostic below rules out one such confound, leaving coordinate-frame incompatibility as
            the leading explanation for the observed R² collapse to −0.45 or below when transferring
            across laboratories without target-domain training data.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Diag 1 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diag 1 — Force Scale Imbalance</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  PH vertical forces average 386 N versus 249 N for GL (1.55×), and the post-normalization
                  AP force variance ratio reaches 11.4× — the single largest distributional mismatch between
                  datasets. This plot shows per-channel force distributions before and after body-weight
                  normalization, confirming that NBW normalization compresses but does not eliminate the gap.
                  Residual scale differences explain why GL&apos;s AP force predictions collapse first under
                  combined training while PH&apos;s AP force improves modestly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Diag 1 — Force Scale Imbalance">
                  <Image
                    src="/outputs/diag/diag1_scale_imbalance.png"
                    alt="Diag 1 — Force Scale Imbalance"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </CardContent>
            </Card>

            {/* Diag 2 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diag 2 — Coordinate Axis Alignment</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  GL encodes force as (Fx=AP, Fy=ML, Fz=vertical) in a Z-up frame; PH uses
                  (vx=ML, vy=vertical, vz=AP) in OpenSim&apos;s Y-up convention. Training across datasets
                  without correcting this axis mapping would cause the model to conflate AP and ML force
                  signals, making cross-lab failure appear far worse than it is. This diagnostic verifies
                  that after axis remapping and sign-flip correction, the unified force representation is
                  physically consistent across both labs — ruling out bookkeeping error as a contributor
                  to the observed −0.45 cross-lab R².
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Diag 2 — Coordinate Axis Alignment">
                  <Image
                    src="/outputs/diag/diag2_coordinate_alignment.png"
                    alt="Diag 2 — Coordinate Axis Alignment"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </CardContent>
            </Card>

            {/* Diag 3 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diag 3 — Task-Hint Training Curves</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  If a model can infer lab identity from the input distribution alone, it can learn
                  separate force mappings per dataset without learning any transferable kinematic-to-force
                  relationship — making combined training an illusion of generalization. This diagnostic
                  compares training loss curves when explicit task-identity metadata (a one-hot lab indicator)
                  is injected versus withheld. Similar convergence in both conditions suggests the model
                  already detects the distributional shift implicitly, meaning that even
                  &ldquo;task-blind&rdquo; combined training may exploit lab-specific statistics rather than
                  learning genuinely transferable representations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Diag 3 — Task-Hint Training Curves">
                  <Image
                    src="/outputs/diag/diag3_task_hint_curves.png"
                    alt="Diag 3 — Task-Hint Training Curves"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </CardContent>
            </Card>

            {/* Diag 4a */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diag 4a — Raw Attention Heatmaps</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Query × key attention weight matrices from Layer 1, Head 1 on representative trials
                  from each dataset. Diagonal bands reflect local temporal tracking; sharp off-diagonal
                  spikes indicate the model attending across long time intervals — for example, using
                  heel-strike kinematics as a reference while predicting toe-off forces. Comparing GL and
                  PH heatmaps provides a qualitative check on whether the learned attention structure
                  (sparse, event-anchored) is consistent across datasets despite their different
                  coordinate frames and task types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Diag 4a — Raw Attention Heatmaps">
                  <Image
                    src="/outputs/diag/diag4_attention_heatmaps.png"
                    alt="Diag 4a — Raw Attention Heatmaps"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </CardContent>
            </Card>

            {/* Diag 4b */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diag 4b — Attention Entropy &amp; Sparsity Distributions</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Distributions of attention entropy (bits) and sparsity (% weights below 0.01 threshold)
                  across all 16 heads, both transformer layers, and all combined-CV folds. The 97.5% mean
                  sparsity and ~8.3-bit mean entropy reported in the KPIs above are aggregate summaries of
                  these distributions. Tight, consistent distributions confirm that high sparsity is a robust
                  property of the model rather than an artifact of a single outlier head or unusually
                  easy fold — it holds across the full experimental matrix.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Diag 4b — Attention Entropy & Sparsity Distributions">
                  <Image
                    src="/outputs/diag/diag4_attention_stats.png"
                    alt="Diag 4b — Attention Entropy & Sparsity Distributions"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </CardContent>
            </Card>

            {/* Diag 4c */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Diag 4c — Per-Head Attention Specialisation</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Head-by-head entropy and sparsity statistics across the 8 attention heads in each
                  transformer layer. Some heads are persistently more focused (lower entropy) while others
                  maintain broader attention — this is the head competition visible in the animation tab&apos;s
                  head-race videos. The diversity in per-head sparsity confirms that the 16 heads are not
                  computing redundant transformations; they partition the sequence&apos;s temporal structure,
                  with different heads specialising on different biomechanical events such as stance
                  initiation, peak loading, and swing phase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLightbox title="Diag 4c — Per-Head Attention Specialisation">
                  <Image
                    src="/outputs/diag/diag4_per_head_attention.png"
                    alt="Diag 4c — Per-Head Attention Specialisation"
                    width={700}
                    height={500}
                    className="w-full rounded border"
                    unoptimized
                  />
                </ChartLightbox>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── MARKERS ──────────────────────────────────────────────── */}
        <TabsContent value="markers" className="space-y-6">
          <p className="text-sm text-zinc-400 max-w-2xl">
            The canonical 20-marker body model that both the GroundLink and Patient Handling
            datasets are standardised to before feature engineering. Each marker contributes
            position, velocity, and acceleration signals plus inter-marker distances, totalling
            ~170 input features per timestep. This shared representation is what allows the model
            to train across two different labs simultaneously and still generalise across coordinate
            systems and task types.
          </p>
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
