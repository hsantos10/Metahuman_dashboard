# -*- coding: utf-8 -*-
"""Export GroundLink trials for the dashboard's 3D inference viewer.

For each chosen held-out trial: the marker trajectories at 50 Hz and the measured and predicted
ground reaction force and centre of pressure of every model, all put back in the laboratory frame.

The models predict targets in a canonical frame (forces in body weights with the horizontal axes co-rotated to the
trial's heading; CoP pelvis-relative, heading-aligned and divided by height). This script re-runs the pipeline's own
reader, pelvis and heading steps (code/src/data) on the raw files to recover the heading angle and pelvis track, then
inverts those transforms. As a check it compares the recovered measured forces and CoP with the raw force-plate files.

Only GroundLink (public dataset) is exported. Patient Handling is IRB data and is not shown per subject.

  python scripts/export_inference.py            # from the dashboard folder -> public/inference/*.json
Sources: code/runs/hprc/outputs/v2/e1/pred (LOSO, seed 42) and code/runs/hprc/outputs/v2/ts/pred (trial split, seed 42).
"""
import json, os, re, sys
from pathlib import Path
import numpy as np

CODE = Path(os.getenv("METAHUMAN_CODE", "E:/research/Metahuman/code"))
GL_ROOT = Path(os.getenv("GROUNDLINK_ROOT", "E:/research/GroundLink"))
OUT = Path(__file__).resolve().parents[1] / "public" / "inference"
os.environ["GROUNDLINK_GRF_UNITS"] = "kilonewton"     # the v2 (post unit-fix) reading
os.environ["GROUNDLINK_MARKER_UNITS"] = "mm"
sys.path.insert(0, str(CODE))
from src.data.groundlink_adapter import read_groundlink_c3d, read_groundlink_force, GROUNDLINK_MARKER_MAP   # noqa: E402
from src.data.preprocessing import subtract_pelvis_root, align_heading              # noqa: E402
import ezc3d                                                                         # noqa: E402

G = 9.81
PRED = CODE / "runs/hprc/outputs/v2/e1/pred"
TS = CODE / "runs/hprc/outputs/v2/ts/pred/gl_trialsplit_CNN-LSTM-hpo_s42.npz"
MODELS = [("CNN-LSTM-hpo", "CNN-LSTM"), ("CNN-hpo", "CNN"), ("ICF-grid128", "ICF (grid)"), ("ICF-hpo", "ICF (search)")]
TRIALS = [  # (trial, label); all are in the seed-42 trial-split test set, so both protocols can be compared
    ("s004_20220524_walk_5", "Walk"),
    ("s002_20220520_squat_1", "Squat"),
    ("s003_20220523_jumpingjack_2", "Jumping jack"),
    ("s006_20220614_hopping_2", "Hopping"),
    ("s006_20220614_balletsmalljump_2", "Ballet small jump"),
    ("s004_20220524_soccerkick_2", "Soccer kick"),
    ("s006_20220614_tennisserve_3", "Tennis serve"),
    ("s004_20220524_dog_3", "Yoga: downward dog"),
    ("s006_20220614_taichi_3", "Tai chi"),
    ("s003_20220523_chair_2", "Yoga: chair"),
]
CH = ["ml", "vert", "ap", "px", "pz"]
# GroundLink force files start at zero and ramp up over ~11 samples at 250 Hz (a filter start-up transient in the
# released data), so the replay starts at frame 3 (60 ms). Metrics drop only frame 0, as the paper does.
S = 3
DISPLAY_ONLY = {"QTMMod_head_top": "HEAD", "QTMMod_trunk_c7": "C7", "QTMMod_trunk_manu": "STRN"}


def denorm(z, i):
    p = z["preds"][i].astype(np.float64) * z["std"] + z["mean"]
    a = z["acts"][i].astype(np.float64) * z["std"] + z["mean"]
    n = int(z["mask"][i].sum())
    return p[:n], a[:n], [str(c) for c in z["columns"]]


def find(z, trial):
    idx = [k for k, t in enumerate(z["trials"]) if str(t) == trial]
    return idx[0] if idx else None


