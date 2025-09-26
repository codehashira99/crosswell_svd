const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { Matrix, SVD } = require('ml-matrix');

// Matrix operations class
class MatrixOps {
  static multiply(A, B) {
    const rows_A = A.length,
          cols_A = A[0].length,
          rows_B = B.length,
          cols_B = B[0].length;
    if (cols_A !== rows_B) throw new Error(`Matrix dimensions incompatible: ${rows_A}x${cols_A} * ${rows_B}x${cols_B}`);
    const result = Array(rows_A).fill().map(() => Array(cols_B).fill(0));
    for (let i = 0; i < rows_A; i++)
      for (let j = 0; j < cols_B; j++)
        for (let k = 0; k < cols_A; k++)
          result[i][j] += A[i][k] * B[k][j];
    return result;
  }

  static transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  static diag(values) {
    const n = values.length;
    const result = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) result[i][i] = values[i];
    return result;
  }

  static getDiagonal(matrix) {
    const n = Math.min(matrix.length, matrix[0].length);
    const result = [];
    for (let i = 0; i < n; i++) result.push(matrix[i][i]);
    return result;
  }

  static reshape(array, rows, cols) {
    if (array.length !== rows * cols) throw new Error(`Array length ${array.length} does not match reshape dimensions ${rows}x${cols}`);
    const result = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) row.push(array[i * cols + j]);
      result.push(row);
    }
    return result;
  }

  static flatten(matrix) {
    return matrix.flat();
  }

  static getMinMax(matrix) {
    const flat = this.flatten(matrix);
    return { min: Math.min(...flat), max: Math.max(...flat) };
  }

  static pseudoInverse(U, S, V, k) {
    const U_k = U.map(row => row.slice(0, k));
    const S_k = S.slice(0, k);
    const V_k = V.map(row => row.slice(0, k));
    const tolerance = 1e-12;
    const S_inv_k = S_k.map(s => (s > tolerance ? 1.0 / s : 0));
    const S_inv_matrix = this.diag(S_inv_k);
    const V_k_S_inv = this.multiply(V_k, S_inv_matrix);
    const U_k_T = this.transpose(U_k);
    return this.multiply(V_k_S_inv, U_k_T);
  }
}

// Static robust SVD method
class RobustSVD {
  static svd(matrix) {
    const mat = new Matrix(matrix);
    const svd = new SVD(mat, { autoTranspose: true });
    return [
      svd.leftSingularVectors.to2DArray(),
      Array.from(svd.diagonal),
      svd.rightSingularVectors.to2DArray()
    ];
  }
}

// Load real data from crosswell.json
function loadRealCrosswellData() {
  if (!fs.existsSync('data.json')) throw new Error('crosswell.json not found. Please run the conversion script!');
  const jsonData = fs.readFileSync('data.json', 'utf8');
  const data = JSON.parse(jsonData);
  return { G: data.G, dn: data.dn };
}

// Viridis color mapping
function viridisColormap(value) {
  const t = Math.max(0, Math.min(1, value));
  if (t < 0.25) {
    const s = t / 0.25;
    const r = 68 + s * (59 - 68);
    const g = 1 + s * (82 - 1);
    const b = 84 + s * (139 - 84);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    const r = 59 + s * (33 - 59);
    const g = 82 + s * (144 - 82);
    const b = 139 + s * (140 - 139);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    const r = 33 + s * (94 - 33);
    const g = 144 + s * (201 - 144);
    const b = 140 + s * (98 - 140);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  } else {
    const s = (t - 0.75) / 0.25;
    const r = 94 + s * (253 - 94);
    const g = 201 + s * (231 - 201);
    const b = 98 + s * (37 - 98);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }
}

