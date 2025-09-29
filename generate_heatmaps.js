// generate_heatmaps.js
const fs = require('fs');
const numeric = require('numeric');
const { createCanvas } = require('canvas');

function loadData(filepath) {
    const raw = fs.readFileSync(filepath);
    const data = JSON.parse(raw);
    return { G: data.G, dn: data.dn };
}

function generateHeatmapImage(matrix, title, outputPath, colorScheme = 'viridis') {
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    // Canvas dimensions
    const cellSize = 20;
    const margin = 80;
    const colorbarWidth = 40;
    const colorbarMargin = 20;
    
    const width = cols * cellSize + margin * 2 + colorbarWidth + colorbarMargin;
    const height = rows * cellSize + margin * 2;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Find min/max for color scaling
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (matrix[i][j] < min) min = matrix[i][j];
            if (matrix[i][j] > max) max = matrix[i][j];
        }
    }
    
    // Draw heatmap cells
    const startX = margin;
    const startY = margin;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = matrix[i][j];
            const normalized = (value - min) / (max - min);
            ctx.fillStyle = getColor(normalized, colorScheme);
            ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, cols * cellSize, rows * cellSize);
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 30);
    
    // Draw axis labels
    ctx.font = '14px Arial';
    ctx.fillText('Index', width / 2, height - 20);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Index', 0, 0);
    ctx.restore();
    
    // Draw colorbar
    const colorbarX = startX + cols * cellSize + colorbarMargin;
    const colorbarY = startY;
    const colorbarH = rows * cellSize;
    
    const gradient = ctx.createLinearGradient(0, colorbarY, 0, colorbarY + colorbarH);
    if (colorScheme === 'viridis') {
        gradient.addColorStop(0, '#440154');
        gradient.addColorStop(0.25, '#31688e');
        gradient.addColorStop(0.5, '#35b779');
        gradient.addColorStop(0.75, '#fde724');
        gradient.addColorStop(1, '#fde724');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(colorbarX, colorbarY, colorbarWidth, colorbarH);
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorbarX, colorbarY, colorbarWidth, colorbarH);
    
    // Colorbar labels
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(max.toExponential(2), colorbarX + colorbarWidth + 5, colorbarY + 10);
    ctx.fillText(min.toExponential(2), colorbarX + colorbarWidth + 5, colorbarY + colorbarH);
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Saved ${outputPath}`);
}

function getColor(normalized, scheme = 'viridis') {
    // Clamp normalized value between 0 and 1
    normalized = Math.max(0, Math.min(1, normalized));

    // Viridis colormap approximation (matches matplotlib viridis)
    if (scheme === 'viridis') {
        const viridis = [
            [68, 1, 84],      // purple (low values)
            [59, 82, 139],    // dark blue
            [33, 145, 140],   // teal/cyan
            [94, 201, 98],    // green
            [253, 231, 37]    // yellow (high values)
        ];

        if (normalized === 0) {
            const color = viridis[0];
            return `rgb(${color[0]},${color[1]},${color[2]})`;
        }
        if (normalized === 1) {
            const color = viridis[viridis.length - 1];
            return `rgb(${color[0]},${color[1]},${color[2]})`;
        }

        const scaledIdx = normalized * (viridis.length - 1);
        const idx1 = Math.floor(scaledIdx);
        const idx2 = Math.min(idx1 + 1, viridis.length - 1);
        const t = scaledIdx - idx1;

        const color1 = viridis[idx1];
        const color2 = viridis[idx2];

        const r = Math.round(color1[0] * (1 - t) + color2[0] * t);
        const g = Math.round(color1[1] * (1 - t) + color2[1] * t);
        const b = Math.round(color1[2] * (1 - t) + color2[2] * t);

        return `rgb(${r},${g},${b})`;
    }
    return `rgb(${normalized * 255}, ${normalized * 255}, ${normalized * 255})`;
}

function generateCombinedHeatmap(k, Msvd, R, modelResDiag, outputPath) {
    const N = Msvd.length;
    const cellSize = 15;
    const margin = 100;
    const spacing = 80;
    const colorbarWidth = 30;
    const colorbarMargin = 15;
    
    const singleWidth = N * cellSize;
    const singleHeight = N * cellSize;
    
    // For Resolution Matrix (R is N^2 x N^2)
    const R_size = R.length;
    const R_cellSize = Math.max(2, Math.floor(400 / R_size));
    const R_width = R_size * R_cellSize;
    const R_height = R_size * R_cellSize;
    
    const totalWidth = singleWidth + spacing + R_width + spacing + singleWidth + margin * 2 + (colorbarWidth + colorbarMargin) * 3;
    const totalHeight = Math.max(singleHeight, R_height) + margin * 2;
    
    const canvas = createCanvas(totalWidth, totalHeight);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    let currentX = margin;
    
    // 1. TSVD Inversion
    drawHeatmapOnCanvas(ctx, Msvd, currentX, margin, cellSize, `TSVD inversion rank=${k}`, 'viridis');
    currentX += singleWidth + colorbarWidth + colorbarMargin + spacing;
    
    // 2. Resolution Matrix
    drawHeatmapOnCanvas(ctx, R, currentX, margin, R_cellSize, `Resolution Matrix rank=${k}`, 'viridis');
    currentX += R_width + colorbarWidth + colorbarMargin + spacing;
    
    // 3. Model Resolution Diagonal
    drawHeatmapOnCanvas(ctx, modelResDiag, currentX, margin, cellSize, `Model Res. diag rank=${k}`, 'viridis');
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Saved combined heatmap: ${outputPath}`);
}
function normalizeMatrix(matrix) {
    const flat = matrix.flat();
    const validValues = flat.filter(x => Number.isFinite(x));

    if (validValues.length === 0) {
        console.warn('Normalizing: no valid values found. Using zeros.');
        return matrix.map(row => row.map(_ => 0));
    }

    let min = Math.min(...validValues);
    let max = Math.max(...validValues);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        console.warn('Normalizing: invalid min/max for heatmap. Using default range.');
        min = 0;
        max = 1;
        return matrix.map(row => row.map(_ => 0));
    }

    if (min === max) {
        // If all values are the same, return zeros
        return matrix.map(row => row.map(_ => 0));
    }

    // Don't normalize - return original matrix for accurate plotting
    return matrix;
}