def to_lab(arr, cols, theta, pel_x, pel_z, height):
    """Canonical targets -> model frame (X = lab x, Y = up, Z = lab y). Forces stay in body weights; CoP in metres."""
    c, s = np.cos(theta), np.sin(theta)
    out = {}
    for p in (1, 2):
        g = lambda k: arr[:, cols.index(f"ground_force_{p}_{k}")]
        ml, ap, vt = g("ml"), g("ap"), g("vert")
        fx = c * ml - s * ap                     # inverse of rotate_force_horizontal (GL: model-X = AP, model-Z = ML)
        fz = s * ml + c * ap
        cx, cz = g("px") * height, g("pz") * height      # mm/m -> mm, still pelvis-relative and heading-aligned
        x = c * cx - s * cz + pel_x[: len(cx)]           # inverse of apply_cop_transform
        zz = s * cx + c * cz + pel_z[: len(cz)]
        out[p] = dict(F=np.stack([fx, vt, fz], 1), cop=np.stack([x / 1000.0, zz / 1000.0], 1))
    return out


def r2(p, a, cols, frames):
    """Per-trial R2: per channel over the given frames, averaged over the 10 channels (as the paper, one trial)."""
    v = []
    for j in range(len(cols)):
        aa, pp = a[frames, j], p[frames, j]
        ss = np.sum((aa - aa.mean()) ** 2)
        v.append(1 - np.sum((aa - pp) ** 2) / ss if ss > 1e-12 else np.nan)
    return float(np.nanmean(v))


def disp(v):   # model frame (X, Y up, Z = lab y, left-handed) -> three.js (X, Y up, -Z), right-handed
    v = np.asarray(v, dtype=np.float64).copy()
    v[..., -1] *= -1
    return v


