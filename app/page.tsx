"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Footprints, BarChart3, ShieldAlert, Compass, Scale, Globe2 } from "lucide-react";

/* Numbers are the paper's (paper/jbhi/numbers.tex, v2 run family); the Results page reads them from results_v2.json. */
const FINDINGS = [
  {
    icon: ShieldAlert, kicker: "Leakage", stat: "+0.04 to +0.19 R²",
    text: "Trial-level splits, which put the test person's other trials in training, overstate subject-held-out accuracy. On the occupational data the overstatement is larger than any difference between architectures.",
    href: "/results#leakage",
  },
  {
    icon: Compass, kicker: "Target frame", stat: "0.42–0.57 R² of AP force",
    text: "Leaving force targets in the force-plate frame while the inputs are heading-aligned costs that much anteroposterior accuracy for every model, enough to make that channel look intrinsically hardest. A Newton's-law check catches it before training.",
    href: "/results#frame",
  },
  {
    icon: Scale, kicker: "Architecture", stat: "no model dominates",
    text: "Tuned by one procedure and run with three seeds, the leader changes between datasets (CNN-LSTM 0.80 on locomotion, ICF 0.65 on occupational tasks) and the gaps sit inside subject-to-subject variability.",
    href: "/results#models",
  },
  {
    icon: Globe2, kicker: "Cross-laboratory", stat: "below chance, both ways",
    text: "Models trained in one laboratory fail in the other, vertical force included, which no rotation of the frame can affect. Pooling both laboratories neither helps nor hurts on matched subjects.",
    href: "/results#crosslab",
  },
];

const PIPELINE = [
  ["Motion capture", "20 markers shared by both labs, 50 Hz"],
  ["Body frame", "subtract pelvis, rotate to a common heading, scale by height"],
  ["Features", "positions, velocities, accelerations, distances: 216 per frame"],
  ["Sequence model", "CNN, CNN-LSTM or CNN-Transformer (ICF)"],
  ["10 outputs per frame", "3D force (body weights) and centre of pressure, two plates"],
];

export default function OverviewPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div className="space-y-3">
        <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest bg-[color:var(--tamu-muted)] text-[color:var(--tamu)]">
          Metahuman · Chapter 1 · Texas A&amp;M University
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white max-w-4xl">
          Subject-held-out evaluation of deep ground reaction force estimators across two laboratories
        </h1>
        <p className="text-sm text-zinc-400">Hernan David Santos, Yinong Chen, Yu Ding, Xudong Zhang, Jian Tao</p>
        <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
          Deep networks can estimate the forces under a person&apos;s feet from motion-capture markers, a &ldquo;virtual force plate&rdquo;.
          They are usually validated inside one laboratory, in a seldom-stated coordinate frame, and sometimes with splits that
          put the same person in training and test. We measured what each of those practices costs, and whether the models
          transfer between laboratories.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/replay" className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--tamu)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
            <Footprints className="h-4 w-4" /> Watch a prediction in 3D
          </Link>
          <Link href="/results" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500">
            <BarChart3 className="h-4 w-4" /> All results
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FINDINGS.map((f) => (
          <Link key={f.kicker} href={f.href} className="group">
            <Card className="h-full transition-colors group-hover:border-zinc-600">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <f.icon className="h-3.5 w-3.5 text-[color:var(--tamu)]" /> {f.kicker}
                </div>
                <CardTitle className="text-2xl text-white tabular-nums">{f.stat}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-400 leading-relaxed">
                {f.text}
                <span className="mt-2 flex items-center gap-1 text-xs text-[color:var(--tamu)] opacity-0 transition-opacity group-hover:opacity-100">
                  details <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">The pipeline, one trial at a time</CardTitle></CardHeader>
        <CardContent>
          <ol className="grid gap-2 md:grid-cols-5">
            {PIPELINE.map(([t, d], i) => (
              <li key={t} className="relative rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="text-[10px] font-mono text-zinc-500">{i + 1}</p>
                <p className="text-sm font-medium text-white">{t}</p>
                <p className="mt-1 text-xs text-zinc-400 leading-snug">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-zinc-500">
            The force targets must be rotated with the inputs in step 2. The <Link href="/replay" className="text-[color:var(--tamu)] hover:underline">force replay</Link> animates
            this step and shows what happens when they are not.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">GroundLink: locomotion and sport</CardTitle></CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed">
            Public dataset (Han et al., SIGGRAPH Asia 2023). 6 subjects, 279 trials of walking, jumping, dance, yoga, tennis and more;
            Qualisys markers and two force plates. Used for the 3D replays on this site.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">Patient Handling: occupational tasks</CardTitle></CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed">
            Lifting, transferring and repositioning (Chen et al., 2025). 10 subjects, 434 trials; Vicon markers and two force plates.
            Collected under Texas A&amp;M IRB STUDY2024-0979, so this site shows only aggregate results for it.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
