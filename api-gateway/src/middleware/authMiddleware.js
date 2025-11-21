// api-gateway/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Allow registration, login, and public GET requests to bypass authentication
    if (
        (req.path === '/api/auth/register' && req.method === 'POST') ||
        (req.path === '/api/auth/login' && req.method === 'POST') ||
        (req.path.startsWith('/api/posts') && req.method === 'GET' && !req.headers.authorization)
    ) {
        return next();
    }
    
    // Check for token on private or authenticated routes
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: 'Access Denied: Authentication token required.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // CRUCIAL: Add the userId to the request headers 
        // This is how microservices identify the user without re-validating the token
        req.headers['x-user-id'] = decoded.userId.toString(); 

        next(); // Token is valid, proceed to proxy

    } catch (error) {
        return res.status(401).json({ 
            message: 'Access Denied: Invalid or expired token.' 
        });
    }
};

module.exports = authMiddleware;