def rnd(a, d=3):
    return np.round(np.asarray(a, dtype=np.float64), d).tolist()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ts = np.load(TS)
    index, checks = [], []
    for trial, label in TRIALS:
        subj = re.match(r"(s\d{3})_(\d+)_", trial)
        sdir = f"{subj.group(1)}_{subj.group(2)}"
        gl_id = f"gl_{int(subj.group(1)[1:])}"
        c3d_path = GL_ROOT / "c3d" / "c3d" / sdir / f"{trial}.c3d"
        frc_path = GL_ROOT / "force" / "force" / f"{subj.group(1)}_force" / subj.group(1) / f"{trial}.npy"

        mk = read_groundlink_c3d(str(c3d_path))                    # model frame, mm, 50 Hz
        rel, pelvis = subtract_pelvis_root(mk)
        _, theta = align_heading(rel)
        raw = read_groundlink_force(str(frc_path))                 # newtons, CoP metres, 50 Hz

        lo = np.load(PRED / f"gl_loso_CNN-LSTM-hpo_s42_{gl_id}.npz")
        i = find(lo, trial)
        mass, height = (float(x) for x in lo["meta"][i])
        _, act, cols = denorm(lo, i)
        n = len(act)
        assert n <= min(len(mk), len(raw)), (trial, n, len(mk), len(raw))
        px, pz = pelvis["pelvis_X"].values, pelvis["pelvis_Z"].values
        true = to_lab(act, cols, theta, px, pz, height)

        # check: recovered measured force (BW x m g) and loaded-plate CoP against the raw plate file
        frames = np.arange(1, n)                                   # frame 0 is dropped everywhere (pipeline zeroes it)
        ferr, cerr = [], []
        for p in (1, 2):
            rawF = np.stack([raw[f"ground_force_{p}_ap"], raw[f"ground_force_{p}_vert"], raw[f"ground_force_{p}_ml"]], 1)[:n]
            ferr.append(np.max(np.abs(true[p]["F"][frames] * mass * G - rawF[frames])))
            loaded = raw[f"ground_force_{p}_vert"].values[:n] > 0.05 * mass * G
            loaded[0] = False
            if loaded.any():
                rawC = np.stack([raw[f"ground_force_{p}_px"], raw[f"ground_force_{p}_pz"]], 1)[:n] * 1.0
                cerr.append(np.max(np.abs(true[p]["cop"][loaded] - rawC[loaded])))
        checks.append((trial, max(ferr), max(cerr) if cerr else 0.0))

        loaded = {p: (true[p]["F"][:, 1] > 0.05) for p in (1, 2)}
        preds, metrics = {}, {}
        sources = [(f"loso:{lab}", np.load(PRED / f"gl_loso_{cfg}_s42_{gl_id}.npz")) for cfg, lab in MODELS]
        sources.append(("trial:CNN-LSTM", ts))
        for key, z in sources:
            k = find(z, trial)
            if k is None:
                continue
            p, a, c2 = denorm(z, k)
            assert c2 == cols and len(p) == n, (key, trial)
            assert np.allclose(a, act, rtol=1e-3, atol=1e-2), (key, trial, "targets differ between sources")
            lab_p = to_lab(p, cols, theta, px, pz, height)
            preds[key] = {f"p{q}": dict(F=rnd(disp(lab_p[q]["F"][S:])), cop=rnd(disp(lab_p[q]["cop"][S:]), 4)) for q in (1, 2)}
            vi, ei = cols.index("ground_force_1_vert"), cols.index("ground_force_2_vert")
            vp = np.concatenate([p[frames, vi], p[frames, ei]]); va = np.concatenate([act[frames, vi], act[frames, ei]])
            dc = []
            for q in (1, 2):
                m_ = loaded[q][frames]
                if m_.sum() >= 10:
                    dc.append(np.linalg.norm(lab_p[q]["cop"][frames][m_] - true[q]["cop"][frames][m_], axis=1))
            metrics[key] = dict(
                r2=round(r2(p, act, cols, frames), 3),
                vert_r2=round(float(1 - np.sum((vp - va) ** 2) / np.sum((va - va.mean()) ** 2)), 3),
                vert_rmse_pbw=round(float(np.sqrt(np.mean((vp - va) ** 2))) * 100, 1),
                cop_cm=round(float(np.sqrt(np.mean(np.concatenate(dc) ** 2))) * 100, 1) if dc else None,
            )

        # display markers: the model's GroundLink set under short names, plus head / C7 / sternum for the figure only
        # (not model inputs). Same decimation and axis swap as read_groundlink_c3d, so coordinates are identical.
        c3 = ezc3d.c3d(str(c3d_path))
        labels = c3["parameters"]["POINT"]["LABELS"]["value"]
        step = int(c3["header"]["points"]["frame_rate"] / 50)
        pts = c3["data"]["points"]
        names, cols3 = [], []
        for gl_name, short in list(GROUNDLINK_MARKER_MAP.items()) + list(DISPLAY_ONLY.items()):
            if gl_name in labels:
                k = labels.index(gl_name)
                cols3.append(np.stack([pts[0, k, ::step], pts[2, k, ::step], pts[1, k, ::step]], 1))
                names.append(short)
        pos = np.stack(cols3, 1)[S:n] / 1000.0
        lasi = "Left Anterior Superior Iliac Spine"     # same marker through the pipeline reader
        assert np.allclose(pos[:, names.index("LASI")] * 1000.0,
                           np.stack([mk[f"{lasi}_{a}"].values for a in "XYZ"], 1)[S:n], atol=1e-6), trial
        doc = dict(
            id=trial, label=label, subject=f"GroundLink subject {int(subj.group(1)[1:])}", heldOut=gl_id,
            rate=50, n=int(n - S), startFrame=S, massKg=round(mass, 1), heightM=round(height, 2),
            headingDeg=round(float(np.degrees(theta)), 1),
            markers=names, displayOnly=list(DISPLAY_ONLY.values()), positions=rnd(disp(pos)),
            truth={f"p{q}": dict(F=rnd(disp(true[q]["F"][S:])), cop=rnd(disp(true[q]["cop"][S:]), 4),
                                 loaded=[bool(x) for x in loaded[q][S:]]) for q in (1, 2)},
            preds=preds, metrics=metrics,
        )
        (OUT / f"{trial}.json").write_text(json.dumps(doc, separators=(",", ":")))
        index.append(dict(id=trial, label=label, subject=doc["subject"], n=doc["n"], metrics=metrics))
        print(f"{trial:38s} n={n-S:5d} theta={doc['headingDeg']:7.1f}  " +
              "  ".join(f"{k.split(':')[0][0]}{k.split(':')[1][:6]} vR2={v['vert_r2']:.2f} {v['vert_rmse_pbw']:.0f}%BW cop={v['cop_cm']}" for k, v in metrics.items()))

    (OUT / "index.json").write_text(json.dumps(dict(
        generated="from code/runs/hprc/outputs/v2 (LOSO and trial split, seed 42)", trials=index), indent=1))
    print("\ncheck vs raw plate files (max abs error): force N, CoP m")
    for t, fe, ce in checks:
        print(f"  {t:38s} force {fe:8.3f} N   CoP {ce:.4f} m")


if __name__ == "__main__":
    main()