// Create heatmap canvas
function createHeatmapCanvas(matrix, title, width = 400, height = 400) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  const rows = matrix.length;
  const cols = matrix[0].length;
  const { min, max } = MatrixOps.getMinMax(matrix);
  if (max === min) {
    ctx.fillStyle = 'gray';
    ctx.fillRect(50, 50, width - 100, height - 100);
  } else {
    const range = max - min;
    const plotWidth = width - 100;
    const plotHeight = height - 100;
    const cellWidth = plotWidth / cols;
    const cellHeight = plotHeight / rows;
    const offsetX = 50;
    const offsetY = 50;
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) {
        const normalizedValue = (matrix[i][j] - min) / range;
        ctx.fillStyle = viridisColormap(normalizedValue);
        ctx.fillRect(offsetX + j * cellWidth, offsetY + i * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
      }
  }
  ctx.fillStyle = 'black';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 25);
  const colorbarWidth = 20;
  const colorbarHeight = height - 120;
  const colorbarX = width - 35;
  const colorbarY = 60;
  if (max !== min) {
    for (let i = 0; i < colorbarHeight; i++) {
      const t = 1 - i / colorbarHeight;
      ctx.fillStyle = viridisColormap(t);
      ctx.fillRect(colorbarX, colorbarY + i, colorbarWidth, 1);
    }
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'black';
    ctx.fillText(max.toFixed(2), colorbarX + 22, colorbarY + 5);
    ctx.fillText(min.toFixed(2), colorbarX + 22, colorbarY + colorbarHeight);
  }
  return canvas;
}

// Main function to generate heatmaps
function generateHeatmaps(ks = [5, 50, 100, 150, 200, 250]) {
  const { G, dn } = loadRealCrosswellData();
  console.log("Loaded G min/max:", MatrixOps.getMinMax(G));
  console.log("Loaded dn min/max:", Math.min(...dn), Math.max(...dn));

  const total_cells = G[0].length;
  const grid_size = Math.sqrt(total_cells);
  if (grid_size !== Math.floor(grid_size)) throw new Error(`Invalid grid size: ${total_cells} is not a perfect square`);
  const [U, S, V] = RobustSVD.svd(G);
  const heatmaps = [];
  for (const k of ks) {
    const G_k_pinv = MatrixOps.pseudoInverse(U, S, V, k);
    const m_svd_flat = Array(G_k_pinv.length).fill(0);
    for (let i = 0; i < G_k_pinv.length; i++)
      for (let j = 0; j < G_k_pinv[0].length; j++)
        m_svd_flat[i] += G_k_pinv[i][j] * dn[j];
    const M_svd = MatrixOps.reshape(m_svd_flat, grid_size, grid_size);
    const R = MatrixOps.multiply(G_k_pinv, G);
    const model_res_diag = MatrixOps.getDiagonal(R);
    const model_res_diag_matrix = MatrixOps.reshape(model_res_diag, grid_size, grid_size);
    const combinedWidth = 1200;
    const combinedHeight = 400;
    const combinedCanvas = createCanvas(combinedWidth, combinedHeight);
    const combinedCtx = combinedCanvas.getContext('2d');
    combinedCtx.fillStyle = 'white';
    combinedCtx.fillRect(0, 0, combinedWidth, combinedHeight);
    const heatmap1 = createHeatmapCanvas(M_svd, `TSVD inversion rank=${k}`);
    const heatmap2 = createHeatmapCanvas(R, `Resolution Matrix rank=${k}`);
    const heatmap3 = createHeatmapCanvas(model_res_diag_matrix, `Model Res. diag rank=${k}`);
    combinedCtx.drawImage(heatmap1, 0, 0);
    combinedCtx.drawImage(heatmap2, 400, 0);
    combinedCtx.drawImage(heatmap3, 800, 0);
    const outputPath = path.join('public', `heatmaps_resmodel_rank_${k}.png`);
    const buffer = combinedCanvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    heatmaps.push({ k, matrix: M_svd.map(row => [...row]) });
  }
  const dataJson = { heatmaps };
  fs.writeFileSync('data.json', JSON.stringify(dataJson, null, 2));
  return heatmaps;
}
Summary:
if (require.main === module) {
  const ks = process.argv.slice(2).map(n => parseInt(n)).filter(n => !isNaN(n));
  const defaultKs = ks.length > 0 ? ks : [5, 50, 100];
  try {
    const results = generateHeatmaps(defaultKs);
    console.log(`Generated ${results.length} heatmaps`);
  } catch (error) {
    console.error('Error generating heatmaps:', error);
    process.exit(1);
  }
}

module.exports = { generateHeatmaps, MatrixOps, RobustSVD, loadRealCrosswellData };
