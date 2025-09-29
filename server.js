const express = require('express');
const path = require('path');
const { loadData, computeHeatmaps } = require('./generate_heatmaps');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint to generate heatmap PNG based on Ks
app.post('/generate-heatmap', (req, res) => {
  let ks = req.body.ks;

  // Validate ks: must be array of integers
  if (!Array.isArray(ks)) {
    return res.status(400).json({ error: 'ks must be an array of integers' });
  }
  
  ks = ks.filter(k => Number.isInteger(k) && k > 0 && k <= 256).slice(0, 8);
  
  if (ks.length < 1) {
    return res.status(400).json({ error: 'Provide at least 1 valid integer K value (1-256), max 8' });
  }

  try {
    // Load data from JSON file (you'll need to convert crosswell.mat to JSON first)
    const data = loadData('crosswell_data.json');
    
    // Compute heatmaps and generate images
    computeHeatmaps(ks, data);

    // Return the generated image URLs
    const matrixPngs = ks.map(k => `/heatmaps_resmodel_rank_${k}.png?t=` + Date.now());
    
    res.json({
      matrices: matrixPngs,
      message: `Generated ${ks.length} heatmap(s) successfully`
    });

  } catch (error) {
    console.error('Error generating heatmaps:', error);
    return res.status(500).json({ 
      error: 'Heatmap generation failed', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});