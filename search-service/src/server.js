// search-service/src/server.js
require('dotenv').config();
const express = require('express');
const searchRoutes = require('./routes/search-routes'); // Import the router

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Main Search Routes
app.use('/search', searchRoutes); 

// Global Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Search Service' });
});

app.listen(PORT, () => {
    console.log(`🚀 Search Service running on http://localhost:${PORT}`);
});