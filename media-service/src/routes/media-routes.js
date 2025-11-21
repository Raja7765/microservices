// media-service/src/routes/media-routes.js

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media-controller');
const authMiddleware = require('../middleware/authMiddleware'); 
const uploadMiddleware = require('../middleware/uploadMiddleware'); 

// Route for uploading a file:
// 1. Authenticate the user (authMiddleware)
// 2. Process the file from form-data (uploadMiddleware)
// 3. Upload the file to Cloudinary (mediaController.uploadFile)
router.post('/upload', authMiddleware, uploadMiddleware, mediaController.uploadFile);

module.exports = router;