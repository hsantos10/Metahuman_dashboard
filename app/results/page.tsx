"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
} from "recharts";

/* public/results_v2.json, written by scripts/export_results.py from the paper's results.json */
interface Head { dataset: string; model: string; loso: number; seed_sd: number; vert: number; ml: number; ap: number; trial: number | null }
interface Frame { model: string; dataset: string; arm: string; r2: number; vert: number; ml: number; ap: number; px: number; pz: number }
interface Results {
  headline: Head[]; ridge: Record<string, { r2: number; vert: number }>;
  subjects: { dataset: string; model: string; subject: string; r2: number }[];
  frame: Frame[]; newton: { dataset: string; targets: string; ap: number; ml: number; vert: number }[];
  crosslab: { direction: string; model: string; r2: number; vert: number; ml: number; ap: number; px: number; pz: number }[];
  pooled: { model: string; dataset: string; single: number; pooled: number; delta: number; p: number | null }[];
  units: { dataset: string; protocol: string; model: string; vert_pbw: number; peak_pbw: number; cop_cm: number }[];
}

const MODEL_COLOR: Record<string, string> = { "CNN-LSTM": "#D55E00", CNN: "#009E73", "ICF (grid)": "#56B4E9", "ICF (search)": "#0072B2", ICF: "#0072B2" };
const AX = { tick: { fill: "#a1a1aa", fontSize: 11 }, stroke: "#3f3f46" };
const TT = { contentStyle: { background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }, cursor: { fill: "#27272a" } };
const DS_NAME: Record<string, string> = { GL: "GroundLink (locomotion, 6 subjects)", PH: "Patient Handling (occupational, 10 subjects)" };
const f2 = (v: number | null | undefined) => (v === null || v === undefined ? "–" : v.toFixed(2));

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--tamu)]">{kicker}</p>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function ResultsPage() {
  const [R, setR] = useState<Results | null>(null);
  const [xlabModel, setXlabModel] = useState("CNN-LSTM");
  useEffect(() => { fetch("/results_v2.json").then((r) => r.json()).then(setR); }, []);

  const leak = useMemo(() => (R ? ["GL", "PH"].map((ds) => ({
    ds, rows: R.headline.filter((h) => h.dataset === ds && h.trial !== null)
      .map((h) => ({ model: h.model, loso: h.loso, trial: h.trial as number, gap: (h.trial as number) - h.loso })),
  })) : []), [R]);

  const frameAP = useMemo(() => (R ? ["GL", "PH"].map((ds) => ({
    ds, rows: ["ICF", "CNN-LSTM", "CNN"].map((m) => {
      const get = (arm: string) => R.frame.find((f) => f.model === m && f.dataset === ds && f.arm === arm);
      return { model: m, plate: get("baseline")?.ap ?? 0, corot: get("corot")?.ap ?? 0, plateML: get("baseline")?.ml ?? 0, corotML: get("corot")?.ml ?? 0 };
    }),
  })) : []), [R]);

  const xlab = useMemo(() => (R ? ["vert", "ml", "ap", "px", "pz"].map((ch) => {
    const row: Record<string, number | string> = { ch: { vert: "Vertical", ml: "ML", ap: "AP", px: "CoP x", pz: "CoP z" }[ch] as string };
    for (const d of ["GL -> PH", "PH -> GL"]) {
      const e = R.crosslab.find((c) => c.direction === d && c.model === xlabModel) as unknown as Record<string, number> | undefined;
      row[d] = e ? Math.max(-3, e[ch]) : 0;
    }
    return row;
  }) : []), [R, xlabModel]);

  if (!R) return <p className="text-sm text-zinc-500">Loading results…</p>;

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="space-y-2">
        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
          Results · JBHI submission
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white">What each evaluation choice costs</h1>
        <p className="text-sm text-zinc-400 max-w-3xl">
          Three sequence models (CNN, CNN-LSTM, and a CNN-Transformer hybrid, ICF) on two independent datasets, one pipeline,
          one tuning procedure, three seeds. All numbers are the paper&apos;s, after the October 2026 GroundLink unit fix.
          R² is the coefficient of determination averaged over the ten force and centre-of-pressure channels.
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          {[["leakage", "1 · Leakage"], ["frame", "2 · Target frame"], ["models", "3 · Models"], ["crosslab", "4 · Cross-lab"], ["units", "Physical units"]].map(([id, l]) => (
            <a key={id} href={`#${id}`} className="rounded border border-zinc-800 px-2 py-1 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200">{l}</a>
          ))}
        </div>
      </div>

      <Section id="leakage" kicker="Finding 1" title="Trial-level splits overstate subject-held-out accuracy by 0.04–0.19 R²">
        <p className="text-sm text-zinc-400 max-w-3xl">
          Same model, same configuration, two protocols. A trial-level split puts other trials of the test subject in training;
          leave-one-subject-out (LOSO) does not. The gap is what memorizing a person is worth. On the occupational data it is
          larger than any difference between architectures.{" "}
          <Link href="/replay" className="text-[color:var(--tamu)] hover:underline">See it on a single trial in the force replay →</Link>
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {leak.map(({ ds, rows }) => (
            <Card key={ds}>
              <CardHeader className="pb-1"><CardTitle className="text-sm">{DS_NAME[ds]}</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="model" {...AX} />
                    <YAxis domain={[0.4, 1]} {...AX} />
                    <Tooltip {...TT} formatter={(v: number) => v.toFixed(3)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="loso" name="LOSO (subject held out)" fill="#a1a1aa" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="trial" name="Trial split" fill="#a78bfa" radius={[3, 3, 0, 0]}
                      label={{ position: "top", fill: "#c4b5fd", fontSize: 10, formatter: (v: number) => "" + v.toFixed(2) }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0 text-xs text-zinc-400">
                Gap: {rows.map((r) => `${r.model} +${r.gap.toFixed(2)}`).join(" · ")}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="frame" kicker="Finding 2" title="An unstated target frame can make anteroposterior force look hardest">
        <p className="text-sm text-zinc-400 max-w-3xl">
          The inputs are rotated so every trial faces the same way. If the force targets are left in the force-plate frame, the
          model must predict a horizontal force whose axes it cannot see. On GroundLink (mean heading rotation about 138°) that
          costs 0.42–0.57 of anteroposterior R² for every model; a Newton&apos;s-law correlation computed before training shows the
          mismatch. Only 8 of 40 published estimators state their target frame.{" "}
          <Link href="/replay" className="text-[color:var(--tamu)] hover:underline">Toggle plate-frame targets in the replay →</Link>
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {frameAP.map(({ ds, rows }) => (
            <Card key={ds}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{ds}: anteroposterior force R²</CardTitle>
                <CardDescription className="text-xs">per-trial standardization in both arms</CardDescription>
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="model" {...AX} />
                    <YAxis domain={[0, 1]} {...AX} />
                    <Tooltip {...TT} formatter={(v: number) => v.toFixed(3)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="plate" name="Plate frame" fill="#52525b" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="corot" name="Co-rotated" fill="#0072B2" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Newton&apos;s-law check, before training</CardTitle>
              <CardDescription className="text-xs">Mean per-trial correlation of summed force with centre-of-mass acceleration</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs tabular-nums">
                <thead className="text-zinc-500"><tr><th className="text-left font-normal py-1">Data, targets</th><th className="text-right font-normal">AP</th><th className="text-right font-normal">ML</th><th className="text-right font-normal">Vert.</th></tr></thead>
                <tbody>
                  {R.newton.map((n) => (
                    <tr key={n.dataset + n.targets} className="border-t border-zinc-800 text-zinc-300">
                      <td className="py-1.5">{n.dataset}, {n.targets}</td>
                      <td className={`text-right ${n.dataset === "GL" ? "text-white font-medium" : ""}`}>{f2(n.ap)}</td>
                      <td className="text-right">{f2(n.ml)}</td><td className="text-right">{f2(n.vert)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-zinc-500">On GroundLink, AP force correlates with forward acceleration only once the targets are co-rotated; vertical, which no rotation changes, is the control.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="models" kicker="Finding 3" title="No architecture dominates">
        <p className="text-sm text-zinc-400 max-w-3xl">
          Tuned the same way and run with three seeds, the leader changes between datasets, and the gaps between models are
          smaller than the differences between people. A memoryless ridge regression on the same features already reaches
          {" "}{f2(R.ridge.GL?.r2)} on GroundLink and {f2(R.ridge.PH?.r2)} on Patient Handling; temporal modelling adds the rest.
        </p>
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs tabular-nums">
              <thead className="text-zinc-500">
                <tr><th className="text-left font-normal py-1">Data</th><th className="text-left font-normal">Model</th><th className="text-right font-normal">LOSO R²</th><th className="text-right font-normal">± seeds</th><th className="text-right font-normal">Vertical</th><th className="text-right font-normal">ML</th><th className="text-right font-normal">AP</th><th className="text-right font-normal">Trial split</th></tr>
              </thead>
              <tbody>
                {["GL", "PH"].flatMap((ds) => [
                  ...R.headline.filter((h) => h.dataset === ds).sort((a, b) => b.loso - a.loso).map((h, i) => (
                    <tr key={ds + h.model} className="border-t border-zinc-800 text-zinc-300">
                      <td className="py-1.5">{ds}</td>
                      <td><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: MODEL_COLOR[h.model] }} />{h.model}{i === 0 ? " (leads)" : ""}</td>
                      <td className="text-right text-white">{h.loso.toFixed(3)}</td><td className="text-right">{h.seed_sd.toFixed(3)}</td>
                      <td className="text-right">{f2(h.vert)}</td><td className="text-right">{f2(h.ml)}</td><td className="text-right">{f2(h.ap)}</td><td className="text-right">{f2(h.trial)}</td>
                    </tr>
                  )),
                  <tr key={ds + "ridge"} className="border-t border-zinc-800 text-zinc-500">
                    <td className="py-1.5">{ds}</td><td>Ridge (no temporal context)</td><td className="text-right">{f2(R.ridge[ds]?.r2)}</td><td /><td className="text-right">{f2(R.ridge[ds]?.vert)}</td><td /><td /><td />
                  </tr>,
                ])}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {["GL", "PH"].map((ds) => (
            <Card key={ds}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{ds}: R² per held-out subject</CardTitle>
                <CardDescription className="text-xs">mean of three seeds; each column is one person</CardDescription>
              </CardHeader>
              <CardContent className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="#27272a" />
                    <XAxis dataKey="subject" type="category" allowDuplicatedCategory={false} {...AX} tickFormatter={(s: string) => s.split("_")[1]} />
                    <YAxis dataKey="r2" domain={[0, 1]} {...AX} />
                    <ZAxis range={[36, 36]} />
                    <Tooltip {...TT} formatter={(v: number | string) => (typeof v === "number" ? v.toFixed(3) : v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {["CNN-LSTM", "CNN", "ICF (grid)", "ICF (search)"].map((m) => (
                      <Scatter key={m} name={m} data={R.subjects.filter((s) => s.dataset === ds && s.model === m)} fill={MODEL_COLOR[m]} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="crosslab" kicker="Finding 4" title="Transfer between laboratories fails in both directions">
        <p className="text-sm text-zinc-400 max-w-3xl">
          Each subject-held-out model is also tested on every subject of the other laboratory. The overall R² is below zero (worse
          than predicting the mean) for every model in both directions, and vertical force, which no rotation of the coordinate
          frame can change, fails too: the best cross-laboratory vertical R² is +0.12, against 0.70–0.90 within a laboratory. So the
          frame is not the cause. Training on both laboratories neither helps nor hurts either one on the same held-out subjects.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm">Cross-laboratory R² per channel (clipped at −3)</CardTitle>
                <select value={xlabModel} onChange={(e) => setXlabModel(e.target.value)} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200">
                  {["CNN-LSTM", "CNN", "ICF"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={xlab} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#27272a" vertical={false} />
                  <XAxis dataKey="ch" {...AX} />
                  <YAxis domain={[-3, 0.5]} ticks={[-3, -2, -1, 0]} {...AX} />
                  <ReferenceLine y={0} stroke="#a1a1aa" />
                  <Tooltip {...TT} formatter={(v: number) => (v <= -3 ? "≤ −3" : v.toFixed(2))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="GL -> PH" name="Train GroundLink → test Patient Handling" fill="#0072B2" radius={[0, 0, 3, 3]} />
                  <Bar dataKey="PH -> GL" name="Train Patient Handling → test GroundLink" fill="#D55E00" radius={[0, 0, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">Pooled training, matched subjects</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-xs tabular-nums">
                <thead className="text-zinc-500"><tr><th className="text-left font-normal py-1">Model, data</th><th className="text-right font-normal">One lab</th><th className="text-right font-normal">Both</th><th className="text-right font-normal">Δ</th></tr></thead>
                <tbody>
                  {R.pooled.map((p) => (
                    <tr key={p.model + p.dataset} className="border-t border-zinc-800 text-zinc-300">
                      <td className="py-1.5">{p.model}, {p.dataset}</td><td className="text-right">{p.single.toFixed(3)}</td><td className="text-right">{p.pooled.toFixed(3)}</td>
                      <td className="text-right">{p.delta >= 0 ? "+" : ""}{p.delta.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="units" kicker="In physical units" title="How large the errors are in body weights and centimetres">
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs tabular-nums">
              <thead className="text-zinc-500">
                <tr><th className="text-left font-normal py-1">Data</th><th className="text-left font-normal">Protocol</th><th className="text-left font-normal">Model</th><th className="text-right font-normal">Vertical RMSE (%BW)</th><th className="text-right font-normal">Peak vertical error (%BW)</th><th className="text-right font-normal">CoP error, loaded plate (cm)</th></tr>
              </thead>
              <tbody>
                {R.units.map((u) => (
                  <tr key={u.dataset + u.protocol + u.model} className={`border-t border-zinc-800 ${u.protocol === "LOSO" ? "text-zinc-200" : "text-zinc-500"}`}>
                    <td className="py-1.5">{u.dataset}</td><td>{u.protocol}</td><td>{u.model}</td>
                    <td className="text-right">{u.vert_pbw.toFixed(1)}</td><td className="text-right">{u.peak_pbw.toFixed(1)}</td><td className="text-right">{u.cop_cm.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-zinc-500">Per-trial means over held-out subjects. %BW = percent of body weight.</p>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
