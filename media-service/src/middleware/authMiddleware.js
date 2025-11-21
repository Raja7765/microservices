// media-service/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: 'Access Denied: No token provided or token format is invalid.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Use the integer userId matching the Identity Service
        if (!decoded.userId) {
             return res.status(401).json({ message: 'Token valid but userId missing from payload.' });
        }
        
        req.user = { 
            id: decoded.userId, 
        }; 
        
        next();

    } catch (error) {
        return res.status(401).json({ 
            message: 'Access Denied: Invalid or expired token.' 
        });
    }
};

module.exports = authMiddleware;