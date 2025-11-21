// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is loading the secret

const authMiddleware = (req, res, next) => {
    // 1. Check for the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // If the token is missing or malformed, it should send 401 and STOP.
        return res.status(401).json({ 
            message: 'Access Denied: No token provided or token format is invalid.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // 2. The crucial fix: use decoded.userId
        if (!decoded.userId) {
             return res.status(401).json({ message: 'Token valid but userId missing from payload.' });
        }
        
        // 3. Attach the ID to req.user.id for the controller
        req.user = { 
            id: decoded.userId, 
        }; 
        
        next(); // Proceed to controller

    } catch (error) {
        // 4. If jwt.verify fails (bad secret, expired token), it sends 401 and STOPS.
        return res.status(401).json({ 
            message: 'Access Denied: Invalid or expired token.' 
        });
    }
};

module.exports = authMiddleware;