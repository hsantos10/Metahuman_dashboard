# -*- coding: utf-8 -*-
"""Aggregate results of the JBHI paper for the dashboard (public/results_v2.json).

Reads the paper's own results.json (paper/jbhi, built by build_results.py from the v2 run family) and the staged
per-subject LOSO file, and keeps only aggregate numbers: model means, per-channel means, and per-subject R2 averaged
over three seeds (anonymous subject codes, as in the supplement). No trial data.

  python scripts/export_results.py
"""
import json
from pathlib import Path
import pandas as pd

PAPER = Path("E:/research/Metahuman/paper/jbhi")
STAGE = Path("E:/research/Metahuman/code/outputs/paper_v2_stage/outputs")
OUT = Path(__file__).resolve().parents[1] / "public" / "results_v2.json"
LABEL = {"CNN-LSTM-hpo": "CNN-LSTM", "CNN-hpo": "CNN", "ICF-grid128": "ICF (grid)", "ICF-hpo": "ICF (search)"}

R = json.loads((PAPER / "results.json").read_text())
out = {"source": "paper/jbhi/results.json (v2 run family, GroundLink retrained after the 2026-10 unit fix)"}

# headline: LOSO (3 seeds) and the trial split of the same configuration
head = []
for ds in ("gl", "ph"):
    ts = R["trial_split_corrected"][ds]
    for cfg, lab in LABEL.items():
        m = R[f"multiseed_{ds}"][cfg]
        head.append(dict(dataset=ds.upper(), model=lab, loso=m["R2"], seed_sd=m["R2_sd_seeds"], vert=m["VERT"],
                         ml=m["ML"], ap=m["AP"], trial=ts[cfg]["r2"] if cfg in ts else None))
out["headline"] = head
out["ridge"] = {ds: dict(r2=v["R2"], vert=v["VERT"]) for ds, v in R["ridge"].items()}

# per-subject LOSO R2, mean of three seeds
subj = []
for ds in ("gl", "ph"):
    df = pd.read_csv(STAGE / f"e1_multiseed_corrected/{ds}_multiseed.csv")
    g = df.groupby(["config", "subject"])["r2"].mean().reset_index()
    g = g.assign(k=g["subject"].str.split("_").str[1].astype(int)).sort_values(["k", "config"])
    for r in g.itertuples():
        if r.config in LABEL:
            subj.append(dict(dataset=ds.upper(), model=LABEL[r.config], subject=r.subject, r2=round(float(r.r2), 3)))
out["subjects"] = subj

# frame factorial: ICF fixed config + CNN-LSTM and CNN tuned, four arms, per channel
frame = []
for k, v in R["ablation"].items():
    frame.append(dict(model="ICF", dataset=v["dataset"], arm=v["arm"], r2=v["R2"], vert=v["VERT"], ml=v["ML"], ap=v["AP"], px=v["PX"], pz=v["PZ"]))
for k, v in R.get("ablation_models", {}).items():
    frame.append(dict(model={"cnn-lstm": "CNN-LSTM", "cnn": "CNN"}[v["model"]], dataset=v["dataset"], arm=v["arm"], r2=v["R2"],
                      vert=v["VERT"], ml=v["ML"], ap=v["AP"], px=v["PX"], pz=v["PZ"]))
out["frame"] = frame

# Newton's-law check (mean per-trial correlation; paper/jbhi/newton_check.csv)
nc = pd.read_csv(PAPER / "newton_check.csv")
out["newton"] = [dict(dataset=ds.upper(), targets="co-rotated" if rot else "plate frame",
                      ap=round(float(g["r_forward"].mean()), 3), ml=round(float(g["r_lateral"].mean()), 3), vert=round(float(g["r_vertical"].mean()), 3))
                 for (ds, rot), g in nc.groupby(["dataset", "rotate"])]

# cross-laboratory transfer, pooled training (matched subjects), physical units, masked rescoring
out["crosslab"] = [dict(direction=v["direction"], model=v["model"], r2=v["R2"], vert=v["VERT"], ml=v["ML"], ap=v["AP"], px=v["PX"], pz=v["PZ"])
                   for v in R["crosslab_corrected"].values()]
out["pooled"] = [dict(model=r["model"], dataset=r["dataset"], single=r["single_matched"], pooled=r["combined"], delta=r["delta"], p=r.get("p"))
                 for r in R["matched_corrected"]]
units = []
for k, v in R["units"].items():
    ds, proto = k.split("_")[0], ("LOSO" if "_loso_" in k else "trial split")
    cfg = k.split("_", 2)[2] if proto == "LOSO" else k.split("_trial_split_")[-1]
    if cfg in LABEL:
        units.append(dict(dataset=ds.upper(), protocol=proto, model=LABEL[cfg], vert_pbw=v["vert"], peak_pbw=v["peak"], cop_cm=v["cop"]))
out["units"] = units

OUT.write_text(json.dumps(out, indent=1))
print("wrote", OUT, {k: len(v) if isinstance(v, list) else "" for k, v in out.items()})
