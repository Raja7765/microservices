// media-service/src/utils/cloudinary.js

const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Ensure dotenv runs here

// Configuration using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, 
});

module.exports = cloudinary; // <--- MUST EXPORT THE CONFIGURED OBJECT