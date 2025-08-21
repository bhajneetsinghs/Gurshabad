// Simple Express server for Gurshabad with API proxy
// Run this with: node server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all origins
app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

// API proxy to BaniDB
app.use('/api/banidb', async (req, res) => {
  try {
    const apiUrl = `https://api.banidb.com/v2${req.url}`;
    console.log('Proxying to:', apiUrl);
    
    const response = await axios({
      method: req.method,
      url: apiUrl,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Gurshabad/1.0'
      },
      params: req.query,
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('API Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'API request failed' });
    }
  }
});

// Fallback route - serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║         Gurshabad Server Running           ║
╠════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                ║
║  API: http://localhost:${PORT}/api/banidb     ║
╠════════════════════════════════════════════╣
║  Pages:                                    ║
║  • Home: http://localhost:${PORT}             ║
║  • Ang Viewer: http://localhost:${PORT}/ang.html ║
║  • Reader: http://localhost:${PORT}/reader.html  ║
╚════════════════════════════════════════════╝
  `);
});
