// media-service/src/server.js

const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Import Routes
// CRITICAL FIX: Updated path. Assuming server.js is in /src, the path should be './routes/media-routes'.
const mediaRoutes = require('./routes/media-routes'); 

// Middleware setup (basic)
app.use(express.json());

// ROUTE INTEGRATION: Use the media routes under the /api/media base path
app.use('/api/media', mediaRoutes);

// Simple health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Media Service' });
});

app.listen(PORT, () => {
    console.log(`🚀 Media Service running on http://localhost:${PORT}`);
});