function drawHeatmapOnCanvas(ctx, matrix, startX, startY, cellSize, title, colorScheme) {
    // Don't call normalizeMatrix here - keep original values for accurate scaling
    const rows = matrix.length;
    const cols = matrix[0].length;
    const colorbarWidth = 30;
    const colorbarMargin = 15;

    // Find min/max from raw matrix values
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const val = matrix[i][j];
            if (isFinite(val)) {
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }
    }

    // Handle edge cases
    if (!isFinite(min) || !isFinite(max)) {
        console.error('Invalid min/max values in matrix for', title);
        min = 0;
        max = 1;
    }

    if (min === max) {
        max = min + 1e-10; // Avoid division by zero with small epsilon
    }

    console.log(`${title}: min=${min.toExponential(3)}, max=${max.toExponential(3)}`);
    
    // Draw cells
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = matrix[i][j];
            const normalized = isFinite(value) ? (value - min) / (max - min) : 0;
            ctx.fillStyle = getColor(normalized, colorScheme);
            ctx.fillRect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize);
        }
    }
    
    // Border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, startY, cols * cellSize, rows * cellSize);
    
    // Title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, startX + cols * cellSize / 2, startY - 10);
    
    // Axis labels
    ctx.font = '12px Arial';
    ctx.fillText('Index', startX + cols * cellSize / 2, startY + rows * cellSize + 25);
    
    ctx.save();
    ctx.translate(startX - 30, startY + rows * cellSize / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Index', 0, 0);
    ctx.restore();
    
    // Colorbar - match matplotlib orientation (max at top, min at bottom)
    const colorbarX = startX + cols * cellSize + colorbarMargin;
    const gradient = ctx.createLinearGradient(0, startY, 0, startY + rows * cellSize);
    // Viridis colormap: purple (low) at top to yellow (high) at bottom - reversed for matplotlib orientation
    gradient.addColorStop(0, '#fde724');  // yellow (max) at top
    gradient.addColorStop(0.25, '#35b779'); // green
    gradient.addColorStop(0.5, '#31688e');  // blue
    gradient.addColorStop(0.75, '#31688e'); // dark blue
    gradient.addColorStop(1, '#440154');    // purple (min) at bottom

    ctx.fillStyle = gradient;
    ctx.fillRect(colorbarX, startY, colorbarWidth, rows * cellSize);
    ctx.strokeRect(colorbarX, startY, colorbarWidth, rows * cellSize);

    // Colorbar labels - max at top, min at bottom
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(max.toExponential(2), colorbarX + colorbarWidth + 3, startY + 10);
    ctx.fillText(min.toExponential(2), colorbarX + colorbarWidth + 3, startY + rows * cellSize - 5);
}

