import json
d = json.load(open(r'E:\Metahuman_dashboard\public\motion_data.json'))
print('--- cop2 x vs RANK.x, cop2 z vs RANK.z (first 20 active frames) ---')
count = 0
for i, f in enumerate(d['frames']):
    if abs(f['forces']['grf2'][2]) > 0.05 and count < 20:
        rank = f['markers']['RANK']
        c2 = f['forces']['cop2']
        print(f'Frame {i}: RANK.x={rank[0]:.3f} RANK.z={rank[2]:.3f} | cop2.x={c2[0]:.3f} cop2.z={c2[1]:.3f} | grf2_vert={f["forces"]["grf2"][2]:.3f}')
        count += 1
