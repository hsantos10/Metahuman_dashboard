import ezc3d
import numpy as np
import torch
import json
import os

# --- Load C3D ---
c3d = ezc3d.c3d(r'E:\GroundLink\c3d\c3d\s002_20220520\s002_20220520_ballethighleg_2.c3d')
labels = c3d['parameters']['POINT']['LABELS']['value']
pts = np.array(c3d['data']['points'])  # (4, 99, 2536)

MARKER_MAP = {
    'QTMMod_head_top': 'HEAD',
    'QTMMod_trunk_c7': 'C7',
    'QTMMod_trunk_manu': 'STRN',
    'QTMMod_pelvis_l_asis': 'LASI',
    'QTMMod_pelvis_r_asis': 'RASI',
    'QTMMod_pelvis_l_psis': 'LPSI',
    'QTMMod_pelvis_r_psis': 'RPSI',
    'QTMMod_l_sho_ant': 'LSHO',
    'QTMMod_r_sho_ant': 'RSHO',
    'QTMMod_l_elb_lat': 'LELB',
    'QTMMod_r_elb_lat': 'RELB',
    'QTMMod_l_wri_lat': 'LWRA',
    'QTMMod_r_wri_lat': 'RWRA',
    'QTMMod_l_knee_lat': 'LKNE',
    'QTMMod_r_knee_lat': 'RKNE',
    'QTMMod_l_ank_lat': 'LANK',
    'QTMMod_r_ank_lat': 'RANK',
    'QTMMod_l_foot_toe': 'LTOE',
    'QTMMod_r_foot_toe': 'RTOE',
    'QTMMod_l_foot_heel': 'LHEE',
    'QTMMod_r_foot_heel': 'RHEE',
}

label_to_idx = {l: i for i, l in enumerate(labels)}
selected_idxs = {}
for gl_name, short_name in MARKER_MAP.items():
    if gl_name in label_to_idx:
        selected_idxs[short_name] = label_to_idx[gl_name]
    else:
        print(f'WARNING: {gl_name} not found')

print('Selected markers:', list(selected_idxs.keys()))

nframes = pts.shape[2]
print('Total frames:', nframes)

# Downsample: every 5th frame (250Hz -> 50Hz)
STEP = 5
MAX_FRAMES = min(nframes, 2536)  # All frames (about 10 seconds)
frame_idxs = list(range(0, MAX_FRAMES, STEP))
print('Downsampled frames:', len(frame_idxs))

marker_names = list(selected_idxs.keys())

# Find the ground plane (min Z across all foot markers over all frames)
foot_markers = ['LTOE', 'RTOE', 'LHEE', 'RHEE', 'LANK', 'RANK']
foot_idxs = [selected_idxs[n] for n in foot_markers]
ground_z = np.min(pts[2, foot_idxs, :])  # Z is vertical in original coords
print(f'Ground Z level: {ground_z:.1f} mm')

# Extract positions: centered on first-frame pelvis XY, grounded at feet Z
lasi_idx = selected_idxs['LASI']
rasi_idx = selected_idxs['RASI']
ref_x = (pts[0, lasi_idx, 0] + pts[0, rasi_idx, 0]) / 2.0
ref_y = (pts[1, lasi_idx, 0] + pts[1, rasi_idx, 0]) / 2.0

positions = []
for fi in frame_idxs:
    frame = {}
    for name, idx in selected_idxs.items():
        x = (pts[0, idx, fi] - ref_x) / 1000.0   # mm -> m, centered
        y = (pts[2, idx, fi] - ground_z) / 1000.0  # Z up -> Y up, grounded
        z = (pts[1, idx, fi] - ref_y) / 1000.0     # Y -> Z forward
        frame[name] = [round(x, 4), round(y, 4), round(z, 4)]
    positions.append(frame)

# --- Load Force ---
force_data = np.load(
    r'E:\GroundLink\force\force\s002_force\s002\s002_20220520_ballethighleg_2.npy',
    allow_pickle=True
).item()
grf_tensor = force_data['GRF']  # [2536, 2, 3]
cop_tensor = force_data['CoP']  # [2536, 2, 3]

if isinstance(grf_tensor, torch.Tensor):
    grf = grf_tensor.numpy()
    cop = cop_tensor.numpy()
else:
    grf = np.array(grf_tensor)
    cop = np.array(cop_tensor)

max_grf = float(np.max(np.abs(grf[:, :, 2])))
print(f'Max vertical GRF: {max_grf:.2f}')

# Smooth GRF and CoP with a Gaussian filter to reduce jitter before saving
from scipy.ndimage import gaussian_filter1d
SMOOTH_SIGMA = 1.5  # frames at 50Hz
for plate in range(2):
    for axis in range(3):
        grf[:, plate, axis] = gaussian_filter1d(grf[:, plate, axis], sigma=SMOOTH_SIGMA)
        cop[:, plate, axis] = gaussian_filter1d(cop[:, plate, axis], sigma=SMOOTH_SIGMA)

# CoP is in lab-frame meters; apply same centering as markers:
# world_x = cop_lab_x - ref_x/1000   (ref_x is in mm)
# world_z = cop_lab_y - ref_y/1000   (cop axis 1 = AP = marker pts[1])
cop_ref_x = ref_x / 1000.0   # e.g. -0.2599 m
cop_ref_z = ref_y / 1000.0   # e.g.  0.5969 m

forces = []
for fi in frame_idxs:
    f = {
        # GRF axes: [ML, AP, Vert] — keep as-is (normalised, Y-up in viewer)
        'grf1': [round(float(grf[fi, 0, j]), 4) for j in range(3)],
        'grf2': [round(float(grf[fi, 1, j]), 4) for j in range(3)],
        # CoP centred and converted: [world_x (ML), world_z (AP)]
        'cop1': [round(float(cop[fi, 0, 0]) - cop_ref_x, 4),
                 round(float(cop[fi, 0, 1]) - cop_ref_z, 4)],
        'cop2': [round(float(cop[fi, 1, 0]) - cop_ref_x, 4),
                 round(float(cop[fi, 1, 1]) - cop_ref_z, 4)],
    }
    forces.append(f)

output = {
    'subject': 's002',
    'trial': 'ballethighleg_2',
    'activity': 'Ballet High Leg',
    'originalRate': 250,
    'downsampleStep': STEP,
    'effectiveRate': 50,
    'nFrames': len(frame_idxs),
    'markerNames': marker_names,
    'maxVerticalGRF': round(max_grf, 2),
    'frames': []
}

for i in range(len(frame_idxs)):
    output['frames'].append({
        'markers': positions[i],
        'forces': forces[i]
    })

out_path = r'E:\Metahuman_dashboard\public\motion_data.json'
with open(out_path, 'w') as f:
    json.dump(output, f)

file_size = os.path.getsize(out_path) / 1024
n = output['nFrames']
print(f'Saved to {out_path}')
print(f'File size: {file_size:.1f} KB')
print(f'Frames: {n}')
