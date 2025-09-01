const express = require('express');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve template.html explicitly on root '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'template.html'));
});

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint to generate heatmap PNG based on Ks
app.post('/generate-heatmap', (req, res) => {
  let ks = req.body.ks;

  // Validate ks: must be array of integers, length 2-6
  if (!Array.isArray(ks)) {
    return res.status(400).json({ error: 'ks must be an array of integers' });
  }
  ks = ks.filter(k => Number.isInteger(k)).slice(0, 8);
  if (ks.length < 1) {
    return res.status(400).json({ error: 'Provide at least 1 integer K value, max 8' });
  }

  const pythonScript = path.join(__dirname, 'generate_heatmaps.py');
  const args = ks.map(String);

  execFile('python3', [pythonScript, ...args], (err, stdout, stderr) => {
    if (err) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ error: 'Heatmap generation failed' });
    }
    console.log(stdout);

    // Return URL for PNG corresponding to the first K value requested (ks[0])
  const k = ks[0];  // get the first requested K value
  res.json({ imageUrl: `/heatmaps_resmodel_rank_${k}.png?t=` + Date.now() });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
