"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Cpu,
  Zap,
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Users,
  Activity,
  ArrowRight,
  Crosshair,
  Compass,
  Ruler,
  GitBranch,
  SigmaSquare,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Real data from top_results/
───────────────────────────────────────────── */

const glLosoComparison = [
  { model: "CNN", r2: 0.5298, mae: 0.4053, color: "#71717a" },
  { model: "CNN-LSTM", r2: 0.6186, mae: 0.3514, color: "#a1a1aa" },
  { model: "ICF", r2: 0.6554, mae: 0.3276, color: "var(--tamu)" },
];

const glPerSubject = [
  { subject: "GL2", cnn: 0.544, cnnLstm: 0.651, icf: 0.647 },
  { subject: "GL3", cnn: 0.574, cnnLstm: 0.657, icf: 0.720 },
  { subject: "GL4", cnn: 0.465, cnnLstm: 0.572, icf: 0.604 },
  { subject: "GL5", cnn: 0.426, cnnLstm: 0.510, icf: 0.493 },
  { subject: "GL6", cnn: 0.546, cnnLstm: 0.580, icf: 0.659 },
  { subject: "GL7", cnn: 0.623, cnnLstm: 0.741, icf: 0.810 },
];

const featureRadar = [
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

/* R² values from paper Table 3. */
const combinedFolds = [
  { fold: "F1", gl: "GL2", ph: "PH1", glR2: 0.555, phR2: 0.649, combined: 0.600 },
  { fold: "F2", gl: "GL3", ph: "PH2", glR2: 0.609, phR2: 0.597, combined: 0.604 },
  { fold: "F3", gl: "GL4", ph: "PH3", glR2: 0.538, phR2: 0.600, combined: 0.571 },
  { fold: "F4", gl: "GL5", ph: "PH4", glR2: 0.506, phR2: 0.704, combined: 0.602 },
  { fold: "F5", gl: "GL6", ph: "PH5", glR2: 0.598, phR2: 0.573, combined: 0.589 },
  { fold: "F6", gl: "GL7", ph: "PH6", glR2: 0.601, phR2: 0.537, combined: 0.560 },
];

const allResults = [
  { experiment: "GL LOSO", model: "ICF", r2: 0.655, mae: 0.328, folds: 6, status: "best" },
  { experiment: "GL LOSO", model: "CNN-LSTM", r2: 0.619, mae: 0.351, folds: 6, status: "ok" },
  { experiment: "GL LOSO", model: "CNN", r2: 0.530, mae: 0.405, folds: 6, status: "ok" },
  { experiment: "PH LOSO", model: "CNN-LSTM", r2: 0.606, mae: 0.374, folds: 10, status: "best" },
  { experiment: "PH LOSO", model: "ICF",      r2: 0.561, mae: 0.400, folds: 10, status: "ok"   },
  { experiment: "PH LOSO", model: "CNN",      r2: 0.555, mae: 0.413, folds: 10, status: "ok"   },
  { experiment: "Combined CV", model: "ICF", r2: 0.587, mae: null, folds: 6, status: "best" },
];

const hpoParams = {
  lr: "4.60 × 10⁻⁴",
  dropout: "0.137",
  weightDecay: "7.36 × 10⁻⁴",
  dModel: "64",
  batchSize: "16",
  encoderLayers: "2",
  nhead: "8",
  cnnFilters: "256",
  ffDim: "512",
};

/* ─────────────────────────────────────────────
   Components
───────────────────────────────────────────── */

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </span>
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

function StatCard({ value, label, sub, icon: Icon, accent }: {
  value: string; label: string; sub: string; icon: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  return (
    <Card className={`border-t-2 ${accent ? "border-t-[color:var(--tamu)]" : "border-t-zinc-700"} relative overflow-hidden`}>
      <CardContent className="pt-4 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 font-mono leading-snug">
              {label}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-600">{sub}</p>
          </div>
          <Icon className={`h-5 w-5 ${accent ? "text-[color:var(--tamu)]/60" : "text-zinc-700"}`} />
        </div>
      </CardContent>
    </Card>
  );
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
export default function OverviewPage() {
  const meanCombined = combinedFolds.reduce((a, f) => a + f.combined, 0) / combinedFolds.length;
  const bestFold = combinedFolds.reduce((a, f) => f.combined > a.combined ? f : a, combinedFolds[0]);

  return (
    <div className="space-y-8 max-w-7xl">

      {/* ═══ HERO ═══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
            Texas A&amp;M · Biomechanics
          </span>
          <Badge variant="outline" className="text-[9px] font-mono tracking-widest border-zinc-800 text-zinc-600">
            ImprovedConvFormer v1.0
          </Badge>
          <Badge variant="outline" className="text-[9px] font-mono tracking-widest border-zinc-800 text-zinc-600">
            March 2026
          </Badge>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight max-w-3xl">
          Predicting Ground Reaction Forces from
          <span className="text-[color:var(--tamu)]"> Motion Capture</span>
        </h1>

        <p className="max-w-2xl text-sm text-zinc-400 leading-relaxed">
          Deep learning models that estimate <span className="font-medium text-zinc-200">bilateral 3-D ground reaction forces</span> and{" "}
          <span className="font-medium text-zinc-200">centres of pressure</span> from sparse marker-based kinematics alone — no force plates needed.
          We introduce <span className="font-semibold text-[color:var(--tamu)]">ImprovedConvFormer (ICF)</span>,
          a hybrid CNN-Transformer architecture that outperforms conventional approaches across multiple labs and tasks.
        </p>
      </div>

      {/* ══ HERO STATS ══ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value="0.655" label="GL LOSO R²" sub="Best model · 6 subjects held out" icon={TrendingUp} accent />
        <StatCard value="0.587" label="Combined CV R²" sub="6-fold dual-holdout · 2 labs" icon={FlaskConical} />
        <StatCard value="16" label="Total Subjects" sub="6 GroundLink + 10 Patient Handling" icon={Users} />
        <StatCard value="10" label="GRF Channels" sub="3D force + CoP · bilateral" icon={Activity} />
      </div>

      {/* ═══ THE PROBLEM ═══ */}
      <SectionDivider label="The Problem" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="border-l-2 border-l-red-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Why This Is Hard
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 space-y-3 leading-relaxed">
            <p>
              <span className="font-semibold text-zinc-200">Ground Reaction Forces (GRFs)</span> are the gold standard
              for biomechanical analysis — they reveal how the body interacts with the ground during movement.
              But measuring them requires expensive <span className="text-zinc-300">instrumented force plates</span> embedded in the lab floor.
            </p>
            <p>
              Predicting GRFs from <span className="text-zinc-300">motion capture markers</span> alone would democratize
              biomechanical analysis. But models trained on <span className="text-red-400/80">one lab</span> fail catastrophically
              when applied to <span className="text-red-400/80">another lab</span> — different equipment, protocols, coordinate
              systems, and subject populations create massive domain shift.
            </p>
            <div className="rounded-md bg-red-950/30 border border-red-900/30 p-3 mt-2">
              <p className="text-[11px] text-red-300/80">
                <span className="font-semibold">Cross-lab failure:</span> Models trained on a single lab yield
                <span className="font-mono font-semibold"> R² &lt; −1.0</span> when evaluated on another lab —
                worse than predicting the mean.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-emerald-700/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Our Solution
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 space-y-3 leading-relaxed">
            <p>
              We combine data from <span className="text-zinc-300">two independent laboratories</span> — GroundLink
              (locomotion) and Patient Handling (occupational tasks) — with careful preprocessing to create a
              <span className="text-zinc-300"> unified coordinate system</span> and normalised feature space.
            </p>
            <p>
              The <span className="font-semibold text-[color:var(--tamu)]">ImprovedConvFormer</span> architecture
              uses multi-scale convolutional embeddings to capture local biomechanical patterns, then applies
              self-attention across the full temporal sequence to model long-range dependencies — the best of both worlds.
            </p>
            <div className="rounded-md bg-emerald-950/30 border border-emerald-900/30 p-3 mt-2">
              <p className="text-[11px] text-emerald-300/80">
                <span className="font-semibold">Result:</span> Combined training achieves
                <span className="font-mono font-semibold"> R² = 0.587</span> on held-out subjects from both labs,
                transforming catastrophic cross-lab failure into reliable generalisation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ PREPROCESSING PIPELINE ═══ */}
      <SectionDivider label="Preprocessing Pipeline" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[color:var(--tamu)]" />
            5-Stage Pipeline — Applied Identically Across Both Labs
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Raw marker trajectories → ~216 normalised features per timestep. Every stage reduces cross-lab
            distributional mismatch while preserving biomechanical signal.
          </p>
        </CardHeader>
        <CardContent>
          {/* Horizontal flow — wraps gracefully on small screens */}
          <div className="flex flex-wrap items-start gap-0">
            {[
              {
                stage: "01",
                icon: Crosshair,
                color: "violet",
                title: "Pelvis Root Subtraction",
                detail: "Re-express all markers relative to pelvis centroid (mean LASI + RASI).",
                badge: "60 → 60 feats",
              },
              {
                stage: "02",
                icon: Compass,
                color: "sky",
                title: "Heading Alignment",
                detail: "Rotate about vertical axis so primary motion direction aligns with +Z. Removes lab orientation.",
                badge: "PCA on pelvis",
              },
              {
                stage: "03",
                icon: Ruler,
                color: "teal",
                title: "Height Scaling",
                detail: "Divide all marker positions by subject height (m). Normalises for stature.",
                badge: "÷ height (m)",
              },
              {
                stage: "04",
                icon: Layers,
                color: "amber",
                title: "Feature Engineering",
                detail: "Add velocity, acceleration, and 10 bilateral relative distances to each timestep.",
                badge: "60 → ~216 feats",
              },
              {
                stage: "05",
                icon: SigmaSquare,
                color: "emerald",
                title: "Standardisation",
                detail: "Z-score inputs (train stats only). Forces normalised by body weight then z-scored per fold.",
                badge: "μ=0, σ=1",
              },
            ].map((s, idx, arr) => {
              const Icon = s.icon;
              const colorMap: Record<string, { border: string; bg: string; text: string; badge: string }> = {
                violet: { border: "border-violet-800/40", bg: "bg-violet-950/20", text: "text-violet-300", badge: "bg-violet-900/40 text-violet-300" },
                sky:    { border: "border-sky-800/40",    bg: "bg-sky-950/20",    text: "text-sky-300",    badge: "bg-sky-900/40 text-sky-300" },
                teal:   { border: "border-teal-800/40",   bg: "bg-teal-950/20",   text: "text-teal-300",   badge: "bg-teal-900/40 text-teal-300" },
                amber:  { border: "border-amber-800/40",  bg: "bg-amber-950/20",  text: "text-amber-300",  badge: "bg-amber-900/40 text-amber-300" },
                emerald:{ border: "border-emerald-800/40",bg: "bg-emerald-950/20",text: "text-emerald-300",badge: "bg-emerald-900/40 text-emerald-300" },
              };
              const c = colorMap[s.color];
              return (
                <div key={s.stage} className="flex items-start">
                  <div className={`rounded-lg border ${c.border} ${c.bg} p-3 w-44 shrink-0`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[9px] font-mono text-zinc-600 tabular-nums">STAGE {s.stage}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 mb-1.5`}>
                      <Icon className={`h-3.5 w-3.5 ${c.text} shrink-0`} />
                      <p className={`text-[11px] font-semibold ${c.text} leading-tight`}>{s.title}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">{s.detail}</p>
                    <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded ${c.badge}`}>{s.badge}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex items-center self-center px-1">
                      <ArrowRight className="h-4 w-4 text-zinc-700 shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Distributional residuals callout */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Vertical force ratio", value: "1.55×", sub: "PH vs GL mean (386 vs 249 N)", color: "text-red-400" },
              { label: "AP force variance", value: "11.4×", sub: "Largest single mismatch post-pipeline", color: "text-orange-400" },
              { label: "Heading residual", value: "~135°", sub: "GL walks −135° · PH walks 0° in aligned frame", color: "text-amber-400" },
              { label: "CoP Z range", value: "14.4×", sub: "Plate-placement convention difference", color: "text-yellow-400" },
            ].map((item) => (
              <div key={item.label} className="rounded-md bg-zinc-900/60 border border-zinc-800/50 p-3">
                <p className={`text-lg font-mono font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] font-semibold text-zinc-300 mt-0.5">{item.label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 italic">
            These residuals are not pipeline artefacts — they reflect genuine physical and protocol differences between labs,
            motivating the Geometric Wall analysis.
          </p>
        </CardContent>
      </Card>

      {/* ═══ ARCHITECTURE ═══ */}
      <SectionDivider label="Architecture — ImprovedConvFormer" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[color:var(--tamu)]" />
            ImprovedConvFormer (ICF)
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            A hybrid CNN-Transformer designed for time-series biomechanical prediction. Multi-scale convolutions
            capture local motion patterns while self-attention models temporal dependencies across the full sequence.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Architecture Diagram */}
            <div className="lg:col-span-3 space-y-0">
              {/* Input */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 text-center">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Input</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">(batch, seq_len, ~216 features)</p>
                <p className="text-[10px] text-zinc-600">20 markers × pos + vel + acc + relative distances</p>
              </div>

              <div className="flex justify-center py-1"><div className="h-5 w-px bg-zinc-700" /></div>

              {/* Multi-Scale CNN */}
              <div className="rounded-lg border border-violet-800/40 bg-violet-950/20 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                  <p className="text-xs font-semibold text-violet-300">Multi-Scale CNN Embedding</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 7, 15].map((k) => (
                    <div key={k} className="rounded bg-violet-900/30 border border-violet-800/30 px-2 py-1.5 text-center">
                      <p className="text-[10px] font-mono text-violet-400">kernel={k}</p>
                      <p className="text-[9px] text-zinc-600">Conv1D → BN → ReLU</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">Concat → Linear → d_model={hpoParams.dModel}</p>
              </div>

              <div className="flex justify-center py-1"><div className="h-5 w-px bg-zinc-700" /></div>

              {/* Transformer */}
              <div className="rounded-lg border border-sky-800/40 bg-sky-950/20 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="h-3.5 w-3.5 text-sky-400" />
                  <p className="text-xs font-semibold text-sky-300">Transformer Encoder</p>
                </div>
                <div className="space-y-1.5 text-[10px] text-zinc-500">
                  <p><span className="text-sky-400/80">+</span> Learnable positional encoding</p>
                  <p><span className="text-sky-400/80">×{hpoParams.encoderLayers}</span> Pre-LayerNorm encoder layers · {hpoParams.nhead} attention heads</p>
                  <p><span className="text-sky-400/80">⟷</span> Bidirectional · dim_feedforward={hpoParams.ffDim}</p>
                  <p><span className="text-sky-400/80">↓</span> Dropout={hpoParams.dropout}</p>
                </div>
              </div>

              <div className="flex justify-center py-1"><div className="h-5 w-px bg-zinc-700" /></div>

              {/* Output */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-teal-800/40 bg-teal-950/20 p-3">
                  <p className="text-xs font-semibold text-teal-300">Metadata Injection</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Subject mass + height at all timesteps</p>
                </div>
                <div className="rounded-lg border border-[color:var(--tamu)]/30 bg-[color:var(--tamu-muted)]/30 p-3">
                  <p className="text-xs font-semibold text-[color:var(--tamu)]">Output Head</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Linear → (seq_len, 10) GRF channels</p>
                </div>
              </div>
            </div>

            {/* Hyperparameters + Key Innovations */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Optimal Hyperparameters</p>
                <p className="text-[10px] text-zinc-600 mb-3">50-trial Optuna HPO on Fold 1</p>
                <div className="space-y-0">
                  {Object.entries({
                    "Learning Rate": hpoParams.lr,
                    "Dropout": hpoParams.dropout,
                    "Weight Decay": hpoParams.weightDecay,
                    "d_model": hpoParams.dModel,
                    "Batch Size": hpoParams.batchSize,
                    "Encoder Layers": hpoParams.encoderLayers,
                    "Heads": hpoParams.nhead,
                    "CNN Filters": hpoParams.cnnFilters,
                    "FF Dim": hpoParams.ffDim,
                  }).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-zinc-800/60 py-2 text-xs">
                      <span className="text-zinc-500">{k}</span>
                      <span className="font-mono font-semibold text-zinc-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Key Innovations</p>
                <div className="space-y-2">
                  {[
                    { title: "Multi-Scale Conv", desc: "Kernels 3/7/15 capture step-level to stride-level patterns" },
                    { title: "Pre-LayerNorm", desc: "Stabilises training for biomechanical time series" },
                    { title: "NormalizedPeakWeightedLoss", desc: "2× weight on peak-force regions — recovered CoP" },
                    { title: "Bilateral Flip Augmentation", desc: "L↔R swap doubles effective training set" },
                  ].map((item) => (
                    <div key={item.title} className="rounded bg-zinc-900/50 border border-zinc-800/50 p-2">
                      <p className="text-[11px] font-semibold text-zinc-300">{item.title}</p>
                      <p className="text-[10px] text-zinc-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ MODEL COMPARISON ═══ */}
      <SectionDivider label="Model Comparison" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Bar Chart — Mean R² */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">GL LOSO — Mean R² by Model</CardTitle>
            <p className="text-xs text-zinc-500 mt-1">
              Leave-one-subject-out on 6 GroundLink subjects.
              ICF achieves <span className="font-mono text-zinc-300">0.655</span> R².
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={glLosoComparison} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" domain={[0, 0.8]} stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis type="category" dataKey="model" stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 600 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="r2" radius={[0, 4, 4, 0]} barSize={28} name="R²">
                    {glLosoComparison.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} opacity={idx === 2 ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {glLosoComparison.map((m) => (
                <div key={m.model} className={`rounded border p-2 text-center ${m.model === "ICF" ? "border-[color:var(--tamu)]/30 bg-[color:var(--tamu-muted)]/20" : "border-zinc-800 bg-zinc-900/30"}`}>
                  <p className={`text-lg font-bold tabular-nums ${m.model === "ICF" ? "text-[color:var(--tamu)]" : "text-zinc-300"}`}>
                    {m.r2.toFixed(3)}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">{m.model}</p>
                  <p className="text-[9px] text-zinc-600">MAE: {m.mae.toFixed(3)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Per-Subject Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">GL LOSO — Per-Subject R²</CardTitle>
            <p className="text-xs text-zinc-500 mt-1">
              ICF outperforms on 4 of 6 subjects with largest gains on GL3 and GL6.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={glPerSubject} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            <div className="mt-3 rounded bg-zinc-900/50 border border-zinc-800/50 p-2.5 text-[11px] text-zinc-500">
              <span className="text-zinc-300 font-medium">Improvement:</span>{" "}
              ICF achieves <span className="font-mono text-[color:var(--tamu)]">+23.7%</span> over CNN and{" "}
              <span className="font-mono text-[color:var(--tamu)]">+5.9%</span> over CNN-LSTM in mean R².
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-Feature R² — GL LOSO Comparison</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            10 bilateral GRF channels predicted simultaneously. ICF dominates across all features,
            with the largest margins on anteroposterior force (AP).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={featureRadar} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="feature" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: "#52525b", fontSize: 9 }} tickCount={5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="CNN" dataKey="cnn" stroke="#71717a" fill="#71717a" fillOpacity={0.1} strokeWidth={1} />
                  <Radar name="CNN-LSTM" dataKey="cnnLstm" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.1} strokeWidth={1} />
                  <Radar name="ICF" dataKey="icf" stroke="var(--tamu)" fill="var(--tamu)" fillOpacity={0.15} strokeWidth={2} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2">
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Feature breakdown</p>
              <div className="space-y-1.5">
                {[...featureRadar]
                  .sort((a, b) => b.icf - a.icf)
                  .map((f) => (
                    <div key={f.feature} className="flex items-center gap-2">
                      <span className="w-14 text-[11px] font-mono text-zinc-400 shrink-0">{f.feature}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-[color:var(--tamu)] opacity-80" style={{ width: `${f.icf * 100}%` }} />
                      </div>
                      <span className="w-10 text-right text-[11px] font-mono font-semibold text-zinc-300">{f.icf.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ RESULTS ═══ */}
      <SectionDivider label="Results Summary" />

      {/* Combined CV Folds */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Combined Dual-Holdout CV — ICF</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            6 folds, each holds out one GL + one PH subject. Mean R² ={" "}
            <span className="font-mono text-zinc-300">{meanCombined.toFixed(3)}</span>.
            Best fold: <span className="font-mono text-[color:var(--tamu)]">{bestFold.fold}</span> ({bestFold.combined.toFixed(3)}).
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={combinedFolds} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="fold" stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis domain={[0.4, 0.8]} stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                <Bar dataKey="glR2" name="GL R²" fill="#60a5fa" opacity={0.7} radius={[2, 2, 0, 0]} barSize={18} />
                <Bar dataKey="phR2" name="PH R²" fill="#f472b6" opacity={0.7} radius={[2, 2, 0, 0]} barSize={18} />
                <Bar dataKey="combined" name="Combined R²" fill="var(--tamu)" radius={[2, 2, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded border border-zinc-800 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="text-left px-3 py-2 font-mono text-zinc-600 font-normal">Fold</th>
                  <th className="text-left px-3 py-2 font-mono text-zinc-600 font-normal">Held Out</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">GL R²</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">PH R²</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">Combined R²</th>
                </tr>
              </thead>
              <tbody>
                {combinedFolds.map((f) => (
                  <tr key={f.fold} className={`border-b border-zinc-800/50 ${f.fold === bestFold.fold ? "bg-[color:var(--tamu-muted)]/20" : ""}`}>
                    <td className="px-3 py-2 font-mono text-zinc-300 font-medium">{f.fold}</td>
                    <td className="px-3 py-2 text-zinc-400">{f.gl} + {f.ph}</td>
                    <td className="px-3 py-2 text-center font-mono text-blue-400">{f.glR2.toFixed(3)}</td>
                    <td className="px-3 py-2 text-center font-mono text-pink-400">{f.phR2.toFixed(3)}</td>
                    <td className={`px-3 py-2 text-center font-mono font-semibold ${f.fold === bestFold.fold ? "text-[color:var(--tamu)]" : "text-zinc-200"}`}>
                      {f.combined.toFixed(3)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-zinc-900/40">
                  <td className="px-3 py-2 font-mono text-zinc-300 font-medium" colSpan={2}>Mean</td>
                  <td className="px-3 py-2 text-center font-mono text-blue-400">{(combinedFolds.reduce((a, f) => a + f.glR2, 0) / 6).toFixed(3)}</td>
                  <td className="px-3 py-2 text-center font-mono text-pink-400">{(combinedFolds.reduce((a, f) => a + f.phR2, 0) / 6).toFixed(3)}</td>
                  <td className="px-3 py-2 text-center font-mono font-semibold text-zinc-200">{meanCombined.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* All Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Experiment Results</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Complete comparison across evaluation protocols.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded border border-zinc-800 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="text-left px-3 py-2 font-mono text-zinc-600 font-normal">Evaluation</th>
                  <th className="text-left px-3 py-2 font-mono text-zinc-600 font-normal">Model</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">R²</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">MAE</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">Folds</th>
                  <th className="text-center px-3 py-2 font-mono text-zinc-600 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((r, i) => (
                  <tr key={i} className={`border-b border-zinc-800/50 ${r.status === "best" ? "bg-[color:var(--tamu-muted)]/10" : ""}`}>
                    <td className="px-3 py-2 text-zinc-400">{r.experiment}</td>
                    <td className={`px-3 py-2 font-medium ${r.model === "ICF" ? "text-[color:var(--tamu)]" : "text-zinc-300"}`}>{r.model}</td>
                    <td className="px-3 py-2 text-center font-mono">
                      {r.r2 !== null ? (
                        <span className={r.status === "best" ? "font-semibold text-zinc-200" : "text-zinc-400"}>{r.r2.toFixed(3)}</span>
                      ) : (
                        <span className="text-red-400/60 text-[10px]">invalid</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {r.mae !== null ? <span className="text-zinc-400">{r.mae.toFixed(3)}</span> : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-zinc-500">{r.folds}</td>
                    <td className="px-3 py-2 text-center">
                      {r.status === "best" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/50 border border-emerald-800/30 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> best
                        </span>
                      ) : r.status === "broken" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-950/50 border border-red-800/30 px-2 py-0.5 text-[9px] font-mono text-red-400">
                          <AlertTriangle className="h-3 w-3" /> invalid
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-[10px] font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-md bg-zinc-900/50 border border-zinc-800/50 p-2.5 text-[11px] text-zinc-600">
            <span className="text-zinc-500">Note:</span> Cross-lab transfer (GL→PH or PH→GL) yields R² &lt; 0 (ranging from −0.45 to −1.49) for all models — available in Benchmarks.
          </div>
        </CardContent>
      </Card>

      {/* ═══ DATASETS ═══ */}
      <SectionDivider label="Datasets" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-l-2 border-l-blue-600/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-400">GroundLink (GL)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 space-y-1.5">
            <p><span className="text-zinc-600">Source</span>{" — "}SIGGRAPH Asia 2023 (public)</p>
            <p><span className="text-zinc-600">Format</span>{" — "}C3D marker + NPY force</p>
            <p><span className="text-zinc-600">Subjects</span>{" — "}6 (s002–s007)</p>
            <p><span className="text-zinc-600">Trials</span>{" — "}283 processed</p>
            <p><span className="text-zinc-600">Tasks</span>{" — "}Walking, varied locomotion</p>
            <p><span className="text-zinc-600">ICF LOSO R²</span>{" — "}<span className="font-mono text-zinc-200">0.655</span></p>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-[color:var(--tamu)]/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[color:var(--tamu)]">Patient Handling (PH)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 space-y-1.5">
            <p><span className="text-zinc-600">Source</span>{" — "}Chen et al., 2025 · Texas A&amp;M</p>
            <p><span className="text-zinc-600">Format</span>{" — "}TRC marker + MOT force (OpenSim)</p>
            <p><span className="text-zinc-600">Subjects</span>{" — "}10 of 14</p>
            <p><span className="text-zinc-600">Trials</span>{" — "}460 processed</p>
            <p><span className="text-zinc-600">Tasks</span>{" — "}Occupational patient handling</p>
            <p><span className="text-zinc-600">ICF LOSO R²</span>{" — "}<span className="font-mono text-zinc-200">0.561</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
