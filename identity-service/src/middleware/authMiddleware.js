// src/middleware/authMiddleware.js (FINAL DEBUGGING CHECK)

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    console.log('\n--- AUTH DEBUG START ---');
    console.log('Secret Used:', JWT_SECRET);
    console.log('Token Received (First 10 chars):', token ? token.substring(0, 10) : 'None');
    
    if (!token) {
        console.log('Token Check Failed: No token found.');
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }

    try {
        // This is the line that will fail if the secret or token is wrong
        const decoded = jwt.verify(token, JWT_SECRET); 
        
        // SUCCESS PATH (This code should run)
        const userId = decoded.userId; 

        console.log('✅ SUCCESS! Decoded UserId:', userId);
        console.log('--- AUTH DEBUG END ---\n');

        req.user = { id: userId };
        return next();

    } catch (error) {
        // FAILURE PATH (This code runs if signature or expiry is wrong)
        console.error('❌ FAILURE! JWT Verification Error:', error.name, 'Message:', error.message);
        console.log('--- AUTH DEBUG END ---\n');
        return res.status(401).json({ message: `Access Denied: Invalid token. Error: ${error.name}` });
    }
};

module.exports = authMiddleware;