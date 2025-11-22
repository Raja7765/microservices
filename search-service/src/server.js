// search-service/src/server.js (CORRECTED)

require('dotenv').config();
const express = require('express');
const searchRoutes = require('./routes/search-routes'); // Import the router

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Main Search Routes
// FIX: Mount the searchRoutes at the root path '/' to match the direct test URL (http://localhost:3004/?q=...)
// The searchRoutes file defines the GET handler for '/'.
app.use('/', searchRoutes); 

// Global Health Check
// Note: This health check is still accessible at http://localhost:3004/health
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Search Service' });
});

app.listen(PORT, () => {
    console.log(`🚀 Search Service running on http://localhost:${PORT}`);
});