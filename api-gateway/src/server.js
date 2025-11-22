// api-gateway/server.js 

require('dotenv').config(); 
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/authMiddleware'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Get service URLs from .env
const IDENTITY_API_URL = process.env.IDENTITY_API_URL;
const POST_API_URL = process.env.POST_API_URL;
const MEDIA_API_URL = process.env.MEDIA_API_URL;
const SEARCH_API_URL = process.env.SEARCH_API_URL; // <-- NEW URL

// Middleware Setup
app.use(express.json());
app.use(authMiddleware);

// =======================================================
// PROXY HELPER FUNCTION
// =======================================================

// Note: The pathRewrite logic below strips the service-specific prefix (e.g., /api/auth) 
// and leaves the rest (e.g., /login).
const setupProxy = (targetUrl, pathPrefix, serviceName) => {
    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        // pathRewrite strips the prefix that matches the service URL in the Gateway
        pathRewrite: { [`^${pathPrefix}`]: '' }, 
        
        timeout: 10000, 
        proxyTimeout: 10000, 
        
        onProxyReq: (proxyReq, req, res) => {
            if (req.headers['x-user-id']) {
                proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
            }
            
            console.log(`[Proxy] Forwarding ${serviceName}: ${proxyReq.method} ${proxyReq.path}`);
            
            if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
                 if (!proxyReq.getHeader('content-type')) {
                    proxyReq.setHeader('Content-Type', 'application/json');
                 }
            }
        },
        onError: (err, req, res) => {
            console.error(`[Proxy Error] Service: ${serviceName} Target: ${targetUrl}`, err);
            res.status(503).json({ 
                message: `Cannot connect to downstream service: ${serviceName}. Target: ${targetUrl}. Check your service status.`,
                error: err.message
            });
        }
    });
};

// =======================================================
// PROXY ROUTE SETUP
// =======================================================

// 1. IDENTITY SERVICE Proxy: /api/auth -> http://localhost:3001
app.use('/api/auth', setupProxy(IDENTITY_API_URL, '/api/auth', 'AUTH'));

// 2. POST SERVICE Proxy: /api/posts -> http://localhost:3002
app.use('/api/posts', setupProxy(POST_API_URL, '/api/posts', 'POSTS'));

// 3. MEDIA SERVICE Proxy: /api/media -> http://localhost:3003
app.use('/api/media', setupProxy(MEDIA_API_URL, '/api/media', 'MEDIA'));

// 4. SEARCH SERVICE Proxy: /api/search -> http://localhost:3004  <-- NEW ROUTE
// The Search Service expects the route to start at the root '/', which the setupProxy achieves.
app.use('/api/search', setupProxy(SEARCH_API_URL, '/api/search', 'SEARCH'));


// Global Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'API Gateway' });
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});