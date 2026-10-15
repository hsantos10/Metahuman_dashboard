"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import type { TrialData, ReplayControls, Vec3 } from "@/components/force-replay";
import { COLORS } from "@/components/force-replay";

const ForceReplay = dynamic(() => import("@/components/force-replay"), { ssr: false });

interface IndexEntry { id: string; label: string; subject: string; n: number; metrics: TrialData["metrics"] }
const MODEL_KEYS = ["loso:CNN-LSTM", "loso:CNN", "loso:ICF (grid)", "loso:ICF (search)", "trial:CNN-LSTM"];
const modelLabel = (k: string) => (k.startsWith("trial:") ? `${k.slice(6)}, trial split` : k.slice(5));
const CHANNELS = { vert: "Vertical", ap: "Anteroposterior", ml: "Mediolateral" } as const;
type Channel = keyof typeof CHANNELS;

/** body-frame components of a lab force vector (display axes): rotate by the trial heading, as the model's targets */
function bodyFrame(F: Vec3, theta: number) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return { ml: c * F[0] - s * F[2], vert: F[1], ap: -(s * F[0] + c * F[2]) };
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`px-2.5 py-1 text-xs rounded ${value === v ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ReplayPage() {
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [trialId, setTrialId] = useState("s004_20220524_dog_3");
  const [data, setData] = useState<TrialData | null>(null);
  const [predKey, setPredKey] = useState("loso:CNN-LSTM");
  const [compare, setCompare] = useState(true);
  const [view, setView] = useState<"lab" | "model">("lab");
  const [targets, setTargets] = useState<"co" | "plate">("co");
  const [camera, setCamera] = useState("iso");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [channel, setChannel] = useState<Channel>("vert");
  const [uiFrame, setUiFrame] = useState(0);

  const ctl: ReplayControls = {
    frame: useRef(0), playing: useRef(true), speed: useRef(1), view: useRef(0), coRotated: useRef(true),
  };
  const ctlRef = useRef(ctl);
  const C = ctlRef.current;
  useEffect(() => { C.playing.current = playing; }, [playing, C]);
  useEffect(() => { C.speed.current = speed; }, [speed, C]);
  useEffect(() => { C.view.current = view === "model" ? 1 : 0; }, [view, C]);
  useEffect(() => { C.coRotated.current = targets === "co"; }, [targets, C]);

  useEffect(() => {
    fetch("/inference/index.json").then((r) => r.json()).then((j) => setIndex(j.trials)).catch(() => setIndex([]));
  }, []);
  useEffect(() => {
    setData(null);
    fetch(`/inference/${trialId}.json`).then((r) => r.json()).then((d: TrialData) => { C.frame.current = 0; setData(d); });
  }, [trialId, C]);
  useEffect(() => {   // poll the animation clock for the slider, chart playhead and readouts
    const h = setInterval(() => setUiFrame(Math.floor(C.frame.current)), 100);
    return () => clearInterval(h);
  }, [C]);

  const compareKey = compare && !predKey.startsWith("trial:") ? "trial:CNN-LSTM" : null;
  const theta = data ? (data.headingDeg * Math.PI) / 180 : 0;

  const series = useMemo(() => {
    if (!data) return [];
    const pred = data.preds[predKey], cmp = compareKey ? data.preds[compareKey] : null;
    return data.truth.p1.F.map((_, i) => {
      const row: Record<string, number> = { t: i / data.rate };
      for (const p of ["p1", "p2"] as const) {
        row[`true_${p}`] = bodyFrame(data.truth[p].F[i], theta)[channel];
        if (pred) row[`pred_${p}`] = bodyFrame(pred[p].F[i], theta)[channel];
        if (cmp) row[`cmp_${p}`] = bodyFrame(cmp[p].F[i], theta)[channel];
      }
      return row;
    });
  }, [data, predKey, compareKey, channel, theta]);

  const now = data && uiFrame < data.n ? (() => {
    const f = uiFrame, pred = data.preds[predKey];
    const sum = (S: { p1: { F: Vec3[] }; p2: { F: Vec3[] } }) => S.p1.F[f][1] + S.p2.F[f][1];
    return { t: f / data.rate, trueV: sum(data.truth), predV: pred ? sum(pred) : NaN, cmpV: compareKey ? sum(data.preds[compareKey]) : NaN };
  })() : null;

  const stepInfo = view === "lab"
    ? "Laboratory frame: the markers as recorded. Each force is drawn at its centre of pressure, in body weights (1 BW = 0.9 m of arrow); the cyan wedge on the floor is the trial's heading."
    : targets === "co"
      ? "The model's view: the pipeline subtracts the pelvis and rotates every trial so the subject faces the same way. The force targets are rotated with it (co-rotated), so a forward push always points forward in the body's frame."
      : "Plate-frame targets (the old pipeline): the body is rotated but the force is not, so the horizontal force the model must predict points in a direction its inputs cannot see. On GroundLink this cost 0.42–0.57 of anteroposterior R² for every model.";

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="space-y-2">
        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
          Inference replay
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white">Measured vs predicted ground reaction force</h1>
        <p className="text-sm text-zinc-400 max-w-3xl">
          A GroundLink trial from a subject the model never saw in training (leave-one-subject-out), replayed in 3D.
          The <span style={{ color: COLORS.truth }}>white arrows</span> are the force plates&apos; measurement; the{" "}
          <span style={{ color: COLORS.loso }}>amber arrows</span> are the model&apos;s prediction from the markers alone; the{" "}
          <span style={{ color: COLORS.trial }}>violet arrows</span> come from the same model trained with a trial-level split, which
          had seen this person&apos;s other trials.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {index.map((e) => {
          const m = e.metrics["loso:CNN-LSTM"];
          return (
            <button key={e.id} onClick={() => setTrialId(e.id)}
              className={`rounded-md border px-2.5 py-1.5 text-left text-xs ${trialId === e.id ? "border-[color:var(--tamu)] bg-zinc-800 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"}`}>
              <div className="font-medium">{e.label}</div>
              <div className="text-[10px] text-zinc-500">vertical R² {m?.vert_r2.toFixed(2)}</div>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{data ? `${data.label} · ${data.subject}` : "Loading…"}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {data ? `${(data.n / data.rate).toFixed(1)} s at ${data.rate} Hz · heading rotation ${data.headingDeg.toFixed(0)}° · drag to orbit, scroll to zoom` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Seg value={view} onChange={setView} options={[["lab", "Lab view"], ["model", "Model's view"]]} />
              {view === "model" && <Seg value={targets} onChange={setTargets} options={[["co", "Co-rotated targets"], ["plate", "Plate-frame targets"]]} />}
              <Seg value={camera} onChange={setCamera} options={[["iso", "3/4"], ["side", "Side"], ["front", "Front"], ["top", "Top"]]} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[460px] md:h-[540px]">
            {data && <ForceReplay data={data} predKey={predKey} compareKey={compareKey} ctl={C} cameraPreset={camera} />}
            <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-11rem)] sm:max-w-sm rounded-md bg-zinc-950/80 p-2.5 text-[11px] leading-snug text-zinc-300">
              {stepInfo}
            </div>
            {now && (
              <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-zinc-950/80 p-2.5 text-[11px] tabular-nums text-zinc-300">
                <div>t = {now.t.toFixed(2)} s</div>
                <div>vertical, both plates</div>
                <div style={{ color: COLORS.truth }}>measured {(now.trueV * 100).toFixed(0)} %BW</div>
                <div style={{ color: predKey.startsWith("trial") ? COLORS.trial : COLORS.loso }}>predicted {(now.predV * 100).toFixed(0)} %BW</div>
                {compareKey && <div style={{ color: COLORS.trial }}>trial split {(now.cmpV * 100).toFixed(0)} %BW</div>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 px-4 py-3">
            <button onClick={() => setPlaying(!playing)} className="rounded-md bg-zinc-800 p-1.5 text-white hover:bg-zinc-700" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button onClick={() => { C.frame.current = 0; }} className="rounded-md bg-zinc-800 p-1.5 text-white hover:bg-zinc-700" aria-label="Restart">
              <RotateCcw className="h-4 w-4" />
            </button>
            <Slider className="min-w-[160px] flex-1" min={0} max={data ? data.n - 1 : 1} step={1} value={[uiFrame]}
              onValueChange={(v) => { C.frame.current = v[0]; setUiFrame(v[0]); }} />
            <Seg value={String(speed)} onChange={(v) => setSpeed(Number(v))} options={[["0.25", "¼×"], ["0.5", "½×"], ["1", "1×"], ["2", "2×"]]} />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 px-4 py-3 text-xs text-zinc-400">
            <span>Model</span>
            <select value={predKey} onChange={(e) => setPredKey(e.target.value)} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-200">
              {MODEL_KEYS.map((k) => <option key={k} value={k}>{modelLabel(k)}{k.startsWith("loso") ? ", subject held out" : ""}</option>)}
            </select>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={compare} disabled={predKey.startsWith("trial")} onChange={(e) => setCompare(e.target.checked)} />
              also show the trial-split model (violet)
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{CHANNELS[channel]} force over the trial</CardTitle>
              <Seg value={channel} onChange={setChannel} options={Object.entries(CHANNELS) as [Channel, string][]} />
            </div>
            <CardDescription className="text-xs">Body weights, in the body&apos;s frame (as the model is scored). Solid: plate 1; dashed: plate 2.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#27272a" />
                <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: "#a1a1aa", fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)} s`} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 11 }} labelFormatter={(v) => `${Number(v).toFixed(2)} s`} formatter={(v: number) => v.toFixed(2)} />
                {(["p1", "p2"] as const).map((p) => [
                  <Line key={`t${p}`} dataKey={`true_${p}`} name={`measured ${p}`} stroke={COLORS.truth} dot={false} strokeWidth={1.6} strokeDasharray={p === "p2" ? "4 3" : undefined} isAnimationActive={false} />,
                  <Line key={`p${p}`} dataKey={`pred_${p}`} name={`predicted ${p}`} stroke={predKey.startsWith("trial") ? COLORS.trial : COLORS.loso} dot={false} strokeWidth={1.4} strokeDasharray={p === "p2" ? "4 3" : undefined} isAnimationActive={false} />,
                  compareKey ? <Line key={`c${p}`} dataKey={`cmp_${p}`} name={`trial split ${p}`} stroke={COLORS.trial} dot={false} strokeWidth={1.1} strokeOpacity={0.8} strokeDasharray={p === "p2" ? "4 3" : undefined} isAnimationActive={false} /> : null,
                ])}
                {data && <ReferenceLine x={uiFrame / data.rate} stroke="#f43f5e" strokeWidth={1.2} />}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">This trial, every model</CardTitle>
            <CardDescription className="text-xs">Vertical force over both plates; CoP error while the plate carries load.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs tabular-nums">
              <thead className="text-zinc-500">
                <tr><th className="py-1 text-left font-normal">Model</th><th className="text-right font-normal">R²</th><th className="text-right font-normal">%BW</th><th className="text-right font-normal">CoP cm</th></tr>
              </thead>
              <tbody>
                {data && MODEL_KEYS.filter((k) => data.metrics[k]).map((k) => {
                  const m = data.metrics[k];
                  return (
                    <tr key={k} onClick={() => setPredKey(k)} className={`cursor-pointer border-t border-zinc-800 ${k === predKey ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
                      <td className="py-1.5" style={k.startsWith("trial") ? { color: COLORS.trial } : undefined}>{modelLabel(k)}</td>
                      <td className="text-right">{m.vert_r2.toFixed(2)}</td>
                      <td className="text-right">{m.vert_rmse_pbw.toFixed(0)}</td>
                      <td className="text-right">{m.cop_cm?.toFixed(0) ?? "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-snug text-zinc-500">
              The trial-split row is the leakage the paper measures: that model saw this subject during training. Single-trial
              numbers are noisy; the paper reports means over all held-out subjects.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-base">How this replay was made</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs leading-relaxed text-zinc-400">
          <p>
            The models never see laboratory coordinates: the pipeline subtracts the pelvis, rotates each trial to a common heading,
            scales by height, and predicts forces in body weights in that body frame. To draw predictions in the laboratory, the
            export script re-runs the pipeline&apos;s own reader and transforms on the raw GroundLink files to recover each trial&apos;s
            heading angle and pelvis track, then inverts them. As a check, the same inversion applied to the training targets
            reproduces the raw force-plate files exactly (largest difference under 0.001 N and 0.1 mm on all ten trials).
          </p>
          <p>
            Predictions are the saved seed-42 fold models of the paper (models retrained after the GroundLink unit fix of October 2026).
            Plate outlines are not drawn: the plate-corner parameters in the GroundLink capture files do not match the frame of its
            force files, so only what was measured (force and centre of pressure) is shown. Only GroundLink, a public dataset, is
            replayed; the occupational Patient Handling data are protected human-subject data and appear on this site as aggregate
            results only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
