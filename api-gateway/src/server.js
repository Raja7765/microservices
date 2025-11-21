// api-gateway/src/server.js

const express = require('express');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Get service URLs
const IDENTITY_API_URL = process.env.IDENTITY_API_URL;
const POST_API_URL = process.env.POST_API_URL;
const MEDIA_API_URL = process.env.MEDIA_API_URL;

// Middleware Setup
app.use(express.json());

// Apply global authentication middleware BEFORE routing
app.use(authMiddleware);

// =======================================================
// PROXY SETUP
// =======================================================

// 1. IDENTITY SERVICE Proxy
// Routes /api/auth traffic to the Identity Service (e.g., login, register)
app.use('/api/auth', createProxyMiddleware({ 
    target: IDENTITY_API_URL, 
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' }, // Remove /api/auth from path before forwarding
    onProxyReq: (proxyReq, req, res) => {
        // Log the request to the target
        console.log(`[Proxy] Forwarding AUTH request to: ${proxyReq.path}`);
    },
}));

// 2. POST SERVICE Proxy
// Routes /api/posts traffic to the Post Service
app.use('/api/posts', createProxyMiddleware({ 
    target: POST_API_URL, 
    changeOrigin: true,
    pathRewrite: { '^/api/posts': '' }, // Remove /api/posts from path
    onProxyReq: (proxyReq, req, res) => {
        // Forward the x-user-id header set by authMiddleware
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        console.log(`[Proxy] Forwarding POSTS request to: ${proxyReq.path}`);
    },
}));

// 3. MEDIA SERVICE Proxy
// Routes /api/media traffic to the Media Service (e.g., file upload)
app.use('/api/media', createProxyMiddleware({ 
    target: MEDIA_API_URL, 
    changeOrigin: true,
    pathRewrite: { '^/api/media': '' }, // Remove /api/media from path
    onProxyReq: (proxyReq, req, res) => {
        // Forward the x-user-id header
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        console.log(`[Proxy] Forwarding MEDIA request to: ${proxyReq.path}`);
    },
}));


// Global Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'API Gateway' });
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`All services are now accessible via port ${PORT}`);
});