function computeHeatmaps(ks, {G, dn}) {
    console.log('Computing heatmaps for K values:', ks);
    console.log('G dimensions:', G.length, 'x', G[0]?.length);
    console.log('dn length:', dn.length);

    // Compute SVD using numeric.js (similar to numpy)
    const svd = numeric.svd(G);
    const U = svd.U;
    const S = svd.S;  // Singular values as array
    const V = svd.V;  // Already V, not V transpose

    console.log('SVD computed. Singular values:', S.length);
    console.log('U dimensions:', U.length, 'x', U[0]?.length);
    console.log('V dimensions:', V.length, 'x', V[0]?.length);

    let outResults = [];

    ks.forEach(k => {
        console.log(`\nProcessing K=${k}`);

        // Extract first k columns of U and V
        const Uk = U.map(row => row.slice(0, k));
        const Vk = V.map(row => row.slice(0, k));
        const Sk = S.slice(0, k);

        // Create diagonal matrix of inverse singular values
        const SinvDiag = numeric.diag(Sk.map(val => 1.0 / val));

        // Compute pseudoinverse: G_k_pinv = V_k * S_inv_k * U_k^T
        // Following Python: G_k_pinv = V_k @ S_inv_k @ U_k.T
        const UkT = numeric.transpose(Uk);
        const temp = numeric.dot(SinvDiag, UkT);
        const Gkpinv = numeric.dot(Vk, temp);

        // Compute model: m_svd = G_k_pinv @ dn
        const msvd = numeric.dot(Gkpinv, dn);

        console.log('msvd length:', msvd.length);

        // Reshape msvd to 16x16 matrix (same as Python: M_svd = m_svd.reshape((16, 16)))
        const N = 16;  // Fixed as in Python
        console.log('Reshaping to N x N grid, N=', N);

        let Msvd = [];
        for (let i = 0; i < N; i++) {
            Msvd.push(msvd.slice(i*N, (i+1)*N));
        }

        // Compute resolution matrix: R = G_k_pinv @ G
        const R = numeric.dot(Gkpinv, G);
        console.log('Resolution matrix R dimensions:', R.length, 'x', R[0]?.length);

        // Get diagonal of resolution matrix
        const modelResDiag = [];
        for (let i = 0; i < Math.min(R.length, R[0]?.length || 0); i++) {
            modelResDiag.push(R[i][i]);
        }
        console.log('Model resolution diagonal length:', modelResDiag.length);

        // Reshape diagonal to 16x16 matrix (same as Python: model_res_diag.reshape((16, 16)))
        let modelResDiagMatrix = [];
        for (let i = 0; i < N; i++) {
            modelResDiagMatrix.push(modelResDiag.slice(i*N, (i+1)*N));
        }

        // Generate combined image
        const outputPath = `public/heatmaps_resmodel_rank_${k}.png`;
        console.log('Generating combined heatmap:', outputPath);
        
        try {
            generateCombinedHeatmap(k, Msvd, R, modelResDiagMatrix, outputPath);
            console.log(`✓ Successfully generated heatmap for K=${k}`);
        } catch (err) {
            console.error(`✗ Failed to generate heatmap for K=${k}:`, err.message);
            throw err;
        }

        outResults.push({
            k,
            inversion: Msvd,
            resolution: R,
            modelResDiag: modelResDiagMatrix
        });
    });

    console.log('\nAll heatmaps generated successfully!');
    return outResults;
}

module.exports = { loadData, computeHeatmaps };