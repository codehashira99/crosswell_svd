// generate_heatmaps.js
const fs = require('fs');
const numeric = require('numeric');
const { createCanvas } = require('canvas');
const { SVD } = require('svd-js');

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
    
    // Viridis colormap approximation
    if (scheme === 'viridis') {
        const viridis = [
            [68, 1, 84],
            [59, 82, 139],
            [33, 145, 140],
            [94, 201, 98],
            [253, 231, 37]
        ];
        
        const scaledIdx = normalized * (viridis.length - 1);
        const idx1 = Math.floor(scaledIdx);
        const idx2 = Math.min(idx1 + 1, viridis.length - 1);
        const t = scaledIdx - idx1;
        
        const color1 = viridis[idx1];
        const color2 = viridis[idx2];
        
        if (!color1 || !color2) {
            console.error('Color lookup failed:', { normalized, scaledIdx, idx1, idx2 });
            return 'rgb(128, 128, 128)'; // Gray fallback
        }
        
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
    let min = Math.min(...validValues);
    let max = Math.max(...validValues);

    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
        console.warn('Normalizing: invalid min/max for heatmap. Using default range.');
        min = 0;
        max = 1;
        // Optionally: set entire matrix to zeros or a default value
        return matrix.map(row => row.map(_ => 0));
    }

    // normalize to [0,1] range
    return matrix.map(row => row.map(x => (x - min) / (max - min)));
}

function drawHeatmapOnCanvas(ctx, matrix, startX, startY, cellSize, title, colorScheme) {
  matrix = normalizeMatrix(matrix);

    const rows = matrix.length;
    const cols = matrix[0].length;
    const colorbarWidth = 30;
    const colorbarMargin = 15;
    
    // Find min/max
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
        console.error('Invalid min/max values in matrix');
        min = 0;
        max = 1;
    }
    
    if (min === max) {
        max = min + 1; // Avoid division by zero
    }
    
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
    
    // Colorbar
    const colorbarX = startX + cols * cellSize + colorbarMargin;
    const gradient = ctx.createLinearGradient(0, startY, 0, startY + rows * cellSize);
    gradient.addColorStop(0, '#fde724');
    gradient.addColorStop(0.25, '#35b779');
    gradient.addColorStop(0.5, '#31688e');
    gradient.addColorStop(1, '#440154');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(colorbarX, startY, colorbarWidth, rows * cellSize);
    ctx.strokeRect(colorbarX, startY, colorbarWidth, rows * cellSize);
    
    // Colorbar labels
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(max.toFixed(4), colorbarX + colorbarWidth + 3, startY + 10);
    ctx.fillText(min.toFixed(4), colorbarX + colorbarWidth + 3, startY + rows * cellSize);
}

function computeHeatmaps(ks, {G, dn}) {
    console.log('Computing heatmaps for K values:', ks);
    console.log('G dimensions:', G.length, 'x', G[0]?.length);
    console.log('dn length:', dn.length);
    
    const {u, v, q: s} = SVD(G);
    console.log('SVD computed. Singular values:', s.length);
    
    let outResults = [];

    ks.forEach(k => {
        console.log(`\nProcessing K=${k}`);
        
        const Uk = u.map(row => row.slice(0, k));
        const Vk = v.map(row => row.slice(0, k));
        const Sinvk = numeric.diag(Array.from(s).slice(0, k).map(val => 1 / val));

        const Gkpinv = numeric.dot(numeric.dot(Vk, Sinvk), numeric.transpose(Uk));
        const msvd = numeric.dot(Gkpinv, dn);
        
        console.log('msvd length:', msvd.length);
        
        let N = Math.round(Math.sqrt(msvd.length));
        console.log('Reshaping to N x N grid, N=', N);
        
        let Msvd = [];
        for (let i = 0; i < N; i++) Msvd.push(msvd.slice(i*N, (i+1)*N));

        const R = numeric.dot(Gkpinv, G);
        console.log('Resolution matrix R dimensions:', R.length, 'x', R[0]?.length);
        
        const modelResDiag = numeric.diag(R);
        console.log('Model resolution diagonal length:', modelResDiag.length);
        
        let modelResDiagMatrix = [];
        for (let i = 0; i < N; i++) modelResDiagMatrix.push(modelResDiag.slice(i*N, (i+1)*N));

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