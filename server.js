const express = require('express');
const path = require('path');
const { generateHeatmaps } = require('./generate_heatmaps.js');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve template.html explicitly on root '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint to generate heatmap PNG based on Ks - NOW PURE JAVASCRIPT
app.post('/generate-heatmap', async (req, res) => {
   console.log('\n🚀 Heatmap generation request received');
  console.log('Request body:', req.body);
  let ks = req.body.ks;

  // Validate ks: must be array of integers, length 1-8
  if (!Array.isArray(ks)) {
    console.log('❌ Invalid ks format, using defaults');
    ks = [5, 50, 100]; // Default values
  } else {
    ks = ks.filter(k => Number.isInteger(k) && k > 0).slice(0, 8);
    if (ks.length < 1) {
      console.log('❌ No valid K values, using defaults');
      ks = [5, 50, 100];
    }
  }

  console.log('📊 Processing K values:', ks);

  try {
    console.log('⚙️ Starting JavaScript heatmap generation...');
    
    // Call pure JavaScript heatmap generation
    const heatmapData = generateHeatmaps(ks);
    
    console.log('✅ Heatmaps generated successfully!');
    console.log(`📁 Generated ${ks.length} heatmap files`);
    
    // Create response with proper file URLs
    const matrixPngs = ks.map(k => `/heatmaps_resmodel_rank_${k}.png?t=${Date.now()}`);
    
    console.log('📤 Sending response:', matrixPngs);
    
    // Send response that matches frontend expectations
    res.json({
      success: true,
      message: `Generated ${ks.length} heatmaps with pure JavaScript!`,
      matrices: matrixPngs,  // This is what the frontend expects
      heatmaps: matrixPngs,  // Alternative name the frontend might check
      imageUrls: matrixPngs, // Another alternative
      heatmapData: heatmapData,
      ks: ks
    });
    
  } catch (error) {
    console.error('💥 JavaScript heatmap generation error:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      error: 'Heatmap generation failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Health check endpoint for debugging
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '100% Pure JavaScript Server Running!',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check generated files
app.get('/debug/files', (req, res) => {
  const fs = require('fs');
  const publicDir = path.join(__dirname, 'public');
  
  try {
    const files = fs.readdirSync(publicDir);
    const heatmapFiles = files.filter(f => f.startsWith('heatmaps_resmodel_rank_'));
    
    const fileDetails = heatmapFiles.map(filename => {
      const filepath = path.join(publicDir, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        size: stats.size,
        modified: stats.mtime,
        url: `/${filename}`
      };
    });
    
    res.json({
      totalFiles: files.length,
      heatmapFiles: fileDetails,
      allFiles: files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test heatmap generation endpoint
app.get('/test/generate', async (req, res) => {
  try {
    console.log('🧪 Test generation triggered from browser');
    const result = generateHeatmaps([5, 10]);
    res.json({ 
      success: true, 
      message: 'Test generation completed',
      result: result 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎉 Server running at http://localhost:${PORT}`);
  console.log(`🚀 100% Pure JavaScript - NO PYTHON DEPENDENCIES! 🐍❌`);
  console.log(`📊 Heatmap generation ready`);
  console.log(`🔧 Debug endpoints: /health, /debug/files, /test/generate`);
});

module.exports = app;