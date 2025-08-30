import sys
import scipy.io
import numpy as np
import json
import matplotlib.pyplot as plt
import math
from matplotlib.colors import LinearSegmentedColormap

# Load .mat data
mat = scipy.io.loadmat('crosswell.mat')
G = mat['G']
dn = mat['dn'].flatten()

# Read K values from command line, else defaults
if len(sys.argv) > 1:
    ks = [int(k) for k in sys.argv[1:]]
else:
    ks = [5, 50, 100, 150, 200, 250]

heatmaps = []

# Compute full SVD
U, S, Vh = np.linalg.svd(G, full_matrices=False)
V = Vh.T

for k in ks:
    U_k = U[:, :k]
    S_k = S[:k]
    V_k = V[:, :k]
    S_inv_k = np.diag(1. / S_k)
    G_k_pinv = V_k @ S_inv_k @ U_k.T

    m_svd = G_k_pinv @ dn
    M_svd = m_svd.reshape((16, 16))
    heatmaps.append({"k": k, "matrix": M_svd.tolist()})

# Save data.json (optional)
with open("data.json", "w") as f:
    json.dump({"heatmaps": heatmaps}, f, indent=2)

# ---- UPDATED LAYOUT CODE -----
num_maps = len(heatmaps)
max_cols = 4
ncols = min(max_cols, num_maps)
nrows = int(np.ceil(num_maps / ncols))

fig_w = 4 * ncols    # 4 inches per column
fig_h = 4 * nrows    # 4 inches per row

fig, axs = plt.subplots(nrows, ncols, figsize=(fig_w, fig_h))

# When axs is not a 2D array, flatten to 1D for easy indexing
if nrows == 1 and ncols == 1:
    axs = np.array([axs])
else:
    axs = axs.flatten()

cmap = LinearSegmentedColormap.from_list("yellow_green", ["yellow", "green"])

for i, hmap in enumerate(heatmaps):
    matrix = np.array(hmap["matrix"])
    vmin = matrix.min()
    vmax = matrix.max()
    ax = axs[i]
    im = ax.imshow(matrix, aspect="auto", cmap=cmap, vmin=vmin, vmax=vmax)
    ax.set_title(f"Heatmap for K = {hmap['k']}", fontsize=12)
    ax.axis('off')

# Hide unused subplots if < ncols*nrows
for j in range(num_maps, ncols * nrows):
    axs[j].axis('off')

plt.tight_layout()
plt.savefig("all_heatmaps.png", bbox_inches='tight', dpi=300)
plt.close()

print(f"Generated all_heatmaps.png with Ks: {ks}")
