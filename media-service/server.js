// media-service/src/server.js (Update)

const express = require('express');
require('dotenv').config();
// No need for 'fs' or UPLOAD_PATH since we use Cloudinary

const app = express();
const PORT = process.env.PORT || 3003;

// Import Routes
const mediaRoutes = require('../media-service/src/routes/media-routes'); 

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